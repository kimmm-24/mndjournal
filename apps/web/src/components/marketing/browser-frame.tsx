export function BrowserFrame({
  url = "app.mndjournal.com",
  children,
}: {
  url?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#2a3245] bg-[#1c2230] shadow-2xl shadow-black/40">
      <div className="flex items-center gap-3 border-b border-[#2a3245] bg-[#141820] px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e05555]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f2c94c]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#4d8dff]/70" />
        </div>
        <div className="mx-auto rounded-md bg-[#1c2230] px-3 py-1 text-[11px] text-[#6b7590]">
          {url}
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}
