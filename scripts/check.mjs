// Renders the site and pamphlet and checks layout. Screenshots go to checks/.
// Run: npm run check
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const url = (f) => pathToFileURL(path.join(root, f)).href;
const out = path.join(root, "checks");
fs.mkdirSync(out, { recursive: true });
let failures = 0;
const fail = (msg) => { failures++; console.log("  FAIL " + msg); };

const browser = await chromium.launch();
try {
  for (const width of [390, 1280]) {
    console.log(`Website at ${width}px`);
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(url("index.html"));
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(out, `site-${width}.png`), fullPage: true });

    const r = await page.evaluate(() => {
      const res = { overflowX: document.documentElement.scrollWidth - innerWidth, small: [], taps: [], wide: [] };
      for (const el of document.querySelectorAll("body *")) {
        if (el.closest("svg")) continue;
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (own && parseFloat(getComputedStyle(el).fontSize) < 20) res.small.push(el.tagName + ": " + el.textContent.trim().slice(0, 20) + " " + getComputedStyle(el).fontSize);
        const b = el.getBoundingClientRect();
        if (b.right > innerWidth + 1 && getComputedStyle(el).visibility !== "hidden") res.wide.push(el.tagName + "." + el.className);
      }
      for (const a of document.querySelectorAll("a, button")) {
        const b = a.getBoundingClientRect();
        if (b.height < 48) res.taps.push(a.textContent.trim().slice(0, 20) + ` (${Math.round(b.height)}px)`);
      }
      return res;
    });
    if (r.overflowX > 0) fail(`page scrolls sideways by ${r.overflowX}px`);
    if (r.wide.length) fail("elements wider than screen: " + [...new Set(r.wide)].slice(0, 5).join(", "));
    if (r.small.length) fail("text under 20px: " + r.small.slice(0, 5).join(" | "));
    if (r.taps.length) fail("tap targets under 48px: " + r.taps.join(", "));
    if (!r.overflowX && !r.wide.length && !r.small.length && !r.taps.length) console.log("  ok");
  }

  // Also test with long, realistic values so a filled-in config still fits.
  const sample = `window.KYOSHITSU_CONFIG = {
    phone: "0120-123-456", receptionHours: "平日 10:00〜17:00(土日祝はお休み)",
    dates: "2027年1月15日から毎週金曜日(全6回)", startTime: "午後2時",
    venueName: "〇〇市民センター 2階 第3会議室", venueAddress: "〇〇県〇〇市〇〇町1丁目2番3号",
    seats: "6", price: "29,800",
    instructorName: "山田 花子", instructorBio: "元・商店街の店主。シニア向けスマホ教室の講師歴5年。ゆっくり、何度でもお教えします。",
    organizerName: "〇〇デジタル相談室", organizerAddress: "〇〇県〇〇市〇〇町1丁目2番3号", images: {} };`;
  for (const filled of [false, true]) {
  console.log(filled ? "Pamphlet (sample filled-in config)" : "Pamphlet");
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
  if (filled) await page.route("**/js/config.js", (r) => r.fulfill({ contentType: "text/javascript", body: sample }));
  await page.goto(url("pamphlet.html"));
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: "print" });
  const pages = await page.$$(".page");
  if (pages.length !== 4) fail(`expected 4 pages, found ${pages.length}`);
  for (const [i, p] of pages.entries()) {
    await p.screenshot({ path: path.join(out, `pamphlet-p${i + 1}${filled ? "-filled" : ""}.png`) });
    const r = await p.evaluate((pg) => {
      const box = pg.getBoundingClientRect();
      const mm = box.width / 210;
      const res = { w: box.width / mm, h: box.height / mm, overflow: pg.scrollHeight > pg.clientHeight + 1, outside: [], small: [] };
      for (const el of pg.querySelectorAll("*")) {
        if (el.closest("svg")) continue;
        const b = el.getBoundingClientRect();
        if (b.width && (b.bottom > box.bottom + 1 || b.right > box.right + 1)) res.outside.push(el.tagName + "." + el.className);
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (own && parseFloat(getComputedStyle(el).fontSize) < 16) res.small.push(el.textContent.trim().slice(0, 15)); // 12pt = 16px
      }
      return res;
    });
    const label = `page ${i + 1} (${r.w.toFixed(0)}x${r.h.toFixed(0)}mm)`;
    if (r.overflow || r.outside.length) fail(`${label} overflows: ${r.outside.slice(0, 4).join(", ")}`);
    else if (r.small.length) fail(`${label} text under 12pt: ${r.small.slice(0, 4).join(" | ")}`);
    else console.log(`  ${label} ok`);
  }
  }

  const pdf = path.join(root, "pamphlet.pdf");
  if (fs.existsSync(pdf)) {
    const n = (fs.readFileSync(pdf, "latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
    if (n !== 4) fail(`pamphlet.pdf has ${n} pages, expected 4`);
    else console.log("  pamphlet.pdf has 4 pages ok");
  }
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} problem(s) found` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
