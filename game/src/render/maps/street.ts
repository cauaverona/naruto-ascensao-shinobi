// Rua da Academia: a cena de referência v0.2.2, agora como mapa jogável da campanha.
import { ctx, leaf, makeRandom, offscreen, ovalpx, poly, px, tiles, treeArt, loadImage, type G } from '../gfx';
import { MapBuilder, type GameMap } from './types';
import academySrc from '../../assets/academy.png';
import treeASrc from '../../assets/tree-a.png';
import treeBSrc from '../../assets/tree-b.png';
import ramenSrc from '../../assets/ramen.png';

const WW = 896, HH = 512;

export function houseArt(w: number, h: number, roof: string[], market = false) {
  const c = offscreen(w, h), g = ctx(c), r = makeRandom(w + h);
  px(g, 7, 22, w - 14, h - 22, '#655345'); px(g, 9, 22, w - 18, h - 25, '#dbb582'); px(g, 10, 24, w - 20, 8, '#9e8066'); px(g, 13, 29, w - 26, h - 35, '#efc992');
  for (let x = 13; x < w - 12; x += 19) { px(g, x, 26, 3, h - 30, '#956648'); px(g, x + 1, 28, 1, h - 32, '#ba8152'); }
  for (let x = 17; x < w - 18; x += 26) { px(g, x, 36, 18, 12, '#594e46'); px(g, x + 1, 37, 16, 9, '#78958a'); px(g, x + 3, 37, 5, 8, '#a4b5a2'); px(g, x + 8, 36, 2, 12, '#75634c'); }
  poly(g, [[7, 4], [w - 10, 4], [w - 2, 27], [w, 28], [w, 31], [0, 31], [0, 28]], '#514b49');
  poly(g, [[8, 3], [w - 10, 3], [w - 1, 26], [1, 26]], roof[1]);
  for (let y = 5; y < 27; y += 5) {
    const inset = Math.round((27 - y) * 0.29);
    px(g, inset + 2, y, w - 4 - inset * 2, 1, roof[0]); px(g, inset + 1, y + 1, w - 3 - inset * 2, 1, roof[2]);
    for (let x = inset + 5 + (y % 2) * 2; x < w - inset - 4; x += 7) px(g, x, y + 2, 2, 3, roof[0]);
  }
  px(g, 6, 2, w - 14, 2, roof[0]); px(g, 6, 2, w - 14, 1, roof[2]); px(g, 0, 27, w, 2, roof[0]); px(g, 0, 27, w, 1, roof[2]);
  if (market) {
    for (let x = 10; x < w - 11; x += 12) { px(g, x, 33, 11, 10, '#964536'); px(g, x + 1, 33, 9, 8, '#c96247'); px(g, x + 4, 35, 2, 4, '#efd19d'); }
    px(g, 10, h - 16, w - 21, 4, '#765843'); px(g, 10, h - 16, w - 21, 1, '#c39b64');
    for (let x = 18; x < w - 16; x += 19) { px(g, x, h - 5, 7, 2, '#a8543d'); px(g, x + 2, h - 3, 3, 3, '#664f3d'); px(g, x, h - 18, 7, 2, '#f1d8a1'); }
  } else { px(g, w / 2 - 8, h - 18, 16, 17, '#62513f'); px(g, w / 2 - 6, h - 16, 12, 15, '#aa7c50'); px(g, w / 2 - 5, h - 16, 3, 14, '#c39262'); }
  for (let k = 0; k < 12; k++) px(g, 8 + Math.floor(r() * (w - 16)), h - 3, 2, 1, '#a0815a');
  return c;
}

export function fenceArt(length: number, kind: 'wood' | 'stone') {
  const img = offscreen(length, 19), g = ctx(img);
  if (kind === 'stone') {
    px(g, 0, 6, length, 12, '#7d8175');
    for (let row = 0; row < 2; row++) for (let a = -8 + row * 8; a < length; a += 15) { px(g, a, 7 + row * 5, 14, 4, row ? '#a49d83' : '#bbb296'); px(g, a + 1, 7 + row * 5, 11, 1, '#d7c9a2'); }
    px(g, 0, 4, length, 3, '#9c9a83'); px(g, 0, 4, length, 1, '#d8c99e');
  } else {
    for (const yy of [6, 12]) { px(g, 0, yy, length, 3, '#716045'); px(g, 0, yy, length, 1, '#c19b60'); }
    for (let a = 1; a < length; a += 13) { px(g, a, 1, 4, 18, '#765a3c'); px(g, a, 2, 2, 15, '#b38e54'); px(g, a, 0, 3, 2, '#c9aa72'); }
  }
  return img;
}

export function lampArt() {
  const c = offscreen(18, 34), g = ctx(c);
  px(g, 8, 1, 3, 33, '#69583f'); px(g, 8, 2, 1, 30, '#b18b57'); px(g, 2, 2, 13, 2, '#74563e'); px(g, 2, 4, 1, 4, '#5d4c3e');
  ovalpx(g, 3, 12, 3, 5, '#b14b38'); px(g, 2, 8, 2, 8, '#ed935a'); px(g, 1, 7, 5, 1, '#594b40'); px(g, 2, 17, 3, 2, '#745438');
  return c;
}

function noticeArt() {
  const c = offscreen(34, 30), p = ctx(c);
  px(p, 4, 9, 3, 21, '#725239'); px(p, 26, 9, 3, 21, '#725239');
  px(p, 1, 4, 31, 17, '#5c4939'); px(p, 3, 6, 27, 13, '#b88d57');
  poly(p, [[0, 4], [4, 1], [29, 1], [33, 4], [32, 6], [1, 6]], '#734d37'); px(p, 4, 2, 26, 1, '#d09b64');
  for (const [a, b] of [[5, 8], [13, 7], [21, 9]]) { px(p, a, b, 6, 8, '#865f41'); px(p, a, b, 6, 7, '#ecdaa4'); px(p, a + 1, b + 2, 4, 1, '#ad8d64'); px(p, a + 1, b + 4, 3, 1, '#c0a37e'); }
  return c;
}

function potsArt(seed: number) {
  const c = offscreen(41, 16), p = ctx(c), r = makeRandom(seed);
  for (let i = 0; i < 5; i++) {
    const a = 2 + i * 8;
    px(p, a, 10, 6, 5, '#9a6546'); px(p, a, 10, 6, 1, '#d0915c'); px(p, a + 1, 13, 4, 2, '#986243');
    for (let n = 0; n < 6; n++) { const xx = Math.round(a + 2 + r() * 4 - 2), yy = Math.round(3 + r() * 7); px(p, xx, yy, 1, 10 - yy, '#4b754e'); px(p, xx - 1, yy - 1, 3, 2, n % 2 ? '#e6a16e' : '#d48369'); px(p, xx, yy - 1, 1, 1, '#f2ce89'); }
  }
  return c;
}

export function buildStreet(): GameMap {
  const ground = offscreen(WW, HH), gd = ctx(ground), mb = new MapBuilder(), T = tiles();
  const trees = [treeArt(81), treeArt(472), treeArt(66, true)];
  const treeImgs = [loadImage(treeASrc), loadImage(treeBSrc)];
  const r = makeRandom(8827);
  const addTree = (x: number, y: number, k: number) => { mb.item(x, y, trees[k], y); mb.wall(x - 5, y - 5, 10, 8); };
  const fence = (x: number, y: number, length: number, kind: 'wood' | 'stone' = 'wood') => { mb.item(x + length / 2, y, fenceArt(length, kind)); mb.wall(x, y - 3, length, 4); };
  const lights: GameMap['lights'] = [];
  const lamp = (x: number, y: number) => { mb.item(x, y, lampArt()); mb.wall(x - 2, y - 3, 4, 4); lights.push({ x: x - 5, y: y - 22, r: 34 }); };
  const garden = (x: number, y: number, w: number, h: number) => { for (let a = 0; a < w; a += 6) { const b = (a * 13) % h; px(gd, x + a, y + b, 1, 4, '#60894f'); px(gd, x + a - 1, y + b, 3, 2, a % 4 ? '#e69c72' : '#f2d487'); px(gd, x + a, y + b, 1, 1, '#f1dba3'); } };

  for (let y = 0; y < HH; y += 16) for (let x = 0; x < WW; x += 16) {
    const main = (y >= 208 && y < 288) || (x >= 400 && x < 496 && y >= 160);
    const plaza = x >= 272 && x < 624 && y >= 192 && y < 288;
    gd.drawImage(T[plaza ? 'stone' : main ? 'earth' : 'grass'][Math.floor(r() * 8)], x, y);
  }
  for (let x = 0; x < WW; x += 6) { const off = Math.floor(r() * 3); px(gd, x, 207 + off, 4, 2, '#b3b675'); px(gd, x + 2, 286 + off, 3, 2, '#b6b779'); }
  for (let y = 12; y < HH; y += 17) for (let x = 8; x < WW; x += 19) {
    if ((y < 188 || y > 303) && (x < 392 || x > 510) && r() > 0.6) { const v = Math.floor(r() * 10); px(gd, x + v, y, 4, 2, '#799c55'); px(gd, x + v + 1, y - 2, 1, 2, '#86a65a'); }
  }
  for (let x = 0; x < WW; x += 37) addTree(x + 8, 61 + Math.floor(r() * 20), Math.floor(r() * 3));
  const slate = ['#4c5163', '#747f92', '#a0a7ae'], red = ['#914d3d', '#b86a4e', '#e39768'];
  for (const [x, y, w, h, t] of [[58, 135, 93, 71, slate], [158, 129, 98, 78, red], [247, 126, 73, 63, slate], [651, 119, 91, 74, red], [752, 134, 98, 78, slate], [857, 133, 88, 70, red]] as [number, number, number, number, string[]][]) {
    mb.item(x, y, houseArt(w, h, t)); mb.wall(x - w / 2 + 4, y - 45, w - 8, 47);
  }
  const market = houseArt(108, 79, slate, true);
  mb.item(145, 203, market); mb.wall(96, 161, 98, 42);
  mb.item(760, 198, houseArt(93, 66, red)); mb.wall(720, 157, 80, 42);
  for (let x = 0; x < WW; x += 41) addTree(x + 18, 506 + Math.floor(r() * 6), Math.floor(r() * 3));
  for (const [x, y, k] of [[300, 470, 1], [520, 476, 0], [640, 466, 2], [880, 470, 1], [230, 492, 0]]) addTree(x, y, k);
  for (const [x, y, k] of [[29, 191, 0], [69, 203, 2], [233, 195, 1], [291, 196, 0], [612, 192, 1], [671, 199, 0], [840, 205, 1], [37, 352, 1], [166, 341, 0], [286, 344, 1], [607, 345, 1], [711, 356, 0], [826, 340, 2], [60, 387, 2], [341, 392, 0], [563, 398, 1]]) addTree(x, y, k);
  for (const [x, y, w] of [[212, 205, 116], [575, 205, 119], [17, 309, 135], [234, 309, 100], [565, 309, 129], [763, 308, 114]]) fence(x, y, w, y === 205 ? 'stone' : 'wood');
  for (const [x, y] of [[326, 211], [572, 211], [187, 207], [700, 215]]) lamp(x, y);
  for (const [x, y] of [[214, 197], [289, 198], [586, 197], [642, 197], [230, 304], [580, 302]]) garden(x, y, 36, 5);
  mb.item(117, 429, houseArt(120, 89, red)); mb.wall(65, 367, 104, 61);
  mb.item(763, 434, houseArt(143, 94, slate)); mb.wall(699, 366, 130, 67);
  // Corpo da Academia é sólido; o patamar diante da porta é caminhável.
  mb.wall(330, 89, 238, 94); mb.wall(331, 181, 87, 14); mb.wall(483, 181, 85, 14);
  px(gd, 330, 191, 238, 6, '#948b6f'); px(gd, 416, 194, 69, 6, '#cab48d'); px(gd, 418, 195, 65, 1, '#e9cfa0');
  for (const [x, y] of [[300, 294], [323, 294], [545, 294], [568, 294]]) {
    px(gd, x - 3, y - 2, 7, 4, '#768356');
    const pot = offscreen(13, 15), g = ctx(pot);
    px(g, 3, 8, 8, 7, '#9d6847'); px(g, 2, 8, 10, 3, '#b98155'); leaf(g, 6, 6, 5, 4, makeRandom(x));
    mb.item(x, y, pot); mb.wall(x - 3, y - 2, 6, 3);
  }
  mb.item(308, 209, noticeArt()); mb.wall(295, 206, 26, 4);
  mb.item(374, 198, potsArt(23)); mb.wall(357, 196, 34, 3);
  mb.item(532, 198, potsArt(39)); mb.wall(515, 196, 34, 3);
  for (const t of mb.things) if (trees.includes(t.img as HTMLCanvasElement)) { ovalpx(gd, Math.round(t.x) + 3, t.y - 1, 14, 3, '#7f9656'); px(gd, t.x - 5, t.y, 13, 2, '#819751'); }
  // Árvores e barraca finalizadas à mão substituem as versões desenhadas por código quando carregam.
  treeImgs.forEach((img, slot) => img.addEventListener('load', () => { for (const t of mb.things) if (t.img === trees[slot]) t.img = img; }));
  const ramen = loadImage(ramenSrc);
  ramen.addEventListener('load', () => { const t = mb.things.find((o) => o.img === market); if (t) t.img = ramen; });
  lights.push({ x: 120, y: 175, r: 30 }, { x: 170, y: 175, r: 30 });

  return {
    id: 'rua', name: 'Rua da Academia', region: 'Konohagakure · País do Fogo', w: WW, h: HH, ground,
    things: mb.things, walls: mb.walls, bounds: { x: 18, y: 172, w: WW - 36, h: HH - 181 }, lights,
    extra: [{ img: loadImage(academySrc), x: 320, y: 54, depth: 193 }],
    spots: [
      { id: 'academia', x: 450, y: 192, r: 20, label: 'Academia Ninja' },
      { id: 'quadro', x: 308, y: 216, r: 18, label: 'Quadro de avisos' },
      { id: 'ichiraku', x: 145, y: 214, r: 22, label: 'Ichiraku Ramen' },
      { id: 'casa', x: 117, y: 436, r: 16, label: 'Sua casa' },
    ],
    exits: [{ rect: { x: 0, y: 208, w: 26, h: 80 }, to: 'campo', arrive: { x: 596, y: 240, dir: 'left' }, label: 'Campo de Treino' }],
    ambient: (g: G, t: number, calm: boolean) => {
      if (!calm) for (let i = 0; i < 9; i++) {
        const f = (t * 0.095 + i * 0.171) % 1;
        const x = 82 + i * 83 + Math.round(f * 39 + Math.sin(f * 6) * 4), y = 132 + (i % 3) * 38 + Math.round(f * 70);
        px(g, x, y, 3, 1, i % 2 ? '#cc9851' : '#ba793b'); px(g, x + 1, y - 1, 1, 1, '#d8ac5e');
      }
      for (const side of [-1, 1]) {
        const x = 448 + side * 89;
        px(g, x, 164, 2, 29, '#72553b'); px(g, x - 1, 163, 11, 2, '#65543b');
        for (let j = 0; j < 14; j++) { const shift = j > 5 && !calm ? Math.round(Math.sin(t * 3 + j * 0.3)) : 0; px(g, x + 3 + shift, 165 + j, 6, 1, j % 5 === 0 ? '#d79865' : '#ab5940'); }
      }
    },
  };
}
