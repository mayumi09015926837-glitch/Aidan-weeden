// Builds pamphlet.pdf, images/ogp.png and images/apple-touch-icon.png.
// Run: npm run build
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const url = (f) => pathToFileURL(path.join(root, f)).href;

async function ready(page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300); // let config photos finish swapping in
}

const browser = await chromium.launch();
try {
  // Pamphlet PDF (A4, 4 pages)
  const page = await browser.newPage();
  await page.goto(url("pamphlet.html"));
  await ready(page);
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: path.join(root, "pamphlet.pdf"),
    preferCSSPageSize: true,
    printBackground: true,
  });
  console.log("pamphlet.pdf written");

  // OGP image for social sharing (1200x630)
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  const svg = fs.readFileSync(path.join(root, "index.html"), "utf8").match(/<svg class="illust"[\s\S]*?<\/svg>/)[0];
  await og.setContent(`<!doctype html><html lang="ja"><head><meta charset="utf-8">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@700&family=Zen+Maru+Gothic:wght@700&display=swap">
    <style>
      body{margin:0;width:1200px;height:630px;background:#0F6E6A;color:#fff;display:flex;align-items:center;gap:40px;padding:0 70px;box-sizing:border-box;font-family:"BIZ UDPGothic",sans-serif}
      .t{flex:1} .b{display:inline-block;background:#fff;color:#0A4F4C;border-radius:999px;padding:6px 26px;font-size:30px;font-weight:700}
      h1{font-family:"Zen Maru Gothic";font-size:92px;line-height:1.2;margin:24px 0 18px} p{font-family:"Zen Maru Gothic";font-size:44px;margin:0}
      svg{width:440px;height:367px;flex:none}
    </style></head><body><div class="t"><span class="b">スマホから始める AI講座</span><h1>はじめての<br>AI教室</h1><p>今からでも、間に合います。</p></div>${svg}</body></html>`);
  await ready(og);
  await og.screenshot({ path: path.join(root, "images/ogp.png") });
  console.log("images/ogp.png written");

  // Home-screen icon for iPhone
  const icon = await browser.newPage({ viewport: { width: 180, height: 180 } });
  await icon.goto(url("favicon.svg"));
  await icon.screenshot({ path: path.join(root, "images/apple-touch-icon.png") });
  console.log("images/apple-touch-icon.png written");
} finally {
  await browser.close();
}
