"use client";

import { useEffect, useRef, useState } from "react";
import {
  CaretDownIcon,
  FileIcon,
  FolderIcon,
  ImportIcon,
  NewDocIcon,
  PlusIcon,
} from "./icons";

interface AddDocumentMenuProps {
  onOpenFile: () => void;
  onNewDoc: () => void;
  onOpenFolder: () => void;
  onImport: () => void;
}

export default function AddDocumentMenu({
  onOpenFile,
  onNewDoc,
  onOpenFolder,
  onImport,
}: AddDocumentMenuProps) {
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

  function run(fn: () => void) {
    setOpen(false);
    fn();
  }

  return (
    <div className="open-menu-wrap" ref={wrapRef}>
      <button
        className={`open-btn primary openmenu-btn${open ? " open" : ""}`}
        aria-haspopup="true"
        title="Open, create or import a document"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <PlusIcon className="lead" />
        Add document
        <CaretDownIcon className="caret" />
      </button>
      {open && (
        <div className="menu">
          <button className="menu-item" onClick={() => run(onOpenFile)}>
            <FileIcon />
            Open file<span className="k">⌘O</span>
          </button>
          <button className="menu-item" onClick={() => run(onNewDoc)}>
            <NewDocIcon />
            New document<span className="k">⌘N</span>
          </button>
          <button className="menu-item" onClick={() => run(onOpenFolder)}>
            <FolderIcon />
            Open folder<span className="k">⌘⇧O</span>
          </button>
          <div className="menu-sep" />
          <button
            className="menu-item"
            title="Convert .docx, .html or .txt to Markdown"
            onClick={() => run(onImport)}
          >
            <ImportIcon />
            Import &amp; convert…
          </button>
        </div>
      )}
    </div>
  );
}
