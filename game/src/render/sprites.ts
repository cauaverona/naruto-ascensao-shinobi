// Sprites dos personagens: células nativas de 40 × 46 por pose, âncora no pé em (20,44).
// Linhas: 0 frente, 1 lado (direita; esquerda é espelhada), 2 costas. Quatro quadros de caminhada.
// O protagonista e os personagens originais com `look` são recoloridos a partir da folha base.
import type { Look, SpriteRole } from '../data/characters';
import { offscreen, loadImage } from './gfx';

const files = import.meta.glob('../assets/*-{walk,face,idle}.png', { eager: true, import: 'default' }) as Record<string, string>;
const ROLES: SpriteRole[] = ['player', 'iruka', 'emi', 'gen', 'naruto', 'sasuke', 'sakura'];
const art = Object.fromEntries(ROLES.map((r) => [r, {
  walk: loadImage(files[`../assets/${r}-walk.png`]),
  face: loadImage(files[`../assets/${r}-face.png`]),
  idle: loadImage(files[`../assets/${r}-idle.png`]),
}])) as Record<SpriteRole, { walk: HTMLImageElement; face: HTMLImageElement; idle: HTMLImageElement }>;

export const spritesReady = Promise.all(Object.values(art).flatMap((a) => [a.walk, a.face, a.idle]).map((i) => i.decode().catch(() => undefined)));

export const CELL_W = 40, CELL_H = 46, SOLE = 44;
export type Dir = 'up' | 'down' | 'left' | 'right';

export const clothes: Record<string, string[]> = { 'Índigo': ['#252b48', '#455b88', '#879bc0'], Folha: ['#283b35', '#577757', '#a5b780'], Terracota: ['#553637', '#ad624b', '#dda075'], Ameixa: ['#403046', '#885b82', '#bf95a8'] };
export const skinSet: Record<string, string[]> = { Clara: ['#9b6757', '#e8aa80', '#ffdbb1'], Dourada: ['#855140', '#cf9066', '#fac095'], Morena: ['#6e453d', '#ad7956', '#dda477'], Escura: ['#422e31', '#85593f', '#b88360'] };
export const hairSet: Record<string, string[]> = { Preto: ['#181c30', '#33394e', '#5a667c'], Castanho: ['#30202b', '#694635', '#a07852'], Loiro: ['#75532c', '#c99847', '#f1cb7b'], Ruivo: ['#522932', '#994739', '#d57b57'], Prateado: ['#45495b', '#8793a1', '#ced3ce'] };
export const CUTS = ['Curto', 'Franja', 'Preso'];

export interface Actor { role: SpriteRole; look?: Look; bandana?: boolean }

const palettes = new Map<string[], number[][]>();
const frameCache = new Map<string, HTMLCanvasElement>();
spritesReady.then(() => frameCache.clear());

function rgb(hex: string) { return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); }
function shade(r: number, g: number, b: number, set: string[], range: [number, number]) {
  let colors = palettes.get(set);
  if (!colors) { colors = set.map(rgb); palettes.set(set, colors); }
  const lum = r * 0.24 + g * 0.54 + b * 0.22, t = Math.max(0, Math.min(2, ((lum - range[0]) * 2) / (range[1] - range[0])));
  const a = Math.min(1, Math.floor(t)), f = t - a;
  return colors[a].map((v, i) => Math.round(v + (colors![a + 1][i] - v) * f));
}

function customize(canvas: HTMLCanvasElement, p: Look, dir: Dir, frame: number) {
  const g = canvas.getContext('2d', { willReadFrequently: true })!, im = g.getImageData(0, 0, CELL_W, CELL_H), d = im.data;
  let top = SOLE, left = 40, right = 0;
  for (let y = 0; y < SOLE; y++) for (let x = 0; x < CELL_W; x++) if (d[(y * CELL_W + x) * 4 + 3] > 0) top = Math.min(top, y);
  const height = SOLE - top, headEnd = top + Math.round(height * 0.38);
  for (let y = top; y < SOLE; y++) for (let x = 0; x < CELL_W; x++) {
    const k = (y * CELL_W + x) * 4;
    if (!d[k + 3]) continue;
    const r = d[k], gg = d[k + 1], b = d[k + 2];
    let color: number[] | null = null;
    const blue = b > r * 0.97 && b >= gg * 0.98, face = y <= headEnd, rim = y < top + height * 0.22;
    if (blue && y < top + height * 0.31) { left = Math.min(left, x); right = Math.max(right, x); }
    if (blue && (rim || (face && y < headEnd - 1)) && p.hair !== 'Preto') color = shade(r, gg, b, hairSet[p.hair] ?? hairSet.Preto, [14, 106]);
    else if (dir !== 'up' && face && r > gg * 1.09 && gg > b * 1.05 && p.skin !== 'Dourada') color = shade(r, gg, b, skinSet[p.skin] ?? skinSet.Dourada, [68, 218]);
    else if (!face && y < top + height * 0.72 && p.coat !== 'Índigo' && blue) color = shade(r, gg, b, clothes[p.coat] ?? clothes['Índigo'], [17, 140]);
    else if (!face && p.skin !== 'Dourada' && r > gg * 1.13 && gg > b * 1.07 && r - b < 98 && y > top + height * 0.59) color = shade(r, gg, b, skinSet[p.skin] ?? skinSet.Dourada, [60, 211]);
    if (color) { d[k] = color[0]; d[k + 1] = color[1]; d[k + 2] = color[2]; }
  }
  g.putImageData(im, 0, 0);
  const [dark, mid, light] = hairSet[p.hair] ?? hairSet.Preto;
  if (right > left) {
    const side = dir === 'right', sway = frame === 0 ? 1 : 0;
    const x = side ? left - 3 : left - 1, y = top + 5;
    if (p.cut === 'Preso') {
      const layer = offscreen(CELL_W, CELL_H), l = layer.getContext('2d')!;
      l.fillStyle = dark; l.fillRect(x, y + 1, 5, 6); l.fillRect(x - 1, y + 6, 4, 6); l.fillRect(x - 2 - sway, y + 10, 3, 3);
      l.fillStyle = mid; l.fillRect(x, y + 4, 2, 6); l.fillStyle = light; l.fillRect(x, y + 3, 1, 3);
      l.fillStyle = '#cf985b'; l.fillRect(x + 1, y, 4, 2);
      g.save(); g.globalCompositeOperation = 'destination-over'; g.drawImage(layer, 0, 0); g.restore();
    }
    if (p.cut === 'Franja') {
      const bx = side ? right - 3 : left + 4, by = top + 4;
      g.fillStyle = mid; g.fillRect(bx, by, 4, 3); g.fillRect(bx + 1, by + 3, 2, 2);
      g.fillStyle = dark; g.fillRect(bx + 1, by + 5, 1, 1); g.fillStyle = light; g.fillRect(bx - 1, by, 3, 1);
    }
  }
  if (p.clan === 'Uchiha' && dir === 'up') {
    const y = top + Math.round(height * 0.48);
    g.fillStyle = '#b44b3e'; g.fillRect(18, y, 4, 2); g.fillStyle = '#e6d5b1'; g.fillRect(19, y + 2, 2, 1); g.fillRect(20, y + 3, 1, 2);
  }
  return top;
}

/** Bandana de Konoha sobre a testa (aparece depois da graduação). */
function drawBandana(g: CanvasRenderingContext2D, top: number, dir: Dir) {
  const y = top + 4;
  if (dir === 'up') { g.fillStyle = '#2b3550'; g.fillRect(14, y, 12, 2); g.fillRect(19, y + 2, 2, 3); return; }
  g.fillStyle = '#2b3550'; g.fillRect(13, y, 14, 3);
  g.fillStyle = '#b8c2cc'; g.fillRect(dir === 'down' ? 16 : dir === 'right' ? 18 : 15, y, 7, 3);
  g.fillStyle = '#6d7884'; g.fillRect(dir === 'down' ? 19 : dir === 'right' ? 21 : 18, y + 1, 2, 1);
}

const HIP: Record<SpriteRole, number> = { gen: 34, iruka: 31, naruto: 32, player: 32, sasuke: 32, sakura: 32, emi: 32 };

/** Quadro pronto: frame >= 0 caminhada; -1 repouso; -2 repouso com respiração. */
export function stillFrame(a: Actor, dir: Dir, frame: number, gesture = false): HTMLCanvasElement {
  const custom = !!a.look;
  const L = a.look;
  const key = [a.role, L?.skin, L?.hair, L?.coat, L?.cut, L?.clan === 'Uchiha', a.bandana, dir, frame, gesture].join('|');
  const hit = frameCache.get(key);
  if (hit) return hit;
  const canvas = offscreen(CELL_W, CELL_H), g = canvas.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  const set = art[a.role];
  if (!set.walk.complete || !set.walk.naturalWidth) return canvas;
  const canonical: Dir = dir === 'left' ? 'right' : dir;
  if (dir === 'left') { g.translate(CELL_W, 0); g.scale(-1, 1); }
  const row = canonical === 'up' ? 2 : canonical === 'right' ? 1 : 0, index = frame >= 0 ? frame % 4 : 1;
  const base = offscreen(CELL_W, CELL_H), b = base.getContext('2d')!;
  b.drawImage(set.walk, index * CELL_W, row * CELL_H, CELL_W, CELL_H, 0, 0, CELL_W, CELL_H);
  if (frame < 0 && set.idle.naturalWidth) {
    const hip = HIP[a.role];
    b.clearRect(0, hip, CELL_W, CELL_H - hip);
    b.drawImage(set.idle, 0, row * CELL_H + hip, CELL_W, CELL_H - hip, 0, hip, CELL_W, CELL_H - hip);
  }
  let top = 6;
  if (custom && L) top = customize(base, L, canonical, frame);
  if (a.bandana) drawBandana(b, top, canonical);
  if (frame < 0 || gesture) {
    const split = 32, drop = gesture ? 0 : frame === -2 ? 2 : 1;
    g.drawImage(base, 0, 0, CELL_W, split, 0, drop, CELL_W, split - drop);
    g.drawImage(base, 0, split, CELL_W, CELL_H - split, 0, split, CELL_W, CELL_H - split);
  } else g.drawImage(base, 0, 0);
  if (frameCache.size > 1600) frameCache.clear();
  frameCache.set(key, canvas);
  return canvas;
}

export function drawActor(g: CanvasRenderingContext2D, x: number, y: number, a: Actor, dir: Dir, frame: number, gesture = false) {
  x = Math.round(x); y = Math.round(y);
  const adult = a.role === 'iruka' || a.role === 'gen', w = adult ? 15 : 13;
  g.fillStyle = 'rgba(107,85,63,.22)'; g.fillRect((x - w / 2 + 2) | 0, y - 1, w + 3, 2);
  g.fillStyle = 'rgba(84,65,54,.30)'; g.fillRect(x - 5, y - 1, 11, 2);
  g.drawImage(stillFrame(a, dir, frame, gesture), x - CELL_W / 2, y - SOLE);
}

const portraitCache = new Map<string, HTMLCanvasElement>();
/** Retrato 40 × 40. Para o protagonista, usa o quadro frontal recolorido, ampliado no rosto. */
export function portrait(a: Actor): HTMLCanvasElement {
  const key = [a.role, a.look?.skin, a.look?.hair, a.look?.coat, a.look?.cut, a.bandana].join('|');
  const hit = portraitCache.get(key);
  if (hit) return hit;
  const c = offscreen(40, 40), g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  g.fillStyle = '#baba97'; g.fillRect(0, 0, 40, 40);
  const set = art[a.role];
  if (a.look) {
    const f = stillFrame(a, 'down', -1);
    g.drawImage(f, 4, 0, 32, 30, 0, 0, 40 * 1.0, 37);
  } else if (set.face.naturalWidth) g.drawImage(set.face, 0, 0);
  if (set.face.naturalWidth) portraitCache.set(key, c);
  return c;
}

export const idlePose = (time: number, offset: number, calm: boolean) => (calm ? -1 : (time + offset) % 3.3 < 0.9 ? -2 : -1);
