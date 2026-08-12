import fs from "fs";

// 1) Backend health
try {
  const resp = await fetch("http://localhost:9000/", { signal: AbortSignal.timeout(5000) });
  const text = await resp.text();
  console.log("BACKEND:", resp.status, JSON.stringify(text.slice(0, 60)));
} catch (e) {
  console.log("BACKEND DOWN:", e.message);
}

// 2) Chromium-1200 presence
const exe = "C:/Users/zawiy/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe";
console.log("CHROMIUM_1200_EXISTS:", fs.existsSync(exe));

// 3) List ms-playwright dirs (partial download check)
try {
  const dir = "C:/Users/zawiy/AppData/Local/ms-playwright";
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const partials = entries.filter((e) => e.isDirectory() && /1200|download/i.test(e.name));
  console.log("DIRS_MATCH_1200:", partials.map((e) => e.name).join(",") || "(none)");
  const dirlock = entries.some((e) => e.name === "__dirlock");
  console.log("DIRLOCK_PRESENT:", dirlock);
} catch (e) {
  console.log("READDIR ERR:", e.message);
}

