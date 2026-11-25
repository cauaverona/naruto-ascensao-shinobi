// Sala de aula de Iruka (interior novo da v0.3.0).
import { ctx, offscreen, px, tiles, poly, makeRandom } from '../gfx';
import { MapBuilder, type GameMap } from './types';

const W = 480, H = 270;

function deskArt() {
  const c = offscreen(36, 18), g = ctx(c);
  px(g, 0, 2, 36, 5, '#8a5e3a'); px(g, 0, 2, 36, 1, '#c08b58'); px(g, 0, 6, 36, 2, '#5f3f27');
  px(g, 2, 8, 3, 10, '#5f3f27'); px(g, 31, 8, 3, 10, '#5f3f27');
  px(g, 6, 3, 8, 3, '#efe3c3'); px(g, 7, 4, 6, 1, '#b8ab8c'); // caderno
  px(g, 22, 3, 6, 2, '#6a7aa0');
  return c;
}

function lecternArt() {
  const c = offscreen(40, 22), g = ctx(c);
  px(g, 0, 0, 40, 6, '#7d532f'); px(g, 0, 0, 40, 1, '#c7935e'); px(g, 2, 6, 36, 16, '#6a4527'); px(g, 4, 8, 32, 12, '#83593a');
  px(g, 6, 1, 10, 3, '#efe3c3'); px(g, 24, 1, 9, 4, '#8f3d30');
  return c;
}

export function buildClassroom(): GameMap {
  const ground = offscreen(W, H), gd = ctx(ground), mb = new MapBuilder(), T = tiles();
  const r = makeRandom(31);
  for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) gd.drawImage(T.wood[Math.floor(r() * 8)], x, y);
  // Parede do fundo
  px(gd, 0, 0, W, 78, '#e2cfa6'); px(gd, 0, 58, W, 20, '#9b6a43'); px(gd, 0, 58, W, 2, '#c6935f'); px(gd, 0, 76, W, 3, '#5d3d26');
  for (let x = 0; x < W; x += 40) px(gd, x, 0, 3, 58, '#c9b48b');
  // Quadro-negro
  px(gd, 146, 12, 188, 44, '#5c3d27'); px(gd, 150, 15, 180, 38, '#2f4a3c'); px(gd, 150, 15, 180, 2, '#3f6250');
  px(gd, 160, 23, 40, 1, '#cfd8cc'); px(gd, 160, 28, 62, 1, '#cfd8cc'); px(gd, 160, 33, 30, 1, '#cfd8cc');
  gd.fillStyle = '#e4ead8'; gd.font = 'bold 14px serif'; gd.fillText('忍', 288, 40);
  px(gd, 150, 53, 180, 2, '#7b5434'); px(gd, 170, 52, 6, 1, '#f1f1e8');
  // Janelas laterais com luz
  for (const x of [28, 404]) { px(gd, x, 14, 48, 34, '#5d3d26'); px(gd, x + 3, 17, 42, 28, '#a9cfe0'); px(gd, x + 23, 17, 2, 28, '#5d3d26'); px(gd, x + 3, 30, 42, 2, '#5d3d26'); px(gd, x + 5, 19, 10, 2, '#d8eef5'); }
  // Pergaminho pendurado
  px(gd, 360, 14, 22, 40, '#efe2c1'); px(gd, 358, 12, 26, 3, '#6a4527'); px(gd, 358, 53, 26, 3, '#6a4527');
  gd.fillStyle = '#5b2f24'; gd.font = '12px serif'; gd.fillText('火', 365, 32); gd.fillText('意', 365, 47);
  // Luz das janelas no piso
  gd.fillStyle = 'rgba(255,240,200,.10)';
  poly(gd, [[30, 80], [80, 80], [140, 170], [70, 170]], 'rgba(255,240,200,.10)');
  poly(gd, [[400, 80], [450, 80], [420, 170], [350, 170]], 'rgba(255,240,200,.10)');
  // Porta
  px(gd, 220, 254, 40, 16, '#3d2a1b'); px(gd, 222, 256, 36, 14, '#6e4a2c');

  mb.item(240, 112, lecternArt()); mb.wall(220, 92, 40, 20);
  for (const y of [130, 162]) for (const x of [196, 240, 284]) { mb.item(x, y, deskArt()); mb.wall(x - 18, y - 16, 36, 10); }
  for (const x of [120, 360]) for (const y of [130, 162]) { mb.item(x, y, deskArt()); mb.wall(x - 18, y - 16, 36, 10); }

  return {
    id: 'sala', name: 'Sala de aula de Iruka', region: 'Academia Ninja · Konohagakure', w: W, h: H, ground, interior: true,
    things: mb.things, walls: mb.walls, bounds: { x: 24, y: 84, w: W - 48, h: 172 }, lights: [],
    spots: [{ id: 'carteira', x: 240, y: 170, r: 14, label: 'Sua carteira' }],
    exits: [{ rect: { x: 214, y: 250, w: 52, h: 20 }, to: 'rua', arrive: { x: 450, y: 204, dir: 'down' }, label: 'Rua da Academia' }],
  };
}
