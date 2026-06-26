# Octopus Ink

A local Markdown viewer/editor under the **OctoSignal Lab** brand. Browse a folder
of `.md` files and read/edit each one through **two lenses**:

- **Visual** — the rendered Markdown, which is also a live WYSIWYG editor.
- **Raw** — the Markdown source in a monospace editor.

**Add document** (sidebar dropdown) brings a doc in — Open file, New document,
Open folder, or **Import & convert** (`.docx` via mammoth / `.html` via turndown →
Markdown, as a new unsaved copy that never touches the source). Single files
opened via the File System Access API keep a live writable handle, so **Save
writes back to the same file**. **Actions** (Save / export PDF·HTML / copy) live
in the document toolbar, since they act on the open document.

Edits in either lens stay in sync (`text` is the single source of truth). A
formatting toolbar, an Actions menu (save / export PDF / export HTML / copy),
full-text filtering, drag-and-drop, and keyboard navigation round it out.

**Recent files** — single files you open are remembered (their handles persist in
IndexedDB); the empty sidebar shows a **Recent** list to reopen them in one click
(it re-requests read permission). **Browse this file's folder** — when a single
file is open, a sidebar chip opens the directory picker started at that file's
location and loads the whole folder, keeping the file selected.

**100% client-side.** Files are read, edited, and saved entirely on your machine
via the [File System Access API](https://developer.mozilla.org/docs/Web/API/File_System_API).
There is no backend and nothing is ever uploaded.

## Stack

Ecosystem-standard: **Next.js 15** (App Router, client-only SPA) · **React 19** ·
**TypeScript** (strict) · **Tailwind CSS 3**. Markdown via
[`marked`](https://marked.js.org); Visual→Markdown via
[`turndown`](https://github.com/mixmark-io/turndown) + the GFM plugin. State via
[`zustand`](https://github.com/pmndrs/zustand).

## Port

Runs on **`3008`** (see the ecosystem `BLUEPRINT.md` port registry). `predev`
runs `scripts/ensure-port.mjs`, which refuses to start if `3008` is busy so the
app can never drift onto another project's port.

## Develop

```bash
npm install
npm run dev        # http://localhost:3008
npm run build      # production build
npm run build:tauri:web # static export for the desktop wrapper
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run tauri:dev  # desktop dev shell (requires Rust/Cargo)
npm run tauri:build # package .dmg/.exe targets (requires Rust/Cargo + signing setup)
```

## Browser support

Desktop **Chromium** (Chrome / Edge) is the primary target — single-file open,
folder browsing, and save-to-disk depend on the File System Access API
(`showOpenFilePicker` / `showDirectoryPicker`). Other browsers fall back to an
`<input type="file">` picker / drag-and-drop ingestion (no write-back; Save
downloads instead). Narrow viewports (≤720px) show a mobile gate with a
single-file read path.

The desktop wrapper uses **Tauri v2**. In Tauri, native open/save/rename/folder
refresh route through `@tauri-apps/plugin-dialog` and `@tauri-apps/plugin-fs`,
because macOS WKWebView does not provide Chromium's File System Access API.

## Keyboard

| Shortcut | Action |
|----------|--------|
| `⌘/Ctrl+O` | Open file |
| `⌘/Ctrl+Shift+O` | Open folder |
| `⌘/Ctrl+N` | New document |
| `⌘/Ctrl+S` | Save |
| `⌘/Ctrl+B` / `⌘/Ctrl+I` | Bold / Italic |
| `Tab` | Toggle Visual / Raw lens |
| `j` / `↓`, `k` / `↑` | Next / previous file |

## Layout

```
app/
  layout.tsx        fonts (Manrope, Playfair, Newsreader, JetBrains Mono), metadata, favicon
  page.tsx          client root — keyboard, drag/drop, mobile gate, wiring
  globals.css       the OctoSignal Lab "Parlor" brass design system
  splash/           the /splash landing page (page.tsx + scoped splash.css), ecosystem-aligned
components/         Sidebar, Topbar, ActionsMenu, FormattingToolbar, Stage,
                    Welcome, DropOverlay, Toast, MobileGate, icons
lib/
  store.ts          zustand store (files, lens, dirty, persistence prefs)
  fileSystem.ts     ingestion (FSA / picker / drag-drop), save, export, IndexedDB
  tauriFileSystem.ts native file adapter used only inside the Tauri wrapper
  markdown.ts       marked + turndown helpers, word-count
  types.ts
src-tauri/          Tauri v2 app shell, permissions, bundle config
types/              ambient FSA + webkitdirectory declarations
design-assts/       original design handoff (reference only)
```

The design handoff lives in `design-assts/design_handoff_octopus_ink/`.
