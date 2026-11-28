import { CHAPTERS } from '../data/classic';
import type { Spot } from '../render/maps/types';
import { addLog, type Campaign } from '../state/campaign';
import { geninStage } from './genin';

export const AKATSUKI_CLUES = [
  { id: 'akatsuki-ichiraku', label: 'Testemunha do Ichiraku', x: 171, y: 231, r: 23,
    note: 'Dois viajantes de manto escuro procuraram Naruto no Ichiraku e pediram indicações para a Academia.' },
  { id: 'akatsuki-maki', label: 'Ronda da praça', x: 285, y: 266, r: 23,
    note: 'A ronda viu um dos viajantes no caminho da praça. A passagem pela cerca ao sul fica fora da vista dele.' },
] as const;

export const AKATSUKI_BRIEFING = { id: 'akatsuki-plano', label: 'Reunir a equipe', x: 378, y: 269, r: 23 };
export const NARUTO_PICKUP = { id: 'akatsuki-naruto', label: 'Buscar Naruto', x: 220, y: 282, r: 23 };
export const AKATSUKI_PASSAGE = { id: 'akatsuki-cerca', label: 'Abertura na cerca', x: 194, y: 322, r: 22 };

export const AKATSUKI_ROUTES = {
  becos: { label: 'Retirada pelos becos', shelter: { id: 'akatsuki-posto', label: 'Posto de guarda ao sul', x: 425, y: 351, r: 23 } },
  cobertura: { label: 'Retirada coberta em combate', shelter: { id: 'akatsuki-praca', label: 'Guarda na praça', x: 426, y: 276, r: 23 } },
} satisfies Record<string, { label: string; shelter: Spot }>;

export type AkatsukiRoute = keyof typeof AKATSUKI_ROUTES;

function atMission(c: Campaign) {
  return c.map === 'rua' && geninStage(c) === 'concluida' && c.flags['ondas-acampamento'] === true
    && CHAPTERS[Number(c.flags['classico-capitulo'] ?? 0)]?.id === 'akatsuki';
}

export function pendingAkatsukiClues(c: Campaign) {
  return AKATSUKI_CLUES.filter(clue => c.flags[clue.id] !== true);
}

export function recordAkatsukiClue(c: Campaign, id: string) {
  const clue = pendingAkatsukiClues(c).find(clue => clue.id === id);
  if (!atMission(c) || !clue) return false;
  c.flags[id] = true;
  addLog(c, clue.note);
  return true;
}

export function akatsukiRoute(c: Campaign): AkatsukiRoute | undefined {
  const route = c.flags['akatsuki-plano'];
  return route === 'becos' || route === 'cobertura' ? route : undefined;
}

export function chooseAkatsukiRoute(c: Campaign, route: AkatsukiRoute) {
  if (!atMission(c) || pendingAkatsukiClues(c).length || c.flags['akatsuki-passagem'] || c.flags['akatsuki-escolta']) return false;
  if (akatsukiRoute(c) !== route) {
    c.flags['akatsuki-plano'] = route;
    addLog(c, `Visitantes ao anoitecer · ${AKATSUKI_ROUTES[route].label}.`);
  }
  return true;
}

export function narutoSafety(c: Campaign) {
  if (c.flags['akatsuki-seguro']) return 'seguro';
  if (c.flags['akatsuki-escolta']) return 'escolta';
  return 'aguardando';
}

export function openAkatsukiPassage(c: Campaign, route: AkatsukiRoute) {
  if (!atMission(c) || akatsukiRoute(c) !== route || c.flags['akatsuki-passagem']
      || narutoSafety(c) !== (route === 'becos' ? 'escolta' : 'aguardando')) return false;
  c.flags['akatsuki-passagem'] = true;
  addLog(c, route === 'becos' ? 'Naruto cruzou a abertura na cerca ao sinal da ronda.' : 'A equipe conteve Kisame e abriu a passagem pela praça.');
  return true;
}

export function startNarutoEscort(c: Campaign) {
  const route = akatsukiRoute(c);
  if (!atMission(c) || !route || narutoSafety(c) !== 'aguardando' || (route === 'cobertura' && !c.flags['akatsuki-passagem'])) return false;
  c.flags['akatsuki-escolta'] = true;
  return true;
}

export function finishNarutoEscort(c: Campaign, shelterId: string) {
  const route = akatsukiRoute(c);
  if (!atMission(c) || !route || AKATSUKI_ROUTES[route].shelter.id !== shelterId
      || narutoSafety(c) !== 'escolta' || !c.flags['akatsuki-passagem']) return false;
  delete c.flags['akatsuki-escolta'];
  c.flags['akatsuki-seguro'] = true;
  return true;
}

export function akatsukiReportReady(c: Campaign, result: string) {
  return result === akatsukiRoute(c) && narutoSafety(c) === 'seguro';
}

export function akatsukiSpots(c: Campaign, kisame: Spot): Spot[] {
  const clues = pendingAkatsukiClues(c);
  if (clues.length) return clues;
  const route = akatsukiRoute(c);
  if (!route) return [AKATSUKI_BRIEFING];
  const safety = narutoSafety(c);
  const shelter = AKATSUKI_ROUTES[route].shelter;
  if (safety === 'seguro') return [{ ...shelter, id: 'classico-akatsuki', label: 'Entregar o relatório à guarda' }];
  if (safety === 'escolta') return [c.flags['akatsuki-passagem'] ? shelter : AKATSUKI_PASSAGE];
  if (route === 'cobertura') return c.flags['akatsuki-passagem'] ? [NARUTO_PICKUP] : [kisame, AKATSUKI_BRIEFING];
  return [NARUTO_PICKUP, AKATSUKI_BRIEFING];
}
