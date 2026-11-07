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
        desc: "Adaptive quality selection, episode navigation, watch-progress sync",
      },
      {
        key: "state",
        name: "State & Data Fetching",
        badge: "Frontend",
        desc: "Zustand + TanStack Query for user app and admin system",
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
        desc: "REST API for users & admin; enqueues transcoding jobs",
        primary: true,
      },
      {
        key: "auth",
        name: "Auth & RBAC",
        badge: "Security",
        desc: "JWT refresh rotation, Google OAuth 2.0, multi-device sessions",
      },
    ],
  },
  {
    label: "03. ASYNC PROCESSING",
    nodes: [
      {
        key: "queue",
        name: "BullMQ + Redis",
        badge: "Queue",
        desc: "Buffers transcoding jobs between API and worker",
      },
      {
        key: "worker",
        name: "FFmpeg Transcoder Worker",
        badge: "Worker",
        desc: "Uploads → Adaptive Bitrate HLS (360p–1080p)",
      },
    ],
  },
  {
    label: "04. STORAGE & BILLING",
    nodes: [
      {
        key: "postgres",
        name: "PostgreSQL + Prisma",
        badge: "Primary DB",
        desc: "Users, content, sessions and subscriptions",
      },
      {
        key: "r2",
        name: "Cloudflare R2",
        badge: "Object Storage",
        desc: "HLS streaming assets",
      },
      {
        key: "payos",
        name: "PayOS (VietQR)",
        badge: "Payments",
        desc: "Signature-verified, idempotent webhook handling",
      },
    ],
  },
];

const streamhubNodeDetails: Record<string, NodeDetail> = {
  player: {
    title: "NODE: Custom HLS.js Player",
    tag: "CLIENT_PLAYER",
    resp: "Plays adaptive-bitrate streams with quality selection, episode navigation and cross-device watch-progress synchronization.",
    decision:
      "A custom player built on HLS.js instead of a stock embed, so quality switching and progress sync are fully controlled.",
    stack: "React • TypeScript • HLS.js",
  },
  state: {
    title: "NODE: Frontend State & Data Layer",
    tag: "CLIENT_STATE",
    resp: "User-facing views and admin management, with server state fetched, cached and synchronized on the client.",
    decision:
      "Zustand for client state and React Query for server data fetching, keeping components lean and predictable.",
    stack: "Zustand • TanStack Query",
  },
  api: {
    title: "NODE: NestJS API Server",
    tag: "API_CORE",
    resp: "Serves endpoints for users and admins, coordinates uploads and enqueues transcode jobs.",
    decision:
      "CPU-heavy transcoding is decoupled from the API process: the API only enqueues work, keeping HTTP response times snappy.",
    stack: "NestJS • Prisma ORM • PostgreSQL",
  },
  auth: {
    title: "NODE: Authentication & Access Control",
    tag: "AUTH_TIER",
    resp: "Session management and permission checks across user and admin roles.",
    decision:
      "JWT Refresh Token Rotation, Google OAuth 2.0, device-based sessions and dynamic RBAC.",
    stack: "JWT • OAuth 2.0 • RBAC",
  },
  queue: {
    title: "NODE: BullMQ Job Queue",
    tag: "QUEUE_BUFFER",
    resp: "Decouples the API from video processing by buffering transcode jobs between API and worker.",
    decision:
      "Redis-backed queue lets workers scale independently and fail without impacting the API server.",
    stack: "BullMQ • Redis",
  },
  worker: {
    title: "NODE: Standalone Transcoder Worker",
    tag: "FFMPEG_WORKER",
    resp: "Converts uploaded videos into multi-bitrate HLS streams from 360p to 1080p.",
    decision:
      "Runs as a dedicated worker process/container separate from the API so heavy FFmpeg tasks don't compete with web traffic.",
    stack: "FFmpeg • BullMQ • Docker",
  },
  postgres: {
    title: "NODE: PostgreSQL Storage Tier",
    tag: "RELATIONAL_DB",
    resp: "Primary source of truth for users, content metadata, sessions, permissions and subscriptions.",
    decision: "Schema and queries managed via Prisma ORM.",
    stack: "PostgreSQL • Prisma ORM",
  },
  r2: {
    title: "NODE: Cloudflare R2 Object Storage",
    tag: "ASSET_STORAGE",
    resp: "Stores rendered HLS streaming assets for video playback.",
    decision:
      "Streaming segments reside on object storage rather than local app server disk.",
    stack: "Cloudflare R2 • HLS",
  },
  payos: {
    title: "NODE: PayOS (VietQR) Payments",
    tag: "PAYMENTS",
    resp: "Processes subscription payments via VietQR.",
    decision:
      "Webhooks are signature-verified and handled idempotently to prevent double-charging.",
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
        desc: "Smooth drag-and-drop cards & lists with optimistic UI and position math",
        primary: true,
      },
      {
        key: "socket_client",
        name: "Socket Client & Axios Interceptor",
        badge: "Network & State",
        desc: "Live socket event sync; concurrent 401 silent token refresh queue",
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
        desc: "CRUD boards, cards, member RBAC, audit activity log & DTO validation",
        primary: true,
      },
      {
        key: "socket_gateway",
        name: "NestJS Socket.IO Gateway",
        badge: "WebSocket",
        desc: "Board-scoped rooms, broadcasting card movements, typing & presence",
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
        desc: "Multi-instance Socket.IO scaling adapter and ephemeral presence cache",
      },
      {
        key: "krello_auth",
        name: "Auth Service & RBAC",
        badge: "Auth / RBAC",
        desc: "JWT Refresh Rotation, Google OAuth 2.0, board-level granular RBAC",
      },
    ],
  },
  {
    label: "04. PERSISTENCE & SERVICES",
    nodes: [
      {
        key: "krello_db",
        name: "PostgreSQL + Prisma ORM",
        badge: "Database",
        desc: "Relational schema, optimized indexes, Prisma transactions for card order",
      },
      {
        key: "notifications",
        name: "FCM & Email Service",
        badge: "Notifications",
        desc: "FCM push alerts for card assigns/mentions and workspace invite emails",
      },
      {
        key: "media",
        name: "Multer & Sharp Storage",
        badge: "Attachments & Media",
        desc: "Attachment uploads, WebP card cover resizing and compression via Sharp",
      },
    ],
  },
];

const krelloNodeDetails: Record<string, NodeDetail> = {
  kanban: {
    title: "NODE: Kanban Board (@dnd-kit & Zustand)",
    tag: "CLIENT_KANBAN",
    resp: "Manages drag-and-drop interactions across lists, renders Kanban boards, and synchronizes state instantly via optimistic updates.",
    decision:
      "Utilized @dnd-kit for collision detection paired with Zustand for immediate state updates before server roundtrips, eliminating perceived latency.",
    stack: "React • TypeScript • @dnd-kit • Zustand",
  },
  socket_client: {
    title: "NODE: Real-Time Client & Axios Interceptor",
    tag: "CLIENT_NETWORK",
    resp: "Maintains live WebSocket board subscriptions; intercepts 401 errors and serializes concurrent requests during silent token refresh.",
    decision:
      "Employed an in-flight Promise queue in Axios interceptors so parallel 401 responses trigger exactly one token refresh and safely replay pending calls.",
    stack: "Socket.IO Client • Axios Interceptors • Promises",
  },
  krello_api: {
    title: "NODE: NestJS REST API Server",
    tag: "API_CORE",
    resp: "Serves all RESTful endpoints for workspaces, boards, lists, cards, labels, checklists, member permissions, and activity audit trails.",
    decision:
      "Structured via NestJS modular architecture with DTO validation, Guards, and Interceptors ensuring strict domain separation and maintainability.",
    stack: "NestJS • TypeScript • Class-Validator • Prisma",
  },
  socket_gateway: {
    title: "NODE: NestJS Socket.IO Gateway",
    tag: "REALTIME_GATEWAY",
    resp: "Handles bi-directional WebSocket connections, joins clients to board-specific rooms, and broadcasts live card updates, comments, and typing events.",
    decision:
      "Segmented clients into board-scoped rooms so broadcast events are scoped strictly to active board collaborators, minimizing bandwidth overhead.",
    stack: "Socket.IO • NestJS WebSockets • WSS",
  },
  krello_redis: {
    title: "NODE: Redis Adapter & State Store",
    tag: "REDIS_SYNC",
    resp: "Acts as pub/sub broker across socket instances for horizontal scaling, stores ephemeral user presence, and handles token revocation.",
    decision:
      "Employed @socket.io/redis-adapter enabling multi-instance deployment where collaborators connected to different servers still share live board events.",
    stack: "Redis • @socket.io/redis-adapter • In-Memory Cache",
  },
  krello_auth: {
    title: "NODE: Authentication & Authorization Tier",
    tag: "AUTH_RBAC",
    resp: "Authenticates users, issues short-lived JWT pairs, supports Google OAuth 2.0, and enforces granular board-level RBAC (Admin, Member, Observer).",
    decision:
      "Implemented Refresh Token Rotation with token reuse detection that automatically revokes compromised sessions for robust account security.",
    stack: "Passport.js • JWT • OAuth 2.0 • RBAC Guards",
  },
  krello_db: {
    title: "NODE: PostgreSQL Relational Database",
    tag: "POSTGRES_DB",
    resp: "Source of truth for all structured entities: workspaces, boards, lists, cards, comments, attachments, and audit trails.",
    decision:
      "Optimized Prisma queries with indexes on boardId, listId, and card position; utilized database transactions for atomic multi-card reordering.",
    stack: "PostgreSQL • Prisma ORM • Database Transactions",
  },
  notifications: {
    title: "NODE: FCM & Transactional Notification Service",
    tag: "NOTIFICATIONS",
    resp: "Dispatches web push alerts via Firebase Cloud Messaging upon card assignment or @mentions in comments, plus transactional board invite emails.",
    decision:
      "Dispatched notifications as non-blocking background tasks so API responses remain lightning-fast regardless of third-party network latency.",
    stack: "Firebase Cloud Messaging (FCM) • Nodemailer",
  },
  media: {
    title: "NODE: Attachment & Image Processing Pipeline",
    tag: "MEDIA_PROCESSING",
    resp: "Handles card attachments and user avatars; compresses and resizes card cover images into modern WebP format via Sharp.",
    decision:
      "Validated file sizes via Multer and compressed images on-the-fly with Sharp, reducing disk storage footprint and accelerating board render speeds.",
    stack: "Multer • Sharp • WebP Optimization",
  },
};

export const en: Content = {
  meta: {
    title: "Vũ Bảo Khanh — Fullstack Developer | React, NestJS, TypeScript",
    description:
      "Portfolio of Vũ Bảo Khanh, Fullstack Developer in Ho Chi Minh City: React, TypeScript, NestJS, PostgreSQL. See StreamHub, Krello, experience and contact.",
  },
  ui: {
    topbar: {
      quickJump: "Quick Jump",
      switchLang: "Switch language",
      blog: "Blog",
    },
    blog: {
      kicker: "// ENGINEERING NOTES",
      title: "Blog",
      subtitle: "Notes on the systems I build",
      description:
        "Engineering notes by Vũ Bảo Khanh: decoupled video transcoding with BullMQ and FFmpeg, JWT refresh token rotation, concurrency-safe Axios refresh and real-time systems.",
      back: "All posts",
      minRead: "{n} min read",
      empty: "No posts yet.",
      toc: "Table of Contents",
      sectionLink: "Link to section",
      author: {
        heading: "About the author",
        bio: "Fullstack Developer in Ho Chi Minh City. I build web applications with React, TypeScript, NestJS and PostgreSQL, with a focus on real-time systems, asynchronous processing, authentication and payments.",
        contact: "Get in touch",
      },
    },
    sidebar: {
      github: "GitHub",
      email: "Email",
      cv: "CV PDF",
      skills: "Technical Skills",
      contact: "Get in touch",
    },
    theme: { light: "Switch to light mode", dark: "Switch to dark mode" },
    contact: {
      kicker: "// CONTACT",
      title: "Let's work together",
      aside: "Open to fullstack opportunities",
      intro:
        "I'm open to Fullstack Developer roles (React, TypeScript, NestJS, PostgreSQL). Reach out through any channel below, or grab my CV.",
      email: "Email",
      phone: "Phone",
      github: "GitHub",
      location: "Location",
      copy: "Copy",
      open: "Open",
      call: "Call",
      downloadCv: "Download CV (PDF)",
    },
    arch: {
      kicker: "// ARCHITECTURE BLUEPRINT",
      title: "StreamHub: Decoupled Video Streaming Pipeline",
      hint: "Click any node to inspect parameters",
      diagram: "DIAGRAM: STREAMHUB_SYSTEM",
      diagramRight: "API ⟷ QUEUE ⟷ WORKER",
      responsibility: "RESPONSIBILITY",
      decision: "DESIGN DECISION",
      stack: "STACK",
      core: "CORE SERVICE",
      connections: "CONNECTIONS",
      show: "View architecture",
      hide: "Hide architecture",
      close: "Close",
      inspecting: "Inspecting {tag}",
    },
    tabs: { label: "Sections", hint: "Press 1–4 to switch" },
    projects: {
      kicker: "// SELECTED PROJECTS",
      title: "Personal Fullstack Projects",
      aside: "Real-time, async processing, auth & payments",
    },
    experience: {
      kicker: "// EXPERIENCE & EDUCATION",
      title: "Professional Experience",
      aside: "Roles and internship",
      work: "Work experience",
      education: "Education",
    },
    palette: {
      placeholder: "Type a command... (e.g. experience, projects, copy)",
      esc: "ESC",
      footerLeft: "Navigation: Click or Enter",
      footerRight: "Minimal Engineering Spec",
      viewHint: "View {n}",
      clipboard: "Clipboard",
      copyEmail: "Copy Primary Email",
      switchTo: "Switch to {view}",
    },
    toast: {
      copied: "Copied {email} to clipboard",
      copyFailed: "Could not copy - {email}",
    },
  },
  profile: {
    role: "Fullstack Developer",
    tagline: "React · TypeScript · NestJS · PostgreSQL",
    location: "Ho Chi Minh City, Vietnam",
    summary:
      "Fullstack Developer with hands-on experience building web applications using React, TypeScript, NestJS, and PostgreSQL through personal projects involving real-time systems, asynchronous processing, authentication, and payment integration. Familiar with Docker, Redis, Socket.IO, and CI/CD workflows. Currently developing and maintaining client websites in a professional PHP environment, with experience across development, deployment, and production troubleshooting.",
  },
  skills: [
    { label: "Languages", value: "TypeScript, JavaScript, PHP" },
    {
      label: "Frontend",
      value:
        "React, Next.js, Tailwind CSS, Mantine UI, Zustand, TanStack Query, dnd-kit",
    },
    {
      label: "Backend",
      value: "Node.js, NestJS, Prisma ORM, RESTful APIs, Socket.IO, BullMQ",
    },
    { label: "Databases & Caching", value: "PostgreSQL, MySQL, Redis" },
    {
      label: "Tools",
      value: "Docker, Git, JWT, OAuth 2.0, FCM, FFmpeg, HLS.js, Cloudflare R2",
    },
  ],
  views: [
    {
      key: "experience",
      index: "01",
      title: "Experience & Education",
      subtitle: "Roles, internship and studies",
      short: "Experience",
      description:
        "Work experience of Vũ Bảo Khanh: PHP Developer at BM WEB, Frontend Developer Intern at Cantho University Software Center, and web development studies at FPT Polytechnic.",
      paletteName: "Experience & Education",
    },
    {
      key: "projects",
      index: "02",
      title: "Selected Projects",
      subtitle: "StreamHub & Krello",
      short: "Projects",
      description:
        "Selected fullstack projects: StreamHub (video streaming with BullMQ, FFmpeg and HLS) and Krello (real-time Kanban with Socket.IO), built with React, NestJS and PostgreSQL.",
      paletteName: "Selected Projects",
    },
    {
      key: "contact",
      index: "03",
      title: "Contact",
      subtitle: "Email, phone and GitHub",
      short: "Contact",
      description:
        "Contact Vũ Bảo Khanh, Fullstack Developer in Ho Chi Minh City: email, phone, GitHub and a downloadable PDF CV.",
      paletteName: "Contact",
    },
  ],
  archTiers: streamhubArchTiers,
  nodeDetails: streamhubNodeDetails,
  projects: [
    {
      id: "streamhub",
      spec: "PROJECT_01 // FULLSTACK DEVELOPER",
      title: "StreamHub - Video Streaming Platform",
      period: "May 2026 - Present",
      links: [
        {
          label: "Live Demo",
          href: "https://streamhub.tforge.life",
          primary: true,
        },
      ],
      highlights: [
        "Developed a full-stack video streaming platform using React, NestJS, PostgreSQL, and Prisma, including user-facing features and an admin management system.",
        "Designed a decoupled video processing architecture, separating CPU-intensive transcoding tasks from the API server using BullMQ, Redis, and a standalone worker.",
        "Built an asynchronous video transcoding pipeline using BullMQ and FFmpeg to convert uploaded videos into Adaptive Bitrate HLS (360p–1080p) and store streaming assets on Cloudflare R2.",
        "Developed a custom HLS.js video player with adaptive quality selection, episode navigation, and cross-device watch-progress synchronization.",
        "Implemented JWT Refresh Token Rotation, Google OAuth 2.0, multi-device session management, and dynamic RBAC for authentication and permission-based access control.",
        "Integrated PayOS (VietQR) for subscription payments with signature verification and idempotent webhook handling to prevent duplicate transaction processing.",
        "Optimized frontend state and data fetching with Zustand and React Query, and containerized the API, transcoder, PostgreSQL, and Redis services using Docker.",
      ],
      facts: [
        { label: "STREAMING", value: "HLS 360p–1080p" },
        { label: "PROCESSING", value: "BullMQ + FFmpeg" },
        { label: "PAYMENTS", value: "PayOS (VietQR)" },
      ],
      tech: TECH_STREAMHUB,
      architecture: true,
      archData: {
        kicker: "// ARCHITECTURE BLUEPRINT",
        title: "STREAMHUB ARCHITECTURE",
        hint: "Click any node to inspect parameters",
        diagram: "DIAGRAM: STREAMHUB_SYSTEM",
        diagramRight: "API ⟷ QUEUE ⟷ WORKER",
        defaultNodeKey: "api",
        tiers: streamhubArchTiers,
        edges: STREAMHUB_EDGES,
        nodeDetails: streamhubNodeDetails,
      },
    },
    {
      id: "krello",
      spec: "PROJECT_02 // FULLSTACK DEVELOPER",
      title: "Krello - Real-Time Collaborative Task Management",
      period: "Sep 2025 - Dec 2025",
      links: [
        { label: "Live Demo", href: "https://krello.click/", primary: true },
        { label: "GitHub ↗", href: "https://github.com/vubaokhannh" },
      ],
      highlights: [
        "Developed a Trello-inspired fullstack task management platform, building RESTful APIs with NestJS/Prisma and interactive Kanban interfaces with React and @dnd-kit.",
        "Built real-time collaboration using Socket.IO and Redis, synchronizing board/card updates, comments, typing indicators, and multi-connection user presence across clients.",
        "Implemented drag-and-drop card/list ordering with position-based reordering while minimizing unnecessary database updates.",
        "Designed authentication and authorization with JWT access/refresh token rotation, device-based session management, Google OAuth 2.0, board-level permissions, and RBAC.",
        "Built a concurrency-safe Axios silent-refresh queue to handle simultaneous 401 responses and automatically retry pending requests after token renewal.",
        "Optimized data access with Prisma query optimization and Redis caching; integrated FCM push notifications, transactional emails, and image processing with Multer/Sharp.",
        "Automated deployment to an Ubuntu VM (Proxmox) using GitHub Actions, a self-hosted runner, SSH, PM2, and Cloudflare DNS.",
      ],
      facts: [
        { label: "REAL-TIME", value: "Socket.IO + Redis" },
        { label: "BOARD UX", value: "Kanban / dnd-kit" },
        { label: "DEPLOY", value: "GitHub Actions + PM2" },
      ],
      tech: TECH_KRELLO,
      architecture: true,
      archData: {
        kicker: "// REAL-TIME SYSTEM",
        title: "KRELLO ARCHITECTURE",
        hint: "Click any node to inspect collaborative architecture parameters",
        diagram: "DIAGRAM: KRELLO_COLLAB_SYSTEM",
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
      version: "Mar 2026 - PRESENT",
      role: "PHP Developer",
      company: "@ BM WEB Co., Ltd",
      bullets: [
        "Developed and customized numerous client websites using PHP, MySQL, JavaScript, and AJAX, translating business requirements from the Business team into technical implementation.",
        "Optimized website performance and SEO - improving slow MySQL queries, implementing caching strategies, reducing page load time, and applying on-page SEO best practices (meta tags, sitemap, structured data).",
        "Ensured responsive, cross-browser compatible interfaces, delivering consistent user experience across devices and browsers.",
        "Managed the full website lifecycle from development and deployment to ongoing maintenance, feature updates, and bug fixes, including SMTP email configuration for contact forms and notifications.",
        "Deployed and maintained production environments: configured domains, DNS, SSL certificates, databases, and cPanel hosting; diagnosed and resolved issues across both application and server layers to ensure site stability.",
      ],
      tone: "current",
    },
    {
      version: "May 2025 - Aug 2025",
      role: "Frontend Developer Intern",
      company: "@ Cantho University Software Center",
      bullets: [
        "Developed responsive web interfaces using Next.js, Mantine UI, and Tailwind CSS.",
        "Integrated RESTful APIs with Axios to display and update application data.",
        "Built reusable UI components and implemented frontend state handling.",
        "Collaborated with backend developers to integrate APIs, debug issues, and deliver assigned features.",
      ],
      tone: "mid",
    },
  ],
  education: [
    {
      period: "Aug 2023 - Aug 2025",
      school: "FPT Polytechnic Can Tho",
      program: "Web Development",
      gpa: "GPA: 3.75/4.0",
    },
  ],
};
