"use client";

interface MobileGateProps {
  onReadSingle: () => void;
  onContinue: () => void;
}

export default function MobileGate({
  onReadSingle,
  onContinue,
}: MobileGateProps) {
  return (
    <div className="mobile-gate">
      <div className="mg-card">
        {/* eslint-disable-next-line @next/next/no-img-element -- gate hero PNG sized via CSS (.mg-card img) */}
        <img src="/octopus-doc.png" alt="Octopus Ink" />
        <h2>Octopus Ink is built for desktop</h2>
        <p>
          Browsing a local folder, editing, and saving to disk use desktop
          browser features (Chrome or Edge on a computer). Everything stays on
          your device — nothing is ever uploaded.
        </p>
        <button className="mg-btn primary" onClick={onReadSingle}>
          Read a single file
        </button>
        <button className="mg-btn ghost" onClick={onContinue}>
          Continue anyway
        </button>
      </div>
    </div>
  );
}
