---
title: JWT refresh token rotation, phiên theo thiết bị và RBAC
date: 2025-10-28
summary: Thiết kế xác thực và phân quyền đằng sau StreamHub và Krello: access/refresh token, phiên theo thiết bị, Google OAuth 2.0 và phân quyền theo vai trò.
tags: JWT, OAuth 2.0, RBAC, NestJS, Security
---

Cả hai dự án chính của tôi, StreamHub và Krello, đều có người dùng, phiên đăng nhập và phân quyền, nên xác thực và phân quyền được thiết kế cẩn thận thay vì chắp vá. Bài viết này tóm tắt hình dạng của thiết kế đó: đăng nhập và token hoạt động ra sao, vì sao phiên được theo dõi **theo từng thiết bị**, **Google OAuth 2.0** nằm ở đâu, và **RBAC** kiểm soát việc mỗi người dùng được làm như thế nào.

## Xác thực và phân quyền

Hai từ này hay bị lẫn, nên tách ra sẽ dễ hiểu hơn:

- **Xác thực (authentication)** trả lời "bạn là ai?". Đăng nhập, token và OAuth thuộc phần này.
- **Phân quyền (authorization)** trả lời "bạn được phép làm gì?". Vai trò và quyền thuộc phần này.

Một request phải qua cả hai: trước hết là danh tính hợp lệ, sau đó là hành động được phép.

## Access token và refresh token

Tôi dùng hai loại JWT với thời gian sống rất khác nhau:

- **Access token** sống ngắn. Nó được gửi kèm mọi request API và chứng minh danh tính mà không cần truy vấn database. Vì sống ngắn, token bị lộ chỉ có ích với kẻ tấn công trong thời gian ngắn.
- **Refresh token** sống lâu hơn và chỉ dùng cho một việc: lấy access token mới khi cái cũ hết hạn. Nó được đem ra dùng hiếm hơn nhiều nên ít bị phơi ra hơn.

Cách tách này cho bạn xác thực request nhanh, không trạng thái, **và** khả năng kết thúc một phiên, điều mà một JWT sống lâu thuần túy không làm được.

## Refresh token rotation

Với **rotation**, mỗi lần refresh token được dùng, server cấp một refresh token **mới** và vô hiệu hóa cái cũ. Một refresh token vì vậy chỉ dùng được đúng một lần.

Lợi ích là hạn chế thiệt hại: nếu refresh token cũ bị đánh cắp rồi dùng sau khi client hợp lệ đã xoay nó, lần dùng đó thất bại. Một bước gia cố thường thấy là coi việc dùng lại token đã bị xoay là dấu hiệu bị xâm phạm và kết thúc phiên đó.

Cái giá nằm ở phía client, vốn không bao giờ được bắn hai lệnh refresh với cùng một token. Tôi mô tả cách Krello xử lý chuyện này trong bài về hàng đợi silent refresh của Axios.

## Phiên theo thiết bị

Thay vì một phiên cho mỗi tài khoản, mỗi **thiết bị** có bản ghi phiên và refresh token riêng. Điều này đổi những gì bạn có thể làm:

- **Hiển thị và quản lý các phiên đang hoạt động**, ví dụ "đang đăng nhập trên Chrome, Mac".
- **Đăng xuất một thiết bị** mà không ảnh hưởng các thiết bị khác.
- **Cô lập lỗi.** Nếu refresh của một thiết bị thất bại hoặc bị thu hồi, chỉ phiên đó kết thúc.

Một bản ghi phiên thường lưu nhãn thiết bị, thời điểm tạo và lần dùng gần nhất, cùng mã băm của refresh token hiện tại (không bao giờ lưu chính token).

```ts
// Đơn giản hóa: xoay token khi refresh
async refresh(presentedToken: string) {
  const session = await this.sessions.findByTokenHash(hash(presentedToken));
  if (!session || session.expiresAt < new Date()) throw new UnauthorizedException();

  const { accessToken, refreshToken } = this.issueTokens(session.userId);
  await this.sessions.update(session.id, {
    tokenHash: hash(refreshToken), // token cũ không còn khớp
    lastUsedAt: new Date(),
  });
  return { accessToken, refreshToken };
}
```

Đây là phác thảo ý tưởng, không phải code production hoàn chỉnh.

## Google OAuth 2.0

Nhiều người dùng thích "Tiếp tục với Google" hơn là tạo thêm một mật khẩu. Với OAuth 2.0, người dùng xác thực với Google và backend của tôi nhận về một danh tính đã được xác minh. Phần quan trọng là bước tiếp theo: backend tìm hoặc tạo người dùng nội bộ rồi cấp access và refresh token **của chính nó**, y như đăng nhập bằng mật khẩu.

Điều đó giữ phần còn lại của hệ thống đơn giản. Mọi thứ sau đăng nhập, gồm phiên, rotation và phân quyền, hoạt động như nhau bất kể người dùng đăng nhập bằng cách nào.

## Phân quyền với RBAC

**Role-based access control** gán quyền cho vai trò và vai trò cho người dùng, thay vì gắn quyền cho từng cá nhân. Ở StreamHub các vai trò là **động**: quyền có thể điều chỉnh mà không cần sửa code, phù hợp với một hệ thống quản trị admin.

Ở Krello, quyền truy cập còn phụ thuộc **ngữ cảnh**: là thành viên workspace không mặc nhiên có nghĩa được sửa mọi board. Vì vậy quyền cũng tồn tại ở **cấp board**, ví dụ khác biệt giữa người chỉ xem được board và người sửa được nó.

Trong NestJS, điều này khớp gọn với **guard**:

```ts
@UseGuards(JwtAuthGuard, BoardPermissionGuard)
@RequirePermission("card:update")
@Patch("cards/:id")
updateCard(/* ... */) {}
```

Guard xác định người dùng từ token, nạp vai trò hoặc quyền board của họ và đối chiếu với quyền mà route yêu cầu. Vì việc kiểm tra nằm ở một chỗ, khó quên nó hơn khi thêm endpoint mới.

## Những điều tôi cố làm đúng

- **Băm refresh token khi lưu**, để lộ database không làm lộ token dùng được.
- **Giữ access token sống ngắn** và không để gì nhạy cảm trong đó.
- **Phân quyền ở server cho mọi request**, kể cả hành động qua WebSocket. Giao diện ẩn một nút không phải là bảo mật.
- **Phân biệt rõ ngữ nghĩa lỗi**: "hết hạn" và "không hợp lệ" phải dẫn đến hành vi client khác nhau.
- **Ghi log sự kiện phiên** (tạo, xoay, thu hồi) để có thể điều tra sự cố.

## Điều rút ra

- **Access token** ngắn cộng **refresh token** xoay vòng cho request nhanh và phiên có thể thu hồi.
- **Phiên theo thiết bị** làm việc thu hồi chính xác và cô lập lỗi.
- OAuth nên kết thúc bằng token **của riêng bạn** để phần còn lại của hệ thống đồng nhất.
- **RBAC** giữ quyền ở dạng khai báo; thêm ngữ cảnh (như quyền cấp board) ở nơi chỉ dùng vai trò là quá thô.
- Coi bảo mật là một tập quy tắc nhỏ, nhất quán, được thực thi ở một chỗ.
