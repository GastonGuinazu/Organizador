import { Node, mergeAttributes } from "@tiptap/core";

export const NoteVideo = Node.create({
  name: "noteVideo",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (el) => (el as HTMLVideoElement).getAttribute("src"),
      },
    };
  },

  parseHTML() {
    return [{ tag: "video[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        controls: true,
        playsInline: true,
        class: "note-embed-video max-h-[min(70vh,640px)] w-full max-w-full rounded-lg border border-slate-200 dark:border-slate-600",
      }),
    ];
  },
});

export const NoteAudio = Node.create({
  name: "noteAudio",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (el) => (el as HTMLAudioElement).getAttribute("src"),
      },
    };
  },

  parseHTML() {
    return [{ tag: "audio[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "audio",
      mergeAttributes(HTMLAttributes, {
        controls: true,
        class: "note-embed-audio w-full max-w-full rounded-lg border border-slate-200 dark:border-slate-600",
      }),
    ];
  },
});
