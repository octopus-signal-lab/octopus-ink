/* Ambient declarations for the File System Access API extensions that are not
   yet part of TypeScript's standard lib.dom, plus the non-standard
   `webkitdirectory` input attribute. Octopus Ink is Chromium-desktop-first. */

import "react";

type FileSystemPermissionMode = "read" | "readwrite";

interface FileSystemHandlePermissionDescriptor {
  mode?: FileSystemPermissionMode;
}

declare global {
  interface FileSystemHandle {
    queryPermission?(
      descriptor?: FileSystemHandlePermissionDescriptor
    ): Promise<PermissionState>;
    requestPermission?(
      descriptor?: FileSystemHandlePermissionDescriptor
    ): Promise<PermissionState>;
  }

  interface FileSystemFileHandle {
    /** Rename (or move) the file on disk. Chromium 111+. */
    move?(name: string): Promise<void>;
    move?(directory: FileSystemDirectoryHandle, name?: string): Promise<void>;
  }

  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  }

  interface DataTransferItem {
    getAsFileSystemHandle?(): Promise<FileSystemHandle | null>;
  }

  interface FilePickerAcceptType {
    description?: string;
    accept: Record<string, string[]>;
  }

  interface Window {
    showDirectoryPicker?(options?: {
      id?: string;
      mode?: FileSystemPermissionMode;
      startIn?: string | FileSystemHandle;
    }): Promise<FileSystemDirectoryHandle>;
    showOpenFilePicker?(options?: {
      id?: string;
      multiple?: boolean;
      excludeAcceptAllOption?: boolean;
      types?: FilePickerAcceptType[];
      startIn?: string | FileSystemHandle;
    }): Promise<FileSystemFileHandle[]>;
    showSaveFilePicker?(options?: {
      id?: string;
      suggestedName?: string;
      excludeAcceptAllOption?: boolean;
      types?: FilePickerAcceptType[];
      startIn?: string | FileSystemHandle;
    }): Promise<FileSystemFileHandle>;
  }
}

declare module "react" {
  // Generic param must match React's InputHTMLAttributes<T> for the merge.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}

export {};
