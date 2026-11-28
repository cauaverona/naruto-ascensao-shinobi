import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/data/classic';
import {
  onRoadFloor, roadRecoveryPoint, ROAD_BOAT, ROAD_CAMP, ROAD_ENTRY, ROAD_EXIT, ROAD_SENSEI,
  ROAD_TAZUNA, ROAD_TEAM, ROAD_TRACKS,
} from '../src/data/waves-road-map';

describe('Estrada do Riacho', () => {
  it('liga a saída, as marcas de carroça e a ponte ao acampamento e ao barco', () => {
    const waypoints = [
      { x: ROAD_EXIT.x + 4, y: ROAD_ENTRY.y }, ROAD_ENTRY, { x: 146, y: 183 },
      { x: 188, y: 178 }, ROAD_TRACKS, { x: 280, y: 184 }, { x: 405, y: 182 },
      { x: 474, y: 160 }, { x: 501, y: 154 }, ROAD_CAMP, ROAD_BOAT,
    ];
    for (let index = 1; index < waypoints.length; index++) {
      const a = waypoints[index - 1], b = waypoints[index];
      const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
      for (let step = 0; step <= steps; step++) {
        const x = a.x + (b.x - a.x) * step / steps, y = a.y + (b.y - a.y) * step / steps;
        expect(onRoadFloor(x, y), `${x}, ${y}`).toBe(true);
      }
    }
    expect(CHAPTERS[0]).toMatchObject(ROAD_BOAT);
    for (const point of [ROAD_SENSEI, ROAD_TAZUNA, ...ROAD_TEAM]) expect(onRoadFloor(point.x, point.y)).toBe(true);
  });

  it('bloqueia a água e recupera saves antigos na margem correspondente', () => {
    expect(onRoadFloor(350, 148)).toBe(false);
    expect(onRoadFloor(350, 210)).toBe(false);
    expect(onRoadFloor(454, 118)).toBe(false);
    for (const [x, y] of [[87, 110], [252, 247], [420, 234], [589, 229]]) {
      const point = roadRecoveryPoint(x, y);
      expect(onRoadFloor(point.x, point.y)).toBe(true);
      expect(point.x >= 350).toBe(x >= 350);
    }
  });
});
