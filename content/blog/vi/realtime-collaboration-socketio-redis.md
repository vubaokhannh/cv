---
title: Cộng tác thời gian thực với Socket.IO và Redis
date: 2025-11-20
summary: Cách Krello giữ đồng bộ cập nhật board/card, bình luận, trạng thái đang gõ và hiện diện người dùng giữa các client bằng Socket.IO và Redis.
tags: Socket.IO, Redis, NestJS, Real-time
---

Krello là nền tảng quản lý công việc lấy cảm hứng từ Trello. Tính năng làm nó có cảm giác "sống" là **cộng tác thời gian thực**: khi ai đó kéo một card, sửa tiêu đề hay để lại bình luận, mọi người đang xem cùng board thấy ngay. Tôi xây dựng nó bằng **Socket.IO** và **Redis**, trên nền backend NestJS và client React.

Bài viết này đi qua cách tôi nghĩ về bài toán: cái gì cần real-time, các client được nhóm ra sao, và vì sao Redis có mặt.

## "Real-time" bao gồm những gì

Trên một board cộng tác có nhiều loại thông tin trực tiếp, với nhu cầu khác nhau:

- **Cập nhật board và card**: di chuyển, tạo, sửa, xóa card và list.
- **Bình luận**: bình luận mới xuất hiện cho mọi người đang xem card.
- **Trạng thái đang gõ**: cho thấy ai đó đang viết ngay lúc này.
- **Hiện diện người dùng**: ai đang ở trên board này, tính trên tất cả các kết nối đang mở của họ.

Hai loại đầu là **dữ liệu bền vững**. Hai loại sau là **tạm thời**: chỉ có ý nghĩa trong vài giây và không bao giờ nên ghi vào database chính.

## Room: gửi sự kiện đúng người cần nhận

Phát mọi sự kiện cho mọi client đang kết nối vừa lãng phí vừa làm lộ dữ liệu giữa các board. **Room** của Socket.IO giải quyết việc này. Khi người dùng mở một board, socket của họ tham gia một room đặt theo board đó; sự kiện của board chỉ được phát vào room ấy.

```ts
// Đơn giản hóa: vào room của board sau khi kiểm tra quyền
@SubscribeMessage("board:join")
async onJoin(@ConnectedSocket() socket: Socket, @MessageBody() { boardId }) {
  await this.permissions.assertCanView(socket.data.userId, boardId);
  await socket.join(`board:${boardId}`);
}

// Thông báo cho mọi người còn lại trên board đó
this.server.to(`board:${boardId}`).except(socket.id).emit("card:moved", payload);
```

Bước kiểm tra quyền rất quan trọng: một socket chỉ nên vào room của board mà người dùng được phép xem. Phân quyền không chỉ dành cho các endpoint REST.

## Giữ REST và socket nhất quán

Một câu hỏi thiết kế thường gặp là thay đổi nên bắt nguồn từ đâu. Tôi giữ **REST API là nguồn sự thật**: thay đổi được kiểm tra, phân quyền và lưu qua các endpoint NestJS thông thường, rồi server **phát kết quả** vào room của board. Client coi sự kiện socket là thông báo về những thay đổi đã xảy ra.

Cách này giữ một đường duy nhất cho validation và lưu trữ, và nghĩa là một client từng offline chỉ cần tải lại để bắt kịp, không phụ thuộc vào việc đã nhận đủ mọi sự kiện.

## Vì sao cần Redis

Một tiến trình Node đơn lẻ có thể giữ room trong bộ nhớ. Nhưng khi chạy **nhiều hơn một instance** server (để scale hoặc deploy không gián đoạn), cách đó vỡ: client kết nối với instance A sẽ không nhận được sự kiện do instance B phát.

Redis giải quyết bằng **Pub/Sub**. Mỗi instance publish các sự kiện nó phát và subscribe sự kiện của các instance khác, nên một lần broadcast tới được client kết nối ở bất kỳ đâu. Socket.IO có Redis adapter làm đúng việc này, nên broadcast theo room tiếp tục hoạt động giữa các instance mà không cần code riêng.

Redis còn có vai trò thứ hai trong Krello: lưu **trạng thái tạm thời** như hiện diện, thứ không thuộc về PostgreSQL.

## Hiện diện trên nhiều kết nối

Hiện diện nghe có vẻ đơn giản cho đến khi bạn nhớ rằng một người có thể có **nhiều kết nối** cùng lúc: hai tab trình duyệt, một điện thoại và một laptop. Nếu theo dõi "online" bằng một cờ cho mỗi người dùng, đóng một tab sẽ đánh dấu họ offline trong khi tab khác vẫn đang mở.

Cách bền vững là theo dõi **các kết nối của mỗi người dùng** và coi họ là đang hiện diện chừng nào còn ít nhất một kết nối:

```ts
// Đơn giản hóa: một tập socket id cho mỗi người dùng trên mỗi board
await redis.sadd(`presence:${boardId}:${userId}`, socket.id);

// khi ngắt kết nối
await redis.srem(`presence:${boardId}:${userId}`, socket.id);
const remaining = await redis.scard(`presence:${boardId}:${userId}`);
if (remaining === 0) this.server.to(`board:${boardId}`).emit("presence:left", { userId });
```

Các mục này cũng nên **hết hạn** (ví dụ bằng TTL được làm mới bởi heartbeat), để server sập hay kết nối rớt không để lại "người dùng ma" online mãi mãi.

## Trạng thái đang gõ

Trạng thái đang gõ là ví dụ rõ nhất của dữ liệu tạm thời. Client phát sự kiện "typing", server chuyển tiếp vào room, giao diện hiển thị chỉ báo trong thời gian ngắn. Hai chi tiết làm trải nghiệm dễ chịu:

- **Throttle** phía client để mỗi phím bấm không đều đổ ra mạng.
- **Cho chỉ báo tự hết hạn** ở phía nhận, để nếu sự kiện "ngừng gõ" bị mất thì chỉ báo vẫn tự biến mất.

Không gì ở đây được lưu lại.

## Các bẫy cần thiết kế trước

- **Áp dụng sự kiện hai lần.** Người thực hiện thay đổi cũng nhận lại nó trừ khi bạn loại socket của họ. Quyết định giao diện áp dụng thay đổi lạc quan và bỏ qua bản vang của chính mình hay không.
- **Kết nối lại.** Sau khi rớt mạng, client kết nối lại, vào lại các room và nên **tải lại** board, vì đã bỏ lỡ sự kiện lúc vắng mặt.
- **Phân quyền ở mọi lần join.** Không bao giờ tin tên room do client gửi.
- **Kiểm soát tần suất.** Sự kiện tần suất cao như khi kéo thả cần throttle để board đông người không làm ngập kết nối.

## Điều rút ra

- Tách **thay đổi bền vững** (lưu trước, rồi phát) khỏi **tín hiệu tạm thời** (hiện diện, đang gõ).
- Dùng **room** để sự kiện chỉ tới client đáng được thấy, và kiểm tra quyền khi join.
- Thêm **Redis** ngay khi có nhiều hơn một instance server; nó cũng là chỗ tự nhiên cho hiện diện.
- Đếm **kết nối**, không đếm người dùng, khi quyết định ai đang online.
- Luôn cho client cách **đồng bộ lại** sau khi ngắt kết nối.
