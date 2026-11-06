---
title: Decoupling CPU-heavy video transcoding from the API server
date: 2026-06-10
summary: How StreamHub keeps FFmpeg out of the NestJS API with BullMQ, a standalone worker, Adaptive Bitrate HLS on Cloudflare R2 and a custom HLS.js player.
tags: NestJS, BullMQ, FFmpeg, HLS, Cloudflare R2
---

StreamHub is a full-stack video streaming platform I built with React, NestJS, PostgreSQL and Prisma, including user-facing features and an admin management system. The most interesting problem in it was not the UI or the database. It was what happens **after** an admin uploads a video.

A raw upload cannot be streamed to every device and connection speed. It has to be converted into **Adaptive Bitrate HLS** (360p–1080p) so the player can switch quality as the network changes. That conversion is **CPU-intensive**, and where you run it decides whether the rest of the platform stays pleasant to use.

## The problem with doing it in the API

The naive version is easy to write: the upload endpoint saves the file, calls FFmpeg, waits, then returns. It works on a laptop with one upload. In a real system it fails in three ways:

- **Starved requests.** FFmpeg saturates the CPU, so unrelated API calls (login, browsing, watch progress) become slow while a video is being processed.
- **Long-lived requests.** An HTTP request that lasts as long as a transcode is fragile: proxies time out, clients disconnect, and a restart loses the work.
- **Coupled failure.** If FFmpeg crashes or runs out of memory, it can take the API process down with it.

The fix is to treat transcoding as **background work with its own process**, not as part of request handling.

## Architecture overview

The API never transcodes anything. It records the upload and hands the work to a queue; a separate worker does the heavy lifting.

1. The client uploads a video to the NestJS API.
2. The API stores the source and adds a transcoding job to **BullMQ**, backed by Redis.
3. A **standalone worker** consumes the job and runs **FFmpeg**.
4. The generated HLS renditions and playlists are uploaded to **Cloudflare R2**.
5. The custom **HLS.js** player streams the result with adaptive quality selection.

The API, the transcoder, PostgreSQL and Redis are all containerized with **Docker**, so the whole pipeline runs the same way on a development machine and on a server.

### Why a queue instead of calling the worker directly

A queue gives three things a direct call does not:

- **Buffering.** A burst of uploads becomes a backlog of jobs, not a burst of simultaneous FFmpeg processes.
- **Durability.** Jobs live in Redis, so they survive a worker restart and can be retried.
- **Back-pressure control.** The worker decides how many jobs it runs at once (its concurrency), independently of how fast the API receives uploads.

## What the worker does

For each job the worker follows the same steps:

1. Fetch the source file referenced by the job.
2. Run FFmpeg to produce HLS renditions between 360p and 1080p, plus the playlists that describe them.
3. Upload the output to R2 under a predictable key (for example per video id).
4. Mark the video as ready in the database so the player and the admin UI can see it.

### Designing jobs to be safe to retry

Because jobs can be retried, the worker should be **idempotent**: running the same job twice must leave the system in the same state as running it once. In practice that means writing output to deterministic keys (so a retry overwrites instead of duplicating) and only flipping the "ready" flag at the very end. A job that dies halfway then leaves no half-finished video visible to users.

## A simplified sketch

```ts
// API side: record the upload, enqueue, return immediately
await this.transcodeQueue.add("transcode", { videoId, sourceKey });

// Worker side: a separate process / container
new Worker(
  "transcode",
  async (job) => {
    const { videoId, sourceKey } = job.data;
    await runFfmpegToHls(sourceKey); // renditions from 360p to 1080p
    await uploadRenditionsToR2(videoId);
    await markVideoReady(videoId); // last step: only now is it visible
  },
  { concurrency: 1 }, // tune to the CPU available to the worker
);
```

This is the shape of the solution, not production code.

## Playback: the other half

Producing HLS is only useful if the player can use it. I built a **custom player on HLS.js** rather than embedding a stock one, so that I control the behaviors the product needs:

- **Adaptive quality selection**, with the viewer able to choose a quality manually.
- **Episode navigation**, for content with several episodes.
- **Cross-device watch-progress synchronization**, so you can stop on one device and continue on another.

Storing the segments on **Cloudflare R2** keeps large media files off the application server entirely; the API only deals with metadata.

## Trade-offs

### What you gain
- **A responsive API.** Request handling shares no CPU with FFmpeg.
- **Fault isolation.** A crashing worker does not affect users browsing the site; the queue keeps the jobs.
- **Independent scaling.** The worker is its own container and can be scaled separately from the API.
- **Reproducible environments.** One `docker compose` brings up the whole pipeline.

### What it costs
- **More moving parts.** There is one more service to deploy, monitor and keep healthy.
- **Asynchronous status.** An upload no longer "finishes" in one request. The UI must show a processing state and learn when the video becomes ready, either by polling or by being pushed an update.
- **Failure paths to design.** You need to decide what happens on a failed or stuck job, and how an admin can retry it.

## Lessons learned

1. **Decide early what belongs in a request.** Anything proportional to file size or CPU time probably does not.
2. **Make background jobs idempotent from day one.** It is much harder to retrofit.
3. **Treat "ready" as a state change at the end, not a side effect along the way.** It keeps partial work invisible.
4. **Build the status UI, not just the pipeline.** Users judge an asynchronous system by how clearly it tells them what is happening.
