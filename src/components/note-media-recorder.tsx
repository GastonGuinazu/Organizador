"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { NOTE_MEDIA_MAX_BYTES } from "@/lib/note-media-constants";

type Props = {
  mode: "audio" | "video";
  open: boolean;
  onClose: () => void;
  onRecorded: (file: File) => void;
};

function pickRecorderMime(mode: "audio" | "video"): string {
  if (typeof MediaRecorder === "undefined") return "";
  if (mode === "audio") {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
    for (const t of candidates) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return "";
  }
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

function extensionForMime(mime: string): string {
  const base = mime.split(";")[0]?.trim() ?? "application/octet-stream";
  if (base === "audio/mp4" || base === "video/mp4") return "mp4";
  if (base.startsWith("audio/")) return "webm";
  if (base.startsWith("video/")) return "webm";
  return "bin";
}

export function NoteMediaRecorderModal({ mode, open, onClose, onRecorded }: Props) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const mimeRef = useRef("");
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const discardRef = useRef(false);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const clearTick = useCallback(() => {
    if (tickRef.current != null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTick();
    mrRef.current = null;
    chunksRef.current = [];
    mimeRef.current = "";
    stopTracks();
    setRecording(false);
    setProcessing(false);
    setSeconds(0);
    setError(null);
  }, [clearTick, stopTracks]);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const handleClose = useCallback(() => {
    if (processing) return;
    if (mrRef.current?.state === "recording") {
      discardRef.current = true;
      try {
        mrRef.current.stop();
      } catch {
        /* ignore */
      }
      return;
    }
    reset();
    onClose();
  }, [onClose, processing, reset]);

  const start = async () => {
    setError(null);
    const mime = pickRecorderMime(mode);
    if (!mime) {
      setError("Tu navegador no permite grabar así. Probá “Elegir audio” o “Elegir video”.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        mode === "audio" ? { audio: true, video: false } : { audio: true, video: true },
      );
      streamRef.current = stream;
      chunksRef.current = [];
      mimeRef.current = mime;
      const mr = new MediaRecorder(stream, { mimeType: mime });
      mrRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        clearTick();
        const discard = discardRef.current;
        discardRef.current = false;
        stopTracks();
        const baseType = mime.split(";")[0]?.trim() || "application/octet-stream";
        const blob = new Blob(chunksRef.current, { type: baseType });
        chunksRef.current = [];
        mrRef.current = null;
        setProcessing(false);
        setRecording(false);
        if (discard) {
          onClose();
          return;
        }
        if (blob.size === 0) {
          setError("No se grabó nada. Probá de nuevo.");
          return;
        }
        if (blob.size > NOTE_MEDIA_MAX_BYTES) {
          setError(
            `El archivo supera ${Math.round(NOTE_MEDIA_MAX_BYTES / (1024 * 1024))} MB. Grabá algo más corto.`,
          );
          return;
        }
        const ext = extensionForMime(mime);
        const file = new File([blob], `grabacion-${Date.now()}.${ext}`, { type: blob.type || baseType });
        onRecorded(file);
        onClose();
        reset();
      };
      mr.start(250);
      setRecording(true);
      setSeconds(0);
      tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("No se pudo acceder al micrófono o a la cámara. Revisá los permisos del navegador.");
    }
  };

  const stop = () => {
    const mr = mrRef.current;
    if (!mr || mr.state !== "recording") return;
    discardRef.current = false;
    setProcessing(true);
    clearTick();
    try {
      mr.stop();
    } catch {
      setProcessing(false);
      setRecording(false);
      setError("No se pudo finalizar la grabación.");
      stopTracks();
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  if (!open) return null;

  const title = mode === "audio" ? "Grabar nota de voz" : "Grabar video";
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/60"
        onClick={() => handleClose()}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {mode === "audio"
            ? "Ideal en computadora. En el celular podés usar “Grabar nota de voz” del menú para abrir el micrófono del sistema."
            : "Ideal en computadora. En el celular podés usar “Grabar video” del menú para abrir la cámara del sistema."}
        </p>
        {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {!recording && !processing ? (
            <>
              <Button type="button" variant="primary" className="min-h-11" onClick={() => void start()}>
                Empezar a grabar
              </Button>
              <Button type="button" variant="secondary" className="min-h-11" onClick={handleClose}>
                Cancelar
              </Button>
            </>
          ) : null}
          {recording ? (
            <>
              <span className="text-sm tabular-nums text-slate-700 dark:text-slate-200">
                {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
              </span>
              <Button type="button" variant="danger" className="min-h-11" onClick={stop}>
                Detener y usar
              </Button>
            </>
          ) : null}
          {processing ? <span className="text-sm text-slate-600 dark:text-slate-400">Procesando…</span> : null}
        </div>
      </div>
    </div>
  );
}
