import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { CONTACT } from "@/lib/constants";
import { getContent } from "@/lib/content";
import { hasLocale } from "@/lib/i18n";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export const alt = "Vũ Bảo Khanh - Fullstack Developer";

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { profile } = getContent(lang);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#090d16",
        padding: "60px",
        fontFamily: "ui-monospace, Menlo, Monaco, monospace",
        color: "#f8fafc",
        border: "12px solid #1e293b",
      }}
    >
      {/* Top brand bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #334155",
          paddingBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "14px",
              height: "14px",
              backgroundColor: "#38bdf8",
              borderRadius: "2px",
            }}
          />
          <span
            style={{
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "#94a3b8",
            }}
          >
            VUBAOKHANH.TECH // PORTFOLIO & CV
          </span>
        </div>
        <span
          style={{
            fontSize: "16px",
            color: "#64748b",
            letterSpacing: "0.1em",
          }}
        >
          {lang.toUpperCase()}
        </span>
      </div>

      {/* Center content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          margin: "auto 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              padding: "4px 12px",
              backgroundColor: "#1e293b",
              border: "1px solid #475569",
              borderRadius: "4px",
              color: "#38bdf8",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {profile.role}
          </span>
          <span
            style={{
              fontSize: "14px",
              color: "#64748b",
            }}
          >
            {profile.location}
          </span>
        </div>

        <h1
          style={{
            fontSize: "64px",
            fontWeight: 800,
            color: "#ffffff",
            margin: 0,
            letterSpacing: "-0.03em",
            fontFamily: "sans-serif",
          }}
        >
          {CONTACT.name}
        </h1>

        <p
          style={{
            fontSize: "22px",
            color: "#94a3b8",
            margin: 0,
            lineHeight: 1.4,
            fontFamily: "sans-serif",
          }}
        >
          React • TypeScript • NestJS • PostgreSQL • Redis • Docker
        </p>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "8px",
          }}
        >
          {[
            "Real-time Systems",
            "Decoupled Video Transcoding",
            "HLS Streaming",
          ].map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: "13px",
                padding: "4px 10px",
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "4px",
                color: "#cbd5e1",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #334155",
          paddingTop: "24px",
          fontSize: "15px",
          color: "#64748b",
        }}
      >
        <div style={{ display: "flex", gap: "24px" }}>
          <span>Email: {CONTACT.email}</span>
        </div>
        <span style={{ color: "#38bdf8" }}>github.com/vubaokhannh</span>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
