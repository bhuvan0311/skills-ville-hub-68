import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const runtime = process.env.ERP_BROWSER_RUNTIME;
const require = createRequire(
  runtime ? `${runtime}/package.json` : import.meta.url,
);
const { chromium } = require("playwright");
const browser = await chromium.launch({
  headless: true,
  channel: process.env.ERP_BROWSER_CHANNEL || "msedge",
});
let page;
try {
  page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:4174/erp/overview");
  await page
    .getByRole("heading", { name: "Your centre, at a glance" })
    .waitFor();
  await page.getByText("Sample Student A", { exact: true }).waitFor();
  assert.equal(
    await page.getByText("Level 1 · 12 / 12 attended classes").count(),
    1,
  );
  await mkdir("docs/screenshots", { recursive: true });
  await page.screenshot({
    path: "docs/screenshots/erp-desktop.png",
    fullPage: true,
  });
  for (const [module, heading] of [
    ["admissions", "Admissions"],
    ["fees", "Fees & receipts"],
    ["learning", "Learning operations"],
    ["timetable", "Class timetable"],
    ["commercial", "Centre finances"],
    ["stock", "Stock & procurement"],
    ["franchises", "Franchise lifecycle"],
    ["team", "People & permissions"],
    ["communications", "Parent communications"],
    ["audit", "Activity history"],
  ]) {
    await page.goto(`http://127.0.0.1:4174/erp/${module}`);
    await page
      .getByRole("heading", { name: heading, exact: true, level: 1 })
      .waitFor();
    await page.getByRole("tab").first().waitFor();
    await page.getByRole("button", { name: "Export CSV" }).waitFor();
  }
  await page.goto("http://127.0.0.1:4174/erp/fees");
  await page.getByRole("button", { name: "Create / assign" }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByLabel("Student *", { exact: true }).selectOption("student-1");
  await page.getByLabel("Fee plan *", { exact: true }).selectOption("plan-1");
  await page.getByLabel("First due date *", { exact: true }).fill("2026-11-01");
  await page.getByRole("button", { name: "Save record" }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Saving is disabled" })
    .waitFor();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:4174/erp/overview");
  await page.getByText("Sample Student A", { exact: true }).waitFor();
  const sizes = await page.evaluate(() => ({
    width: window.innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert.ok(
    sizes.scroll <= sizes.width,
    `Mobile overflow: ${JSON.stringify(sizes)}`,
  );
  await page.screenshot({
    path: "docs/screenshots/erp-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Fees & receipts" })
    .click();
  await page
    .getByRole("heading", { name: "Fees & receipts", exact: true })
    .waitFor();
  assert.deepEqual(errors, []);
  await page.goto("http://127.0.0.1:4174/erp/parent?role=parent");
  await page
    .getByRole("heading", { name: "Your child’s journey", level: 1 })
    .waitFor();
  assert.equal(
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Centre finances" })
      .count(),
    0,
  );
  assert.equal(
    await page.getByText("Sample Student B", { exact: true }).count(),
    0,
  );
  await page.getByRole("tab", { name: "Payment verification" }).click();
  await page.getByRole("button", { name: "Add record" }).click();
  assert.equal(
    await page
      .getByLabel("Method *", { exact: true })
      .locator('option[value="CASH"]')
      .count(),
    0,
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.goto("http://127.0.0.1:4174/erp/fees?role=teacher");
  await page
    .getByRole("heading", { name: "Your centre, at a glance", level: 1 })
    .waitFor();
  assert.equal(
    await page.getByText("Outstanding fees", { exact: true }).count(),
    0,
  );
  assert.equal(
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Fees & receipts" })
      .count(),
    0,
  );
  assert.deepEqual(errors, []);
  process.stdout.write(
    "PASS 11 internal module screens, parent/teacher access views, failed-save feedback, mobile overflow and navigation, no browser runtime errors.\nDesign fixtures only; production authentication and live persistence are not claimed.\n",
  );
} finally {
  await browser.close();
}
