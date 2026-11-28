import { insidePolygon } from '../core/geometry';

export const SUNA_ENTRY = { x: 54, y: 169 };
export const SUNA_EXIT = { x: 10, y: 165, w: 14, h: 20 };
export const SUNA_WEST_POST = { x: 113, y: 153 };
export const SUNA_SOUTH_LOOKOUT = { x: 347, y: 209 };
export const SUNA_MESSENGER = { x: 457, y: 173 };
export const SUNA_INFIRMARY = { x: 412, y: 258 };
export const SUNA_TEA_HOUSE = { x: 282, y: 146 };
export const SUNA_SERVICE_GATE = { x: 560, y: 167 };
export const SUNA_SENSEI = { x: 49, y: 157 };
export const SUNA_TEAM = [{ x: 74, y: 179 }, { x: 94, y: 177 }] as const;

export const SUNA_FLOOR = [
  // Estrada pelo posto oeste e pela casa de chá até o portão.
  [[8, 166], [52, 152], [86, 148], [111, 146], [136, 150], [169, 155],
    [215, 151], [254, 145], [273, 139], [294, 139], [315, 145], [363, 151],
    [411, 156], [445, 150], [473, 145], [513, 137], [559, 137], [581, 130],
    [583, 114], [600, 106], [612, 95], [627, 85], [637, 83], [637, 97],
    [621, 117], [613, 130], [620, 145], [624, 157], [618, 178], [602, 193],
    [566, 201], [527, 202], [491, 191], [447, 184], [412, 184], [371, 182],
    [334, 180], [301, 173], [270, 172], [239, 179], [203, 190], [165, 194],
    [132, 188], [95, 183], [49, 183], [8, 188]],
  // Bifurcação sul. A trilha contorna o abrigo até a entrada voltada para baixo.
  [[325, 173], [352, 173], [363, 185], [358, 204], [353, 227], [357, 243],
    [371, 253], [393, 254], [429, 252], [464, 252], [492, 240], [524, 229],
    [559, 222], [590, 214], [621, 206], [634, 201], [636, 216], [606, 222],
    [571, 235], [538, 249], [505, 254], [474, 265], [438, 268], [395, 270],
    [365, 264], [348, 253], [337, 233], [337, 215], [343, 192], [331, 184]],
];

export function onSunaFloor(x: number, y: number): boolean {
  return SUNA_FLOOR.some(path => insidePolygon(x, y, path));
}

export function sunaRecoveryPoint(x: number, y: number) {
  const points = [
    SUNA_ENTRY, SUNA_WEST_POST, SUNA_TEA_HOUSE, { x: 333, y: 172 }, SUNA_SOUTH_LOOKOUT,
    SUNA_MESSENGER, SUNA_INFIRMARY, SUNA_SERVICE_GATE,
  ];
  return points.reduce((nearest, point) =>
    Math.hypot(point.x - x, point.y - y) < Math.hypot(nearest.x - x, nearest.y - y) ? point : nearest);
}
