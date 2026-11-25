// Slots, salvamento e migração de formatos antigos (v0.2.0 usava schema 1 e 2 nas mesmas chaves).
import {
  SCHEMA, GAME_VERSION, HOME_SPOT, LOOK_DEFAULTS, emptyStatXp, npcInitial, type Campaign, type LogEntry,
} from './campaign';
import { baseStats, maxVitals, STATS, type StatBlock } from '../data/stats';

export const SLOT_COUNT = 3;
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
  if (!s || typeof s !== 'object') throw new Error('Save vazio');
  if (s.schema === 1 || s.schema === 2) return migrateV2(s);
  if (s.schema !== SCHEMA) throw new Error('Formato incompatível');
  validate(s);
  s.profile = { ...LOOK_DEFAULTS, ...s.profile };
  s.version = GAME_VERSION;
  // NPCs acrescentados ao mesmo formato estrutural preservam a progressão dos já existentes.
  for (const [id, initial] of Object.entries(npcInitial())) {
    if (s.npcs[id]) continue;
    s.npcs[id] = initial;
    if (initial.rank === 'Estudante da Academia' && s.events?.['exame-colegas'] && s.flags && !s.flags[`exame:${id}`]) {
      s.flags[`exame:${id}`] = 'aprovado';
      initial.rank = 'Genin';
    }
  }
  return s as Campaign;
}

function validate(s: Campaign) {
  const ok = typeof s.profile?.name === 'string' && s.profile.name.length > 0
    && s.stats && STATS.every((k) => Number.isFinite(s.stats[k]))
    && Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.day)
    && [0, 1, 2].includes(s.period) && Array.isArray(s.log) && s.npcs && typeof s.npcs === 'object';
  if (!ok) throw new Error('Formato incompatível');
}

interface V2Save {
  schema: number; profile: Record<string, string>; stats: StatBlock; day?: number;
  step?: number; seen?: string[]; log?: string[];
}

function migrateV2(old: V2Save): Campaign {
  if (!old.profile?.name || !old.stats) throw new Error('Formato incompatível');
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
