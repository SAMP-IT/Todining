import React from 'react';
import { Composition } from 'remotion';
import { Explainer } from './Explainer';
import { FPS, HEIGHT, WIDTH, totalDurationInFrames } from './scenes';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="SmartDineExplainer"
      component={Explainer}
      durationInFrames={totalDurationInFrames}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
