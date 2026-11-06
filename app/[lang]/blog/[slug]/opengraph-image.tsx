import { ImageResponse } from "next/og";
import { getPost } from "@/lib/blog";
import { CONTACT } from "@/lib/constants";
import { hasLocale } from "@/lib/i18n";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const post = hasLocale(lang) ? await getPost(lang, slug) : null;

  const title = post?.title ?? "Technical Blog - Vũ Bảo Khanh";
  const summary =
    post?.summary ??
    "Notes on system architecture, real-time sync & streaming.";
  const date = post?.date ?? "";
  const minutes = post?.minutes ?? 3;
  const tags = post?.tags ?? [];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#090d16",
        padding: "54px 60px",
        fontFamily: "ui-monospace, Menlo, Monaco, monospace",
        color: "#f8fafc",
        border: "12px solid #1e293b",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #334155",
          paddingBottom: "20px",
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
              width: "12px",
              height: "12px",
              backgroundColor: "#38bdf8",
              borderRadius: "2px",
            }}
          />
          <span
            style={{
              fontSize: "16px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "#94a3b8",
            }}
          >
            VUBAOKHANH.TECH // TECHNICAL NOTES
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "15px",
            color: "#64748b",
          }}
        >
          {date && <span>{date}</span>}
          <span>•</span>
          <span>{minutes} MIN READ</span>
        </div>
      </div>

      {/* Post title & summary */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          margin: "auto 0",
        }}
      >
        <h1
          style={{
            fontSize: title.length > 55 ? "44px" : "54px",
            fontWeight: 800,
            color: "#ffffff",
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            fontFamily: "sans-serif",
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontSize: "20px",
            color: "#94a3b8",
            margin: 0,
            lineHeight: 1.45,
            fontFamily: "sans-serif",
          }}
        >
          {summary}
        </p>

        {tags.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "6px",
            }}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "13px",
                  padding: "4px 10px",
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "4px",
                  color: "#38bdf8",
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom author info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #334155",
          paddingTop: "20px",
          fontSize: "15px",
          color: "#64748b",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ color: "#ffffff", fontWeight: 700 }}>
            {CONTACT.name}
          </span>
          <span>•</span>
          <span>Fullstack Developer</span>
        </div>
        <span style={{ color: "#38bdf8" }}>github.com/vubaokhannh</span>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
