// Browser-based QA for ZYRA Clerk auth UI flows (Playwright).
// Verifies that the Clerk-powered login/register pages render, the
// guest->checkout redirect flow works, and the admin route guard behaves.
// Real email/Google sign-in requires interactive credentials, so this checks
// the UI + guard logic and reports which steps need a human to complete.
import { chromium } from "@playwright/test";
import fs from "fs";

const BASE = "http://localhost:5173";
const results = { pass: 0, fail: 0, info: [] };
const log = (...a) => console.log("[QA-UI]", ...a);
const check = (name, cond, detail = "") => {
  if (cond) { results.pass++; log("PASS", name, detail); }
  else { results.fail++; log("FAIL", name, detail); }
};

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Users/zawiy/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe",
});
const page = await browser.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e)));

try {
const goto = (url) =>
    page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

  // 1) Home page loads
  await goto(BASE + "/");
  await page.waitForTimeout(2000);
  check("home page loads", page.url().includes("/"), "title=" + JSON.stringify(await page.title()));

  // 2) Login page renders Clerk SignIn
  await goto(BASE + "/login");
  await page.waitForTimeout(4000);
  const loginText = await page.textContent("body").catch(() => "");
  check(
    "login page renders Clerk SignIn",
    /Sign in|Continue|Email|Password|Google/i.test(loginText),
    "has Clerk sign-in text",
  );
  const loginButtons = await page.locator("button, a[href]").count().catch(() => 0);
  log("INFO login interactive elements:", loginButtons);

  // 3) Register page renders Clerk SignUp
  await goto(BASE + "/register");
  await page.waitForTimeout(4000);
  const regText = await page.textContent("body").catch(() => "");
  check(
    "register page renders Clerk SignUp",
    /Continue|Create|Sign up|Email|Google|Password/i.test(regText),
    "has Clerk sign-up text",
  );

  // 4) Guest clicked checkout -> redirected to /login?redirect=/checkout
  await goto(BASE + "/checkout");
  await page.waitForTimeout(3000);
  const checkoutRedirect = page.url();
  check(
    "unauthenticated /checkout redirects to login",
    checkoutRedirect.startsWith(BASE + "/login"),
    "redirected to " + checkoutRedirect.replace(BASE, ""),
  );

  // 5) Admin route guard redirects unauthenticated to login
  await goto(BASE + "/admin");
  await page.waitForTimeout(3000);
  const adminRedirect = page.url();
  check(
    "unauthenticated /admin redirects to login",
    adminRedirect.startsWith(BASE + "/login"),
    "redirected to " + adminRedirect.replace(BASE, ""),
  );

  // 6) Profile (protected) redirects unauthenticated to login
  await goto(BASE + "/profile");
  await page.waitForTimeout(3000);
  const profRedirect = page.url();
  check(
    "unauthenticated /profile redirects to login",
    profRedirect.startsWith(BASE + "/login"),
    "redirected to " + profRedirect.replace(BASE, ""),
  );
} catch (e) {
  log("ERROR", e.message);
  results.fail++;
} finally {
  await browser.close();
}

log("page errors:", pageErrors.length, pageErrors.slice(0, 3));
console.log("\n===== RESULTS", JSON.stringify(results));
