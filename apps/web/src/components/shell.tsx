"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { FILTER_KEYS } from "@luxalgo/journal-core";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  BookText,
  CalendarDays,
  Import,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  NotebookPen,
  Settings,
  ListChecks,
  BookmarkPlus,
  CreditCard,
  Wallet,
  Landmark,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { ENTITLEMENT_CHANGED_EVENT, type Entitlement } from "@/lib/plan";
import { useApi } from "@/lib/use-api";
import { PrivacyToggle } from "./privacy";
import { ThemeToggle } from "./theme";
import { PageTransition } from "./page-transition";
import { Button } from "./ui/button";
import { HoverHint } from "./ui/tooltip";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/journal", label: "Daily journal", icon: NotebookPen },
  { href: "/trades", label: "Trades", icon: ListOrdered },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/prop-firms", label: "Prop firms", icon: Landmark },
  { href: "/notebook", label: "Notebook", icon: BookText },
  { href: "/playbooks", label: "Playbooks", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: ListChecks },
  { href: "/missed", label: "Missed trades", icon: BookmarkPlus },
] as const;

const NAV_SETUP = [
  { href: "/import", label: "Import", icon: Import },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

const SIDEBAR_COLLAPSED_KEY = "journal-sidebar-collapsed-v1";

// Public marketing/auth routes render their own layout — no sidebar chrome.
const PUBLIC_SHELL_BYPASS = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/pricing",
  "/terms",
  "/privacy",
  "/contact",
]);

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed = false,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  collapsed?: boolean;
}) {
  return (
    <HoverHint content={collapsed ? label : null} side="right">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "journal-sidebar-nav-link relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
          active
            ? "bg-accent font-medium text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        )}
      >
        <Icon className={cn("h-4 w-4", active && "text-brand")} />
        <span className="journal-sidebar-label">{label}</span>
      </Link>
    </HoverHint>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarReady, setSidebarReady] = useState(false);
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  useEffect(() => {
    const read = () => {
      try {
        setSidebarCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
      } catch {
        setSidebarCollapsed(false);
      } finally {
        setSidebarReady(true);
      }
    };
    read();
    const sync = (event: StorageEvent) => {
      if (event.key === SIDEBAR_COLLAPSED_KEY || event.key === null) read();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "b") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      toggleSidebar();
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await authClient.signOut();
    } finally {
      router.push("/login");
      router.refresh();
    }
  }
  function toggleSidebar() {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // The interaction still works when storage is unavailable.
      }
      return next;
    });
  }
  const filterQuery = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = search.get(key);
    if (value) filterQuery.set(key, value);
  }
  if (search.get("range")) filterQuery.set("range", search.get("range")!);
  if (PUBLIC_SHELL_BYPASS.has(pathname)) return <>{children}</>;
  const navigation = (collapsed = false) => (
    <nav
      aria-label="Journal navigation"
      className="journal-sidebar-navigation min-h-0 flex-1 space-y-0.5 overflow-x-hidden overflow-y-auto overscroll-contain p-2"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a")) setMenuOpen(false);
      }}
    >
      {NAV.map(({ href, label, icon }) => (
        <NavLink
          key={href}
          href={href === "/prop-firms" ? href : filterQuery.size ? `${href}?${filterQuery}` : href}
          label={label}
          icon={icon}
          collapsed={collapsed}
          active={href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)}
        />
      ))}
      <div className="!my-3 border-t" />
      {NAV_SETUP.map(({ href, label, icon }) => (
        <NavLink
          key={href}
          href={filterQuery.size ? `${href}?${filterQuery}` : href}
          label={label}
          icon={icon}
          collapsed={collapsed}
          active={pathname.startsWith(href)}
        />
      ))}
    </nav>
  );
  const footer = (
    <div className="journal-sidebar-footer border-t p-3">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        <div>Not investment advice.</div>
      </div>
    </div>
  );
  return (
    <div className="journal-shell min-h-dvh lg:flex">
      <header className="journal-mobile-header sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur lg:hidden">
        <DialogPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <DialogPrimitive.Trigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="Open navigation"
            >
              <Menu />
            </Button>
          </DialogPrimitive.Trigger>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="journal-nav-overlay fixed inset-0 z-40 bg-black/55 backdrop-blur-sm" />
            <DialogPrimitive.Content
              className="journal-nav-drawer fixed inset-y-0 left-0 z-50 flex w-[min(288px,calc(100vw-40px))] flex-col border-r bg-card shadow-2xl"
              aria-describedby={undefined}
            >
              <div className="flex h-14 shrink-0 items-center gap-2.5 border-b px-4">
                <Image
                  src="/logo.png"
                  alt="mndjournal"
                  width={262}
                  height={238}
                  className="h-[18px] w-auto"
                />
                <DialogPrimitive.Title className="text-sm font-semibold">
                  mndjournal
                </DialogPrimitive.Title>
                <DialogPrimitive.Close asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-8 w-8"
                    aria-label="Close navigation"
                  >
                    <X />
                  </Button>
                </DialogPrimitive.Close>
              </div>
              {navigation()}
              <div className="border-t p-3">
                <PrivacyToggle />
              </div>
              {footer}
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
        <Link
          href="/dashboard"
          className="mr-auto flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <Image
            src="/logo.png"
            alt="mndjournal"
            width={262}
            height={238}
            className="hidden h-4 w-auto shrink-0 min-[380px]:block"
          />
          <span className="truncate">mndjournal</span>
        </Link>
        <PrivacyToggle compact />
        <ThemeToggle iconOnly />
      </header>
      <aside
        className="journal-desktop-sidebar sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-card/50 lg:flex"
        data-collapsed={sidebarCollapsed}
        data-ready={sidebarReady}
      >
        <div className="journal-sidebar-header relative flex h-14 shrink-0 items-center border-b">
          <Link
            href="/dashboard"
            className="journal-sidebar-home flex h-full min-w-0 items-center gap-2.5"
          >
            <Image
              src="/logo.png"
              alt="mndjournal"
              width={262}
              height={238}
              className="h-[18px] w-auto shrink-0"
            />
            <span className="journal-sidebar-brand-label text-sm font-semibold tracking-tight">
              mndjournal
            </span>
          </Link>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="journal-sidebar-trigger absolute h-7 w-7 rounded-full bg-background shadow-sm"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!sidebarCollapsed}
            aria-keyshortcuts="Meta+B Control+B"
            title={`${sidebarCollapsed ? "Expand" : "Collapse"} sidebar (⌘B)`}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-3.5 w-3.5" />
            ) : (
              <PanelLeftClose className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        {navigation(sidebarCollapsed)}
        <div className="journal-sidebar-privacy border-t p-3">
          <div className="w-full space-y-1">
            <ThemeToggle iconOnly={sidebarCollapsed} />
            <PrivacyToggle iconOnly={sidebarCollapsed} />
          </div>
        </div>
        {footer}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <PlanBanner />
        <PageTransition>{children}</PageTransition>
      </div>
    </div>
  );
}

/** Days before a paid period ends that the renewal reminder starts showing. */
const RENEWAL_REMINDER_DAYS = 5;

/**
 * Trial countdown / renewal reminder / read-only notice above every app page.
 * Refetches on navigation and whenever the billing page reports a payment, so
 * it never lags behind what the server enforces.
 */
function PlanBanner() {
  const pathname = usePathname();
  const { data, refresh } = useApi<Entitlement>("/api/plan");
  useEffect(() => {
    window.addEventListener(ENTITLEMENT_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(ENTITLEMENT_CHANGED_EVENT, refresh);
  }, [refresh]);
  const firstPath = useRef(pathname);
  useEffect(() => {
    if (firstPath.current === pathname) return;
    firstPath.current = pathname;
    refresh();
  }, [pathname, refresh]);

  if (!data || pathname.startsWith("/billing")) return null;
  const days = data.endsAt
    ? Math.max(0, Math.ceil((Date.parse(data.endsAt) - Date.now()) / 86_400_000))
    : null;
  let text: string | null = null;
  if (data.readOnly) {
    text = data.wasTrial
      ? "Your free trial has ended — your journal is read-only."
      : "Your plan has ended — your journal is read-only.";
  } else if (data.status === "trial" && days !== null) {
    text = `Free trial: ${days} day${days === 1 ? "" : "s"} left.`;
  } else if (data.status === "active" && days !== null && days <= RENEWAL_REMINDER_DAYS) {
    text = `Your plan ends in ${days} day${days === 1 ? "" : "s"}.`;
  }
  if (!text) return null;
  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2 text-sm",
        data.readOnly ? "bg-loss/10 text-loss" : "bg-brand/10 text-foreground",
      )}
    >
      <span>{text}</span>
      <Link href="/billing" className="font-medium underline underline-offset-4">
        {data.readOnly ? "Choose a plan" : data.status === "trial" ? "See plans" : "Extend"}
      </Link>
    </div>
  );
}
