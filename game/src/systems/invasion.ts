import { GROUP_IDS, INVASION_GROUPS, INVASION_ROUTES, INVASION_SHELTER, type InvasionGroup, type InvasionRoute } from '../data/invasion';
import type { Spot } from '../render/maps/types';
import { addLog, type Campaign } from '../state/campaign';

const safeKey = (group: InvasionGroup) => `invasao-seguro:${group}`;

export function invasionRoute(c: Campaign): InvasionRoute | undefined {
  const route = c.flags['invasao-rota'];
  return route === 'evacuar' || route === 'defender' ? route : undefined;
}

export function escortGroup(c: Campaign): InvasionGroup | undefined {
  const group = c.flags['invasao-escolta'];
  return GROUP_IDS.find(id => group === id && !c.flags[safeKey(id)]);
}

export function groupSafe(c: Campaign, group: InvasionGroup): boolean {
  return c.flags[safeKey(group)] === true;
}

export function evacuationCount(c: Campaign) {
  return GROUP_IDS.filter(group => groupSafe(c, group)).length;
}

export function atEvacuationCheckpoint(c: Campaign, group: InvasionGroup): boolean {
  return c.flags[`invasao-baliza:${group}`] === true;
}

export function chooseInvasionRoute(c: Campaign, route: InvasionRoute): boolean {
  if (c.map !== 'rua' || c.flags['invasao-passagem-pronta']) return false;
  if (invasionRoute(c) !== route) {
    c.flags['invasao-rota'] = route;
    addLog(c, `Invasão de Konoha · Rota de retirada: ${INVASION_ROUTES[route].label}.`);
  }
  return true;
}

export function secureInvasionRoute(c: Campaign, route: InvasionRoute): boolean {
  if (c.map !== 'rua' || invasionRoute(c) !== route || c.flags['invasao-passagem-pronta']) return false;
  c.flags['invasao-passagem-pronta'] = true;
  addLog(c, `Invasão de Konoha · Passagem liberada · ${INVASION_ROUTES[route].label}.`);
  return true;
}

export function startEvacuation(c: Campaign, group: InvasionGroup): boolean {
  if (c.map !== 'rua' || !c.flags['invasao-passagem-pronta'] || groupSafe(c, group) || escortGroup(c)) return false;
  c.flags['invasao-escolta'] = group;
  return true;
}

export function reachEvacuationCheckpoint(c: Campaign, group: InvasionGroup): boolean {
  if (c.map !== 'rua' || escortGroup(c) !== group || atEvacuationCheckpoint(c, group)) return false;
  c.flags[`invasao-baliza:${group}`] = true;
  return true;
}

export function rescueEvacuationGroup(c: Campaign, group: InvasionGroup): boolean {
  if (c.map !== 'rua' || escortGroup(c) !== group || !atEvacuationCheckpoint(c, group)) return false;
  c.flags[safeKey(group)] = true;
  delete c.flags['invasao-escolta'];
  addLog(c, `Invasão de Konoha · ${INVASION_GROUPS[group].point.label} chegaram ao posto de socorro.`);
  return true;
}

export function invasionReady(c: Campaign, result: string) {
  return result === invasionRoute(c) && evacuationCount(c) === GROUP_IDS.length && c.flags['invasao-passagem-pronta'] === true;
}

export function invasionSpots(c: Campaign, guard: Spot): Spot[] {
  const route = invasionRoute(c);
  if (!route) return [guard];
  if (!c.flags['invasao-passagem-pronta']) return [INVASION_ROUTES[route].prep, guard];
  const escorted = escortGroup(c);
  if (escorted) return [atEvacuationCheckpoint(c, escorted) ? INVASION_SHELTER : INVASION_GROUPS[escorted].checkpoint[route]];
  const waiting = GROUP_IDS.filter(group => !groupSafe(c, group));
  return waiting.length ? waiting.map(group => INVASION_GROUPS[group].point) : [{ ...guard, label: 'Entregar o relatório da evacuação' }];
}
