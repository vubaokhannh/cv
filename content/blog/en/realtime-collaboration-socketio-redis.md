---
title: Real-time collaboration with Socket.IO and Redis
date: 2025-11-20
summary: How Krello keeps board and card updates, comments, typing indicators and user presence in sync across clients with Socket.IO and Redis.
tags: Socket.IO, Redis, NestJS, Real-time
---

Krello is a Trello-inspired task management platform. The feature that makes it feel alive is **real-time collaboration**: when someone moves a card, edits a title or leaves a comment, everyone else looking at the same board sees it right away. I built this with **Socket.IO** and **Redis**, on top of a NestJS backend and a React client.

This post walks through how I think about the problem: what needs to be real-time, how clients are grouped, and why Redis is part of the picture.

## What "real-time" covers

On a collaborative board there are several kinds of live information, and they have different needs:

- **Board and card updates**: moving, creating, editing and deleting cards and lists.
- **Comments**: new comments appearing for everyone viewing a card.
- **Typing indicators**: showing that someone is writing right now.
- **User presence**: who is currently on this board, across all of their open connections.

The first two are about **durable data**. The last two are **ephemeral**: they matter for a few seconds and should never be written to the main database.

## Rooms: delivering events only to the right people

Broadcasting every event to every connected client would be wasteful and would leak data between boards. Socket.IO's **rooms** solve this. When a user opens a board, their socket joins a room named after that board; events for the board are emitted to that room only.

```ts
// Simplified: join a board's room after checking permission
@SubscribeMessage("board:join")
async onJoin(@ConnectedSocket() socket: Socket, @MessageBody() { boardId }) {
  await this.permissions.assertCanView(socket.data.userId, boardId);
  await socket.join(`board:${boardId}`);
}

// Notify everyone else on that board
this.server.to(`board:${boardId}`).except(socket.id).emit("card:moved", payload);
```

The permission check matters: a socket should only join a room for a board the user is allowed to see. Authorization is not just for REST endpoints.

## Keeping REST and sockets consistent

A common design question is where changes should originate. I keep the **REST API as the source of truth**: a change is validated, authorized and saved through the normal NestJS endpoints, and the server then **broadcasts the result** to the board's room. Clients treat socket events as notifications of changes that already happened.

This keeps one code path for validation and persistence, and it means a client that was offline simply refetches and catches up, instead of relying on having received every event.

## Why Redis

A single Node process can keep rooms in memory. The moment you run **more than one instance** of the server (for scaling or zero-downtime deploys), that breaks: a client connected to instance A will not receive an event emitted by instance B.

Redis solves this with **Pub/Sub**. Each instance publishes the events it emits and subscribes to those from the others, so a broadcast reaches clients connected anywhere. Socket.IO provides a Redis adapter that does exactly this, so room broadcasts keep working across instances without custom code.

Redis has a second job in Krello: it stores **ephemeral state** such as presence, which does not belong in PostgreSQL.

## Presence across multiple connections

Presence sounds trivial until you remember that one person can have **several connections** at once: two browser tabs, a phone and a laptop. If you track "online" as a simple flag per user, closing one tab marks them offline while another tab is still open.

The robust approach is to track **connections per user** and treat the user as present while at least one connection remains:

```ts
// Simplified: a set of socket ids per user per board
await redis.sadd(`presence:${boardId}:${userId}`, socket.id);

// on disconnect
await redis.srem(`presence:${boardId}:${userId}`, socket.id);
const remaining = await redis.scard(`presence:${boardId}:${userId}`);
if (remaining === 0) this.server.to(`board:${boardId}`).emit("presence:left", { userId });
```

Entries should also **expire** (for example with a TTL refreshed by a heartbeat), so a crashed server or a dropped connection does not leave a ghost user online forever.

## Typing indicators

Typing indicators are the clearest example of ephemeral data. The client emits a "typing" event, the server forwards it to the room, and the UI shows the indicator for a short time. Two details make it pleasant:

- **Throttle** the client emission so every keystroke does not hit the network.
- **Time out** the indicator on the receiving side, so if the "stopped typing" event is lost, the indicator still disappears by itself.

Nothing here is persisted.

## Pitfalls to design for

- **Duplicate application of events.** The user who made the change receives it back unless you exclude their socket. Decide whether the UI applies the change optimistically and ignores its own echo.
- **Reconnection.** After a network drop the client reconnects, rejoins its rooms and should **refetch** the board, because events were missed while it was away.
- **Authorization on every join.** Never trust a room name sent by the client.
- **Backpressure.** High-frequency events, such as dragging, need throttling so a busy board does not flood connections.

## Takeaways

- Separate **durable** changes (saved first, then broadcast) from **ephemeral** signals (presence, typing).
- Use **rooms** so events only reach clients that should see them, and check permission when joining.
- Add **Redis** as soon as more than one server instance exists; it also gives you a natural home for presence.
- Count **connections**, not users, when deciding who is online.
- Always give clients a way to **resynchronize** after a disconnect.
