import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import NotFoundCard from "@/components/shared/NotFoundCard";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});
const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "404 — Vũ Bảo Khanh",
  robots: { index: false, follow: false },
};

// Same theme bootstrap as the main layout (this page bypasses it).
const THEME_INIT = `try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

/** 404 for URLs that match no route at all (the language is unknown here). */
export default function GlobalNotFound() {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${inter.variable} ${mono.variable}`}
    >
      <body className="bg-blueprint-50 text-blueprint-900 font-sans antialiased">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT}
        </Script>
        <NotFoundCard />
      </body>
    </html>
  );
}
