import roadMapUrl from '../../assets/waves-road-map.png';
import { ROAD_EXIT, ROAD_FLOOR, ROAD_RETURN, onRoadFloor } from '../../data/waves-road-map';
import { ctx, loadImage, offscreen, poly, px } from '../gfx';
import type { GameMap } from './types';

export function buildWavesRoad(): GameMap {
  const w = 640, h = 320;
  const ground = offscreen(w, h), g = ctx(ground);
  px(g, 0, 0, w, h, '#435953');
  for (const path of ROAD_FLOOR) poly(g, path, '#956b58');

  const art = loadImage(roadMapUrl);
  const paint = () => g.drawImage(art, 0, 0, w, h);
  if (art.complete && art.naturalWidth) paint();
  else art.addEventListener('load', paint, { once: true });

  return {
    id: 'estrada', name: 'Estrada do riacho', region: 'Rota para o País das Ondas', w, h, ground,
    things: [], walls: [{ x: 527, y: 120, w: 18, h: 7 }], spots: [], lights: [],
    bounds: { x: 10, y: 92, w: 621, h: 116 }, walkable: onRoadFloor,
    exits: [{ rect: ROAD_EXIT, to: 'rua', arrive: ROAD_RETURN, label: 'Voltar a Konoha' }],
  };
}
