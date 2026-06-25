"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export default function ConfirmDialog() {
  const confirm = useStore((s) => s.confirm);
  const settle = useStore((s) => s.settleConfirm);

  useEffect(() => {
    if (!confirm) return;
    // This dialog only ever guards destructive actions, so the safe default is
    // Cancel: Esc and Enter both cancel; the user must click Discard to confirm.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        settle(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirm, settle]);

  if (!confirm) return null;
  return (
    <div
      className="confirm-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) settle(false);
      }}
    >
      <div className="confirm-card" role="dialog" aria-modal="true">
        <div className="confirm-title">{confirm.title}</div>
        <p
          className="confirm-msg"
          dangerouslySetInnerHTML={{ __html: confirm.msg }}
        />
        <div className="confirm-actions">
          <button
            className="confirm-btn ghost"
            autoFocus
            onClick={() => settle(false)}
          >
            {confirm.cancel}
          </button>
          <button className="confirm-btn danger" onClick={() => settle(true)}>
            {confirm.ok}
          </button>
        </div>
      </div>
    </div>
  );
}
