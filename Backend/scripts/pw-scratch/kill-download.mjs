import { execSync } from "child_process";

// Find processes whose command line references the playwright install/download.
const out = execSync(
  'powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match \'playwright install|downloadBrowserMain|oopDownloadBrowser\' } | Select-Object ProcessId,Name | ConvertTo-Json"',
  { encoding: "utf8", windowsHide: true }
).trim();

let matches = [];
try {
  const parsed = JSON.parse(out);
  matches = Array.isArray(parsed) ? parsed : parsed?.ProcessId ? [parsed] : [];
} catch {
  matches = [];
}

if (!matches.length) {
  console.log("No matching download processes found.");
} else {
  for (const m of matches) {
    console.log("Killing PID", m.ProcessId, m.Name);
    try {
      execSync(`powershell -NoProfile -Command "Stop-Process -Id ${m.ProcessId} -Force"`, { windowsHide: true });
      console.log("  killed", m.ProcessId);
    } catch (e) {
      console.log("  already gone / err", m.ProcessId, e.message);
    }
  }
}

