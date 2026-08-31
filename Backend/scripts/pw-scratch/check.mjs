import { readFileSync } from "fs";
import { join } from "path";
try {
  const p = readFileSync(join(process.cwd(), "node_modules", "@playwright", "test", "package.json"), "utf8");
  const j = JSON.parse(p);
  console.log("PLAYWRIGHT_VERSION:", j.version);
} catch (e) {
  console.log("NOT_READY:", e.message);
}

