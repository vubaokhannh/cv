---
title: Sắp xếp kéo-thả theo vị trí, không phải ghi lại cả danh sách
date: 2025-11-05
summary: Cách Krello sắp xếp lại card và list bằng dnd-kit nhưng giữ số lần ghi database ở mức tối thiểu, dùng giá trị vị trí thay vì đánh số lại tất cả.
tags: dnd-kit, React, PostgreSQL, Prisma, Kanban
---

Kéo-thả là trái tim của một bảng Kanban. Ở Krello tôi xây giao diện bằng React và **dnd-kit**, nhưng phần kỹ thuật thú vị không phải là việc kéo. Nó là một câu hỏi lặng lẽ bên dưới: **khi một card được thả vào chỗ mới, ta lưu cái gì?** Mục tiêu của tôi là **sắp xếp lại theo vị trí, hạn chế tối đa các lần cập nhật database không cần thiết**.

## Cách hiển nhiên và vì sao nó đau

Ý tưởng đầu tiên mà hầu hết mọi người thử là lưu một chỉ số nguyên cho mỗi card (0, 1, 2, 3…) và sau mỗi lần di chuyển thì đánh số lại các card. Đưa một card lên đầu danh sách 50 card khi đó nghĩa là tới **50 lần cập nhật**:

- Số lần ghi tỷ lệ với **kích thước danh sách**, không phải kích thước thay đổi.
- Chỉnh sửa đồng thời xung đột: hai người cùng sắp xếp một danh sách có thể ghi đè số của nhau.
- Nó tạo nhiều lưu lượng real-time, vì mỗi card bị đánh số lại là một thay đổi cần phát đi.

Cái ta muốn là **di chuyển một card chỉ chạm tới một dòng**.

## Ý tưởng: chừa khoảng trống giữa các vị trí

Thay vì các số nguyên liên tiếp, lưu **vị trí** là một số có khoảng trống xung quanh. Để đặt một card vào giữa hai card lân cận, gán cho nó một giá trị **nằm giữa** hai giá trị đó. Chỉ card được di chuyển thay đổi.

```text
A: 1000    B: 2000    C: 3000

Đưa C vào giữa A và B  ->  C: (1000 + 2000) / 2 = 1500
Kết quả: A 1000, C 1500, B 2000     (cập nhật một dòng)
```

Thả ở trên cùng dùng giá trị nhỏ hơn card đầu; thả ở dưới cùng dùng giá trị lớn hơn card cuối.

```ts
function positionBetween(prev?: number, next?: number): number {
  if (prev === undefined && next === undefined) return 1000; // danh sách rỗng
  if (prev === undefined) return next! / 2;                  // trên cùng
  if (next === undefined) return prev + 1000;                // dưới cùng
  return (prev + next) / 2;                                  // ở giữa
}
```

Đây là phác thảo kỹ thuật, không phải đúng nguyên code của Krello.

## Tính vị trí mới khi thả

Khi thả, dnd-kit cho tôi biết phần tử nào bị kéo và nó nằm trên hoặc sau phần tử nào. Các bước là:

1. Từ danh sách **hiện tại đã sắp xếp**, tìm các **card lân cận** tại điểm thả.
2. Tính vị trí mới nằm giữa chúng.
3. Cập nhật giao diện **lạc quan** ngay lập tức để board có cảm giác tức thì.
4. Gửi **một request** gồm id card, id list đích và vị trí mới.
5. Server lưu đúng một thay đổi và **phát** nó cho những người khác trên board.

Vì giao diện được cập nhật trước khi server phản hồi, trải nghiệm luôn mượt. Nếu request thất bại, client khôi phục thứ tự cũ và hiện thông báo.

## Di chuyển giữa các list

Một card chuyển sang list khác thay đổi **hai thứ**: list của nó và vị trí trong list đó. Đó vẫn là cập nhật một dòng (`listId` và `position`). Các list cũng được sắp xếp theo cách tương tự trong board, nên việc sắp xếp lại list dùng cùng kỹ thuật.

## Điểm vướng: hết chỗ trống

Chia đôi liên tục cuối cùng sẽ cạn độ chính xác. Sau đủ nhiều lần chèn giữa cùng hai card lân cận, các giá trị trở nên quá gần nhau để phân biệt.

Câu trả lời chuẩn là **cân bằng lại (rebalancing)**: khi khoảng cách giữa các card lân cận xuống dưới một ngưỡng (hoặc hai vị trí bằng nhau), đánh số lại **đúng một list** về các giá trị cách đều, ví dụ 1000, 2000, 3000. Đó là thao tác hiếm và có giới hạn, nên trường hợp thông thường vẫn rẻ mà tính đúng đắn được giữ nguyên.

```ts
const MIN_GAP = 0.001;

if (next - prev < MIN_GAP) {
  await rebalance(listId); // dãn đều lại list này trong một transaction
}
```

Việc chọn kiểu **số thập phân hoặc dấu phẩy động** cũng ảnh hưởng tới độ rộng khoảng trống bạn có, nên đáng để chọn kiểu cột một cách có chủ đích.

## Đồng thời và nhất quán

Hai người kéo trong cùng một list vào cùng một lúc là tình huống căng thẳng thực tế:

- Mỗi lần di chuyển tính vị trí từ **góc nhìn riêng** của nó về danh sách. Vì vị trí là giá trị chứ không phải chỉ số, hai lần di chuyển đồng thời thường vẫn cho **thứ tự nhất quán**, và có thể phá thế hòa bằng khóa phụ như id card.
- Server nên **sắp xếp theo vị trí, rồi theo một khóa phụ ổn định**, để mọi client hiển thị cùng một thứ tự.
- Sự kiện real-time mang theo **vị trí mới**, nên các client khác chỉ chèn card vào giá trị đó thay vì tính lại chỉ số.

## Điều tôi thích ở thiết kế này

- **Ghi nhỏ.** Một card di chuyển nghĩa là một dòng được cập nhật.
- **Khớp tự nhiên với real-time.** Một lần di chuyển là một sự kiện nhỏ, dễ phát đi.
- **Thân thiện với đồng thời.** Không có việc đánh số lại toàn cục để người ta ghi đè.
- **Đọc đơn giản.** Board chỉ là `ORDER BY position`.

## Điều rút ra

- Đừng lưu chỉ số liền khít nếu di chuyển diễn ra thường xuyên; hãy lưu **vị trí có khoảng trống**.
- Một lần di chuyển chỉ nên **chạm đúng dòng được di chuyển**.
- Chuẩn bị cho **cân bằng lại**, dù hiếm khi chạy.
- Cập nhật giao diện **lạc quan** và khôi phục khi thất bại.
- Thêm **khóa phụ ổn định** để các lần di chuyển đồng thời hiển thị giống nhau ở mọi nơi.
