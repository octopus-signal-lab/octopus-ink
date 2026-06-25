"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import {
  handleDrop,
  ingestFiles,
  ingestImport,
  ingestWebkitDirectory,
  openFilesFSA,
  openFolderFSA,
  saveActive,
  tryRestore,
} from "@/lib/fileSystem";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import FormattingToolbar from "@/components/FormattingToolbar";
import Stage, { type StageHandle } from "@/components/Stage";
import Welcome from "@/components/Welcome";
import DropOverlay from "@/components/DropOverlay";
import Toast from "@/components/Toast";
import MobileGate from "@/components/MobileGate";
import ConfirmDialog from "@/components/ConfirmDialog";
import AboutDialog from "@/components/AboutDialog";
import HelpDialog from "@/components/HelpDialog";
import Tooltip from "@/components/Tooltip";
import { ChevronLeftIcon } from "@/components/icons";

export default function Page() {
  const railCollapsed = useStore((s) => s.railCollapsed);
  const activeId = useStore((s) => s.activeId);
  const view = useStore((s) => s.view);
  const docTheme = useStore((s) => s.docTheme);
  const toggleRail = useStore((s) => s.toggleRail);

  const stageRef = useRef<StageHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const [dragging, setDragging] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const triggerFile = useCallback(async () => {
    const handled = await openFilesFSA();
    if (!handled) fileInputRef.current?.click();
  }, []);
  const triggerFolder = useCallback(async () => {
    const handled = await openFolderFSA();
    if (!handled) dirInputRef.current?.click();
  }, []);
  const triggerNew = useCallback(() => useStore.getState().newDoc(), []);
  const triggerImport = useCallback(() => importInputRef.current?.click(), []);

  /* mount: hydrate prefs, mobile gate, restore last folder */
  useEffect(() => {
    useStore.getState().hydratePrefs();
    if (window.matchMedia("(max-width:720px)").matches) {
      useStore.setState({ railCollapsed: true });
      setShowGate(true);
    }
    void tryRestore();
  }, []);

  /* keyboard */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      const st = useStore.getState();
      // A modal dialog owns the keyboard while open — don't hijack shortcuts.
      if (
        document.querySelector(
          ".confirm-scrim, .about-scrim, .help-scrim, .dlg-overlay"
        )
      )
        return;
      // Focused in a non-editor field (search / find) — let it type freely.
      const ae0 = document.activeElement as HTMLElement | null;
      const inField =
        !!ae0 &&
        !ae0.isContentEditable &&
        (ae0.tagName === "INPUT" ||
          (ae0.tagName === "TEXTAREA" && ae0.id !== "editor"));
      if (mod && k === "o") {
        e.preventDefault();
        if (e.shiftKey) void triggerFolder();
        else void triggerFile();
        return;
      }
      if (mod && k === "n") {
        e.preventDefault();
        triggerNew();
        return;
      }
      if (mod && k === "s") {
        e.preventDefault();
        void saveActive();
        return;
      }
      if (mod && k === "f" && st.activeId) {
        e.preventDefault();
        stageRef.current?.openFind();
        return;
      }
      if (mod && k === "b" && st.activeId && !inField) {
        e.preventDefault();
        stageRef.current?.format("bold");
        return;
      }
      if (mod && k === "i" && st.activeId && !inField) {
        e.preventDefault();
        stageRef.current?.format("italic");
        return;
      }
      if (mod) return;

      const ae = document.activeElement as HTMLElement | null;
      const typing =
        !!ae &&
        (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.isContentEditable);
      if (typing) return;

      if (e.key === "Tab" && st.files.length) {
        e.preventDefault();
        st.toggleView();
        return;
      }
      if (st.files.length && (k === "j" || e.key === "ArrowDown")) {
        st.stepFile(1);
        scrollActiveIntoView();
      } else if (st.files.length && (k === "k" || e.key === "ArrowUp")) {
        st.stepFile(-1);
        scrollActiveIntoView();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [triggerFile, triggerFolder, triggerNew]);

  /* warn before losing unsaved edits */
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useStore.getState().files.some((f) => f.dirty)) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  /* drag & drop */
  useEffect(() => {
    const onEnter = (e: DragEvent) => {
      e.preventDefault();
      dragDepth.current++;
      setDragging(true);
    };
    const onOver = (e: DragEvent) => e.preventDefault();
    const onLeave = () => {
      dragDepth.current--;
      if (dragDepth.current <= 0) {
        dragDepth.current = 0;
        setDragging(false);
      }
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      if (!e.dataTransfer) return;
      // Dropping image files into an open doc inserts them; otherwise ingest.
      const imgs = [...e.dataTransfer.files].filter((f) =>
        f.type.startsWith("image/")
      );
      if (imgs.length && useStore.getState().activeId) {
        void stageRef.current?.insertImages(imgs);
        return;
      }
      void handleDrop(e.dataTransfer);
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  return (
    <>
      <div id="app" className={railCollapsed ? "collapsed" : undefined}>
        <Sidebar
          onOpenFile={triggerFile}
          onNewDoc={triggerNew}
          onOpenFolder={triggerFolder}
          onImport={triggerImport}
          onAbout={() => setAboutOpen(true)}
        />

        <main className="main">
          <button
            className="rail-toggle"
            data-tip="Toggle panel"
            aria-label="Toggle side panel"
            onClick={toggleRail}
          >
            <ChevronLeftIcon />
          </button>

          <Topbar />

          {activeId && (
            <FormattingToolbar
              onFormat={(a) => stageRef.current?.format(a)}
              onApplyColor={(hex) => stageRef.current?.applyColor(hex)}
            />
          )}

          <div
            className="stage"
            data-doc={docTheme}
            style={{ overflowY: view === "raw" && activeId ? "hidden" : "auto" }}
          >
            {!activeId && (
              <Welcome onOpenFile={triggerFile} onOpenFolder={triggerFolder} />
            )}
            {activeId && <Stage ref={stageRef} />}
          </div>
        </main>
      </div>

      <DropOverlay show={dragging} />
      <Toast />
      <ConfirmDialog />
      <AboutDialog
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        onOpenHelp={() => setHelpOpen(true)}
      />
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <Tooltip />

      {showGate && (
        <MobileGate
          onReadSingle={() => {
            setShowGate(false);
            void triggerFile();
          }}
          onContinue={() => setShowGate(false)}
        />
      )}

      <div id="printRoot" />

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.mdx,.txt"
        multiple
        className="hide"
        onChange={(e) => {
          if (e.target.files) void ingestFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={dirInputRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        className="hide"
        onChange={(e) => {
          if (e.target.files) void ingestWebkitDirectory(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={importInputRef}
        type="file"
        accept=".docx,.html,.htm,.txt,.md,.markdown,.mdx"
        multiple
        className="hide"
        onChange={(e) => {
          if (e.target.files) void ingestImport(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}

function scrollActiveIntoView() {
  requestAnimationFrame(() => {
    document.querySelector(".file.on")?.scrollIntoView({ block: "nearest" });
  });
}
