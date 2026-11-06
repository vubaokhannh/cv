import { CheckCircle } from "@phosphor-icons/react";

export default function Toast({
  message,
  visible,
}: {
  message: string;
  visible: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 right-4 left-4 sm:left-auto sm:right-5 z-50 bg-blueprint-900 text-white font-mono text-xs px-3.5 py-2.5 rounded shadow-lg flex items-center gap-2 transform transition-all duration-200 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
      }`}
    >
      <CheckCircle className="text-emerald-400 text-sm" />
      <span>{message}</span>
    </div>
  );
}
