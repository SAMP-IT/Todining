import React from 'react';
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from 'remotion';
import { COLORS } from '../theme';
import { FPS } from '../scenes';

/**
 * Full-duration warm background whose accent tint glides as scenes change.
 * `accentStops` is a frame→color map built from the scene timeline.
 */
export const Background: React.FC<{ accentFrames: number[]; accentColors: string[] }> = ({
  accentFrames,
  accentColors,
}) => {
  const frame = useCurrentFrame();
  const accent = interpolateColors(frame, accentFrames, accentColors);
  const drift = interpolate(frame % (FPS * 12), [0, FPS * 12], [0, 1]);

  return (
    <AbsoluteFill style={{ background: COLORS.cream }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(60rem 60rem at ${20 + drift * 12}% -8%, ${accent}22, transparent 60%),
                       radial-gradient(46rem 46rem at ${90 - drift * 10}% 108%, ${accent}1a, transparent 60%)`,
        }}
      />
      {/* fine grain via repeating dots */}
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(28,23,20,0.045) 1px, transparent 1px)',
          backgroundSize: '4px 4px',
          opacity: 0.5,
        }}
      />
    </AbsoluteFill>
  );
};
