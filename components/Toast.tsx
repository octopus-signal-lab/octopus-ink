"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

const TOAST_MS = 1900;

export default function Toast() {
  const toast = useStore((s) => s.toast);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <div className={`hint${visible ? " show" : ""}`}>
      <span className="dot" />
      <span>{toast?.msg ?? ""}</span>
    </div>
  );
}
