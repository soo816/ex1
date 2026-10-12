import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  random,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";
import { Gyuli } from "./Gyuli";

export const fontFamily = "Jua";
loadFont({ family: fontFamily, url: staticFile("Jua-Regular.ttf") });

export const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

const SCENES = {
  intro: { from: 0, dur: s(4) },
  hero: { from: s(4), dur: s(5) },
  beach: { from: s(9), dur: s(5) },
  food: { from: s(14), dur: s(5) },
  tangerine: { from: s(19), dur: s(4.5) },
  outro: { from: s(23.5), dur: s(4.5) },
};

export const TOTAL_FRAMES = SCENES.outro.from + SCENES.outro.dur;

const textStroke = "0 6px 0 rgba(0,0,0,0.25)";

// ---------- 공통 요소 ----------

const FadeInOut: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8, dur - 8, dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

const KenBurns: React.FC<{ src: string; dur: number; fromScale?: number; toScale?: number; panX?: number }> = ({
  src,
  dur,
  fromScale = 1.1,
  toScale = 1.3,
  panX = 0,
}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, dur], [fromScale, toScale]);
  const x = interpolate(frame, [0, dur], [0, panX]);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#000" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translateX(${x}px)`,
        }}
      />
      <AbsoluteFill
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 100%)" }}
      />
    </AbsoluteFill>
  );
};

const PopText: React.FC<{
  text: string;
  delay?: number;
  size?: number;
  color?: string;
  top: number;
}> = ({ text, delay = 0, size = 120, color = "#fff", top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        top,
        width: "100%",
        textAlign: "center",
        fontFamily,
        fontSize: size,
        color,
        textShadow: textStroke,
        lineHeight: 1.15,
        padding: "0 60px",
        boxSizing: "border-box",
      }}
    >
      {[...text].map((ch, i) => {
        const p = spring({ frame: frame - delay - i * 2, fps, config: { damping: 8, stiffness: 180 } });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `scale(${p}) translateY(${(1 - p) * 60}px)`,
              whiteSpace: "pre",
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

const SpeechBubble: React.FC<{ text: string; delay: number; x: number; y: number; size?: number }> = ({
  text,
  delay,
  x,
  y,
  size = 72,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 200 } });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `scale(${p})`,
        transformOrigin: "bottom left",
        background: "#fff",
        borderRadius: 50,
        padding: "28px 44px",
        fontFamily,
        fontSize: size,
        color: "#3a2210",
        boxShadow: "0 12px 0 rgba(0,0,0,0.18)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
      <div
        style={{
          position: "absolute",
          bottom: -34,
          left: 60,
          width: 0,
          height: 0,
          borderLeft: "24px solid transparent",
          borderRight: "24px solid transparent",
          borderTop: "40px solid #fff",
        }}
      />
    </div>
  );
};

// ---------- 장면 1: 인트로 ----------

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = spring({ frame: frame - 5, fps, config: { damping: 7, stiffness: 120 } });
  const y = interpolate(drop, [0, 1], [-900, 0]);
  // 착지할 때 찌그러지기
  const squash = 1 + Math.sin(Math.max(0, frame - 18) * 0.5) * Math.exp(-Math.max(0, frame - 18) * 0.12) * 0.15;
  const bgRot = frame * 0.6;

  return (
    <AbsoluteFill style={{ background: "#ff9f1c", overflow: "hidden" }}>
      {/* 회전하는 햇살 배경 */}
      <AbsoluteFill style={{ transform: `rotate(${bgRot}deg) scale(2.2)` }}>
        {new Array(16).fill(0).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 2000,
              height: 160,
              background: i % 2 === 0 ? "#ffbf47" : "transparent",
              transformOrigin: "0 50%",
              transform: `rotate(${(360 / 16) * i}deg)`,
              clipPath: "polygon(0 50%, 100% 0, 100% 100%)",
            }}
          />
        ))}
      </AbsoluteFill>
      <PopText text="귤이의" top={250} size={130} delay={20} />
      <PopText text="제주 대모험!" top={410} size={170} color="#fffbe6" delay={28} />
      <div
        style={{
          position: "absolute",
          left: 540 - 260,
          top: 900,
          transform: `translateY(${y}px) scale(${1 / squash}, ${squash})`,
          transformOrigin: "bottom center",
        }}
      >
        <Gyuli size={520} waveAngle={Math.sin(frame * 0.4) * 25} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 180,
          width: "100%",
          textAlign: "center",
          fontFamily,
          fontSize: 56,
          color: "#7a3d00",
          opacity: interpolate(frame, [60, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        🍊 Discover Jeju 🍊
      </div>
    </AbsoluteFill>
  );
};

// ---------- 장면 2: 제주 도착 ----------

const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const peek = spring({ frame: frame - 15, fps, config: { damping: 12 } });
  const y = interpolate(peek, [0, 1], [500, 0]);
  return (
    <FadeInOut dur={SCENES.hero.dur}>
      <KenBurns src="hero.jpg" dur={SCENES.hero.dur} panX={-40} />
      <PopText text="STEP 1. 제주 도착" top={180} size={100} delay={5} />
      <div style={{ position: "absolute", left: 140, bottom: 150, transform: `translateY(${y}px) rotate(${Math.sin(frame * 0.15) * 6}deg)` }}>
        <Gyuli size={480} expression={frame > 60 ? "wow" : "happy"} />
      </div>
      <SpeechBubble text="여기가... 제주?! 😮" delay={45} x={380} y={960} />
    </FadeInOut>
  );
};

// ---------- 장면 3: 바다 ----------

const Beach: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slide = spring({ frame: frame - 10, fps, config: { damping: 14 } });
  const x = interpolate(slide, [0, 1], [-700, 0]);
  const wave = Math.sin(frame * 0.25) * 40;
  const tilt = Math.sin(frame * 0.25 + 1) * 10;
  return (
    <FadeInOut dur={SCENES.beach.dur}>
      <KenBurns src="beach.jpg" dur={SCENES.beach.dur} fromScale={1.2} toScale={1.05} />
      <PopText text="STEP 2. 바다는" top={180} size={100} delay={5} />
      <PopText text="무조건 GO 🌊" top={320} size={150} color="#bff4ff" delay={20} />
      <div
        style={{
          position: "absolute",
          left: 220,
          top: 980,
          transform: `translateX(${x}px) translateY(${wave}px) rotate(${tilt}deg)`,
        }}
      >
        <Gyuli size={460} sunglasses waveAngle={Math.sin(frame * 0.5) * 30} />
        {/* 서핑보드 */}
        <div
          style={{
            position: "absolute",
            left: -60,
            top: 420,
            width: 600,
            height: 70,
            borderRadius: 999,
            background: "linear-gradient(90deg, #ff4d6d, #ffd166, #06d6a0)",
            boxShadow: "0 10px 0 rgba(0,0,0,0.25)",
          }}
        />
      </div>
      {/* 물보라 */}
      {new Array(10).fill(0).map((_, i) => {
        const t = (frame + i * 9) % 40;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 200 + random(`sp${i}`) * 650,
              top: 1500 - t * 8,
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "#fff",
              opacity: 1 - t / 40,
            }}
          />
        );
      })}
    </FadeInOut>
  );
};

// ---------- 장면 4: 먹방 ----------

const Food: React.FC = () => {
  const frame = useCurrentFrame();
  const fill = interpolate(frame, [20, 100], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const maxed = fill >= 100;
  const shake = maxed ? Math.sin(frame * 2.5) * 14 : 0;
  const chomp = Math.abs(Math.sin(frame * 0.6));
  return (
    <FadeInOut dur={SCENES.food.dur}>
      <KenBurns src="food.jpg" dur={SCENES.food.dur} />
      <PopText text="STEP 3. 먹방 타임 🍜" top={180} size={100} delay={5} />
      {/* 먹방 게이지 */}
      <div style={{ position: "absolute", top: 400, left: 120, width: 840, transform: `translateX(${shake}px)` }}>
        <div style={{ fontFamily, fontSize: 60, color: "#fff", textShadow: textStroke, marginBottom: 16 }}>
          배부름 게이지 {Math.round(fill)}%
        </div>
        <div style={{ height: 70, background: "rgba(255,255,255,0.35)", borderRadius: 999, overflow: "hidden", border: "6px solid #fff" }}>
          <div
            style={{
              width: `${fill}%`,
              height: "100%",
              background: maxed ? "#ff2d6f" : "linear-gradient(90deg, #ffd166, #ff9f1c)",
            }}
          />
        </div>
      </div>
      {maxed && (
        <div
          style={{
            position: "absolute",
            top: 600,
            width: "100%",
            textAlign: "center",
            fontFamily,
            fontSize: 200,
            color: "#ff2d6f",
            WebkitTextStroke: "8px #fff",
            transform: `rotate(-8deg) scale(${1 + Math.sin(frame * 0.8) * 0.06})`,
          }}
        >
          MAX!!
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 290,
          top: 1050,
          transform: `scale(${1 + chomp * 0.06}, ${1 - chomp * 0.06}) translateX(${shake}px)`,
        }}
      >
        <Gyuli size={500} expression="love" />
      </div>
      {/* 떠다니는 하트 */}
      {new Array(8).fill(0).map((_, i) => {
        const t = (frame + i * 12) % 60;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 260 + random(`h${i}`) * 560,
              top: 1250 - t * 10,
              fontSize: 70,
              opacity: 1 - t / 60,
            }}
          >
            ❤️
          </div>
        );
      })}
    </FadeInOut>
  );
};

// ---------- 장면 5: 감귤밭 ----------

const Tangerine: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const zoom = spring({ frame: frame - 50, fps, config: { damping: 9 } });
  return (
    <FadeInOut dur={SCENES.tangerine.dur}>
      <KenBurns src="tangerine.jpg" dur={SCENES.tangerine.dur} panX={30} />
      {/* 감귤 비 */}
      {new Array(18).fill(0).map((_, i) => {
        const startDelay = random(`d${i}`) * 40;
        const y = interpolate(frame - startDelay, [0, 60], [-200, 2100], { extrapolateLeft: "clamp" });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: random(`x${i}`) * 1000,
              top: y,
              fontSize: 90 + random(`s${i}`) * 60,
              transform: `rotate(${frame * (4 + i)}deg)`,
            }}
          >
            🍊
          </div>
        );
      })}
      <PopText text="STEP 4. 감귤밭 방문" top={180} size={100} delay={5} />
      <div
        style={{
          position: "absolute",
          left: 290,
          top: 1000,
          transform: `scale(${1 + zoom * 0.25})`,
        }}
      >
        <Gyuli size={500} expression={frame > 50 ? "shock" : "happy"} />
      </div>
      <SpeechBubble text="어... 우리 친척들?! 😳" delay={55} x={160} y={820} size={68} />
    </FadeInOut>
  );
};

// ---------- 장면 6: 아웃트로 ----------

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bounce = Math.abs(Math.sin(frame * 0.2)) * -60;
  const enter = spring({ frame, fps, config: { damping: 10 } });
  const colors = ["#ff4d6d", "#ffd166", "#06d6a0", "#118ab2", "#fff"];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #ffb347 0%, #ff7f11 100%)", opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" }) }}>
      {/* 컨페티 */}
      {new Array(60).fill(0).map((_, i) => {
        const y = (random(`cy${i}`) * 2000 + frame * (8 + random(`cv${i}`) * 10)) % 2100 - 100;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: random(`cx${i}`) * 1080,
              top: y,
              width: 22,
              height: 36,
              background: colors[i % colors.length],
              transform: `rotate(${frame * (5 + i % 7) + i * 30}deg)`,
              borderRadius: 4,
            }}
          />
        );
      })}
      <PopText text="제주에서" top={300} size={150} delay={5} />
      <PopText text="만나요! 🍊" top={480} size={170} color="#fffbe6" delay={15} />
      <div style={{ position: "absolute", left: 270, top: 900, transform: `translateY(${bounce}px) scale(${enter})` }}>
        <Gyuli size={540} waveAngle={Math.sin(frame * 0.5) * 35} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 200,
          width: "100%",
          textAlign: "center",
          fontFamily,
          fontSize: 64,
          color: "#fff",
          textShadow: textStroke,
          opacity: interpolate(frame, [30, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        Discover Jeju · 외국인 여행 도우미
      </div>
    </AbsoluteFill>
  );
};

// ---------- 사운드 ----------

const Sfx: React.FC<{ at: number; src: string; volume?: number }> = ({ at, src, volume = 0.8 }) => (
  <Sequence from={at} durationInFrames={s(2)} layout="none">
    <Audio src={staticFile(`audio/${src}.wav`)} volume={volume} />
  </Sequence>
);

// 배경음악: Kevin MacLeod "Carefree" (CC BY 4.0, README.md 참고). 파일은 -14 LUFS로 맞춰 두었다.
const BGM_FILE = "audio/bgm.mp3";
const BGM_VOLUME = 0.6;
const BGM_DUCKED = 0.22; // 나레이션이 나오는 동안 배경음악을 줄인다

type NarrationLine = {
  id: string;
  scene: string;
  offset: number;
  text: string;
  file: string;
  duration: number;
};

// scripts/narrate.py 가 만든 나레이션 목록 (src/narration-manifest*.json, 비어 있으면 나레이션 없이 렌더링)
export type NarrationManifest = { voice: string | null; lines: NarrationLine[] };

type Cue = NarrationLine & { from: number; to: number };

const toCues = (manifest: NarrationManifest): Cue[] =>
  manifest.lines.map((line) => {
    const from = SCENES[line.scene as keyof typeof SCENES].from + s(line.offset);
    return { ...line, from, to: from + Math.ceil(line.duration * FPS) };
  });

// 배경음악 음량: 앞뒤 페이드 + 나레이션 구간 덕킹 (CardShort 도 같이 쓴다)
export const duckedBgmVolume =
  (cues: { from: number; to: number }[], total: number) =>
  (f: number) => {
    const fade = interpolate(f, [0, 10, total - 20, total], [0, 1, 1, 0], {
      extrapolateRight: "clamp",
    });
    // 나레이션 앞뒤로 0.2초에 걸쳐 부드럽게 줄였다가 다시 키운다
    const duck = cues.reduce((v, n) => {
      const d = interpolate(f, [n.from - 6, n.from, n.to, n.to + 8], [0, 1, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return Math.max(v, d);
    }, 0);
    return fade * (BGM_VOLUME - (BGM_VOLUME - BGM_DUCKED) * duck);
  };

const bgmVolume = (cues: Cue[]) => duckedBgmVolume(cues, TOTAL_FRAMES);

const Narration: React.FC<{ cues: Cue[] }> = ({ cues }) => (
  <>
    {cues.map((n) => (
      <Sequence key={n.id} from={n.from} durationInFrames={n.to - n.from + 10} layout="none">
        <Audio src={staticFile(n.file)} />
      </Sequence>
    ))}
  </>
);

const Subtitle: React.FC<{ text: string; dur: number }> = ({ text, dur }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 5, dur - 5, dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        bottom: 70,
        left: 60,
        right: 60,
        display: "flex",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          fontFamily,
          fontSize: 50,
          lineHeight: 1.35,
          padding: "16px 34px",
          borderRadius: 24,
          textAlign: "center",
          wordBreak: "keep-all",
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Subtitles: React.FC<{ cues: Cue[] }> = ({ cues }) => (
  <>
    {cues.map((n) => (
      <Sequence key={n.id} from={n.from} durationInFrames={n.to - n.from + 6}>
        <Subtitle text={n.text} dur={n.to - n.from + 6} />
      </Sequence>
    ))}
  </>
);

const Soundtrack: React.FC<{ cues: Cue[] }> = ({ cues }) => {
  const { hero, beach, food, tangerine } = SCENES;
  return (
    <>
      <Audio src={staticFile(BGM_FILE)} volume={bgmVolume(cues)} />
      <Narration cues={cues} />
      {/* 인트로 제목 팝 */}
      <Sfx at={20} src="pop" volume={0.3} />
      <Sfx at={28} src="pop" volume={0.3} />
      {/* 장면마다 STEP 제목 팝 */}
      {[hero, beach, food, tangerine].map((sc, i) => (
        <Sfx key={i} at={sc.from + 5} src="pop" volume={0.3} />
      ))}
      <Sfx at={hero.from + 45} src="pop" volume={0.3} />
      <Sfx at={beach.from + 8} src="whoosh" volume={0.6} />
      <Sfx at={tangerine.from + 55} src="pop" volume={0.3} />
    </>
  );
};

// ---------- 전체 ----------

// narration: 여성 리포터(JejuFun) / 남성 가이드(JejuFunBoy) 등 나레이션 버전을 고른다 (Root.tsx)
export const JejuFun: React.FC<{ narration: NarrationManifest }> = ({ narration }) => {
  const cues = toCues(narration);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Soundtrack cues={cues} />
      <Sequence from={SCENES.intro.from} durationInFrames={SCENES.intro.dur}>
        <Intro />
      </Sequence>
      <Sequence from={SCENES.hero.from} durationInFrames={SCENES.hero.dur}>
        <Hero />
      </Sequence>
      <Sequence from={SCENES.beach.from} durationInFrames={SCENES.beach.dur}>
        <Beach />
      </Sequence>
      <Sequence from={SCENES.food.from} durationInFrames={SCENES.food.dur}>
        <Food />
      </Sequence>
      <Sequence from={SCENES.tangerine.from} durationInFrames={SCENES.tangerine.dur}>
        <Tangerine />
      </Sequence>
      <Sequence from={SCENES.outro.from} durationInFrames={SCENES.outro.dur}>
        <Outro />
      </Sequence>
      <Subtitles cues={cues} />
    </AbsoluteFill>
  );
};
