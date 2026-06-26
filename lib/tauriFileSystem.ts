import { mkId, useStore } from "./store";
import type { MdFile } from "./types";

const MARKDOWN_EXTENSIONS = ["md", "markdown", "mdx", "txt"];
const MARKDOWN_FILTER = [{ name: "Markdown & text", extensions: MARKDOWN_EXTENSIONS }];
const MD_RE = /\.(md|markdown|mdx|txt)$/i;

type TauriFs = typeof import("@tauri-apps/plugin-fs");
type TauriDialog = typeof import("@tauri-apps/plugin-dialog");
type TauriPath = typeof import("@tauri-apps/api/path");

function store() {
  return useStore.getState();
}

export async function isTauriRuntime(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { isTauri } = await import("@tauri-apps/api/core");
    return isTauri();
  } catch {
    return false;
  }
}

async function modules(): Promise<{
  dialog: TauriDialog;
  fs: TauriFs;
  path: TauriPath;
}> {
  const [dialog, fs, path] = await Promise.all([
    import("@tauri-apps/plugin-dialog"),
    import("@tauri-apps/plugin-fs"),
    import("@tauri-apps/api/path"),
  ]);
  return { dialog, fs, path };
}

function asList(selection: string | string[] | null): string[] {
  if (!selection) return [];
  return Array.isArray(selection) ? selection : [selection];
}

function splitPath(p: string): string[] {
  return p.split(/[\\/]+/).filter(Boolean);
}

function baseName(p: string): string {
  return splitPath(p).at(-1) ?? p;
}

async function readNativeFile(filePath: string, group = "Open files"): Promise<MdFile> {
  const { fs } = await modules();
  const name = baseName(filePath);
  return {
    id: mkId(),
    name,
    path: name,
    group,
    text: await fs.readTextFile(filePath),
    dirty: false,
    nativePath: filePath,
  };
}

async function walkNativeDir(
  root: string,
  dir: string,
  relPrefix: string,
  out: MdFile[],
  group: string
): Promise<void> {
  const { fs, path } = await modules();
  const entries = await fs.readDir(dir);
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory) {
      if (entry.name === "node_modules") continue;
      const child = await path.join(dir, entry.name);
      const rel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
      await walkNativeDir(root, child, rel, out, group);
      continue;
    }
    if (!entry.isFile || !MD_RE.test(entry.name)) continue;
    const nativePath = await path.join(dir, entry.name);
    const relPath = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
    out.push({
      id: mkId(),
      name: entry.name,
      path: relPath,
      group,
      text: await fs.readTextFile(nativePath),
      dirty: false,
      nativePath,
    });
  }
  void root;
}

export async function openFilesTauri(): Promise<boolean> {
  if (!(await isTauriRuntime())) return false;
  try {
    const { dialog } = await modules();
    const selected = asList(
      await dialog.open({
        title: "Open Markdown files",
        multiple: true,
        directory: false,
        filters: MARKDOWN_FILTER,
        fileAccessMode: "scoped",
      })
    );
    if (!selected.length) return true;
    const list = await Promise.all(selected.filter((p) => MD_RE.test(p)).map((p) => readNativeFile(p)));
    if (!list.length) {
      store().showToast("No markdown files selected");
      return true;
    }
    store().addSource(list, "Open files", { replace: false });
    store().showToast(`Opened ${list.length} file${list.length !== 1 ? "s" : ""}`);
    return true;
  } catch {
    store().showToast("Could not open files");
    return true;
  }
}

export async function loadNativeFolder(root: string, replace = true): Promise<void> {
  const group = baseName(root) || "Folder";
  const list: MdFile[] = [];
  await walkNativeDir(root, root, "", list, group);
  store().addSource(list, group, {
    replace,
    isFolder: true,
    nativeRoot: root,
  });
  store().showToast(
    `Loaded ${list.length} markdown file${list.length !== 1 ? "s" : ""} from "${group}"`
  );
}

export async function openFolderTauri(): Promise<boolean> {
  if (!(await isTauriRuntime())) return false;
  try {
    const { dialog } = await modules();
    const selected = asList(
      await dialog.open({
        title: "Open Markdown folder",
        multiple: false,
        directory: true,
        recursive: true,
        fileAccessMode: "scoped",
      })
    );
    if (!selected.length) return true;
    await loadNativeFolder(selected[0]);
    return true;
  } catch {
    store().showToast("Could not open folder");
    return true;
  }
}

export async function refreshNativeSource(src: string, root: string): Promise<boolean> {
  if (!(await isTauriRuntime())) return false;
  try {
    const list: MdFile[] = [];
    await walkNativeDir(root, root, "", list, src);
    const byPath = new Map(list.map((f) => [f.path, f]));
    const keep: MdFile[] = [];
    for (const current of store().files.filter((f) => f.group === src)) {
      const fresh = byPath.get(current.path);
      if (!fresh) {
        if (current.dirty) keep.push(current);
        continue;
      }
      byPath.delete(current.path);
      keep.push(current.dirty ? current : fresh);
    }
    store().replaceSourceFiles(src, keep.concat([...byPath.values()]));
    store().showToast("Refreshed - up to date");
    return true;
  } catch {
    store().showToast("Could not refresh folder");
    return true;
  }
}

export async function renameNativeFile(oldPath: string, name: string): Promise<string | null> {
  if (!(await isTauriRuntime())) return null;
  try {
    const { fs, path } = await modules();
    const nextPath = await path.join(await path.dirname(oldPath), name);
    await fs.rename(oldPath, nextPath);
    return nextPath;
  } catch {
    return null;
  }
}

export async function saveActiveTauri(): Promise<boolean> {
  if (!(await isTauriRuntime())) return false;
  const f = store().files.find((x) => x.id === store().activeId);
  if (!f) {
    store().showToast("No document open");
    return true;
  }
  try {
    const { dialog, fs } = await modules();
    let target = f.nativePath;
    if (!target) {
      const selected = await dialog.save({
        title: "Save Markdown file",
        defaultPath: f.name,
        filters: MARKDOWN_FILTER,
      });
      if (!selected) return true;
      target = selected;
    }
    await fs.writeTextFile(target, f.text);
    store().assignNativePathToActive(target, baseName(target), baseName(target));
    store().showToast("Saved to " + baseName(target));
    return true;
  } catch {
    store().showToast("Could not save file");
    return true;
  }
}
