import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
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
import { duckedBgmVolume, fontFamily as JUA, FPS } from "./JejuFun";

// 카드뉴스·대본 → 세로 쇼츠 (webapp/ 이 inputProps 로 렌더링한다)
// 장면 길이 = max(3.5초, 나레이션 + 0.8초), 장면 사이는 0.4초 크로스페이드.

const PRETENDARD = "Pretendard";
for (const [weight, file] of [
  ["500", "Medium"],
  ["700", "Bold"],
  ["800", "ExtraBold"],
] as const) {
  loadFont({ family: PRETENDARD, url: staticFile(`fonts/Pretendard-${file}.woff2`), weight });
}

export type CardScene = {
  kind: "image" | "text";
  imageUrl?: string; // http(s) 주소 또는 public/ 안의 파일 이름
  headline?: string; // 글자 카드 큰 문구
  subline?: string; // 글자 카드 작은 문구
  narration?: string; // 자막 문장
  audioUrl?: string; // 나레이션 mp3
  audioDurationSec?: number;
};

export type Template = "edu" | "news" | "shop";

export type CardShortProps = {
  template: Template;
  title?: string; // 있으면 맨 앞에 제목 카드
  scenes: CardScene[];
  music: "upbeat" | "calm" | "none";
  subtitles: boolean;
  ctaMain?: string; // 있으면 맨 뒤에 마무리 카드
  ctaSub?: string;
};

const sec = (x: number) => Math.round(x * FPS);
const XFADE = sec(0.4);
const NARRATION_OFFSET = sec(0.3);
const MIN_SCENE = 3.5;
const CARD_SEC = 2.5;
const END_SEC = 3.2;

export const MUSIC_FILES = {
  upbeat: "audio/carefree-long.mp3", // Kevin MacLeod "Carefree" (CC BY 4.0)
  calm: "audio/calm-long.mp3", // Kevin MacLeod "Clean Soul" (CC BY 4.0)
} as const;

const asset = (src: string) => (/^(https?:|data:|blob:)/.test(src) ? src : staticFile(src));

// ---------- 템플릿 ----------

type Theme = {
  font: string;
  headWeight: number;
  bg: string;
  ink: string;
  accent: string;
  sub: string;
};

const THEMES: Record<Template, Theme> = {
  edu: { font: PRETENDARD, headWeight: 800, bg: "linear-gradient(160deg, #0f2a5a 0%, #1d4ed8 100%)", ink: "#ffffff", accent: "#60a5fa", sub: "#dbeafe" },
  news: { font: PRETENDARD, headWeight: 800, bg: "#f3f4f6", ink: "#111827", accent: "#d7263d", sub: "#4b5563" },
  shop: { font: JUA, headWeight: 400, bg: "linear-gradient(160deg, #ffd166 0%, #ff8fab 100%)", ink: "#ffffff", accent: "#ff6b35", sub: "#5a2a00" },
};

// ---------- 타임라인 ----------

type Segment =
  | { type: "title"; text: string; from: number; dur: number }
  | { type: "scene"; scene: CardScene; index: number; from: number; dur: number }
  | { type: "end"; main: string; sub: string; from: number; dur: number };

const sceneDur = (sc: CardScene) => {
  const base = sc.audioUrl && sc.audioDurationSec ? Math.max(MIN_SCENE, sc.audioDurationSec + 0.8) : MIN_SCENE;
  return Math.ceil(base * FPS);
};

export const cardShortTimeline = (props: CardShortProps) => {
  const raw: Omit<Segment, "from">[] = [];
  if (props.title?.trim()) raw.push({ type: "title", text: props.title.trim(), dur: sec(CARD_SEC) });
  props.scenes.forEach((scene, index) => raw.push({ type: "scene", scene, index, dur: sceneDur(scene) }));
  if (props.ctaMain?.trim() || props.ctaSub?.trim())
    raw.push({ type: "end", main: props.ctaMain?.trim() ?? "", sub: props.ctaSub?.trim() ?? "", dur: sec(END_SEC) });
  let at = 0;
  const segments = raw.map((seg, i) => {
    const from = i === 0 ? 0 : at - XFADE;
    at = from + seg.dur;
    return { ...seg, from } as Segment;
  });
  return { segments, total: Math.max(at, 1) };
};

export const calculateCardShortMetadata: CalculateMetadataFunction<CardShortProps> = ({ props }) => ({
  durationInFrames: cardShortTimeline(props).total,
});

// ---------- 장면 전환: 들어올 때 크로스페이드 + 살짝 올라오기 ----------

const Enter: React.FC<{ first: boolean; children: React.ReactNode }> = ({ first, children }) => {
  const frame = useCurrentFrame();
  const p = first ? 1 : interpolate(frame, [0, XFADE], [0, 1], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>{children}</AbsoluteFill>;
};

// ---------- 이미지 장면 ----------

const NewsTag: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 70,
      left: 56,
      background: THEMES.news.accent,
      color: "#fff",
      fontFamily: PRETENDARD,
      fontWeight: 800,
      fontSize: 36,
      letterSpacing: 4,
      padding: "8px 22px",
      borderRadius: 6,
    }}
  >
    NEWS
  </div>
);

const ImageScene: React.FC<{ src: string; dur: number; template: Template; index: number; subtitles: boolean }> = ({
  src,
  dur,
  template,
  index,
  subtitles,
}) => {
  const frame = useCurrentFrame();
  const zoomIn = index % 2 === 0;
  const scale = interpolate(frame, [0, dur], zoomIn ? [1, 1.06] : [1.06, 1]);
  const url = asset(src);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Img
        src={url}
        style={{
          position: "absolute",
          inset: -80,
          width: "calc(100% + 160px)",
          height: "calc(100% + 160px)",
          objectFit: "cover",
          filter: "blur(40px) brightness(0.5) saturate(1.2)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: template === "news" ? 170 : 120,
          bottom: subtitles ? 420 : 140,
          left: 40,
          right: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Img
          src={url}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            borderRadius: template === "shop" ? 36 : 14,
            boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
            transform: `scale(${scale})`,
          }}
        />
      </div>
      {template === "news" && <NewsTag />}
    </AbsoluteFill>
  );
};

// ---------- 글자 카드 (제목·장면·마무리 공용) ----------

const headSize = (text: string, big: boolean) => {
  const n = [...text].length;
  const base = n <= 6 ? 150 : n <= 10 ? 124 : n <= 16 ? 104 : n <= 24 ? 88 : 74;
  return big ? base : Math.round(base * 0.9);
};

const ShopDots: React.FC = () => {
  const frame = useCurrentFrame();
  const colors = ["#ffffff", "#ff6b35", "#06d6a0", "#118ab2"];
  return (
    <>
      {new Array(26).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: random(`x${i}`) * 1080,
            top: ((random(`y${i}`) * 1920 + frame * (2 + random(`v${i}`) * 3)) % 2000) - 40,
            width: 26 + random(`s${i}`) * 30,
            height: 26 + random(`s${i}`) * 30,
            borderRadius: "50%",
            background: colors[i % colors.length],
            opacity: 0.45,
          }}
        />
      ))}
    </>
  );
};

const TextCard: React.FC<{ template: Template; headline: string; subline?: string; variant: "title" | "scene" | "end" }> = ({
  template,
  headline,
  subline,
  variant,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = THEMES[template];
  const enter = spring({ frame: frame - 4, fps, config: { damping: 14, stiffness: 120 } });
  const subIn = interpolate(frame, [14, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const big = variant !== "scene";
  const size = headSize(headline, big);

  if (template === "news") {
    const reveal = interpolate(frame, [4, 20], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <AbsoluteFill style={{ background: t.bg }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 22, background: t.accent }} />
        <NewsTag />
        <div style={{ position: "absolute", top: 640, left: 70, right: 70 }}>
          <div
            style={{
              borderLeft: `18px solid ${t.accent}`,
              paddingLeft: 40,
              fontFamily: t.font,
              fontWeight: t.headWeight,
              fontSize: size,
              lineHeight: 1.22,
              color: t.ink,
              wordBreak: "keep-all",
              clipPath: reveal < 100 ? `inset(0 ${100 - reveal}% 0 0)` : undefined,
            }}
          >
            {headline}
          </div>
          {subline && (
            <div
              style={{
                marginTop: 48,
                paddingLeft: 58,
                fontFamily: t.font,
                fontWeight: 500,
                fontSize: 54,
                lineHeight: 1.4,
                color: t.sub,
                wordBreak: "keep-all",
                opacity: subIn,
              }}
            >
              {subline}
            </div>
          )}
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 12, background: "#111827" }} />
      </AbsoluteFill>
    );
  }

  if (template === "shop") {
    return (
      <AbsoluteFill style={{ background: t.bg, overflow: "hidden" }}>
        <ShopDots />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 70px" }}>
          <div
            style={{
              fontFamily: t.font,
              fontSize: size * 1.05,
              lineHeight: 1.18,
              color: t.ink,
              textAlign: "center",
              wordBreak: "keep-all",
              textShadow: `0 8px 0 ${t.accent}, 0 14px 30px rgba(0,0,0,0.18)`,
              transform: `scale(${enter}) rotate(${(1 - enter) * -8}deg)`,
            }}
          >
            {headline}
          </div>
          {subline && (
            <div
              style={{
                marginTop: 70,
                background: "#fff",
                color: t.sub,
                fontFamily: t.font,
                fontSize: 56,
                padding: "22px 50px",
                borderRadius: 999,
                textAlign: "center",
                wordBreak: "keep-all",
                boxShadow: "0 10px 0 rgba(0,0,0,0.12)",
                opacity: subIn,
                transform: `translateY(${(1 - subIn) * 30}px)`,
              }}
            >
              {subline}
            </div>
          )}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // edu
  const bar = interpolate(frame, [10, 28], [0, 220], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: t.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", background: "rgba(255,255,255,0.05)", top: -300, right: -360 }} />
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "rgba(255,255,255,0.05)", bottom: -200, left: -240 }} />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 90px" }}>
        <div
          style={{
            fontFamily: t.font,
            fontWeight: t.headWeight,
            fontSize: size,
            lineHeight: 1.25,
            color: t.ink,
            wordBreak: "keep-all",
            opacity: enter,
            transform: `translateY(${(1 - enter) * 60}px)`,
          }}
        >
          {headline}
        </div>
        <div style={{ width: bar, height: 14, borderRadius: 7, background: t.accent, marginTop: 46 }} />
        {subline && (
          <div
            style={{
              marginTop: 46,
              fontFamily: t.font,
              fontWeight: 500,
              fontSize: 56,
              lineHeight: 1.45,
              color: t.sub,
              wordBreak: "keep-all",
              opacity: subIn,
            }}
          >
            {subline}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- 자막 ----------

const TemplateSubtitle: React.FC<{ template: Template; text: string; dur: number }> = ({ template, text, dur }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 5, dur - 5, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const t = THEMES[template];
  if (template === "news") {
    return (
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, opacity, display: "flex", alignItems: "stretch", padding: "0 36px" }}>
        <div
          style={{
            background: t.accent,
            color: "#fff",
            fontFamily: PRETENDARD,
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: 3,
            padding: "0 22px",
            display: "flex",
            alignItems: "center",
          }}
        >
          NEWS
        </div>
        <div
          style={{
            flex: 1,
            background: "rgba(12,16,28,0.9)",
            color: "#fff",
            fontFamily: PRETENDARD,
            fontWeight: 700,
            fontSize: 46,
            lineHeight: 1.38,
            padding: "20px 28px",
            wordBreak: "keep-all",
            borderTop: `6px solid ${t.accent}`,
          }}
        >
          {text}
        </div>
      </div>
    );
  }
  const shop = template === "shop";
  return (
    <div style={{ position: "absolute", bottom: 140, left: 50, right: 50, display: "flex", justifyContent: "center", opacity }}>
      <div
        style={{
          background: shop ? "#fff" : "rgba(255,255,255,0.96)",
          color: shop ? t.sub : "#0f2a5a",
          fontFamily: shop ? JUA : PRETENDARD,
          fontWeight: shop ? 400 : 700,
          fontSize: shop ? 52 : 46,
          lineHeight: 1.4,
          padding: shop ? "18px 38px" : "20px 34px",
          borderRadius: shop ? 40 : 18,
          border: shop ? `6px solid ${t.accent}` : "none",
          borderLeft: shop ? `6px solid ${t.accent}` : `12px solid #1d4ed8`,
          textAlign: "center",
          wordBreak: "keep-all",
          boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ---------- 전체 ----------

export const CardShort: React.FC<CardShortProps> = (props) => {
  const { segments, total } = cardShortTimeline(props);
  const sceneSegs = segments.filter((s): s is Extract<Segment, { type: "scene" }> => s.type === "scene");
  const cues = sceneSegs
    .filter((s) => s.scene.audioUrl && s.scene.audioDurationSec)
    .map((s) => {
      const from = s.from + (s.from === 0 ? 0 : XFADE) + NARRATION_OFFSET;
      return { from, to: from + Math.ceil((s.scene.audioDurationSec ?? 0) * FPS), seg: s };
    });
  const music = props.music !== "none" ? MUSIC_FILES[props.music] : null;
  const fadeOut = interpolate(useCurrentFrame(), [total - 12, total], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {music && <Audio src={staticFile(music)} loop volume={duckedBgmVolume(cues, total)} />}
      {cues.map((c, i) => (
        <Sequence key={`a${i}`} from={c.from} durationInFrames={c.to - c.from + 10} layout="none">
          <Audio src={asset(c.seg.scene.audioUrl!)} />
        </Sequence>
      ))}

      <AbsoluteFill>
        {segments.map((seg, i) => (
          <Sequence key={i} from={seg.from} durationInFrames={seg.dur}>
            <Enter first={i === 0}>
              {seg.type === "title" && <TextCard template={props.template} headline={seg.text} variant="title" />}
              {seg.type === "end" && (
                <TextCard template={props.template} headline={seg.main || seg.sub} subline={seg.main ? seg.sub : undefined} variant="end" />
              )}
              {seg.type === "scene" &&
                (seg.scene.kind === "image" && seg.scene.imageUrl ? (
                  <ImageScene
                    src={seg.scene.imageUrl}
                    dur={seg.dur}
                    template={props.template}
                    index={seg.index}
                    subtitles={props.subtitles && !!seg.scene.narration}
                  />
                ) : (
                  <TextCard
                    template={props.template}
                    headline={seg.scene.headline || seg.scene.narration || ""}
                    subline={seg.scene.subline}
                    variant="scene"
                  />
                ))}
            </Enter>
          </Sequence>
        ))}

        {props.subtitles &&
          cues.map((c, i) =>
            c.seg.scene.narration ? (
              <Sequence key={`t${i}`} from={c.from} durationInFrames={c.to - c.from + 6}>
                <TemplateSubtitle template={props.template} text={c.seg.scene.narration} dur={c.to - c.from + 6} />
              </Sequence>
            ) : null,
          )}
      </AbsoluteFill>
      {/* 끝에서 검은 화면으로 사라지기 */}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fadeOut }} />
    </AbsoluteFill>
  );
};

// Remotion Studio 미리보기용 기본값 (제주 사진과 기존 여성 나레이션 재사용)
export const cardShortDefaults: CardShortProps = {
  template: "edu",
  title: "제주 여행 꿀팁 3가지",
  music: "upbeat",
  subtitles: true,
  ctaMain: "지금 떠나보세요",
  ctaSub: "Discover Jeju",
  scenes: [
    { kind: "image", imageUrl: "hero.jpg", narration: "여기는 제주입니다. 거대한 분화구가 귤이를 반겨주는데요.", audioUrl: "narration/hero.mp3", audioDurationSec: 3.47 },
    { kind: "text", headline: "바다는 무조건 GO", subline: "에메랄드빛 협재 해변", narration: "에메랄드빛 바다! 귤이, 서핑 실력도 수준급입니다.", audioUrl: "narration/beach.mp3", audioDurationSec: 3.81 },
    { kind: "image", imageUrl: "food.jpg", narration: "제주 흑돼지 앞에서, 배부름 게이지가 순식간에 최대치!", audioUrl: "narration/food.mp3", audioDurationSec: 3.76 },
  ],
};
