import fs from "fs";
const dir = "C:/Users/zawiy/AppData/Local/ms-playwright";
try {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const has1200 = entries.some((e) => e.name === "chromium-1200");
  console.log("HAS_CHROMIUM_1200:", has1200);
  let pwVersion = "not-installed";
  try {
    const p = JSON.parse(fs.readFileSync(process.cwd() + "/node_modules/@playwright/test/package.json", "utf8"));
    pwVersion = p.version;
  } catch {}
  console.log("SCRATCH_PW_VERSION:", pwVersion);
} catch (e) {
  console.log("ERROR:", e.message);
}

