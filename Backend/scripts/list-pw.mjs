import fs from "fs";
const dir = "C:/Users/zawiy/AppData/Local/ms-playwright";
try {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) console.log("DIR:", e.name);
  }
  console.log("---END---");
} catch (e) {
  console.log("ERROR:", e.message);
}
