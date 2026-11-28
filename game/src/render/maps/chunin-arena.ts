import arenaMapUrl from '../../assets/chunin-arena-map.png';
import { ARENA_EXIT, ARENA_FLOOR, onArenaFloor } from '../../data/chunin-arena-map';
import { ctx, loadImage, offscreen, poly, px } from '../gfx';
import type { GameMap } from './types';

export function buildChuninArena(): GameMap {
  const w = 640, h = 320;
  const ground = offscreen(w, h), g = ctx(ground);
  px(g, 0, 0, w, h, '#625b4d');
  for (const path of ARENA_FLOOR) poly(g, path, '#c09b64');

  const art = loadImage(arenaMapUrl);
  const paint = () => g.drawImage(art, 0, 0, w, h);
  if (art.complete && art.naturalWidth) paint();
  else art.addEventListener('load', paint, { once: true });

  return {
    id: 'arena', name: 'Arena Chūnin', region: 'Konohagakure', w, h, ground,
    things: [], walls: [], spots: [], lights: [
      { x: 97, y: 183, r: 30 }, { x: 543, y: 183, r: 30 },
      { x: 257, y: 59, r: 34 }, { x: 382, y: 59, r: 34 },
    ],
    bounds: { x: 10, y: 108, w: 620, h: 210 }, walkable: onArenaFloor,
    exits: [{ rect: ARENA_EXIT, to: 'rua', arrive: { x: 472, y: 232, dir: 'down' }, label: 'Voltar à Academia' }],
  };
}
