import { marked } from "marked";
import DOMPurify from "dompurify";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

marked.setOptions({ gfm: true, breaks: false });

/* Sanitize rendered HTML before it ever hits the DOM or an exported file.
   .md files are untrusted input, and marked emits raw HTML — without this a file
   containing <script>, onerror=, or javascript: links would run (XSS). We keep
   what the editor needs (inline color style, img width, task checkboxes, links)
   and strip everything dangerous. */
let purifierReady = false;
function ensureHooks() {
  if (purifierReady || typeof window === "undefined") return;
  // Force every link to open safely.
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A" && node.getAttribute("href")) {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
  purifierReady = true;
}

export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html; // never rendered to a user on the server
  ensureHooks();
  // DOMPurify defaults already strip scripts, event handlers and javascript:/
  // vbscript: URLs, while allowing http(s)/mailto/relative links and data:image
  // sources for <img> — exactly what we need.
  return DOMPurify.sanitize(html, { ADD_ATTR: ["target"] });
}

/** Markdown source → sanitized rendered HTML (Visual lens + exports). */
export function parseMarkdown(text: string): string {
  return sanitizeHtml(marked.parse(text) as string);
}

/* HTML → Markdown (for editing in the Visual lens). Lazily constructed. */
let turndownSvc: TurndownService | null = null;

function getTurndown(): TurndownService {
  if (turndownSvc) return turndownSvc;
  turndownSvc = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
    hr: "---",
  });
  turndownSvc.use(gfm);
  // Markdown has no native color, so preserve text-color / highlight by keeping
  // styled <span> elements as inline HTML (marked renders them back on read).
  turndownSvc.addRule("styledSpan", {
    filter: (node) =>
      node.nodeName === "SPAN" && !!node.getAttribute("style"),
    replacement: (content, node) =>
      `<span style="${(node as HTMLElement).getAttribute("style")}">${content}</span>`,
  });
  // Some browsers emit <font color> for typed-colour text — normalize to a span
  // so colour survives the round-trip.
  turndownSvc.addRule("fontColor", {
    filter: (node) =>
      node.nodeName === "FONT" && !!node.getAttribute("color"),
    replacement: (content, node) =>
      `<span style="color:${(node as HTMLElement).getAttribute("color")}">${content}</span>`,
  });
  // A resized image carries an explicit width. Markdown image syntax can't hold
  // a size, so keep it as inline <img> HTML (marked renders it back).
  turndownSvc.addRule("sizedImage", {
    filter: (node) => {
      if (node.nodeName !== "IMG") return false;
      const el = node as HTMLElement;
      return (
        !!el.getAttribute("width") ||
        /width\s*:/i.test(el.getAttribute("style") || "")
      );
    },
    replacement: (_content, node) => {
      const el = node as HTMLImageElement;
      const src = el.getAttribute("src") || "";
      const alt = el.getAttribute("alt") || "";
      let w = el.getAttribute("width") || "";
      if (!w) {
        const m = /width\s*:\s*([\d.]+)px/i.exec(el.getAttribute("style") || "");
        if (m) w = String(Math.round(parseFloat(m[1])));
      }
      return `<img src="${src}" alt="${alt}"${w ? ` width="${w}"` : ""}>`;
    },
  });
  return turndownSvc;
}

export function htmlToMarkdown(html: string): string {
  return getTurndown().turndown(html);
}

/** Word count + estimated read time, computed from the Markdown source. */
export function computeMeta(text: string): { words: number; minutes: number } {
  const words = (text.trim().match(/\S+/g) || []).length;
  return { words, minutes: Math.max(1, Math.round(words / 220)) };
}
