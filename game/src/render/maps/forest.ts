import forestMapUrl from '../../assets/death-forest-map.png';
import { FOREST_FLOOR, FOREST_RETURN, FOREST_TOWER, onForestFloor } from '../../data/forest-map';
import { ctx, loadImage, offscreen, poly, px } from '../gfx';
import type { GameMap } from './types';

export function buildExamForest(): GameMap {
  const w = 760, h = 400;
  const ground = offscreen(w, h), g = ctx(ground);
  px(g, 0, 0, w, h, '#233c37');
  for (const path of FOREST_FLOOR) poly(g, path, '#776c55');

  const art = loadImage(forestMapUrl);
  const paint = () => g.drawImage(art, 0, 0, w, h);
  if (art.complete && art.naturalWidth) paint();
  else art.addEventListener('load', paint, { once: true });

  return {
    id: 'floresta', name: 'Floresta da Morte', region: 'País do Fogo', w, h, ground,
    things: [], walls: [], spots: [], lights: [{ ...FOREST_TOWER, r: 32 }],
    bounds: { x: 10, y: 24, w: 730, h: 355 }, walkable: onForestFloor,
    exits: [{ rect: FOREST_RETURN, to: 'rua', arrive: { x: 472, y: 232, dir: 'down' }, label: 'Voltar à Academia' }],
  };
}
