// Combate estratégico por turnos (seção 15). Lógica pura, sem DOM.
// Cada rodada os dois lados escolhem a ação às cegas; a ordem de execução vem da iniciativa.
// Distância em três zonas, clones ilusórios, substituição oculta, disfarce, defesa, foco de chakra
// e armas com estoque. A IA recebe só informação pública (ver ai.ts).
import { Rng } from '../core/rng';
import { JUTSUS, castChance } from '../data/jutsus';
import { maxVitals, type StatBlock } from '../data/stats';
import type { Personality, SpriteRole, Look } from '../data/characters';

export type Zone = 0 | 1 | 2;
export type Action =
  | { type: 'taijutsu' } | { type: 'kunai' } | { type: 'shuriken' }
  | { type: 'advance' } | { type: 'retreat' } | { type: 'defend' } | { type: 'focus' }
  | { type: 'jutsu'; id: string } | { type: 'yield' };

export interface Status {
  clones: number;
  /** Substituição preparada. Oculta do adversário. */
  substitution: boolean;
  disguised: boolean;
  defending: boolean;
  focused: boolean;
  /** Atrás do adversário depois de uma substituição: próximo golpe é crítico. */
  behind: boolean;
}

export interface Fighter {
  id: string;
  name: string;
  side: 0 | 1;
  role: SpriteRole;
  look?: Look;
  stats: StatBlock;
  hp: number; hpMax: number;
  chakra: number; chakraMax: number;
  stamina: number; staminaMax: number;
  jutsus: Record<string, number>;
  items: { kunai: number; shuriken: number };
  status: Status;
  /** Multiplicador de dano (dificuldade). */
  power: number;
  personality?: Personality;
  /** Técnicas do adversário que este lutador já viu funcionar. */
  knowledge: string[];
  /** Usos de cada técnica nesta luta (para treino depois). */
  used: Record<string, number>;
}

export interface Battle {
  fighters: [Fighter, Fighter];
  distance: Zone;
  round: number;
  maxRounds: number;
  rng: number;
  over: null | { winner: 0 | 1; reason: 'ko' | 'yield' | 'time' };
  /** O que cada lado mostrou publicamente na última ação. */
  lastPublic: [string, string];
}

export type Ev =
  | { t: 'act'; who: number; label: string }
  | { t: 'move'; who: number; distance: Zone; dash?: boolean }
  | { t: 'throw'; who: number; weapon: 'kunai' | 'shuriken' }
  | { t: 'strike'; who: number }
  | { t: 'hit'; who: number; amount: number; crit: boolean }
  | { t: 'miss'; who: number }
  | { t: 'clone-pop'; who: number }
  | { t: 'substitute'; who: number }
  | { t: 'clones'; who: number; count: number }
  | { t: 'disguise'; who: number }
  | { t: 'reveal'; who: number }
  | { t: 'seals'; who: number }
  | { t: 'fail'; who: number; jutsu: string }
  | { t: 'focus'; who: number; amount: number }
  | { t: 'defend'; who: number }
  | { t: 'counter'; who: number; amount: number }
  | { t: 'text'; text: string }
  | { t: 'end'; winner: number; reason: string };

export function freshStatus(): Status {
  return { clones: 0, substitution: false, disguised: false, defending: false, focused: false, behind: false };
}

export interface FighterInput {
  id: string; name: string; role: SpriteRole; look?: Look; stats: StatBlock; jutsus: Record<string, number>;
  items?: { kunai: number; shuriken: number }; vitals?: { hp: number; chakra: number; stamina: number };
  power?: number; personality?: Personality;
}

export function makeFighter(input: FighterInput, side: 0 | 1): Fighter {
  const stats = Object.fromEntries(Object.entries(input.stats).map(([k, v]) => [k, Math.floor(v)])) as StatBlock;
  const m = maxVitals(stats);
  return {
    id: input.id, name: input.name, side, role: input.role, look: input.look, stats,
    hp: input.vitals?.hp ?? m.hp, hpMax: m.hp, chakra: input.vitals?.chakra ?? m.chakra, chakraMax: m.chakra,
    stamina: input.vitals?.stamina ?? m.stamina, staminaMax: m.stamina,
    jutsus: { ...input.jutsus }, items: { ...(input.items ?? { kunai: 6, shuriken: 10 }) }, status: freshStatus(),
    power: input.power ?? 1, personality: input.personality, knowledge: [], used: {},
  };
}

export function startBattle(a: Fighter, b: Fighter, seed: number, distance: Zone = 1, maxRounds = 14): Battle {
  return { fighters: [a, b], distance, round: 0, maxRounds, rng: seed >>> 0, over: null, lastPublic: ['', ''] };
}

export const STAMINA_COST: Record<string, number> = { taijutsu: 4, kunai: 2, shuriken: 2, advance: 2, retreat: 2, defend: 0, focus: 0, jutsu: 0, yield: 0 };

/** Ações válidas no estado atual (usado pela interface e pela IA). */
export function available(b: Battle, side: 0 | 1): { action: Action; ok: boolean; why?: string }[] {
  const me = b.fighters[side];
  const out: { action: Action; ok: boolean; why?: string }[] = [];
  out.push({ action: { type: 'taijutsu' }, ok: true });
  out.push({ action: { type: 'kunai' }, ok: me.items.kunai > 0, why: 'Sem kunai' });
  out.push({ action: { type: 'shuriken' }, ok: me.items.shuriken > 0, why: 'Sem shuriken' });
  out.push({ action: { type: 'advance' }, ok: b.distance > 0, why: 'Já está colado' });
  out.push({ action: { type: 'retreat' }, ok: b.distance < 2, why: 'Distância máxima' });
  out.push({ action: { type: 'defend' }, ok: true });
  out.push({ action: { type: 'focus' }, ok: me.chakra < me.chakraMax, why: 'Chakra cheio' });
  for (const id of Object.keys(me.jutsus)) {
    const j = JUTSUS[id];
    if (!j || j.era !== 'academia') continue;
    const active = (j.effect === 'substitution' && me.status.substitution) || (j.effect === 'disguise' && me.status.disguised);
    out.push({ action: { type: 'jutsu', id }, ok: me.chakra >= j.chakraCost && !active, why: active ? 'Já está ativo' : 'Chakra insuficiente' });
  }
  return out;
}

export function actionLabel(a: Action): string {
  switch (a.type) {
    case 'taijutsu': return 'Taijutsu';
    case 'kunai': return 'Kunai';
    case 'shuriken': return 'Shuriken';
    case 'advance': return 'Avançar';
    case 'retreat': return 'Recuar';
    case 'defend': return 'Defender';
    case 'focus': return 'Concentrar chakra';
    case 'yield': return 'Render-se';
    case 'jutsu': return JUTSUS[a.id]?.name ?? a.id;
  }
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Resolve uma rodada completa. Muta a batalha e devolve os eventos para a apresentação. */
export function resolveRound(b: Battle, actions: [Action, Action]): Ev[] {
  if (b.over) return [];
  const rng = new Rng(b.rng);
  const ev: Ev[] = [];
  b.round += 1;
  const init = b.fighters.map((f, i) => f.stats.Velocidade + rng.next() * 3 - (actions[i].type === 'focus' ? 2 : 0));
  const order: (0 | 1)[] = init[0] >= init[1] ? [0, 1] : [1, 0];
  for (const f of b.fighters) f.status.focused = false;
  actions.forEach((a, i) => { if (a.type === 'focus') b.fighters[i].status.focused = true; });

  for (const side of order) {
    if (b.over) break;
    const me = b.fighters[side];
    me.status.defending = false;
    act(b, side, actions[side], rng, ev);
  }
  for (const f of b.fighters) {
    f.status.focused = false;
    f.stamina = Math.min(f.staminaMax, f.stamina + 1);
  }
  if (!b.over && b.round >= b.maxRounds) {
    const [p, q] = b.fighters.map((f) => f.hp / f.hpMax);
    b.over = { winner: p >= q ? 0 : 1, reason: 'time' };
    ev.push({ t: 'end', winner: b.over.winner, reason: 'time' });
  }
  b.rng = rng.state;
  return ev;
}

function act(b: Battle, side: 0 | 1, a: Action, rng: Rng, ev: Ev[]) {
  const me = b.fighters[side];
  const foe = b.fighters[side === 0 ? 1 : 0];
  ev.push({ t: 'act', who: side, label: actionLabel(a) });
  const cost = STAMINA_COST[a.type] ?? 0;
  const exhausted = me.stamina < cost;
  me.stamina = Math.max(0, me.stamina - cost);
  me.used[a.type === 'jutsu' ? a.id : a.type] = (me.used[a.type === 'jutsu' ? a.id : a.type] ?? 0) + 1;

  switch (a.type) {
    case 'yield':
      b.over = { winner: foe.side, reason: 'yield' };
      ev.push({ t: 'end', winner: foe.side, reason: 'yield' });
      return;
    case 'advance':
      b.distance = (b.distance - 1) as Zone;
      ev.push({ t: 'move', who: side, distance: b.distance });
      b.lastPublic[side] = 'move';
      return;
    case 'retreat':
      b.distance = (b.distance + 1) as Zone;
      ev.push({ t: 'move', who: side, distance: b.distance });
      b.lastPublic[side] = 'move';
      return;
    case 'defend':
      me.status.defending = true;
      me.stamina = Math.min(me.staminaMax, me.stamina + 4);
      ev.push({ t: 'defend', who: side });
      b.lastPublic[side] = 'defend';
      return;
    case 'focus': {
      const amount = Math.max(3, Math.round(me.chakraMax * 0.28));
      me.chakra = Math.min(me.chakraMax, me.chakra + amount);
      me.stamina = Math.min(me.staminaMax, me.stamina + 2);
      ev.push({ t: 'focus', who: side, amount });
      b.lastPublic[side] = 'focus';
      return;
    }
    case 'jutsu':
      castJutsu(b, side, a.id, rng, ev);
      return;
    case 'taijutsu': {
      let dash = false;
      if (b.distance > 0) { dash = true; b.distance = 0; ev.push({ t: 'move', who: side, distance: 0, dash: true }); }
      ev.push({ t: 'strike', who: side });
      const base = 3 + me.stats.Força * 1.1 + me.stats.Taijutsu * 1.3 + rng.int(0, 3);
      attack(b, side, 'taijutsu', base * (dash ? 0.8 : 1) * (exhausted ? 0.6 : 1), 0.82, rng, ev);
      b.lastPublic[side] = 'attack';
      return;
    }
    case 'kunai': {
      me.items.kunai -= 1;
      if (b.distance === 0) {
        ev.push({ t: 'strike', who: side });
        attack(b, side, 'kunai', (4 + me.stats.Bukijutsu * 1.1 + rng.int(0, 3)) * (exhausted ? 0.6 : 1), 0.8, rng, ev);
      } else {
        ev.push({ t: 'throw', who: side, weapon: 'kunai' });
        attack(b, side, 'kunai', (4 + me.stats.Bukijutsu * 1.25 + rng.int(0, 3)) * (exhausted ? 0.6 : 1), b.distance === 1 ? 0.78 : 0.66, rng, ev);
      }
      b.lastPublic[side] = 'attack';
      return;
    }
    case 'shuriken': {
      me.items.shuriken -= 1;
      ev.push({ t: 'throw', who: side, weapon: 'shuriken' });
      attack(b, side, 'shuriken', (2.5 + me.stats.Bukijutsu * 0.8 + rng.int(0, 2)) * (exhausted ? 0.6 : 1), [0.6, 0.74, 0.84][b.distance], rng, ev);
      b.lastPublic[side] = 'attack';
      return;
    }
  }
}

function castJutsu(b: Battle, side: 0 | 1, id: string, rng: Rng, ev: Ev[]) {
  const me = b.fighters[side];
  const j = JUTSUS[id];
  const mastery = me.jutsus[id] ?? 0;
  if (!j || me.chakra < j.chakraCost) { ev.push({ t: 'text', text: `${me.name} não tem chakra suficiente.` }); return; }
  me.chakra -= j.chakraCost;
  ev.push({ t: 'seals', who: side });
  b.lastPublic[side] = 'seals';
  if (!rng.chance(castChance(mastery, me.stats['Controle de chakra'], j.rank))) {
    ev.push({ t: 'fail', who: side, jutsu: id });
    return;
  }
  if (j.effect === 'clones') {
    const count = 1 + (mastery >= 45 ? 1 : 0) + (mastery >= 80 ? 1 : 0);
    me.status.clones = count;
    ev.push({ t: 'clones', who: side, count });
    b.lastPublic[side] = 'clones';
  } else if (j.effect === 'substitution') {
    // Oculto: o adversário só vê os selos.
    me.status.substitution = true;
  } else if (j.effect === 'disguise') {
    me.status.disguised = true;
    ev.push({ t: 'disguise', who: side });
    b.lastPublic[side] = 'disguise';
  }
}

function learnTech(f: Fighter, tech: string) {
  if (!f.knowledge.includes(tech)) f.knowledge.push(tech);
}

function attack(b: Battle, side: 0 | 1, kind: 'taijutsu' | 'kunai' | 'shuriken', raw: number, baseHit: number, rng: Rng, ev: Ev[]) {
  const me = b.fighters[side];
  const foe = b.fighters[side === 0 ? 1 : 0];
  let crit = false;
  if (me.status.behind || me.status.disguised) {
    crit = true;
    if (me.status.disguised) ev.push({ t: 'reveal', who: side });
    me.status.behind = false;
    me.status.disguised = false;
  }
  // Clones: o atacante pode acertar uma ilusão.
  if (foe.status.clones > 0) {
    const pierce = clamp((me.stats.Percepção - foe.stats['Controle de chakra']) * 0.07 + (me.knowledge.includes('bunshin') ? 0.12 : 0), 0, 0.7);
    const odds = (foe.status.clones / (foe.status.clones + 1)) * (1 - pierce);
    if (rng.chance(odds)) {
      foe.status.clones -= 1;
      learnTech(me, 'bunshin');
      ev.push({ t: 'clone-pop', who: foe.side });
      return;
    }
  }
  let hit = baseHit + (me.stats.Velocidade - foe.stats.Velocidade) * 0.03 + (kind === 'taijutsu' ? 0 : (me.stats.Percepção - 3) * 0.015);
  if (foe.status.disguised) hit -= 0.35;
  if (foe.status.defending) hit -= 0.08;
  if (crit) hit += 0.25;
  if (!rng.chance(clamp(hit, 0.1, 0.97))) {
    ev.push({ t: 'miss', who: foe.side });
    maybeCounter(b, foe, me, kind, rng, ev);
    return;
  }
  // Substituição: anula o golpe e coloca o defensor atrás do atacante.
  if (foe.status.substitution) {
    foe.status.substitution = false;
    foe.status.behind = true;
    learnTech(me, 'kawarimi');
    ev.push({ t: 'substitute', who: foe.side });
    return;
  }
  let dmg = raw * me.power;
  if (crit) dmg *= 1.6;
  if (foe.status.defending) dmg *= 0.5;
  if (foe.status.focused) dmg *= 1.25;
  if (kind === 'shuriken') dmg = dmg * (b.distance === 2 ? 1.1 : 1);
  const amount = Math.max(1, Math.round(dmg));
  foe.hp = Math.max(0, foe.hp - amount);
  if (foe.status.disguised) { foe.status.disguised = false; ev.push({ t: 'reveal', who: foe.side }); }
  ev.push({ t: 'hit', who: foe.side, amount, crit });
  if (foe.hp <= 0) {
    b.over = { winner: side, reason: 'ko' };
    ev.push({ t: 'end', winner: side, reason: 'ko' });
    return;
  }
  maybeCounter(b, foe, me, kind, rng, ev);
}

function maybeCounter(b: Battle, defender: Fighter, attacker: Fighter, kind: string, rng: Rng, ev: Ev[]) {
  if (!defender.status.defending || kind !== 'taijutsu' || b.over || b.distance !== 0) return;
  if (defender.stats.Taijutsu < attacker.stats.Taijutsu - 1 || !rng.chance(0.35)) return;
  const amount = Math.max(1, Math.round((2 + defender.stats.Taijutsu * 0.8) * defender.power));
  attacker.hp = Math.max(0, attacker.hp - amount);
  ev.push({ t: 'counter', who: defender.side, amount });
  if (attacker.hp <= 0) {
    b.over = { winner: defender.side, reason: 'ko' };
    ev.push({ t: 'end', winner: defender.side, reason: 'ko' });
  }
}
