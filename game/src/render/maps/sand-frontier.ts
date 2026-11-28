import sunaMapUrl from '../../assets/sand-frontier-map.png';
import { onSunaFloor, SUNA_EXIT, SUNA_FLOOR } from '../../data/sand-frontier-map';
import { ctx, loadImage, offscreen, poly, px } from '../gfx';
import type { GameMap } from './types';

export function buildSandFrontier(): GameMap {
  const w = 640, h = 320;
  const ground = offscreen(w, h), g = ctx(ground);
  px(g, 0, 0, w, h, '#a86e61');
  for (const path of SUNA_FLOOR) poly(g, path, '#d09a76');

  const art = loadImage(sunaMapUrl);
  const paint = () => g.drawImage(art, 0, 0, w, h);
  if (art.complete && art.naturalWidth) paint();
  else art.addEventListener('load', paint, { once: true });

  return {
    id: 'suna', name: 'Fronteira da Areia', region: 'Sunagakure', w, h, ground,
    things: [], walls: [], spots: [], lights: [
      { x: 101, y: 130, r: 23 }, { x: 291, y: 111, r: 29 },
      { x: 381, y: 227, r: 27 }, { x: 487, y: 130, r: 24 }, { x: 624, y: 156, r: 24 },
    ],
    bounds: { x: 10, y: 84, w: 626, h: 186 }, walkable: onSunaFloor,
    exits: [{ rect: SUNA_EXIT, to: 'rua', arrive: { x: 472, y: 232, dir: 'down' }, label: 'Voltar à Academia' }],
  };
}
