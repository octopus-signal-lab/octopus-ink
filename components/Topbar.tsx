"use client";

import { useEffect, useState } from "react";
import { computeMeta } from "@/lib/markdown";
import { useStore } from "@/lib/store";
import { renameActive } from "@/lib/fileSystem";
import { CodeIcon, EyeIcon } from "./icons";

export default function Topbar() {
  const files = useStore((s) => s.files);
  const activeId = useStore((s) => s.activeId);
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);

  const f = files.find((x) => x.id === activeId);
  const meta = f ? computeMeta(f.text) : null;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  // Leave edit mode if the active document changes.
  useEffect(() => {
    setEditing(false);
  }, [activeId]);

  function startEdit() {
    if (!f) return;
    setDraft(f.name);
    setEditing(true);
  }
  function commit() {
    setEditing(false);
    const v = draft.trim();
    if (f && v && v !== f.name) void renameActive(v);
  }

  return (
    <div className="topbar">
      <div className="doc-title">
        {f ? (
          editing ? (
            <input
              className="t-input"
              value={draft}
              autoFocus
              spellCheck={false}
              aria-label="Document name"
              onChange={(e) => setDraft(e.target.value)}
              onFocus={(e) => {
                const dot = draft.lastIndexOf(".");
                e.target.setSelectionRange(0, dot > 0 ? dot : draft.length);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setEditing(false);
                }
              }}
              onBlur={commit}
            />
          ) : (
            <div
              className="t editable"
              onClick={startEdit}
              title="Click to rename"
            >
              {f.name}
            </div>
          )
        ) : (
          <div className="t placeholder">No document open</div>
        )}
        {f && meta && (
          <div className="s">
            <span>{meta.words.toLocaleString()} words</span>
            <span className="pip" />
            <span>{meta.minutes} min read</span>
          </div>
        )}
      </div>

      <div className="lens" role="tablist">
        <div
          className="glide"
          style={{
            transform: view === "raw" ? "translateX(100%)" : "translateX(0)",
          }}
        />
        <div
          className={`seg${view === "visual" ? " on" : ""}`}
          role="tab"
          aria-selected={view === "visual"}
          onClick={() => setView("visual")}
        >
          <EyeIcon />
          Visual
        </div>
        <div
          className={`seg${view === "raw" ? " on" : ""}`}
          role="tab"
          aria-selected={view === "raw"}
          onClick={() => setView("raw")}
        >
          <CodeIcon />
          Raw
        </div>
      </div>
    </div>
  );
}
