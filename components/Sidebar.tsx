"use client";

import { Fragment } from "react";
import { filterFiles, useStore } from "@/lib/store";
import { refreshSource, reopenRestored } from "@/lib/fileSystem";
import AddDocumentMenu from "./AddDocumentMenu";
import { SearchIcon } from "./icons";

interface SidebarProps {
  onOpenFile: () => void;
  onNewDoc: () => void;
  onOpenFolder: () => void;
  onImport: () => void;
  onAbout: () => void;
}

const Caret = () => (
  <svg className="grp-caret" viewBox="0 0 24 24" fill="none">
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const FolderGlyph = () => (
  <svg className="grp-folder" viewBox="0 0 24 24" fill="none">
    <path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);
const DocGlyph = () => (
  <svg className="grp-folder" viewBox="0 0 24 24" fill="none">
    <path d="M7 3.5h7l4 4v13H7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M14 3.5v4h4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);

export default function Sidebar({
  onOpenFile,
  onNewDoc,
  onOpenFolder,
  onImport,
  onAbout,
}: SidebarProps) {
  const files = useStore((s) => s.files);
  const activeId = useStore((s) => s.activeId);
  const query = useStore((s) => s.query);
  const collapsedGroups = useStore((s) => s.collapsedGroups);
  const folderSources = useStore((s) => s.folderSources);
  const sourceHandles = useStore((s) => s.sourceHandles);
  const restoreHandle = useStore((s) => s.restoreHandle);
  const setQuery = useStore((s) => s.setQuery);
  const openDoc = useStore((s) => s.openDoc);
  const closeDoc = useStore((s) => s.closeDoc);
  const removeSource = useStore((s) => s.removeSource);
  const toggleGroup = useStore((s) => s.toggleGroup);

  const shown = filterFiles(files, query);
  const groups = new Map<string, typeof files>();
  for (const f of shown) {
    const arr = groups.get(f.group) ?? [];
    arr.push(f);
    groups.set(f.group, arr);
  }
  const groupKeys = [...groups.keys()].sort();

  return (
    <aside className="rail">
      <div className="rail-head">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element -- brand wordmark sized via CSS */}
          <img className="brand-mark" src="/octopus-logo-text.png" alt="Octopus Ink" />
        </div>
        <div className="openrow">
          <AddDocumentMenu
            onOpenFile={onOpenFile}
            onNewDoc={onNewDoc}
            onOpenFolder={onOpenFolder}
            onImport={onImport}
          />
        </div>
        {restoreHandle && (
          <button
            className="open-btn ghost full"
            style={{ width: "100%", marginTop: 10 }}
            onClick={() => void reopenRestored()}
          >
            ↻ Reopen “{restoreHandle.name}”
          </button>
        )}
      </div>

      <div className="searchwrap">
        <SearchIcon />
        <input
          className="search"
          placeholder="Filter files…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            className="search-clear"
            data-tip="Clear filter"
            aria-label="Clear filter"
            onClick={() => setQuery("")}
          >
            <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>
          </button>
        )}
      </div>

      <div className="filelist">
        {!files.length ? (
          <div className="empty-list">
            No files yet.
            <br />
            Open a file or folder, or drop{" "}
            <code style={{ color: "var(--gold-soft)" }}>.md</code> files anywhere.
          </div>
        ) : !shown.length ? (
          <div className="empty-list">No files match.</div>
        ) : (
          groupKeys.map((g) => {
            const isCol = collapsedGroups.includes(g);
            const isFolder = folderSources.includes(g);
            const canRefresh = !!sourceHandles[g];
            return (
              <Fragment key={g}>
                <div
                  className={`grp-name${isCol ? " collapsed" : ""}`}
                  onClick={() => toggleGroup(g)}
                >
                  <Caret />
                  {isFolder ? <FolderGlyph /> : <DocGlyph />}
                  <span className="grp-t">{g || "Files"}</span>
                  <span className="grp-count">{groups.get(g)!.length}</span>
                  <span className="grp-acts">
                    {canRefresh && (
                      <button
                        className="grp-act"
                        data-tip="Re-scan folder for changes"
                        aria-label={`Refresh ${g}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          void refreshSource(g);
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none"><path d="M20 11a8 8 0 1 0-.6 4M20 5v6h-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    )}
                    <button
                      className="grp-act grp-x"
                      data-tip="Close this folder"
                      aria-label={`Close ${g || "Files"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSource(g);
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    </button>
                  </span>
                </div>
                {!isCol &&
                  groups.get(g)!.map((f) => (
                    <div
                      key={f.id}
                      className={`file${f.id === activeId ? " on" : ""}${f.dirty ? " dirty" : ""}`}
                      data-tip={f.path}
                      onClick={() => openDoc(f.id)}
                    >
                      <span className="dot" />
                      <span className="nm">{f.name}</span>
                      <button
                        className="file-x"
                        aria-label={`Close ${f.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          closeDoc(f.id);
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                      </button>
                    </div>
                  ))}
              </Fragment>
            );
          })
        )}
      </div>

      <button className="rail-foot" data-tip="About &amp; help" onClick={onAbout}>
        <span className="rf-mark" />
        <span className="rf-name">About &amp; help</span>
        <span className="rf-ver">v1.0</span>
      </button>
    </aside>
  );
}
