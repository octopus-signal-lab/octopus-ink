"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, LinkIcon } from "./icons";

export interface InsertDialogProps {
  kind: "link" | "image";
  initialLabel: string;
  onSubmit: (url: string, label: string) => void;
  onCancel: () => void;
}

export default function InsertDialog({
  kind,
  initialLabel,
  onSubmit,
  onCancel,
}: InsertDialogProps) {
  const isLink = kind === "link";
  const [label, setLabel] = useState(initialLabel);
  const [url, setUrl] = useState("");
  const urlRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function chooseLocal() {
    fileRef.current?.click();
  }
  function onLocalFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      onSubmit(String(reader.result), label.trim() || file.name.replace(/\.[^.]+$/, ""));
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    // Focus the label first for a link with no pre-selected text, else the URL.
    if (isLink && !initialLabel) labelRef.current?.focus();
    else urlRef.current?.focus();
  }, [isLink, initialLabel]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function submit() {
    const u = url.trim();
    if (!u) {
      urlRef.current?.focus();
      return;
    }
    onSubmit(u, label.trim());
  }

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  const labelField = (
    <div className="dlg-field">
      <label className="dlg-label">{isLink ? "Link text" : "Alt text"}</label>
      <input
        ref={labelRef}
        className="dlg-input"
        value={label}
        placeholder={isLink ? "Text to display" : "Describe the image"}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={onEnter}
      />
    </div>
  );

  const urlField = (
    <div className="dlg-field">
      <label className="dlg-label">{isLink ? "URL" : "Image URL"}</label>
      <input
        ref={urlRef}
        className="dlg-input"
        value={url}
        inputMode="url"
        placeholder={isLink ? "https://…" : "https://… or path/to.png"}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={onEnter}
      />
    </div>
  );

  return (
    <div
      className="dlg-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="dlg" role="dialog" aria-modal="true">
        <h3>
          {isLink ? <LinkIcon /> : <ImageIcon />}
          {isLink ? "Insert link" : "Insert image"}
        </h3>
        {isLink ? (
          <>
            {labelField}
            {urlField}
          </>
        ) : (
          <>
            {urlField}
            {labelField}
            <div className="dlg-or">or</div>
            <button className="dlg-btn ghost dlg-choose" onClick={chooseLocal}>
              <ImageIcon />
              Choose from computer…
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hide"
              onChange={onLocalFile}
            />
          </>
        )}
        <div className="dlg-actions">
          <button className="dlg-btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="dlg-btn primary" onClick={submit}>
            Insert {isLink ? "link" : "image"}
          </button>
        </div>
      </div>
    </div>
  );
}
