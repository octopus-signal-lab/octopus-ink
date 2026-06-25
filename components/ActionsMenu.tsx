"use client";

import { useEffect, useRef, useState } from "react";
import { activeFile, useStore } from "@/lib/store";
import {
  copyPath,
  copySource,
  downloadMd,
  exportHTML,
  exportPDF,
  saveActive,
} from "@/lib/fileSystem";
import {
  CaretDownIcon,
  CodeIcon,
  CopyIcon,
  DownloadIcon,
  LinkIcon,
  PdfIcon,
  SaveIcon,
  SparkIcon,
} from "./icons";

export default function ActionsMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  function run(act: "save" | "download" | "pdf" | "html" | "copy" | "copypath") {
    setOpen(false);
    const f = activeFile(useStore.getState());
    if (act === "save") {
      void saveActive();
      return;
    }
    if (!f) {
      useStore.getState().showToast("No document open");
      return;
    }
    if (act === "download") downloadMd(f);
    else if (act === "pdf") exportPDF(f);
    else if (act === "html") exportHTML(f);
    else if (act === "copy") copySource(f);
    else if (act === "copypath") copyPath(f);
  }

  return (
    <div className="menu-wrap" ref={wrapRef}>
      <button
        className={`actions-btn${open ? " open" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <SparkIcon className="lead" />
        Actions
        <CaretDownIcon className="caret" />
      </button>
      {open && (
        <div className="menu">
          <button className="menu-item" onClick={() => run("save")}>
            <SaveIcon />
            Save<span className="k">⌘S</span>
          </button>
          <button className="menu-item" onClick={() => run("download")}>
            <DownloadIcon />
            Save as .md
          </button>
          <div className="menu-sep" />
          <button className="menu-item" onClick={() => run("pdf")}>
            <PdfIcon />
            Export to PDF
          </button>
          <button className="menu-item" onClick={() => run("html")}>
            <CodeIcon />
            Export to HTML
          </button>
          <div className="menu-sep" />
          <button className="menu-item" onClick={() => run("copy")}>
            <CopyIcon />
            Copy source
          </button>
          <button className="menu-item" onClick={() => run("copypath")}>
            <LinkIcon />
            Copy file path
          </button>
        </div>
      )}
    </div>
  );
}
