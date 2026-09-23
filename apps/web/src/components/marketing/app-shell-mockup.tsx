import Image from "next/image";
import {
  LayoutDashboard,
  CalendarDays,
  NotebookPen,
  ListOrdered,
  BarChart3,
  Landmark,
  BookText,
  BookOpen,
  ListChecks,
  LogOut,
} from "lucide-react";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: CalendarDays, label: "Calendar" },
  { icon: NotebookPen, label: "Daily journal" },
  { icon: ListOrdered, label: "Trades" },
  { icon: BarChart3, label: "Reports" },
  { icon: Landmark, label: "Prop firms" },
  { icon: BookText, label: "Notebook" },
  { icon: BookOpen, label: "Playbooks" },
  { icon: ListChecks, label: "Progress" },
];

/** Mirrors the real app shell (components/shell.tsx) — sidebar nav + top bar. */
export function AppShellMockup({
  title,
  active = "Dashboard",
  actions,
  children,
}: {
  title: string;
  active?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#2a3245] bg-[#141820] shadow-2xl shadow-black/40">
      <div className="flex">
        <aside className="hidden w-44 shrink-0 flex-col border-r border-[#2a3245] md:flex">
          <div className="flex h-12 items-center gap-2 border-b border-[#2a3245] px-3">
            <Image src="/logo.png" alt="mndjournal" width={262} height={238} className="h-4 w-auto" />
            <span className="text-xs font-semibold text-white">mndjournal</span>
          </div>
          <nav className="flex-1 space-y-0.5 p-2">
            {NAV.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${
                  item.label === active
                    ? "bg-[#1c2230] font-medium text-white"
                    : "text-[#7d879e]"
                }`}
              >
                <item.icon className={`h-3.5 w-3.5 ${item.label === active ? "text-[#4d8dff]" : ""}`} />
                {item.label}
              </div>
            ))}
          </nav>
          <div className="border-t border-[#2a3245] p-2">
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-[#7d879e]">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between border-b border-[#2a3245] px-4 py-3">
            <span className="text-sm font-semibold text-white">{title}</span>
            {actions}
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
