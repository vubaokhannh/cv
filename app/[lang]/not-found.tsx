"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NotFound() {
  const pathname = usePathname() || "";
  const isEn = pathname.startsWith("/en");
  const lang = isEn ? "en" : "vi";

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-dot-grid">
      <div className="bg-white border border-blueprint-200 rounded-lg max-w-md w-full p-6 sm:p-8 shadow-2xs">
        <div className="text-[11px] font-mono uppercase tracking-widest text-blueprint-400 mb-2">
          {"// HTTP 404 · NOT FOUND"}
        </div>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-blueprint-950 mb-2">
          {isEn ? "Page Not Found" : "Trang không tồn tại"}
        </h1>
        <p className="text-xs text-blueprint-600 font-mono leading-relaxed mb-6">
          {isEn
            ? "The page you requested does not exist or has been moved."
            : "Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển."}
        </p>
        <div className="flex gap-3 font-mono text-xs">
          <Link
            href={`/${lang}`}
            className="px-3 py-1.5 bg-blueprint-900 text-white rounded hover:bg-blueprint-950 transition-colors"
          >
            {isEn ? "← Back to Home" : "← Về trang chủ"}
          </Link>
          <Link
            href={`/${lang}/blog`}
            className="px-3 py-1.5 border border-blueprint-200 bg-white rounded hover:bg-blueprint-50 text-blueprint-800 transition-colors"
          >
            {isEn ? "Browse Blog" : "Xem Blog"}
          </Link>
        </div>
      </div>
    </div>
  );
}
