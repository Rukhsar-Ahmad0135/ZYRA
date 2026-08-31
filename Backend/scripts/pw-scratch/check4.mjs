import fs from "fs";
import path from "path";
const dir = "C:/Users/zawiy/AppData/Local/ms-playwright";
function walk(d, depth) {
  if (depth > 2) return;
  let out = [];
  try {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        out.push(`DIR ${p}`);
        out = out.concat(walk(p, depth + 1));
      } else {
        let sz = 0;
        try { sz = fs.statSync(p).size; } catch {}
        if (sz > 0) out.push(`  ${e.name} = ${sz} B`);
      }
    }
  } catch {}
  return out;
}
try {
  const lines = walk(dir, 0).filter((l) => /download|1200|chromium/i.test(l) || /DIR/.test(l));
  console.log(lines.slice(0, 60).join("\n"));
  console.log("---TOTAL LINES---", lines.length);
} catch (e) {
  console.log("ERR", e.message);
}

