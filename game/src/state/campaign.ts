// Estado completo de uma campanha. Tudo aqui é serializável e versionado (schema).
import { baseStats, maxVitals, type StatBlock, type Stat, type Rank } from '../data/stats';
import { CHARACTERS, type MapId, type Period } from '../data/characters';
import { clanByName, CLANS, VILLAGES, PASTS, TALENTS, ATTRIBUTE_PICKS } from '../data/clans';
import { ELEMENTS } from '../data/stats';
import type { EraId } from '../data/academy';
import { Rng } from '../core/rng';

export const SCHEMA = 3;
/** Porta de casa, na casa vermelha do sul da Rua da Academia. */
export const HOME_SPOT = { x: 117, y: 437 };
export const GAME_VERSION = '0.3.1';

export interface Profile {
  name: string; sex: string; village: string; clan: string; element: string;
  talent: string; attribute: string; past: string;
  skin: string; hair: string; cut: string; coat: string;
  trim: string; accessory: string; mark: string; band: string;
}

/** Valores de aparência adicionados na v0.3.1; saves anteriores recebem estes padrões. */
export const LOOK_DEFAULTS = { trim: 'Laranja', accessory: 'Nenhum', mark: 'Nenhuma', band: 'Azul' };

export interface Settings {
  difficulty: 'facil' | 'normal' | 'dificil';
  /** Fidelidade à história original: quanto os acontecimentos tendem ao roteiro do anime. */
  fidelity: 'fiel' | 'equilibrado' | 'alternativo';
}

export interface Bond { amizade: number; rivalidade: number; respeito: number; confianca: number }

export interface NpcState {
  stats: StatBlock;
  jutsus: Record<string, number>;
  bond: Bond;
  /** Memórias de acontecimentos relevantes com o jogador ou com o mundo. */
  memory: string[];
  talkedDay: number;
  sparredDay: number;
  alive: boolean;
  rank: Rank | 'Civil';
}

export interface LogEntry { day: number; text: string }

export interface Campaign {
  schema: number;
  version: string;
  seed: number;
  rng: number;
  settings: Settings;
  era: EraId;
  profile: Profile;
  stats: StatBlock;
  /** Progresso parcial até o próximo ponto de cada atributo (0..1). */
  statXp: Record<Stat, number>;
  rank: Rank;
  xp: number;
  reputation: number;
  age: number;
  day: number;
  period: Period;
  /** Ações de treino restantes na tarde. */
  actions: number;
  hp: number;
  chakra: number;
  stamina: number;
  ryo: number;
  map: MapId;
  x: number;
  y: number;
  dir: 'up' | 'down' | 'left' | 'right';
  jutsus: Record<string, number>;
  inventory: Record<string, number>;
  npcs: Record<string, NpcState>;
  /** Flags do mundo e da história (simulador de acontecimentos). */
  flags: Record<string, string | number | boolean>;
  events: Record<string, string>;
  quest: string;
  lessonsDone: number[];
  lessonScores: Record<number, number>;
  seen: string[];
  log: LogEntry[];
  wins: number;
  losses: number;
  playtime: number;
}

export function emptyStatXp(): Record<Stat, number> {
  return Object.fromEntries(Object.keys(baseStats()).map((k) => [k, 0])) as Record<Stat, number>;
}

export function npcInitial(): Record<string, NpcState> {
  const out: Record<string, NpcState> = {};
  for (const c of Object.values(CHARACTERS)) {
    out[c.id] = {
      stats: { ...c.stats }, jutsus: { ...c.jutsus },
      bond: { amizade: 0, rivalidade: 0, respeito: 0, confianca: 0 },
      memory: [], talkedDay: 0, sparredDay: 0, alive: true, rank: c.rank,
    };
  }
  return out;
}

/** Sorteia tudo que não é aparência. Clãs comuns saem mais; linhagens raras são verdadeiras surpresas. */
export function rollOrigin(p: Profile, rng: Rng) {
  if (p.clan === 'Sortear') {
    const weight = (id: string, rare?: boolean) => (id === 'sem-cla' ? 6 : rare ? 1 : 3);
    const total = CLANS.reduce((s, k) => s + weight(k.id, k.rareInKonoha), 0);
    let r = rng.next() * total;
    p.clan = (CLANS.find((k) => (r -= weight(k.id, k.rareInKonoha)) < 0) ?? CLANS[0]).name;
  }
  if (p.village === 'Sortear') p.village = rng.chance(0.72) ? 'Konoha' : rng.pick(VILLAGES.filter((v) => v !== 'Konoha'));
  if (p.element === 'Sortear') p.element = rng.pick(ELEMENTS);
  if (p.talent === 'Sortear') p.talent = rng.pick(TALENTS);
  if (p.attribute === 'Sortear') p.attribute = rng.pick(ATTRIBUTE_PICKS);
  if (p.past === 'Sortear') p.past = rng.pick(PASTS);
}

export function newCampaign(input: Profile, settings: Settings, seed: number): Campaign {
  const rng = new Rng(seed);
  const p = { ...input };
  rollOrigin(p, rng);
  const stats = baseStats(2);
  const add = (k: string, v: number) => { if (k in stats) stats[k as Stat] += v; };
  add(p.attribute, 2);
  add(p.talent, 1);
  for (const [k, v] of Object.entries(clanByName(p.clan).bonus)) add(k, v ?? 0);
  const v = maxVitals(stats);
  const c: Campaign = {
    schema: SCHEMA, version: GAME_VERSION, seed, rng: rng.state, settings, era: 'academia', profile: p,
    stats, statXp: emptyStatXp(), rank: 'Estudante da Academia', xp: 0, reputation: 0, age: 12,
    day: 1, period: 0, actions: 3, hp: v.hp, chakra: v.chakra, stamina: v.stamina, ryo: 120,
    map: 'rua', x: HOME_SPOT.x, y: HOME_SPOT.y, dir: 'up',
    jutsus: {}, inventory: { kunai: 6, shuriken: 10, onigiri: 1 }, npcs: npcInitial(),
    flags: {}, events: {}, quest: 'matricula-ficha', lessonsDone: [], lessonScores: {},
    seen: [], log: [{ day: 1, text: 'Você saiu de casa para se matricular na Academia.' }],
    wins: 0, losses: 0, playtime: 0,
  };
  return c;
}

export function vitals(c: Campaign) {
  return maxVitals(c.stats);
}

export function addLog(c: Campaign, text: string) {
  c.log.unshift({ day: c.day, text });
  if (c.log.length > 120) c.log.length = 120;
}
