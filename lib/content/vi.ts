import { TECH_KRELLO, TECH_STREAMHUB } from "../constants";
import { KRELLO_EDGES, STREAMHUB_EDGES } from "./architecture-edges";
import type { Content, ArchTier, NodeDetail } from "./types";

const streamhubArchTiers: ArchTier[] = [
  {
    label: "01. CLIENT",
    nodes: [
      {
        key: "player",
        name: "HLS.js Video Player",
        badge: "React",
        desc: "Chọn chất lượng thích ứng, chuyển tập, đồng bộ tiến độ xem",
      },
      {
        key: "state",
        name: "State & Data Fetching",
        badge: "Frontend",
        desc: "Zustand + TanStack Query cho ứng dụng người dùng và trang admin",
      },
    ],
  },
  {
    label: "02. API CORE",
    nodes: [
      {
        key: "api",
        name: "NestJS API Server",
        badge: "Backend",
        desc: "REST API cho người dùng & admin; đưa job transcode vào hàng đợi",
        primary: true,
      },
      {
        key: "auth",
        name: "Auth & RBAC",
        badge: "Bảo mật",
        desc: "JWT refresh rotation, Google OAuth 2.0, phiên đa thiết bị",
      },
    ],
  },
  {
    label: "03. XỬ LÝ BẤT ĐỒNG BỘ",
    nodes: [
      {
        key: "queue",
        name: "BullMQ + Redis",
        badge: "Hàng đợi",
        desc: "Đệm các job transcode giữa API và worker",
      },
      {
        key: "worker",
        name: "FFmpeg Transcoder Worker",
        badge: "Worker",
        desc: "Video tải lên → Adaptive Bitrate HLS (360p–1080p)",
      },
    ],
  },
  {
    label: "04. LƯU TRỮ & THANH TOÁN",
    nodes: [
      {
        key: "postgres",
        name: "PostgreSQL + Prisma",
        badge: "DB chính",
        desc: "Người dùng, nội dung, phiên đăng nhập và gói đăng ký",
      },
      {
        key: "r2",
        name: "Cloudflare R2",
        badge: "Object Storage",
        desc: "Tài nguyên streaming HLS",
      },
      {
        key: "payos",
        name: "PayOS (VietQR)",
        badge: "Thanh toán",
        desc: "Webhook xác thực chữ ký, xử lý idempotent",
      },
    ],
  },
];

const streamhubNodeDetails: Record<string, NodeDetail> = {
  player: {
    title: "NODE: Custom HLS.js Player",
    tag: "CLIENT_PLAYER",
    resp: "Phát luồng adaptive-bitrate với chọn chất lượng, chuyển tập và đồng bộ tiến độ xem giữa các thiết bị.",
    decision:
      "Tự xây player trên HLS.js thay vì dùng embed có sẵn, để kiểm soát hoàn toàn việc đổi chất lượng và đồng bộ tiến độ.",
    stack: "React • TypeScript • HLS.js",
  },
  state: {
    title: "NODE: Frontend State & Data Layer",
    tag: "CLIENT_STATE",
    resp: "Các tính năng cho người dùng và hệ thống quản trị admin, với dữ liệu server được tải, cache và đồng bộ phía client.",
    decision:
      "Dùng Zustand cho state phía client và React Query cho data fetching để giao diện tối ưu và dễ dự đoán.",
    stack: "Zustand • TanStack Query",
  },
  api: {
    title: "NODE: NestJS API Server",
    tag: "API_CORE",
    resp: "Phục vụ các endpoint cho người dùng và admin, điều phối việc tải lên và đưa job transcode vào hàng đợi.",
    decision:
      "Tác vụ transcode tốn CPU được tách khỏi tiến trình API: API chỉ đưa việc vào hàng đợi nên việc xử lý request luôn mượt.",
    stack: "NestJS • Prisma ORM • PostgreSQL",
  },
  auth: {
    title: "NODE: Authentication & Access Control",
    tag: "AUTH_TIER",
    resp: "Quản lý phiên đăng nhập và phân quyền truy cập cho người dùng và admin.",
    decision:
      "JWT Refresh Token Rotation, Google OAuth 2.0, quản lý phiên đa thiết bị và RBAC động.",
    stack: "JWT • OAuth 2.0 • RBAC",
  },
  queue: {
    title: "NODE: BullMQ Job Queue",
    tag: "QUEUE_BUFFER",
    resp: "Tách API khỏi xử lý video bằng cách đệm các job transcode giữa API và worker.",
    decision:
      "Hàng đợi dựa trên Redis cho phép worker độc lập mở rộng và gặp lỗi mà không ảnh hưởng API server.",
    stack: "BullMQ • Redis",
  },
  worker: {
    title: "NODE: Standalone Transcoder Worker",
    tag: "FFMPEG_WORKER",
    resp: "Chuyển video tải lên thành các bản Adaptive Bitrate HLS từ 360p đến 1080p.",
    decision:
      "Chạy như một tiến trình/container riêng, tách khỏi API, nên tác vụ FFmpeg nặng không tranh tài nguyên với traffic HTTP.",
    stack: "FFmpeg • BullMQ • Docker",
  },
  postgres: {
    title: "NODE: PostgreSQL Storage Tier",
    tag: "RELATIONAL_DB",
    resp: "Nguồn dữ liệu gốc cho người dùng, nội dung, phiên đăng nhập, phân quyền và gói đăng ký.",
    decision: "Schema và truy vấn được quản lý qua Prisma ORM.",
    stack: "PostgreSQL • Prisma ORM",
  },
  r2: {
    title: "NODE: Cloudflare R2 Object Storage",
    tag: "ASSET_STORAGE",
    resp: "Lưu các tài nguyên streaming HLS đã tạo để player tải về.",
    decision:
      "Các segment streaming nằm trên object storage thay vì trên server ứng dụng.",
    stack: "Cloudflare R2 • HLS",
  },
  payos: {
    title: "NODE: PayOS (VietQR) Payments",
    tag: "PAYMENTS",
    resp: "Xử lý thanh toán gói đăng ký qua VietQR.",
    decision:
      "Webhook được xác thực chữ ký và xử lý idempotent để tránh xử lý trùng giao dịch.",
    stack: "PayOS • Webhooks",
  },
};

const krelloArchTiers: ArchTier[] = [
  {
    label: "01. CLIENT & KANBAN UX",
    nodes: [
      {
        key: "kanban",
        name: "Kanban UI (@dnd-kit)",
        badge: "Board UX",
        desc: "Kéo thả card/list mượt mà, optimistic update và thuật toán tính vị trí",
        primary: true,
      },
      {
        key: "socket_client",
        name: "Socket Client & Axios Interceptor",
        badge: "Mạng & State",
        desc: "Đồng bộ socket live; hàng đợi silent refresh 401 đồng thời an toàn",
      },
    ],
  },
  {
    label: "02. GATEWAY & API CORE",
    nodes: [
      {
        key: "krello_api",
        name: "NestJS REST API Server",
        badge: "API Core",
        desc: "CRUD board, card, member RBAC, activity log và DTO validation",
        primary: true,
      },
      {
        key: "socket_gateway",
        name: "NestJS Socket.IO Gateway",
        badge: "WebSocket",
        desc: "Room theo board, broadcast card update, typing và user presence",
      },
    ],
  },
  {
    label: "03. REAL-TIME SYNC & CACHE",
    nodes: [
      {
        key: "krello_redis",
        name: "Redis Pub/Sub & Presence",
        badge: "Cache & Broker",
        desc: "Adapter mở rộng Socket.IO đa instance, cache online presence",
      },
      {
        key: "krello_auth",
        name: "Auth Service & RBAC",
        badge: "Xác thực / RBAC",
        desc: "JWT Refresh Rotation, Google OAuth 2.0, phân quyền cấp board",
      },
    ],
  },
  {
    label: "04. PERSISTENCE & SERVICES",
    nodes: [
      {
        key: "krello_db",
        name: "PostgreSQL + Prisma ORM",
        badge: "Cơ sở dữ liệu",
        desc: "Schema quan hệ, index tối ưu, Prisma transaction cho vị trí card",
      },
      {
        key: "notifications",
        name: "FCM & Email Service",
        badge: "Thông báo",
        desc: "FCM push alerts khi gán card/nhắc tên và email mời thành viên",
      },
      {
        key: "media",
        name: "Multer & Sharp Storage",
        badge: "Đính kèm & Ảnh",
        desc: "Upload attachment, nén & resize card cover WebP với Sharp",
      },
    ],
  },
];

const krelloNodeDetails: Record<string, NodeDetail> = {
  kanban: {
    title: "NODE: Kanban Board (@dnd-kit & Zustand)",
    tag: "CLIENT_KANBAN",
    resp: "Quản lý tương tác kéo thả thẻ giữa các danh sách, render giao diện Kanban và đồng bộ trạng thái tức thì qua optimistic updates.",
    decision:
      "Sử dụng @dnd-kit tối ưu phát hiện va chạm kết hợp Zustand cập nhật state ngay lập tức trước khi server phản hồi, mang lại trải nghiệm mượt mà không độ trễ.",
    stack: "React • TypeScript • @dnd-kit • Zustand",
  },
  socket_client: {
    title: "NODE: Real-Time Client & Axios Interceptor",
    tag: "CLIENT_NETWORK",
    resp: "Duy trì kết nối WebSocket thời gian thực tới board room; bắt mã lỗi HTTP 401 và xếp hàng các request đồng thời chờ silent refresh token.",
    decision:
      "Áp dụng cơ chế Promise-sharing trong Axios interceptor để khi nhiều request cùng gặp 401, chỉ có 1 request gọi refresh token và tự động replay toàn bộ hàng đợi.",
    stack: "Socket.IO Client • Axios Interceptors • Promises",
  },
  krello_api: {
    title: "NODE: NestJS REST API Server",
    tag: "API_CORE",
    resp: "Cung cấp toàn bộ RESTful endpoints cho workspace, board, list, card, nhãn, checklist, phân quyền thành viên và lịch sử hoạt động.",
    decision:
      "Kiến trúc module hóa của NestJS với DTO validation, Guards và Interceptors giúp code chặt chẽ, dễ kiểm thử và tách biệt rõ ràng các domain nghiệp vụ.",
    stack: "NestJS • TypeScript • Class-Validator • Prisma",
  },
  socket_gateway: {
    title: "NODE: NestJS Socket.IO Gateway",
    tag: "REALTIME_GATEWAY",
    resp: "Quản lý kết nối WebSocket hai chiều, gom client vào từng board room riêng biệt, broadcast sự kiện di chuyển thẻ, bình luận và trạng thái gõ phím real-time.",
    decision:
      "Phân bổ kết nối theo từng room board để giới hạn phạm vi broadcast chỉ cho những người dùng đang cùng mở board, tiết kiệm băng thông và CPU.",
    stack: "Socket.IO • NestJS WebSockets • WSS",
  },
  krello_redis: {
    title: "NODE: Redis Adapter & State Store",
    tag: "REDIS_SYNC",
    resp: "Làm broker pub/sub đồng bộ sự kiện giữa các socket instance khi mở rộng ngang, lưu trữ tạm thời trạng thái online của user và blacklist token đã thu hồi.",
    decision:
      "Dùng @socket.io/redis-adapter giúp hệ thống sẵn sàng scale nhiều process/node server mà người dùng kết nối tới các instance khác nhau vẫn đồng bộ tức thì.",
    stack: "Redis • @socket.io/redis-adapter • In-Memory Cache",
  },
  krello_auth: {
    title: "NODE: Authentication & Authorization Tier",
    tag: "AUTH_RBAC",
    resp: "Xác thực đăng nhập người dùng, cấp phát cặp JWT access/refresh token, Google OAuth 2.0 và kiểm tra quyền hạn (Admin, Member, Observer) trên từng board.",
    decision:
      "Triển khai Refresh Token Rotation tự động hủy phiên khi phát hiện token cũ bị dùng lại (reuse detection), đảm bảo an toàn tối đa cho tài khoản.",
    stack: "Passport.js • JWT • OAuth 2.0 • RBAC Guards",
  },
  krello_db: {
    title: "NODE: PostgreSQL Relational Database",
    tag: "POSTGRES_DB",
    resp: "Nguồn dữ liệu gốc cho toàn bộ thực thể: workspaces, boards, lists, cards, comments, attachments và audit logs.",
    decision:
      "Tối ưu câu truy vấn với Prisma ORM, đánh index trên boardId, listId và card position; dùng transaction cho các thao tác đổi chỗ nhiều card đồng thời.",
    stack: "PostgreSQL • Prisma ORM • Database Transactions",
  },
  notifications: {
    title: "NODE: FCM & Transactional Notification Service",
    tag: "NOTIFICATIONS",
    resp: "Gửi web push notification qua Firebase Cloud Messaging khi người dùng được gán vào card hoặc được nhắc tên (@mention); gửi email mời tham gia board.",
    decision:
      "Bắn thông báo dưới dạng background job bất đồng bộ không chặn luồng xử lý API chính, đảm bảo request của người dùng luôn phản hồi dưới 50ms.",
    stack: "Firebase Cloud Messaging (FCM) • Nodemailer",
  },
  media: {
    title: "NODE: Attachment & Image Processing Pipeline",
    tag: "MEDIA_PROCESSING",
    resp: "Tiếp nhận file đính kèm thẻ, avatar người dùng; nén và resize hình ảnh card cover sang định dạng WebP tối ưu bằng Sharp.",
    decision:
      "Kiểm tra kích thước file qua Multer và nén ảnh tự động với Sharp trước khi lưu trữ, giúp tiết kiệm dung lượng đĩa và tăng tốc độ tải trang Kanban.",
    stack: "Multer • Sharp • WebP Optimization",
  },
};

export const vi: Content = {
  meta: {
    title: "Vũ Bảo Khanh — Fullstack Developer | React, NestJS, TypeScript",
    description:
      "Hồ sơ năng lực của Vũ Bảo Khanh, Fullstack Developer tại TP. Hồ Chí Minh: React, TypeScript, NestJS, PostgreSQL. Xem dự án StreamHub, Krello, kinh nghiệm và liên hệ.",
  },
  ui: {
    topbar: {
      quickJump: "Tìm nhanh",
      switchLang: "Đổi ngôn ngữ",
      blog: "Blog",
    },
    blog: {
      kicker: "// GHI CHÚ KỸ THUẬT",
      title: "Blog",
      subtitle: "Ghi chép về các hệ thống tôi xây dựng",
      description:
        "Ghi chép kỹ thuật của Vũ Bảo Khanh: tách transcode video với BullMQ và FFmpeg, JWT refresh token rotation, hàng đợi refresh an toàn cho Axios và hệ thống thời gian thực.",
      back: "Tất cả bài viết",
      minRead: "{n} phút đọc",
      empty: "Chưa có bài viết.",
      toc: "Mục lục nội dung",
    },
    sidebar: {
      github: "GitHub",
      email: "Email",
      cv: "Tải CV",
      skills: "Kỹ năng chuyên môn",
      contact: "Liên hệ ngay",
    },
    theme: {
      light: "Chuyển sang giao diện sáng",
      dark: "Chuyển sang giao diện tối",
    },
    contact: {
      kicker: "// LIÊN HỆ",
      title: "Cùng làm việc với nhau",
      aside: "Sẵn sàng cho cơ hội Fullstack",
      intro:
        "Tôi đang tìm kiếm vị trí Fullstack Developer (React, TypeScript, NestJS, PostgreSQL). Liên hệ qua bất kỳ kênh nào bên dưới hoặc tải CV của tôi.",
      email: "Email",
      phone: "Điện thoại",
      github: "GitHub",
      location: "Địa điểm",
      copy: "Sao chép",
      open: "Mở",
      call: "Gọi",
      downloadCv: "Tải CV (PDF)",
    },
    arch: {
      kicker: "// SƠ ĐỒ KIẾN TRÚC",
      title: "StreamHub: Pipeline phát video tách biệt",
      hint: "Bấm vào node để xem chi tiết",
      diagram: "SƠ ĐỒ: STREAMHUB_SYSTEM",
      diagramRight: "API ⟷ QUEUE ⟷ WORKER",
      responsibility: "TRÁCH NHIỆM",
      decision: "QUYẾT ĐỊNH THIẾT KẾ",
      stack: "CÔNG NGHỆ",
      core: "DỊCH VỤ LÕI",
      connections: "KẾT NỐI",
      show: "Xem kiến trúc",
      hide: "Ẩn kiến trúc",
      inspecting: "Đang xem {tag}",
    },
    tabs: { label: "Mục", hint: "Bấm 1–4 để chuyển" },
    projects: {
      kicker: "// DỰ ÁN TIÊU BIỂU",
      title: "Dự án Fullstack cá nhân",
      aside: "Real-time, xử lý bất đồng bộ, xác thực & thanh toán",
    },
    experience: {
      kicker: "// KINH NGHIỆM & HỌC VẤN",
      title: "Kinh nghiệm làm việc",
      aside: "Vị trí và thực tập",
      work: "Kinh nghiệm làm việc",
      education: "Học vấn",
    },
    palette: {
      placeholder: "Gõ lệnh... (VD: experience, projects, copy)",
      esc: "ESC",
      footerLeft: "Điều hướng: Bấm hoặc Enter",
      footerRight: "Minimal Engineering Spec",
      viewHint: "Chế độ {n}",
      clipboard: "Clipboard",
      copyEmail: "Sao chép email",
      switchTo: "Chuyển đến {view}",
    },
    toast: {
      copied: "Đã sao chép {email}",
      copyFailed: "Không thể sao chép - {email}",
    },
  },
  profile: {
    role: "Fullstack Developer",
    tagline: "React · TypeScript · NestJS · PostgreSQL",
    location: "TP. Hồ Chí Minh, Việt Nam",
    summary:
      "Fullstack Developer có kinh nghiệm thực tế xây dựng ứng dụng web với React, TypeScript, NestJS và PostgreSQL thông qua các dự án cá nhân về hệ thống real-time, xử lý bất đồng bộ, xác thực và tích hợp thanh toán. Quen thuộc với Docker, Redis, Socket.IO và quy trình CI/CD. Hiện đang phát triển và bảo trì website cho khách hàng trong môi trường PHP chuyên nghiệp, có kinh nghiệm từ phát triển, triển khai đến xử lý sự cố trên môi trường production.",
  },
  skills: [
    { label: "Ngôn ngữ", value: "TypeScript, JavaScript, PHP" },
    {
      label: "Frontend",
      value:
        "React, Next.js, Tailwind CSS, Mantine UI, Zustand, TanStack Query, dnd-kit",
    },
    {
      label: "Backend",
      value: "Node.js, NestJS, Prisma ORM, RESTful APIs, Socket.IO, BullMQ",
    },
    { label: "Cơ sở dữ liệu & Cache", value: "PostgreSQL, MySQL, Redis" },
    {
      label: "Công cụ",
      value: "Docker, Git, JWT, OAuth 2.0, FCM, FFmpeg, HLS.js, Cloudflare R2",
    },
  ],
  views: [
    {
      key: "experience",
      index: "01",
      title: "Kinh nghiệm & Học vấn",
      subtitle: "Vị trí, thực tập và học tập",
      short: "Kinh nghiệm",
      description:
        "Kinh nghiệm làm việc của Vũ Bảo Khanh: PHP Developer tại BM WEB, thực tập Frontend Developer tại Trung tâm Phần mềm Đại học Cần Thơ và học Lập trình Web tại FPT Polytechnic.",
      paletteName: "Kinh nghiệm & Học vấn",
    },
    {
      key: "projects",
      index: "02",
      title: "Dự án tiêu biểu",
      subtitle: "StreamHub & Krello",
      short: "Dự án",
      description:
        "Dự án fullstack tiêu biểu: StreamHub (phát video với BullMQ, FFmpeg, HLS) và Krello (Kanban thời gian thực với Socket.IO), xây dựng bằng React, NestJS và PostgreSQL.",
      paletteName: "Dự án tiêu biểu",
    },
    {
      key: "contact",
      index: "03",
      title: "Liên hệ",
      subtitle: "Email, điện thoại và GitHub",
      short: "Liên hệ",
      description:
        "Liên hệ Vũ Bảo Khanh, Fullstack Developer tại TP. Hồ Chí Minh: email, số điện thoại, GitHub và tải CV PDF.",
      paletteName: "Liên hệ",
    },
  ],
  archTiers: streamhubArchTiers,
  nodeDetails: streamhubNodeDetails,
  projects: [
    {
      id: "streamhub",
      spec: "DỰ ÁN_01 // FULLSTACK DEVELOPER",
      title: "StreamHub - Nền tảng phát video trực tuyến",
      period: "05/2026 - Nay",
      links: [
        {
          label: "Xem demo",
          href: "https://streamhub.tforge.life",
          primary: true,
        },
      ],
      highlights: [
        "Phát triển nền tảng phát video full-stack với React, NestJS, PostgreSQL và Prisma, gồm các tính năng cho người dùng và hệ thống quản trị admin.",
        "Thiết kế kiến trúc xử lý video tách biệt, tách các tác vụ transcode tốn CPU khỏi API server bằng BullMQ, Redis và một worker độc lập.",
        "Xây dựng pipeline transcode video bất đồng bộ với BullMQ và FFmpeg để chuyển video tải lên sang Adaptive Bitrate HLS (360p–1080p) và lưu tài nguyên streaming trên Cloudflare R2.",
        "Phát triển video player tùy biến với HLS.js: chọn chất lượng thích ứng, chuyển tập và đồng bộ tiến độ xem giữa các thiết bị.",
        "Triển khai JWT Refresh Token Rotation, Google OAuth 2.0, quản lý phiên đa thiết bị và RBAC động cho xác thực và phân quyền truy cập.",
        "Tích hợp PayOS (VietQR) cho thanh toán gói đăng ký, có xác thực chữ ký và xử lý webhook idempotent để tránh xử lý trùng giao dịch.",
        "Tối ưu state và data fetching phía frontend với Zustand và React Query, đóng gói API, transcoder, PostgreSQL và Redis bằng Docker.",
      ],
      facts: [
        { label: "STREAMING", value: "HLS 360p–1080p" },
        { label: "XỬ LÝ", value: "BullMQ + FFmpeg" },
        { label: "THANH TOÁN", value: "PayOS (VietQR)" },
      ],
      tech: TECH_STREAMHUB,
      architecture: true,
      archData: {
        kicker: "// HỆ THỐNG PHÂN TÁN",
        title: "KIẾN TRÚC STREAMHUB",
        hint: "Bấm vào từng khối để xem chi tiết kiến trúc",
        diagram: "SƠ ĐỒ: STREAMHUB_SYSTEM",
        diagramRight: "API ⟷ QUEUE ⟷ WORKER",
        defaultNodeKey: "api",
        tiers: streamhubArchTiers,
        edges: STREAMHUB_EDGES,
        nodeDetails: streamhubNodeDetails,
      },
    },
    {
      id: "krello",
      spec: "DỰ ÁN_02 // FULLSTACK DEVELOPER",
      title: "Krello - Quản lý công việc cộng tác thời gian thực",
      period: "09/2025 - 12/2025",
      links: [
        { label: "Xem demo", href: "https://krello.click/", primary: true },
        { label: "GitHub ↗", href: "https://github.com/vubaokhanh2311" },
      ],
      highlights: [
        "Phát triển nền tảng quản lý công việc fullstack lấy cảm hứng từ Trello, xây RESTful API với NestJS/Prisma và giao diện Kanban tương tác với React và @dnd-kit.",
        "Xây dựng cộng tác thời gian thực bằng Socket.IO và Redis, đồng bộ cập nhật board/card, bình luận, trạng thái đang gõ và hiện diện đa kết nối của người dùng giữa các client.",
        "Triển khai kéo-thả sắp xếp card/list theo vị trí, hạn chế tối đa các lần cập nhật database không cần thiết.",
        "Thiết kế xác thực và phân quyền với JWT access/refresh token rotation, quản lý phiên theo thiết bị, Google OAuth 2.0, quyền cấp board và RBAC.",
        "Xây dựng hàng đợi silent-refresh cho Axios an toàn khi đồng thời, xử lý nhiều phản hồi 401 cùng lúc và tự động gửi lại các request đang chờ sau khi làm mới token.",
        "Tối ưu truy cập dữ liệu bằng Prisma query optimization và Redis cache; tích hợp FCM push notification, email giao dịch và xử lý ảnh với Multer/Sharp.",
        "Tự động hóa triển khai lên Ubuntu VM (Proxmox) bằng GitHub Actions, self-hosted runner, SSH, PM2 và Cloudflare DNS.",
      ],
      facts: [
        { label: "REAL-TIME", value: "Socket.IO + Redis" },
        { label: "BOARD UX", value: "Kanban / dnd-kit" },
        { label: "TRIỂN KHAI", value: "GitHub Actions + PM2" },
      ],
      tech: TECH_KRELLO,
      architecture: true,
      archData: {
        kicker: "// HỆ THỐNG THỜI GIAN THỰC",
        title: "KIẾN TRÚC KRELLO",
        hint: "Bấm vào từng khối để xem chi tiết kiến trúc cộng tác",
        diagram: "SƠ ĐỒ: KRELLO_COLLAB_SYSTEM",
        diagramRight: "REST API ⟷ SOCKET.IO ⟷ REDIS",
        defaultNodeKey: "krello_api",
        tiers: krelloArchTiers,
        edges: KRELLO_EDGES,
        nodeDetails: krelloNodeDetails,
      },
    },
  ],
  releases: [
    {
      version: "03/2026 - NAY",
      role: "PHP Developer",
      company: "@ Công ty TNHH BM WEB",
      bullets: [
        "Phát triển và tùy biến nhiều website cho khách hàng bằng PHP, MySQL, JavaScript và AJAX, chuyển yêu cầu nghiệp vụ từ bộ phận Business thành giải pháp kỹ thuật.",
        "Tối ưu hiệu năng và SEO website - cải thiện các truy vấn MySQL chậm, áp dụng chiến lược cache, giảm thời gian tải trang và áp dụng SEO on-page (meta tags, sitemap, structured data).",
        "Đảm bảo giao diện responsive, tương thích đa trình duyệt, mang lại trải nghiệm nhất quán trên nhiều thiết bị và trình duyệt.",
        "Quản lý toàn bộ vòng đời website từ phát triển, triển khai đến bảo trì, cập nhật tính năng và sửa lỗi, bao gồm cấu hình email SMTP cho form liên hệ và thông báo.",
        "Triển khai và duy trì môi trường production: cấu hình tên miền, DNS, chứng chỉ SSL, cơ sở dữ liệu và hosting cPanel; chẩn đoán và xử lý sự cố ở cả tầng ứng dụng lẫn máy chủ để đảm bảo website ổn định.",
      ],
      tone: "current",
    },
    {
      version: "05/2025 - 08/2025",
      role: "Thực tập sinh Frontend Developer",
      company: "@ Trung tâm Phần mềm Đại học Cần Thơ",
      bullets: [
        "Phát triển giao diện web responsive bằng Next.js, Mantine UI và Tailwind CSS.",
        "Tích hợp RESTful API với Axios để hiển thị và cập nhật dữ liệu ứng dụng.",
        "Xây dựng các UI component tái sử dụng và xử lý state phía frontend.",
        "Phối hợp với backend developer để tích hợp API, gỡ lỗi và hoàn thành các tính năng được giao.",
      ],
      tone: "mid",
    },
  ],
  education: [
    {
      period: "08/2023 - 08/2025",
      school: "FPT Polytechnic Cần Thơ",
      program: "Lập trình Web (Web Development)",
      gpa: "GPA: 3.75/4.0",
    },
  ],
};
