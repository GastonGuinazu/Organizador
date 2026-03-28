"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;
const BACKDROP_CLOSE_DELAY_MS = 450;

type Props = {
  open: boolean;
  src: string | null;
  alt: string;
  onClose: () => void;
};

export function NoteImageLightbox({ open, src, alt, onClose }: Props) {
  const [zoom, setZoom] = useState(1);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [viewport, setViewport] = useState({ w: 1000, h: 800 });
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const openedAtRef = useRef(0);

  useEffect(() => {
    if (!open) {
      setNatural(null);
      return;
    }
    setZoom(1);
    setNatural(null);
    openedAtRef.current = Date.now();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const upd = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    upd();
    window.addEventListener("resize", upd);
    requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("resize", upd);
    };
  }, [open, src]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !open) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + delta) * 100) / 100)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open, src]);

  const handleBackdropPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.target !== e.currentTarget) return;
      if (Date.now() - openedAtRef.current < BACKDROP_CLOSE_DELAY_MS) return;
      onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const maxW = Math.min(viewport.w * 0.92, 1160);
  const maxH = viewport.h * 0.68;

  const fit =
    natural && natural.w > 0 && natural.h > 0 ? Math.min(maxW / natural.w, maxH / natural.h) : 1;
  const displayW = natural ? Math.round(natural.w * fit * zoom) : undefined;
  const displayH = natural ? Math.round(natural.h * fit * zoom) : undefined;

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const im = e.currentTarget;
    if (im.naturalWidth > 0 && im.naturalHeight > 0) {
      setNatural({ w: im.naturalWidth, h: im.naturalHeight });
    }
  };

  if (!open || !src) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Vista ampliada de la imagen"
    >
      <button
        type="button"
        aria-label="Cerrar vista ampliada"
        className="absolute inset-0 bg-black/75 backdrop-blur-[1px]"
        onPointerDown={handleBackdropPointerDown}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 flex max-h-[min(92dvh,920px)] w-full max-w-[min(96vw,1200px)] flex-col gap-3 rounded-2xl border border-slate-600/80 bg-slate-950/95 p-3 shadow-2xl outline-none dark:border-slate-500/60"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-300">
            Rueda del mouse (sobre la imagen) o botones + / − para zoom
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="min-h-10 px-3"
              aria-label="Alejar"
              onClick={() => setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100))}
            >
              −
            </Button>
            <span className="min-w-[3.5rem] text-center text-sm tabular-nums text-slate-200">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              type="button"
              variant="secondary"
              className="min-h-10 px-3"
              aria-label="Acercar"
              onClick={() => setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100))}
            >
              +
            </Button>
            <Button type="button" variant="secondary" className="min-h-10" onClick={() => setZoom(1)}>
              Tamaño original
            </Button>
            <Button type="button" variant="primary" className="min-h-10" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto rounded-xl bg-black/40">
          <div className="flex min-h-[min(64dvh,560px)] min-w-min items-center justify-center p-2 sm:p-4">
            <img
              src={src}
              alt={alt}
              onLoad={onImgLoad}
              className="object-contain select-none"
              style={
                displayW != null && displayH != null
                  ? { width: displayW, height: displayH, maxWidth: "none", maxHeight: "none" }
                  : { maxHeight: "min(64vh,560px)", maxWidth: "100%", width: "auto", height: "auto" }
              }
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
