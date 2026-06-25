import { describe, it, expect } from "vitest";
import { parseMarkdown, htmlToMarkdown, sanitizeHtml, computeMeta } from "./markdown";

describe("sanitizeHtml (XSS hardening)", () => {
  it("removes <script> tags", () => {
    expect(parseMarkdown("# Hi\n\n<script>window.x=1</script>")).not.toMatch(/<script/i);
  });
  it("strips inline event handlers", () => {
    expect(sanitizeHtml('<img src="x" onerror="alert(1)">')).not.toMatch(/onerror/i);
  });
  it("strips javascript: links", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toMatch(/javascript:/i);
  });
  it("forces links to open safely", () => {
    const out = sanitizeHtml('<a href="https://example.com">x</a>');
    expect(out).toMatch(/rel="noopener/);
    expect(out).toMatch(/target="_blank"/);
  });
});

describe("sanitizeHtml keeps editor-needed markup", () => {
  it("keeps data:image sources", () => {
    expect(sanitizeHtml('<img src="data:image/png;base64,iVBORw0KGgo" alt="x">')).toMatch(
      /data:image\/png/
    );
  });
  it("keeps img width (resize) and colour spans", () => {
    const out = sanitizeHtml(
      '<img src="data:image/png;base64,iVB" width="120"><span style="color:#c5301f">x</span>'
    );
    expect(out).toMatch(/width="120"/);
    expect(out).toMatch(/color/);
  });
  it("keeps task checkboxes", () => {
    expect(parseMarkdown("- [ ] task")).toMatch(/type="checkbox"/);
  });
});

describe("markdown round-trip", () => {
  it("preserves headings and lists", () => {
    const back = htmlToMarkdown(parseMarkdown("# Title\n\n- a\n- b"));
    expect(back).toMatch(/# Title/);
    expect(back).toMatch(/-\s+a/);
    expect(back).toMatch(/-\s+b/);
  });
  it("preserves a colour span as inline HTML", () => {
    const back = htmlToMarkdown(parseMarkdown('plain <span style="color:#a9781d">gold</span>'));
    expect(back).toMatch(/<span style="color/);
    expect(back).toMatch(/gold/);
  });
});

describe("computeMeta", () => {
  it("counts words and read time", () => {
    expect(computeMeta("one two three").words).toBe(3);
    expect(computeMeta("").words).toBe(0);
    expect(computeMeta("x").minutes).toBe(1);
  });
});
