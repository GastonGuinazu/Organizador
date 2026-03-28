"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

function IconSun({ className }: { className?: string }) {
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
    </svg>
  );
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M9.528 2.257a.75.75 0 01.718.515 9.5 9.5 0 0010.445 10.445a.75.75 0 01-1.045.934A11.5 11.5 0 116.315 4.259a.75.75 0 01.934 1.045 9.47 9.47 0 00-2.72 7.324 9.5 9.5 0 007.324-2.72z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const iconClass = "h-5 w-5";

type ThemeChoice = "light" | "dark";

/** Opciones Claro/Oscuro para menús desplegables (p. ej. barra en móvil). */
export function ThemeToggleMenuList({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={`space-y-1 px-1 py-1 ${className}`} aria-hidden>
        <div className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  const active: ThemeChoice = theme === "dark" ? "dark" : "light";
  const segments: { value: ThemeChoice; label: string; Icon: typeof IconSun }[] = [
    { value: "light", label: "Claro", Icon: IconSun },
    { value: "dark", label: "Oscuro", Icon: IconMoon },
  ];

  return (
    <div className={className} role="group" aria-label="Apariencia">
      <p className="px-3 pb-1 text-xs font-medium text-slate-500 dark:text-slate-400">Tema</p>
      <div className="flex flex-col gap-1">
        {segments.map(({ value, label, Icon }) => {
          const isOn = active === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              aria-pressed={isOn}
              className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                isOn
                  ? "bg-teal-600 text-white dark:bg-teal-500"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className={iconClass} aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const active: ThemeChoice = theme === "dark" ? "dark" : "light";

  if (!mounted) {
    return (
      <div
        className={`inline-flex h-11 items-center rounded-xl border border-slate-200 bg-slate-100/80 px-1 dark:border-slate-700 dark:bg-slate-800/50 ${className}`}
        aria-hidden
      >
        <span className="h-9 w-9 rounded-lg" />
        <span className="h-9 w-9 rounded-lg" />
      </div>
    );
  }

  const segments: { value: ThemeChoice; label: string; Icon: typeof IconSun }[] = [
    { value: "light", label: "Claro", Icon: IconSun },
    { value: "dark", label: "Oscuro", Icon: IconMoon },
  ];

  return (
    <div
      role="group"
      aria-label="Apariencia"
      className={`inline-flex h-11 items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-100/90 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 ${className}`}
    >
      {segments.map(({ value, label, Icon }) => {
        const isOn = active === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-label={label}
            aria-pressed={isOn}
            title={label}
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              isOn
                ? "bg-teal-600 text-white shadow-sm dark:bg-teal-500"
                : "text-slate-600 hover:bg-white/80 dark:text-slate-300 dark:hover:bg-slate-700/80"
            }`}
          >
            <Icon className={iconClass} />
          </button>
        );
      })}
    </div>
  );
}
