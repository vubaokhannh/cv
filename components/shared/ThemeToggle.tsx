"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

const STORAGE_KEY = "theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

const getDark = () => document.documentElement.classList.contains("dark");

/** Light/dark switch. The initial class is set by an inline script in the layout (no flash). */
export default function ThemeToggle({
  lightLabel,
  darkLabel,
}: {
  lightLabel: string;
  darkLabel: string;
}) {
  const dark = useSyncExternalStore(subscribe, getDark, () => false);

  const toggle = () => {
    const next = !getDark();
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* storage unavailable: theme still applies for this session */
    }
  };

  const label = dark ? lightLabel : darkLabel;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="flex items-center justify-center w-7 h-7 rounded border border-blueprint-200 bg-white hover:bg-blueprint-50 text-blueprint-800 transition-colors"
    >
      {dark ? <Sun /> : <Moon />}
    </button>
  );
}
