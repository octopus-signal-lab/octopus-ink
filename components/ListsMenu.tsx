"use client";

import ToolbarDropdown from "./ToolbarDropdown";
import type { FormatAction } from "./Stage";

const BulletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M8 7h12M8 12h12M8 17h9M4 7h.01M4 12h.01M4 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const NumberIcon = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M10 7h10M10 12h10M10 17h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M4 6h1v4M4 10h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 18H4c0-1 2-1.4 2-2.4S5 14.2 4 14.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const TaskIcon = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <rect x="3.5" y="4.5" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.7" />
    <path d="m5 8 1.6 1.6L9 6.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 8h6M14 17h6M3.5 17h.01M3.5 17.5l1.5 1.5 2.5-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ITEMS = [
  { a: "list" as FormatAction, label: "Bulleted list", icon: <BulletIcon /> },
  { a: "olist" as FormatAction, label: "Numbered list", icon: <NumberIcon /> },
  { a: "task" as FormatAction, label: "Task list", icon: <TaskIcon /> },
];

export default function ListsMenu({
  onFormat,
}: {
  onFormat: (a: FormatAction) => void;
}) {
  return (
    <ToolbarDropdown
      renderTrigger={(open, toggle) => (
        <button
          className={`tool${open ? " open" : ""}`}
          data-tip="Lists"
          onClick={toggle}
        >
          <BulletIcon />
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
            {it.icon}
            {it.label}
          </button>
        ))
      }
    </ToolbarDropdown>
  );
}
