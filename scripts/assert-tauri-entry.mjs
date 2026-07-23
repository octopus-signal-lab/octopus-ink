import { readFileSync } from "node:fs";

const html = readFileSync("out/index.html", "utf8");

const required = ["Add document", "Filter files", "Visual", "Raw"];
const forbidden = ["Download for desktop", "Octosignal Apps"];

const missing = required.filter((text) => !html.includes(text));
const presentForbidden = forbidden.filter((text) => html.includes(text));

if (missing.length > 0 || presentForbidden.length > 0) {
  console.error("Tauri export root must open the editor, not the splash page.");
  if (missing.length > 0) {
    console.error(`Missing editor markers: ${missing.join(", ")}`);
  }
  if (presentForbidden.length > 0) {
    console.error(`Found splash markers: ${presentForbidden.join(", ")}`);
  }
  process.exit(1);
}

console.log("Tauri export root verified: desktop build opens the editor.");
