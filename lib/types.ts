export type LensView = "visual" | "raw";

/** One in-memory model per file. `text` is the single source of truth (always Markdown). */
export interface MdFile {
  id: string;
  name: string;
  path: string;
  group: string;
  text: string;
  dirty: boolean;
  /** Present only when opened via the File System Access API (enables save-to-disk). */
  handle?: FileSystemFileHandle;
  /** Present only in the Tauri desktop wrapper (enables native save-to-disk). */
  nativePath?: string;
}
