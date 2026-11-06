---
title: JWT refresh token rotation, device sessions and RBAC
date: 2025-10-28
summary: The authentication and authorization design behind StreamHub and Krello: access and refresh tokens, per-device sessions, Google OAuth 2.0 and role-based permissions.
tags: JWT, OAuth 2.0, RBAC, NestJS, Security
---

Both of my main projects, StreamHub and Krello, have users, sessions and permissions, so authentication and authorization were designed carefully rather than bolted on. This post summarizes the shape of that design: how login and tokens work, why sessions are tracked **per device**, how **Google OAuth 2.0** fits in, and how **RBAC** controls what each user can do.

## Authentication vs authorization

The two words get mixed up, so it helps to separate them:

- **Authentication** answers "who are you?" Login, tokens and OAuth live here.
- **Authorization** answers "what are you allowed to do?" Roles and permissions live here.

A request must pass both: a valid identity first, then an allowed action.

## Access tokens and refresh tokens

I use two kinds of JWT with very different lifetimes:

- The **access token** is short-lived. It is sent with every API request and proves identity without a database lookup. Because it lives briefly, a leaked token is useful to an attacker only for a short time.
- The **refresh token** is longer-lived and is used for one thing: obtaining a new access token when the old one expires. It is exchanged rarely, so it is exposed much less often.

This split gives you stateless, fast request authentication **and** the ability to end a session, which a purely long-lived JWT cannot offer.

## Refresh token rotation

With **rotation**, every time a refresh token is used, the server issues a **new** refresh token and invalidates the old one. A refresh token therefore works exactly once.

The benefit is damage control: if an old refresh token is stolen and used after the legitimate client already rotated it, the use fails. A common hardening step on top of this is to treat reuse of an already-rotated token as a signal of compromise and end that session.

The cost lands on the client, which must never fire two refreshes with the same token. I describe how Krello handles that in the post about the Axios silent refresh queue.

## Sessions per device

Instead of one session per account, each **device** gets its own session record and its own refresh token. This changes what you can do:

- **Show and manage active sessions**, for example "signed in on Chrome, Mac".
- **Sign out one device** without affecting the others.
- **Contain failures.** If one device's refresh fails or is revoked, only that session ends.

A session record typically stores a device label, when it was created and last used, and a hash of the current refresh token (never the token itself).

```ts
// Simplified: rotate on refresh
async refresh(presentedToken: string) {
  const session = await this.sessions.findByTokenHash(hash(presentedToken));
  if (!session || session.expiresAt < new Date()) throw new UnauthorizedException();

  const { accessToken, refreshToken } = this.issueTokens(session.userId);
  await this.sessions.update(session.id, {
    tokenHash: hash(refreshToken), // the old token no longer matches
    lastUsedAt: new Date(),
  });
  return { accessToken, refreshToken };
}
```

This is a sketch of the idea, not complete production code.

## Google OAuth 2.0

Many users prefer "Continue with Google" to creating another password. With OAuth 2.0 the user authenticates with Google, and my backend receives a verified identity. The important part is what happens next: the backend finds or creates the local user and then issues **its own** access and refresh tokens, exactly as for a password login.

That keeps the rest of the system simple. Everything after login, including sessions, rotation and authorization, works the same no matter how the user signed in.

## Authorization with RBAC

**Role-based access control** assigns permissions to roles and roles to users, instead of attaching permissions to individuals. In StreamHub the roles are **dynamic**: permissions can be adjusted without changing code, which suits an admin management system.

In Krello, access also depends on **context**: being a member of a workspace does not automatically mean you may edit every board. So permissions exist at the **board level** as well, for example the difference between someone who can view a board and someone who can change it.

In NestJS this maps neatly onto **guards**:

```ts
@UseGuards(JwtAuthGuard, BoardPermissionGuard)
@RequirePermission("card:update")
@Patch("cards/:id")
updateCard(/* ... */) {}
```

The guard resolves the user from the token, loads their role or board permission and checks it against the permission the route requires. Because the check sits in one place, forgetting it on a new endpoint is harder.

## Things I try to get right

- **Hash stored refresh tokens**, so a database leak does not hand out working tokens.
- **Keep access tokens short-lived** and put nothing sensitive in them.
- **Authorize on the server for every request**, including WebSocket actions. The UI hiding a button is not security.
- **Give clear error semantics**: "expired" and "invalid" should lead to different client behavior.
- **Log session events** (created, rotated, revoked) so incidents can be investigated.

## Takeaways

- Short **access tokens** plus rotating **refresh tokens** give fast requests and revocable sessions.
- **Per-device sessions** make revocation precise and contain failures.
- OAuth should end in **your own** tokens so the rest of the system stays uniform.
- **RBAC** keeps permissions declarative; add context (such as board-level permissions) where roles alone are too coarse.
- Treat security as a set of small, consistent rules enforced in one place.
