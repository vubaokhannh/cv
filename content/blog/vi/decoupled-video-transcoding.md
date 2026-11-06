---
title: Tách tác vụ transcode tốn CPU ra khỏi API server
date: 2026-06-10
summary: Cách StreamHub giữ FFmpeg ra khỏi NestJS API bằng BullMQ, worker độc lập, Adaptive Bitrate HLS trên Cloudflare R2 và player HLS.js tùy biến.
tags: NestJS, BullMQ, FFmpeg, HLS, Cloudflare R2
---

StreamHub là nền tảng phát video full-stack tôi xây dựng với React, NestJS, PostgreSQL và Prisma, gồm các tính năng cho người dùng và hệ thống quản trị admin. Bài toán thú vị nhất của dự án không nằm ở giao diện hay cơ sở dữ liệu, mà ở chuyện xảy ra **sau khi** admin tải một video lên.

Một file video gốc không thể phát tốt trên mọi thiết bị và tốc độ mạng. Nó phải được chuyển thành **Adaptive Bitrate HLS** (360p–1080p) để player đổi chất lượng theo đường truyền. Việc chuyển đổi này **tốn CPU**, và chỗ bạn chạy nó quyết định phần còn lại của nền tảng có còn dễ dùng hay không.

## Vấn đề khi làm trong API

Phiên bản ngây thơ rất dễ viết: endpoint upload lưu file, gọi FFmpeg, chờ xong rồi trả về. Chạy ổn trên laptop với một video. Trong hệ thống thật nó hỏng theo ba cách:

- **Request bị bỏ đói.** FFmpeg chiếm hết CPU nên các API không liên quan (đăng nhập, duyệt danh sách, lưu tiến độ xem) chậm hẳn khi có video đang xử lý.
- **Request sống quá lâu.** Một request HTTP kéo dài bằng cả quá trình transcode rất mong manh: proxy timeout, client ngắt kết nối, khởi động lại là mất việc.
- **Lỗi lan truyền.** Nếu FFmpeg crash hoặc hết bộ nhớ, nó có thể kéo cả tiến trình API xuống theo.

Cách sửa là coi transcode là **công việc nền chạy trong tiến trình riêng**, không phải một phần của việc xử lý request.

## Tổng quan kiến trúc

API không bao giờ tự transcode. Nó ghi nhận lượt tải lên rồi giao việc cho hàng đợi; một worker riêng làm phần nặng.

1. Client tải video lên NestJS API.
2. API lưu file gốc và đưa một job transcode vào **BullMQ**, chạy trên Redis.
3. **Worker độc lập** nhận job và chạy **FFmpeg**.
4. Các bản HLS và playlist tạo ra được tải lên **Cloudflare R2**.
5. Player **HLS.js** tùy biến phát kết quả với chọn chất lượng thích ứng.

API, transcoder, PostgreSQL và Redis đều được đóng gói bằng **Docker**, nên cả pipeline chạy giống nhau trên máy phát triển lẫn trên server.

### Vì sao dùng hàng đợi thay vì gọi worker trực tiếp

Hàng đợi mang lại ba thứ mà lời gọi trực tiếp không có:

- **Đệm.** Một loạt video tải lên cùng lúc trở thành một chồng job chờ, không phải một loạt tiến trình FFmpeg chạy đồng thời.
- **Bền vững.** Job nằm trong Redis nên sống sót khi worker khởi động lại và có thể thử lại.
- **Kiểm soát tải.** Worker tự quyết định chạy cùng lúc bao nhiêu job (concurrency), độc lập với tốc độ API nhận upload.

## Worker làm gì

Với mỗi job, worker đi qua cùng các bước:

1. Lấy file gốc mà job tham chiếu.
2. Chạy FFmpeg để tạo các bản HLS từ 360p đến 1080p, cùng playlist mô tả chúng.
3. Tải kết quả lên R2 với key dễ đoán (ví dụ theo id video).
4. Đánh dấu video là sẵn sàng trong database để player và giao diện admin nhìn thấy.

### Thiết kế job để thử lại an toàn

Vì job có thể bị thử lại, worker nên **idempotent**: chạy cùng một job hai lần phải cho cùng trạng thái như chạy một lần. Thực tế nghĩa là ghi kết quả vào các key cố định (thử lại thì ghi đè chứ không nhân đôi) và chỉ bật cờ "sẵn sàng" ở bước cuối cùng. Job chết giữa chừng thì không để lại video dang dở mà người dùng nhìn thấy.

## Bản phác thảo đơn giản

```ts
// Phía API: ghi nhận upload, đưa vào hàng đợi, trả về ngay
await this.transcodeQueue.add("transcode", { videoId, sourceKey });

// Phía worker: một tiến trình / container riêng
new Worker(
  "transcode",
  async (job) => {
    const { videoId, sourceKey } = job.data;
    await runFfmpegToHls(sourceKey); // các bản từ 360p đến 1080p
    await uploadRenditionsToR2(videoId);
    await markVideoReady(videoId); // bước cuối: lúc này mới hiển thị
  },
  { concurrency: 1 }, // chỉnh theo CPU mà worker có
);
```

Đây là hình dạng của giải pháp, không phải code production.

## Phát video: nửa còn lại

Tạo ra HLS chỉ có ích khi player dùng được nó. Tôi xây **player tùy biến trên HLS.js** thay vì nhúng player có sẵn, để kiểm soát các hành vi sản phẩm cần:

- **Chọn chất lượng thích ứng**, người xem cũng có thể tự chọn chất lượng.
- **Chuyển tập**, cho nội dung nhiều tập.
- **Đồng bộ tiến độ xem giữa các thiết bị**, để dừng ở thiết bị này và xem tiếp ở thiết bị khác.

Lưu các segment trên **Cloudflare R2** giữ các file media lớn hoàn toàn ngoài server ứng dụng; API chỉ làm việc với metadata.

## Đánh đổi

### Được gì
- **API luôn mượt.** Xử lý request không dùng chung CPU với FFmpeg.
- **Lỗi được cô lập.** Worker crash không ảnh hưởng người đang duyệt site; hàng đợi giữ các job.
- **Mở rộng độc lập.** Worker là container riêng, scale tách biệt với API.
- **Môi trường tái lập được.** Một lệnh `docker compose` dựng cả pipeline.

### Mất gì
- **Nhiều thành phần hơn.** Thêm một service phải triển khai, theo dõi và giữ cho khỏe.
- **Trạng thái bất đồng bộ.** Một lượt upload không còn "xong" trong một request. Giao diện phải hiển thị trạng thái đang xử lý và biết khi nào video sẵn sàng, bằng polling hoặc được đẩy cập nhật.
- **Phải thiết kế đường lỗi.** Cần quyết định điều gì xảy ra với job thất bại hoặc kẹt, và admin thử lại bằng cách nào.

## Bài học rút ra

1. **Quyết định sớm cái gì thuộc về một request.** Thứ gì tỷ lệ với dung lượng file hay thời gian CPU thì nhiều khả năng không thuộc về nó.
2. **Làm job nền idempotent ngay từ đầu.** Thêm vào sau khó hơn nhiều.
3. **Coi "sẵn sàng" là một thay đổi trạng thái ở cuối, không phải tác dụng phụ trên đường đi.** Nó giữ phần việc dở dang vô hình với người dùng.
4. **Xây cả giao diện trạng thái, không chỉ pipeline.** Người dùng đánh giá một hệ thống bất đồng bộ qua việc nó cho họ biết rõ chuyện gì đang diễn ra.
