---
title: Decoupling CPU-heavy video transcoding from the API server
date: 2026-06-10
summary: How StreamHub separates video transcoding from the NestJS API with BullMQ, isolated FFmpeg workers and Cloudflare R2.
tags: NestJS, BullMQ, FFmpeg, HLS
---

When a user uploads a video to StreamHub, it has to be converted into Adaptive Bitrate HLS (360p–1080p). This is **CPU-heavy**, and running it inside the API process would starve normal HTTP requests.

## Core Architecture

### Asynchronous Queue Workflow
The API never transcodes. It only records the upload and enqueues a job for an independent worker:

1. Client uploads to NestJS API.
2. API adds a transcoding job to **BullMQ** (backed by Redis).
3. **Independent worker** picks up the job and runs **FFmpeg**.
4. Output HLS renditions are uploaded to **Cloudflare R2**.
5. Custom HLS.js player streams adaptive video.

### Process Isolation
By isolating FFmpeg in a dedicated worker process, the API server remains fast and responsive regardless of how many transcode jobs are queued.

## Code Sketch

```ts
// API side: enqueue and return immediately
await this.transcodeQueue.add("transcode", { videoId, sourceKey });

// Worker side: runs in a separate process / container
new Worker("transcode", async (job) => {
  const { videoId, sourceKey } = job.data;
  await runFfmpegToHls(sourceKey); // 360p to 1080p
  await uploadRenditionsToR2(videoId);
});
```

This is an architectural shape, not production code.

## Architecture Trade-offs

### Key Benefits
- **Zero API lag.** Request handling shares no CPU with FFmpeg.
- **Fault isolation.** A crashed worker does not bring down the API; the queue holds the jobs.
- **Independent scaling.** Workers run in separate containers and scale based on queue depth.
- **Reproducible local dev.** API, transcoder, PostgreSQL and Redis are containerized with Docker.

### Operational Overhead
The trade-off is operational complexity: an additional service to deploy and monitor, and upload status must be polled or streamed asynchronously instead of resolving in a single request.
