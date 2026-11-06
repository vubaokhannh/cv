// Language-independent facts taken from the CV.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://vubaokhanh.tech"
).replace(/\/+$/, "");

export const CONTACT = {
  name: "Vũ Bảo Khanh",
  email: "vubaokhanh2311@gmail.com",
  phone: "+84949542325",
  github: "https://github.com/vubaokhannh",
  cvHref: "/Vu-Bao-Khanh-CV.pdf",
} as const;

export const EMAIL = CONTACT.email;

export const TECH_STREAMHUB = [
  "React",
  "TypeScript",
  "NestJS",
  "PostgreSQL",
  "Prisma ORM",
  "Redis",
  "BullMQ",
  "FFmpeg",
  "HLS.js",
  "Cloudflare R2",
  "Zustand",
  "TanStack Query",
  "Docker",
];

export const TECH_KRELLO = [
  "React",
  "TypeScript",
  "NestJS",
  "PostgreSQL",
  "Prisma ORM",
  "Redis",
  "Socket.IO",
  "Zustand",
  "@dnd-kit",
  "JWT",
  "FCM",
  "Docker",
];
