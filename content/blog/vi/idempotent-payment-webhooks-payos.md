---
title: Webhook thanh toán idempotent có xác thực chữ ký (PayOS)
date: 2026-07-05
summary: Cách StreamHub nhận webhook thanh toán PayOS (VietQR) an toàn: xác thực chữ ký trước, rồi xử lý mỗi giao dịch đúng một lần.
tags: PayOS, Webhooks, NestJS, PostgreSQL, Payments
---

StreamHub bán gói đăng ký, và tôi đã tích hợp **PayOS (VietQR)** cho thanh toán. Bản thân bước thanh toán là phần dễ. Phần đáng để cẩn thận là **webhook**: request mà nhà cung cấp thanh toán gửi đến server của tôi để báo "khoản thanh toán này đã thành công". Làm sai thì hoặc bạn cấp quyền cho người chưa trả tiền, hoặc xử lý cùng một khoản thanh toán hai lần.

Bài này nói về hai quy tắc tôi xây dựng xoay quanh: **xác thực chữ ký** và làm cho việc xử lý **idempotent**.

## Vì sao webhook đặc biệt

Webhook là một endpoint HTTP trên server mà **bất kỳ ai trên internet cũng gọi được**. Ba sự thật định hình thiết kế:

1. **Mặc định nó không có xác thực.** Không gì ngăn một người lạ gửi một body giả "thanh toán thành công" tới URL đó.
2. **Giao hàng theo kiểu ít nhất một lần.** Nếu server chậm hoặc trả lỗi, nhà cung cấp sẽ gửi lại. Cùng một sự kiện có thể hợp lệ tới nhiều lần.
3. **Thứ tự không được đảm bảo.** Sự kiện có thể đến muộn hoặc sai thứ tự.

Vì vậy endpoint phải trả lời hai câu hỏi cho mỗi request: *có thật là từ nhà cung cấp không?* và *mình đã xử lý nó chưa?*

## Quy tắc 1: xác thực chữ ký trước mọi thứ

Nhà cung cấp thanh toán ký payload webhook bằng một khóa bí mật chung giữa hai bên. Server phải tính lại chữ ký từ body nhận được và so với chữ ký trong request. Nếu khác, request bị từ chối trước khi chạm vào logic nghiệp vụ.

```ts
// Đơn giản hóa
@Post("webhooks/payos")
async handle(@Body() body: PayosWebhookDto) {
  if (!this.payos.verifySignature(body)) {
    throw new UnauthorizedException("invalid signature");
  }
  await this.payments.handlePaid(body.data);
  return { ok: true };
}
```

Vài chi tiết dễ làm sai:

- Xác thực trên **đúng dữ liệu** mà nhà cung cấp đã ký, theo đúng thuật toán trong tài liệu, không phải bản được serialize lại có thể đảo thứ tự trường.
- Dùng **so sánh hằng thời gian** để không lộ thông tin qua thời gian phản hồi.
- Giữ khóa bí mật trong **cấu hình**, không bao giờ trong mã nguồn.
- **Từ chối trước, hỏi sau.** Chữ ký không hợp lệ thì không nên chạm tới database.

Chữ ký hợp lệ chứng minh thông điệp là thật. Nó **không** chứng minh thông điệp là mới.

## Quy tắc 2: làm cho việc xử lý idempotent

Một thao tác là **idempotent** nếu làm nhiều lần cho cùng kết quả như làm một lần. Với webhook, nghĩa là xử lý cùng một sự kiện thanh toán hai lần không được gia hạn gói hai lần hay ghi hai giao dịch.

Cách đáng tin cậy là để **chính database ép buộc điều đó**:

1. Định danh giao dịch bằng một id ổn định từ nhà cung cấp (ví dụ mã đơn hàng hoặc mã tham chiếu giao dịch).
2. Lưu nó với **ràng buộc unique**.
3. Xử lý trong một **database transaction**: chèn bản ghi giao dịch và áp dụng tác động của nó cùng nhau. Nếu việc chèn vi phạm ràng buộc unique thì đã có người xử lý rồi, nên không làm gì và vẫn trả về thành công.

```ts
// Đơn giản hóa, với Prisma
async handlePaid(data: PayosPaid) {
  try {
    await this.prisma.$transaction(async (tx) => {
      // unique(providerRef): lần giao thứ hai sẽ thất bại ở đây
      await tx.payment.create({
        data: { providerRef: data.orderCode, userId, amount: data.amount },
      });
      await tx.subscription.upsert(/* gia hạn gói của người dùng */);
    });
  } catch (e) {
    if (isUniqueViolation(e)) return; // đã xử lý: xác nhận an toàn
    throw e;
  }
}
```

### Vì sao không kiểm tra trước rồi mới tạo?

Đoạn code kiểu "tìm thanh toán; nếu chưa có thì tạo" có **race condition**: hai lượt giao đến cùng lúc đều thấy "chưa có" và đều đi tiếp. Ràng buộc unique bịt kẽ hở đó vì database tuần tự hóa xung đột giúp bạn. Đây là ý chính: **đừng dựa vào kiểm tra ở tầng ứng dụng cho tính đúng đắn khi database có thể đảm bảo nó**.

## Phản hồi nhanh và dễ đoán

Nhà cung cấp gửi lại khi timeout hoặc nhận phản hồi không phải 2xx, nên phản hồi rất quan trọng:

- **Trả 2xx khi sự kiện đã được ghi nhận an toàn**, kể cả khi nó trùng. Trả lỗi cho một sự kiện trùng chỉ mời thêm lần gửi lại.
- **Chỉ trả non-2xx cho lỗi thật** (chữ ký sai, hoặc lỗi tạm thời mà gửi lại thực sự có ích).
- Giữ handler **nhanh**. Nếu việc phía sau chậm (email, thống kê), làm sau khi đã xác nhận, ví dụ qua hàng đợi, như tôi làm với xử lý video.

## Xác nhận lại trạng thái khi cần

Coi webhook là một **thông báo**, không phải nguồn sự thật duy nhất. Với hành động quan trọng, có thể đáng để xác nhận trạng thái thanh toán qua API của nhà cung cấp trước khi cấp quyền. Nó thêm một request nhưng bảo vệ khỏi payload giả hoặc gây nhầm lẫn ngay cả khi bước kiểm tra chữ ký có lúc bị cấu hình sai.

## Cái tôi ghi log và cái không bao giờ ghi

- **Ghi log**: id sự kiện, kết quả (đã xử lý, trùng, bị từ chối) và thời điểm. Điều đó giúp gỡ lỗi tranh chấp.
- **Không bao giờ ghi**: khóa bí mật, dữ liệu thẻ hoặc tài khoản đầy đủ, chữ ký thô.

## Kiểm thử các đường không vui

Đường vui chỉ tốn năm phút để test. Giá trị nằm ở phần còn lại:

- Request có **body bị sửa** phải bị từ chối.
- Request **thiếu hoặc sai chữ ký** phải bị từ chối.
- **Cùng một sự kiện hợp lệ gửi hai lần** (hoặc đồng thời) phải tạo đúng một giao dịch và gia hạn gói một lần.
- Sự kiện cho **đơn hàng không tồn tại** không được làm handler crash.

## Điều rút ra

- Webhook là endpoint công khai: **xác thực chữ ký trước**.
- Giao hàng là ít nhất một lần, nên **việc xử lý phải idempotent**.
- Để **ràng buộc unique cộng transaction** ép tác động đúng một lần, thay vì kiểm tra-rồi-chèn.
- **Xác nhận thành công cho sự kiện trùng**; để dành lỗi cho vấn đề thật.
- Test việc bị sửa dữ liệu, sự kiện trùng và đồng thời, không chỉ đường vui.
