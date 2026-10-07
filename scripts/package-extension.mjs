import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { copyFileSync } from "node:fs";
const root = resolve(import.meta.dirname, "..");
copyFileSync(resolve(root, "extension/models/url-forest.json"), resolve(root, "public/focusguard-url-model.json"));
execFileSync(
  "python3",
  [
    "-c",
    `from pathlib import Path
import zipfile
import sys
r=Path(sys.argv[1])
files=['manifest.json','background.js','core.mjs','view.mjs','url-check.mjs','models/url-forest.json','content.js','popup.html','dashboard.html','popup.js','ui.css','icon.png','README.md']
with zipfile.ZipFile(r/'public/focusguard-extension.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in files:z.write(r/'extension'/name,name)
print('Created public/focusguard-extension.zip')
`,
    root,
  ],
  { cwd: root, stdio: "inherit" },
);
