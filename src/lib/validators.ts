import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  name: z.string().max(120).optional(),
});

const hhmmOrEmpty = z.union([
  z.literal(""),
  z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "Usá formato HH:mm (24 h)"),
]);

export const userSettingsPatchSchema = z
  .object({
    reminderEmailEnabled: z.boolean().optional(),
    reminderSmsEnabled: z.boolean().optional(),
    notificationEmail: z.union([z.string().email(), z.literal("")]).optional(),
    notificationPhone: z.union([z.string().max(40), z.literal("")]).optional(),
    quietHoursStart: hhmmOrEmpty.optional(),
    quietHoursEnd: hhmmOrEmpty.optional(),
  })
  .refine(
    (d) =>
      d.reminderEmailEnabled !== undefined ||
      d.reminderSmsEnabled !== undefined ||
      d.notificationEmail !== undefined ||
      d.notificationPhone !== undefined ||
      d.quietHoursStart !== undefined ||
      d.quietHoursEnd !== undefined,
    { message: "Nada que actualizar" },
  )
  .superRefine((d, ctx) => {
    const hasS = d.quietHoursStart !== undefined;
    const hasE = d.quietHoursEnd !== undefined;
    if (hasS !== hasE) {
      ctx.addIssue({
        code: "custom",
        message: "Horario silencioso: enviá inicio y fin en el mismo guardado.",
        path: ["quietHoursEnd"],
      });
      return;
    }
    if (hasS && hasE) {
      const s = (d.quietHoursStart ?? "").trim();
      const e = (d.quietHoursEnd ?? "").trim();
      if (Boolean(s) !== Boolean(e)) {
        ctx.addIssue({
          code: "custom",
          message: "Completá inicio y fin, o vaciá ambos.",
          path: ["quietHoursEnd"],
        });
      }
    }
  });

export const userPasswordPatchSchema = z.object({
  currentPassword: z.string().min(1, "Indicá tu contraseña actual"),
  newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const notificationsPatchSchema = z.object({
  ids: z.array(z.string().min(1)).optional(),
  markAllRead: z.boolean().optional(),
});

const reminderInput = z.object({
  offsetMinutes: z.number().int().min(0).max(525600),
});

const checklistInput = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(500),
  done: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const createItemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10000).optional().default(""),
  /** ISO-like string from `datetime-local` or full ISO; validated at parse time */
  dueAt: z.string().max(50).nullable().optional(),
  allDay: z.boolean().optional().default(false),
  timezone: z.string().max(64).optional().default("UTC"),
  recurrenceRule: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]).optional().default("NONE"),
  reminders: z.array(reminderInput).optional().default([]),
  checklistItems: z.array(checklistInput).optional().default([]),
  tagIds: z.array(z.string()).optional().default([]),
});

export const updateItemSchema = createItemSchema.partial().extend({
  title: z.string().min(1).max(200).optional(),
  completedAt: z.string().max(50).nullable().optional(),
  archived: z.boolean().optional(),
});

export const createTagSchema = z.object({
  name: z.string().min(1).max(64).trim(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const createNotePageSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateNotePageSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  body: z.string().max(500_000).optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});
