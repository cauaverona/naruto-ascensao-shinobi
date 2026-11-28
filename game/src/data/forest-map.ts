import { insidePolygon } from '../core/geometry';

export const FOREST_ENTRY = { x: 54, y: 174 };
export const FOREST_RETURN = { x: 10, y: 163, w: 15, h: 20 };
export const FOREST_EARTH = { x: 621, y: 197 };
export const FOREST_TOWER = { x: 678, y: 159 };
export const FOREST_SENTINEL = { x: 590, y: 181 };
export const FOREST_SENSEI = { x: 36, y: 168 };
export const FOREST_TEAM = [{ x: 145, y: 103 }, { x: 138, y: 259 }] as const;

// As poligonais seguem o piso pintado, inclusive o tablado e os topos das pedras.
export const FOREST_FLOOR = [
  // Entrada, curva norte e passarela.
  [[8, 164], [54, 166], [71, 159], [88, 144], [103, 121], [124, 108], [145, 99],
    [175, 96], [202, 101], [288, 101], [312, 101], [312, 119], [288, 119],
    [202, 120], [173, 116], [149, 119], [129, 128], [115, 141], [100, 161],
    [84, 177], [63, 184], [42, 183], [8, 181]],
  // Curva sul e pedras do vau.
  [[55, 168], [79, 165], [86, 189], [102, 222], [119, 237], [151, 242],
    [177, 246], [295, 246], [311, 239], [326, 237], [333, 249], [312, 254],
    [296, 261], [176, 263], [145, 263], [110, 254], [90, 235], [72, 208], [62, 184]],
  // Trilha na margem leste, saindo da passarela.
  [[298, 101], [320, 98], [345, 101], [376, 104], [412, 94], [463, 88], [498, 88],
    [526, 98], [549, 118], [558, 141], [575, 150], [600, 152], [600, 174],
    [565, 172], [545, 160], [536, 148], [532, 129], [512, 117], [489, 108], [465, 108],
    [415, 112], [379, 122], [347, 121], [320, 116], [298, 121]],
  // Trilha na margem leste, saindo do vau.
  [[298, 239], [320, 229], [347, 229], [378, 235], [407, 235], [444, 229],
    [481, 228], [506, 224], [529, 211], [550, 196], [577, 192], [592, 205],
    [563, 215], [538, 223], [514, 236], [485, 243], [445, 245], [410, 251],
    [376, 251], [347, 245], [323, 246], [298, 257]],
  // Clareira e degraus diante da torre.
  [[570, 158], [616, 157], [655, 151], [666, 144], [693, 145], [700, 155],
    [715, 157], [720, 177], [714, 195], [708, 219], [680, 243], [657, 262],
    [632, 268], [610, 247], [593, 232], [565, 223], [549, 208], [563, 187]],
  // Trilha que contorna a clareira por baixo e volta até a margem.
  [[272, 331], [311, 344], [353, 353], [406, 355], [456, 350], [503, 339],
    [540, 323], [568, 298], [586, 271], [613, 244], [637, 231], [646, 249],
    [625, 263], [606, 283], [599, 314], [570, 338], [537, 350], [501, 363],
    [456, 372], [406, 377], [350, 374], [299, 363], [269, 346]],
];

export function onForestFloor(x: number, y: number): boolean {
  return FOREST_FLOOR.some(path => insidePolygon(x, y, path));
}

export function forestRecoveryPoint(x: number, y: number) {
  const points = x >= 295
    ? [{ x: 321, y: 110 }, { x: 333, y: 240 }, FOREST_EARTH, FOREST_TOWER]
    : [FOREST_ENTRY, { x: 157, y: 110 }, { x: 147, y: 252 }];
  return points.reduce((nearest, point) =>
    Math.hypot(point.x - x, point.y - y) < Math.hypot(nearest.x - x, nearest.y - y) ? point : nearest);
}
