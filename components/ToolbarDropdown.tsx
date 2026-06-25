"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface ToolbarDropdownProps {
  renderTrigger: (open: boolean, toggle: (e: React.MouseEvent) => void) => ReactNode;
  children: (close: () => void) => ReactNode;
}

/* A toolbar dropdown whose popover is portaled to <body> so the toolbar's
   scroll-mask container can never clip it (see CHANGES_toolbar-grouping). */
export default function ToolbarDropdown({ renderTrigger, children }: ToolbarDropdownProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const willOpen = !open;
    if (willOpen) {
      const btn = wrapRef.current?.querySelector("button") ?? wrapRef.current;
      const r = (btn as HTMLElement).getBoundingClientRect();
      const left = Math.min(r.left, window.innerWidth - 228);
      setPos({ left: Math.max(8, left), top: r.bottom + 6 });
    }
    setOpen(willOpen);
  };

  return (
    <div
      className="color-wrap"
      ref={wrapRef}
      // keep the editor selection alive (block/list actions operate on the caret)
      onMouseDown={(e) => e.preventDefault()}
    >
      {renderTrigger(open, toggle)}
      {open &&
        createPortal(
          <div
            className="menu menu-float"
            ref={popRef}
            style={{ left: pos.left, top: pos.top }}
            onMouseDown={(e) => e.preventDefault()}
          >
            {children(() => setOpen(false))}
          </div>,
          document.body
        )}
    </div>
  );
}
