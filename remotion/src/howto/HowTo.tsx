import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { HOWTO_FPS, HOWTO_SCENES, totalHowToFrames } from './scenes';
import { HowToShell } from './HowToViews';
import { Background } from '../components/Background';
import { ProgressBar, Watermark, SceneCounter } from '../components/Chrome';
import { COLORS } from '../theme';

const TIMELINE = (() => {
  let acc = 0;
  return HOWTO_SCENES.map((s) => {
    const from = acc;
    const dur = Math.round(s.durationInSeconds * HOWTO_FPS);
    acc += dur;
    return { scene: s, from, dur };
  });
})();

const ACCENT_FRAMES = [...TIMELINE.map((t) => t.from), totalHowToFrames];
const ACCENT_COLORS = [...TIMELINE.map((t) => t.scene.accent), TIMELINE[TIMELINE.length - 1].scene.accent];

export const HowTo: React.FC = () => {
  const frame = useCurrentFrame();
  const current = TIMELINE.find((t) => frame >= t.from && frame < t.from + t.dur) ?? TIMELINE[TIMELINE.length - 1];
  const idx = TIMELINE.indexOf(current);

  return (
    <AbsoluteFill style={{ background: COLORS.cream }}>
      <Background accentFrames={ACCENT_FRAMES} accentColors={ACCENT_COLORS} />

      {TIMELINE.map(({ scene, from, dur }) => (
        <Sequence key={scene.id} from={from} durationInFrames={dur} name={scene.id}>
          <HowToShell scene={scene} durationInFrames={dur} />
        </Sequence>
      ))}

      <Watermark />
      <SceneCounter index={idx + 1} total={TIMELINE.length} />
      <ProgressBar progress={frame / totalHowToFrames} accent={current.scene.accent} />
    </AbsoluteFill>
  );
};
