---
title: Tách tác vụ transcode tốn CPU ra khỏi API server
date: 2026-06-10
summary: Cách StreamHub tách việc transcode video khỏi NestJS API bằng BullMQ, FFmpeg worker độc lập và Cloudflare R2.
tags: NestJS, BullMQ, FFmpeg, HLS
---

Khi người dùng tải video lên StreamHub, hệ thống phải chuyển nó thành Adaptive Bitrate HLS (360p–1080p). Việc này **tốn CPU**, và nếu chạy ngay trong tiến trình API thì sẽ tranh tài nguyên với các request HTTP bình thường.

## Ý tưởng cốt lõi

### Quy trình bất đồng bộ
API không bao giờ tự transcode. Nó chỉ ghi nhận lượt tải lên rồi đưa một job vào hàng đợi. Một worker riêng sẽ nhận job đó:

1. Client tải video lên NestJS API.
2. API đưa job transcode vào **BullMQ** (chạy trên Redis).
3. **Worker độc lập** nhận job và chạy **FFmpeg**.
4. Các bản HLS tạo ra được lưu trên **Cloudflare R2**.
5. Player HLS.js tùy biến phát video với chọn chất lượng thích ứng.

### Tách biệt tiến trình
Bằng cách cô lập FFmpeg sang worker process riêng, API server hoàn toàn không bị ảnh hưởng khi có nhiều tác vụ transcode nặng chạy cùng lúc.

## Bản phác thảo code

```ts
// Phía API: đưa vào hàng đợi rồi trả về ngay
await this.transcodeQueue.add("transcode", { videoId, sourceKey });

// Phía worker: một tiến trình / container riêng
new Worker("transcode", async (job) => {
  const { videoId, sourceKey } = job.data;
  await runFfmpegToHls(sourceKey); // các bản 360p – 1080p
  await uploadRenditionsToR2(videoId);
});
```

Đây chỉ là phác thảo về hình dạng giải pháp, không phải code production.

## Đánh giá kiến trúc

### Lợi ích chính
- **API luôn mượt.** Xử lý request không dùng chung CPU với FFmpeg.
- **Lỗi độc lập.** Worker có sập thì API vẫn phục vụ người dùng và hàng đợi vẫn giữ các job.
- **Mở rộng độc lập.** Worker chạy trong container riêng nên scale tách biệt với API.
- **Dễ chạy local.** API, transcoder, PostgreSQL và Redis đều được đóng gói bằng Docker.

### Đánh đổi vận hành
Đổi lại là chi phí vận hành: thêm một service phải triển khai và theo dõi, và trạng thái upload phải được theo dõi bất đồng bộ thay vì trong một request duy nhất.
