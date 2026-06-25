"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { htmlToMarkdown, parseMarkdown } from "@/lib/markdown";
import { activeFile, useStore } from "@/lib/store";
import InsertDialog from "./InsertDialog";

export type FormatAction =
  | "undo"
  | "redo"
  | "h1"
  | "h2"
  | "h3"
  | "normal"
  | "bold"
  | "italic"
  | "code"
  | "list"
  | "olist"
  | "task"
  | "quote"
  | "hr"
  | "link"
  | "img";

export interface StageHandle {
  format: (action: FormatAction) => void;
  applyColor: (hex: string) => void;
  openFind: () => void;
  insertImages: (files: File[]) => Promise<void>;
}

const VISUAL_SYNC_MS = 160;
const ZWSP = "​"; // caret holder inside empty inline code

const escHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const Stage = forwardRef<StageHandle>(function Stage(_props, ref) {
  const view = useStore((s) => s.view);
  const activeId = useStore((s) => s.activeId);

  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const syncTimer = useRef<number | undefined>(undefined);

  const [dialog, setDialog] = useState<{ kind: "link" | "image"; label: string } | null>(null);
  const savedRange = useRef<Range | null>(null);
  const savedTaSel = useRef<{ start: number; end: number } | null>(null);

  /* ---- image resize (Visual lens) ---- */
  const [imgBox, setImgBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const selectedImg = useRef<HTMLImageElement | null>(null);

  /* ---- find-in-document ---- */
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [findInfo, setFindInfo] = useState("");
  const findInputRef = useRef<HTMLInputElement>(null);
  const matchesRef = useRef<number[]>([]);
  const idxRef = useRef(-1);
  const vCacheRef = useRef<{ nodes: { node: Node; start: number }[]; text: string } | null>(null);

  /* Re-derive the editor surface from `text` on file/lens change (not on text). */
  useEffect(() => {
    // Drop any in-flight visual sync and stale find state on file/lens change.
    window.clearTimeout(syncTimer.current);
    setFindOpen(false);
    setFindInfo("");
    matchesRef.current = [];
    idxRef.current = -1;
    clearHighlight();
    // Raw lens has no inline-mark state; clear the toolbar highlight.
    if (view === "raw")
      useStore.getState().setActiveMarks({ bold: false, italic: false, code: false, block: "p" });
    // image selection doesn't survive a re-render / lens change
    selectedImg.current = null;
    setImgBox(null);

    const f = activeFile(useStore.getState());
    if (!f) return;
    if (view === "visual") {
      const el = contentRef.current;
      if (!el) return;
      try {
        el.innerHTML = parseMarkdown(f.text);
      } catch {
        el.innerHTML = '<p style="color:#e0a08c">Could not render this markdown.</p>';
      }
      el.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
        a.target = "_blank";
        a.rel = "noopener";
      });
      if (!f.text) el.focus();
    } else if (textareaRef.current) {
      textareaRef.current.value = f.text;
    }
    vCacheRef.current = null;
  }, [activeId, view]);

  /* Track caret formatting so the toolbar can show the active "on" state. */
  useEffect(() => {
    const onSel = () => refreshMarks();
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Keep the image-resize overlay aligned as the stage scrolls / window resizes. */
  useEffect(() => {
    const stageEl = contentRef.current?.closest(".stage") as HTMLElement | null;
    const onScroll = () => {
      if (selectedImg.current) positionImgBox();
    };
    stageEl?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      stageEl?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  /* ---- sync ---- */
  function syncVisual() {
    const el = contentRef.current;
    if (!el) return;
    try {
      // Strip the zero-width spaces used to hold the caret inside empty inline
      // code, and drop now-empty <code> shells, so the markdown stays clean.
      const tmp = el.cloneNode(true) as HTMLElement;
      tmp.querySelectorAll("code").forEach((c) => {
        c.textContent = (c.textContent || "").split(ZWSP).join("");
        if (!c.textContent) c.remove();
      });
      const html = tmp.innerHTML.split(ZWSP).join("");
      useStore.getState().updateActiveText(htmlToMarkdown(html), true);
    } catch {
      /* keep last good text */
    }
  }
  function scheduleVisualSync() {
    window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(syncVisual, VISUAL_SYNC_MS);
  }
  /* Commit the pending debounced edit immediately (e.g. on blur / lens switch),
     so the last keystrokes aren't lost when leaving the Visual lens. */
  function flushVisual() {
    window.clearTimeout(syncTimer.current);
    syncVisual();
  }
  function syncFromEditor() {
    const ta = textareaRef.current;
    if (ta) useStore.getState().updateActiveText(ta.value, true);
  }
  /* HTML of the current selection (so DOM-mutating actions can go through
     execCommand('insertHTML') and land on the native undo stack). */
  function selectionHtml(): string {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return "";
    const div = document.createElement("div");
    div.appendChild(sel.getRangeAt(0).cloneContents());
    return div.innerHTML;
  }

  /* ---- image resize ---- */
  function positionImgBox() {
    const img = selectedImg.current;
    const stageEl = contentRef.current?.closest(".stage") as HTMLElement | null;
    if (!img || !stageEl || !img.isConnected) {
      setImgBox(null);
      return;
    }
    const ir = img.getBoundingClientRect();
    const sr = stageEl.getBoundingClientRect();
    setImgBox({ left: ir.left - sr.left, top: ir.top - sr.top, width: ir.width, height: ir.height });
  }
  function clearImageSel() {
    if (!selectedImg.current && !imgBox) return;
    selectedImg.current = null;
    setImgBox(null);
  }
  function selectImage(img: HTMLImageElement) {
    selectedImg.current = img;
    positionImgBox();
  }
  function startResize(e: React.MouseEvent, corner: "nw" | "ne" | "sw" | "se") {
    e.preventDefault();
    e.stopPropagation();
    const img = selectedImg.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const left = rect.left;
    const right = rect.right;
    const anchorLeft = corner === "se" || corner === "ne";
    const maxW = (contentRef.current?.clientWidth || 800) - 80;
    const move = (ev: MouseEvent) => {
      let w = anchorLeft ? ev.clientX - left : right - ev.clientX;
      w = Math.max(40, Math.min(maxW, Math.round(w)));
      img.style.width = w + "px";
      img.style.height = "auto";
      img.setAttribute("width", String(w));
      positionImgBox();
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      syncVisual();
      positionImgBox();
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }

  /* ---- visual blockquote helpers (toggle + Enter-to-exit) ---- */
  function currentBlockquote(): HTMLElement | null {
    const root = contentRef.current;
    const sel = window.getSelection();
    if (!root || !sel || !sel.rangeCount) return null;
    for (let n: Node | null = sel.anchorNode; n && n !== root; n = n.parentNode) {
      if (n.nodeType === 1 && (n as HTMLElement).tagName === "BLOCKQUOTE")
        return n as HTMLElement;
    }
    return null;
  }
  function handleVisualKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Enter" || e.shiftKey) return;
    const bq = currentBlockquote();
    if (!bq) return;
    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed || !sel.anchorNode) return;
    let line: Node = sel.anchorNode;
    if (line !== bq) while (line.parentNode && line.parentNode !== bq) line = line.parentNode;
    const text = line === bq ? bq.textContent ?? "" : (line as HTMLElement).textContent ?? "";
    if (text.trim() !== "") return;
    e.preventDefault();
    if (line !== bq && line.parentNode === bq) bq.removeChild(line);
    const p = document.createElement("p");
    p.appendChild(document.createElement("br"));
    bq.parentNode?.insertBefore(p, bq.nextSibling);
    if (!(bq.textContent ?? "").trim()) bq.remove();
    const range = document.createRange();
    range.setStart(p, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    syncVisual();
  }

  function wrapInlineCode() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.getRangeAt(0).collapsed) return;
    // via insertHTML so it's on the native undo stack
    document.execCommand("insertHTML", false, `<code>${selectionHtml()}</code>`);
  }

  /** The <code> element the caret is currently inside, if any. */
  function caretCodeEl(): HTMLElement | null {
    const el = contentRef.current;
    const sel = window.getSelection();
    if (!el || !sel || !sel.rangeCount) return null;
    for (let n: Node | null = sel.anchorNode; n && n !== el; n = n.parentNode) {
      if (n.nodeType === 1 && (n as HTMLElement).tagName === "CODE")
        return n as HTMLElement;
    }
    return null;
  }

  /** Inline code as a typing toggle: wrap a selection, else enter/exit a code
   *  run at the caret (caret held by a zero-width space, stripped on sync). */
  function toggleInlineCode() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    if (!sel.getRangeAt(0).collapsed) {
      wrapInlineCode();
      return;
    }
    const codeEl = caretCodeEl();
    if (codeEl) {
      // exit: drop caret just after the code element
      const after = document.createTextNode(ZWSP);
      codeEl.parentNode?.insertBefore(after, codeEl.nextSibling);
      const r = document.createRange();
      r.setStart(after, 1);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
    } else {
      // enter: insert an empty code with the caret inside it
      const range = sel.getRangeAt(0);
      const code = document.createElement("code");
      code.appendChild(document.createTextNode(ZWSP));
      range.insertNode(code);
      const r = document.createRange();
      r.setStart(code.firstChild!, 1);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
    }
  }

  function caretListEl(tag: "UL" | "OL"): HTMLElement | null {
    const el = contentRef.current;
    const sel = window.getSelection();
    if (!el || !sel || !sel.rangeCount) return null;
    for (let n: Node | null = sel.anchorNode; n && n !== el; n = n.parentNode) {
      if (n.nodeType === 1 && (n as HTMLElement).tagName === tag) return n as HTMLElement;
    }
    return null;
  }

  function stripTask(ul: HTMLElement) {
    ul.classList.remove("contains-task-list");
    ul.querySelectorAll("li").forEach((li) => {
      li.classList.remove("task-list-item");
      li.querySelector('input[type="checkbox"]')?.remove();
    });
  }

  /** Task list (GFM checkboxes) in the Visual lens. Toggles off / converts. */
  function applyTaskListVisual() {
    let ul = caretListEl("UL");
    if (ul && ul.classList.contains("contains-task-list")) {
      stripTask(ul); // toggle off → plain bullets
      return;
    }
    if (!ul) {
      // make (or convert ol → ul), then mark it a task list
      document.execCommand("insertUnorderedList");
      ul = caretListEl("UL");
    }
    if (!ul) return;
    ul.classList.add("contains-task-list");
    ul.querySelectorAll("li").forEach((li) => {
      li.classList.add("task-list-item");
      if (!li.querySelector('input[type="checkbox"]')) {
        const cb = document.createElement("input");
        cb.type = "checkbox";
        li.insertBefore(cb, li.firstChild);
      }
    });
  }

  /** Visual list actions: toggle/convert between bulleted, numbered, task. */
  function applyListVisual(kind: "bullet" | "number" | "task") {
    if (kind === "task") {
      applyTaskListVisual();
      return;
    }
    const ul = caretListEl("UL");
    if (ul && ul.classList.contains("contains-task-list")) {
      // converting a task list away: drop checkboxes first (leave the list)
      stripTask(ul);
      if (kind === "number") document.execCommand("insertOrderedList");
      return;
    }
    document.execCommand(kind === "bullet" ? "insertUnorderedList" : "insertOrderedList");
  }

  /** Publish caret formatting state to the toolbar (the "on" highlight). */
  function refreshMarks() {
    if (useStore.getState().view !== "visual") return;
    const el = contentRef.current;
    const sel = window.getSelection();
    if (!el || !sel || !sel.anchorNode || !el.contains(sel.anchorNode)) return;
    let bold = false,
      italic = false,
      block = "p";
    try {
      bold = document.queryCommandState("bold");
      italic = document.queryCommandState("italic");
      block = (document.queryCommandValue("formatBlock") || "p").toLowerCase();
    } catch {
      /* ignore */
    }
    const code = !!caretCodeEl();
    const cur = useStore.getState().activeMarks;
    if (
      cur.bold !== bold ||
      cur.italic !== italic ||
      cur.code !== code ||
      cur.block !== block
    )
      useStore.getState().setActiveMarks({ bold, italic, code, block });
  }

  function fmtVisual(a: FormatAction) {
    const el = contentRef.current;
    if (!el) return;
    el.focus();
    try {
      document.execCommand("styleWithCSS", false, "false");
    } catch {
      /* ignore */
    }
    // An empty contenteditable has no block to wrap, so formatBlock/list/quote
    // would silently no-op. Seed a paragraph + caret first.
    const blockAct =
      a === "h1" || a === "h2" || a === "h3" || a === "normal" ||
      a === "list" || a === "olist" || a === "task" || a === "quote";
    if (blockAct && !el.querySelector("p,h1,h2,h3,h4,h5,h6,ul,ol,blockquote,pre,li,table")) {
      // No block element yet — wrap existing content (bare text) in a <p> so the
      // command has a block to act on, without discarding what's typed.
      const p = document.createElement("p");
      if (el.childNodes.length) while (el.firstChild) p.appendChild(el.firstChild);
      else p.appendChild(document.createElement("br"));
      el.appendChild(p);
      const r = document.createRange();
      r.selectNodeContents(p);
      r.collapse(false);
      const s = window.getSelection();
      s?.removeAllRanges();
      s?.addRange(r);
    }
    if (a === "undo") document.execCommand("undo");
    else if (a === "redo") document.execCommand("redo");
    else if (a === "h1") document.execCommand("formatBlock", false, "h1");
    else if (a === "h2") document.execCommand("formatBlock", false, "h2");
    else if (a === "h3") document.execCommand("formatBlock", false, "h3");
    else if (a === "normal") document.execCommand("formatBlock", false, "p");
    else if (a === "bold") document.execCommand("bold");
    else if (a === "italic") document.execCommand("italic");
    else if (a === "code") toggleInlineCode();
    else if (a === "list") applyListVisual("bullet");
    else if (a === "olist") applyListVisual("number");
    else if (a === "task") applyListVisual("task");
    else if (a === "quote")
      document.execCommand("formatBlock", false, currentBlockquote() ? "p" : "blockquote");
    else if (a === "hr") document.execCommand("insertHTML", false, "<hr>");
    syncVisual();
    refreshMarks();
  }

  /* ---- raw helpers ---- */
  function applyInline(before: string, after: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    const s = ta.selectionStart, e = ta.selectionEnd, sel = ta.value.slice(s, e);
    document.execCommand("insertText", false, before + sel + after);
    if (!sel) {
      const p = ta.selectionStart - after.length;
      ta.setSelectionRange(p, p);
    }
    syncFromEditor();
  }
  function applyLine(prefix: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    const v = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
    const ls = v.lastIndexOf("\n", s - 1) + 1;
    let le = v.indexOf("\n", e);
    if (le < 0) le = v.length;
    const lines = v.slice(ls, le).split("\n");
    const allHave = lines.every((l) => l === "" || l.startsWith(prefix));
    const nb = lines.map((l) => (l === "" ? l : allHave ? l.slice(prefix.length) : prefix + l)).join("\n");
    ta.setSelectionRange(ls, le);
    document.execCommand("insertText", false, nb);
    syncFromEditor();
  }
  function setBlockRaw(level: number) {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    const v = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
    const ls = v.lastIndexOf("\n", s - 1) + 1;
    let le = v.indexOf("\n", e);
    if (le < 0) le = v.length;
    const pre = level ? "#".repeat(level) + " " : "";
    const nb = v.slice(ls, le).split("\n").map((l) => (l === "" ? l : pre + l.replace(/^#{1,6}\s+/, ""))).join("\n");
    ta.setSelectionRange(ls, le);
    document.execCommand("insertText", false, nb);
    syncFromEditor();
  }
  function insertHrRaw() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    const before = ta.value.slice(0, ta.selectionStart);
    const need = before.length && !before.endsWith("\n") ? "\n" : "";
    document.execCommand("insertText", false, need + "\n---\n\n");
    syncFromEditor();
  }
  // Raw list toggle/convert: strips any existing list marker, then applies the
  // requested kind (or toggles off if every line already has it). Renumbers.
  function applyListRaw(kind: "bullet" | "number" | "task") {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    const v = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
    const ls = v.lastIndexOf("\n", s - 1) + 1;
    let le = v.indexOf("\n", e);
    if (le < 0) le = v.length;
    const lines = v.slice(ls, le).split("\n");
    const MARK = /^(\d+\.\s|- \[[ xX]\]\s|[-*]\s)/;
    const kindOf = (l: string) =>
      /^- \[[ xX]\]\s/.test(l) ? "task" : /^\d+\.\s/.test(l) ? "number" : /^[-*]\s/.test(l) ? "bullet" : "none";
    const nonEmpty = lines.filter((l) => l.trim() !== "");
    const allKind = nonEmpty.length > 0 && nonEmpty.every((l) => kindOf(l) === kind);
    const stripped = lines.map((l) => l.replace(MARK, ""));
    let nb: string;
    if (allKind) nb = stripped.join("\n"); // toggle off
    else {
      let n = 0;
      nb = stripped
        .map((l) => {
          if (l.trim() === "") return l;
          n++;
          const pre = kind === "bullet" ? "- " : kind === "task" ? "- [ ] " : n + ". ";
          return pre + l;
        })
        .join("\n");
    }
    ta.setSelectionRange(ls, le);
    document.execCommand("insertText", false, nb);
    syncFromEditor();
  }
  function fmtRaw(a: FormatAction) {
    const ta = textareaRef.current;
    if (!ta) return;
    if (a === "undo") { ta.focus(); document.execCommand("undo"); syncFromEditor(); }
    else if (a === "redo") { ta.focus(); document.execCommand("redo"); syncFromEditor(); }
    else if (a === "h1") setBlockRaw(1);
    else if (a === "h2") setBlockRaw(2);
    else if (a === "h3") setBlockRaw(3);
    else if (a === "normal") setBlockRaw(0);
    else if (a === "bold") applyInline("**", "**");
    else if (a === "italic") applyInline("*", "*");
    else if (a === "code") applyInline("`", "`");
    else if (a === "list") applyListRaw("bullet");
    else if (a === "olist") applyListRaw("number");
    else if (a === "task") applyListRaw("task");
    else if (a === "quote") applyLine("> ");
    else if (a === "hr") insertHrRaw();
  }

  /* ---- link / image dialog ---- */
  function openInsertDialog(kind: "link" | "image") {
    if (useStore.getState().view === "visual") {
      const sel = window.getSelection();
      const r =
        sel && sel.rangeCount && contentRef.current?.contains(sel.anchorNode)
          ? sel.getRangeAt(0).cloneRange()
          : null;
      savedRange.current = r;
      setDialog({ kind, label: r ? r.toString() : "" });
    } else {
      const ta = textareaRef.current;
      savedTaSel.current = ta ? { start: ta.selectionStart, end: ta.selectionEnd } : null;
      setDialog({ kind, label: ta ? ta.value.slice(ta.selectionStart, ta.selectionEnd) : "" });
    }
  }
  // Cancelling the link/image dialog should hand focus + selection back.
  function cancelDialog() {
    setDialog(null);
    if (useStore.getState().view === "visual") {
      contentRef.current?.focus();
      const sel = window.getSelection();
      if (sel && savedRange.current) {
        sel.removeAllRanges();
        sel.addRange(savedRange.current);
      }
    } else {
      const ta = textareaRef.current;
      ta?.focus();
      if (ta && savedTaSel.current)
        ta.setSelectionRange(savedTaSel.current.start, savedTaSel.current.end);
    }
  }
  function submitDialog(url: string, label: string) {
    const d = dialog;
    setDialog(null);
    if (!d) return;
    if (useStore.getState().view === "visual") {
      const el = contentRef.current;
      if (!el) return;
      el.focus();
      const sel = window.getSelection();
      if (sel) { sel.removeAllRanges(); if (savedRange.current) sel.addRange(savedRange.current); }
      if (d.kind === "link") {
        if (savedRange.current && !savedRange.current.collapsed)
          document.execCommand("createLink", false, url);
        else
          document.execCommand(
            "insertHTML",
            false,
            `<a href="${escHtml(url)}">${escHtml(label || url)}</a>`
          );
      } else {
        document.execCommand(
          "insertHTML",
          false,
          `<img src="${escHtml(url)}"${label ? ` alt="${escHtml(label)}"` : ""}>`
        );
      }
      syncVisual();
    } else {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      const s = savedTaSel.current ?? { start: ta.value.length, end: ta.value.length };
      ta.setSelectionRange(s.start, s.end);
      const text = d.kind === "link" ? `[${label || "link text"}](${url})` : `![${label || "alt text"}](${url})`;
      document.execCommand("insertText", false, text);
      syncFromEditor();
    }
  }

  /* ---- text colour (live selection; toolbar prevents focus-steal) ---- */
  function unwrapEl(el: Element) {
    const p = el.parentNode;
    if (!p) return;
    while (el.firstChild) p.insertBefore(el.firstChild, el);
    p.removeChild(el);
  }
  function applyColor(hex: string) {
    if (useStore.getState().view === "visual") {
      const el = contentRef.current;
      if (!el) return;
      el.focus();
      const sel = window.getSelection();
      const collapsed = !sel || !sel.rangeCount || sel.isCollapsed;
      const withCss = (on: boolean) => {
        try {
          document.execCommand("styleWithCSS", false, on ? "true" : "false");
        } catch {
          /* ignore */
        }
      };
      if (hex) {
        // foreColor colours a selection AND sets the colour for text typed next
        // (a typing mode), and lands on the native undo stack. Keep styleWithCSS
        // ON (don't reset) so typed-next text becomes a <span style> the markdown
        // converter preserves, rather than a <font> tag.
        withCss(true);
        document.execCommand("foreColor", false, hex);
      } else if (!collapsed && sel) {
        // clear: unwrap colour spans inside the selection
        const range = sel.getRangeAt(0);
        let anc: Node | null = range.commonAncestorContainer;
        if (anc.nodeType === 3) anc = anc.parentNode;
        const wrap = (anc as Element)?.closest?.('span[style*="color"]') as HTMLElement | null;
        const frag = range.extractContents();
        frag.querySelectorAll?.('span[style*="color"]').forEach(unwrapEl);
        range.insertNode(frag);
        if (wrap) {
          wrap.style.color = "";
          if (!(wrap.getAttribute("style") || "").trim()) unwrapEl(wrap);
        }
      } else {
        // clear at the caret: return typed text to the page's default colour
        withCss(true);
        document.execCommand("foreColor", false, getComputedStyle(el).color);
      }
      syncVisual();
    } else {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      const s = ta.selectionStart, e = ta.selectionEnd, sel = ta.value.slice(s, e);
      if (!sel) {
        useStore.getState().showToast("Select some text first");
        return;
      }
      const repl = hex
        ? `<span style="color:${hex}">${sel}</span>`
        : sel.replace(/<span style="color:[^"]*">([\s\S]*?)<\/span>/gi, "$1");
      document.execCommand("insertText", false, repl);
      syncFromEditor();
    }
  }

  /* ---- find-in-document ---- */
  function clearHighlight() {
    try {
      const h = (window as unknown as { CSS?: { highlights?: Map<string, unknown> } }).CSS?.highlights;
      h?.delete("omk-find");
    } catch {
      /* ignore */
    }
  }
  function visualTextNodes() {
    const root = contentRef.current!;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: { node: Node; start: number }[] = [];
    let s = "";
    let n: Node | null;
    while ((n = w.nextNode())) {
      nodes.push({ node: n, start: s.length });
      s += n.textContent;
    }
    return { nodes, text: s };
  }
  function runFind(q: string) {
    matchesRef.current = [];
    idxRef.current = -1;
    clearHighlight();
    if (!q) { setFindInfo(""); return; }
    const text =
      useStore.getState().view === "raw"
        ? textareaRef.current?.value || ""
        : (vCacheRef.current = visualTextNodes()).text;
    const ql = q.toLowerCase(), tl = text.toLowerCase();
    let i = tl.indexOf(ql);
    while (i >= 0) {
      matchesRef.current.push(i);
      i = tl.indexOf(ql, i + Math.max(1, ql.length));
    }
    if (!matchesRef.current.length) { setFindInfo("0/0"); return; }
    idxRef.current = 0;
    gotoMatch();
  }
  function gotoMatch() {
    const matches = matchesRef.current;
    if (idxRef.current < 0 || !matches.length) return;
    setFindInfo(idxRef.current + 1 + "/" + matches.length);
    const q = findQuery, start = matches[idxRef.current];
    if (useStore.getState().view === "raw") {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(start, start + q.length);
      const before = ta.value.slice(0, start).split("\n").length;
      const lineH = parseFloat(getComputedStyle(ta).lineHeight) || 22;
      ta.scrollTop = Math.max(0, (before - 5) * lineH);
      findInputRef.current?.focus();
    } else {
      if (!vCacheRef.current) vCacheRef.current = visualTextNodes();
      const cache = vCacheRef.current;
      const locate = (off: number) => {
        for (let k = cache.nodes.length - 1; k >= 0; k--)
          if (off >= cache.nodes[k].start)
            return { node: cache.nodes[k].node, o: off - cache.nodes[k].start };
        return { node: cache.nodes[0].node, o: 0 };
      };
      const a = locate(start), b = locate(start + q.length);
      try {
        const range = document.createRange();
        range.setStart(a.node, Math.min(a.o, a.node.textContent!.length));
        range.setEnd(b.node, Math.min(b.o, b.node.textContent!.length));
        const sel = window.getSelection()!;
        sel.removeAllRanges();
        sel.addRange(range);
        try {
          const w = window as unknown as {
            CSS?: { highlights?: Map<string, unknown> };
            Highlight?: new (r: Range) => unknown;
          };
          if (w.CSS?.highlights && w.Highlight)
            w.CSS.highlights.set("omk-find", new w.Highlight(range.cloneRange()));
        } catch {
          /* ignore */
        }
        const stageEl = contentRef.current?.closest(".stage") as HTMLElement | null;
        if (stageEl) {
          const r = range.getBoundingClientRect(), sr = stageEl.getBoundingClientRect();
          if (r.height) stageEl.scrollTop += r.top - sr.top - sr.height / 2;
        }
      } catch {
        /* ignore */
      }
    }
  }
  function stepFind(d: number) {
    const matches = matchesRef.current;
    if (!matches.length) return;
    idxRef.current = (idxRef.current + d + matches.length) % matches.length;
    gotoMatch();
  }
  function closeFind() {
    setFindOpen(false);
    setFindInfo("");
    matchesRef.current = [];
    idxRef.current = -1;
    clearHighlight();
    if (useStore.getState().view === "raw") textareaRef.current?.focus();
    else contentRef.current?.focus();
  }

  /* ---- insert image files (drag / picker / paste) as data URLs ---- */
  async function insertImageFiles(files: File[]) {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return;
    const urls = await Promise.all(
      imgs.map(
        (f) =>
          new Promise<string>((res) => {
            const r = new FileReader();
            r.onload = () => res(String(r.result));
            r.onerror = () => res("");
            r.readAsDataURL(f);
          })
      )
    );
    const pairs = urls.map((u, i) => ({ u, name: imgs[i].name })).filter((p) => p.u);
    if (!pairs.length) return;
    if (useStore.getState().view === "visual") {
      const el = contentRef.current;
      if (!el) return;
      el.focus();
      document.execCommand(
        "insertHTML",
        false,
        pairs.map((p) => `<img src="${p.u}" alt="${escHtml(p.name)}">`).join("")
      );
      syncVisual();
    } else {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      document.execCommand(
        "insertText",
        false,
        pairs.map((p) => `![${p.name}](${p.u})`).join("\n\n")
      );
      syncFromEditor();
    }
    useStore.getState().showToast(
      `Inserted ${pairs.length} image${pairs.length !== 1 ? "s" : ""}`
    );
  }

  /* ---- paste: normalize rich HTML (e.g. Notion) through Markdown so pasted
     headings/lists become semantic, matching the two-lens model ---- */
  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const cd = e.clipboardData;
    if (!cd) return;
    const imgs = [...cd.files].filter((f) => f.type.startsWith("image/"));
    if (imgs.length) {
      e.preventDefault();
      void insertImageFiles(imgs);
      return;
    }
    const html = cd.getData("text/html");
    if (!html || !html.trim()) return; // let the browser paste plain text
    e.preventDefault();
    let md = "";
    try {
      md = htmlToMarkdown(html);
    } catch {
      md = "";
    }
    if (!md.trim()) {
      document.execCommand("insertText", false, cd.getData("text/plain"));
      return;
    }
    let clean = "";
    try {
      clean = parseMarkdown(md).trim();
    } catch {
      clean = "";
    }
    // single paragraph → paste inline (don't split the current block)
    const single = clean.match(/^<p>([\s\S]*)<\/p>$/i);
    document.execCommand("insertHTML", false, single ? single[1] : clean);
    contentRef.current?.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
      a.target = "_blank";
      a.rel = "noopener";
    });
    syncVisual();
    refreshMarks();
  }

  useImperativeHandle(ref, () => ({
    format(a: FormatAction) {
      if (a === "link" || a === "img") {
        openInsertDialog(a === "link" ? "link" : "image");
        return;
      }
      if (useStore.getState().view === "visual") fmtVisual(a);
      else fmtRaw(a);
    },
    applyColor,
    openFind() {
      setFindOpen(true);
      const sel = String(window.getSelection()).trim();
      const seed = sel && sel.length <= 60 ? sel : "";
      setFindQuery(seed);
      vCacheRef.current = null;
      requestAnimationFrame(() => {
        findInputRef.current?.focus();
        findInputRef.current?.select();
        runFind(seed);
      });
    },
    insertImages: insertImageFiles,
  }));

  const dialogEl = dialog ? (
    <InsertDialog
      kind={dialog.kind}
      initialLabel={dialog.label}
      onSubmit={submitDialog}
      onCancel={cancelDialog}
    />
  ) : null;

  const findEl = findOpen ? (
    <div className="findbar">
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <input
        ref={findInputRef}
        value={findQuery}
        placeholder="Find in document…"
        onChange={(e) => {
          setFindQuery(e.target.value);
          runFind(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); stepFind(e.shiftKey ? -1 : 1); }
          else if (e.key === "Escape") { e.preventDefault(); closeFind(); }
        }}
      />
      <span className="find-count">{findInfo}</span>
      <button className="find-nav" data-tip="Previous" aria-label="Previous match" onClick={() => stepFind(-1)}>
        <svg viewBox="0 0 24 24" fill="none"><path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <button className="find-nav" data-tip="Next" aria-label="Next match" onClick={() => stepFind(1)}>
        <svg viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <button className="find-nav" data-tip="Close" aria-label="Close find" onClick={closeFind}>
        <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>
      </button>
    </div>
  ) : null;

  if (view === "visual") {
    return (
      <>
        {findEl}
        <div
          key="visual"
          id="content"
          ref={contentRef}
          className="reader"
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onInput={() => {
            if (selectedImg.current) clearImageSel();
            scheduleVisualSync();
          }}
          onKeyDown={handleVisualKeyDown}
          onBlur={flushVisual}
          onPaste={handlePaste}
          onClick={(e) => {
            const t = e.target as HTMLElement;
            if (t && t.tagName === "IMG") selectImage(t as HTMLImageElement);
            else clearImageSel();
          }}
        />
        {imgBox && (
          <div
            className="img-resize"
            style={{
              left: imgBox.left,
              top: imgBox.top,
              width: imgBox.width,
              height: imgBox.height,
            }}
          >
            {(["nw", "ne", "sw", "se"] as const).map((c) => (
              <span
                key={c}
                className={`irh irh-${c}`}
                onMouseDown={(e) => startResize(e, c)}
              />
            ))}
          </div>
        )}
        {dialogEl}
      </>
    );
  }
  return (
    <>
      {findEl}
      <div key="raw" id="content" ref={contentRef} className="editorwrap">
        <textarea
          ref={textareaRef}
          id="editor"
          className="editor"
          spellCheck={false}
          defaultValue=""
          onInput={syncFromEditor}
        />
      </div>
      {dialogEl}
    </>
  );
});

export default Stage;
