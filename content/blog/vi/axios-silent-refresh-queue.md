---
title: Hàng đợi silent refresh an toàn khi đồng thời cho Axios
date: 2025-12-15
summary: Chuyện gì xảy ra khi nhiều request cùng nhận 401, và cách Krello làm mới token một lần rồi gửi lại tất cả request còn lại.
tags: Axios, JWT, React, Authentication
---

Krello, ứng dụng quản lý công việc thời gian thực tôi xây dựng với React, TypeScript và NestJS, dùng JWT **access token** ngắn hạn kèm **refresh token rotation**. Phần phía server của thiết kế này khá chuẩn. Phần gây rắc rối nằm ở client: khi access token hết hạn, **nhiều request đang chạy có thể cùng nhận 401 trong cùng một khoảnh khắc**.

Xử lý tốt chỗ này là khác biệt giữa một phiên tự gia hạn êm ái và một người dùng bị đăng xuất mà không rõ vì sao.

## Vì sao đây là vấn đề thật

Một bảng Kanban nói chuyện với server rất nhiều. Mở một board có thể bắn gần như đồng thời các request lấy board, list, card, thành viên và thông báo. Nếu access token đã hết hạn một phút trước, mọi request đó đều trả về 401.

Interceptor ngây thơ nói: "gặp 401 thì gọi endpoint refresh, rồi thử lại." Với năm request lỗi song song, nghĩa là **năm lệnh refresh**. Với refresh token rotation, điều này không chỉ lãng phí mà còn có hại:

1. Lệnh refresh đầu tiên thành công và **làm refresh token cũ mất hiệu lực**, cấp token mới.
2. Bốn lệnh còn lại vẫn mang token cũ, giờ đã vô hiệu, nên **thất bại**.
3. Client hiểu refresh thất bại là "hết phiên" và đăng xuất người dùng.

Người dùng không làm gì sai, vậy mà bị đưa về màn hình đăng nhập.

## Cách tiếp cận: một lần refresh, mọi người chờ

Cách sửa là biến việc refresh thành **một thao tác dùng chung, chỉ chạy một lần**:

- Lần 401 **đầu tiên** khởi động một lệnh refresh.
- Mọi request khác lỗi trong lúc refresh đang chạy không tự refresh. Chúng **chờ** chính lệnh refresh đó hoàn tất.
- Khi refresh thành công, các request đang chờ được **gửi lại** với access token mới.
- Khi thất bại, tất cả request đang chờ **bị từ chối** cùng lúc và phiên kết thúc gọn gàng.

### Cách đơn giản nhất: dùng chung một promise

Bạn không cần mảng callback tường minh. Một promise lưu trong biến chính là hàng đợi: ai cần token đều `await` cùng một promise.

```ts
let refreshing: Promise<string> | null = null;

api.interceptors.response.use(undefined, async (error) => {
  const original = error.config;
  const status = error.response?.status;

  // Không phải lỗi xác thực, đã thử lại, hoặc chính là lệnh refresh
  if (status !== 401 || original._retried || original.url?.includes("/auth/refresh")) {
    throw error;
  }
  original._retried = true;

  // Lỗi đầu tiên tạo promise; các lỗi sau dùng lại
  refreshing ??= refreshAccessToken().finally(() => {
    refreshing = null;
  });

  const token = await refreshing; // mọi request đang chờ cùng await một promise
  original.headers.Authorization = `Bearer ${token}`;
  return api(original);
});
```

Đây là phác thảo ý tưởng, không phải đúng nguyên code production của Krello.

## Những chi tiết quan trọng

### Đánh dấu request đã thử lại
Không có cờ `_retried`, một request cứ trả về 401 (vì lý do không phải token hết hạn) sẽ lặp vô hạn: refresh, thử lại, 401, refresh. Chỉ thử lại **một lần**, rồi để lỗi nổi lên.

### Không bao giờ chặn chính lệnh refresh
Nếu endpoint refresh trả về 401 (refresh token thật sự không hợp lệ), interceptor không được refresh tiếp. Coi đó là hết phiên.

### Xóa promise dùng chung trong `finally`
Promise phải được reset dù refresh thành công hay thất bại. Nếu không, một lần refresh lỗi sẽ bị cache và mọi request sau đó thất bại ngay với lỗi cũ.

### Quyết định "thất bại" thì làm gì
Khi refresh thất bại, từ chối mọi thứ đang chờ, xóa state phía client và đưa người dùng đến trang đăng nhập. Làm việc này ở một chỗ giúp hành vi nhất quán.

### Nhiều tab trình duyệt
Mỗi tab có bộ nhớ JavaScript riêng, nên mỗi tab có thể tự khởi động một lệnh refresh. Với rotation, hai tab refresh cùng lúc vẫn có thể va chạm. Cách giảm thiểu thường gặp là phối hợp giữa các tab (ví dụ bằng khóa dùng chung) hoặc để server chấp nhận một khoảng ân hạn ngắn cho token vừa được xoay. Đây là lý do để giữ logic client nhỏ gọn và quy tắc phía server tường minh.

## Phối hợp với server

Hàng đợi phía client chỉ hoạt động tốt khi server cộng tác:

- **Phiên theo thiết bị.** Mỗi thiết bị có refresh token riêng, nên refresh thất bại chỉ kết thúc phiên của thiết bị đó, không phải mọi phiên của tài khoản.
- **Phản hồi lỗi rõ ràng.** Client cần phân biệt "access token hết hạn" (refresh rồi thử lại) với "refresh token không hợp lệ" (đăng nhập lại).
- **Access token sống ngắn.** Nó giới hạn thiệt hại khi token bị lộ, đó chính là lý do refresh token tồn tại.

## Tôi sẽ kiểm thử thế nào

Lỗi đồng thời rất khó lộ ra khi thử qua loa, nên tôi sẽ viết một test làm đúng điều đáng sợ đó:

1. Mock API sao cho mọi endpoint được bảo vệ trả 401 cho đến khi có token mới.
2. Bắn năm request song song.
3. Khẳng định endpoint refresh được gọi **đúng một lần**.
4. Khẳng định cả năm request cuối cùng thành công với token mới.
5. Lặp lại khi endpoint refresh thất bại, khẳng định cả năm bị từ chối và người dùng bị đăng xuất đúng một lần.

## Điều rút ra

- Coi việc refresh token là **một thao tác dùng chung**, không phải việc của từng request.
- Dùng chung một promise đang chạy; nó vừa là hàng đợi vừa là khóa.
- Thử lại request **một lần**, và không bao giờ chặn chính lệnh refresh.
- Kết hợp logic client với **phiên theo thiết bị** ở server để một lỗi không kết thúc mọi phiên.
- Test trường hợp đồng thời một cách tường minh. Đó là trường hợp hỏng trên production.
