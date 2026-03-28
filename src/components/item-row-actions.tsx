"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  deleteItem,
  toggleItemArchived,
  toggleItemComplete,
} from "@/app/dashboard/actions";

type Props = {
  id: string;
  completed: boolean;
  archived: boolean;
};

export function ItemRowActions({ id, completed, archived }: Props) {
  const [pending, start] = useTransition();

  const compact =
    "shrink-0 whitespace-nowrap px-2.5 text-xs sm:px-4 sm:text-sm";

  return (
    <div
      className="flex min-w-0 max-w-full flex-nowrap items-center gap-1 overflow-x-auto py-0.5 sm:gap-2"
      role="toolbar"
      aria-label="Acciones del ítem"
    >
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        className={compact}
        onClick={() => start(() => toggleItemComplete(id, !completed))}
      >
        {completed ? "Reabrir" : "Completar"}
      </Button>
      <Link
        href={`/dashboard/items/${id}`}
        className={`inline-flex min-h-11 items-center justify-center rounded-xl font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 ${compact}`}
      >
        Editar
      </Link>
      <Button
        type="button"
        variant="ghost"
        disabled={pending}
        className={compact}
        onClick={() => start(() => toggleItemArchived(id, !archived))}
      >
        {archived ? "Desarchivar" : "Archivar"}
      </Button>
      <Button
        type="button"
        variant="danger"
        disabled={pending}
        className={compact}
        onClick={() => {
          if (confirm("¿Eliminar esta actividad? No se puede deshacer.")) {
            start(() => deleteItem(id));
          }
        }}
      >
        Eliminar
      </Button>
    </div>
  );
}
