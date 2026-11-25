// Sprites dos personagens: células nativas de 40 × 46 por pose, âncora no pé em (20,44).
// Linhas: 0 frente, 1 lado (direita; esquerda é espelhada), 2 costas. Quatro quadros de caminhada.
// O protagonista e os personagens originais com `look` são recoloridos a partir da folha base.
import type { Look, SpriteRole } from '../data/characters';
import { accessorySet, OUTFITS, SCARVES } from '../data/appearance';
import { offscreen, loadImage } from './gfx';
import { drawPlayerFace, drawPlayerHair, type HeadView } from './player-head';
export { CUTS } from './player-head';

const files = import.meta.glob('../assets/*-{walk,face,idle}.png', { eager: true, import: 'default' }) as Record<string, string>;
const ROLES: SpriteRole[] = ['player', 'iruka', 'emi', 'gen', 'naruto', 'sasuke', 'sakura'];
const art = Object.fromEntries(ROLES.map((r) => [r, {
  walk: loadImage(files[`../assets/${r}-walk.png`]),
  face: loadImage(files[`../assets/${r}-face.png`]),
  idle: loadImage(files[`../assets/${r}-idle.png`]),
}])) as Record<SpriteRole, { walk: HTMLImageElement; face: HTMLImageElement; idle: HTMLImageElement }>;

export const spritesReady = Promise.all(Object.values(art).flatMap((a) => [a.walk, a.face, a.idle]).map((i) => i.decode().catch(() => undefined)));

export const CELL_W = 40, CELL_H = 46, SOLE = 44;
export type Dir = 'up' | 'down' | 'left' | 'right';

export const clothes: Record<string, string[]> = {
  'Índigo': ['#252b48', '#455b88', '#879bc0'], Folha: ['#283b35', '#577757', '#a5b780'], Terracota: ['#553637', '#ad624b', '#dda075'], Ameixa: ['#403046', '#885b82', '#bf95a8'],
  Vermelho: ['#4a1d22', '#a53a3f', '#e0817e'], Laranja: ['#6a3010', '#d0702a', '#f4b070'], Amarelo: ['#6b5a1a', '#d1b53c', '#f2e07e'], Musgo: ['#2a3320', '#566b3a', '#a3b37a'],
  Cinza: ['#2e3338', '#6a737c', '#b8c0c6'], Branco: ['#7b8088', '#d4d8dc', '#fafbfb'], Preto: ['#101216', '#2e333b', '#5d6570'], Roxo: ['#2f2147', '#6a4a9e', '#b39ad8'],
  'Azul-claro': ['#27506f', '#4f94c4', '#a6d3ee'], Rosa: ['#6a2f47', '#c4668f', '#eeaac8'],
};
export const skinSet: Record<string, string[]> = {
  Clara: ['#9b6757', '#e8aa80', '#ffdbb1'], Dourada: ['#855140', '#cf9066', '#fac095'], Morena: ['#6e453d', '#ad7956', '#dda477'], Escura: ['#422e31', '#85593f', '#b88360'],
  'Pálida': ['#a87c72', '#f0c4a8', '#ffe8d2'], Bronzeada: ['#8e5a3e', '#d79a68', '#f4c394'], Oliva: ['#7b5b3d', '#c19a67', '#e4c590'], Marrom: ['#5a3a2c', '#9c6a48', '#cf9b74'],
};
export const hairSet: Record<string, string[]> = {
  Preto: ['#181c30', '#33394e', '#5a667c'], Castanho: ['#30202b', '#694635', '#a07852'], Loiro: ['#75532c', '#c99847', '#f1cb7b'], Ruivo: ['#522932', '#994739', '#d57b57'], Prateado: ['#45495b', '#8793a1', '#ced3ce'],
  Branco: ['#7d8591', '#c9ced3', '#f4f6f6'], Azul: ['#1f3b78', '#3f6fc2', '#86b2ee'], Rosa: ['#a24f78', '#e07fae', '#f7bcd6'], Verde: ['#2f5e3a', '#5c9a52', '#a5d08a'], Roxo: ['#47306f', '#7e5cb8', '#b9a0e6'],
  Vermelho: ['#6e1d25', '#b83442', '#ee7b7f'], Chocolate: ['#2a1810', '#5a3422', '#8c5c3c'], Laranja: ['#8a3f10', '#e27a22', '#f7b866'], Turquesa: ['#1d5a62', '#35a3aa', '#8fdcdc'],
};
/** Cor do detalhe (cachecol e faixas). 'Laranja' é o original do sprite e não recolore. */
export const trimSet: Record<string, string[]> = {
  Laranja: ['#8a4a1c', '#d77a2c', '#f0b266'], Vermelho: ['#5e1a22', '#b23a42', '#ec8085'], Branco: ['#80868e', '#d6dadf', '#fafbfb'], Preto: ['#0e1014', '#2c3138', '#5c6570'],
  Azul: ['#1d3466', '#3d68b8', '#86aee6'], Verde: ['#27502f', '#4f8f4c', '#9cca84'], Roxo: ['#3d2a62', '#7550ad', '#b79ae0'], Dourado: ['#7a5a12', '#d6a82e', '#f6dd84'],
};
/** Cor do pano da bandana de Konoha. */
export const bandSet: Record<string, string> = { Azul: '#2b3550', Preto: '#181a20', Vermelho: '#8e2a2f', Verde: '#2f5a3a', Roxo: '#4a3570', Branco: '#d8dce0', Laranja: '#c4682a' };
export const ACCESSORIES = ['Nenhum', 'Óculos', 'Máscara', 'Faixa na testa', 'Curativo', 'Óculos redondos', 'Brinco', 'Presilha'];
export const MARKS = ['Nenhuma', 'Cicatriz', 'Bigodes', 'Marcas vermelhas'];

export interface Actor { role: SpriteRole; look?: Look; bandana?: boolean }

const palettes = new Map<string[], number[][]>();
const frameCache = new Map<string, HTMLCanvasElement>();
spritesReady.then(() => frameCache.clear());

function rgb(hex: string) { return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); }
function shade(r: number, g: number, b: number, set: string[], range: [number, number]) {
  let colors = palettes.get(set);
  if (!colors) { colors = set.map(rgb); palettes.set(set, colors); }
  const lum = r * 0.24 + g * 0.54 + b * 0.22, t = Math.max(0, Math.min(2, ((lum - range[0]) * 2) / (range[1] - range[0])));
  const a = Math.min(1, Math.floor(t)), f = t - a;
  return colors[a].map((v, i) => Math.round(v + (colors![a + 1][i] - v) * f));
}

type Tri = string[];
type Ctx = CanvasRenderingContext2D;
const R = (c: Ctx, color: string, x: number, y: number, w: number, h: number) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
const SCARF_INK = new Set([0x674026, 0x7c4111, 0x905523, 0xa46633, 0xb86a29, 0xcb7026, 0xd88133, 0xe29755]);
const SCARF_EDGE = new Set([0x3f2415, 0x4e2912, 0x52301b, 0x593720]);
const indexAt = (x: number, y: number) => y * CELL_W + x;

function wardrobeMasks(d: Uint8ClampedArray, top: number) {
  const size = CELL_W * CELL_H;
  const solid = new Uint8Array(size), cloth = new Uint8Array(size);
  for (let y = top; y < SOLE; y++) for (let x = 0; x < CELL_W; x++) {
    const i = indexAt(x, y), k = i * 4, r = d[k], g = d[k + 1], b = d[k + 2];
    if (!d[k + 3]) continue;
    solid[i] = 1;
    const ink = (r << 16) | (g << 8) | b;
    if (y >= top + 11 && y <= top + 18 && SCARF_INK.has(ink)) cloth[i] = 1;
  }
  for (let y = top + 11; y <= top + 18; y++) for (let x = 1; x < CELL_W - 1; x++) {
    const i = indexAt(x, y), k = i * 4;
    if (solid[i] && SCARF_EDGE.has((d[k] << 16) | (d[k + 1] << 8) | d[k + 2])
      && [i - 1, i + 1, i - CELL_W, i + CELL_W].some((j) => cloth[j] === 1)) cloth[i] = 2;
  }
  return { solid, cloth };
}

function paintFaceMarks(g: Ctx, palette: Tri, mark: string | undefined, dir: HeadView, top: number, cx: number) {
  if (dir === 'up' || !mark || mark === 'Nenhuma') return;
  const im = g.getImageData(0, 0, CELL_W, CELL_H), d = im.data;
  const tones = new Set(palette.map((value) => parseInt(value.slice(1), 16)));
  const isSkin = (x: number, y: number) => {
    if (Math.abs(x - cx) > 7 || y < top + 7 || y > top + 11) return false;
    const k = indexAt(x, y) * 4;
    return !!d[k + 3] && tones.has((d[k] << 16) | (d[k + 1] << 8) | d[k + 2]);
  };
  const side = dir === 'right', y = top + 10;
  let rightCheek = cx + 4;
  if (side) {
    for (let x = CELL_W - 2; x > cx; x--) {
      if (isSkin(x, y) && isSkin(x - 1, y)) { rightCheek = x - 1; break; }
    }
  }
  const blend = (x: number, row: number, ink: ReadonlyArray<number>, opacity: number) => {
    const i = indexAt(x, row);
    if (!isSkin(x, row)) return;
    for (let c = 0; c < 3; c++) d[i * 4 + c] = Math.round(d[i * 4 + c] * (1 - opacity) + ink[c] * opacity);
  };
  const scar = [113, 48, 54], red = [171, 45, 52], whisker = [50, 37, 47];
  if (mark === 'Cicatriz') {
    const x = side ? rightCheek : cx + 3;
    blend(x, y - 1, scar, 0.66);
    blend(x - 1, y, scar, 0.85);
    blend(x - 2, y + 1, scar, 0.62);
  } else if (mark === 'Bigodes') {
    for (const [x, towardsNose] of side ? [[rightCheek, -1]] : [[cx - 4, 1], [cx + 4, -1]]) {
      blend(x, y, whisker, 0.86);
      blend(x + towardsNose, y, whisker, 0.68);
      blend(x + towardsNose, y + 1, whisker, 0.76);
    }
  } else if (mark === 'Marcas vermelhas') {
    for (const [x, towardsNose] of side ? [[rightCheek, -1]] : [[cx - 4, 1], [cx + 4, -1]]) {
      blend(x, y - 1, red, 0.75);
      blend(x, y, red, 0.87);
      blend(x + towardsNose, y, red, 0.60);
      blend(x + towardsNose, y + 1, red, 0.77);
    }
  }
  g.putImageData(im, 0, 0);
}

/** Choose shaded pixels inside the original torso, so clothes follow every pose. */
function outfitShade(outfit: string, dir: Dir, x: number, y: number, center: number) {
  const offset = x - center, distance = Math.abs(offset), front = dir === 'down', side = dir === 'right';
  if (outfit === OUTFITS[1]) {
    if (front && offset === 0 && y < 32) return y % 3 === 0 ? 2 : 0;
    if (y === 29 && distance > 3) return 2;
    return y < 25 ? 1 : null;
  }
  if (outfit === OUTFITS[2]) {
    if (y >= 24 && y <= 30 && distance <= (side ? 3 : 5)) {
      if (y === 27 || y === 30 || (front && offset === 0)) return 0;
      return y === 24 || y === 28 ? 2 : 1;
    }
    return 0;
  }
  if (outfit === OUTFITS[3]) {
    if (front && offset === Math.floor((y - 25) / 2) - 2) return 2;
    if (side && offset === 2) return 2;
    if (y === 30 || y === 31) return y === 30 ? 0 : 2;
    return y < 28 ? 1 : null;
  }
  if (outfit === OUTFITS[4]) {
    if (y <= (front ? 27 : 30)) return front && distance <= 2 ? 0 : y === 24 ? 2 : 1;
    return y === (front ? 28 : 31) ? 2 : 0;
  }
  if (outfit === OUTFITS[5]) {
    if (y === 28 && distance > 3) return 2;
    if (y >= 30 && distance <= 5) return 0;
    return y < 26 ? 2 : 1;
  }
  return null;
}

function shapeTorso(d: Uint8ClampedArray, top: number, cx: number, side: boolean) {
  const shoulder = side ? 0.86 : 0.80, waist = side ? 0.90 : 0.82;
  const taper = [0.93, shoulder, shoulder, shoulder, 0.88, waist, waist, 0.92, 1, side ? 1 : 1.06];
  for (const [i, scale] of taper.entries()) {
    const y = top + 13 + i;
    const offset = indexAt(0, y) * 4, row = d.slice(offset, offset + CELL_W * 4);
    for (let x = 0; x < CELL_W; x++) {
      const original = Math.round(cx + (x - cx) / scale);
      if (original < 0 || original >= CELL_W) { d[offset + x * 4 + 3] = 0; continue; }
      d.set(row.subarray(original * 4, original * 4 + 4), offset + x * 4);
    }
  }
}

function customize(canvas: HTMLCanvasElement, p: Look, dir: HeadView, frame: number, bandana: boolean, mirrored: boolean) {
  const g = canvas.getContext('2d', { willReadFrequently: true })!, im = g.getImageData(0, 0, CELL_W, CELL_H), d = im.data;
  let top = SOLE, left = 40, right = 0;
  for (let y = 0; y < SOLE; y++) for (let x = 0; x < CELL_W; x++) if (d[(y * CELL_W + x) * 4 + 3] > 0) top = Math.min(top, y);
  if (top === SOLE) return top;
  const height = SOLE - top, headEnd = top + (dir === 'up' ? 11 : 10), rise = top - 8;
  const trim = p.trim && p.trim !== 'Laranja' ? trimSet[p.trim] : null;
  const fabric = trimSet[p.trim ?? 'Laranja'] ?? trimSet.Laranja;
  const suit = clothes[p.coat] ?? clothes['Índigo'];
  const scarf = p.scarf ?? SCARVES[1];
  for (let y = top; y <= top + 6; y++) for (let x = 0; x < CELL_W; x++) {
    const k = (y * CELL_W + x) * 4;
    if (d[k + 3] && d[k + 2] > d[k] * 0.97 && d[k + 2] >= d[k + 1] * 0.98) {
      left = Math.min(left, x); right = Math.max(right, x);
    }
  }
  if (right <= left) return top;
  const center = Math.round((left + right) / 2);
  const { solid, cloth } = wardrobeMasks(d, top);
  const feminine = p.sex === 'Feminino';
  const skin = skinSet[p.skin] ?? skinSet.Dourada;
  const hair = hairSet[p.hair] ?? hairSet.Preto;
  for (let y = top; y < SOLE; y++) for (let x = 0; x < CELL_W; x++) {
    const i = indexAt(x, y), k = i * 4;
    if (!d[k + 3]) continue;
    const r = d[k], gg = d[k + 1], b = d[k + 2];
    let color: number[] | null = null;
    const blue = b > r * 0.97 && b >= gg * 0.98, face = y <= headEnd;
    // Laranja bem saturado = cachecol e faixas do traje (a pele é bem menos saturada).
    const orange = r > 90 && (r - b) / r > 0.6 && gg > b * 1.25 && gg < r * 0.82;
    const scarfPixel = cloth[i];
    const contour = !solid[i - 1] || !solid[i + 1] || !solid[i - CELL_W] || !solid[i + CELL_W];
    // The original head is only an anchor. Every selected hairstyle draws its own silhouette.
    if (y <= top + 10 || (y === top + 11 && !scarfPixel && Math.abs(x - center) <= 8)) {
      d[k + 3] = 0;
      continue;
    }
    if (scarfPixel && scarf !== SCARVES[1]) {
      const offset = x - center;
      const side = dir === 'right', back = dir === 'up';
      const tail = side ? offset < -2 || offset > 5 : offset < -5 || offset > 5;
      if (tail) { d[k + 3] = 0; continue; }
      const row = y - top, collar = back ? 11 : 12;
      const outer = side ? offset === -2 || offset === 5 : Math.abs(offset) === 5;
      if (scarf === SCARVES[3] && row >= collar && row <= collar + 3) {
        color = rgb(fabric[contour || outer ? 0 : row === collar + 1 ? 2 : 1]);
      } else if (scarf === SCARVES[2] && (row === collar || row === collar + 1
        || (row === collar + 2 && offset >= 1 && offset <= 3))) {
        color = rgb(fabric[contour || outer ? 0 : row === collar ? 2 : 1]);
      } else {
        color = rgb(suit[contour || row <= 13 ? 0 : 1]);
      }
    } else if (trim && (scarfPixel || (orange && y >= top + 17))) color = shade(r, gg, b, trim, [55, 170]);
    else if (!face && y < top + height * 0.72 && blue) {
      const torso = y - rise >= 23 && Math.abs(x - center) <= (dir === 'right' ? 5 : 7);
      const style = torso && !contour && r + gg + b >= 92 ? outfitShade(p.outfit ?? OUTFITS[0], dir, x, y - rise, center) : null;
      if (style !== null) color = rgb(suit[style]);
      else if (p.coat !== 'Índigo' && !contour) color = shade(r, gg, b, suit, [17, 140]);
    }
    else if (!face && !orange && p.skin !== 'Dourada' && r > gg * 1.13 && gg > b * 1.07 && r - b < 98 && y > top + height * 0.59) color = shade(r, gg, b, skin, [60, 211]);
    if (color) { d[k] = color[0]; d[k + 1] = color[1]; d[k + 2] = color[2]; }
  }
  if (feminine) shapeTorso(d, top, center, dir === 'right');
  // Removing fabric can uncover a single outline pixel that no longer touches the sprite.
  if (scarf !== SCARVES[1]) for (let y = top + 11; y <= top + 19; y++) for (let x = 1; x < CELL_W - 1; x++) {
    const i = indexAt(x, y);
    if (!d[i * 4 + 3]) continue;
    const attached = [-CELL_W, 0, CELL_W].some((row) =>
      [-1, 0, 1].some((column) => (row !== 0 || column !== 0) && d[(i + row + column) * 4 + 3]));
    if (!attached) d[i * 4 + 3] = 0;
  }
  g.putImageData(im, 0, 0);
  const tails = offscreen(CELL_W, CELL_H);
  drawPlayerHair(tails.getContext('2d')!, dir, center, top, p.cut, frame, feminine, hair, true);
  g.save(); g.globalCompositeOperation = 'destination-over'; g.drawImage(tails, 0, 0); g.restore();
  drawPlayerFace(g, dir, center, top, feminine, skin);
  if (!mirrored || p.mark !== 'Cicatriz') paintFaceMarks(g, skin, p.mark, dir, top, center);
  drawPlayerHair(g, dir, center, top, p.cut, frame, feminine, hair);
  drawFace(g, p, dir, top, center - 7, center + 7, frame, bandana);
  if (bandana) drawBandana(g, top, dir, p.band, center);
  if (p.clan === 'Uchiha' && dir === 'up') {
    const y = top + Math.round(height * 0.48);
    g.fillStyle = '#b44b3e'; g.fillRect(18, y, 4, 2); g.fillStyle = '#e6d5b1'; g.fillRect(19, y + 2, 2, 1); g.fillRect(20, y + 3, 1, 2);
  }
  return top;
}

/** Acessórios do rosto. De costas, só aparece o que fica atrás da cabeça. */
function drawFace(g: Ctx, p: Look, dir: Dir, top: number, left: number, right: number, frame: number, bandana: boolean) {
  const cx = Math.round((left + right) / 2), side = dir === 'right', back = dir === 'up', sway = frame === 0 ? 1 : 0;
  const ey = top + (side ? 8 : 9);
  const [outline, material, shine] = accessorySet[p.accessoryTone ?? 'Grafite'] ?? accessorySet.Grafite;
  if (!back) {
    if (p.accessory === 'Óculos' || p.accessory === 'Óculos redondos') {
      const round = p.accessory === 'Óculos redondos';
      const lens = (x: number) => {
        R(g, outline, x, ey - 1, 5, 3);
        R(g, material, x + 1, ey - 2, 3, 1);
        if (round) R(g, outline, x + 1, ey + 2, 3, 1);
        R(g, '#8ab7be', x + 1, ey, 3, 1);
        R(g, shine, x + 1, ey, 1, 1);
      };
      if (side) {
        const x = right - 5;
        R(g, material, x - 4, ey, 4, 1);
        lens(x);
      } else {
        R(g, material, cx - 3, ey, 6, 1);
        lens(cx - 6); lens(cx + 1);
      }
    }
    if (p.accessory === 'Máscara') {
      const x = side ? right - 7 : cx - 5, w = side ? 7 : 11;
      R(g, outline, x, ey + 1, w, 3);
      R(g, material, x + 1, ey + 2, w - 2, 2);
      R(g, outline, x + 2, ey + 4, w - 4, 1);
      R(g, shine, x + (side ? 3 : 4), ey + 2, 2, 1);
      if (side) R(g, outline, x - 3, ey + 1, 3, 1);
    }
    if (p.accessory === 'Curativo') {
      const x = side ? right - 5 : cx + 1;
      R(g, '#a57c58', x, ey + 2, 5, 2);
      R(g, '#f8deae', x + 1, ey + 2, 3, 1);
      R(g, '#fff2cd', x + 2, ey + 3, 2, 1);
    }
    if (p.accessory === 'Brinco') {
      const x = side ? cx + 1 : left + 3;
      R(g, outline, x, ey + 1, 2, 4);
      R(g, shine, x, ey + 1, 1, 2);
      R(g, material, x + 1, ey + 4, 1, 1);
    }
  }
  if (p.accessory === 'Presilha') {
    const x = side ? right - 7 : back ? right - 5 : left + 4;
    R(g, outline, x, top + 5, 5, 3);
    R(g, material, x + 1, top + 6, 3, 1);
    R(g, shine, x + 1, top + 5, 2, 1);
  }
  // Faixa de pano na testa (some quando a bandana de genin está no lugar).
  if (p.accessory === 'Faixa na testa' && !bandana) {
    const color = bandSet[p.band ?? 'Vermelho'] ?? '#8e2a2f';
    // Mesma posição da bandana de genin, só que de pano.
    const x = cx - (side ? 5 : 6), width = side ? 12 : 13;
    R(g, outline, x, top + 5, width, 3);
    R(g, color, x, top + 5, width, 2);
    R(g, 'rgba(255,255,255,.3)', x + 1, top + 5, width - 2, 1);
    if (back || side) {
      const knot = side ? x - 1 : cx;
      R(g, color, knot, top + 7, 2, 5 + sway);
      R(g, outline, knot + 2, top + 8, 1, 3);
    }
  }
}

/** Bandana de Konoha sobre a testa (aparece depois da graduação). A cor do pano é escolha do jogador. */
function drawBandana(g: CanvasRenderingContext2D, top: number, dir: Dir, band?: string, center = 20) {
  const cloth = bandSet[band ?? 'Azul'] ?? '#2b3550';
  const y = top + 4;
  if (dir === 'up') { g.fillStyle = cloth; g.fillRect(center - 6, y, 12, 2); g.fillRect(center - 1, y + 2, 2, 3); return; }
  const plate = center + (dir === 'down' ? -4 : dir === 'right' ? -2 : -5);
  g.fillStyle = cloth; g.fillRect(center - 7, y, 14, 3);
  g.fillStyle = '#b8c2cc'; g.fillRect(plate, y, 7, 3);
  g.fillStyle = '#6d7884'; g.fillRect(plate + 3, y + 1, 2, 1);
}

const HIP: Record<SpriteRole, number> = { gen: 34, iruka: 31, naruto: 32, player: 32, sasuke: 32, sakura: 32, emi: 32 };

function appearanceKey(a: Actor) {
  const l = a.look;
  return [a.role, l?.sex, l?.skin, l?.hair, l?.coat, l?.cut, l?.trim, l?.accessory, l?.mark, l?.band,
    l?.outfit, l?.scarf, l?.accessoryTone, l?.clan === 'Uchiha', a.bandana].join('|');
}

/** Quadro pronto: frame >= 0 caminhada; -1 repouso; -2 repouso com respiração. */
export function stillFrame(a: Actor, dir: Dir, frame: number, gesture = false): HTMLCanvasElement {
  const custom = !!a.look;
  const L = a.look;
  const key = `${appearanceKey(a)}|${dir}|${frame}|${gesture}`;
  const hit = frameCache.get(key);
  if (hit) return hit;
  const canvas = offscreen(CELL_W, CELL_H), g = canvas.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  const set = art[a.role];
  if (!set.walk.complete || !set.walk.naturalWidth) return canvas;
  const canonical: Dir = dir === 'left' ? 'right' : dir;
  if (dir === 'left') { g.translate(CELL_W, 0); g.scale(-1, 1); }
  const row = canonical === 'up' ? 2 : canonical === 'right' ? 1 : 0, index = frame >= 0 ? frame % 4 : 1;
  const base = offscreen(CELL_W, CELL_H), b = base.getContext('2d')!;
  b.drawImage(set.walk, index * CELL_W, row * CELL_H, CELL_W, CELL_H, 0, 0, CELL_W, CELL_H);
  if (frame < 0 && set.idle.naturalWidth) {
    const hip = HIP[a.role];
    b.clearRect(0, hip, CELL_W, CELL_H - hip);
    b.drawImage(set.idle, 0, row * CELL_H + hip, CELL_W, CELL_H - hip, 0, hip, CELL_W, CELL_H - hip);
  }
  if (custom && L) customize(base, L, canonical, frame, !!a.bandana, dir === 'left');
  else if (a.bandana) drawBandana(b, 6, canonical);
  if (frame < 0 || gesture) {
    const split = 32, drop = gesture ? 0 : frame === -2 ? 2 : 1;
    g.drawImage(base, 0, 0, CELL_W, split - drop, 0, drop, CELL_W, split - drop);
    g.drawImage(base, 0, split, CELL_W, CELL_H - split, 0, split, CELL_W, CELL_H - split);
  } else g.drawImage(base, 0, 0);
  if (frameCache.size > 1600) frameCache.clear();
  frameCache.set(key, canvas);
  return canvas;
}

export function drawActor(g: CanvasRenderingContext2D, x: number, y: number, a: Actor, dir: Dir, frame: number, gesture = false) {
  x = Math.round(x); y = Math.round(y);
  const adult = a.role === 'iruka' || a.role === 'gen', w = adult ? 15 : 13;
  g.fillStyle = 'rgba(107,85,63,.22)'; g.fillRect((x - w / 2 + 2) | 0, y - 1, w + 3, 2);
  g.fillStyle = 'rgba(84,65,54,.30)'; g.fillRect(x - 5, y - 1, 11, 2);
  g.drawImage(stillFrame(a, dir, frame, gesture), x - CELL_W / 2, y - SOLE);
}

const portraitCache = new Map<string, HTMLCanvasElement>();
/** Retrato 40 × 40. Para o protagonista, usa o quadro frontal recolorido, ampliado no rosto. */
export function portrait(a: Actor): HTMLCanvasElement {
  const key = appearanceKey(a);
  const hit = portraitCache.get(key);
  if (hit) return hit;
  const c = offscreen(40, 40), g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  g.fillStyle = '#baba97'; g.fillRect(0, 0, 40, 40);
  const set = art[a.role];
  if (a.look) {
    const f = stillFrame(a, 'down', -1);
    g.drawImage(f, 4, 0, 32, 30, 0, 0, 40 * 1.0, 37);
  } else if (set.face.naturalWidth) g.drawImage(set.face, 0, 0);
  if (set.face.naturalWidth) portraitCache.set(key, c);
  return c;
}

export const idlePose = (time: number, offset: number, calm: boolean) => (calm ? -1 : (time + offset) % 3.3 < 0.9 ? -2 : -1);
