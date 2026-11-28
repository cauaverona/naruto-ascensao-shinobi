import valleyMapUrl from '../../assets/valley-map.png';
import { onValleyFloor, VALLEY_FLOOR } from '../../data/valley-map';
import { ctx, loadImage, offscreen, poly, px } from '../gfx';
import type { GameMap } from './types';

export function buildValley(): GameMap {
  const w = 600, h = 338;
  const ground = offscreen(w, h), g = ctx(ground);
  px(g, 0, 0, w, h, '#294b42');
  poly(g, VALLEY_FLOOR, '#a68b64');

  const art = loadImage(valleyMapUrl);
  const paint = () => g.drawImage(art, 0, 0, w, h);
  if (art.complete && art.naturalWidth) paint();
  else art.addEventListener('load', paint, { once: true });

  return {
    id: 'vale', name: 'Vale do Fim', region: 'Fronteira do País do Fogo', w, h, ground,
    things: [], walls: [], spots: [], lights: [],
    bounds: { x: 10, y: 221, w: 563, h: 95 }, walkable: onValleyFloor,
    exits: [{ rect: { x: 10, y: 241, w: 14, h: 27 }, to: 'rua', arrive: { x: 472, y: 232, dir: 'down' }, label: 'Voltar à Academia' }],
    ambient: (g, time, calm) => {
      if (calm) return;
      for (let i = 0; i < 10; i++) {
        const y = 56 + (time * (30 + i % 3 * 8) + i * 13) % 126;
        px(g, 286 + i * 8 - Math.floor((y - 56) / 46), y, 1, 3 + i % 3, 'rgba(209,249,230,.32)');
      }
      for (let i = 0; i < 5; i++) {
        const drift = (time * 12 + i * 21) % 86;
        px(g, 283 + drift, 220 + i * 3, 4, 1, 'rgba(189,239,222,.4)');
      }
    },
  };
}
