import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/data/classic';
import { FOREST_ROUTES, type ForestRoute } from '../src/data/chunin';
import { FOREST_ENTRY, FOREST_RETURN, FOREST_SENSEI, FOREST_TEAM, forestRecoveryPoint, onForestFloor } from '../src/data/forest-map';
import { RESCUE_BRIEFING, RESCUE_EXIT, RESCUE_PATHS } from '../src/systems/rescue';

const WIDTH = 760, HEIGHT = 400;
const OFFSETS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function reachable(route: ForestRoute) {
  const visited = new Uint8Array(WIDTH * HEIGHT);
  const queue = [FOREST_ENTRY.y * WIDTH + FOREST_ENTRY.x];
  for (const index of queue) {
    const x = index % WIDTH, y = Math.floor(index / WIDTH);
    for (const [dx, dy] of OFFSETS) {
      const nx = x + dx, ny = y + dy, next = ny * WIDTH + nx;
      // Feche a outra travessia para provar que a escolhida basta.
      if (visited[next] || nx < 10 || nx >= WIDTH || ny < 24 || ny >= HEIGHT || !onForestFloor(nx, ny)) continue;
      if (nx >= 205 && nx <= 248 && (route === 'norte' ? ny > 200 : ny < 200)) continue;
      visited[next] = 1;
      queue.push(next);
    }
  }
  return (x: number, y: number) => visited[y * WIDTH + x] === 1;
}

describe('Terreno da Floresta da Morte', () => {
  it.each(['norte', 'sul'] as const)('liga os objetivos do exame e do resgate pela rota %s', route => {
    const canReach = reachable(route);
    const points = [
      ...Object.values(FOREST_ROUTES[route]).filter(point => typeof point !== 'string'),
      ...Object.values(RESCUE_PATHS[route]), RESCUE_BRIEFING, RESCUE_EXIT, FOREST_SENSEI, ...FOREST_TEAM,
      ...CHAPTERS.filter(chapter => chapter.area === 'floresta' && chapter.id !== 'ceu'),
      { x: FOREST_RETURN.x + 4, y: FOREST_ENTRY.y },
      { x: 421, y: 363 },
    ];
    for (const point of points) expect(canReach(point.x, point.y), JSON.stringify(point)).toBe(true);
  });

  it('bloqueia a água e os troncos fora das passagens', () => {
    for (const [x, y] of [[223, 161], [220, 280], [240, 329], [421, 188], [681, 114]]) {
      expect(onForestFloor(x, y)).toBe(false);
    }
  });

  it('recupera posições antigas fora da trilha na margem correspondente', () => {
    for (const [x, y] of [[209, 82], [254, 213], [350, 150], [550, 288], [722, 100]]) {
      const point = forestRecoveryPoint(x, y);
      expect(onForestFloor(point.x, point.y)).toBe(true);
      expect(point.x >= 295).toBe(x >= 295);
    }
  });
});
