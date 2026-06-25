"use client";

import { useStore } from "@/lib/store";
import ToolbarDropdown from "./ToolbarDropdown";
import type { FormatAction } from "./Stage";

const ITEMS: { a: FormatAction; label: string; cls: string }[] = [
  { a: "normal", label: "Normal text", cls: "ts-normal" },
  { a: "h1", label: "Heading 1", cls: "ts-h1" },
  { a: "h2", label: "Heading 2", cls: "ts-h2" },
  { a: "h3", label: "Heading 3", cls: "ts-h3" },
];

export default function TextStyleMenu({
  onFormat,
}: {
  onFormat: (a: FormatAction) => void;
}) {
  const block = useStore((s) => s.activeMarks.block);
  const current: FormatAction =
    block === "h1" ? "h1" : block === "h2" ? "h2" : block === "h3" ? "h3" : "normal";
  const label =
    current === "h1"
      ? "Heading 1"
      : current === "h2"
        ? "Heading 2"
        : current === "h3"
          ? "Heading 3"
          : "Normal";

  return (
    <ToolbarDropdown
      renderTrigger={(open, toggle) => (
        <button
          className={`tool ts-trigger${open ? " open" : ""}`}
          data-tip="Text style"
          onClick={toggle}
        >
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M5 6.3V5h14v1.3M12 5.2v13.6M9.6 18.8h4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="ts-label">{label}</span>
        </button>
      )}
    >
      {(close) =>
        ITEMS.map((it) => (
          <button
            key={it.a}
            className="menu-item"
            onClick={() => {
              onFormat(it.a);
              close();
            }}
          >
            <span className={`ts-prev ${it.cls}`}>{it.label}</span>
            {current === it.a && <span className="chk">✓</span>}
          </button>
        ))
      }
    </ToolbarDropdown>
  );
}
