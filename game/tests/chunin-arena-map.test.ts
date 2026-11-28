import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/data/classic';
import {
  ARENA_ENTRY, ARENA_EXIT, ARENA_RING, ARENA_SENSEI, ARENA_TEAM, arenaRecoveryPoint, onArenaFloor,
} from '../src/data/chunin-arena-map';

describe('Arena Chūnin', () => {
  it('liga a escadaria sul aos duelos, à equipe e ao retorno à Academia', () => {
    expect(ARENA_ENTRY.y).toBeLessThan(ARENA_EXIT.y);
    for (let y = ARENA_RING.y; y <= ARENA_EXIT.y; y++) expect(onArenaFloor(ARENA_ENTRY.x, y)).toBe(true);
    const stops = [...CHAPTERS.filter(chapter => chapter.area === 'arena'), ARENA_SENSEI, ...ARENA_TEAM];
    for (const point of stops) {
      const step = point.x < ARENA_RING.x ? -1 : 1;
      for (let x = ARENA_RING.x; x !== point.x; x += step) expect(onArenaFloor(x, point.y)).toBe(true);
      expect(onArenaFloor(point.x, point.y)).toBe(true);
    }
  });

  it('mantém as passagens laterais acessíveis sem atravessar as arquibancadas', () => {
    for (const [x, y] of [[58, 174], [62, 193], [85, 197], [98, 206], [582, 174], [542, 206]]) {
      expect(onArenaFloor(x, y)).toBe(true);
    }
    for (let x = 67; x <= 110; x++) {
      expect(onArenaFloor(x, 206)).toBe(true);
      expect(onArenaFloor(640 - x, 206)).toBe(true);
    }
    for (const [x, y] of [[120, 287], [100, 96], [450, 75], [320, 84], [540, 145]]) {
      expect(onArenaFloor(x, y)).toBe(false);
    }
    for (const [x, y] of [[45, 141], [380, 75], [520, 286]]) {
      const point = arenaRecoveryPoint(x, y);
      expect(onArenaFloor(point.x, point.y)).toBe(true);
    }
  });
});
