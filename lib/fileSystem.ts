import { htmlToMarkdown, parseMarkdown } from "./markdown";
import { activeFile, mkId, useStore } from "./store";
import type { MdFile } from "./types";

export const MD_RE = /\.(md|markdown|mdx|txt)$/i;

const store = () => useStore.getState();

function escapeHtml(s: string): string {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!)
  );
}

/* ------------------------------------------------------------------ *
 *  Folder walking (File System Access API)
 * ------------------------------------------------------------------ */
type Found = { handle: FileSystemFileHandle; path: string; name: string };

async function walkDir(
  handle: FileSystemDirectoryHandle,
  prefix: string,
  out: Found[]
): Promise<void> {
  for await (const [name, entry] of handle.entries()) {
    if (name.startsWith(".")) continue;
    const p = prefix ? prefix + "/" + name : name;
    if (entry.kind === "directory") {
      if (name === "node_modules") continue;
      await walkDir(entry as FileSystemDirectoryHandle, p, out);
    } else if (MD_RE.test(name)) {
      out.push({ handle: entry as FileSystemFileHandle, path: p, name });
    }
  }
}

export async function loadFromDirHandle(
  handle: FileSystemDirectoryHandle
): Promise<void> {
  const found: Found[] = [];
  await walkDir(handle, "", found);
  const list: MdFile[] = [];
  for (const it of found) {
    const file = await it.handle.getFile();
    list.push({
      id: mkId(),
      name: it.name,
      path: it.path,
      group: handle.name,
      text: await file.text(),
      dirty: false,
      handle: it.handle,
    });
  }
  store().addSource(list, handle.name, {
    replace: true,
    isFolder: true,
    handle,
  });
  store().showToast(
    `Loaded ${list.length} markdown file${list.length !== 1 ? "s" : ""} from “${handle.name}”`
  );
}

/** Returns true if handled; false → caller should fall back to <input>. */
export async function openFolderFSA(): Promise<boolean> {
  if (!window.showDirectoryPicker) return false;
  try {
    const handle = await window.showDirectoryPicker({ id: "mdv", mode: "read" });
    store().setDirHandle(handle);
    await saveHandle(handle);
    await loadFromDirHandle(handle);
    return true;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return true;
    return false;
  }
}

/** Re-scan a folder section for files added/changed/removed; keep unsaved edits. */
export async function refreshSource(src: string): Promise<void> {
  const h = store().sourceHandles[src];
  if (!h) {
    store().showToast("This source can’t be refreshed");
    return;
  }
  try {
    if (
      h.queryPermission &&
      (await h.queryPermission({ mode: "read" })) !== "granted"
    ) {
      if ((await h.requestPermission?.({ mode: "read" })) !== "granted") {
        store().showToast("Permission needed to refresh");
        return;
      }
    }
  } catch {
    /* ignore */
  }
  const found: Found[] = [];
  await walkDir(h, "", found);
  const fresh = new Map<string, Found>();
  for (const it of found) fresh.set(it.path, it);

  const keep: MdFile[] = [];
  for (const f of store().files.filter((x) => x.group === src)) {
    const it = fresh.get(f.path);
    if (!it) {
      if (f.dirty) keep.push(f); // gone on disk: drop unless unsaved
      continue;
    }
    fresh.delete(f.path);
    if (f.dirty) keep.push(f); // unsaved: keep in-memory version
    else {
      const file = await it.handle.getFile();
      keep.push({ ...f, text: await file.text(), handle: it.handle });
    }
  }
  let added = 0;
  for (const it of fresh.values()) {
    const file = await it.handle.getFile();
    keep.push({
      id: mkId(),
      name: it.name,
      path: it.path,
      group: src,
      text: await file.text(),
      dirty: false,
      handle: it.handle,
    });
    added++;
  }
  store().replaceSourceFiles(src, keep);
  const s = store();
  if (s.activeId && !s.files.find((f) => f.id === s.activeId)) {
    if (s.files.length) s.openDoc(s.files[0].id);
    else s.clearToWelcome();
  }
  store().showToast(
    added ? `Refreshed — ${added} new file${added > 1 ? "s" : ""}` : "Refreshed — up to date"
  );
}

/* ------------------------------------------------------------------ *
 *  Individual files (FSA preferred → live save handle)
 * ------------------------------------------------------------------ */
export async function openFilesFSA(): Promise<boolean> {
  if (!window.showOpenFilePicker) return false;
  try {
    const handles = await window.showOpenFilePicker({
      id: "mdv",
      multiple: true,
      excludeAcceptAllOption: false,
      types: [
        {
          description: "Markdown & text",
          accept: {
            "text/markdown": [".md", ".markdown", ".mdx"],
            "text/plain": [".txt"],
          },
        },
      ],
    });
    const list: MdFile[] = [];
    for (const h of handles) {
      const file = await h.getFile();
      list.push({
        id: mkId(),
        name: h.name,
        path: h.name,
        group: "Open files",
        text: await file.text(),
        dirty: false,
        handle: h,
      });
    }
    if (list.length) {
      store().addSource(list, "Open files", { replace: false });
      store().showToast(
        `Opened ${list.length} file${list.length !== 1 ? "s" : ""}`
      );
    }
    return true;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return true;
    return false;
  }
}

export async function ingestFiles(fileList: FileList): Promise<void> {
  const fl = [...fileList];
  const list: MdFile[] = await Promise.all(
    fl.map(async (f) => ({
      id: mkId(),
      name: f.name,
      path: f.name,
      group: "Open files",
      text: await f.text(),
      dirty: false,
    }))
  );
  store().addSource(list, "Open files", { replace: false });
}

export async function ingestWebkitDirectory(fileList: FileList): Promise<void> {
  const fl = [...fileList].filter((f) => MD_RE.test(f.name));
  if (!fl.length) {
    store().showToast("No markdown files in that folder");
    return;
  }
  const top = fl[0].webkitRelativePath.split("/")[0] || "Folder";
  const list: MdFile[] = await Promise.all(
    fl.map(async (f) => ({
      id: mkId(),
      name: f.name,
      path: f.webkitRelativePath || f.name,
      group: top,
      text: await f.text(),
      dirty: false,
    }))
  );
  store().addSource(list, top, { replace: true, isFolder: true });
}

/* ------------------------------------------------------------------ *
 *  Import & convert → Markdown
 * ------------------------------------------------------------------ */
export async function ingestImport(fileList: FileList): Promise<void> {
  const files = [...fileList];
  if (!files.length) return;
  const out: MdFile[] = [];
  let mammoth: typeof import("mammoth") | null = null;

  for (const file of files) {
    const ext = (file.name.match(/\.([^.]+)$/)?.[1] ?? "").toLowerCase();
    const base = file.name.replace(/\.[^.]+$/, "");
    let md: string | null = null;
    try {
      if (MD_RE.test(file.name)) md = await file.text();
      else if (ext === "html" || ext === "htm")
        md = htmlToMarkdown(await file.text());
      else if (ext === "docx") {
        if (!mammoth) mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.convertToHtml({ arrayBuffer });
        md = htmlToMarkdown(value);
      } else {
        store().showToast(`Can’t import .${ext}`);
        continue;
      }
    } catch {
      store().showToast(`Failed to import ${file.name}`);
      continue;
    }
    if (md == null) continue;
    const id = mkId();
    out.push({
      id,
      name: base + ".md",
      path: base + "-" + id + ".md",
      group: "Imported",
      text: md,
      dirty: true,
    });
  }
  if (!out.length) return;
  store().addSource(out, "Imported", { replace: false, open: false });
  store().openDoc(out[0].id);
  store().showToast(
    `Imported ${out.length} file${out.length !== 1 ? "s" : ""} as Markdown`
  );
}

/* ------------------------------------------------------------------ *
 *  Drag & drop
 * ------------------------------------------------------------------ */
export async function handleDrop(dt: DataTransfer): Promise<void> {
  const items = [...(dt.items || [])];
  const list: MdFile[] = [];
  const hasHandleApi = items.some(
    (i) => i.kind === "file" && typeof i.getAsFileSystemHandle === "function"
  );

  if (hasHandleApi) {
    for (const it of items) {
      if (it.kind !== "file" || !it.getAsFileSystemHandle) continue;
      const h = await it.getAsFileSystemHandle();
      if (h && h.kind === "directory") {
        const dir = h as FileSystemDirectoryHandle;
        const found: Found[] = [];
        await walkDir(dir, "", found);
        for (const x of found) {
          const file = await x.handle.getFile();
          list.push({
            id: mkId(),
            name: x.name,
            path: x.path,
            group: dir.name,
            text: await file.text(),
            dirty: false,
            handle: x.handle,
          });
        }
        if (found.length) {
          store().setDirHandle(dir);
          await saveHandle(dir);
          store().addSource(list, dir.name, {
            replace: true,
            isFolder: true,
            handle: dir,
          });
          store().showToast(`Loaded ${list.length} files from “${dir.name}”`);
          return;
        }
      }
    }
  }

  const fl = [...dt.files].filter((f) => MD_RE.test(f.name));
  if (!fl.length) {
    store().showToast("Drop .md / .markdown files");
    return;
  }
  for (const f of fl)
    list.push({
      id: mkId(),
      name: f.name,
      path: f.name,
      group: "Open files",
      text: await f.text(),
      dirty: false,
    });
  store().addSource(list, "Open files", { replace: false });
}

/* ------------------------------------------------------------------ *
 *  Rename the active document
 * ------------------------------------------------------------------ */
async function tryMove(
  handle: FileSystemFileHandle,
  name: string
): Promise<boolean> {
  if (typeof handle.move !== "function") return false;
  try {
    let p = (await handle.queryPermission?.({ mode: "readwrite" })) ?? "prompt";
    if (p !== "granted")
      p = (await handle.requestPermission?.({ mode: "readwrite" })) ?? "denied";
    if (p !== "granted") return false;
    await handle.move(name);
    return true;
  } catch {
    return false;
  }
}

export async function renameActive(rawName: string): Promise<void> {
  const f = activeFile(store());
  if (!f) return;
  let name = rawName.trim();
  if (!name) return;
  if (!MD_RE.test(name)) name += ".md";
  if (name === f.name) return;
  if (f.handle) {
    const moved = await tryMove(f.handle, name);
    if (moved) {
      store().renameActiveFile(name, false);
      store().showToast("Renamed to " + name);
    } else {
      store().renameActiveFile(name, true);
      store().showToast(`Renamed — use Save to write “${name}” to disk`);
    }
    return;
  }
  store().renameActiveFile(name, false);
  store().showToast("Renamed to " + name);
}

/* ------------------------------------------------------------------ *
 *  Save & export
 * ------------------------------------------------------------------ */
function downloadBlob(name: string, blob: Blob): void {
  const u = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}

export function downloadMd(file: MdFile): void {
  downloadBlob(file.name, new Blob([file.text], { type: "text/markdown" }));
  store().showToast("Downloaded " + file.name);
}

export async function saveActive(): Promise<void> {
  const f = activeFile(store());
  if (!f) {
    store().showToast("No document open");
    return;
  }
  if (f.handle && f.handle.createWritable) {
    try {
      let p = (await f.handle.queryPermission?.({ mode: "readwrite" })) ?? "prompt";
      if (p !== "granted")
        p = (await f.handle.requestPermission?.({ mode: "readwrite" })) ?? "denied";
      if (p === "granted") {
        const w = await f.handle.createWritable();
        await w.write(f.text);
        await w.close();
        store().setActiveClean();
        store().showToast("Saved to " + f.name);
        return;
      }
    } catch {
      /* fall through */
    }
  }
  if (window.showSaveFilePicker) {
    try {
      const h = await window.showSaveFilePicker({
        id: "mdv",
        suggestedName: f.name,
        types: [
          {
            description: "Markdown",
            accept: { "text/markdown": [".md", ".markdown", ".mdx"] },
          },
        ],
      });
      const w = await h.createWritable();
      await w.write(f.text);
      await w.close();
      store().assignHandleToActive(h, h.name, h.name);
      store().showToast("Saved " + h.name);
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
  }
  // Last resort (no FS Access API): download, but still mark the doc saved so
  // the dirty dot / "unsaved" warning don't linger after a successful save.
  downloadMd(f);
  store().setActiveClean();
}

export function copySource(file: MdFile): void {
  navigator.clipboard
    .writeText(file.text)
    .then(() => store().showToast("Source copied"))
    .catch(() => store().showToast("Could not copy"));
}

export function copyPath(file: MdFile): void {
  navigator.clipboard
    .writeText(file.path)
    .then(() => store().showToast("Path copied: " + file.path))
    .catch(() => store().showToast("Could not copy"));
}

const HTML_EXPORT_CSS =
  "body{max-width:720px;margin:48px auto;padding:0 22px;font:18px/1.65 -apple-system,Segoe UI,Roboto,Helvetica,sans-serif;color:#222}h1,h2,h3{line-height:1.2}h1{font-size:2.2em}code{background:#f3f3ef;padding:2px 6px;border-radius:4px;font-size:.88em}pre{background:#0f1115;color:#e6e6e6;padding:16px 18px;border-radius:10px;overflow:auto}pre code{background:none;padding:0}blockquote{border-left:3px solid #d8b86a;margin:0;padding:4px 18px;color:#555;font-style:italic}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px 12px}img{max-width:100%}a{color:#b07d18}";

export function exportHTML(file: MdFile): void {
  const title = escapeHtml(file.name.replace(/\.[^.]+$/, ""));
  const body = parseMarkdown(file.text);
  const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${HTML_EXPORT_CSS}</style></head><body>${body}</body></html>`;
  downloadBlob(
    file.name.replace(MD_RE, "") + ".html",
    new Blob([doc], { type: "text/html" })
  );
  store().showToast("Exported HTML");
}

export function exportPDF(file: MdFile): void {
  const root = document.getElementById("printRoot");
  if (!root) return;
  const titleText = file.name.replace(/\.[^.]+$/, "");
  root.innerHTML =
    '<h1 class="pt-title">' + escapeHtml(titleText) + "</h1>" + parseMarkdown(file.text);
  const old = document.title;
  document.title = titleText;
  window.print();
  setTimeout(() => {
    document.title = old;
  }, 600);
  store().showToast("Opening print dialog…");
}

/* ------------------------------------------------------------------ *
 *  Persist the last folder handle (IndexedDB)
 * ------------------------------------------------------------------ */
function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open("mdv", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function saveHandle(h: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await idb();
    db.transaction("kv", "readwrite").objectStore("kv").put(h, "dir");
  } catch {
    /* ignore */
  }
}

async function loadHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await idb();
    return await new Promise((res) => {
      const g = db.transaction("kv").objectStore("kv").get("dir");
      g.onsuccess = () => res((g.result as FileSystemDirectoryHandle) ?? null);
      g.onerror = () => res(null);
    });
  } catch {
    return null;
  }
}

export async function tryRestore(): Promise<void> {
  const h = await loadHandle();
  if (!h) return;
  try {
    const perm = (await h.queryPermission?.({ mode: "read" })) ?? "prompt";
    if (perm === "granted") {
      store().setDirHandle(h);
      await loadFromDirHandle(h);
    } else {
      store().setRestoreHandle(h);
    }
  } catch {
    /* ignore */
  }
}

export async function reopenRestored(): Promise<void> {
  const h = store().restoreHandle;
  if (!h) return;
  try {
    const p = (await h.requestPermission?.({ mode: "read" })) ?? "denied";
    if (p === "granted") {
      store().setDirHandle(h);
      store().setRestoreHandle(null);
      await loadFromDirHandle(h);
    } else {
      store().showToast("Permission needed to reopen “" + h.name + "”");
    }
  } catch {
    store().showToast("Couldn’t reopen “" + h.name + "”");
  }
}
