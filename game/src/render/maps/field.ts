// Campo de Treino da Academia (mapa novo da v0.3.0, mesma grade e paleta da Rua da Academia).
import { ctx, makeRandom, offscreen, ovalpx, poly, px, tiles, treeArt, loadImage } from '../gfx';
import { MapBuilder, type GameMap } from './types';
import { fenceArt } from './street';
import treeASrc from '../../assets/tree-a.png';
import treeBSrc from '../../assets/tree-b.png';

const W = 640, H = 400;

function logArt() {
  const c = offscreen(14, 30), g = ctx(c);
  px(g, 2, 3, 10, 27, '#6d5338'); px(g, 3, 3, 3, 26, '#9b7a50'); px(g, 9, 4, 2, 25, '#59432e');
  ovalpx(g, 7, 3, 5, 2, '#c9a56c'); ovalpx(g, 7, 3, 3, 1, '#a9844f');
  px(g, 2, 11, 10, 3, '#d9c08c'); px(g, 2, 12, 10, 1, '#b39463'); // corda
  for (const y of [17, 22]) px(g, 4, y, 6, 1, '#4b3a28'); // marcas de golpes
  px(g, 0, 28, 14, 2, '#5d4a33');
  return c;
}

function targetArt() {
  const c = offscreen(22, 34), g = ctx(c);
  px(g, 10, 14, 3, 20, '#6e5439'); px(g, 10, 14, 1, 20, '#a07f53');
  ovalpx(g, 11, 10, 10, 10, '#5a4634'); ovalpx(g, 11, 10, 9, 9, '#efe2c0'); ovalpx(g, 11, 10, 6, 6, '#b5483a'); ovalpx(g, 11, 10, 3, 3, '#efe2c0'); ovalpx(g, 11, 10, 1, 1, '#b5483a');
  px(g, 6, 7, 3, 1, '#7a6a5a'); px(g, 15, 13, 1, 3, '#7a6a5a');
  return c;
}

function rockArt() {
  const c = offscreen(34, 20), g = ctx(c);
  poly(g, [[2, 19], [5, 8], [12, 3], [24, 2], [31, 9], [33, 19]], '#6f7469');
  poly(g, [[5, 17], [8, 9], [13, 5], [23, 4], [29, 10], [30, 17]], '#8d9286');
  px(g, 11, 6, 10, 2, '#b2b5a6'); px(g, 8, 10, 3, 1, '#b2b5a6');
  px(g, 3, 18, 30, 2, '#55594f');
  return c;
}

function standArt() {
  const c = offscreen(30, 24), g = ctx(c);
  px(g, 2, 8, 26, 3, '#7a5a3c'); px(g, 2, 8, 26, 1, '#b7905b');
  px(g, 4, 11, 2, 13, '#5f472f'); px(g, 24, 11, 2, 13, '#5f472f');
  for (let i = 0; i < 5; i++) { px(g, 6 + i * 4, 1, 1, 7, '#9aa3ad'); px(g, 5 + i * 4, 0, 3, 2, '#c4ccd3'); }
  return c;
}

function practiceStandArt() {
  const c = offscreen(34, 24), g = ctx(c);
  px(g, 1, 21, 32, 2, '#9c794f');
  for (const x of [6, 25]) {
    px(g, x, 12, 3, 10, '#60452f');
    px(g, x, 12, 1, 10, '#8c6340');
  }
  px(g, 2, 9, 30, 5, '#765037');
  px(g, 2, 9, 30, 2, '#b78c54');
  px(g, 6, 3, 22, 8, '#9d674a');
  px(g, 26, 3, 4, 6, '#6e4d33'); px(g, 27, 4, 2, 4, '#f8c96b');
  px(g, 8, 4, 18, 6, '#eddbad');
  for (const x of [12, 16, 20]) px(g, x, 6, 2, 2, '#8e5948');
  return c;
}

function studyDeskArt() {
  const c = offscreen(38, 26), g = ctx(c);
  px(g, 1, 23, 36, 2, '#a08056');
  for (const x of [6, 28]) {
    px(g, x, 12, 4, 12, '#65492f');
    px(g, x, 12, 1, 12, '#ae8052');
  }
  px(g, 3, 9, 32, 6, '#7f5638');
  px(g, 3, 8, 32, 3, '#c29861');
  px(g, 5, 5, 20, 5, '#eee0b1');
  px(g, 7, 6, 14, 1, '#b19770');
  px(g, 7, 8, 10, 1, '#aa8763');
  px(g, 15, 5, 1, 5, '#927656');
  px(g, 28, 4, 5, 6, '#5b4242');
  px(g, 29, 4, 4, 2, '#bf7453');
  return c;
}

function courseStakeArt() {
  const c = offscreen(12, 22), g = ctx(c);
  px(g, 1, 20, 9, 2, '#a17f56');
  px(g, 3, 3, 2, 18, '#65482f');
  px(g, 5, 3, 1, 16, '#ac814d');
  px(g, 4, 3, 7, 5, '#8b3e39');
  px(g, 5, 3, 6, 1, '#d57356');
  px(g, 5, 6, 4, 1, '#f5d5a9');
  return c;
}

export function buildField(): GameMap {
  const ground = offscreen(W, H), gd = ctx(ground), mb = new MapBuilder(), T = tiles();
  const r = makeRandom(4412);
  const trees = [treeArt(91), treeArt(213), treeArt(57, true)];
  const treeImgs = [loadImage(treeASrc), loadImage(treeBSrc)];
  const addTree = (x: number, y: number, k: number) => { mb.item(x, y, trees[k], y); mb.wall(x - 5, y - 5, 10, 8); };

  for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) {
    const cx = (x - 340) / 230, cy = (y - 248) / 110;
    const clearing = cx * cx + cy * cy < 1 + (r() - 0.5) * 0.12;
    const path = y >= 224 && y < 256 && x >= 480;
    gd.drawImage(T[clearing || path ? 'earth' : 'grass'][Math.floor(r() * 8)], x, y);
  }
  // Borda irregular entre grama e terra.
  for (let a = 0; a < Math.PI * 2; a += 0.012) {
    const x = 340 + Math.cos(a) * 232, y = 248 + Math.sin(a) * 112;
    px(gd, x, y, 3, 2, '#b3b675');
  }
  for (let y = 10; y < H; y += 15) for (let x = 6; x < W; x += 17) if (r() > 0.7) { const v = Math.floor(r() * 9); px(gd, x + v, y, 4, 2, '#799c55'); px(gd, x + v + 1, y - 2, 1, 2, '#86a65a'); }
  // Pequeno lago para a meditação.
  ovalpx(gd, 96, 330, 34, 14, '#6e8f6a'); ovalpx(gd, 96, 330, 31, 12, '#4f7f8e'); ovalpx(gd, 92, 327, 22, 7, '#6aa0ad'); px(gd, 78, 325, 9, 1, '#a9d0d0'); px(gd, 100, 331, 6, 1, '#a9d0d0');
  // Círculo de duelo riscado na terra.
  for (let a = 0; a < Math.PI * 2; a += 0.04) px(gd, 320 + Math.cos(a) * 44, 300 + Math.sin(a) * 18, 2, 1, '#bf9f6c');

  for (let x = 0; x < W; x += 34) addTree(x + 10, 70 + Math.floor(r() * 18), Math.floor(r() * 3));
  for (let x = 0; x < W; x += 40) addTree(x + 20, 398 + Math.floor(r() * 6), Math.floor(r() * 3));
  for (let y = 120; y < 390; y += 38) addTree(14 + Math.floor(r() * 8), y, Math.floor(r() * 3));
  for (const [x, y] of [[600, 140], [626, 178], [590, 330], [624, 360], [560, 112], [470, 104], [150, 118], [40, 140]]) addTree(x, y, Math.floor(r() * 3));

  for (const x of [180, 212, 244]) { mb.item(x, 228, logArt()); mb.wall(x - 6, 224, 12, 5); }
  for (const y of [170, 202]) { mb.item(470, y, targetArt()); mb.wall(465, y - 4, 10, 5); }
  mb.item(470, 236, standArt()); mb.wall(456, 232, 28, 5);
  mb.item(300, 183, practiceStandArt()); mb.wall(286, 176, 28, 7);
  mb.item(132, 314, rockArt()); mb.wall(117, 306, 30, 8);
  mb.item(417, 272, studyDeskArt()); mb.wall(401, 266, 32, 7);
  for (const [x, y] of [[192, 353], [222, 346], [251, 351]]) mb.item(x, y, courseStakeArt());
  for (let x = 195; x <= 250; x += 5) px(gd, x, 357, 3, 1, '#b99264');
  mb.item(420, 140, fenceArt(120, 'wood')); mb.wall(360, 137, 120, 4);

  treeImgs.forEach((img, slot) => img.addEventListener('load', () => { for (const t of mb.things) if (t.img === trees[slot]) t.img = img; }));
  for (const t of mb.things) if (trees.includes(t.img as HTMLCanvasElement)) ovalpx(gd, Math.round(t.x) + 3, t.y - 1, 14, 3, '#7f9656');

  return {
    id: 'campo', name: 'Campo de Treino', region: 'Konohagakure · Arredores da Academia', w: W, h: H, ground,
    things: mb.things, walls: mb.walls, bounds: { x: 30, y: 104, w: W - 44, h: H - 120 }, lights: [{ x: 311, y: 165, r: 38 }, { x: 430, y: 257, r: 27 }],
    spots: [
      { id: 'troncos', x: 212, y: 244, r: 26, label: 'Troncos de treino' },
      { id: 'alvos', x: 440, y: 196, r: 26, label: 'Alvos de arremesso' },
      { id: 'meditacao', x: 132, y: 330, r: 22, label: 'Pedra de meditação' },
      { id: 'selos', x: 300, y: 196, r: 18, label: 'Posto de treino de jutsus' },
      { id: 'circuito', x: 222, y: 363, r: 23, label: 'Circuito de treino' },
      { id: 'estudo', x: 417, y: 286, r: 20, label: 'Mesa de estudos' },
    ],
    exits: [{ rect: { x: W - 30, y: 216, w: 30, h: 48 }, to: 'rua', arrive: { x: 34, y: 248, dir: 'right' }, label: 'Rua da Academia' }],
  };
}
