"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle, ThemeToggleMenuList } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Actividades" },
  { href: "/dashboard/notes", label: "Resúmenes" },
  { href: "/dashboard/tags", label: "Etiquetas" },
  { href: "/dashboard/notifications", label: "Avisos" },
  { href: "/dashboard/settings", label: "Ajustes" },
] as const;

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/notes") {
    return pathname === "/dashboard/notes" || pathname.startsWith("/dashboard/notes/");
  }
  if (href === "/dashboard/tags") {
    return pathname === "/dashboard/tags" || pathname.startsWith("/dashboard/tags/");
  }
  if (href === "/dashboard/notifications") {
    return pathname.startsWith("/dashboard/notifications");
  }
  if (href === "/dashboard/settings") {
    return pathname.startsWith("/dashboard/settings");
  }
  if (href === "/dashboard") {
    if (pathname.startsWith("/dashboard/notes")) return false;
    if (pathname.startsWith("/dashboard/tags")) return false;
    if (pathname.startsWith("/dashboard/notifications")) return false;
    if (pathname.startsWith("/dashboard/settings")) return false;
    return pathname.startsWith("/dashboard");
  }
  return false;
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden
    >
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

const navLinkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900";

export function AppNav({ email }: { email: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      const el = menuRef.current;
      if (!el?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white pt-[max(0px,env(safe-area-inset-top))] dark:border-slate-800 dark:bg-slate-900">
      <div ref={menuRef} className="app-safe-x mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3 py-4">
          <Link
            href="/dashboard"
            className="shrink-0 text-lg font-semibold tracking-tight text-teal-700 dark:text-teal-400"
            onClick={() => setMenuOpen(false)}
          >
            Organizador
          </Link>

          <nav
            className="hidden items-center md:flex"
            aria-label="Secciones"
          >
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
              {NAV_ITEMS.map(({ href, label }) => {
                const active = isNavItemActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`${navLinkFocus} rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-white text-teal-700 shadow-sm dark:bg-slate-900 dark:text-teal-400"
                        : "text-slate-600 hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-400"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <NotificationBell />
            <ThemeToggle className="shrink-0" />
            <span className="hidden max-w-[200px] truncate text-sm text-slate-600 dark:text-slate-300 md:inline">
              {email}
            </span>
            <Button type="button" variant="ghost" onClick={() => signOut({ callbackUrl: "/" })}>
              Salir
            </Button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <NotificationBell />
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 min-w-11 gap-0 px-0"
              aria-expanded={menuOpen}
              aria-controls="dashboard-mobile-menu"
              aria-haspopup="true"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <IconMenu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {menuOpen ? (
          <div
            id="dashboard-mobile-menu"
            className="border-t border-slate-200 py-3 dark:border-slate-800 md:hidden"
            role="region"
            aria-label="Menú de la aplicación"
          >
            <p className="mb-2 truncate px-3 text-xs text-slate-500 dark:text-slate-400" title={email}>
              {email}
            </p>
            <nav className="flex flex-col gap-1 px-1" aria-label="Secciones">
              {NAV_ITEMS.map(({ href, label }) => {
                const active = isNavItemActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`${navLinkFocus} flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors ${
                      active
                        ? "bg-slate-100 text-teal-700 dark:bg-slate-800 dark:text-teal-400"
                        : "text-slate-700 hover:bg-slate-100 hover:text-teal-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-teal-400"
                    }`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
            <hr className="my-3 border-slate-200 dark:border-slate-700" />
            <ThemeToggleMenuList />
            <hr className="my-3 border-slate-200 dark:border-slate-700" />
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 w-full justify-start px-3"
              onClick={() => {
                setMenuOpen(false);
                signOut({ callbackUrl: "/" });
              }}
            >
              Salir
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
