import { describe, it, expect, beforeEach } from "vitest";
import { useStore, uid, filterFiles } from "./store";
import type { MdFile } from "./types";

let seq = 0;
const mk = (over: Partial<MdFile> = {}): MdFile => ({
  id: "t" + seq++,
  name: "a.md",
  path: "a.md",
  group: "Open files",
  text: "",
  dirty: false,
  ...over,
});

beforeEach(() => {
  useStore.setState({
    files: [],
    activeId: null,
    query: "",
    folderSources: [],
    sourceHandles: {},
    collapsedGroups: [],
  });
});

describe("uid / filterFiles", () => {
  it("uid combines group + path", () => {
    expect(uid(mk({ group: "G", path: "p.md" }))).toBe("G␟p.md");
  });
  it("filterFiles matches name and path, empty = all", () => {
    const a = mk({ name: "alpha.md", path: "x/alpha.md" });
    const b = mk({ name: "beta.md", path: "y/beta.md" });
    expect(filterFiles([a, b], "alpha")).toHaveLength(1);
    expect(filterFiles([a, b], "y/").map((f) => f.name)).toEqual(["beta.md"]);
    expect(filterFiles([a, b], "")).toHaveLength(2);
  });
});

describe("addSource", () => {
  it("accumulates and dedupes by uid", () => {
    const s = useStore.getState();
    s.addSource([mk({ name: "a.md", path: "a.md" })], "Open files", { replace: false, open: false });
    s.addSource(
      [mk({ name: "a.md", path: "a.md" }), mk({ name: "b.md", path: "b.md" })],
      "Open files",
      { replace: false, open: false }
    );
    const files = useStore.getState().files;
    expect(files).toHaveLength(2); // a.md deduped
    expect(files.map((f) => f.name).sort()).toEqual(["a.md", "b.md"]);
  });
  it("replace refreshes a folder section", () => {
    const s = useStore.getState();
    s.addSource([mk({ name: "old.md", path: "old.md" })], "Folder", { replace: true, isFolder: true, open: false });
    s.addSource([mk({ name: "new.md", path: "new.md" })], "Folder", { replace: true, isFolder: true, open: false });
    expect(useStore.getState().files.map((f) => f.name)).toEqual(["new.md"]);
  });
});

describe("newDoc / closeDoc / removeSource", () => {
  it("newDoc adds a dirty Draft and opens it", () => {
    useStore.getState().newDoc();
    const st = useStore.getState();
    expect(st.files).toHaveLength(1);
    expect(st.files[0].group).toBe("Drafts");
    expect(st.files[0].dirty).toBe(true);
    expect(st.activeId).toBe(st.files[0].id);
  });
  it("closeDoc (clean) removes and activates a neighbour", () => {
    const s = useStore.getState();
    s.addSource(
      [mk({ id: "a", name: "a.md", path: "a.md" }), mk({ id: "b", name: "b.md", path: "b.md" })],
      "Open files",
      { replace: false }
    );
    s.openDoc("a");
    s.closeDoc("a");
    const st = useStore.getState();
    expect(st.files).toHaveLength(1);
    expect(st.activeId).toBe("b");
  });
  it("removeSource drops the section, its folder flag, and handle", () => {
    const s = useStore.getState();
    s.addSource([mk({ name: "a.md", path: "a.md" })], "Folder", { replace: true, isFolder: true });
    useStore.setState({
      sourceHandles: { Folder: {} as unknown as FileSystemDirectoryHandle },
    });
    s.removeSource("Folder");
    const st = useStore.getState();
    expect(st.files).toHaveLength(0);
    expect(st.folderSources).not.toContain("Folder");
    expect(st.sourceHandles.Folder).toBeUndefined();
  });
});
