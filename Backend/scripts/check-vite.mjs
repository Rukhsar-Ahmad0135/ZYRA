import fs from "fs";
const p = "f:/E Commerce project/ZYRA/Frontend/node_modules/vite/bin/vite.js";
try {
  const s = fs.statSync(p);
  console.log("VITE_JS_SIZE:", s.size);
  const txt = fs.readFileSync(p, "utf8");
  const hasViteMain = txt.includes("start") && txt.includes("import") || txt.includes("export");
  console.log("FIRST 200 PARENT:", txt.replace(/\s+/g, " ").slice(0, 200));
  console.log("HAS_NULL_BYTES:", txt.includes("\u0000"));
} catch (e) {
  console.log("ERROR:", e.message);
}

