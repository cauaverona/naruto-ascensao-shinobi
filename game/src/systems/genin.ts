import { PATROL_POSTS, SEAL_CASES, SEAL_CLUES } from '../data/genin-assignments';
import { SUPPORT, type Tactic } from '../data/squad';
import { CHARACTERS } from '../data/characters';
import type { Stat, StatBlock } from '../data/stats';
import { addLog, type Campaign } from '../state/campaign';
import { bond } from './relations';

export const GENIN_STAGES = [
  'encontro', 'sinos', 'suprimentos', 'entrega', 'busca', 'retorno',
  'selo-ordem', 'selo-pistas', 'patrulha-ordem', 'patrulha-rota', 'patrulha-relato', 'ondas', 'concluida',
] as const;
export type GeninStage = (typeof GENIN_STAGES)[number];

export const GEAR = {
  luvas: { name: 'Luvas de treino', price: 35, stat: 'Taijutsu', bonus: 2 },
  bolsa: { name: 'Bolsa de arremesso', price: 40, stat: 'Bukijutsu', bonus: 2 },
  colete: { name: 'Colete acolchoado', price: 45, reduction: 0.15 },
} satisfies Record<string, { name: string; price: number } & ({ stat: Stat; bonus: number } | { reduction: number })>;
export type GearId = keyof typeof GEAR;

export const SUPPLIES = [
  { id: 'fardo-1', x: 112, y: 220, label: 'Caixa de cordas' },
  { id: 'fardo-2', x: 463, y: 300, label: 'Kit de reparos' },
  { id: 'fardo-3', x: 535, y: 240, label: 'Caixa de alvos' },
] as const;

export function geninStage(c: Campaign): GeninStage | null {
  if (c.rank !== 'Genin' || !c.flags['academia-concluida']) return null;
  const value = GENIN_STAGES.find((stage) => stage === c.flags['genin-etapa']);
  if ((value === 'ondas' || value === 'concluida') && !c.flags['patrulha-concluida']) return 'selo-ordem';
  return value ?? 'encontro';
}

export function senseiId(c: Campaign) {
  const assigned = String(c.flags.sensei ?? '');
  if (['kakashi', 'asuma', 'kurenai', 'naomi'].includes(assigned)) return assigned;
  return c.events['formacao-equipes'] === 'jogador-time7' ? 'kakashi' : 'naomi';
}

export function teamMembers(c: Campaign) {
  return [...new Set(String(c.flags.equipe ?? '').split(','))]
    .filter((id) => id !== 'player' && CHARACTERS[id]?.classmate).slice(0, 2);
}

export function beginGenin(c: Campaign) {
  if (geninStage(c) !== 'encontro') return false;
  c.era = 'classico';
  c.flags['genin-etapa'] = 'sinos';
  c.inventory.luvas = Math.max(1, c.inventory.luvas ?? 0);
  addLog(c, `${CHARACTERS[senseiId(c)].name} apresentou a equipe e entregou luvas de treino.`);
  return true;
}

export function resolveBells(c: Campaign, score: number, shared: boolean) {
  if (geninStage(c) !== 'sinos' || !shared || score < 1 / 3) return false;
  c.flags['genin-etapa'] = 'suprimentos';
  c.flags['genin-sinos-score'] = Math.round(score * 100);
  c.xp += score >= 0.6 ? 70 : 50;
  for (const id of [...teamMembers(c), senseiId(c)]) bond(c, id, { confianca: 8, respeito: 4 }, 'Trabalhou junto no teste dos sinos.');
  addLog(c, 'Equipe aprovada no teste dos sinos. Primeira missão D aceita: Suprimentos do campo.');
  return true;
}

export function collectSupply(c: Campaign, id: string) {
  if (geninStage(c) !== 'suprimentos' || c.flags[id] || !SUPPLIES.some((s) => s.id === id)) return false;
  c.flags[id] = true;
  if (SUPPLIES.every((s) => c.flags[s.id])) c.flags['genin-etapa'] = 'entrega';
  return true;
}

export function turnInSupplies(c: Campaign) {
  if (geninStage(c) !== 'entrega') return false;
  c.flags['genin-etapa'] = 'busca';
  reward(c, 'Suprimentos do campo', 80);
  return true;
}

export const TORA_TRAILS = [
  { id: 'rastro-oeste', x: 185, y: 325, r: 22, label: 'Pegadas no barro', shelter: { x: 90, y: 345, name: 'o lago' } },
  { id: 'rastro-norte', x: 286, y: 167, r: 22, label: 'Ramo partido', shelter: { x: 355, y: 188, name: 'a sombra da cerca' } },
  { id: 'rastro-sul', x: 491, y: 342, r: 22, label: 'Pelos na grama', shelter: { x: 562, y: 364, name: 'a moita do sul' } },
] as const;

export function toraRoute(c: Campaign) {
  const team = teamMembers(c);
  const variation = team.join('').split('').reduce((sum, letter) => sum + letter.charCodeAt(0), c.seed);
  return TORA_TRAILS[variation % TORA_TRAILS.length];
}

export function setToraPlan(c: Campaign, ally: string) {
  if (geninStage(c) !== 'busca' || c.flags['tora-rastro'] || (ally && (!teamMembers(c).includes(ally) || !SUPPORT[ally]))) return false;
  c.flags['tora-rastro'] = true;
  c.flags['tora-apoio'] = ally;
  if (ally) addLog(c, `${CHARACTERS[ally].name} encontrou a pista de Tora perto de ${toraRoute(c).shelter.name}.`);
  return true;
}

export function toraTactic(c: Campaign): Tactic | undefined {
  const ally = String(c.flags['tora-apoio'] ?? '');
  return teamMembers(c).includes(ally) ? SUPPORT[ally]?.tactic : undefined;
}

export function rescueTora(c: Campaign) {
  if (geninStage(c) !== 'busca') return false;
  c.flags['genin-etapa'] = 'retorno';
  const ally = String(c.flags['tora-apoio'] ?? '');
  if (toraTactic(c)) bond(c, ally, { confianca: 5 }, 'Pôs em prática meu plano para pegar Tora.');
  return true;
}

export function turnInTora(c: Campaign) {
  if (geninStage(c) !== 'retorno') return false;
  c.flags['genin-etapa'] = 'selo-ordem';
  reward(c, 'Captura de Tora', 110);
  return true;
}

export function sealCase(c: Campaign) {
  return SEAL_CASES[c.seed % SEAL_CASES.length];
}

export function beginSealCase(c: Campaign, ally = '') {
  if (geninStage(c) !== 'selo-ordem') return false;
  c.flags['genin-etapa'] = 'selo-pistas';
  if (ally && teamMembers(c).includes(ally)) c.flags['selo-apoio'] = ally;
  addLog(c, 'Missão D aceita: O lacre trocado.');
  return true;
}

export function recordSealClue(c: Campaign, id: string) {
  if (geninStage(c) !== 'selo-pistas' || c.flags[id] || !SEAL_CLUES.some((clue) => clue.id === id)) return false;
  c.flags[id] = true;
  return true;
}

export function sealClueCount(c: Campaign) {
  return SEAL_CLUES.filter(({ id }) => c.flags[id]).length;
}

export function solveSealCase(c: Campaign, destination: string) {
  if (geninStage(c) !== 'selo-pistas' || sealClueCount(c) !== SEAL_CLUES.length || destination !== sealCase(c).destination) return false;
  c.flags['genin-etapa'] = 'patrulha-ordem';
  c.flags['selo-destino'] = destination;
  const ally = String(c.flags['selo-apoio'] ?? '');
  if (teamMembers(c).includes(ally)) bond(c, ally, { respeito: 4 }, 'Ajudou a cruzar as pistas da encomenda.');
  reward(c, 'O lacre trocado', 120);
  return true;
}

export function beginPatrol(c: Campaign) {
  if (geninStage(c) !== 'patrulha-ordem') return false;
  c.flags['genin-etapa'] = 'patrulha-rota';
  addLog(c, 'Missão D aceita: A ronda das lanternas.');
  return true;
}

export function nextPatrolPost(c: Campaign) {
  return PATROL_POSTS.find(({ id }) => !c.flags[id]);
}

export function checkPatrolPost(c: Campaign, id: string) {
  if (geninStage(c) !== 'patrulha-rota' || nextPatrolPost(c)?.id !== id) return false;
  c.flags[id] = true;
  return true;
}

export function settlePatrolDuel(c: Campaign, won: boolean) {
  if (geninStage(c) !== 'patrulha-rota' || nextPatrolPost(c) || !won) return false;
  c.flags['genin-etapa'] = 'patrulha-relato';
  return true;
}

export function reportPatrol(c: Campaign) {
  if (geninStage(c) !== 'patrulha-relato') return false;
  c.flags['patrulha-concluida'] = true;
  c.flags['genin-etapa'] = c.flags['ondas-postura'] ? 'concluida' : 'ondas';
  reward(c, 'A ronda das lanternas', 150);
  return true;
}

export function finishGenin(c: Campaign, approach: 'investigar' | 'aceitar') {
  if (geninStage(c) !== 'ondas') return false;
  c.flags['ondas-postura'] = approach;
  c.flags['genin-etapa'] = 'concluida';
  addLog(c, `A equipe conheceu o cliente do País das Ondas. Você decidiu ${approach === 'investigar' ? 'conferir os riscos antes de partir' : 'aceitar a escolta'}.`);
  return true;
}

function reward(c: Campaign, title: string, ryo: number) {
  c.ryo += ryo;
  c.xp += 80;
  c.reputation += 3;
  for (const id of teamMembers(c)) bond(c, id, { amizade: 3, confianca: 4 }, `Concluiu comigo a missão ${title}.`);
  addLog(c, `Missão D concluída: ${title} (+${ryo} ryō).`);
}

export function equippedGear(c: Campaign): GearId | undefined {
  return (Object.keys(GEAR) as GearId[]).find((id) => id === c.flags.equipado && c.inventory[id] > 0);
}

export function combatStats(c: Campaign): StatBlock {
  const id = equippedGear(c);
  if (!id) return c.stats;
  const gear = GEAR[id];
  if (!('stat' in gear)) return c.stats;
  return { ...c.stats, [gear.stat]: c.stats[gear.stat] + gear.bonus };
}

