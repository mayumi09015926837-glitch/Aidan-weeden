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
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" }); // final state, no animation
    await page.goto(url("index.html"));
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(out, `site-${width}.png`), fullPage: true });

    const r = await page.evaluate(() => {
      const res = { overflowX: document.documentElement.scrollWidth - innerWidth, small: [], taps: [], wide: [] };
      for (const el of document.querySelectorAll("body *")) {
        if (el.closest("svg") || el.closest("dialog:not([open])")) continue;
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (own && parseFloat(getComputedStyle(el).fontSize) < 20) res.small.push(el.tagName + ": " + el.textContent.trim().slice(0, 20) + " " + getComputedStyle(el).fontSize);
        const b = el.getBoundingClientRect();
        if (b.right > innerWidth + 1 && getComputedStyle(el).visibility !== "hidden") res.wide.push(el.tagName + "." + el.className);
      }
      for (const a of document.querySelectorAll("a, button")) {
        const b = a.getBoundingClientRect();
        if (!b.width || a.closest("dialog:not([open])") || a.classList.contains("skip")) continue; // hidden until used
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

  // Buttons and animations, with and without a filled-in config.
  console.log("Buttons and animations");
  const sampleCfg = `window.KYOSHITSU_CONFIG = { phone: "03-1234-5678", receptionHours: "平日 10:00〜17:00",
    lineUrl: "https://lin.ee/example", venueName: "市民センター", venueAddress: "東京都千代田区1-1", images: {} };`;
  const ok = (cond, msg) => (cond ? console.log("  ok   " + msg) : fail(msg));
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(url("index.html"));
    await page.waitForTimeout(300);
    const before = await page.evaluate(() => document.querySelectorAll(".reveal.is-in").length);
    await page.click(".header-tel");
    ok(await page.isVisible("#toast.is-shown"), "empty phone: call button shows 「準備中」 message");
    ok((await page.textContent("#toast")).includes("準備中"), "empty phone: message text");
    await page.waitForTimeout(6500);
    ok(await page.evaluate(() => [...document.querySelectorAll("#demo .step.is-on")].map((e) => e.dataset.step).join() === "1,2,4,5"), "hero demo plays to the end");
    await page.click("#demo-replay");
    await page.waitForTimeout(200);
    ok(await page.evaluate(() => document.querySelectorAll("#demo .step.is-on").length === 0), "replay button restarts the demo");
    await page.evaluate(() => scrollTo(0, 0));
    for (let y = 0; y < 6000; y += 400) { await page.mouse.wheel(0, 400); await page.waitForTimeout(60); }
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => ({ inn: document.querySelectorAll(".reveal.is-in").length, all: document.querySelectorAll(".reveal").length }));
    ok(before < r.all && r.inn === r.all, `scroll reveal: ${r.inn}/${r.all} sections faded in after scrolling`);
    // Problem lines light up as they pass, and the pinned phone changes screen per benefit
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(200);
    const dim = await page.evaluate(() => Number(document.querySelector("#lit-lines li:last-child").style.getPropertyValue("--lit")));
    await page.evaluate(() => document.querySelector("#lit-lines li:last-child").scrollIntoView({ block: "start", behavior: "instant" }));
    await page.waitForTimeout(200);
    const lit = await page.evaluate(() => Number(document.querySelector("#lit-lines li:last-child").style.getPropertyValue("--lit")));
    ok(dim < 0.1 && lit > 0.9, "problem lines light up as you scroll");
    const seen = [];
    for (let i = 0; i < 4; i++) {
      await page.evaluate((k) => document.querySelectorAll(".story-step")[k].scrollIntoView({ block: "center", behavior: "instant" }), i);
      await page.waitForTimeout(200);
      seen.push(await page.evaluate(() => [...document.querySelectorAll("#story-screens .screen")].findIndex((s) => s.classList.contains("is-active"))));
    }
    ok(seen.join() === "0,1,2,3", `pinned phone shows each benefit's screen in turn (${seen.join()})`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.route("**/js/config.js", (r) => r.fulfill({ contentType: "text/javascript", body: sampleCfg }));
    await page.goto(url("index.html"));
    ok((await page.getAttribute(".header-tel", "href")) === "tel:0312345678", "phone set: call buttons use tel:0312345678");
    await page.click(".header-tel");
    ok(await page.isVisible("#tel-dialog[open]"), "computer: call button opens the phone-number window");
    await page.click("#close-tel");
    ok(!(await page.isVisible("#tel-dialog[open]")), "phone-number window closes");
    ok((await page.getAttribute("#map-link", "href")).startsWith("https://www.google.com/maps/search/"), "map button opens Google Maps for the venue");
    ok((await page.getAttribute("[data-line]", "href")) === "https://lin.ee/example", "LINE buttons use the LINE URL");
    ok((await page.getAttribute('a[href="pamphlet.pdf"]', "download")) !== null, "pamphlet download button");
  }
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await page.goto(url("index.html"));
    ok(!(await page.evaluate(() => document.getElementById("action-bar").classList.contains("is-shown"))), "phone: bottom bar hidden at the top");
    await page.evaluate(() => document.getElementById("before").scrollIntoView());
    await page.waitForTimeout(1500); // smooth scroll takes a moment
    ok(await page.evaluate(() => document.getElementById("action-bar").classList.contains("is-shown")), "phone: bottom bar appears after scrolling");
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
