import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLORS, SANS } from '../theme';
import { Logo } from './Atoms';

/** Thin progress bar across the top tracking whole-video position. */
export const ProgressBar: React.FC<{ progress: number; accent: string }> = ({ progress, accent }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'rgba(28,23,20,0.06)' }}>
    <div style={{ height: '100%', width: `${progress * 100}%`, background: accent, transition: 'none' }} />
  </div>
);

/** Persistent small brand watermark, lower-left. */
export const Watermark: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 0.85], { extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', left: 48, top: 40, opacity, display: 'flex', alignItems: 'center', gap: 14 }}>
      <Logo size={40} />
    </div>
  );
};

/** Scene counter chip, lower-right. */
export const SceneCounter: React.FC<{ index: number; total: number }> = ({ index, total }) => (
  <div
    style={{
      position: 'absolute',
      right: 48,
      top: 48,
      fontFamily: SANS,
      fontWeight: 700,
      fontSize: 22,
      color: COLORS.inkMuted,
      letterSpacing: 1,
    }}
  >
    {String(index).padStart(2, '0')} <span style={{ opacity: 0.5 }}>/ {String(total).padStart(2, '0')}</span>
  </div>
);
