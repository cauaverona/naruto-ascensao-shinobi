import { insidePolygon } from '../core/geometry';

export const ROAD_ENTRY = { x: 54, y: 184 };
export const ROAD_TRACKS = { id: 'ondas-rastros', label: 'Marcas de carroça', x: 245, y: 195, r: 24 };
export const ROAD_CAMP = { id: 'ondas-acampamento', label: 'Acampamento da escolta', x: 514, y: 135, r: 24 };
export const ROAD_BOAT = { x: 486, y: 124 };
export const ROAD_EXIT = { x: 10, y: 175, w: 13, h: 18 };
export const ROAD_RETURN = { x: 650, y: 249, dir: 'down' } as const;
export const ROAD_SENSEI = { x: 519, y: 111 };
export const ROAD_TEAM = [{ x: 548, y: 139 }, { x: 577, y: 133 }] as const;
export const ROAD_TAZUNA = { x: 498, y: 114 };

export const ROAD_FLOOR = [
  // Estrada, desvio das rodas e tablado da ponte.
  [[8, 175], [135, 176], [162, 168], [188, 163], [207, 167], [230, 174],
    [279, 175], [308, 172], [381, 171], [397, 174], [425, 167], [453, 156],
    [483, 151], [540, 150], [561, 144], [575, 136], [587, 120], [602, 105],
    [610, 100], [621, 97], [632, 107], [632, 117], [618, 131], [601, 138],
    [590, 155], [575, 169], [553, 175], [480, 173], [453, 175], [430, 185],
    [397, 191], [381, 190], [308, 191], [281, 192], [263, 202], [236, 207],
    [218, 201], [203, 192], [188, 185], [166, 187], [141, 193], [8, 193]],
  // Acampamento entre a barraca e a trilha, com acesso à rampa do barco.
  [[480, 117], [496, 109], [546, 108], [573, 117], [597, 102], [613, 105],
    [616, 120], [593, 137], [579, 153], [553, 160], [519, 161], [476, 162],
    [480, 142], [486, 130], [480, 126]],
];

export function onRoadFloor(x: number, y: number): boolean {
  return ROAD_FLOOR.some(path => insidePolygon(x, y, path));
}

export function roadRecoveryPoint(x: number, y: number) {
  const points = x < 350
    ? [ROAD_ENTRY, { x: 163, y: 179 }, ROAD_TRACKS, { x: 328, y: 182 }]
    : [{ x: 365, y: 182 }, { x: 429, y: 176 }, ROAD_CAMP, ROAD_BOAT, { x: 570, y: 147 }];
  return points.reduce((nearest, point) =>
    Math.hypot(point.x - x, point.y - y) < Math.hypot(nearest.x - x, nearest.y - y) ? point : nearest);
}
