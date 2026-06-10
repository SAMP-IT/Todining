import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, DISPLAY, SANS } from '../theme';
import type { Scene } from '../scenes';
import { Chip, ChapterKicker, Logo, Subtitle, useEnter } from './Atoms';
import { PhoneFrame, BrowserFrame } from './Frames';

const Heading: React.FC<{ children: React.ReactNode; size: number; delay?: number; color?: string }> = ({
  children,
  size,
  delay = 0,
  color = COLORS.ink,
}) => {
  const p = useEnter(delay);
  return (
    <h1
      style={{
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: -1.5,
        color,
        margin: 0,
        transform: `translateY(${interpolate(p, [0, 1], [28, 0])}px)`,
        opacity: p,
      }}
    >
      {children}
    </h1>
  );
};

const Subhead: React.FC<{ children: React.ReactNode; delay?: number; max?: number }> = ({ children, delay = 6, max = 640 }) => {
  const p = useEnter(delay);
  return (
    <p
      style={{
        fontFamily: SANS,
        fontWeight: 500,
        fontSize: 32,
        lineHeight: 1.35,
        color: COLORS.inkSoft,
        margin: '20px 0 0',
        maxWidth: max,
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [16, 0])}px)`,
      }}
    >
      {children}
    </p>
  );
};

const ChipRow: React.FC<{ items: string[]; accent: string; delay: number; column?: boolean }> = ({ items, accent, delay, column }) => (
  <div style={{ display: 'flex', flexDirection: column ? 'column' : 'row', flexWrap: 'wrap', gap: 14, marginTop: 34, alignItems: 'flex-start' }}>
    {items.map((c, i) => (
      <Chip key={c} label={c} index={i} baseDelay={delay} accent={accent} />
    ))}
  </div>
);

// ── Intro ──────────────────────────────────────────────────────────────────
export const IntroScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoP = spring({ frame, fps, config: { damping: 120, mass: 1.1 }, durationInFrames: 30 });
  const ring = interpolate(frame, [0, 40], [0, 1], { extrapolateRight: 'clamp' });
  const tagP = useEnter(18);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          position: 'absolute',
          width: 520,
          height: 520,
          borderRadius: 999,
          border: `2px solid ${scene.accent}55`,
          transform: `scale(${interpolate(ring, [0, 1], [0.4, 1.25])})`,
          opacity: interpolate(ring, [0, 0.6, 1], [0, 0.6, 0]),
        }}
      />
      <div style={{ transform: `scale(${interpolate(logoP, [0, 1], [0.7, 1])})`, opacity: logoP }}>
        <Logo size={150} />
      </div>
      <div style={{ marginTop: 30, opacity: tagP, transform: `translateY(${interpolate(tagP, [0, 1], [18, 0])}px)` }}>
        <p style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 52, color: COLORS.ink, margin: 0 }}>{scene.subhead}</p>
      </div>
      <div style={{ marginTop: 8, opacity: tagP }}>
        <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: 24, letterSpacing: 4, textTransform: 'uppercase', color: scene.accent }}>
          {scene.captions[0]}
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ── Statement ────────────────────────────────────────────────────────────────
export const StatementScene: React.FC<{ scene: Scene }> = ({ scene }) => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: '0 160px', textAlign: 'center' }}>
    {scene.chapter && <ChapterKicker label={scene.chapter} accent={scene.accent} />}
    <Heading size={104}>{scene.heading}</Heading>
    <Subhead max={1100}>{scene.subhead}</Subhead>
    <div style={{ display: 'flex', gap: 14, marginTop: 40 }}>
      {scene.captions.map((c, i) => (
        <Chip key={c} label={c} index={i} baseDelay={12} accent={scene.accent} />
      ))}
    </div>
  </AbsoluteFill>
);

// ── Phone ────────────────────────────────────────────────────────────────────
export const PhoneScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slide = spring({ frame, fps, config: { damping: 200, mass: 1 }, durationInFrames: 28 });
  return (
    <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 130px' }}>
      <div style={{ maxWidth: 820 }}>
        {scene.chapter && <ChapterKicker label={scene.chapter} accent={scene.accent} />}
        <Heading size={94}>{scene.heading}</Heading>
        <Subhead max={720}>{scene.subhead}</Subhead>
        <ChipRow items={scene.captions} accent={scene.accent} delay={14} />
      </div>
      <div
        style={{
          transform: `translateX(${interpolate(slide, [0, 1], [160, 0])}px) rotate(${interpolate(slide, [0, 1], [6, -3])}deg)`,
          opacity: slide,
        }}
      >
        {scene.screenshot && <PhoneFrame src={scene.screenshot} height={840} />}
      </div>
    </AbsoluteFill>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const DashboardScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slide = spring({ frame, fps, config: { damping: 200, mass: 1 }, durationInFrames: 28 });
  return (
    <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 110px' }}>
      <div style={{ width: 520, flexShrink: 0 }}>
        {scene.chapter && <ChapterKicker label={scene.chapter} accent={scene.accent} />}
        <Heading size={74}>{scene.heading}</Heading>
        <Subhead max={500}>{scene.subhead}</Subhead>
        <ChipRow items={scene.captions} accent={scene.accent} delay={14} column />
      </div>
      <div
        style={{
          transform: `translateX(${interpolate(slide, [0, 1], [180, 0])}px) scale(${interpolate(slide, [0, 1], [0.94, 1])})`,
          opacity: slide,
        }}
      >
        {scene.screenshot && <BrowserFrame src={scene.screenshot} width={1120} />}
      </div>
    </AbsoluteFill>
  );
};

// ── Outro ────────────────────────────────────────────────────────────────────
export const OutroScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoP = spring({ frame, fps, config: { damping: 120 }, durationInFrames: 26 });
  const ctaP = useEnter(24);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ opacity: logoP, transform: `scale(${interpolate(logoP, [0, 1], [0.85, 1])})` }}>
        <Logo size={110} />
      </div>
      <div style={{ marginTop: 36 }}>
        <Heading size={92} delay={8}>{scene.heading}</Heading>
      </div>
      <Subhead delay={14} max={900}>{scene.subhead}</Subhead>
      <div
        style={{
          marginTop: 44,
          opacity: ctaP,
          transform: `translateY(${interpolate(ctaP, [0, 1], [16, 0])}px)`,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <div style={{ background: scene.accent, color: COLORS.white, fontFamily: SANS, fontWeight: 800, fontSize: 30, padding: '18px 38px', borderRadius: 999 }}>
          {scene.captions[0]}
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 28, color: COLORS.inkMuted }}>{scene.captions[1]}</div>
      </div>
    </AbsoluteFill>
  );
};

export const SceneView: React.FC<{ scene: Scene }> = ({ scene }) => {
  switch (scene.kind) {
    case 'intro':
      return <IntroScene scene={scene} />;
    case 'statement':
      return <StatementScene scene={scene} />;
    case 'phone':
      return <PhoneScene scene={scene} />;
    case 'dashboard':
    case 'grid':
      return <DashboardScene scene={scene} />;
    case 'outro':
      return <OutroScene scene={scene} />;
    default:
      return null;
  }
};

/** Wraps a scene with a soft fade-in/out and the narration subtitle. */
export const SceneShell: React.FC<{ scene: Scene; durationInFrames: number; showSubtitle?: boolean }> = ({
  scene,
  durationInFrames,
  showSubtitle = true,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ opacity }}>
      <SceneView scene={scene} />
      {showSubtitle && <Subtitle text={scene.narration} durationInFrames={durationInFrames} />}
    </AbsoluteFill>
  );
};
