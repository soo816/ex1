// 테스트용 가상 카드뉴스 4장 만들기 (실제 기관·인물·브랜드 없음)
// 사용법: PLAYWRIGHT_PATH=/opt/node-tools/node_modules/playwright node scripts/make-sample-cards.mjs
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "samples", "cards");
const font = (name) =>
  "data:font/woff2;base64," + fs.readFileSync(path.join(HERE, "..", "..", "video", "public", "fonts", name)).toString("base64");
const FONT = font("Pretendard-ExtraBold.woff2");
const FONT_M = font("Pretendard-Medium.woff2");

const cards = [
  { bg: "#1d4ed8", fg: "#fff", tag: "수강생 모집", big: "시니어<br>스마트폰<br>활용 교실", small: "처음이어도 괜찮아요", icon: "📱" },
  { bg: "#f8fafc", fg: "#0f2a5a", tag: "이런 걸 배워요", big: "메신저로 사진 보내기<br>영상통화<br>버스 도착 알림", small: "매주 한 가지씩 천천히", icon: "✅" },
  { bg: "#fef3c7", fg: "#7c2d12", tag: "수업 안내", big: "매주 화·목<br>오전 10시", small: "한 반 12명 · 4주 과정 · 수강료 무료", icon: "🗓️" },
  { bg: "#0f2a5a", fg: "#fff", tag: "신청 방법", big: "전화 한 통이면<br>신청 끝!", small: "02-000-0000 (가상 번호)", icon: "☎️" },
];

const html = (c, i) => `<!doctype html><html><head><style>
@font-face{font-family:P;src:url(${FONT});font-weight:800}
@font-face{font-family:P;src:url(${FONT_M});font-weight:500}
body{margin:0;width:1080px;height:1350px;background:${c.bg};color:${c.fg};font-family:P;display:flex;flex-direction:column;justify-content:center;padding:0 100px;box-sizing:border-box;position:relative;overflow:hidden}
.tag{display:inline-block;align-self:flex-start;background:${c.fg};color:${c.bg};font-weight:800;font-size:44px;padding:14px 32px;border-radius:999px;margin-bottom:60px}
.big{font-weight:800;font-size:${i === 1 ? 92 : 120}px;line-height:1.22;word-break:keep-all}
.small{font-weight:500;font-size:52px;margin-top:60px;opacity:.85}
.icon{position:absolute;right:90px;bottom:90px;font-size:200px}
.page{position:absolute;left:100px;bottom:100px;font-weight:500;font-size:40px;opacity:.6}
</style></head><body><div class="tag">${c.tag}</div><div class="big">${c.big}</div><div class="small">${c.small}</div><div class="icon">${c.icon}</div><div class="page">${i + 1} / ${cards.length}</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
for (const [i, c] of cards.entries()) {
  await page.setContent(html(c, i));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, `card${i + 1}.png`) });
}
await browser.close();
console.log("done ->", OUT);
