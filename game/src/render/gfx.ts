// Primitivas de pixel art usadas por mapas e efeitos (portadas da cena de referência v0.2.2).
export type G = CanvasRenderingContext2D;

export function offscreen(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
export function ctx(c: HTMLCanvasElement): G {
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  return g;
}
export function makeRandom(s: number) {
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
export function px(g: G, x: number, y: number, w: number, h: number, color: string) {
  g.fillStyle = color;
  g.fillRect(Math.round(x), Math.round(y), w, h);
}
export function poly(g: G, points: number[][], col: string) {
  const ys = points.map((p) => p[1]);
  for (let y = Math.min(...ys); y < Math.max(...ys); y++) {
    const xs: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(x1 + ((x2 - x1) * (y - y1)) / (y2 - y1));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const x = Math.ceil(xs[i]);
      px(g, x, y, Math.ceil(xs[i + 1]) - x, 1, col);
    }
  }
}
export function ovalpx(g: G, x: number, y: number, rx: number, ry: number, col: string) {
  for (let j = -ry; j <= ry; j++) {
    const d = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j / ry) ** 2)));
    px(g, x - d, y + j, 2 * d + 1, 1, col);
  }
}
export const greens = ['#385b43', '#4b754a', '#65914f', '#86aa59', '#a2ba65', '#b9c776'];
export function leaf(g: G, x: number, y: number, rx: number, ry: number, r: () => number) {
  ovalpx(g, x, y, rx, ry, greens[0]);
  ovalpx(g, x - 1, y - 2, rx - 1, ry - 1, greens[1]);
  ovalpx(g, x - 2, y - 3, rx - 2, Math.max(2, ry - 2), greens[2]);
  for (let i = 0; i < 18; i++) {
    const xx = Math.floor((r() * 2 - 1) * (rx - 2)), yy = Math.floor((r() * 2 - 1) * (ry - 2));
    if ((xx * xx) / (rx * rx) + (yy * yy) / (ry * ry) < 0.8) {
      const c = greens[yy > 0 ? 2 : 3 + Math.floor(r() * 2)];
      px(g, x + xx - 1, y + yy, 3, 1, c);
      px(g, x + xx, y + yy - 1, 2, 1, c);
    }
  }
}
export function treeArt(seed: number, tall = false): HTMLCanvasElement {
  const c = offscreen(58, tall ? 80 : 64), g = ctx(c), r = makeRandom(seed), h = c.height;
  poly(g, [[21, h - 2], [24, h - 8], [25, 26], [31, 24], [33, h - 9], [39, h - 1], [33, h - 3], [30, h - 1], [27, h - 3]], '#65523a');
  px(g, 26, h - 27, 3, 23, '#987548'); px(g, 26, h - 17, 1, 11, '#c3995b');
  poly(g, [[25, h - 15], [15, h - 34], [17, h - 35], [28, h - 23]], '#786041');
  if (tall) {
    for (let n = 0; n < 6; n++) {
      const y = 48 - n * 7, w = 22 - n * 3;
      poly(g, [[29, y - 20], [29 - w, y - 1], [22, y - 4], [18, y + 1], [30, y - 2], [34, y + 1], [29 + w, y]], greens[n % 2]);
      poly(g, [[27, y - 16], [30 - w, y - 2], [25, y - 6], [24, y - 3], [29, y - 7]], greens[2 + (n % 2)]);
    }
  } else {
    for (const [x, y, rx, ry] of [[26, 32, 22, 16], [15, 31, 13, 12], [40, 31, 15, 13], [36, 19, 14, 14], [21, 18, 14, 13], [12, 25, 11, 10], [29, 11, 12, 10], [45, 24, 10, 10], [27, 27, 14, 11]]) leaf(g, x, y, rx, ry, r);
  }
  return c;
}
export function tile(type: 'grass' | 'stone' | 'earth' | 'wood', index: number): HTMLCanvasElement {
  const c = offscreen(16, 16), g = ctx(c), r = makeRandom(index * 987 + 713);
  if (type === 'wood') {
    px(g, 0, 0, 16, 16, '#a9774b');
    for (let y = 0; y < 16; y += 4) { px(g, 0, y, 16, 1, '#7c5434'); px(g, 0, y + 1, 16, 1, '#c08b5a'); }
    px(g, (index * 5) % 16, 1, 1, 3, '#7c5434'); px(g, (index * 11 + 7) % 16, 9, 1, 3, '#7c5434');
    for (let k = 0; k < 5; k++) px(g, Math.floor(r() * 15), Math.floor(r() * 15), 2, 1, '#b5825a');
    return c;
  }
  const grass = type === 'grass', stone = type === 'stone';
  px(g, 0, 0, 16, 16, grass ? '#91b260' : stone ? '#dec99c' : '#e4c58d');
  if (stone) { px(g, 0, 0, 16, 1, '#c9aa7e'); px(g, 0, 1, 16, 1, '#f2d9a8'); px(g, index % 2 ? 3 : 11, 2, 1, 14, '#cdb88d'); }
  for (let k = 0; k < (grass ? 15 : 8); k++) {
    const x = Math.floor(r() * 15), y = Math.floor(r() * 15);
    const col = grass ? ['#a5bc6a', '#7fa455', '#bac577'][k % 3] : ['#d6b986', '#eed3a0', '#dfbe88'][k % 3];
    px(g, x, y, grass ? 2 : 1 + (k % 3), 1, col);
    if (grass && k % 3 === 0) px(g, x + 1, y - 1, 1, 1, col);
  }
  return c;
}

let tileCache: Record<string, HTMLCanvasElement[]> | null = null;
export function tiles() {
  tileCache ??= Object.fromEntries((['grass', 'stone', 'earth', 'wood'] as const).map((t) => [t, Array.from({ length: 8 }, (_, i) => tile(t, i))]));
  return tileCache;
}

export function loadImage(src: string): HTMLImageElement {
  const img = new Image();
  img.src = src;
  return img;
}
