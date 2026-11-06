"use client";

import { usePathname } from "next/navigation";
import NotFoundCard from "@/components/shared/NotFoundCard";

export default function NotFound() {
  const lang = (usePathname() || "").startsWith("/en") ? "en" : "vi";
  return <NotFoundCard lang={lang} />;
}
