---
title: A concurrency-safe silent refresh queue for Axios
date: 2025-12-15
summary: What happens when several requests hit 401 at the same moment, and how Krello refreshes the token once and replays everything else.
tags: Axios, JWT, React, Authentication
---

Krello, the real-time task management app I built with React, TypeScript and NestJS, uses short-lived JWT **access tokens** with **refresh token rotation**. The server side of that design is fairly standard. The part that bites is on the client: when the access token expires, **several in-flight requests can receive a 401 at the same moment**.

Handling that well is the difference between a session that quietly renews itself and a user who is logged out for no visible reason.

## Why this is a real problem

A Kanban board is chatty. Opening a board can fire requests for the board, its lists, its cards, members and notifications almost simultaneously. If the access token expired a minute ago, every one of those requests comes back with 401.

The naive interceptor says: "on 401, call the refresh endpoint, then retry." With five parallel failures that means **five refresh calls**. With refresh token rotation this is not just wasteful, it is harmful:

1. The first refresh succeeds and **invalidates the old refresh token**, issuing a new one.
2. The other four refresh calls still carry the old token, which is now invalid, so they **fail**.
3. The client interprets a failed refresh as "session over" and logs the user out.

The user did nothing wrong, yet they are back on the login screen.

## The approach: one refresh, everyone waits

The fix is to make refreshing a **shared, single operation**:

- The **first** 401 starts one refresh.
- Every other request that fails while the refresh is in flight does not start its own. It **waits** for the same refresh to finish.
- When the refresh succeeds, all waiting requests are **replayed** with the new access token.
- When it fails, all waiting requests are **rejected** together and the session ends cleanly.

### The simplest implementation: share the promise

You do not need an explicit array of callbacks. A single promise stored in a variable is the queue: everyone who needs a token awaits the same promise.

```ts
let refreshing: Promise<string> | null = null;

api.interceptors.response.use(undefined, async (error) => {
  const original = error.config;
  const status = error.response?.status;

  // Not an auth problem, already retried, or it was the refresh call itself
  if (status !== 401 || original._retried || original.url?.includes("/auth/refresh")) {
    throw error;
  }
  original._retried = true;

  // The first failure creates the promise; the rest reuse it
  refreshing ??= refreshAccessToken().finally(() => {
    refreshing = null;
  });

  const token = await refreshing; // every pending request awaits the same promise
  original.headers.Authorization = `Bearer ${token}`;
  return api(original);
});
```

This is a sketch of the idea, not Krello's exact production code.

## Details that matter

### Mark retried requests
Without the `_retried` flag, a request that keeps returning 401 (for a reason that is not an expired token) would loop forever: refresh, retry, 401, refresh. Retry **once**, then surface the error.

### Never intercept the refresh call itself
If the refresh endpoint returns 401 (the refresh token is truly invalid), the interceptor must not try to refresh again. Treat it as the end of the session.

### Clear the shared promise in `finally`
The promise must be reset whether the refresh succeeded or failed. Otherwise a failed refresh would be cached and every later request would instantly fail with the old error.

### Decide what "failure" does
When the refresh fails, reject everything that was waiting, clear client state and send the user to sign in. Doing this in one place keeps the behavior consistent.

### Multiple tabs
Each browser tab has its own JavaScript memory, so each tab can start its own refresh. With rotation, two tabs refreshing at once can still collide. The common mitigation is to coordinate across tabs (for example with a shared lock) or to have the server tolerate a short grace window for a just-rotated token. This is a good reason to keep the client logic small and the server rules explicit.

## How it fits with the server

The client queue only works well if the server cooperates:

- **Per-device sessions.** Each device has its own refresh token, so a failed refresh ends only that device's session, not every session of the account.
- **Clear error responses.** The client needs to tell "access token expired" (refresh and retry) from "refresh token invalid" (sign in again).
- **Short access-token lifetime.** It limits the damage of a leaked token, which is the reason refresh tokens exist.

## How I would test it

Concurrency bugs hide from casual testing, so I would write a test that does exactly the scary thing:

1. Mock the API so every protected endpoint returns 401 until a new token is issued.
2. Fire five requests in parallel.
3. Assert that the refresh endpoint was called **exactly once**.
4. Assert that all five requests eventually succeed with the new token.
5. Repeat with the refresh endpoint failing, and assert all five are rejected and the user is signed out once.

## Takeaways

- Treat token refresh as a **single shared operation**, never a per-request concern.
- Share one in-flight promise; it is both the queue and the lock.
- Retry a request **once**, and never intercept the refresh call.
- Pair the client logic with **per-device sessions** on the server so one failure does not end every session.
- Test the concurrent case explicitly. It is the one that breaks in production.
