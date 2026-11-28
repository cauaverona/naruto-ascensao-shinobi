import { FOREST_ROUTES, type ForestRoute } from '../data/chunin';
import { CHAPTERS } from '../data/classic';
import type { Spot } from '../render/maps/types';
import { addLog, type Campaign } from '../state/campaign';
import { geninStage, teamMembers } from './genin';

export const RESCUE_BRIEFING = { id: 'resgate-equipe', label: 'Reunir a equipe de resgate', x: 73, y: 172, r: 24 };
export const RESCUE_EXIT = { id: 'classico-som', label: 'Seguir para o Vale do Fim', x: 693, y: 217, r: 24 };

export const RESCUE_PATHS = {
  norte: {
    fork: { ...FOREST_ROUTES.norte.scout, id: 'resgate-norte' },
    trail: { ...FOREST_ROUTES.norte.scroll, id: 'resgate-rastro-norte', label: 'Marcas na margem da passarela', r: 24 },
    aid: { id: 'resgate-fio', label: 'Fio de alarme entre as raízes', x: 478, y: 100, r: 22 },
  },
  sul: {
    fork: { ...FOREST_ROUTES.sul.scout, id: 'resgate-sul' },
    trail: { ...FOREST_ROUTES.sul.scroll, id: 'resgate-rastro-sul', label: 'Pegadas depois do vau', r: 24 },
    aid: { id: 'resgate-batedora', label: 'Batedora junto à margem', x: 364, y: 242, r: 22 },
  },
} satisfies Record<ForestRoute, { fork: Spot; trail: Spot; aid: Spot }>;

function atRescue(c: Campaign) {
  return c.map === 'floresta' && geninStage(c) === 'concluida' && !!c.flags['ondas-acampamento']
    && CHAPTERS[Number(c.flags['classico-capitulo'] ?? 0)]?.id === 'som';
}

export function rescueGuide(c: Campaign) {
  const id = c.flags['resgate-aliado'];
  if (typeof id === 'string' && id !== 'sasuke' && c.npcs[id]?.alive && teamMembers(c).includes(id)) return id;
  return '';
}

export function formRescueTeam(c: Campaign, ally: string) {
  if (!atRescue(c) || c.flags['resgate-equipe'] ||
      (ally && (ally === 'sasuke' || !teamMembers(c).includes(ally) || !c.npcs[ally]?.alive))) return false;
  c.flags['resgate-equipe'] = true;
  if (ally) c.flags['resgate-aliado'] = ally;
  return true;
}

export function rescueRoute(c: Campaign): ForestRoute | undefined {
  const route = c.flags['resgate-rota'];
  if (route === 'norte' || route === 'sul') return route;
}

export function chooseRescueRoute(c: Campaign, route: ForestRoute) {
  if (!atRescue(c) || !c.flags['resgate-equipe'] || c.flags['resgate-rastro']) return false;
  c.flags['resgate-rota'] = route;
  return true;
}

export function confirmRescueTrail(c: Campaign, route: ForestRoute) {
  if (!atRescue(c) || rescueRoute(c) !== route || c.flags['resgate-rastro']) return false;
  c.flags['resgate-rastro'] = true;
  addLog(c, `Equipe de resgate · O grupo confirmou a trilha do Som após cruzar por ${FOREST_ROUTES[route].label.toLocaleLowerCase('pt-BR')}.`);
  return true;
}

export function prepareRescueApproach(c: Campaign, id: string) {
  const route = rescueRoute(c);
  if (!atRescue(c) || !route || RESCUE_PATHS[route].aid.id !== id ||
      !c.flags['resgate-rastro'] || c.flags['resgate-preparo'] || c.flags['resgate-sentinela']) return false;
  c.flags['resgate-preparo'] = true;
  addLog(c, route === 'norte' ? 'A equipe deixou um selo ilusório no fio e obrigou a sentinela a verificar o alarme à distância.'
    : 'A equipe ajudou Maki a alcançar a margem. Ela desviou a atenção do sentinela para a outra trilha.');
  return true;
}

export function clearRescueSentinel(c: Campaign) {
  if (!atRescue(c) || !rescueRoute(c) || !c.flags['resgate-rastro'] || c.flags['resgate-sentinela']) return false;
  c.flags['resgate-sentinela'] = true;
  return true;
}

export function rescueSpots(c: Campaign, sentinel: Spot): Spot[] {
  if (!c.flags['resgate-equipe']) return [RESCUE_BRIEFING];
  const route = rescueRoute(c);
  if (!route) return [RESCUE_PATHS.norte.fork, RESCUE_PATHS.sul.fork];
  if (!c.flags['resgate-rastro']) return [RESCUE_PATHS[route].trail, RESCUE_PATHS[route === 'norte' ? 'sul' : 'norte'].fork];
  if (c.flags['resgate-sentinela']) return [RESCUE_EXIT];
  return c.flags['resgate-preparo'] ? [sentinel] : [sentinel, RESCUE_PATHS[route].aid];
}
