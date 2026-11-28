import { insidePolygon } from '../core/geometry';

export const VILLAGE_ENTRY = { x: 277, y: 241 };
export const VILLAGE_EXIT = { x: 10, y: 139, w: 14, h: 23 };
export const VILLAGE_HAKU = { x: 162, y: 214 };
export const VILLAGE_CRATE = { x: 216, y: 235 };
export const VILLAGE_MOORING = { x: 293, y: 241 };
export const VILLAGE_WINCH = { x: 365, y: 134 };
export const VILLAGE_DECK = { x: 483, y: 133 };
export const VILLAGE_ZABUZA = { x: 543, y: 141 };
export const VILLAGE_SENSEI = { x: 255, y: 236 };
export const VILLAGE_TEAM = [{ x: 226, y: 234 }, { x: 265, y: 247 }] as const;

export const VILLAGE_FLOOR = [
  // Rua de acesso às casas e à ponte.
  [[8, 138], [50, 138], [77, 133], [91, 119], [105, 116], [119, 126],
    [138, 123], [157, 112], [170, 115], [190, 129], [215, 134], [250, 134],
    [284, 135], [319, 129], [327, 149], [310, 158], [271, 159], [240, 160],
    [211, 166], [190, 174], [161, 170], [143, 163], [107, 161], [63, 162], [8, 162]],
  // Travessa à margem, com o caminho do poço até o cais.
  [[171, 154], [197, 155], [207, 167], [185, 179], [174, 194], [167, 209],
    [171, 219], [188, 232], [202, 232], [216, 234], [236, 232], [299, 232],
    [300, 250], [229, 250], [210, 257], [187, 254], [167, 249], [153, 239],
    [147, 224], [147, 203], [154, 188], [160, 174]],
  // Trilha de pesca ao sul.
  [[172, 239], [190, 246], [178, 263], [157, 273], [143, 287], [126, 304],
    [110, 305], [117, 290], [137, 271], [149, 253]],
  // Lajes da ponte até o limite da obra.
  [[307, 133], [328, 125], [389, 126], [415, 116], [449, 115],
    [497, 116], [536, 119], [565, 117], [576, 122], [574, 145],
    [560, 151], [520, 153], [472, 150], [417, 151], [370, 150], [316, 151]],
];

export function onVillageFloor(x: number, y: number): boolean {
  return VILLAGE_FLOOR.some(path => insidePolygon(x, y, path));
}

export function villageRecoveryPoint(x: number, y: number) {
  const points = x >= 355
    ? [VILLAGE_WINCH, VILLAGE_DECK, VILLAGE_ZABUZA]
    : [{ x: 56, y: 150 }, { x: 157, y: 152 }, { x: 294, y: 147 }, VILLAGE_HAKU, VILLAGE_CRATE, VILLAGE_ENTRY];
  return points.reduce((nearest, point) =>
    Math.hypot(point.x - x, point.y - y) < Math.hypot(nearest.x - x, nearest.y - y) ? point : nearest);
}
