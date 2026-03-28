"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: string;
};

export function PasswordField({ label, id, error, className = "", ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const genId = useId();
  const inputId = id ?? props.name ?? genId;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          className={`min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-[4.5rem] text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${className}`}
          {...props}
        />
        <button
          type="button"
          className="absolute right-1.5 top-1/2 min-h-9 min-w-11 -translate-y-1/2 rounded-lg px-2 text-sm font-medium text-teal-700 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:text-teal-400 dark:hover:bg-teal-950/40"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {visible ? "Ocultar" : "Ver"}
        </button>
      </div>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
