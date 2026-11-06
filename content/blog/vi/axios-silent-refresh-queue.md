---
title: Hàng đợi silent refresh an toàn khi đồng thời cho Axios
date: 2025-12-15
summary: Chuyện gì xảy ra khi nhiều request cùng nhận 401, và cách Krello làm mới token một lần rồi gửi lại các request còn lại.
tags: Axios, JWT, React
---

Krello dùng JWT access token ngắn hạn kèm refresh token rotation. Phần khó nằm ở phía client: khi access token hết hạn, **nhiều request có thể cùng nhận 401 trong cùng một lúc**.

## Vấn đề

Nếu mỗi request lỗi tự đi làm mới token, ta sẽ gửi nhiều lệnh refresh. Với rotation, lệnh đầu tiên làm refresh token cũ mất hiệu lực nên các lệnh còn lại thất bại, và người dùng bị đăng xuất vô lý.

## Giải pháp kiến trúc

### Cơ chế hàng đợi (Queue)
- Lần 401 đầu tiên khởi động **một** lệnh refresh duy nhất.
- Các request khác lỗi trong lúc đó sẽ được đưa vào hàng đợi tạm thời.

### Xử lý kết quả trả về
- Khi refresh thành công, các request trong hàng đợi được gửi lại với access token mới.
- Nếu refresh thất bại, hàng đợi bị từ chối và phiên đăng nhập kết thúc an toàn.

## Bản phác thảo code

```ts
let refreshing: Promise<string> | null = null;

api.interceptors.response.use(undefined, async (error) => {
  const original = error.config;
  if (error.response?.status !== 401 || original._retried) throw error;
  original._retried = true;

  refreshing ??= refreshAccessToken().finally(() => {
    refreshing = null;
  });

  const token = await refreshing; // mọi request cùng chờ một promise
  original.headers.Authorization = `Bearer ${token}`;
  return api(original);
});
```

Dùng chung một promise đang chạy là cách đơn giản nhất để có hành vi "refresh một lần, gửi lại phần còn lại". Đây là phác thảo ý tưởng, không phải đúng nguyên code của Krello.

## Điều rút ra

### Xử lý đồng thời ở Client
- Coi việc refresh token là **một thao tác dùng chung**, không phải việc của từng request.
- Đánh dấu request đã retry để 401 kéo dài không gây vòng lặp vô hạn.

### Quản lý phiên ở Server
- Kết hợp với phiên theo thiết bị ở server để refresh thất bại chỉ kết thúc phiên của thiết bị đó.
