import { Composition } from "remotion";
import { JejuFun, TOTAL_FRAMES } from "./JejuFun";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="JejuFun"
      component={JejuFun}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
