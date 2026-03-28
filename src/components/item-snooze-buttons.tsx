"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { snoozeItemDue } from "@/app/dashboard/snooze-actions";

type Preset = "1h" | "tomorrow" | "7d";

const labels: Record<Preset, string> = {
  "1h": "+1 h",
  tomorrow: "Mañana",
  "7d": "+7 días",
};

export function ItemSnoozeButtons({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function run(preset: Preset) {
    start(async () => {
      await snoozeItemDue(itemId, preset);
      setOpen(false);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        className="w-fit text-xs"
        aria-expanded={open}
        aria-controls={`snooze-presets-${itemId}`}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Ocultar" : "Reprogramar"}
      </Button>
      {open ? (
        <div
          id={`snooze-presets-${itemId}`}
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Posponer vencimiento"
        >
          {(Object.keys(labels) as Preset[]).map((preset) => (
            <Button
              key={preset}
              type="button"
              variant="secondary"
              disabled={pending}
              className="text-xs"
              onClick={() => run(preset)}
            >
              {labels[preset]}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
