import fs from "fs";

const viteBin = "f:/E Commerce project/ZYRA/Frontend/node_modules/vite/bin/vite.js";
try {
  const bytes = fs.readFileSync(viteBin);
  console.log("EXISTS, SIZE:", bytes.length);
  // Print first 100 bytes as hex + chars
  const first = bytes.subarray(0, 80);
  console.log("HEX:", [...first].map((b) => b.toString(16).padStart(2, "0")).join(" "));
  // print as text
  console.log("TEXT:", first.toString("utf8").replace(/\x00/g, "<NULL>").replace(/\s/g, " ") .slice(0, 120));
} catch (e) {
  console.log("ERROR:", e.message);
}

// Check package.json version
try {
  const pkg = JSON.parse(fs.readFileSync("f:/E Commerce project/ZYRA/Frontend/node_modules/vite/package.json", "utf8"));
  console.log("VITE VERSION:", pkg.version);
} catch (e) {
  console.log("VITE PKG ERROR:", e.message);
}

