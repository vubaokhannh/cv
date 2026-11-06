---
title: Concurrency-safe Axios silent refresh queue
date: 2025-12-15
summary: What happens when parallel requests hit 401 at once, and how Krello refreshes once and replays the rest.
tags: Axios, JWT, React
---

Krello uses short-lived JWT access tokens with refresh token rotation. The tricky part is on the client: when the access token expires, **multiple in-flight requests hit 401 at the same time**.

## The Problem

If each failed request triggers its own refresh call, we fire redundant requests. Under rotation, the first call invalidates the refresh token, causing the others to fail and logging the user out prematurely.

## Architectural Approach

### Request Queueing Mechanism
- The first 401 starts **one** refresh promise.
- Subsequent 401s during the flight wait in an in-memory queue.

### Replay & Failure Handling
- When the refresh resolves, all queued requests are replayed with the new access token.
- If the refresh fails, the queue is rejected and the user is redirected to login.

## Code Sketch

```ts
let refreshing: Promise<string> | null = null;

api.interceptors.response.use(undefined, async (error) => {
  const original = error.config;
  if (error.response?.status !== 401 || original._retried) throw error;
  original._retried = true;

  refreshing ??= refreshAccessToken().finally(() => {
    refreshing = null;
  });

  const token = await refreshing; // all pending requests await the same promise
  original.headers.Authorization = `Bearer ${token}`;
  return api(original);
});
```

Sharing a single in-flight promise is the cleanest way to get "refresh once, replay the rest" behavior. This is an architectural sketch, not Krello's full production implementation.

## Key Takeaways

### Client-side Concurrency
- Treat token refresh as a **shared singleton operation**, never a per-request concern.
- Mark retried requests to avoid infinite loops if 401s persist.

### Server-side Session Hygiene
- Combine with per-device sessions on the server so a failed refresh only ends that specific device's session.
