import { Composition } from "remotion";
import { JejuFun, NarrationManifest, TOTAL_FRAMES } from "./JejuFun";
import { calculateCardShortMetadata, CardShort, cardShortDefaults } from "./CardShort";
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
      {/* 웹앱(webapp/): 카드뉴스·대본 → 세로 쇼츠. 길이는 장면에 따라 정해진다 */}
      <Composition
        id="CardShort"
        component={CardShort}
        calculateMetadata={calculateCardShortMetadata}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={cardShortDefaults}
      />
    </>
  );
};
