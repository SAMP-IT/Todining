import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { FPS, SCENES, totalDurationInFrames } from './scenes';
import { Background } from './components/Background';
import { SceneShell } from './components/SceneViews';
import { ProgressBar, Watermark, SceneCounter } from './components/Chrome';
import { COLORS } from './theme';

// Precompute scene frame offsets/durations once.
const TIMELINE = (() => {
  let acc = 0;
  return SCENES.map((s) => {
    const from = acc;
    const dur = Math.round(s.durationInSeconds * FPS);
    acc += dur;
    return { scene: s, from, dur };
  });
})();

const ACCENT_FRAMES = [...TIMELINE.map((t) => t.from), totalDurationInFrames];
const ACCENT_COLORS = [...TIMELINE.map((t) => t.scene.accent), TIMELINE[TIMELINE.length - 1].scene.accent];

export const Explainer: React.FC = () => {
  const frame = useCurrentFrame();
  const current = TIMELINE.find((t) => frame >= t.from && frame < t.from + t.dur) ?? TIMELINE[TIMELINE.length - 1];
  const idx = TIMELINE.indexOf(current);

  return (
    <AbsoluteFill style={{ background: COLORS.cream }}>
      <Background accentFrames={ACCENT_FRAMES} accentColors={ACCENT_COLORS} />

      {TIMELINE.map(({ scene, from, dur }) => (
        <Sequence key={scene.id} from={from} durationInFrames={dur} name={scene.id}>
          <SceneShell scene={scene} durationInFrames={dur} showSubtitle={scene.kind !== 'intro'} />
        </Sequence>
      ))}

      <Watermark />
      <SceneCounter index={idx + 1} total={TIMELINE.length} />
      <ProgressBar progress={frame / totalDurationInFrames} accent={current.scene.accent} />
    </AbsoluteFill>
  );
};
