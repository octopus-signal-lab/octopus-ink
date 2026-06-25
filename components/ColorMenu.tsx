"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

/* theme-tuned palettes: vivid on dark, deeper on light parchment */
const PALETTES: Record<string, Record<string, string>> = {
  dark: { brass: "#e3c486", red: "#ff5a4d", amber: "#ff9d4d", teal: "#58b3a5", violet: "#9860ed", pink: "#d374c0", grey: "#9b9486" },
  light: { brass: "#a9781d", red: "#c5301f", amber: "#bb6a13", teal: "#1c7d6e", violet: "#6536b8", pink: "#a83d8f", grey: "#6f6a60" },
};
const NAMES = ["brass", "red", "amber", "teal", "violet", "pink", "grey"];
const LABELS: Record<string, string> = {
  brass: "Brass", red: "Red", amber: "Amber", teal: "Teal", violet: "Violet", pink: "Pink", grey: "Grey",
};

export default function ColorMenu({ onApply }: { onApply: (hex: string) => void }) {
  const docTheme = useStore((s) => s.docTheme);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const [lastName, setLastName] = useState("brass");
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const n = localStorage.getItem("mdv-colorname");
    if (n) setLastName(n);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  const pal = PALETTES[docTheme] || PALETTES.dark;
  const barColor = pal[lastName] || pal.brass;

  function pick(name: string) {
    const hex = name ? pal[name] : "";
    onApply(hex);
    if (name) {
      setLastName(name);
      localStorage.setItem("mdv-colorname", name);
    }
    setOpen(false);
  }

  return (
    <div className="color-wrap" ref={wrapRef}>
      <button
        ref={btnRef}
        className="tool color-btn"
        data-tip="Text color"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          const willOpen = !open;
          if (willOpen) {
            const r = btnRef.current!.getBoundingClientRect();
            // left-aligned to the trigger, like the other toolbar dropdowns
            const W = 168; // ~popover width
            const left = Math.max(8, Math.min(r.left, window.innerWidth - W - 8));
            setPos({ left, top: r.bottom + 8 });
          }
          setOpen(willOpen);
        }}
      >
        <span className="ca">A</span>
        <span className="cbar" style={{ background: barColor }} />
      </button>
      {open &&
        createPortal(
          <div
            className="color-pop"
            style={{ left: pos.left, top: pos.top }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="cp-grid">
              <button className="swatch sw-def" data-tip="Default color" onClick={() => pick("")}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M5 19 19 5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                </svg>
              </button>
              {NAMES.map((n) => (
                <button
                  key={n}
                  className={`swatch${n === lastName ? " on" : ""}`}
                  data-tip={LABELS[n]}
                  style={{ background: pal[n] }}
                  onClick={() => pick(n)}
                />
              ))}
            </div>
            <div className="cp-note">Tuned for the current page theme</div>
          </div>,
          document.body
        )}
    </div>
  );
}
