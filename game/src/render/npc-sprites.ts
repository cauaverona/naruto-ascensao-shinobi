// Poses dos NPCs ilustrados. A folha aprovada contém frente, perfil direito e costas.
import { loadImage, offscreen } from './gfx';
import { paintBandana } from './bandana';

export const CELL_W = 40, CELL_H = 46, SOLE = 44;
export type Dir = 'up' | 'down' | 'left' | 'right';
export type CombatPose = 'ready' | 'windup' | 'strike' | 'throw' | 'guard' | 'seals' | 'hurt' | 'dodge';

const files = import.meta.glob('../assets/npc/*.png', { eager: true, import: 'default' }) as Record<string, string>;
const sheets = new Map(Object.entries(files).map(([path, src]) => [path.split('/').pop()!.slice(0, -4), loadImage(src)]));
export const npcSpritesReady = Promise.all([...sheets.values()].map((sheet) => sheet.decode().catch(() => undefined)));

type Ctx = CanvasRenderingContext2D;
type Rgb = [number, number, number];
type Point = [number, number];
type Facing = Exclude<Dir, 'left'>;

interface Rig {
  cell: HTMLCanvasElement;
  farLeg: HTMLCanvasElement;
  top: number;
  hip: number;
  center: number;
  sleeve: Rgb;
  hand: Rgb;
  trousers: Rgb;
  boot: Rgb;
}

// Linhas da testa nas artes aprovadas, acima dos olhos e da armação do Shino.
const foreheadRows = new Map<string, Record<Facing, number>>([
  ['ino', { down: 14, right: 14, up: 17 }],
  ['shikamaru', { down: 15, right: 15, up: 17 }],
  ['choji', { down: 14, right: 13, up: 17 }],
  ['kiba', { down: 14, right: 14, up: 17 }],
  ['hinata', { down: 14, right: 14, up: 17 }],
  ['shino', { down: 14, right: 14, up: 17 }],
  ['daichi', { down: 15, right: 14, up: 17 }],
]);
const kicks = new Set(['rock-lee', 'guy', 'maki', 'shikamaru']);
const palms = new Set(['hinata', 'neji']);
const rigs = new Map<string, Rig>();
const frames = new Map<string, HTMLCanvasElement>();

const rgb = (c: Rgb) => `rgb(${c.join(',')})`;
const tint = (c: Rgb, n: number): Rgb => c.map((v) => Math.round(v * n)) as Rgb;
const light = (r: number, g: number, b: number) => r * 0.25 + g * 0.55 + b * 0.2;

function pen(canvas: HTMLCanvasElement) {
  const g = canvas.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  return g;
}

/** Preenche furos de amostragem fechados por quatro vizinhos e reforça bordas claras. */
function finishInk(pixels: ImageData) {
  const source = new Uint8ClampedArray(pixels.data);
  const dest = pixels.data;
  const inside = (p: number) => source[p * 4 + 3] >= 128;
  for (let y = 0; y < CELL_H; y++) for (let x = 0; x < CELL_W; x++) {
    const p = y * CELL_W + x, k = p * 4;
    if (!inside(p)) {
      const neighbors = [p - 1, p + 1, p - CELL_W, p + CELL_W];
      if (x > 0 && x < CELL_W - 1 && y > 0 && y < SOLE - 2 && neighbors.every(inside)) {
        const donor = neighbors.reduce((a, b) => {
          const c = (n: number) => light(source[n * 4], source[n * 4 + 1], source[n * 4 + 2]);
          return c(a) < c(b) ? a : b;
        });
        dest.set(source.subarray(donor * 4, donor * 4 + 3), k);
        dest[k + 3] = 255;
      } else dest.fill(0, k, k + 4);
      continue;
    }
    dest[k + 3] = 255;
    const outline = x === 0 || x === CELL_W - 1 || y === 0 || y === CELL_H - 1
      || !inside(p - 1) || !inside(p + 1) || !inside(p - CELL_W) || !inside(p + CELL_W);
    if (outline && light(source[k], source[k + 1], source[k + 2]) > 126) {
      dest[k] = Math.round(source[k] * 0.59 + 37);
      dest[k + 1] = Math.round(source[k + 1] * 0.53 + 18);
      dest[k + 2] = Math.round(source[k + 2] * 0.59 + 25);
    }
  }
}

function solidAt(pixels: ImageData, x: number, y: number) {
  return pixels.data[(y * CELL_W + x) * 4 + 3] > 0;
}

function rowBounds(pixels: ImageData, y: number) {
  let left = 0, right = CELL_W - 1;
  while (left < CELL_W && !solidAt(pixels, left, y)) left++;
  while (right > left && !solidAt(pixels, right, y)) right--;
  return { left, right };
}

function fabric(pixels: ImageData, x0: number, x1: number, y0: number, y1: number, fallback: Rgb, skin = false): Rgb {
  const samples: Rgb[] = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * CELL_W + x) * 4;
    if (!pixels.data[i + 3]) continue;
    const r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2];
    if (light(r, g, b) < 41 || (skin && (r < g + 15 || g < b + 8 || r < 122))) continue;
    samples.push([r, g, b]);
  }
  samples.sort((a, b) => light(...a) - light(...b));
  return samples[Math.floor(samples.length * (skin ? 0.64 : 0.48))] ?? fallback;
}

function graduationBand(g: Ctx, pixels: ImageData, dir: Facing, y: number, color: string) {
  const { left, right } = rowBounds(pixels, y);
  const width = Math.min(dir === 'right' ? 10 : 12, right - left);
  const x = dir === 'right' ? right - width : Math.round((left + right - width) / 2);
  paintBandana(g, x, y, width, color, dir === 'up' ? 'hidden' : dir === 'right' ? 'right' : 'center');
}

function getRig(id: string, dir: Facing, band: string | undefined): Rig | undefined {
  const sheet = sheets.get(id);
  if (!sheet?.naturalWidth || sheet.naturalWidth !== CELL_W * 3 || sheet.naturalHeight !== CELL_H) return;
  const forehead = foreheadRows.get(id)?.[dir];
  const color = forehead !== undefined ? band : undefined;
  const key = `${id}:${dir}:${color ?? ''}`;
  const cached = rigs.get(key);
  if (cached) return cached;
  const cell = offscreen(CELL_W, CELL_H), g = pen(cell);
  const column = dir === 'down' ? 0 : dir === 'right' ? 1 : 2;
  g.drawImage(sheet, column * CELL_W, 0, CELL_W, CELL_H, 0, 0, CELL_W, CELL_H);
  const pixels = g.getImageData(0, 0, CELL_W, CELL_H);
  finishInk(pixels);
  g.putImageData(pixels, 0, 0);
  let top = 0;
  while (top < SOLE && rowBounds(pixels, top).left === CELL_W) top++;
  const hip = Math.round(top + (SOLE - top) * 0.68);
  const collar = Math.round(top + (SOLE - top) * 0.46);
  const center = 20;
  if (color && forehead !== undefined) graduationBand(g, pixels, dir, forehead, color);
  const farLeg = offscreen(CELL_W, CELL_H), fg = pen(farLeg);
  fg.drawImage(cell, 0, 0);
  fg.globalCompositeOperation = 'source-atop';
  fg.fillStyle = 'rgba(25,22,36,.28)'; fg.fillRect(0, hip, CELL_W, CELL_H - hip);
  const rig = {
    cell, farLeg, top, hip, center,
    sleeve: fabric(pixels, center - 5, center + 2, collar, hip - 1, [92, 87, 105]),
    hand: fabric(pixels, center - 1, center + 8, top + 6, collar, [211, 155, 116], true),
    trousers: fabric(pixels, center - 6, center + 5, hip, SOLE - 5, [63, 62, 83]),
    boot: fabric(pixels, center - 7, center + 7, SOLE - 5, SOLE, [48, 48, 67]),
  };
  rigs.set(key, rig);
  return rig;
}

function leg(g: Ctx, rig: Rig, x: number, w: number, stride: number, lift: number, far = false) {
  const source = far ? rig.farLeg : rig.cell;
  for (let y = rig.hip; y < SOLE; y++) {
    const t = (y - rig.hip) / (SOLE - rig.hip - 1);
    g.drawImage(source, x, y, w, 1, x + Math.round(stride * t), y - Math.round(lift * t), w, 1);
  }
}

function torso(g: Ctx, rig: Rig, lean: number, drop: number) {
  for (let y = rig.top; y <= rig.hip; y++) {
    const t = (rig.hip - y) / (rig.hip - rig.top);
    const shift = Math.round(lean * t);
    const fall = Math.round(drop * t);
    g.drawImage(rig.cell, 0, y, CELL_W, 1, shift, y + fall, CELL_W, 1);
  }
}

function walk(g: Ctx, rig: Rig, dir: Facing, step: number) {
  const stride = [5, 1, -5, -1][step];
  const lift = [0, 2, 0, 2][step];
  if (dir === 'right') {
    leg(g, rig, 0, CELL_W, -stride, step >= 2 ? lift : 0, true);
    leg(g, rig, 0, CELL_W, stride, step < 2 ? lift : 0);
  } else {
    const side = step < 2 ? -1 : 1;
    leg(g, rig, 0, rig.center, -1, side < 0 ? 1 + lift : 0);
    leg(g, rig, rig.center, CELL_W - rig.center, 1, side > 0 ? 1 + lift : 0);
  }
  torso(g, rig, Math.sign(stride), lift ? 1 : 0);
  if (dir === 'right' && !lift) {
    const x = rig.center - 1, y = rig.hip - 8;
    const swing = stride > 0 ? -3 : 3;
    const hand: Point = [x + swing, y + 7];
    limb(g, [[x, y], [x + Math.sign(swing), y + 4], hand], rig.sleeve, 2);
    limb(g, [hand, hand], rig.hand, 1);
  }
}

/** Riscado por pontos inteiros para que braços e chutes mantenham o mesmo contorno do sprite. */
function limb(g: Ctx, points: Point[], color: Rgb, width: number) {
  for (const border of [true, false]) {
    const size = width + (border ? 2 : 0), offset = Math.floor(size / 2);
    g.fillStyle = border ? '#262432' : rgb(color);
    for (let i = 1; i < points.length; i++) {
      const [x0, y0] = points[i - 1], [x1, y1] = points[i];
      const steps = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let n = 0; n <= steps; n++) {
        g.fillRect(Math.round(x0 + (x1 - x0) * n / steps) - offset, Math.round(y0 + (y1 - y0) * n / steps) - offset, size, size);
      }
    }
  }
}

const STANCE: Record<CombatPose, { stride: number; lean: number; drop: number; arm?: [number, number, number, number] }> = {
  ready: { stride: 2, lean: 0, drop: 0 },
  windup: { stride: 4, lean: -2, drop: 1, arm: [-3, 5, -4, 2] },
  strike: { stride: 3, lean: 3, drop: 0, arm: [6, 2, 13, 0] },
  throw: { stride: 3, lean: 2, drop: 0, arm: [5, -2, 11, -4] },
  guard: { stride: 2, lean: 0, drop: 2, arm: [6, 5, 6, -3] },
  seals: { stride: 1, lean: 0, drop: 0, arm: [5, 6, 8, 2] },
  hurt: { stride: 4, lean: -4, drop: 1, arm: [0, 6, 4, 7] },
  dodge: { stride: 3, lean: -3, drop: 3, arm: [3, 5, 7, 3] },
};

function fight(g: Ctx, rig: Rig, id: string, pose: CombatPose) {
  const { stride, lean, drop, arm } = STANCE[pose];
  const kick = pose === 'strike' && kicks.has(id);
  leg(g, rig, 0, CELL_W, -stride, 0, true);
  if (!kick) leg(g, rig, 0, CELL_W, stride, pose === 'dodge' ? 3 : 0);
  torso(g, rig, kick ? -3 : lean, drop);
  if (kick) {
    const y = rig.hip - 1, x = rig.center + 1;
    limb(g, [[x, y], [x + 7, y - 4], [x + 11, y - 6]], rig.trousers, 3);
    limb(g, [[x + 11, y - 6], [x + 14, y - 7]], rig.boot, 2);
  } else if (arm) {
    const x = rig.center, y = rig.hip - 7 + (drop ? 1 : 0);
    const elbow: Point = [x + arm[0], y + arm[1]];
    const hand: Point = [x + arm[2], y + arm[3]];
    if (pose === 'seals') limb(g, [[x + 1, y + 3], [x + 5, y + 5], [hand[0], hand[1] - 1]], tint(rig.sleeve, 0.72), 2);
    limb(g, [[x, y], elbow, hand], rig.sleeve, 2);
    const palm: Point = [hand[0], hand[1] - (pose === 'strike' && palms.has(id) ? 2 : 0)];
    limb(g, [hand, palm], rig.hand, 2);
  }
}

export function npcFrame(id: string, dir: Dir, frame: number, band?: string, pose?: CombatPose): HTMLCanvasElement | undefined {
  const face = dir === 'left' ? 'right' : dir;
  const rig = getRig(id, face, band);
  if (!rig) return;
  if (frame < 0 && !pose && dir !== 'left' && frame !== -2) return rig.cell;
  const action = face === 'right' ? pose : undefined;
  const step = action ? -1 : frame < 0 ? frame : frame % 4;
  const key = `${id}:${dir}:${step}:${foreheadRows.has(id) ? band ?? '' : ''}:${action ?? ''}`;
  const cached = frames.get(key);
  if (cached) return cached;
  const canvas = offscreen(CELL_W, CELL_H), g = pen(canvas);
  if (dir === 'left') { g.translate(CELL_W, 0); g.scale(-1, 1); }
  if (action) fight(g, rig, id, action);
  else if (step >= 0) walk(g, rig, face, step);
  else if (step === -2) {
    leg(g, rig, 0, CELL_W, 0, 0);
    torso(g, rig, 0, 1);
  } else g.drawImage(rig.cell, 0, 0);
  frames.set(key, canvas);
  return canvas;
}

