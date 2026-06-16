export type HowToKind = 'intro' | 'chapter' | 'step' | 'outro';

export interface HowToScene {
  id: string;
  kind: HowToKind;
  durationInSeconds: number;
  role?: string;
  roleIcon?: string;
  stepNumber?: number;
  stepTotal?: number;
  heading: string;
  subhead: string;
  narration: string;
  device?: 'phone' | 'browser';
  screenshot?: string | null;
  accent: string;
}
