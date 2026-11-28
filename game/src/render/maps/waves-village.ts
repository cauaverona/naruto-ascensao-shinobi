import villageMapUrl from '../../assets/waves-village-map.png';
import { onVillageFloor, VILLAGE_EXIT, VILLAGE_FLOOR } from '../../data/waves-village-map';
import { ctx, loadImage, offscreen, poly, px } from '../gfx';
import type { GameMap } from './types';

export function buildWavesVillage(): GameMap {
  const w = 640, h = 320;
  const ground = offscreen(w, h), g = ctx(ground);
  px(g, 0, 0, w, h, '#344c58');
  for (const path of VILLAGE_FLOOR) poly(g, path, '#918476');

  const art = loadImage(villageMapUrl);
  const paint = () => g.drawImage(art, 0, 0, w, h);
  if (art.complete && art.naturalWidth) paint();
  else art.addEventListener('load', paint, { once: true });

  return {
    id: 'ondas', name: 'Vila da ponte', region: 'País das Ondas', w, h, ground,
    things: [], walls: [], spots: [], lights: [{ x: 93, y: 117, r: 24 }, { x: 161, y: 115, r: 24 }],
    bounds: { x: 10, y: 110, w: 565, h: 196 }, walkable: onVillageFloor,
    exits: [{ rect: VILLAGE_EXIT, to: 'rua', arrive: { x: 472, y: 232, dir: 'down' }, label: 'Voltar à Academia' }],
  };
}
