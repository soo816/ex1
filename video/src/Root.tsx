import { Composition } from "remotion";
import { JejuFun, NarrationManifest, TOTAL_FRAMES } from "./JejuFun";
import femaleNarration from "./narration-manifest.json";
import maleNarration from "./narration-manifest-male.json";

const common = {
  component: JejuFun,
  durationInFrames: TOTAL_FRAMES,
  fps: 30,
  width: 1080,
  height: 1920,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 여성 리포터 나레이션 (narration/script.json) */}
      <Composition
        id="JejuFun"
        {...common}
        defaultProps={{ narration: femaleNarration as NarrationManifest }}
      />
      {/* 남성 가이드 나레이션 (narration/script-male.json) */}
      <Composition
        id="JejuFunBoy"
        {...common}
        defaultProps={{ narration: maleNarration as NarrationManifest }}
      />
    </>
  );
};
