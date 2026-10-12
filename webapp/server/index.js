// 카드뉴스·대본 → 세로 쇼츠 웹앱 서버
// - Remotion 프로젝트(video/)를 시작할 때 한 번 번들링하고, 작업마다 CardShort 를 inputProps 로 렌더링한다.
// - 나레이션은 작업마다 Python(server/tts.py → video/scripts/narrate.py)으로 만든다.
// - 작업은 메모리 큐에서 한 번에 하나씩 처리하고, 24시간 지난 파일은 지운다.
import express from "express";
import multer from "multer";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(HERE, "..");
const VIDEO_DIR = path.resolve(APP_DIR, "..", "video");
const JOBS_DIR = process.env.JOBS_DIR || path.join(APP_DIR, "jobs");
const PORT = Number(process.env.PORT || 3000);
const PYTHON = process.env.PYTHON || "python3";
const JOB_TTL_MS = 24 * 60 * 60 * 1000;

const LIMITS = {
  scenes: 15,
  imageBytes: 10 * 1024 * 1024,
  narration: 120, // 화면 안내는 80자, 서버는 120자까지 허용
  headline: 40,
  subline: 60,
  title: 40,
  ctaMain: 40,
  ctaSub: 60,
};

const TEMPLATES = ["edu", "news", "shop"];
const VOICES = ["female_reporter", "male"];
const MUSIC = ["upbeat", "calm", "none"];

const ATTRIBUTION = {
  upbeat:
    '"Carefree" Kevin MacLeod (incompetech.com)\nLicensed under Creative Commons: By Attribution 4.0 License\nhttp://creativecommons.org/licenses/by/4.0/',
  calm:
    '"Clean Soul" Kevin MacLeod (incompetech.com)\nLicensed under Creative Commons: By Attribution 4.0 License\nhttp://creativecommons.org/licenses/by/4.0/',
};

// ---------- Chromium ----------

const findBrowser = () => {
  if (process.env.REMOTION_BROWSER_EXECUTABLE) return process.env.REMOTION_BROWSER_EXECUTABLE;
  const base = "/opt/pw-browsers";
  if (!fs.existsSync(base)) return undefined; // 없으면 Remotion 이 알아서 내려받는다
  const dir = fs.readdirSync(base).find((d) => d.startsWith("chromium_headless_shell"));
  const exe = dir && path.join(base, dir, "chrome-linux", "headless_shell");
  return exe && fs.existsSync(exe) ? exe : undefined;
};
const browserExecutable = findBrowser();

// ---------- 작업 ----------

/** @type {Map<string, any>} */
const jobs = new Map();
const queue = [];
let working = false;
let serveUrl = null;

const publicJob = (job) => ({
  id: job.id,
  status: job.status, // queued | tts | render | done | error
  progress: job.progress,
  message: job.message,
  queuePosition: job.status === "queued" ? queue.indexOf(job.id) + 1 : 0,
  videoUrl: job.status === "done" ? `/jobs/${job.id}/output.mp4` : null,
  posterUrl: job.status === "done" && job.poster ? `/jobs/${job.id}/poster.jpg` : null,
  durationSec: job.durationSec ?? null,
  attribution: job.status === "done" ? ATTRIBUTION[job.input.music] ?? null : null,
});

const runPython = (payload) =>
  new Promise((resolve, reject) => {
    const p = spawn(PYTHON, [path.join(HERE, "tts.py")], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("error", reject);
    p.on("close", (code) => {
      if (code !== 0) return reject(new Error(`tts.py 종료 코드 ${code}: ${err.slice(-2000)}`));
      try {
        resolve(JSON.parse(out));
      } catch (e) {
        reject(new Error(`tts.py 출력 해석 실패: ${out.slice(0, 500)}`));
      }
    });
    p.stdin.end(JSON.stringify(payload));
  });

const processJob = async (job) => {
  const base = `http://127.0.0.1:${PORT}/jobs/${job.id}`;
  const { input } = job;

  job.status = "tts";
  job.message = "음성 만드는 중";
  const lines = input.scenes
    .map((sc, i) => ({ id: `n${i}`, text: sc.narration }))
    .filter((l) => l.text);
  const durations = {};
  if (lines.length) {
    const res = await runPython({ voice: input.voice, outDir: job.dir, lines });
    for (const l of res.lines) durations[l.id] = l;
  }

  job.status = "render";
  job.message = "영상 만드는 중";
  job.progress = 0;
  const inputProps = {
    template: input.template,
    title: input.title,
    music: input.music,
    subtitles: input.subtitles,
    ctaMain: input.ctaMain,
    ctaSub: input.ctaSub,
    scenes: input.scenes.map((sc, i) => {
      const audio = durations[`n${i}`];
      return {
        kind: sc.kind,
        imageUrl: sc.imageFile ? `${base}/${sc.imageFile}` : undefined,
        headline: sc.headline,
        subline: sc.subline,
        narration: sc.narration,
        audioUrl: audio ? `${base}/${audio.file}` : undefined,
        audioDurationSec: audio?.duration,
      };
    }),
  };
  fs.writeFileSync(path.join(job.dir, "props.json"), JSON.stringify(inputProps, null, 2));
  const composition = await selectComposition({ serveUrl, id: "CardShort", inputProps, browserExecutable });
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf: 27,
    audioBitrate: "128k",
    outputLocation: path.join(job.dir, "output.mp4"),
    inputProps,
    browserExecutable,
    onProgress: ({ progress }) => {
      job.progress = Math.round(progress * 100);
    },
  });
  job.durationSec = Math.round((composition.durationInFrames / composition.fps) * 10) / 10;
  // 미리보기 표지 (영상 1초 지점)
  job.poster = await ffmpeg(["-v", "error", "-y", "-ss", "1", "-i", path.join(job.dir, "output.mp4"), "-frames:v", "1", "-vf", "scale=540:-2", "-q:v", "4", path.join(job.dir, "poster.jpg")])
    .then(() => true)
    .catch(() => false);
  job.status = "done";
  job.progress = 100;
  job.message = "완료";
};

const work = async () => {
  if (working || !serveUrl) return;
  working = true;
  while (queue.length) {
    const job = jobs.get(queue.shift());
    if (!job) continue;
    try {
      await processJob(job);
    } catch (e) {
      console.error(`[job ${job.id}]`, e);
      const stage = job.status;
      job.status = "error";
      job.message =
        stage === "tts"
          ? "음성을 만드는 중 문제가 생겼어요. 나레이션 문장을 확인하고 다시 시도해 주세요."
          : "영상을 만드는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.";
    }
  }
  working = false;
};

// ---------- 입력 검사 ----------

class InputError extends Error {}

const str = (v, max, label) => {
  const s = typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
  if ([...s].length > max) throw new InputError(`${label}은(는) ${max}자 이내로 적어 주세요. (지금 ${[...s].length}자)`);
  return s;
};

const validate = (data, files) => {
  if (!data || typeof data !== "object") throw new InputError("입력 내용을 읽지 못했어요. 다시 시도해 주세요.");
  const template = TEMPLATES.includes(data.template) ? data.template : "edu";
  const voice = VOICES.includes(data.voice) ? data.voice : "female_reporter";
  const music = MUSIC.includes(data.music) ? data.music : "upbeat";
  const scenes = Array.isArray(data.scenes) ? data.scenes : [];
  if (!scenes.length) throw new InputError("장면이 하나도 없어요. 카드 이미지를 올리거나 대본을 붙여 넣어 주세요.");
  if (scenes.length > LIMITS.scenes) throw new InputError(`장면은 ${LIMITS.scenes}개까지 만들 수 있어요. (지금 ${scenes.length}개)`);
  const out = scenes.map((sc, i) => {
    const n = i + 1;
    const kind = sc.kind === "text" ? "text" : "image";
    const narration = str(sc.narration, LIMITS.narration, `${n}번 장면 나레이션`);
    const headline = str(sc.headline, LIMITS.headline, `${n}번 장면 화면 문구`);
    const subline = str(sc.subline, LIMITS.subline, `${n}번 장면 작은 문구`);
    let imageIndex;
    if (kind === "image") {
      imageIndex = Number(sc.image);
      if (!Number.isInteger(imageIndex) || !files[imageIndex]) throw new InputError(`${n}번 장면에 사진이 없어요. 사진을 고르거나 '글자 카드'로 바꿔 주세요.`);
    } else if (!headline && !narration) {
      throw new InputError(`${n}번 글자 카드에 '화면 문구'를 적어 주세요.`);
    }
    return { kind, imageIndex, narration, headline, subline };
  });
  return {
    template,
    voice,
    music,
    subtitles: data.subtitles !== false,
    title: str(data.title, LIMITS.title, "영상 제목"),
    ctaMain: str(data.ctaMain, LIMITS.ctaMain, "마무리 큰 문구"),
    ctaSub: str(data.ctaSub, LIMITS.ctaSub, "마무리 작은 문구"),
    scenes: out,
  };
};

const ffmpeg = (args) =>
  new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", args);
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(err))));
  });

// 사진을 1600px 이하 JPEG 로 정리 (회전 정보 반영, 렌더링 속도·용량 절약)
const normalizeImage = (src, dest) =>
  ffmpeg([
    "-v", "error", "-y", "-i", src,
    "-vf", "scale='min(1600,iw)':'min(1600,ih)':force_original_aspect_ratio=decrease",
    "-frames:v", "1", "-q:v", "3", dest,
  ]);

// ---------- HTTP ----------

fs.mkdirSync(JOBS_DIR, { recursive: true });
const upload = multer({
  dest: path.join(JOBS_DIR, "_uploads"),
  limits: { fileSize: LIMITS.imageBytes, files: 40 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new InputError(`'${file.originalname}'은(는) 쓸 수 없는 파일 형식이에요. JPG·PNG·WEBP 사진만 올려 주세요.`));
  },
});

const app = express();
app.use(express.static(path.join(APP_DIR, "public")));
app.use("/fonts", express.static(path.join(VIDEO_DIR, "public", "fonts")));
app.use("/jobs", express.static(JOBS_DIR, { index: false }));

app.get("/api/health", (_req, res) => res.json({ ok: true, ready: !!serveUrl, queue: queue.length }));

app.post("/api/jobs", (req, res) => {
  upload.array("images", 40)(req, res, async (err) => {
    const files = req.files ?? [];
    const cleanup = () => files.forEach((f) => fs.rm(f.path, { force: true }, () => {}));
    try {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") throw new InputError("사진 한 장은 10MB 이하로 올려 주세요.");
        if (err instanceof InputError) throw err;
        throw new InputError("파일을 받는 중 문제가 생겼어요. 다시 시도해 주세요.");
      }
      if (!serveUrl) throw new InputError("서버가 아직 준비 중이에요. 1분 뒤에 다시 시도해 주세요.");
      let data;
      try {
        data = JSON.parse(req.body?.data ?? "");
      } catch {
        throw new InputError("입력 내용을 읽지 못했어요. 다시 시도해 주세요.");
      }
      const input = validate(data, files);
      // TODO(2단계): 대본 자동 작성(Claude API) — 여기서 input.scenes 의 빈 나레이션을 제안하는 기능을 붙일 수 있다.

      const id = randomUUID().slice(0, 12);
      const dir = path.join(JOBS_DIR, id);
      fs.mkdirSync(dir, { recursive: true });
      for (const sc of input.scenes) {
        if (sc.kind !== "image") continue;
        sc.imageFile = `img${sc.imageIndex}.jpg`;
        const dest = path.join(dir, sc.imageFile);
        if (!fs.existsSync(dest)) {
          try {
            await normalizeImage(files[sc.imageIndex].path, dest);
          } catch {
            throw new InputError(`'${files[sc.imageIndex].originalname}' 사진을 읽지 못했어요. 다른 사진으로 바꿔 주세요.`);
          }
        }
      }
      const job = { id, dir, input, status: "queued", progress: 0, message: "순서를 기다리는 중", createdAt: Date.now() };
      jobs.set(id, job);
      queue.push(id);
      work();
      res.status(201).json(publicJob(job));
    } catch (e) {
      if (e instanceof InputError) res.status(400).json({ error: e.message });
      else {
        console.error(e);
        res.status(500).json({ error: "서버에서 문제가 생겼어요. 잠시 후 다시 시도해 주세요." });
      }
    } finally {
      cleanup();
    }
  });
});

app.get("/api/jobs/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "작업을 찾을 수 없어요. 24시간이 지나 지워졌을 수 있어요." });
  res.json(publicJob(job));
});

// 24시간 지난 작업 정리
const sweep = () => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS && job.status !== "render" && job.status !== "tts") {
      jobs.delete(id);
      fs.rm(job.dir, { recursive: true, force: true }, () => {});
    }
  }
  for (const name of fs.readdirSync(JOBS_DIR)) {
    const p = path.join(JOBS_DIR, name);
    if (name === "_uploads" || jobs.has(name)) continue;
    try {
      if (now - fs.statSync(p).mtimeMs > JOB_TTL_MS) fs.rm(p, { recursive: true, force: true }, () => {});
    } catch {}
  }
};
setInterval(sweep, 60 * 60 * 1000).unref();
sweep();

app.listen(PORT, () => {
  console.log(`카드쇼츠 웹앱: http://localhost:${PORT}`);
  console.log(`Chromium: ${browserExecutable ?? "(Remotion 기본값)"}`);
});

console.log("Remotion 프로젝트 번들링 중…");
bundle({
  entryPoint: path.join(VIDEO_DIR, "src", "index.ts"),
  publicDir: path.join(VIDEO_DIR, "public"),
})
  .then((url) => {
    serveUrl = url;
    console.log("번들링 완료 — 이제 영상을 만들 수 있어요.");
    work();
  })
  .catch((e) => {
    console.error("번들링 실패:", e);
    process.exit(1);
  });
