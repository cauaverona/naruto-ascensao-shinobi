import { insidePolygon } from '../core/geometry';

export const VALLEY_MAP_FLAG = 'vale-mapa-pixelart';
export const VALLEY_ENTRY = { x: 58, y: 253 };
export const VALLEY_LOOKOUT = { x: 134, y: 250 };
export const VALLEY_SHELTER = { x: 195, y: 259 };
export const VALLEY_SASUKE = { x: 512, y: 253 };

// A margem oeste se abre em um gramado. A faixa de pedra afunila sobre o rio.
export const VALLEY_FLOOR = [
  [9, 221], [68, 222], [74, 242], [112, 241], [122, 227], [138, 230], [149, 239],
  [169, 244], [212, 247], [252, 250], [286, 249], [330, 248], [376, 242], [415, 235],
  [451, 228], [513, 224], [551, 228], [573, 239], [573, 259], [556, 269], [515, 273],
  [492, 278], [449, 275], [412, 273], [378, 266], [344, 264], [315, 263], [286, 267],
  [245, 270], [223, 274], [199, 282], [178, 302], [165, 316], [20, 316], [9, 302],
];

export function onValleyFloor(x: number, y: number): boolean {
  return insidePolygon(x, y, VALLEY_FLOOR);
}
