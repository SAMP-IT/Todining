import React from 'react';
import { Composition } from 'remotion';
import { Explainer } from './Explainer';
import { FPS, HEIGHT, WIDTH, totalDurationInFrames } from './scenes';
import { HowTo } from './howto/HowTo';
import { totalHowToFrames } from './howto/scenes';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SmartDineExplainer"
        component={Explainer}
        durationInFrames={totalDurationInFrames}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="SmartDineHowTo"
        component={HowTo}
        durationInFrames={totalHowToFrames}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
