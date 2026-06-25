"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import type { FormatAction } from "./Stage";
import ActionsMenu from "./ActionsMenu";
import ColorMenu from "./ColorMenu";
import TextStyleMenu from "./TextStyleMenu";
import ListsMenu from "./ListsMenu";

interface FormattingToolbarProps {
  onFormat: (action: FormatAction) => void;
  onApplyColor: (hex: string) => void;
}

export default function FormattingToolbar({
  onFormat,
  onApplyColor,
}: FormattingToolbarProps) {
  const files = useStore((s) => s.files);
  const activeId = useStore((s) => s.activeId);
  const docTheme = useStore((s) => s.docTheme);
  const setDocTheme = useStore((s) => s.setDocTheme);
  const marks = useStore((s) => s.activeMarks);
  const f = files.find((x) => x.id === activeId);
  const subtoolsRef = useRef<HTMLDivElement>(null);

  // Edge fade when the formatting tools overflow horizontally.
  useEffect(() => {
    const el = subtoolsRef.current;
    if (!el) return;
    const update = () => {
      const sl = el.scrollLeft;
      const max = el.scrollWidth - el.clientWidth;
      const l = sl > 2, r = sl < max - 2;
      let mask = "none";
      if (l && r) mask = "linear-gradient(90deg,transparent 0,#000 28px,#000 calc(100% - 28px),transparent 100%)";
      else if (r) mask = "linear-gradient(90deg,#000 calc(100% - 32px),transparent 100%)";
      else if (l) mask = "linear-gradient(90deg,transparent 0,#000 32px)";
      el.style.webkitMaskImage = mask;
      el.style.maskImage = mask;
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    let ro: ResizeObserver | undefined;
    try {
      ro = new ResizeObserver(update);
      ro.observe(el);
    } catch {
      /* ignore */
    }
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, []);

  return (
    <div className="subbar">
      <div
        className="subtools"
        ref={subtoolsRef}
        // Keep the Visual editor's selection alive: don't let a tool button
        // take focus on mousedown (which would collapse the contenteditable range).
        onMouseDown={(e) => {
          if (e.target !== e.currentTarget) e.preventDefault();
        }}
      >
        <button className="tool" data-tip="Undo" data-key="⌘Z" onClick={() => onFormat("undo")}>
          <svg viewBox="0 0 24 24" fill="none"><path d="M8 8H5V5M5 8a9 9 0 1 1-2 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button className="tool" data-tip="Redo" data-key="⇧⌘Z" onClick={() => onFormat("redo")}>
          <svg viewBox="0 0 24 24" fill="none"><path d="M16 8h3V5M19 8a9 9 0 1 0 2 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div className="divv" />
        <TextStyleMenu onFormat={onFormat} />
        <div className="divv" />
        <button className={`fmt${marks.bold ? " on" : ""}`} style={{ fontWeight: 800 }} data-tip="Bold" data-key="⌘B" onClick={() => onFormat("bold")}>B</button>
        <button
          className={`fmt${marks.italic ? " on" : ""}`}
          style={{ fontFamily: "Georgia,'Times New Roman',serif", fontStyle: "italic", fontSize: 16, fontWeight: 500 }}
          data-tip="Italic"
          data-key="⌘I"
          onClick={() => onFormat("italic")}
        >
          I
        </button>
        <button className={`fmt${marks.code ? " on" : ""}`} style={{ fontFamily: "var(--mono)", fontSize: 13 }} data-tip="Inline code" onClick={() => onFormat("code")}>
          &lt;&gt;
        </button>
        <ColorMenu onApply={onApplyColor} />
        <ListsMenu onFormat={onFormat} />
        <button className="tool" data-tip="Quote" onClick={() => onFormat("quote")}>
          <svg viewBox="0 0 24 24" fill="none"><path d="M9 7c-2 1-3 3-3 6h3v4H4v-5c0-3 1.5-5 5-5zM19 7c-2 1-3 3-3 6h3v4h-5v-5c0-3 1.5-5 5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
        </button>
        <button className="tool" data-tip="Divider" onClick={() => onFormat("hr")}>
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 12h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
        <div className="divv" />
        <button className="tool link-tool" data-tip="Link" onClick={() => onFormat("link")}>
          <svg viewBox="0 0 24 24" fill="none"><path d="M10.4 13.6a3.6 3.6 0 0 0 5.1 0l3-3a3.6 3.6 0 1 0-5.1-5.1l-1.6 1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.6 10.4a3.6 3.6 0 0 0-5.1 0l-3 3a3.6 3.6 0 1 0 5.1 5.1l1.6-1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button className="tool" data-tip="Image" onClick={() => onFormat("img")}>
          <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" /><circle cx="9" cy="10" r="1.6" stroke="currentColor" strokeWidth="1.5" /><path d="m5 17 5-4 4 3 3-2 2 2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
        </button>
        <div className="divv" />
        <button
          className={`tool theme-toggle ${docTheme === "light" ? "stage-light-state" : "stage-dark-state"}`}
          data-tip={docTheme === "light" ? "Dark page" : "Light page"}
          onClick={() => setDocTheme(docTheme === "light" ? "dark" : "light")}
        >
          <svg className="i-sun" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" /><path d="M12 2.5v2.2M12 19.3v2.2M4.3 12H2.1M21.9 12h-2.2M5.6 5.6 4 4M20 20l-1.6-1.6M18.4 5.6 20 4M4 20l1.6-1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          <svg className="i-moon" viewBox="0 0 24 24" fill="none"><path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        </button>
      </div>

      <div className="sub-right">
        {f?.dirty ? (
          <>
            <span className="src-pip" />
            Unsaved changes
          </>
        ) : f?.handle ? (
          "Saved"
        ) : (
          ""
        )}
      </div>
      <div className="divv" />
      <ActionsMenu />
    </div>
  );
}
