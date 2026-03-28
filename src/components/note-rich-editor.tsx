"use client";

import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { FontFamily } from "@tiptap/extension-font-family";
import { Image as TiptapImage } from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { NoteAudio, NoteVideo } from "@/lib/note-tiptap-media";
import { NoteImageLightbox } from "@/components/note-image-lightbox";
import { NoteMediaRecorderModal } from "@/components/note-media-recorder";
import { isNoteMediaImageSrc } from "@/lib/note-media-url";

/**
 * Nombres tipo Word; valores CSS con fallback. Si la fuente no está instalada
 * (p. ej. Calibri sin Office en Mac), el navegador usa la siguiente de la lista.
 */
const FONTS = [
  { label: "Por defecto", value: "" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Calibri", value: 'Calibri, "Segoe UI", "Helvetica Neue", Arial, sans-serif' },
  { label: "Cambria", value: "Cambria, Georgia, serif" },
  { label: "Times New Roman", value: '"Times New Roman", Times, serif' },
  { label: "Georgia", value: 'Georgia, Cambria, "Times New Roman", serif' },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Trebuchet MS", value: '"Trebuchet MS", "Lucida Sans Unicode", sans-serif' },
  { label: "Comic Sans MS", value: '"Comic Sans MS", "Comic Sans", cursive' },
  { label: "Courier New", value: '"Courier New", Courier, monospace' },
  { label: "Helvetica", value: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { label: "Garamond", value: 'Garamond, "Palatino Linotype", "Times New Roman", serif' },
  { label: "Century Gothic", value: '"Century Gothic", CenturyGothic, "Apple SD Gothic Neo", sans-serif' },
  { label: "Tahoma", value: "Tahoma, Verdana, Geneva, sans-serif" },
  { label: "Palatino", value: 'Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif' },
  { label: "Sans (sistema)", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif (sistema)", value: "ui-serif, Georgia, Cambria, serif" },
  { label: "Monoespaciada (sistema)", value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
] as const;

const HIGHLIGHTS = [
  { label: "Amarillo", color: "#fef08a" },
  { label: "Verde", color: "#bbf7d0" },
  { label: "Rosa", color: "#fecdd3" },
  { label: "Celeste", color: "#bae6fd" },
] as const;

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const ITEM_LINK_RE = /^\/dashboard\/items\/[a-z0-9]+$/i;

const IMAGE_ACCEPT = "image/jpeg,image/png,image/gif,image/webp";
const AUDIO_ACCEPT = "audio/mpeg,audio/webm,audio/wav,audio/ogg,audio/mp4";
const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime";

type MediaMenuId = "photo" | "audio" | "video";

function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setFine(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return fine;
}

async function maybeCompressImage(file: File, maxEdge = 1920): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  if (file.size < 600_000) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const u = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(u);
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w <= maxEdge && h <= maxEdge) {
        resolve(file);
        return;
      }
      if (w > h) {
        h = Math.round((h * maxEdge) / w);
        w = maxEdge;
      } else {
        w = Math.round((w * maxEdge) / h);
        h = maxEdge;
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const name = file.name.replace(/\.[^.]+$/, "") || "foto";
          resolve(new File([blob], `${name}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(u);
      resolve(file);
    };
    img.src = u;
  });
}

/** Notas antiguas en texto plano: convertir a HTML seguro para el editor. */
export function plainTextToEditorHtml(raw: string): string {
  const t = raw.trim();
  if (!t) return "<p></p>";
  if (/<[a-z][\s>/]/i.test(t)) return raw;
  return raw
    .split(/\n\n+/)
    .map((block) => {
      const inner = escapeHtml(block).split("\n").join("<br>");
      return `<p>${inner}</p>`;
    })
    .join("");
}

export type NoteLinkItem = { id: string; title: string };

type Props = {
  initialHtml: string;
  onHtmlChange: (html: string) => void;
  notePageId: string;
  onUploadError?: (message: string | null) => void;
  linkItems?: NoteLinkItem[];
  readOnly?: boolean;
  /** Insertar HTML una vez (plantilla); `nonce` distinto en cada uso para repetir la misma plantilla. */
  pendingInsert?: { nonce: number; html: string } | null;
  onConsumePendingInsert?: () => void;
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  ariaLabel,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`min-h-9 min-w-9 shrink-0 rounded-lg border text-sm font-medium transition disabled:opacity-40 ${
        active
          ? "border-teal-500 bg-teal-50 text-teal-900 dark:border-teal-600 dark:bg-teal-950/60 dark:text-teal-100"
          : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

export function NoteRichEditor({
  initialHtml,
  onHtmlChange,
  notePageId,
  onUploadError,
  linkItems,
  readOnly = false,
  pendingInsert,
  onConsumePendingInsert,
}: Props) {
  const onHtmlChangeRef = useRef(onHtmlChange);
  onHtmlChangeRef.current = onHtmlChange;
  const onUploadErrorRef = useRef(onUploadError);
  onUploadErrorRef.current = onUploadError;
  const notePageIdRef = useRef(notePageId);
  notePageIdRef.current = notePageId;

  const [uploading, setUploading] = useState(false);
  const [openMediaMenu, setOpenMediaMenu] = useState<MediaMenuId | null>(null);
  const [recorderOpen, setRecorderOpen] = useState<"audio" | "video" | null>(null);
  const imagePickRef = useRef<HTMLInputElement>(null);
  const imageCaptureRef = useRef<HTMLInputElement>(null);
  const audioPickRef = useRef<HTMLInputElement>(null);
  const audioCaptureRef = useRef<HTMLInputElement>(null);
  const videoPickRef = useRef<HTMLInputElement>(null);
  const videoCaptureRef = useRef<HTMLInputElement>(null);
  const mediaMenusRef = useRef<HTMLDivElement>(null);
  const finePointer = useFinePointer();
  const linkSelectRef = useRef<HTMLSelectElement>(null);
  const lastTemplateNonce = useRef<number | null>(null);
  const editorShellRef = useRef<HTMLDivElement>(null);
  const [imageLightbox, setImageLightbox] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    lastTemplateNonce.current = null;
  }, [notePageId]);

  useEffect(() => {
    if (openMediaMenu == null) return;
    const onDocPointer = (e: PointerEvent) => {
      if (mediaMenusRef.current?.contains(e.target as Node)) return;
      setOpenMediaMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMediaMenu(null);
    };
    document.addEventListener("pointerdown", onDocPointer, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointer, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMediaMenu]);

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable: !readOnly,
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          link: false,
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-teal-700 underline decoration-teal-600/80 underline-offset-2 dark:text-teal-400",
          },
          validate: (href) => ITEM_LINK_RE.test(href),
        }),
        TextStyle,
        Color.configure({ types: ["textStyle"] }),
        FontFamily.configure({ types: ["textStyle"] }),
        Highlight.configure({ multicolor: true }),
        TiptapImage.configure({
          allowBase64: false,
          inline: false,
          HTMLAttributes: {
            class: "note-embed-img max-h-[min(70vh,720px)] w-auto max-w-full rounded-lg border border-slate-200 dark:border-slate-600",
          },
        }),
        NoteVideo,
        NoteAudio,
      ],
      content: plainTextToEditorHtml(initialHtml),
      editorProps: {
        attributes: {
          class:
            "note-rich-editor-prose min-h-[280px] max-w-none px-3 py-2 text-sm text-slate-900 focus:outline-none dark:text-slate-100",
        },
      },
      onUpdate: ({ editor: ed }) => {
        onHtmlChangeRef.current(ed.getHTML());
      },
    },
    [],
  );

  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    const root = editorShellRef.current;
    if (!root || !editor) return;

    function tryOpen(img: HTMLImageElement) {
      const src = img.getAttribute("src")?.trim() ?? "";
      if (!isNoteMediaImageSrc(src)) return false;
      const alt = img.getAttribute("alt")?.trim() || "Imagen en la nota";
      setImageLightbox({ src, alt });
      return true;
    }

    /** Captura: ProseMirror suele frenar la burbuja; sin esto el clic puede abrir la URL de la imagen. */
    const onClick = (e: MouseEvent) => {
      if (!readOnly) return;
      const t = e.target;
      if (!(t instanceof Element)) return;
      const img = t.closest("img");
      if (!img || !root.contains(img)) return;
      if (!tryOpen(img)) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

    const onDblClick = (e: MouseEvent) => {
      if (readOnly) return;
      const t = e.target;
      if (!(t instanceof Element)) return;
      const img = t.closest("img");
      if (!img || !root.contains(img)) return;
      if (!tryOpen(img)) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

    root.addEventListener("click", onClick, true);
    root.addEventListener("dblclick", onDblClick, true);
    return () => {
      root.removeEventListener("click", onClick, true);
      root.removeEventListener("dblclick", onDblClick, true);
    };
  }, [editor, readOnly]);

  const tool = useEditorState({
    editor,
    selector: (snap) => {
      const ed = snap.editor;
      if (!ed) {
        return {
          bold: false,
          italic: false,
          underline: false,
          strike: false,
          h2: false,
          h3: false,
          paragraph: true,
          bullet: false,
          ordered: false,
          fontFamily: "",
        };
      }
      const { fontFamily } = ed.getAttributes("textStyle");
      return {
        bold: ed.isActive("bold"),
        italic: ed.isActive("italic"),
        underline: ed.isActive("underline"),
        strike: ed.isActive("strike"),
        h2: ed.isActive("heading", { level: 2 }),
        h3: ed.isActive("heading", { level: 3 }),
        paragraph: ed.isActive("paragraph"),
        bullet: ed.isActive("bulletList"),
        ordered: ed.isActive("orderedList"),
        fontFamily: typeof fontFamily === "string" ? fontFamily : "",
      };
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = plainTextToEditorHtml(initialHtml);
    const cur = editor.getHTML();
    if (cur !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, initialHtml]);

  useEffect(() => {
    if (!editor || !pendingInsert || readOnly) return;
    if (lastTemplateNonce.current === pendingInsert.nonce) return;
    lastTemplateNonce.current = pendingInsert.nonce;
    editor.chain().focus().insertContent(pendingInsert.html).run();
    onConsumePendingInsert?.();
  }, [editor, pendingInsert, readOnly, onConsumePendingInsert]);

  const handleMediaFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file || !editor || readOnly) return;
      setUploading(true);
      onUploadErrorRef.current?.(null);
      try {
        const prepared =
          file.type.startsWith("image/") && file.type !== "image/gif"
            ? await maybeCompressImage(file)
            : file;
        const fd = new FormData();
        fd.append("file", prepared);
        const res = await fetch(`/api/note-pages/${notePageIdRef.current}/media`, {
          method: "POST",
          body: fd,
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string; kind?: string };
        if (!res.ok) {
          onUploadErrorRef.current?.(data.error ?? "No se pudo subir el archivo");
          return;
        }
        const { url, kind } = data;
        if (!url || !kind) {
          onUploadErrorRef.current?.("Respuesta inválida del servidor");
          return;
        }
        if (kind === "image") {
          editor.chain().focus().setImage({ src: url, alt: "Imagen en la nota" }).run();
        } else if (kind === "video") {
          editor.chain().focus().insertContent({ type: "noteVideo", attrs: { src: url } }).run();
        } else if (kind === "audio") {
          editor.chain().focus().insertContent({ type: "noteAudio", attrs: { src: url } }).run();
        }
      } catch {
        onUploadErrorRef.current?.("No se pudo subir el archivo");
      } finally {
        setUploading(false);
      }
    },
    [editor, readOnly],
  );

  const onMediaFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    void handleMediaFile(f);
  };

  if (!editor || !tool) {
    return (
      <div className="min-h-[320px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        Cargando editor…
      </div>
    );
  }

  const busy = uploading || readOnly;

  return (
    <div className="note-rich-editor rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950 [&_img.note-embed-img]:cursor-zoom-in">
      <input
        ref={imagePickRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={onMediaFileInputChange}
      />
      <input
        ref={imageCaptureRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={onMediaFileInputChange}
      />
      <input
        ref={audioPickRef}
        type="file"
        accept={AUDIO_ACCEPT}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={onMediaFileInputChange}
      />
      <input
        ref={audioCaptureRef}
        type="file"
        accept="audio/*"
        capture
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={onMediaFileInputChange}
      />
      <input
        ref={videoPickRef}
        type="file"
        accept={VIDEO_ACCEPT}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={onMediaFileInputChange}
      />
      <input
        ref={videoCaptureRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={onMediaFileInputChange}
      />

      {!readOnly ? (
        <div
          className="-mx-px flex flex-wrap content-start items-start gap-x-1 gap-y-2 border-b border-slate-200 p-2 dark:border-slate-700"
          role="toolbar"
          aria-label="Formato del texto"
        >
          <ToolbarButton
            ariaLabel="Negrita"
            active={tool.bold}
            disabled={busy}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <span className="px-1 font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton
            ariaLabel="Cursiva"
            active={tool.italic}
            disabled={busy}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <span className="px-1 italic">I</span>
          </ToolbarButton>
          <ToolbarButton
            ariaLabel="Subrayado"
            active={tool.underline}
            disabled={busy}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <span className="px-1 underline">U</span>
          </ToolbarButton>
          <ToolbarButton
            ariaLabel="Tachado"
            active={tool.strike}
            disabled={busy}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <span className="px-1 line-through">S</span>
          </ToolbarButton>

          <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:inline dark:bg-slate-600" aria-hidden />

          <ToolbarButton
            ariaLabel="Título mediano"
            active={tool.h2}
            disabled={busy}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <span className="px-1 text-xs font-semibold">H2</span>
          </ToolbarButton>
          <ToolbarButton
            ariaLabel="Título pequeño"
            active={tool.h3}
            disabled={busy}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <span className="px-1 text-xs font-semibold">H3</span>
          </ToolbarButton>
          <ToolbarButton
            ariaLabel="Párrafo normal"
            active={tool.paragraph && !tool.h2 && !tool.h3}
            disabled={busy}
            onClick={() => editor.chain().focus().setParagraph().run()}
          >
            <span className="px-1 text-xs">¶</span>
          </ToolbarButton>

          <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:inline dark:bg-slate-600" aria-hidden />

          <ToolbarButton
            ariaLabel="Lista con viñetas"
            active={tool.bullet}
            disabled={busy}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <span className="px-1 text-xs">• Lista</span>
          </ToolbarButton>
          <ToolbarButton
            ariaLabel="Lista numerada"
            active={tool.ordered}
            disabled={busy}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <span className="px-1 text-xs">1. Lista</span>
          </ToolbarButton>

          <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:inline dark:bg-slate-600" aria-hidden />

          <div ref={mediaMenusRef} className="flex flex-wrap items-start gap-x-1 gap-y-2">
            <div className="relative">
              <button
                type="button"
                disabled={busy}
                aria-haspopup="menu"
                aria-expanded={openMediaMenu === "photo"}
                aria-label="Foto: elegir imagen o sacar foto"
                className={`min-h-9 shrink-0 rounded-lg border px-2 text-sm font-medium transition disabled:opacity-40 ${
                  openMediaMenu === "photo"
                    ? "border-teal-500 bg-teal-50 text-teal-900 dark:border-teal-600 dark:bg-teal-950/60 dark:text-teal-100"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                }`}
                onClick={() => setOpenMediaMenu((m) => (m === "photo" ? null : "photo"))}
              >
                <span className="px-1 text-xs whitespace-nowrap">Foto ▾</span>
              </button>
              {openMediaMenu === "photo" ? (
                <ul
                  role="menu"
                  aria-label="Opciones de foto"
                  className="absolute left-0 top-full z-30 mt-1 min-w-[13rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800"
                >
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="flex min-h-11 w-full items-center px-3 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700"
                      onClick={() => {
                        setOpenMediaMenu(null);
                        imagePickRef.current?.click();
                      }}
                    >
                      Elegir imagen
                    </button>
                  </li>
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="flex min-h-11 w-full items-center px-3 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700"
                      onClick={() => {
                        setOpenMediaMenu(null);
                        imageCaptureRef.current?.click();
                      }}
                    >
                      Sacar foto
                    </button>
                  </li>
                </ul>
              ) : null}
            </div>

            <div className="relative">
              <button
                type="button"
                disabled={busy}
                aria-haspopup="menu"
                aria-expanded={openMediaMenu === "audio"}
                aria-label="Audio: elegir archivo o grabar nota de voz"
                className={`min-h-9 shrink-0 rounded-lg border px-2 text-sm font-medium transition disabled:opacity-40 ${
                  openMediaMenu === "audio"
                    ? "border-teal-500 bg-teal-50 text-teal-900 dark:border-teal-600 dark:bg-teal-950/60 dark:text-teal-100"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                }`}
                onClick={() => setOpenMediaMenu((m) => (m === "audio" ? null : "audio"))}
              >
                <span className="px-1 text-xs whitespace-nowrap">Audio ▾</span>
              </button>
              {openMediaMenu === "audio" ? (
                <ul
                  role="menu"
                  aria-label="Opciones de audio"
                  className="absolute left-0 top-full z-30 mt-1 min-w-[13rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800"
                >
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="flex min-h-11 w-full items-center px-3 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700"
                      onClick={() => {
                        setOpenMediaMenu(null);
                        audioPickRef.current?.click();
                      }}
                    >
                      Elegir audio
                    </button>
                  </li>
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="flex min-h-11 w-full items-center px-3 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700"
                      onClick={() => {
                        setOpenMediaMenu(null);
                        if (finePointer) setRecorderOpen("audio");
                        else audioCaptureRef.current?.click();
                      }}
                    >
                      Grabar nota de voz
                    </button>
                  </li>
                </ul>
              ) : null}
            </div>

            <div className="relative">
              <button
                type="button"
                disabled={busy}
                aria-haspopup="menu"
                aria-expanded={openMediaMenu === "video"}
                aria-label="Video: elegir archivo o grabar con la cámara"
                className={`min-h-9 shrink-0 rounded-lg border px-2 text-sm font-medium transition disabled:opacity-40 ${
                  openMediaMenu === "video"
                    ? "border-teal-500 bg-teal-50 text-teal-900 dark:border-teal-600 dark:bg-teal-950/60 dark:text-teal-100"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                }`}
                onClick={() => setOpenMediaMenu((m) => (m === "video" ? null : "video"))}
              >
                <span className="px-1 text-xs whitespace-nowrap">Video ▾</span>
              </button>
              {openMediaMenu === "video" ? (
                <ul
                  role="menu"
                  aria-label="Opciones de video"
                  className="absolute left-0 top-full z-30 mt-1 min-w-[13rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800"
                >
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="flex min-h-11 w-full items-center px-3 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700"
                      onClick={() => {
                        setOpenMediaMenu(null);
                        videoPickRef.current?.click();
                      }}
                    >
                      Elegir video
                    </button>
                  </li>
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="flex min-h-11 w-full items-center px-3 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700"
                      onClick={() => {
                        setOpenMediaMenu(null);
                        if (finePointer) setRecorderOpen("video");
                        else videoCaptureRef.current?.click();
                      }}
                    >
                      Grabar video
                    </button>
                  </li>
                </ul>
              ) : null}
            </div>
          </div>
          {uploading ? (
            <span className="flex items-center px-2 text-xs text-slate-500 dark:text-slate-400">Subiendo…</span>
          ) : null}

          <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:inline dark:bg-slate-600" aria-hidden />

          <label className="flex min-h-9 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-600 dark:bg-slate-800">
            <span className="sr-only">Color de letra</span>
            <input
              type="color"
              aria-label="Color de letra"
              disabled={busy}
              className="h-9 w-11 min-w-11 cursor-pointer rounded border-0 bg-transparent p-0 disabled:opacity-40"
              defaultValue="#0f172a"
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            />
          </label>

          <div className="flex max-w-full flex-wrap items-center gap-1">
            <span className="sr-only">Resaltado</span>
            {HIGHLIGHTS.map(({ label, color }) => (
              <button
                key={color}
                type="button"
                aria-label={`Resaltado ${label}`}
                title={label}
                disabled={busy}
                className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 disabled:opacity-40 dark:border-slate-600"
                style={{ backgroundColor: color }}
                onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
              />
            ))}
            <ToolbarButton
              ariaLabel="Quitar resaltado"
              disabled={busy}
              onClick={() => editor.chain().focus().unsetHighlight().run()}
            >
              <span className="px-1 text-xs whitespace-nowrap">Sin fondo</span>
            </ToolbarButton>
          </div>

          <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:inline dark:bg-slate-600" aria-hidden />

          <label className="flex min-h-9 min-w-0 basis-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800 sm:basis-auto sm:max-w-[min(100%,20rem)]">
            <span className="shrink-0 font-medium text-slate-800 dark:text-slate-100">Fuente</span>
            <select
              aria-label="Tipo de letra"
              disabled={busy}
              className="note-rich-editor-toolbar-select min-w-0 flex-1 rounded-md border-0 bg-white px-2 py-1.5 text-sm font-medium text-slate-900 shadow-none focus:outline-none focus:ring-2 focus:ring-teal-500/35 disabled:opacity-40 dark:bg-slate-950 dark:text-slate-50 sm:max-w-[16rem] sm:flex-none"
              value={tool.fontFamily}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) editor.chain().focus().unsetFontFamily().run();
                else editor.chain().focus().setFontFamily(v).run();
              }}
            >
              {FONTS.map((f) => (
                <option key={f.label} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          {linkItems && linkItems.length > 0 ? (
            <div className="flex min-w-0 basis-full flex-wrap items-center gap-1 sm:basis-auto">
              <label className="flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800 sm:max-w-xs sm:flex-initial">
                <span className="shrink-0 font-medium text-slate-800 dark:text-slate-100">Actividad</span>
                <select
                  ref={linkSelectRef}
                  aria-label="Elegir actividad para enlazar"
                  disabled={busy}
                  className="note-rich-editor-toolbar-select min-w-0 flex-1 rounded-md border-0 bg-white py-1 text-sm text-slate-900 dark:bg-slate-950 dark:text-slate-50"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Elegir…
                  </option>
                  {linkItems.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.title.slice(0, 60) || "Sin título"}
                    </option>
                  ))}
                </select>
              </label>
              <ToolbarButton
                ariaLabel="Insertar enlace a la actividad elegida"
                disabled={busy}
                onClick={() => {
                  const sid = linkSelectRef.current?.value;
                  if (!sid) return;
                  const item = linkItems.find((x) => x.id === sid);
                  const label = (item?.title ?? "Ver actividad").slice(0, 120);
                  editor
                    .chain()
                    .focus()
                    .insertContent(
                      `<a href="/dashboard/items/${sid}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a> `,
                    )
                    .run();
                }}
              >
                <span className="px-1 text-xs whitespace-nowrap">Enlace</span>
              </ToolbarButton>
            </div>
          ) : null}
        </div>
      ) : null}

      <div ref={editorShellRef}>
        <EditorContent editor={editor} />
      </div>
      <NoteImageLightbox
        open={imageLightbox !== null}
        src={imageLightbox?.src ?? null}
        alt={imageLightbox?.alt ?? ""}
        onClose={() => setImageLightbox(null)}
      />
      <NoteMediaRecorderModal
        mode={recorderOpen === "video" ? "video" : "audio"}
        open={recorderOpen !== null}
        onClose={() => setRecorderOpen(null)}
        onRecorded={(file) => void handleMediaFile(file)}
      />
    </div>
  );
}
