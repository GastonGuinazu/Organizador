import type { ItemPayload } from "@/lib/item-service";

/** Serializa un ítem (Dates a ISO) para pasarlo a componentes cliente. */
export function itemToPlain(item: ItemPayload) {
  return JSON.parse(JSON.stringify(item)) as ItemPayloadPlain;
}

export type ItemPayloadPlain = Omit<
  ItemPayload,
  "dueAt" | "completedAt" | "createdAt" | "updatedAt" | "reminders" | "checklistItems" | "itemTags"
> & {
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reminders: Array<{
    id: string;
    itemId: string;
    offsetMinutes: number;
    fireAt: string | null;
    sentAt: string | null;
    createdAt: string;
  }>;
  checklistItems: Array<{
    id: string;
    itemId: string;
    title: string;
    done: boolean;
    sortOrder: number;
  }>;
  itemTags: Array<{
    itemId: string;
    tagId: string;
    tag: { id: string; userId: string; name: string; color: string | null; createdAt: string };
  }>;
};
