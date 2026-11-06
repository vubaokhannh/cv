---
title: Idempotent payment webhooks with signature verification (PayOS)
date: 2026-07-05
summary: How StreamHub accepts PayOS (VietQR) payment webhooks safely: verifying the signature first, then processing each transaction exactly once.
tags: PayOS, Webhooks, NestJS, PostgreSQL, Payments
---

StreamHub sells subscriptions, and I integrated **PayOS (VietQR)** for payments. The checkout itself is the easy part. The part that deserves care is the **webhook**: the request the payment provider sends to my server to say "this payment succeeded". Get it wrong and you either grant access to people who did not pay, or process the same payment twice.

This post covers the two rules I built around: **verify the signature** and make handling **idempotent**.

## Why webhooks are special

A webhook is an HTTP endpoint on your server that **anyone on the internet can call**. Three facts shape the design:

1. **It is unauthenticated by default.** Nothing stops a stranger from posting a fake "payment succeeded" body to the URL.
2. **Delivery is at-least-once.** If your server is slow or returns an error, the provider will retry. The same event can legitimately arrive several times.
3. **Order is not guaranteed.** Events can arrive late or out of sequence.

So the endpoint has to answer two questions for every request: *is this really from the provider?* and *have I already handled it?*

## Rule 1: verify the signature before anything else

Payment providers sign webhook payloads with a secret shared between you and them. The server must recompute the signature from the body it received and compare it to the one in the request. If they differ, the request is rejected before touching business logic.

```ts
// Simplified
@Post("webhooks/payos")
async handle(@Body() body: PayosWebhookDto) {
  if (!this.payos.verifySignature(body)) {
    throw new UnauthorizedException("invalid signature");
  }
  await this.payments.handlePaid(body.data);
  return { ok: true };
}
```

A few details are easy to get wrong:

- Verify against the **exact data** the provider signed, using the documented algorithm, not a re-serialized version that might reorder fields.
- Use a **constant-time comparison** to avoid leaking information through timing.
- Keep the secret in **configuration**, never in source code.
- **Reject first, ask questions later.** An invalid signature should not even reach your database.

A valid signature proves the message is authentic. It does **not** prove it is new.

## Rule 2: make handling idempotent

An operation is **idempotent** if doing it several times has the same effect as doing it once. For a webhook that means: processing the same payment event twice must not extend a subscription twice or record two transactions.

The reliable way to get this is to let the **database enforce it**:

1. Identify the transaction with a stable id from the provider (for example the order code or transaction reference).
2. Store it with a **unique constraint**.
3. Process inside a **database transaction**: insert the transaction record and apply its effect together. If the insert violates the unique constraint, someone already handled it, so do nothing and still respond success.

```ts
// Simplified, with Prisma
async handlePaid(data: PayosPaid) {
  try {
    await this.prisma.$transaction(async (tx) => {
      // unique(providerRef): a second delivery fails here
      await tx.payment.create({
        data: { providerRef: data.orderCode, userId, amount: data.amount },
      });
      await tx.subscription.upsert(/* extend the user's plan */);
    });
  } catch (e) {
    if (isUniqueViolation(e)) return; // already processed: safe to ack
    throw e;
  }
}
```

### Why not just check first?

Code like "look up the payment; if it does not exist, create it" has a **race condition**: two deliveries arriving together can both see "not found" and both proceed. A unique constraint closes that gap because the database serializes the conflict for you. This is the core idea: **do not rely on application checks for correctness when the database can guarantee it**.

## Respond quickly and predictably

Providers retry on timeouts or non-2xx responses, so the response matters:

- **Return 2xx once the event is safely recorded**, even if it was a duplicate. Returning an error for a duplicate just invites more retries.
- **Return a non-2xx only for real failures** (bad signature, or a temporary error where a retry is genuinely useful).
- Keep the handler **fast**. If follow-up work is slow (emails, analytics), do it after acknowledging, for example through a queue, as I do for video processing.

## Confirm the state when it matters

Treat the webhook as a **notification**, not the only source of truth. For high-stakes actions it can be worth confirming the payment status with the provider's API before granting access. It adds a request but protects against forged or confusing payloads even if a signature check were ever misconfigured.

## What I log and what I never log

- **Log**: event ids, outcome (processed, duplicate, rejected), and timestamps. That makes disputes debuggable.
- **Never log**: secrets, full card or account data, or raw signatures.

## Testing the unhappy paths

The happy path takes five minutes to test. The value is in the rest:

- A request with a **tampered body** must be rejected.
- A request with a **missing or wrong signature** must be rejected.
- The **same valid event sent twice** (or concurrently) must create exactly one transaction and extend the plan once.
- An event for an **unknown order** must not crash the handler.

## Takeaways

- A webhook is a public endpoint: **verify the signature first**.
- Delivery is at-least-once, so **handling must be idempotent**.
- Let a **unique constraint plus a transaction** enforce exactly-once effects instead of check-then-insert.
- **Acknowledge duplicates** with a success response; reserve errors for real problems.
- Test tampering, duplicates and concurrency, not just the happy path.
