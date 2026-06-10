import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, DISPLAY, SANS } from '../theme';

/** Spring-based enter progress (0→1) starting at `delay` frames. */
export function useEnter(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.8 }, durationInFrames: 22 });
}

export const Logo: React.FC<{ size?: number; light?: boolean }> = ({ size = 64, light }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.28 }}>
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: COLORS.ember,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <svg viewBox="0 0 32 32" width={size * 0.6} height={size * 0.6}>
        <path d="M11 6v8a2 2 0 0 0 2 2v10a1 1 0 0 0 2 0V16a2 2 0 0 0 2-2V6" fill="none" stroke={COLORS.cream} strokeWidth={2} strokeLinecap="round" />
        <path d="M22 6c-1.9 0-3 2.2-3 5s1.1 5 3 5v10a1 1 0 0 0 2 0V6z" fill={COLORS.cream} />
      </svg>
    </div>
    <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: size * 0.74, color: light ? COLORS.cream : COLORS.ink, letterSpacing: -1 }}>
      Smart<span style={{ color: COLORS.ember }}>Dine</span>
    </span>
  </div>
);

export const Chip: React.FC<{ label: string; index: number; baseDelay: number; accent: string }> = ({
  label,
  index,
  baseDelay,
  accent,
}) => {
  const p = useEnter(baseDelay + index * 7);
  return (
    <div
      style={{
        transform: `translateY(${interpolate(p, [0, 1], [16, 0])}px) scale(${interpolate(p, [0, 1], [0.9, 1])})`,
        opacity: p,
        background: COLORS.white,
        border: `2px solid ${accent}33`,
        color: COLORS.inkSoft,
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: 26,
        padding: '12px 22px',
        borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 6px 20px rgba(28,23,20,0.08)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 12, height: 12, borderRadius: 99, background: accent }} />
      {label}
    </div>
  );
};

export const ChapterKicker: React.FC<{ label: string; accent: string }> = ({ label, accent }) => {
  const p = useEnter(2);
  return (
    <div
      style={{
        opacity: p,
        transform: `translateX(${interpolate(p, [0, 1], [-20, 0])}px)`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: 22,
        letterSpacing: 3,
        textTransform: 'uppercase',
        color: accent,
        marginBottom: 18,
      }}
    >
      <span style={{ width: 36, height: 4, borderRadius: 9, background: accent }} />
      {label}
    </div>
  );
};

export const Subtitle: React.FC<{ text: string; durationInFrames: number }> = ({ text, durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [3, 12, durationInFrames - 10, durationInFrames - 2], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 56,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity,
      }}
    >
      <div
        style={{
          maxWidth: 1300,
          textAlign: 'center',
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 30,
          lineHeight: 1.35,
          color: COLORS.inkSoft,
          background: 'rgba(255,255,255,0.66)',
          backdropFilter: 'blur(6px)',
          padding: '14px 30px',
          borderRadius: 18,
        }}
      >
        {text}
      </div>
    </div>
  );
};
