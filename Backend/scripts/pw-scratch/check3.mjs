import fs from "fs";
import path from "path";
const dir = "C:/Users/zawiy/AppData/Local/ms-playwright";
try {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const matching = entries.filter((e) => e.name.toLowerCase().includes("1200") || e.name.toLowerCase().includes("chromium"));
  for (const e of matching) {
    const p = path.join(dir, e.name);
    let size = "";
    try { const st = fs.statSync(p); size = st.size + " B"; } catch {}
    console.log("ENTRY:", e.name, size);
  }
  console.log("ALL:", entries.map(e=>e.name).join(","));
} catch (e) {
  console.log("ERROR:", e.message);
}

