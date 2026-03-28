import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "span",
  "mark",
  "a",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "hr",
  "img",
  "video",
  "audio",
  "source",
];

const ALLOWED_ATTR = [
  "style",
  "class",
  "data-color",
  "color",
  "src",
  "alt",
  "width",
  "height",
  "loading",
  "decoding",
  "controls",
  "playsinline",
  "href",
  "target",
  "rel",
  "type",
];

/** Solo medios servidos por nuestra API (evita XSS por src). */
const NOTE_MEDIA_SRC = /^\/api\/note-media\/[a-z0-9]+$/i;

/** Enlaces internos a actividades del usuario. */
const ITEM_LINK_HREF = /^\/dashboard\/items\/[a-z0-9]+$/i;

let hooksInstalled = false;

function installSanitizeHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;

  DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
    const tag = node.nodeName?.toLowerCase();
    if (data.attrName === "src") {
      if (tag === "img" || tag === "video" || tag === "audio" || tag === "source") {
        const v = String(data.attrValue ?? "").trim();
        if (!NOTE_MEDIA_SRC.test(v)) {
          data.keepAttr = false;
        }
      }
    }
    if (data.attrName === "href" && tag === "a") {
      const v = String(data.attrValue ?? "").trim();
      if (!ITEM_LINK_HREF.test(v)) {
        data.keepAttr = false;
      }
    }
    if (tag === "a" && data.attrName === "target") {
      const v = String(data.attrValue ?? "").trim();
      if (v !== "_blank") data.keepAttr = false;
    }
    if (tag === "a" && data.attrName === "rel") {
      const v = String(data.attrValue ?? "").trim();
      if (v !== "noopener noreferrer" && v !== "noreferrer noopener") {
        data.keepAttr = false;
      }
    }
  });
}

/** Sanitiza HTML del editor antes de guardar (solo notas del propio usuario). */
export function sanitizeNoteHtml(dirty: string): string {
  installSanitizeHooks();
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}
