// Slots, salvamento e migração de formatos antigos (v0.2.0 usava schema 1 e 2 nas mesmas chaves).
import {
  SCHEMA, GAME_VERSION, HOME_SPOT, LOOK_DEFAULTS, emptyStatXp, npcInitial, type Campaign, type LogEntry,
} from './campaign';
import { baseStats, maxVitals, RANKS, STATS, type StatBlock } from '../data/stats';
import { bandPositionOf } from '../data/appearance';
import { VALLEY_ENTRY, VALLEY_MAP_FLAG } from '../data/valley-map';

export const SLOT_COUNT = 3;
export const MAX_SAVE_BYTES = 1024 * 1024;
export const slotKey = (i: number) => `ascensao.campanha.${i}`;
export const LAST_SLOT_KEY = 'ascensao.ultimo';

export interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

/** Converte qualquer formato conhecido para o schema atual ou lança erro. */
export function decode(raw: string): Campaign {
  const s = JSON.parse(raw);
  if (!isRecord(s)) throw new Error('Save vazio');
  const c = s.schema === 1 || s.schema === 2 ? migrateV2(s as unknown as V2Save) : s as unknown as Campaign;
  if (c.schema !== SCHEMA || !validCampaign(c)) throw new Error('Formato incompatível');
  c.profile = { ...LOOK_DEFAULTS, ...c.profile, bandPosition: bandPositionOf(c.profile) };
  if (c.map === 'vale' && !c.flags[VALLEY_MAP_FLAG]) {
    // O piso antigo tinha outra altura. Mantenha o jogador na mesma margem.
    c.x = Math.max(VALLEY_ENTRY.x, Math.min(566, c.x));
    c.y = VALLEY_ENTRY.y;
    c.flags[VALLEY_MAP_FLAG] = true;
  }
  c.version = GAME_VERSION;
  // NPCs acrescentados ao mesmo formato estrutural preservam a progressão dos já existentes.
  for (const [id, initial] of Object.entries(npcInitial())) {
    if (c.npcs[id]) continue;
    c.npcs[id] = initial;
    if (initial.rank === 'Estudante da Academia' && c.events['exame-colegas'] && !c.flags[`exame:${id}`]) {
      c.flags[`exame:${id}`] = 'aprovado';
      initial.rank = 'Genin';
    }
  }
  return c;
}

interface V2Save {
  schema: number; profile: Record<string, string>; stats: StatBlock; day?: number;
  step?: number; seen?: string[]; log?: string[];
}

function migrateV2(old: V2Save): Campaign {
  if (typeof old.profile?.name !== 'string' || !isRecord(old.stats)
      || (old.log !== undefined && (!Array.isArray(old.log) || old.log.some(line => typeof line !== 'string')))) {
    throw new Error('Formato incompatível');
  }
  const stats = { ...baseStats(2), ...old.stats };
  const v = maxVitals(stats);
  const step = old.step ?? 0;
  const log: LogEntry[] = (old.log ?? []).map((line) => {
    const m = /^Dia (\d+) · (.*)$/.exec(line);
    return m ? { day: Number(m[1]), text: m[2] } : { day: 1, text: line };
  });
  log.unshift({ day: old.day ?? 1, text: 'Campanha atualizada para a v0.3.0. Sua matrícula foi preservada.' });
  const p = old.profile;
  const seed = (Date.now() ^ 0x5f3759df) >>> 0;
  return {
    schema: SCHEMA, version: GAME_VERSION, seed, rng: seed,
    settings: { difficulty: 'normal', fidelity: 'equilibrado' }, era: 'academia',
    profile: {
      name: p.name, sex: p.sex ?? 'Masculino', village: p.village ?? 'Konoha', clan: p.clan ?? 'Sem clã',
      element: p.element ?? 'Fogo', talent: p.talent ?? 'Percepção', attribute: p.attribute ?? 'Vitalidade',
      past: p.past ?? 'Família de artesãos', skin: p.skin ?? 'Dourada', hair: p.hair ?? 'Preto', cut: p.cut ?? 'Curto', coat: p.coat ?? 'Índigo',
      ...LOOK_DEFAULTS,
      bandPosition: bandPositionOf({ bandPosition: p.bandPosition }),
    },
    stats, statXp: emptyStatXp(), rank: 'Estudante da Academia', xp: 0, reputation: 0, age: 12,
    day: Math.max(1, old.day ?? 1), period: 0, actions: 3, hp: v.hp, chakra: v.chakra, stamina: v.stamina, ryo: 120,
    map: 'rua', x: HOME_SPOT.x, y: HOME_SPOT.y, dir: 'up',
    jutsus: {}, inventory: { kunai: 6, shuriken: 10, onigiri: 1 }, npcs: npcInitial(),
    flags: {}, events: {},
    quest: step >= 2 ? 'aula' : step === 1 ? 'matricula-entrega' : 'matricula-ficha',
    lessonsDone: step >= 2 ? [1] : [], lessonScores: {},
    seen: old.seen ?? [], log, wins: 0, losses: 0, playtime: 0,
  };
}

export type SlotInfo =
  | { kind: 'empty'; raw: null }
  | { kind: 'ok'; raw: string; campaign: Campaign }
  | { kind: 'broken'; raw: string | null; error: string };

export function readSlot(store: StorageLike, i: number): SlotInfo {
  let raw: string | null;
  try { raw = store.getItem(slotKey(i)); } catch { return { kind: 'broken', raw: null, error: 'Leitura indisponível' }; }
  if (raw === null) return { kind: 'empty', raw: null };
  try { return { kind: 'ok', raw, campaign: decode(raw) }; } catch (e) { return { kind: 'broken', raw, error: (e as Error).message }; }
}

/**
 * Grava o slot. Recusa se outra aba mudou o conteúdo desde a última leitura
 * (comparação com o `snapshot`), para não sobrescrever progresso alheio.
 */
export function writeSlot(store: StorageLike, i: number, c: Campaign, snapshot: string | null):
  { ok: true; raw: string } | { ok: false; reason: 'conflict' | 'storage' } {
  try {
    const current = store.getItem(slotKey(i));
    if (current !== snapshot) return { ok: false, reason: 'conflict' };
    const raw = JSON.stringify(c);
    store.setItem(slotKey(i), raw);
    return { ok: true, raw };
  } catch {
    return { ok: false, reason: 'storage' };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function numberRecord(value: unknown): boolean {
  return isRecord(value) && Object.values(value).every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0);
}

function validCampaign(c: Campaign): boolean {
  return Number.isSafeInteger(c.day) && c.day >= 1
    && Number.isFinite(c.x) && Number.isFinite(c.y) && [0, 1, 2].includes(c.period)
    && isRecord(c.stats) && STATS.every(stat => Number.isFinite(c.stats[stat]) && c.stats[stat] >= 0)
    && ['rua', 'campo', 'sala', 'estrada', 'ondas', 'floresta', 'arena', 'suna', 'vale'].includes(c.map) && ['up', 'down', 'left', 'right'].includes(c.dir)
    && RANKS.includes(c.rank) && typeof c.quest === 'string' && typeof c.era === 'string'
    && ['facil', 'normal', 'dificil'].includes(c.settings?.difficulty)
    && ['fiel', 'equilibrado', 'alternativo'].includes(c.settings?.fidelity)
    && [c.actions, c.hp, c.chakra, c.stamina, c.ryo, c.xp, c.playtime].every((v) => Number.isFinite(v) && v >= 0)
    && [c.reputation, c.wins, c.losses].every(Number.isFinite)
    && [c.seed, c.rng].every(v => Number.isSafeInteger(v) && v >= 0 && v <= 0xffffffff)
    && isRecord(c.profile) && typeof c.profile.name === 'string' && !!c.profile.name.trim()
    && ['clan', 'village', 'talent', 'past', 'element', 'attribute'].every((k) => typeof c.profile[k as keyof Campaign['profile']] === 'string')
    && [c.statXp, c.jutsus, c.inventory, c.lessonScores].every(numberRecord)
    && isRecord(c.flags) && Object.values(c.flags).every((v) => ['string', 'number', 'boolean'].includes(typeof v))
    && isRecord(c.events) && Object.values(c.events).every((v) => typeof v === 'string')
    && Array.isArray(c.seen) && c.seen.every((v) => typeof v === 'string')
    && Array.isArray(c.lessonsDone) && c.lessonsDone.every(Number.isSafeInteger)
    && Array.isArray(c.log) && c.log.every((entry) => !!entry && Number.isFinite(entry.day) && typeof entry.text === 'string')
    && isRecord(c.npcs) && Object.values(c.npcs).every((npc) => isRecord(npc)
      && isRecord(npc.stats) && STATS.every(stat => typeof npc.stats[stat] === 'number' && Number.isFinite(npc.stats[stat]) && npc.stats[stat] >= 0)
      && numberRecord(npc.jutsus) && isRecord(npc.bond)
      && [npc.bond.amizade, npc.bond.rivalidade, npc.bond.respeito, npc.bond.confianca].every(Number.isFinite)
      && Array.isArray(npc.memory) && npc.memory.every(line => typeof line === 'string'));
}

/** Importa nos mesmos slots e sem substituir uma jornada existente. */
export function importSlot(store: StorageLike, i: number, raw: string):
  { ok: true; raw: string } | { ok: false; reason: 'invalid' | 'conflict' | 'storage' } {
  let campaign: Campaign;
  try {
    campaign = decode(raw);
  } catch {
    return { ok: false, reason: 'invalid' };
  }
  return writeSlot(store, i, campaign, null);
}

/** Remove somente a revisão que o jogador confirmou, inclusive se estiver ilegível. */
export function deleteSlot(store: StorageLike, i: number, snapshot: string):
  { ok: true } | { ok: false; reason: 'conflict' | 'storage' } {
  try {
    if (store.getItem(slotKey(i)) !== snapshot) return { ok: false, reason: 'conflict' };
    store.removeItem(slotKey(i));
  } catch {
    return { ok: false, reason: 'storage' };
  }
  try {
    if (store.getItem(LAST_SLOT_KEY) === String(i)) store.removeItem(LAST_SLOT_KEY);
  } catch { /* Um atalho sem campanha é ignorado na tela inicial. */ }
  return { ok: true };
}

export function memoryStore(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}
