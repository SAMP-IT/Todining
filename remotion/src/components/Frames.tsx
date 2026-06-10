import React from 'react';
import { Img, staticFile } from 'remotion';
import { COLORS } from '../theme';

/** A realistic phone frame containing a mobile screenshot. */
export const PhoneFrame: React.FC<{ src: string; height?: number; style?: React.CSSProperties }> = ({
  src,
  height = 780,
  style,
}) => {
  const width = height * (402 / 874); // match capture viewport aspect
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 46,
        background: '#0d0b0a',
        padding: 12,
        boxShadow: '0 40px 90px rgba(28,23,20,0.35), 0 0 0 2px rgba(255,255,255,0.06) inset',
        position: 'relative',
        ...style,
      }}
    >
      {/* notch */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 120,
          height: 26,
          borderRadius: 16,
          background: '#0d0b0a',
          zIndex: 2,
        }}
      />
      <div style={{ width: '100%', height: '100%', borderRadius: 34, overflow: 'hidden', background: COLORS.cream }}>
        <Img src={staticFile(`shots/${src}`)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
      </div>
    </div>
  );
};

/** A browser window frame containing a desktop screenshot. */
export const BrowserFrame: React.FC<{ src: string; width?: number; style?: React.CSSProperties }> = ({
  src,
  width = 1180,
  style,
}) => {
  const innerW = width - 0;
  const screenH = (innerW * (900 / 1440));
  return (
    <div
      style={{
        width,
        borderRadius: 20,
        overflow: 'hidden',
        background: COLORS.white,
        boxShadow: '0 40px 90px rgba(28,23,20,0.30), 0 0 0 1px rgba(28,23,20,0.06)',
        ...style,
      }}
    >
      <div style={{ height: 44, background: '#efe7db', display: 'flex', alignItems: 'center', paddingLeft: 18, gap: 9 }}>
        {[COLORS.ember, COLORS.gold, COLORS.sage].map((c) => (
          <div key={c} style={{ width: 13, height: 13, borderRadius: 99, background: c }} />
        ))}
        <div
          style={{
            marginLeft: 18,
            height: 24,
            flex: 1,
            maxWidth: 520,
            borderRadius: 99,
            background: COLORS.white,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 16,
            color: COLORS.inkMuted,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          smartdine.app
        </div>
      </div>
      <div style={{ width: innerW, height: screenH, overflow: 'hidden' }}>
        <Img src={staticFile(`shots/${src}`)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
      </div>
    </div>
  );
};
