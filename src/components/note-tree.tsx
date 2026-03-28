"use client";

import Link from "next/link";
import type { NotePageTreeNode } from "@/lib/note-pages";

export function collectNoteTreeIds(nodes: NotePageTreeNode[]): string[] {
  return nodes.flatMap((n) => [n.id, ...collectNoteTreeIds(n.children)]);
}

type Props = {
  nodes: NotePageTreeNode[];
  currentId: string;
  depth: number;
  expanded: Set<string>;
  toggle: (id: string) => void;
};

export function NoteTree({ nodes, currentId, depth, expanded, toggle }: Props) {
  return (
    <ul className={depth === 0 ? "space-y-0.5" : "mt-0.5 space-y-0.5 border-l border-slate-200 pl-2 dark:border-slate-700"}>
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const isOpen = expanded.has(node.id);
        const isCurrent = node.id === currentId;
        return (
          <li key={node.id}>
            <div className="flex min-h-11 items-center gap-0.5 rounded-lg">
              {hasChildren ? (
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-label={isOpen ? "Contraer" : "Expandir"}
                  className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  onClick={() => toggle(node.id)}
                >
                  <span className="text-xs" aria-hidden>
                    {isOpen ? "▼" : "▶"}
                  </span>
                </button>
              ) : (
                <span className="w-9 shrink-0" aria-hidden />
              )}
              <Link
                href={`/dashboard/notes/${node.id}`}
                className={`min-h-11 flex-1 truncate rounded-lg px-2 py-2.5 text-sm leading-tight ${
                  isCurrent
                    ? "bg-teal-50 font-semibold text-teal-800 dark:bg-teal-950/50 dark:text-teal-200"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {node.title || "Sin título"}
              </Link>
            </div>
            {hasChildren && isOpen ? (
              <NoteTree
                nodes={node.children}
                currentId={currentId}
                depth={depth + 1}
                expanded={expanded}
                toggle={toggle}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
