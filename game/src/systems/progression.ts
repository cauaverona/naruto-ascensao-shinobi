// Evolução por treino, combate, aulas e experiências (seção 8 e 21).
import type { Campaign } from '../state/campaign';
import { maxVitals, type Stat } from '../data/stats';

/** Custo em XP para subir de `value` para `value + 1`. Cresce devagar para evitar grind. */
export function statCost(value: number): number {
  return 1 + Math.max(0, value - 2) * 0.32;
}

/** Aplica treino em um atributo. Retorna quantos pontos subiram. */
export function train(c: Campaign, stat: Stat, amount: number): number {
  let gained = 0;
  c.statXp[stat] = (c.statXp[stat] ?? 0) + amount;
  while (c.statXp[stat] >= statCost(c.stats[stat])) {
    c.statXp[stat] -= statCost(c.stats[stat]);
    c.stats[stat] += 1;
    gained += 1;
  }
  if (gained) clampVitals(c, true);
  c.xp += Math.round(amount * 10);
  return gained;
}

export function practice(c: Campaign, jutsu: string, amount: number): number {
  if (!(jutsu in c.jutsus)) return 0;
  const before = c.jutsus[jutsu];
  // Ganho cai conforme o domínio se aproxima de 100.
  const gain = amount * (1 - before / 120);
  c.jutsus[jutsu] = Math.min(100, Math.round((before + gain) * 10) / 10);
  return c.jutsus[jutsu] - before;
}

export function learn(c: Campaign, jutsu: string, start = 10) {
  if (!(jutsu in c.jutsus)) c.jutsus[jutsu] = start;
}

export function level(c: Campaign): number {
  return Math.floor(Math.sqrt(c.xp / 25)) + 1;
}

/** Mantém PV/CH/RES dentro do máximo; `grow` preserva o ganho de máximo ao subir de atributo. */
export function clampVitals(c: Campaign, grow = false) {
  const m = maxVitals(c.stats);
  if (grow) { c.hp = Math.min(m.hp, c.hp + 2); c.chakra = Math.min(m.chakra, c.chakra + 2); }
  c.hp = Math.max(0, Math.min(m.hp, c.hp));
  c.chakra = Math.max(0, Math.min(m.chakra, c.chakra));
  c.stamina = Math.max(0, Math.min(m.stamina, c.stamina));
}

export function restoreAll(c: Campaign) {
  const m = maxVitals(c.stats);
  c.hp = m.hp; c.chakra = m.chakra; c.stamina = m.stamina;
}

export interface TrainingResult { gains: { stat: Stat; points: number }[]; mastery?: { jutsu: string; delta: number } }

/** Converte uma nota de minijogo (0..1) em treino de atributos e domínio. */
export function applyTraining(c: Campaign, stats: Stat[], score: number, base = 0.32, jutsu?: string): TrainingResult {
  const res: TrainingResult = { gains: [] };
  const fatigue = c.stamina < 8 ? 0.5 : 1;
  stats.forEach((s, i) => {
    const amount = (base + score * 0.5) * fatigue * (i === 0 ? 1 : 0.55);
    const points = train(c, s, amount);
    if (points) res.gains.push({ stat: s, points });
  });
  if (jutsu) res.mastery = { jutsu, delta: practice(c, jutsu, 6 + score * 16) };
  return res;
}
