import type { Spot } from '../render/maps/types';
import { addLog, type Campaign } from '../state/campaign';
import { restoreAll } from './progression';
import { VALLEY_LOOKOUT, VALLEY_SHELTER } from '../data/valley-map';

export const VALE_LOOKOUT = { id: 'vale-mirante', label: 'Mirante da margem oeste', ...VALLEY_LOOKOUT, r: 24 };
export const VALE_REST = { id: 'vale-parada', label: 'Abrigo junto à margem', ...VALLEY_SHELTER, r: 23 };
export const VALE_REPORT = { id: 'vale-relato', label: 'Relato da equipe de resgate', x: 530, y: 258, r: 24 };

export const VALE_ENDINGS = {
  conversou: 'Sasuke voltou após conversar',
  resgate: 'Sasuke voltou após o duelo',
  partiu: 'Sasuke deixou Konoha',
} as const;
export type ValeEnding = keyof typeof VALE_ENDINGS;

export function valleyEnding(c: Campaign): ValeEnding | undefined {
  const result = c.flags['classico-final'];
  if (result === 'conversou' || result === 'resgate' || result === 'partiu') return result;
}

export function visitValleyLookout(c: Campaign) {
  if (c.map !== 'vale' || valleyEnding(c) || c.flags['vale-chegada']) return false;
  c.flags['vale-chegada'] = true;
  addLog(c, 'No Vale do Fim, a equipe marcou um ponto de encontro antes de cruzar até Sasuke.');
  return true;
}

export function restAtValley(c: Campaign) {
  if (c.map !== 'vale' || !c.flags['vale-chegada'] || valleyEnding(c) || c.flags['vale-descanso'] || c.flags['vale-duelo']) return false;
  c.flags['vale-descanso'] = true;
  restoreAll(c);
  return true;
}

export function recordValleyDuel(c: Campaign) {
  if (c.map !== 'vale' || !c.flags['vale-chegada'] || valleyEnding(c) || c.flags['vale-duelo']) return false;
  c.flags['vale-duelo'] = true;
  return true;
}

export function valleySpots(c: Campaign, sasuke: Spot): Spot[] {
  if (!c.flags['vale-chegada']) return [VALE_LOOKOUT];
  if (c.flags['vale-duelo']) return [{ ...sasuke, label: 'Falar com Sasuke depois do duelo' }];
  return c.flags['vale-descanso'] ? [sasuke] : [sasuke, VALE_REST];
}

export function valleyReportPending(c: Campaign) {
  return !!valleyEnding(c) && c.flags['vale-relato-pendente'] === true;
}

export function turnInValleyReport(c: Campaign) {
  if (c.map !== 'rua' || !valleyReportPending(c)) return false;
  delete c.flags['vale-relato-pendente'];
  c.flags['vale-relato-entregue'] = true;
  addLog(c, 'A equipe entregou o relato do Vale do Fim na Academia.');
  return true;
}
