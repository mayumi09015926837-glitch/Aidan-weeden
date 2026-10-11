# はじめてのAI教室 — website and pamphlet

An in-person AI course for older small-business owners in Japan, taught on smartphones in small groups.
This folder holds:

| File | What it is |
|---|---|
| `index.html` | The one-page website (plain HTML + CSS, no framework, no build step) |
| `pamphlet.html` | The 4-page A4 pamphlet, laid out for printing |
| `pamphlet.pdf` | The pamphlet as a print-ready PDF (made from `pamphlet.html`) |
| `js/config.js` | **The one file you fill in**: phone, dates, venue, price, etc. |
| `css/base.css` | Shared colours, fonts and components used by both |
| `js/site.js` | Button behaviour, scroll animations and the chat demo (no need to edit) |
| `images/` | Put your photos here. Also holds the social-share image and phone icon |

Anything you have not filled in yet shows up in orange as 【…】, so you can see at a glance what's missing.

---

## 1. Fill in your details

Open **`js/config.js`** and type your details between the quotes:

```js
phone: "03-1234-5678",
price: "29,800",
```

Both the website and the pamphlet read this file. Leave a value as `""` and it stays as an orange 【…】.

Some settings also switch on the website's buttons:

| Setting | Button it controls |
|---|---|
| `phone` | Every "電話で申し込む" button. On a phone it dials straight away; on a computer it opens a window with the number shown large and a "番号をコピー" (copy) button. |
| `lineUrl` | The LINE buttons. Use your LINE official account's add-friend link (友だち追加URL, e.g. `https://lin.ee/…`). |
| `venueAddress` (or `mapUrl`) | "会場の地図を見る". It opens Google Maps for the address, or the exact map link you put in `mapUrl`. |

While a setting is still empty, its button shows a short 「準備中です」 message instead of doing
nothing. Two buttons need no settings: "パンフレット(PDF)" downloads `pamphlet.pdf`, and
"このページを家族に送る" opens the phone's share menu (LINE, mail, …), or copies the page address on a computer.

**Photos (optional).** Put the image files in `images/` and write their names in the `images` section:

```js
images: {
  hero: "images/hero.jpg",
  instructor: "images/instructor.jpg",
  classPhoto: "images/class.jpg",
  lineQr: "images/line-qr.png"
}
```

If a photo is missing or its name is misspelled, the page shows the built-in illustration instead, so
nothing breaks. Use real photos of your own class where you can; ask people's permission before using
photos of them.

**Animations.** The chat demo at the top plays once, and visitors can replay it. Sections fade in
gently as you scroll, and the line beside the 6 sessions fills in as you go. Visitors who have turned on "reduce motion" on their phone or
computer see everything without movement.

**Wording.** The text itself (headlines, card text, FAQ) is written directly in `index.html` and
`pamphlet.html`. If you change a sentence, change it in both files.

## 2. Remake the PDF (and check the layout)

After changing the config or the wording, make a fresh `pamphlet.pdf`. You need [Node.js](https://nodejs.org/) installed. Then, in this folder:

```bash
npm install                       # first time only
npx playwright install chromium   # first time only (downloads a browser)
npm run pdf
```

`npm run pdf` does two things:

1. **Build.** It writes `pamphlet.pdf`, `images/ogp.png` (the picture shown when the site is shared on
   LINE, Facebook or X) and `images/apple-touch-icon.png`.
2. **Check.** It opens the website at phone width (390px) and desktop width (1280px), and checks for sideways
   scrolling, text smaller than 20px, and buttons smaller than 48px. It also clicks every kind of
   button, plays the chat demo at the top of the page, and scrolls through the page to confirm that the
   animations run. It also checks that each
   pamphlet page fits exactly on one A4 sheet, both as it is now and with long sample details filled in.
   Screenshots go to the `checks/` folder so you can look at them.

If it says `All checks passed`, the PDF is ready for the printer. Tell the print shop: **A4, portrait, 4 pages,
full colour, no margins (フチなし)**. Pages 2 and 3 are designed to sit side by side
(BEFORE → AFTER), so a folded A3 booklet works well. Or you can print it from a browser: open `pamphlet.html` in Chrome →
Print → Paper A4, Margins "None", tick "Background graphics".

## 3. Put the website online

The site needs only these files: `index.html`, `favicon.svg`, `css/`, `js/`, `images/`
(and `pamphlet.pdf` if you want people to be able to download it).

**Netlify (easiest).**
1. Make a new folder containing just the files listed above.
2. Go to <https://app.netlify.com/drop>, sign up for free, and drag that folder onto the page.
3. You get an address like `https://something.netlify.app`. You can rename it, or connect your own
   domain, in the site settings.

**GitHub Pages.**
1. On GitHub, open this repository → **Settings** → **Pages**.
2. Under "Build and deployment", choose **Deploy from a branch**, then pick your main branch and the `/ (root)` folder. Click **Save**.
3. After a minute the site is at `https://<your-username>.github.io/<repository-name>/`.

   GitHub Pages publishes the whole repository, including the `.claude/` skills folder, which is
   harmless. On a free account, the repository must be public for Pages to work.

**After it's online.** Open `index.html` and replace both `https://example.com` addresses in the
`og:url` and `og:image` lines near the top with your real address. Then the preview picture shows
up when someone shares the link on LINE.

---

## TODO before printing or publishing: check the refund wording (特定商取引法)

> **Not solved here. A professional must check this.**

The site and pamphlet currently promise:
「初回のあと、ご納得いただけなければ全額返金」.

Japan's Act on Specified Commercial Transactions (特定商取引法) treats some lessons as
**特定継続的役務提供** (specified continuous services). パソコン教室 is one of the listed types. When
a contract for these lessons **runs longer than 2 months and costs more than ¥50,000**:

- you must give the customer a summary document (概要書面) before the contract and a contract document
  (契約書面) after it, with legally required contents;
- the customer can cancel for any reason within **8 days** of receiving the contract document
  (クーリング・オフ), and get a full refund;
- after that, the customer can still **cancel mid-course** (中途解約). You may only keep the fees
  for lessons already given, plus a cancellation fee capped by law.

Questions to confirm with a lawyer, a 行政書士, or your local 消費生活センター (consumer affairs centre):

1. Does a smartphone/AI course count as パソコン教室 under the law?
2. Does the course actually go over both thresholds? Six weekly classes last about 6 weeks, which
   may be under 2 months. Check against your real schedule and price.
3. Is the "full refund after the first lesson" promise worded so it never gives *less* than the
   law requires? Does it conflict with cooling-off or mid-course cancellation rights?
4. Which written terms (cancellation, refund method and timing, organiser's name and address) must
   appear on the pamphlet, the website, or a separate contract document?

Also check the 消費者契約法 (Consumer Contract Act), which applies to all consumer contracts whatever
the price.
