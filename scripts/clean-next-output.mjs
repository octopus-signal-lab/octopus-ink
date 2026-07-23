import { rmSync } from "node:fs";

for (const path of [".next", "out"]) {
  rmSync(path, { force: true, recursive: true });
}
