"use client";

import { useEffect, useState } from "react";

interface TipState {
  label: string;
  key?: string;
  left: number;
  top: number;
}

/** A single body-level branded tooltip driven by data-tip / data-key attributes. */
export default function Tooltip() {
  const [tip, setTip] = useState<TipState | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    let cur: Element | null = null;

    const show = (el: Element) => {
      const label = el.getAttribute("data-tip");
      if (!label) return;
      const key = el.getAttribute("data-key") || undefined;
      const r = el.getBoundingClientRect();
      const below = r.bottom + 8;
      const flip = below > window.innerHeight - 44;
      setTip({
        label,
        key,
        left: r.left + r.width / 2,
        top: flip ? r.top - 38 : below,
      });
    };

    const onOver = (e: MouseEvent) => {
      const el = (e.target as Element)?.closest?.("[data-tip]");
      if (el === cur) return;
      window.clearTimeout(timer);
      cur = el;
      if (!el) {
        setTip(null);
        return;
      }
      timer = window.setTimeout(() => show(el), 380);
    };
    const hide = () => {
      window.clearTimeout(timer);
      cur = null;
      setTip(null);
    };
    const onOut = (e: MouseEvent) => {
      if ((e.target as Element)?.closest?.("[data-tip]")) hide();
    };

    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    window.addEventListener("mousedown", hide, true);
    window.addEventListener("scroll", hide, true);
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("mousedown", hide, true);
      window.removeEventListener("scroll", hide, true);
      window.clearTimeout(timer);
    };
  }, []);

  if (!tip) return null;
  return (
    <div className="tip show" style={{ left: tip.left, top: tip.top }}>
      {tip.label}
      {tip.key && <span className="tk">{tip.key}</span>}
    </div>
  );
}
