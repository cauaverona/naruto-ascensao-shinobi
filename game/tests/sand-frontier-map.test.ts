import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/data/classic';
import {
  onSunaFloor, sunaRecoveryPoint, SUNA_ENTRY, SUNA_EXIT, SUNA_SENSEI, SUNA_SERVICE_GATE, SUNA_TEA_HOUSE, SUNA_TEAM,
} from '../src/data/sand-frontier-map';
import { SUNA_GUARDS, SUNA_LEADS } from '../src/systems/suna';

describe('Fronteira da Areia', () => {
  it('liga a saída, a casa de chá, o abrigo e a passagem de serviço', () => {
    const points = [
      { x: SUNA_EXIT.x + 4, y: SUNA_ENTRY.y }, SUNA_ENTRY, { x: 100, y: 166 }, SUNA_GUARDS[0],
      { x: 144, y: 167 }, { x: 256, y: 161 }, SUNA_TEA_HOUSE, { x: 309, y: 159 },
      { x: 341, y: 176 }, SUNA_GUARDS[1], { x: 346, y: 232 }, { x: 354, y: 248 },
      { x: 373, y: 259 }, SUNA_LEADS.enfermaria,
    ];
    const gatePath = [{ x: 341, y: 176 }, SUNA_LEADS.carta, SUNA_SERVICE_GATE, { x: 602, y: 137 }, { x: 600, y: 117 }];
    for (const path of [points, gatePath]) {
      for (let index = 1; index < path.length; index++) {
        const from = path[index - 1], to = path[index];
        const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y));
        for (let step = 0; step <= steps; step++) {
          const x = from.x + (to.x - from.x) * step / steps;
          const y = from.y + (to.y - from.y) * step / steps;
          expect(onSunaFloor(x, y), `${x}, ${y}`).toBe(true);
        }
      }
    }
    for (const point of [SUNA_SENSEI, ...SUNA_TEAM]) expect(onSunaFloor(point.x, point.y)).toBe(true);
    expect(CHAPTERS.find(({ id }) => id === 'gaara')).toMatchObject(SUNA_SERVICE_GATE);
    expect(CHAPTERS.find(({ id }) => id === 'tsunade')).toMatchObject(SUNA_TEA_HOUSE);
  });

  it('bloqueia paredes e rochedos e recupera posições antigas', () => {
    for (const [x, y] of [[106, 129], [282, 103], [415, 236], [507, 208], [285, 233]]) {
      expect(onSunaFloor(x, y)).toBe(false);
      const point = sunaRecoveryPoint(x, y);
      expect(onSunaFloor(point.x, point.y)).toBe(true);
    }
  });
});
