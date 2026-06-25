"use client";

import { FileIcon, FolderIcon } from "./icons";

interface WelcomeProps {
  onOpenFile: () => void;
  onOpenFolder: () => void;
}

export default function Welcome({ onOpenFile, onOpenFolder }: WelcomeProps) {
  return (
    <div className="welcome">
      <div className="inner">
        <div className="big">
          {/* eslint-disable-next-line @next/next/no-img-element -- welcome hero PNG,
              fixed 208px (150px on mobile via CSS) */}
          <img
            src="/octopus-doc.png"
            alt=""
            style={{
              width: 208,
              height: 208,
              objectFit: "contain",
              filter: "drop-shadow(0 10px 26px rgba(0,0,0,0.5))",
            }}
          />
        </div>
        <h2>Your markdown, two ways.</h2>
        <p>
          Open a file or folder, start a new doc, or import and convert. Edit it
          live in the rendered <strong>Visual</strong> view or the{" "}
          <strong>Raw</strong> source. Drag files in anywhere, or press{" "}
          <kbd>⌘O</kbd>.
        </p>
        <div
          className="openrow"
          style={{ justifyContent: "center", maxWidth: 320, margin: "0 auto" }}
        >
          <button className="open-btn primary" onClick={onOpenFile}>
            <FileIcon />
            Open file
          </button>
          <button className="open-btn ghost" onClick={onOpenFolder}>
            <FolderIcon />
            Folder
          </button>
        </div>
      </div>
    </div>
  );
}
