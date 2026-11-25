import type { MapId } from '../../data/characters';
import type { G } from '../gfx';

export interface Rect { x: number; y: number; w: number; h: number }
export interface Thing { x: number; y: number; img: CanvasImageSource & { width: number; height: number }; depth: number }
export interface Spot { id: string; x: number; y: number; r: number; label: string }
export interface Exit { rect: Rect; to: MapId; arrive: { x: number; y: number; dir: 'up' | 'down' | 'left' | 'right' }; label: string }
export interface Light { x: number; y: number; r: number }

export interface GameMap {
  id: MapId;
  name: string;
  region: string;
  w: number;
  h: number;
  ground: HTMLCanvasElement;
  things: Thing[];
  walls: Rect[];
  bounds: Rect;
  spots: Spot[];
  exits: Exit[];
  lights: Light[];
  interior?: boolean;
  /** Desenho animado por cima do chão, antes dos atores (ex.: bandeirolas). */
  ambient?(g: G, t: number, calm: boolean): void;
  /** Imagens grandes desenhadas na ordem de profundidade. */
  extra?: { img: HTMLImageElement; x: number; y: number; depth: number }[];
}

export function blocked(m: GameMap, x: number, y: number): boolean {
  const b = m.bounds;
  if (x < b.x || x > b.x + b.w || y < b.y || y > b.y + b.h) return true;
  return m.walls.some((w) => x > w.x - 3 && x < w.x + w.w + 3 && y > w.y - 1 && y < w.y + w.h + 1);
}

export class MapBuilder {
  things: Thing[] = [];
  walls: Rect[] = [];
  wall(x: number, y: number, w: number, h: number) { this.walls.push({ x, y, w, h }); }
  item(x: number, y: number, img: Thing['img'], depth = y) { this.things.push({ x, y, img, depth }); }
}
