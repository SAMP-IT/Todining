import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  Bell, ChefHat, ClipboardList, ConciergeBell, Crown, ShieldCheck, Smartphone, Utensils,
} from 'lucide-react';
import { COLORS, DISPLAY, SANS } from '../theme';
import { Logo, Subtitle, useEnter } from '../components/Atoms';
import { PhoneFrame, BrowserFrame } from '../components/Frames';
import type { HowToScene } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICONS: Record<string, React.ComponentType<any>> = {
  Smartphone, Crown, ShieldCheck, ConciergeBell, ChefHat, Bell, ClipboardList, Utensils,
};

const RoleIcon: React.FC<{ name?: string; size: number; color: string }> = ({ name, size, color }) => {
  const Cmp = (name && ICONS[name]) || Utensils;
  return <Cmp size={size} color={color} strokeWidth={2} />;
};

const Heading: React.FC<{ children: React.ReactNode; size: number; delay?: number; color?: string }> = ({
  children,
  size,
  delay = 0,
  color = COLORS.ink,
}) => {
  const p = useEnter(delay);
  return (
    <h1 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: size, lineHeight: 1.03, letterSpacing: -1.5, color, margin: 0, opacity: p, transform: `translateY(${interpolate(p, [0, 1], [26, 0])}px)` }}>
      {children}
    </h1>
  );
};

const Sub: React.FC<{ children: React.ReactNode; delay?: number; max?: number }> = ({ children, delay = 6, max = 640 }) => {
  const p = useEnter(delay);
  return (
    <p style={{ fontFamily: SANS, fontWeight: 500, fontSize: 32, lineHeight: 1.35, color: COLORS.inkSoft, margin: '20px 0 0', maxWidth: max, opacity: p, transform: `translateY(${interpolate(p, [0, 1], [14, 0])}px)` }}>
      {children}
    </p>
  );
};

const Kicker: React.FC<{ label: string; accent: string }> = ({ label, accent }) => {
  const p = useEnter(2);
  return (
    <div style={{ opacity: p, transform: `translateX(${interpolate(p, [0, 1], [-18, 0])}px)`, display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: SANS, fontWeight: 800, fontSize: 22, letterSpacing: 3, textTransform: 'uppercase', color: accent, marginBottom: 18 }}>
      <span style={{ width: 36, height: 4, borderRadius: 9, background: accent }} />
      {label}
    </div>
  );
};

// Big step number "01" with accent.
const StepBadge: React.FC<{ n: number; accent: string }> = ({ n, accent }) => {
  const p = useEnter(0);
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, opacity: p, transform: `scale(${interpolate(p, [0, 1], [0.8, 1])})`, transformOrigin: 'left center' }}>
      <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 140, lineHeight: 0.8, color: accent }}>{String(n).padStart(2, '0')}</span>
    </div>
  );
};

const StepDots: React.FC<{ current: number; total: number; accent: string }> = ({ current, total, accent }) => (
  <div style={{ display: 'flex', gap: 10, marginTop: 36 }}>
    {Array.from({ length: total }).map((_, i) => (
      <span key={i} style={{ width: i + 1 === current ? 34 : 12, height: 12, borderRadius: 99, background: i + 1 === current ? accent : `${accent}33`, transition: 'none' }} />
    ))}
  </div>
);

// ── Intro ──────────────────────────────────────────────────────────────────
export const HowToIntro: React.FC<{ scene: HowToScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 120 }, durationInFrames: 28 });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ opacity: p, transform: `scale(${interpolate(p, [0, 1], [0.85, 1])})` }}>
        <Logo size={90} />
      </div>
      <div style={{ marginTop: 34 }}>
        <Heading size={104} delay={6}>{scene.heading}</Heading>
      </div>
      <Sub delay={14} max={1000}>{scene.subhead}</Sub>
    </AbsoluteFill>
  );
};

// ── Chapter card ─────────────────────────────────────────────────────────────
export const HowToChapter: React.FC<{ scene: HowToScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ring = spring({ frame, fps, config: { damping: 120 }, durationInFrames: 26 });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ position: 'relative', display: 'grid', placeItems: 'center', marginBottom: 28 }}>
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: 999, border: `2px solid ${scene.accent}44`, transform: `scale(${interpolate(ring, [0, 1], [0.5, 1.2])})`, opacity: interpolate(ring, [0, 0.7, 1], [0, 0.7, 0]) }} />
        <div style={{ width: 150, height: 150, borderRadius: 999, background: `${scene.accent}1a`, display: 'grid', placeItems: 'center', transform: `scale(${ring})` }}>
          <RoleIcon name={scene.roleIcon} size={72} color={scene.accent} />
        </div>
      </div>
      <Kicker label={`Chapter · ${scene.role ?? ''}`} accent={scene.accent} />
      <Heading size={96} delay={6}>{scene.heading}</Heading>
      <Sub delay={12} max={1000}>{scene.subhead}</Sub>
    </AbsoluteFill>
  );
};

// ── Step scene ───────────────────────────────────────────────────────────────
export const HowToStep: React.FC<{ scene: HowToScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slide = spring({ frame, fps, config: { damping: 200, mass: 1 }, durationInFrames: 26 });
  const isPhone = scene.device === 'phone';

  return (
    <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: isPhone ? '0 130px' : '0 110px' }}>
      <div style={{ width: isPhone ? 760 : 540, flexShrink: 0 }}>
        <Kicker label={`${scene.role ?? ''} · Step ${scene.stepNumber}/${scene.stepTotal}`} accent={scene.accent} />
        <StepBadge n={scene.stepNumber ?? 1} accent={scene.accent} />
        <div style={{ marginTop: 10 }}>
          <Heading size={isPhone ? 78 : 64} delay={4}>{scene.heading}</Heading>
        </div>
        <Sub delay={9} max={isPhone ? 700 : 520}>{scene.subhead}</Sub>
        {scene.stepTotal ? <StepDots current={scene.stepNumber ?? 1} total={scene.stepTotal} accent={scene.accent} /> : null}
      </div>
      <div
        style={{
          transform: isPhone
            ? `translateX(${interpolate(slide, [0, 1], [150, 0])}px) rotate(${interpolate(slide, [0, 1], [5, -3])}deg)`
            : `translateX(${interpolate(slide, [0, 1], [170, 0])}px) scale(${interpolate(slide, [0, 1], [0.94, 1])})`,
          opacity: slide,
        }}
      >
        {scene.screenshot && (isPhone ? <PhoneFrame src={scene.screenshot} height={840} /> : <BrowserFrame src={scene.screenshot} width={1120} />)}
      </div>
    </AbsoluteFill>
  );
};

// ── Outro ────────────────────────────────────────────────────────────────────
export const HowToOutro: React.FC<{ scene: HowToScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 120 }, durationInFrames: 26 });
  const ctaP = useEnter(20);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ opacity: p, transform: `scale(${interpolate(p, [0, 1], [0.85, 1])})` }}>
        <Logo size={104} />
      </div>
      <div style={{ marginTop: 32 }}>
        <Heading size={88} delay={8}>{scene.heading}</Heading>
      </div>
      <Sub delay={14} max={950}>{scene.subhead}</Sub>
      <div style={{ marginTop: 40, opacity: ctaP, transform: `translateY(${interpolate(ctaP, [0, 1], [16, 0])}px)` }}>
        <div style={{ background: scene.accent, color: COLORS.white, fontFamily: SANS, fontWeight: 800, fontSize: 30, padding: '18px 40px', borderRadius: 999, display: 'inline-block' }}>
          Scan · Order · Dine
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const HowToView: React.FC<{ scene: HowToScene }> = ({ scene }) => {
  switch (scene.kind) {
    case 'intro':
      return <HowToIntro scene={scene} />;
    case 'chapter':
      return <HowToChapter scene={scene} />;
    case 'step':
      return <HowToStep scene={scene} />;
    case 'outro':
      return <HowToOutro scene={scene} />;
    default:
      return null;
  }
};

export const HowToShell: React.FC<{ scene: HowToScene; durationInFrames: number }> = ({ scene, durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ opacity }}>
      <HowToView scene={scene} />
      {scene.kind !== 'intro' && <Subtitle text={scene.narration} durationInFrames={durationInFrames} />}
    </AbsoluteFill>
  );
};
