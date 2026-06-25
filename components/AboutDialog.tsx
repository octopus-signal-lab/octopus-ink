"use client";

import { useEffect, useState } from "react";

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
  onOpenHelp: () => void;
}

const LAB = "https://octosignal.org/";

export default function AboutDialog({
  open,
  onClose,
  onOpenHelp,
}: AboutDialogProps) {
  const [acks, setAcks] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAcks(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="about-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="about-card" role="dialog" aria-modal="true" aria-label="About Octopus Ink">
        <button className="about-x" aria-label="Close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          </svg>
        </button>

        {!acks ? (
          <div className="about-main">
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative icon */}
            <img className="about-logo" src="/octopus-doc.png" alt="" />
            <div className="about-name">Octopus Ink</div>
            <div className="about-sub">
              Version 1.0 · an{" "}
              <a className="lab-link" href={LAB} target="_blank" rel="noopener">
                <b>OctoSignal Lab</b>
              </a>{" "}
              tool
            </div>
            <p className="about-desc">
              A local-first Markdown reader and editor. Your files never leave
              your device. Everything is read, edited, and saved right here in
              the web-app.
            </p>
            <div className="about-links">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  onOpenHelp();
                }}
              >
                FAQ
              </a>
              <a href="https://octosignal.org/privacy" target="_blank" rel="noopener">
                Privacy
              </a>
              <a href="https://octosignal.org/legal" target="_blank" rel="noopener">
                Terms
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setAcks(true);
                }}
              >
                Acknowledgements
              </a>
            </div>
            <div className="about-foot">
              © 2026{" "}
              <a className="lab-link" href={LAB} target="_blank" rel="noopener">
                OctoSignal Lab
              </a>
            </div>
          </div>
        ) : (
          <div className="about-acks">
            <button className="acks-back" onClick={() => setAcks(false)}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
            <div className="acks-title">Acknowledgements</div>
            <p className="acks-intro">
              Octopus Ink is free, and built with these open-source projects:
            </p>
            <ul className="acks-list">
              <li>
                <span className="an">marked</span>
                <span className="al">MIT · Markdown → HTML</span>
              </li>
              <li>
                <span className="an">Turndown</span>
                <span className="al">MIT · HTML → Markdown</span>
              </li>
              <li>
                <span className="an">turndown-plugin-gfm</span>
                <span className="al">MIT · GFM tables &amp; tasks</span>
              </li>
              <li>
                <span className="an">mammoth.js</span>
                <span className="al">BSD-2-Clause · .docx → HTML</span>
              </li>
              <li>
                <span className="an">Manrope &amp; Playfair Display</span>
                <span className="al">SIL Open Font License</span>
              </li>
            </ul>
            <p className="acks-note">
              Each library is used under its own license, and copyrights remain
              with their authors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
