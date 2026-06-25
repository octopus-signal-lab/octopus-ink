"use client";

import { useEffect } from "react";

const LAB = "https://octosignal.org/";

export default function HelpDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="help-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="help-card" role="dialog" aria-modal="true" aria-label="Help and FAQ">
        <div className="help-head">
          <div className="help-head-t">
            <div className="help-title">Help &amp; FAQ</div>
            <div className="help-sub">
              How the app works, and answers to common questions
            </div>
          </div>
          <button className="about-x" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="help-body">
          <section className="help-sec">
            <h3>What is Octopus Ink?</h3>
            <p>
              A local-first Markdown reader and editor. It opens your{" "}
              <code>.md</code> files in two lenses: a rendered <b>Visual</b> view
              and the <b>Raw</b> source. You can edit in either, organize several
              folders side by side, and export when you&apos;re done. Everything
              happens on your device, and nothing is ever uploaded.
            </p>
          </section>

          <section className="help-sec">
            <h3>Getting started</h3>
            <div className="help-step">
              <span className="hs-n">1</span>
              <div>
                <b>Add a document.</b> Use <b>Add document</b> in the side panel
                to open a single file, start a blank draft, open a whole folder,
                or import &amp; convert another format. You can also drag files
                straight onto the window.
              </div>
            </div>
            <div className="help-step">
              <span className="hs-n">2</span>
              <div>
                <b>Pick your lens.</b> Use the <b>Visual / Raw</b> switch (top
                right) to flip between the rendered page and the Markdown source.
                Both stay in sync.
              </div>
            </div>
            <div className="help-step">
              <span className="hs-n">3</span>
              <div>
                <b>Edit and format.</b> Type directly in either lens. The toolbar
                covers headings, normal text, bold, italic, inline code, text
                colour, lists, quotes, dividers, links, and images.
              </div>
            </div>
            <div className="help-step">
              <span className="hs-n">4</span>
              <div>
                <b>Save or export.</b> Open the <b>Actions</b> menu in the
                toolbar to save to disk, save a copy, export to PDF or HTML, or
                copy the source.
              </div>
            </div>
          </section>

          <section className="help-sec">
            <h3>The two lenses</h3>
            <p>
              <b>Visual</b> renders your Markdown as a styled, editable page, the
              way your document will look. <b>Raw</b> shows the exact Markdown
              source in a monospace editor. Edits in one lens flow into the
              other, so you can write however you prefer and switch any time.
            </p>
            <p>
              The <b>page theme</b> toggle (sun / moon in the toolbar) switches
              the document area between a light &ldquo;paper&rdquo; view and a
              dark view. It changes only the document, not the app, and it&apos;s
              separate from how your file looks once exported.
            </p>
          </section>

          <section className="help-sec">
            <h3>Organizing your files</h3>
            <p>
              Each folder or set of files you open becomes its own{" "}
              <b>section</b> in the side panel, so you can keep several open at
              once and switch freely between them.
            </p>
            <div className="help-step">
              <span className="hs-n">▾</span>
              <div>
                <b>Collapse a section</b> by clicking its header, to tuck a
                folder&apos;s files out of the way.
              </div>
            </div>
            <div className="help-step">
              <span className="hs-n">↻</span>
              <div>
                <b>Refresh a folder</b> (hover its header) to re-scan the folder
                on disk for files you&apos;ve added, changed, or removed. Any
                unsaved edits you have open are kept.
              </div>
            </div>
            <div className="help-step">
              <span className="hs-n">✕</span>
              <div>
                <b>Close a folder or file</b> with its ✕. This only removes it
                from the list — it never deletes anything from your disk.
              </div>
            </div>
            <p className="help-fine">
              Use the <b>filter box</b> to narrow the list by name, and{" "}
              <kbd>⌘F</kbd> to find text inside the open document.
            </p>
          </section>

          <section className="help-sec">
            <h3>Keyboard shortcuts</h3>
            <ul className="help-keys">
              <li><span>Open file</span><kbd>⌘O</kbd></li>
              <li><span>New document</span><kbd>⌘N</kbd></li>
              <li><span>Open folder</span><kbd>⌘⇧O</kbd></li>
              <li><span>Save to disk</span><kbd>⌘S</kbd></li>
              <li><span>Find in document</span><kbd>⌘F</kbd></li>
              <li><span>Bold / Italic</span><kbd>⌘B · ⌘I</kbd></li>
              <li><span>Switch lens</span><kbd>Tab</kbd></li>
              <li><span>Next / previous file</span><kbd>J · K</kbd></li>
            </ul>
            <p className="help-fine">
              On Windows, use <kbd>Ctrl</kbd> in place of <kbd>⌘</kbd>.
            </p>
          </section>

          <section className="help-sec">
            <h3>Frequently asked questions</h3>
            {FAQS.map(([q, a], i) => (
              <details className="faq" key={i}>
                <summary>{q}</summary>
                <p dangerouslySetInnerHTML={{ __html: a }} />
              </details>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

const FAQS: [string, string][] = [
  [
    "Is my data private? Where are my files stored?",
    "Completely private. Octopus Ink has no server and no account. Your files are read, edited, and saved entirely on your own computer, and nothing is uploaded or tracked.",
  ],
  [
    "Does editing change my original file?",
    "Only when you choose to. Edits live in the app until you <b>Save</b> (which writes back to the file you opened) or <b>Save as</b> (which creates a copy). Imported and newly created documents start as unsaved copies, so your source files are never touched until you say so. Files with unsaved edits show a glowing dot in the list, and the app warns you before you close one or leave the page.",
  ],
  [
    "Can I open more than one folder at a time?",
    "Yes. Every folder or set of files you open becomes its own section in the side panel, so you can keep several open together. Collapse a section from its header, refresh a folder to pick up changes on disk, or close it with the ✕ (which only clears it from the list).",
  ],
  [
    "I added files to a folder on disk — how do I see them?",
    "Hover the folder's section header and click the <b>refresh</b> (↻) icon. Octopus Ink re-scans that folder for new, changed, or removed files, while keeping any unsaved edits you have open.",
  ],
  [
    "Why did my Markdown formatting change after editing in Visual?",
    "When you edit the rendered Visual view, the app converts it back to Markdown, which can normalize things like list markers or spacing. The content stays the same; only the source style shifts. For exact control over the source, edit in the <b>Raw</b> lens.",
  ],
  [
    "What can I open and import?",
    "You can open <code>.md</code>, <code>.markdown</code>, <code>.mdx</code>, and <code>.txt</code> files directly. <b>Import &amp; convert</b> also turns <code>.docx</code> (Word) and <code>.html</code> files into Markdown. Complex Word features (merged-cell tables, footnotes, embedded images) may simplify during conversion.",
  ],
  [
    "Can I change the look of the document?",
    "Yes. The page theme toggle (sun / moon) switches the document area between a light \"paper\" view and a dark view, and the colour control in the toolbar tints selected text. These affect how you see the document while editing; the page theme is separate from how an exported file looks.",
  ],
  [
    "Why does it need Chrome or Edge? Does it work on mobile?",
    "Opening folders and saving back to disk rely on a browser capability currently available in desktop Chrome and Edge. In other browsers you can still open and read individual files. On phones and tablets you'll see a simplified single-file reader, since mobile browsers can't browse folders or write files.",
  ],
  [
    "Can I reopen my last folder automatically?",
    "Yes. Octopus Ink remembers the folder you were working in. When you return, it reopens it if it still has permission. If not, you'll see a quick prompt to grant access again.",
  ],
  [
    "Is it really free?",
    `Yes. Octopus Ink is free to use, and it's one of the tools from <a class="lab-link" href="${LAB}" target="_blank" rel="noopener">OctoSignal Lab</a>.`,
  ],
  [
    "Can I support the project or give credit?",
    `There's no obligation, but a little credit is always appreciated. If Octopus Ink is useful to you, a mention or a link back to <a class="lab-link" href="${LAB}" target="_blank" rel="noopener">OctoSignal Lab</a> helps other people find it. Sharing it with someone who'd find it handy means a lot too.`,
  ],
];
