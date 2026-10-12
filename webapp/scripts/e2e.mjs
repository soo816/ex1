// HTTP API 로 샘플 영상 3개를 끝까지 만들어 본다 (서버가 먼저 떠 있어야 함: npm start)
// 사용법: node scripts/e2e.mjs [edu|news|shop ...]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || "http://localhost:3000";
const SAMPLES = path.join(HERE, "..", "samples");
const JEJU = path.join(HERE, "..", "..", "video", "public");
const card = (n) => path.join(SAMPLES, "cards", `card${n}.png`);

const JOBS = {
  // 강의·교육: 카드 4장 + 대본 5문단 (마지막 문단은 글자 카드)
  edu: {
    files: [card(1), card(2), card(3), card(4)],
    data: {
      template: "edu",
      voice: "female_reporter",
      music: "upbeat",
      subtitles: true,
      title: "시니어 스마트폰 교실",
      ctaMain: "지금 신청하세요",
      ctaSub: "☎ 02-000-0000",
      scenes: [
        { kind: "image", image: 0, narration: "스마트폰, 아직 어렵게 느껴지시나요? 시니어 스마트폰 활용 교실에서 함께 배워요." },
        { kind: "image", image: 1, narration: "메신저로 사진 보내기, 영상통화, 버스 도착 알림까지 하나씩 천천히 알려드립니다." },
        { kind: "image", image: 2, narration: "수업은 매주 화요일과 목요일 오전 열 시, 한 반 열두 명으로 진행됩니다." },
        { kind: "image", image: 3, narration: "신청은 전화 한 통이면 끝! 지금 바로 문의해 주세요." },
        { kind: "text", headline: "처음이어도 괜찮아요", subline: "여러분을 기다리고 있을게요", narration: "처음이어도 괜찮아요. 여러분을 기다리고 있을게요." },
      ],
    },
  },
  // 정보·뉴스: 글자 카드만
  news: {
    files: [],
    data: {
      template: "news",
      voice: "female_reporter",
      music: "calm",
      subtitles: true,
      title: "이번 주 동네 소식",
      scenes: [
        { kind: "text", headline: "도서관 야간 개방 시작", subline: "평일 밤 9시까지", narration: "구립 도서관이 이번 달부터 평일 밤 아홉 시까지 문을 엽니다." },
        { kind: "text", headline: "무료 디지털 교육", subline: "매주 토요일 오전", narration: "토요일 오전에는 누구나 들을 수 있는 무료 디지털 교육도 열립니다." },
        { kind: "text", headline: "자세한 내용은 홈페이지에서", narration: "자세한 내용은 도서관 홈페이지에서 확인하세요." },
      ],
    },
  },
  // 가게·상품: 사진 2장 + 글자 카드, 남성 목소리
  shop: {
    files: [path.join(JEJU, "tangerine.jpg"), path.join(JEJU, "food.jpg")],
    data: {
      template: "shop",
      voice: "male",
      music: "upbeat",
      subtitles: true,
      title: "귤빛 카페 신메뉴",
      ctaMain: "귤빛 카페에서 만나요",
      ctaSub: "매일 오전 11시 ~ 밤 9시",
      scenes: [
        { kind: "image", image: 0, narration: "제주 감귤밭에서 바로 딴 귤로 만들었어요!" },
        { kind: "image", image: 1, narration: "든든한 브런치랑 같이 먹으면 더 맛있어요." },
        { kind: "text", headline: "감귤 에이드 출시!", subline: "이번 주 10% 할인", narration: "이번 주에는 감귤 에이드를 십 퍼센트 할인해 드려요!" },
      ],
    },
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const run = async (name) => {
  const { files, data } = JOBS[name];
  const form = new FormData();
  form.append("data", JSON.stringify(data));
  for (const f of files) form.append("images", new Blob([fs.readFileSync(f)], { type: f.endsWith(".png") ? "image/png" : "image/jpeg" }), path.basename(f));
  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/jobs`, { method: "POST", body: form });
  const job = await res.json();
  if (!res.ok) throw new Error(`${name}: ${res.status} ${job.error}`);
  let last = "";
  for (;;) {
    await sleep(1000);
    const s = await (await fetch(`${BASE}/api/jobs/${job.id}`)).json();
    const line = `${s.status} ${s.progress}%`;
    if (line !== last && (s.status !== "render" || s.progress % 20 === 0)) console.log(`[${name}] ${s.message} (${line})`);
    last = line;
    if (s.status === "error") throw new Error(`${name}: ${s.message}`);
    if (s.status === "done") {
      const mp4 = Buffer.from(await (await fetch(`${BASE}${s.videoUrl}`)).arrayBuffer());
      fs.writeFileSync(path.join(SAMPLES, `${name}.mp4`), mp4);
      console.log(`[${name}] 완료: ${s.durationSec}초, ${(mp4.length / 1e6).toFixed(1)}MB, ${((Date.now() - t0) / 1000).toFixed(0)}초 걸림, job ${job.id}`);
      if (s.attribution) console.log(`[${name}] 음악 표기: ${s.attribution.split("\n")[0]}`);
      return;
    }
  }
};

for (const name of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(JOBS)) await run(name);
