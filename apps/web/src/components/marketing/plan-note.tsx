import { Check, Lock } from "lucide-react";

export function PlanNote({ tone, children }: { tone: "all" | "pro"; children: React.ReactNode }) {
  const Icon = tone === "all" ? Check : Lock;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
        tone === "all"
          ? "border-[#4d8dff]/30 bg-[#4d8dff]/10 text-[#4d8dff]"
          : "border-[#2a3245] bg-[#1c2230] text-[#9aa4b8]"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}
