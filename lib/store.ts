import { create } from "zustand";
import type { LensView, MdFile } from "./types";

const LS_VIEW = "mdv-view";
const LS_LAST = "mdv-last";
const LS_RAIL = "mdv-rail";
const LS_DOC = "mdv-doc";
const LS_COLLAPSED = "mdv-collapsed";

export type DocTheme = "light" | "dark";

export interface Toast {
  id: number;
  msg: string;
}

export interface ConfirmConfig {
  title: string;
  msg: string;
  ok: string;
  cancel: string;
}

/** Stable id for a file across a workspace: its section + path. */
export function uid(f: MdFile): string {
  return (f.group || "") + "␟" + f.path;
}

export function filterFiles(files: MdFile[], query: string): MdFile[] {
  const q = query.trim().toLowerCase();
  if (!q) return files;
  return files.filter(
    (f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)
  );
}

interface EditorState {
  files: MdFile[];
  activeId: string | null;
  view: LensView;
  query: string;
  railCollapsed: boolean;
  docTheme: DocTheme;
  /** Last folder handle opened (for cross-session restore). */
  dirHandle: FileSystemDirectoryHandle | null;
  /** A folder handle pending a permission re-grant ("Reopen …" chip). */
  restoreHandle: FileSystemDirectoryHandle | null;
  /** Section name → directory handle (enables per-folder refresh). */
  sourceHandles: Record<string, FileSystemDirectoryHandle>;
  /** Section name → native directory path in the Tauri desktop wrapper. */
  nativeSourceRoots: Record<string, string>;
  /** Section names that are real folders (vs. loose files / drafts / imports). */
  folderSources: string[];
  /** Collapsed section names. */
  collapsedGroups: string[];
  toast: Toast | null;
  confirm: ConfirmConfig | null;
  /** Active formatting at the caret (drives the toolbar "on" state + block label). */
  activeMarks: { bold: boolean; italic: boolean; code: boolean; block: string };

  setQuery: (q: string) => void;
  setActiveMarks: (m: {
    bold: boolean;
    italic: boolean;
    code: boolean;
    block: string;
  }) => void;
  setView: (v: LensView) => void;
  toggleView: () => void;
  toggleRail: () => void;
  setDocTheme: (t: DocTheme) => void;
  toggleGroup: (g: string) => void;

  addSource: (
    list: MdFile[],
    sourceKey: string,
    opts?: {
      open?: boolean;
      replace?: boolean;
      isFolder?: boolean;
      handle?: FileSystemDirectoryHandle;
      nativeRoot?: string;
    }
  ) => void;
  replaceSourceFiles: (src: string, list: MdFile[]) => void;
  openDoc: (id: string) => void;
  closeDoc: (id: string) => void;
  removeSource: (src: string) => void;
  clearToWelcome: () => void;
  newDoc: () => void;
  stepFile: (dir: 1 | -1) => void;

  updateActiveText: (text: string, dirty?: boolean) => void;
  setActiveClean: () => void;
  assignHandleToActive: (
    handle: FileSystemFileHandle,
    name: string,
    path: string
  ) => void;
  assignNativePathToActive: (nativePath: string, name: string, path: string) => void;
  renameActiveFile: (name: string, dropHandle: boolean) => void;

  setDirHandle: (h: FileSystemDirectoryHandle | null) => void;
  setRestoreHandle: (h: FileSystemDirectoryHandle | null) => void;

  showToast: (msg: string) => void;
  clearToast: () => void;
  settleConfirm: (v: boolean) => void;
  hydratePrefs: () => void;
}

let toastSeq = 0;
let newDocSeq = 0;
let idSeq = 0;
export const mkId = () => "f" + idSeq++;

let confirmResolver: ((v: boolean) => void) | null = null;

export const useStore = create<EditorState>((set, get) => ({
  files: [],
  activeId: null,
  view: "visual",
  query: "",
  railCollapsed: false,
  docTheme: "light",
  dirHandle: null,
  restoreHandle: null,
  sourceHandles: {},
  nativeSourceRoots: {},
  folderSources: [],
  collapsedGroups: [],
  toast: null,
  confirm: null,
  activeMarks: { bold: false, italic: false, code: false, block: "p" },

  setQuery: (q) => set({ query: q }),
  setActiveMarks: (m) => set({ activeMarks: m }),

  setView: (v) => {
    if (typeof window !== "undefined") localStorage.setItem(LS_VIEW, v);
    set({ view: v });
  },
  toggleView: () => {
    if (!get().files.length) return;
    get().setView(get().view === "visual" ? "raw" : "visual");
  },
  toggleRail: () => {
    const railCollapsed = !get().railCollapsed;
    if (typeof window !== "undefined")
      localStorage.setItem(LS_RAIL, railCollapsed ? "1" : "0");
    set({ railCollapsed });
  },
  setDocTheme: (t) => {
    if (typeof window !== "undefined") localStorage.setItem(LS_DOC, t);
    set({ docTheme: t });
  },
  toggleGroup: (g) => {
    const collapsedGroups = get().collapsedGroups.includes(g)
      ? get().collapsedGroups.filter((x) => x !== g)
      : [...get().collapsedGroups, g];
    if (typeof window !== "undefined")
      localStorage.setItem(LS_COLLAPSED, JSON.stringify(collapsedGroups));
    set({ collapsedGroups });
  },

  addSource: (list, sourceKey, opts = {}) => {
    const { open = true, replace = true, isFolder = false, handle, nativeRoot } = opts;
    list.forEach((f) => (f.group = sourceKey));
    set((s) => {
      const files = replace
        ? s.files.filter((f) => f.group !== sourceKey)
        : s.files.slice();
      const seen = new Set(files.map(uid));
      for (const f of list) {
        const k = uid(f);
        if (!seen.has(k)) {
          files.push(f);
          seen.add(k);
        }
      }
      files.sort((a, b) => (a.group + a.name).localeCompare(b.group + b.name));
      const folderSources =
        isFolder && !s.folderSources.includes(sourceKey)
          ? [...s.folderSources, sourceKey]
          : s.folderSources;
      const sourceHandles = handle
        ? { ...s.sourceHandles, [sourceKey]: handle }
        : s.sourceHandles;
      const nativeSourceRoots = nativeRoot
        ? { ...s.nativeSourceRoots, [sourceKey]: nativeRoot }
        : s.nativeSourceRoots;
      return { files, folderSources, sourceHandles, nativeSourceRoots };
    });
    if (open && list.length) {
      const last =
        typeof window !== "undefined" ? localStorage.getItem(LS_LAST) : null;
      const target = get().files.find((f) => uid(f) === last) || list[0];
      if (target) get().openDoc(target.id);
    }
  },

  // Used by refresh: swap a section's files for a freshly-computed set.
  replaceSourceFiles: (src, list) => {
    set((s) => {
      const files = s.files.filter((f) => f.group !== src).concat(list);
      files.sort((a, b) => (a.group + a.name).localeCompare(b.group + b.name));
      return { files };
    });
  },

  openDoc: (id) => {
    const f = get().files.find((x) => x.id === id);
    if (!f) return;
    if (typeof window !== "undefined") localStorage.setItem(LS_LAST, uid(f));
    set({ activeId: id });
  },

  closeDoc: (id) => {
    const f = get().files.find((x) => x.id === id);
    if (!f) return;
    const doClose = () => {
      const wasActive = id === get().activeId;
      const idx = get().files.findIndex((x) => x.id === id);
      const files = get().files.filter((x) => x.id !== id);
      set({ files });
      if (!wasActive) return;
      // Prefer a neighbour that is actually visible under the current filter.
      const cand = files[idx] || files[idx - 1] || files[0];
      const visible = filterFiles(files, get().query);
      const next = cand && visible.includes(cand) ? cand : visible[0] || cand;
      if (next) get().openDoc(next.id);
      else get().clearToWelcome();
    };
    if (f.dirty) {
      confirmDialog({
        title: "Discard changes?",
        msg: `“${f.name}” has unsaved changes. Close it and discard them?`,
        ok: "Discard",
      }).then((yes) => {
        if (yes) doClose();
      });
    } else doClose();
  },

  removeSource: (src) => {
    const doIt = () => {
      const hadActive = get().files.some(
        (f) => f.id === get().activeId && f.group === src
      );
      const files = get().files.filter((f) => f.group !== src);
      // drop the section's directory handle too (was leaking)
      const { [src]: _omit, ...sourceHandles } = get().sourceHandles;
      const { [src]: _nativeOmit, ...nativeSourceRoots } = get().nativeSourceRoots;
      void _omit;
      void _nativeOmit;
      set({
        files,
        folderSources: get().folderSources.filter((s) => s !== src),
        sourceHandles,
        nativeSourceRoots,
      });
      if (hadActive) {
        if (files.length) get().openDoc(files[0].id);
        else get().clearToWelcome();
      }
      get().showToast("Closed “" + src + "”");
    };
    if (get().files.some((f) => f.group === src && f.dirty)) {
      confirmDialog({
        title: "Close folder?",
        msg: `Some files in <b>${src}</b> have unsaved changes. Close it and discard them?`,
        ok: "Close",
      }).then((yes) => {
        if (yes) doIt();
      });
    } else doIt();
  },

  clearToWelcome: () => {
    if (typeof window !== "undefined") localStorage.removeItem(LS_LAST);
    set({ activeId: null });
  },

  newDoc: () => {
    const id = "n" + newDocSeq++;
    const f: MdFile = {
      id,
      name: "Untitled.md",
      path: "Untitled-" + id + ".md",
      group: "Drafts",
      text: "",
      dirty: true,
    };
    set((s) => ({ files: [f, ...s.files], activeId: id, view: "visual" }));
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_VIEW, "visual");
      localStorage.setItem(LS_LAST, uid(f));
    }
    get().showToast("New document started");
  },

  stepFile: (dir) => {
    const { files, query, activeId } = get();
    const shown = filterFiles(files, query);
    if (!shown.length) return;
    let i = shown.findIndex((f) => f.id === activeId);
    if (i < 0) i = 0;
    i = Math.max(0, Math.min(shown.length - 1, i + dir));
    get().openDoc(shown[i].id);
  },

  updateActiveText: (text, dirty = true) =>
    set((s) => ({
      files: s.files.map((f) =>
        f.id === s.activeId ? { ...f, text, dirty: dirty || f.dirty } : f
      ),
    })),

  setActiveClean: () =>
    set((s) => ({
      files: s.files.map((f) =>
        f.id === s.activeId ? { ...f, dirty: false } : f
      ),
    })),

  assignHandleToActive: (handle, name, path) =>
    set((s) => ({
      files: s.files.map((f) =>
        f.id === s.activeId ? { ...f, handle, name, path, dirty: false } : f
      ),
    })),

  assignNativePathToActive: (nativePath, name, path) =>
    set((s) => ({
      files: s.files.map((f) =>
        f.id === s.activeId ? { ...f, nativePath, name, path, dirty: false } : f
      ),
    })),

  renameActiveFile: (name, dropHandle) => {
    const cur = get().files.find((f) => f.id === get().activeId);
    const path = cur ? (cur.group ? cur.group + "/" + name : name) : name;
    set((s) => ({
      files: s.files.map((f) =>
        f.id === s.activeId
          ? {
              ...f,
              name,
              path,
              ...(dropHandle
                ? { handle: undefined, nativePath: undefined, dirty: true }
                : {}),
            }
          : f
      ),
    }));
    const f2 = get().files.find((f) => f.id === get().activeId);
    if (f2 && typeof window !== "undefined") localStorage.setItem(LS_LAST, uid(f2));
  },

  setDirHandle: (h) => set({ dirHandle: h }),
  setRestoreHandle: (h) => set({ restoreHandle: h }),

  showToast: (msg) => set({ toast: { id: ++toastSeq, msg } }),
  clearToast: () => set({ toast: null }),

  settleConfirm: (v) => {
    set({ confirm: null });
    if (confirmResolver) {
      confirmResolver(v);
      confirmResolver = null;
    }
  },

  hydratePrefs: () => {
    if (typeof window === "undefined") return;
    const patch: Partial<EditorState> = {};
    const v = localStorage.getItem(LS_VIEW);
    if (v === "visual" || v === "raw") patch.view = v;
    if (localStorage.getItem(LS_RAIL) === "1") patch.railCollapsed = true;
    const t = localStorage.getItem(LS_DOC);
    patch.docTheme = t === "dark" ? "dark" : "light";
    try {
      patch.collapsedGroups = JSON.parse(
        localStorage.getItem(LS_COLLAPSED) || "[]"
      );
    } catch {
      patch.collapsedGroups = [];
    }
    localStorage.removeItem("mdv-color"); // retired key
    set(patch);
  },
}));

/** Branded confirm dialog. Resolves true on confirm, false on cancel. */
export function confirmDialog(opts: {
  title?: string;
  msg?: string;
  ok?: string;
  cancel?: string;
}): Promise<boolean> {
  useStore.setState({
    confirm: {
      title: opts.title ?? "Are you sure?",
      msg: opts.msg ?? "",
      ok: opts.ok ?? "OK",
      cancel: opts.cancel ?? "Cancel",
    },
  });
  return new Promise((res) => {
    confirmResolver = res;
  });
}

export function activeFile(state: EditorState): MdFile | undefined {
  return state.files.find((f) => f.id === state.activeId);
}
