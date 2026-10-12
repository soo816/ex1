// 화면 스크린샷 (390x844) — 실제로 UI 를 눌러 영상을 하나 끝까지 만든다. 서버가 떠 있어야 함.
// 사용법: PLAYWRIGHT_PATH=/opt/node-tools/node_modules/playwright node scripts/screenshots.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "docs", "screenshots");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const cards = [1, 2, 3, 4].map((n) => path.join(HERE, "..", "samples", "cards", `card${n}.png`));
const script = [
  "스마트폰, 아직 어렵게 느껴지시나요? 시니어 스마트폰 활용 교실에서 함께 배워요.",
  "메신저로 사진 보내기, 영상통화, 버스 도착 알림까지 하나씩 천천히 알려드립니다.",
  "수업은 매주 화요일과 목요일 오전 열 시, 한 반 열두 명으로 진행됩니다.",
  "신청은 전화 한 통이면 끝! 지금 바로 문의해 주세요.",
  "처음이어도 괜찮아요. 여러분을 기다리고 있을게요.",
].join("\n\n");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.error("페이지 오류:", e.message));
await page.goto(BASE);
await page.evaluate(() => document.fonts.ready);

// 1. 내용 넣기
await page.setInputFiles("#cardInput", cards);
await page.waitForFunction(() => document.querySelectorAll("#cardList li").length === 4);
await page.fill("#script", script);
await page.dispatchEvent("#script", "input");
await page.screenshot({ path: path.join(OUT, "step1-input.png") });

// 2. 장면 다듬기
await page.click("#next");
await page.waitForSelector("#step2:not([hidden])");
await page.screenshot({ path: path.join(OUT, "step2-scenes.png") });
await page.locator("#sceneList li").nth(4).scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, 120));
await page.screenshot({ path: path.join(OUT, "step2-textcard.png") });

// 3. 스타일
await page.click("#next");
await page.waitForSelector("#step3:not([hidden])");
await page.fill("#title", "시니어 스마트폰 교실");
await page.fill("#ctaMain", "지금 신청하세요");
await page.fill("#ctaSub", "☎ 02-000-0000");
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(OUT, "step3-style.png") });

// 4. 만들기 → 진행 → 결과
await page.click("#next");
await page.waitForSelector("#step4:not([hidden])");
await page.waitForFunction(() => /\d+%/.test(document.querySelector("#pct").textContent) && parseInt(document.querySelector("#pct").textContent) >= 30, null, { timeout: 600000 });
await page.screenshot({ path: path.join(OUT, "step4-progress.png") });
await page.waitForSelector("#resultView:not([hidden])", { timeout: 900000 });
// Playwright 의 Chromium 은 H.264 재생이 안 될 수 있어 표지(poster) 이미지가 뜰 때까지만 기다린다
await page.waitForFunction(() => !!document.querySelector("#player").poster, null, { timeout: 60000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(OUT, "step4-result.png") });
console.log("video:", await page.getAttribute("#download", "href"));
await browser.close();
