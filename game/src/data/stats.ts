// Atributos do Projeto Mestre (seção 8).
export const STATS = [
  'Vitalidade', 'Chakra', 'Controle de chakra', 'Força', 'Velocidade', 'Resistência',
  'Inteligência', 'Percepção', 'Ninjutsu', 'Taijutsu', 'Genjutsu', 'Bukijutsu',
  'Fūinjutsu', 'Senjutsu', 'Ninjutsu médico',
] as const;
export type Stat = (typeof STATS)[number];
export type StatBlock = Record<Stat, number>;

export function baseStats(value = 1): StatBlock {
  return Object.fromEntries(STATS.map((s) => [s, value])) as StatBlock;
}

/** Atributos visíveis na Era da Academia. Os demais existem, mas só aparecem quando forem relevantes. */
export const ACADEMY_STATS: Stat[] = [
  'Vitalidade', 'Chakra', 'Controle de chakra', 'Força', 'Velocidade', 'Resistência',
  'Inteligência', 'Percepção', 'Ninjutsu', 'Taijutsu', 'Genjutsu', 'Bukijutsu',
];

export const RANKS = ['Estudante da Academia', 'Genin', 'Chūnin', 'Tokubetsu Jōnin', 'Jōnin', 'Kage'] as const;
export type Rank = (typeof RANKS)[number];

export const ELEMENTS = ['Fogo', 'Água', 'Relâmpago', 'Terra', 'Vento'] as const;
export type Element = (typeof ELEMENTS)[number];

/** Ciclo canônico: Fogo > Vento > Relâmpago > Terra > Água > Fogo. */
export const ELEMENT_BEATS: Record<Element, Element> = {
  Fogo: 'Vento', Vento: 'Relâmpago', Relâmpago: 'Terra', Terra: 'Água', Água: 'Fogo',
};
export function elementMultiplier(attack?: Element, defense?: Element): number {
  if (!attack || !defense) return 1;
  if (ELEMENT_BEATS[attack] === defense) return 1.5;
  if (ELEMENT_BEATS[defense] === attack) return 0.67;
  return 1;
}

export interface Vitals { hp: number; chakra: number; stamina: number }

export function maxVitals(s: StatBlock): Vitals {
  return {
    hp: 30 + s.Vitalidade * 5 + s.Resistência * 2,
    chakra: 14 + s.Chakra * 5 + s['Controle de chakra'],
    stamina: 20 + s.Resistência * 3 + s.Vitalidade,
  };
}

/** Capacidade real de combate, separada de nível, patente e reputação. */
export function combatPower(s: StatBlock, masterySum = 0): number {
  const physical = s.Força + s.Velocidade + s.Taijutsu + s.Resistência;
  const chakra = s.Chakra + s['Controle de chakra'] + s.Ninjutsu + s.Genjutsu;
  const mind = s.Inteligência + s.Percepção + s.Bukijutsu;
  return Math.round(physical * 2 + chakra * 1.8 + mind * 1.5 + s.Vitalidade * 2 + masterySum / 25);
}
