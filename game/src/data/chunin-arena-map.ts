import { insidePolygon } from '../core/geometry';

export const ARENA_ENTRY = { x: 320, y: 288 };
export const ARENA_EXIT = { x: 294, y: 307, w: 52, h: 12 };
export const ARENA_PRELIMINARY = { x: 280, y: 170 };
export const ARENA_FINAL = { x: 360, y: 170 };
export const ARENA_RING = { x: 320, y: 170 };
export const ARENA_SENSEI = { x: 255, y: 226 };
export const ARENA_TEAM = [{ x: 233, y: 234 }, { x: 277, y: 234 }] as const;

export const ARENA_FLOOR = [
  // Caixa de areia e as aberturas na parte de baixo das arquibancadas.
  [[121, 108], [519, 108], [510, 133], [506, 160], [515, 174], [526, 179],
    [528, 200], [545, 201], [545, 211], [528, 226], [507, 238], [495, 248],
    [145, 248], [133, 238], [112, 226], [95, 211], [95, 201], [112, 200],
    [114, 179], [125, 173], [132, 151], [129, 131]],
  // Entrada sul pela escadaria, entre os pilares da mureta.
  [[294, 242], [345, 242], [345, 274], [352, 320], [287, 320], [294, 274]],
  // Passagens externas junto aos portões laterais.
  [[8, 186], [37, 184], [43, 153], [74, 153], [77, 185], [88, 188],
    [89, 203], [103, 203], [103, 211], [81, 211], [78, 209], [8, 204]],
  [[632, 186], [603, 184], [597, 153], [566, 153], [563, 185], [552, 188],
    [551, 203], [537, 203], [537, 211], [559, 211], [562, 209], [632, 204]],
];

export function onArenaFloor(x: number, y: number): boolean {
  return ARENA_FLOOR.some(path => insidePolygon(x, y, path));
}

export function arenaRecoveryPoint(x: number, y: number) {
  return { x: Math.max(145, Math.min(495, x)), y: Math.max(116, Math.min(235, y)) };
}
