import type { MapId } from '../../data/characters';
import type { GameMap } from './types';
import { buildValley } from './valley';
import { buildWavesVillage } from './waves-village';
import { buildChuninArena } from './chunin-arena';
import { buildSandFrontier } from './sand-frontier';

export const CLASSIC_ENTRY = { x: 58, y: 160 };
export type ExpeditionMap = Extract<MapId, 'ondas' | 'arena' | 'suna' | 'vale'>;

export function buildClassicArea(id: ExpeditionMap): GameMap {
  if (id === 'vale') return buildValley();
  if (id === 'ondas') return buildWavesVillage();
  if (id === 'arena') return buildChuninArena();
  return buildSandFrontier();
}
