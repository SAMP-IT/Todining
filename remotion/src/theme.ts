import { loadFont as loadFraunces } from '@remotion/google-fonts/Fraunces';
import { loadFont as loadJakarta } from '@remotion/google-fonts/PlusJakartaSans';

const fraunces = loadFraunces('normal', { weights: ['400', '600', '700'] });
const jakarta = loadJakarta('normal', { weights: ['400', '500', '600', '700', '800'] });

export const DISPLAY = fraunces.fontFamily;
export const SANS = jakarta.fontFamily;

export const COLORS = {
  ink: '#1c1714',
  inkSoft: '#4a4039',
  inkMuted: '#8a7d72',
  cream: '#f7f1e6',
  creamDeep: '#efe5d4',
  ember: '#d9521f',
  sage: '#7c9473',
  gold: '#c89b3c',
  white: '#ffffff',
};
