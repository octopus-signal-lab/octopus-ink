"use client";

import { DownloadIcon } from "./icons";

export default function DropOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="drop-over">
      <div className="box">
        <DownloadIcon />
        <div className="dt">Drop markdown files to open</div>
      </div>
    </div>
  );
}
