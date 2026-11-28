import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/data/classic';
import { WAVE_STOPS } from '../src/systems/waves';
import {
  onVillageFloor, villageRecoveryPoint, VILLAGE_ENTRY, VILLAGE_EXIT, VILLAGE_SENSEI, VILLAGE_TEAM,
} from '../src/data/waves-village-map';

describe('Vila da Ponte', () => {
  it('permite sair do cais, investigar a margem e atravessar a obra', () => {
    const points = [
      WAVE_STOPS.haku[1], VILLAGE_ENTRY, WAVE_STOPS.haku[0], { x: 181, y: 238 }, { x: 165, y: 222 },
      CHAPTERS[1], { x: 172, y: 183 }, { x: 188, y: 153 }, { x: 285, y: 147 },
      WAVE_STOPS.zabuza[0], WAVE_STOPS.zabuza[1], CHAPTERS[2],
    ];
    for (let index = 1; index < points.length; index++) {
      const a = points[index - 1], b = points[index], steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
      for (let step = 0; step <= steps; step++) {
        const x = a.x + (b.x - a.x) * step / steps, y = a.y + (b.y - a.y) * step / steps;
        expect(onVillageFloor(x, y), `${x}, ${y}`).toBe(true);
      }
    }
    for (let x = VILLAGE_EXIT.x; x <= 190; x++) expect(onVillageFloor(x, 151)).toBe(true);
    for (const point of [VILLAGE_SENSEI, ...VILLAGE_TEAM]) expect(onVillageFloor(point.x, point.y)).toBe(true);
  });

  it('protege a margem, a água sob a ponte e o vão da obra', () => {
    for (const [x, y] of [[309, 241], [403, 166], [603, 135], [559, 173], [127, 102]]) {
      expect(onVillageFloor(x, y)).toBe(false);
    }
    for (const [x, y] of [[80, 202], [280, 180], [525, 165], [560, 260]]) {
      const point = villageRecoveryPoint(x, y);
      expect(onVillageFloor(point.x, point.y)).toBe(true);
      expect(point.x >= 355).toBe(x >= 355);
    }
  });
});
