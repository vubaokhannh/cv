import type { ArchEdge } from "./types";

// Data-flow between diagram nodes. Labels are short technical terms, so they
// are shared by every language. Direction: `from` → `to`.

export const STREAMHUB_EDGES: ArchEdge[] = [
  { from: "player", to: "api", label: "REST" },
  { from: "state", to: "api", label: "fetch" },
  { from: "api", to: "auth", label: "verify" },
  { from: "api", to: "queue", label: "enqueue" },
  { from: "queue", to: "worker", label: "job" },
  { from: "worker", to: "r2", label: "HLS upload" },
  { from: "api", to: "postgres", label: "Prisma" },
  { from: "payos", to: "api", label: "webhook" },
  { from: "r2", to: "player", label: "HLS stream" },
];

export const KRELLO_EDGES: ArchEdge[] = [
  { from: "kanban", to: "krello_api", label: "REST" },
  { from: "socket_client", to: "socket_gateway", label: "WebSocket" },
  { from: "krello_api", to: "krello_auth", label: "JWT" },
  { from: "socket_gateway", to: "krello_redis", label: "pub/sub" },
  { from: "krello_api", to: "krello_redis", label: "cache" },
  { from: "krello_api", to: "krello_db", label: "Prisma" },
  { from: "krello_api", to: "notifications", label: "FCM / SMTP" },
  { from: "krello_api", to: "media", label: "upload" },
];
