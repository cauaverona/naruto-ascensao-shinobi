import { px } from './gfx';

export type EffectKind = 'impact' | 'smoke' | 'log' | 'chakra' | 'guard' | 'fizzle' | 'slash' | 'fire';
export interface CombatEffect {
  kind: EffectKind;
  side: number;
  age: number;
  duration: number;
  offset: number;
  accent?: string;
}

export function drawCombatEffect(g: CanvasRenderingContext2D, effect: CombatEffect, x: number, feet: number, scale: number, reduced: boolean) {
  const { kind, side, duration, age } = effect;
  const t = Math.min(1, age / duration);
  const facing = side === 0 ? 1 : -1;
  const ramp = 1 - Math.pow(1 - t, 2);
  const pixel = (dx: number, dy: number, w: number, h: number, color: string) =>
    px(g, x + dx * scale, feet + dy * scale, w * scale, h * scale, color);

  g.save();
  g.globalAlpha = (reduced ? 0.65 : 1) * Math.min(1, (1 - t) * 2.4);
  if (kind === 'log') {
    const lift = Math.sin(t * Math.PI) * (reduced ? 2 : 8);
    pixel(-8, -12 - lift, 16, 9, '#563a2d');
    pixel(-7, -11 - lift, 13, 6, '#9e613d');
    pixel(3, -12 - lift, 6, 9, '#dab37e');
    pixel(4, -10 - lift, 3, 5, '#906244');
    pixel(-5, -10 - lift, 8, 1, '#e1a770');
  } else if (kind === 'fire') {
    const lead = (1 - t) * 9 * facing;
    for (let i = 0; i < 14; i++) {
      const a = i * 2.399;
      const r = (4 + t * 10) * (0.4 + (i % 5) * 0.16);
      const dx = lead + Math.cos(a) * r;
      const dy = -28 + Math.sin(a) * r * 0.65;
      pixel(dx, dy, i % 3 + 3, i % 3 + 3, ['#824138', '#d76039', '#f59150', '#f6ce78'][i % 4]);
    }
  } else if (kind === 'guard' || kind === 'slash') {
    for (let i = 0; i < 10; i++) {
      const a = -1.18 + i * 0.26;
      const radius = kind === 'slash' ? 13 + ramp * 7 : 13;
      const dx = (4 + Math.cos(a) * radius) * facing;
      const color = i % 3 ? effect.accent ?? '#f3d89d' : '#fff3cb';
      pixel(dx, -24 + Math.sin(a) * 14, kind === 'guard' ? 3 : 2, 2, color);
      if (kind === 'guard' && i % 2 === 0) pixel(dx - 3 * facing, -24 + Math.sin(a) * 14, 2, 1, '#a9d4c7');
    }
  } else {
    const count = kind === 'smoke' ? 12 : 9;
    const smoke = kind === 'smoke';
    const colors = smoke ? ['#788a92', '#b6c7c7', '#ecddc5'] :
      kind === 'impact' ? ['#fff1bd', '#f6b166', '#ca654d'] :
      kind === 'fizzle' ? ['#988c85', '#d0b39e', '#f1cfad'] : ['#355c7b', '#6fb1be', '#bee7d8'];
    for (let i = 0; i < count; i++) {
      const a = i * 2.399 + (kind === 'chakra' ? t : 0);
      const radius = (smoke ? 4 : 7) + (reduced ? 5 : 16) * ramp * (0.5 + (i % 4) * 0.15);
      const dx = Math.cos(a) * radius;
      const dy = (smoke ? -16 : -26) + Math.sin(a) * radius * 0.74 - (smoke ? t * 6 : 0);
      const size = smoke ? 3 + (i % 4) : 1 + (i % 3);
      pixel(dx - size / 2, dy, size, size, colors[i % colors.length]);
      if (smoke && size > 4) pixel(dx - size / 2 + 1, dy - 1, size - 2, 1, colors[2]);
    }
  }
  g.restore();
}

