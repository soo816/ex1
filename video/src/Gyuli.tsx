import { useCurrentFrame } from "remotion";

export type Expression = "happy" | "wow" | "love" | "shock";

type Props = {
  size?: number;
  expression?: Expression;
  sunglasses?: boolean;
  waveAngle?: number;
};

// 귤이: 제주 감귤 캐릭터 (SVG)
export const Gyuli: React.FC<Props> = ({
  size = 400,
  expression = "happy",
  sunglasses = false,
  waveAngle = 0,
}) => {
  const frame = useCurrentFrame();
  const blinking = frame % 75 > 70 && expression === "happy";

  const eyes = () => {
    if (sunglasses) {
      return (
        <g>
          <rect x="48" y="88" width="44" height="28" rx="10" fill="#111" />
          <rect x="108" y="88" width="44" height="28" rx="10" fill="#111" />
          <rect x="90" y="96" width="20" height="5" fill="#111" />
          <rect x="56" y="93" width="12" height="5" rx="2" fill="#fff" opacity="0.7" />
          <rect x="116" y="93" width="12" height="5" rx="2" fill="#fff" opacity="0.7" />
        </g>
      );
    }
    if (expression === "love") {
      const heart = (cx: number) => (
        <path
          d={`M ${cx} 112 C ${cx - 22} 98, ${cx - 14} 82, ${cx} 94 C ${cx + 14} 82, ${cx + 22} 98, ${cx} 112 Z`}
          fill="#ff2d6f"
        />
      );
      return (
        <g>
          {heart(72)}
          {heart(128)}
        </g>
      );
    }
    if (expression === "shock") {
      return (
        <g>
          <circle cx="72" cy="100" r="16" fill="#fff" stroke="#3a2210" strokeWidth="4" />
          <circle cx="128" cy="100" r="16" fill="#fff" stroke="#3a2210" strokeWidth="4" />
          <circle cx="72" cy="100" r="5" fill="#3a2210" />
          <circle cx="128" cy="100" r="5" fill="#3a2210" />
        </g>
      );
    }
    if (blinking) {
      return (
        <g stroke="#3a2210" strokeWidth="6" strokeLinecap="round">
          <line x1="62" y1="100" x2="82" y2="100" />
          <line x1="118" y1="100" x2="138" y2="100" />
        </g>
      );
    }
    return (
      <g>
        <ellipse cx="72" cy="100" rx="10" ry="13" fill="#3a2210" />
        <ellipse cx="128" cy="100" rx="10" ry="13" fill="#3a2210" />
        <circle cx="75" cy="95" r="4" fill="#fff" />
        <circle cx="131" cy="95" r="4" fill="#fff" />
      </g>
    );
  };

  const mouth = () => {
    if (expression === "wow" || expression === "shock") {
      return <ellipse cx="100" cy="140" rx="12" ry="16" fill="#7a1f12" />;
    }
    if (expression === "love") {
      return (
        <g>
          <path d="M 78 130 Q 100 160 122 130 Z" fill="#7a1f12" />
          <path d="M 108 140 Q 114 160 120 140" fill="#ff7aa2" />
        </g>
      );
    }
    return (
      <path
        d="M 80 132 Q 100 152 120 132"
        stroke="#3a2210"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
    );
  };

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="peel" cx="35%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#ffc24a" />
          <stop offset="60%" stopColor="#ff9a1f" />
          <stop offset="100%" stopColor="#f07800" />
        </radialGradient>
      </defs>
      {/* 왼팔 */}
      <path d="M 28 120 Q 8 130 6 150" stroke="#f07800" strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* 흔드는 오른팔 */}
      <g transform={`rotate(${waveAngle} 170 115)`}>
        <path d="M 172 115 Q 196 100 198 76" stroke="#f07800" strokeWidth="10" fill="none" strokeLinecap="round" />
        <circle cx="198" cy="72" r="9" fill="#ffb13b" />
      </g>
      {/* 몸통 */}
      <circle cx="100" cy="110" r="78" fill="url(#peel)" />
      {/* 껍질 점 */}
      {[
        [60, 60], [140, 70], [150, 150], [50, 155], [100, 175], [40, 110], [165, 112],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="#e06d00" opacity="0.5" />
      ))}
      {/* 하이라이트 */}
      <ellipse cx="68" cy="62" rx="18" ry="10" fill="#fff" opacity="0.35" transform="rotate(-30 68 62)" />
      {/* 꼭지 + 잎 */}
      <rect x="96" y="26" width="8" height="12" rx="3" fill="#5b3a1a" />
      <path d="M 104 32 Q 130 6 156 22 Q 132 44 104 32 Z" fill="#3fae49" />
      <path d="M 106 31 Q 130 22 150 23" stroke="#2b7d33" strokeWidth="2" fill="none" />
      {/* 볼터치 */}
      <ellipse cx="50" cy="128" rx="13" ry="8" fill="#ff6b6b" opacity="0.55" />
      <ellipse cx="150" cy="128" rx="13" ry="8" fill="#ff6b6b" opacity="0.55" />
      {eyes()}
      {mouth()}
    </svg>
  );
};
