---
title: Tự động hóa triển khai với GitHub Actions và self-hosted runner
date: 2025-12-05
summary: Cách Krello triển khai lên Ubuntu VM trên Proxmox bằng GitHub Actions, self-hosted runner, SSH, PM2 và Cloudflare DNS.
tags: GitHub Actions, CI/CD, PM2, Proxmox, Cloudflare
---

Một dự án chưa thực sự hoàn thành cho tới khi người khác dùng được nó. Với Krello, tôi muốn mọi thay đổi đều lên production **mà không cần một danh sách kiểm tra thủ công dễ sai**. Tôi đã tự động hóa việc triển khai lên **Ubuntu VM chạy trên Proxmox** bằng **GitHub Actions**, **self-hosted runner**, **SSH**, **PM2** và **Cloudflare DNS**.

Bài này giải thích các mảnh ghép khớp với nhau thế nào và lý do đằng sau mỗi lựa chọn.

## Mục tiêu

Push lên nhánh main nên, không cần thao tác tay:

1. Chạy kiểm tra để thay đổi hỏng không được phát hành.
2. Build ứng dụng.
3. Cập nhật dịch vụ đang chạy trên server.
4. Khởi động lại mà không để site ở trạng thái hỏng.

Triển khai thủ công hỏng theo những cách nhàm chán: quên một bước, deploy nhầm nhánh, hoặc để một dịch vụ cập nhật dở dang. Tự động hóa làm quy trình **lặp lại được**, đó mới là giá trị thật.

## Các mảnh ghép

### Ubuntu VM trên Proxmox
Thay vì dùng một nền tảng managed, Krello chạy trên một máy ảo do tôi kiểm soát, đặt trên **Proxmox**. Điều đó cho toàn quyền với môi trường (Node, Redis, PostgreSQL, trình quản lý tiến trình) và là cơ hội tốt để thực hành công việc vận hành thật.

### GitHub Actions
GitHub Actions chạy một **workflow** được định nghĩa trong repository mỗi khi có sự kiện, như một lần push. File workflow nằm cạnh code, nên quy trình deploy được **quản lý phiên bản và review được** như mọi thay đổi khác.

### Self-hosted runner
Workflow thông thường chạy trên máy do GitHub cung cấp. **Self-hosted runner** là một agent nhỏ bạn cài trên **server của chính mình**, rồi nó nhận job từ GitHub. Với một VM nằm sau mạng nhà hoặc mạng riêng, điều này tiện: runner kết nối **ra ngoài** tới GitHub, nên bạn không cần mở cổng vào để GitHub chạm tới server.

### SSH
Khi runner không nằm trên máy đích, hoặc khi tách bước build khỏi bước deploy, **SSH** chuyển lệnh tới server bằng một khóa lưu dưới dạng secret mã hóa. Dù cách nào, nguyên tắc vẫn vậy: pipeline xác thực bằng **khóa, không bao giờ bằng mật khẩu**.

### PM2
**PM2** là trình quản lý tiến trình cho Node.js. Nó giữ ứng dụng chạy, khởi động lại khi crash, và biến việc khởi động lại êm ái cùng xem log thành một lệnh. Nó cũng cho tiến trình tự chạy lại sau khi máy khởi động lại.

### Cloudflare DNS
**Cloudflare DNS** trỏ tên miền về server và có thể làm proxy cho lưu lượng, cung cấp TLS và che địa chỉ gốc. Đó là mắt xích cuối giữa một commit được push và một URL mà mọi người mở được.

## Một workflow đơn giản hóa

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: self-hosted        # chạy ngay trên VM
    steps:
      - uses: actions/checkout@v4

      - name: Cài đặt dependencies
        run: npm ci

      - name: Lint và build
        run: |
          npm run lint
          npm run build

      - name: Khởi động lại dịch vụ
        run: pm2 reload ecosystem.config.js --update-env
```

Đây là minh họa tối giản về hình dạng, không phải đúng workflow của Krello. Một workflow thật còn xử lý biến môi trường, migration database và tách riêng frontend, backend.

## Những quyết định nên đưa ra có chủ đích

### Secret không nằm trong repository
Khóa, token và giá trị môi trường đi vào **secret mã hóa của GitHub** hoặc cấu hình trên server, không bao giờ vào code. Một secret bị lộ trong lịch sử git rất khó xóa sạch thật sự.

### Thất bại sớm
Đặt **lint, kiểm tra kiểu và test trước bước deploy**. Một kiểm tra thất bại nên dừng pipeline để commit hỏng không bao giờ tới server.

### Ưu tiên reload hơn khởi động lại cứng
`pm2 reload` khởi động lại từng worker một nên không có khoảnh khắc nào không có gì phục vụ. Với ứng dụng đơn giản, restart cũng ổn, nhưng nên biết sự khác biệt.

### Làm migration tường minh
Thay đổi schema database là phần rủi ro nhất của một lần deploy. Chạy chúng như một **bước có chủ đích** (và giữ tương thích ngược khi có thể) tránh việc phiên bản mới khởi động trên schema cũ.

### Giữ đường lui
Biết bạn sẽ **rollback** thế nào: deploy lại commit trước, hoặc giữ lại bản build trước. Lần đầu có sự cố trên production là thời điểm tệ để thiết kế việc này.

## Lưu ý bảo mật cho self-hosted runner

Self-hosted runner chạy code của workflow **trên máy của bạn**, nên cần xử lý cẩn thận:

- Chỉ dùng với **repository riêng tư hoặc code đáng tin**. Chạy code pull request không đáng tin trên server của bạn rất rủi ro.
- Cho runner một **user riêng, quyền tối thiểu**, không phải root.
- Giữ VM **được vá lỗi** và hạn chế những gì nó chạm tới được trong mạng của bạn.

## Điều tôi học được

- Tự động hóa triển khai chủ yếu là **loại bỏ những bước con người hay quên**.
- Một pipeline nhàm chán, lặp lại được tốt hơn một script thông minh dùng một lần.
- **Trình quản lý tiến trình** và tầng **DNS/proxy** là một phần độ tin cậy của ứng dụng, không phải thứ nghĩ sau.
- Phải tự vận hành server khiến tôi thiết kế ứng dụng với **cấu hình, log và khởi động lại** trong đầu ngay từ đầu.

## Điều rút ra

- Đặt quy trình deploy **trong repository** để có phiên bản và review được.
- **Self-hosted runner** là cách tiện để deploy lên server riêng mà không mở cổng vào, nếu bạn bảo vệ nó đúng cách.
- Dùng **khóa SSH và secret mã hóa**, không bao giờ để mật khẩu trong code.
- **Thất bại sớm, reload êm ái và lên kế hoạch rollback.**
