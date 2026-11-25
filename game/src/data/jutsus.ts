// Catálogo de técnicas (seção 10). Estrutura preparada para todas as eras.
// O catálogo inclui as técnicas da Academia e técnicas de combate usadas na Vida Genin.
import type { Element, Stat } from './stats';

export type JutsuCategory = 'Ninjutsu' | 'Taijutsu' | 'Genjutsu' | 'Bukijutsu' | 'Fūinjutsu';
export type JutsuRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export type CombatEffect = 'clones' | 'substitution' | 'disguise' | 'damage';

export interface Jutsu {
  id: string;
  name: string;
  /** Tradução exibida junto ao nome. */
  meaning: string;
  category: JutsuCategory;
  rank: JutsuRank;
  element?: Element;
  clan?: string;
  era: 'academia' | 'classico' | 'timeskip' | 'shippuden' | 'lendas' | 'guerra' | 'legado';
  /** Como se aprende (professor, pergaminho, evento). */
  acquisition: string;
  requirements: Partial<Record<Stat, number>>;
  chakraCost: number;
  staminaCost: number;
  /** Alcance em zonas de distância do combate (0 corpo a corpo, 1 médio, 2 longe). */
  range: [number, number];
  effect: CombatEffect;
  power?: number;
  /** Atributo que treina com o uso. */
  trains: Stat[];
  evolvesTo?: string[];
  description: string;
}

export const JUTSUS: Record<string, Jutsu> = {
  henge: {
    id: 'henge', name: 'Henge no Jutsu', meaning: 'Técnica da Transformação', category: 'Ninjutsu', rank: 'E', era: 'academia',
    acquisition: 'Aula de Iruka na Academia', requirements: {}, chakraCost: 3, staminaCost: 0, range: [0, 2], effect: 'disguise',
    trains: ['Ninjutsu', 'Controle de chakra'],
    description: 'Muda a aparência do usuário. Em combate, o disfarce confunde o adversário e prepara um ataque surpresa.',
  },
  kawarimi: {
    id: 'kawarimi', name: 'Kawarimi no Jutsu', meaning: 'Técnica da Substituição', category: 'Ninjutsu', rank: 'E', era: 'academia',
    acquisition: 'Aula de Iruka na Academia', requirements: {}, chakraCost: 5, staminaCost: 0, range: [0, 2], effect: 'substitution',
    trains: ['Ninjutsu', 'Velocidade'],
    description: 'Troca de lugar com um objeto próximo no instante do golpe. Anula o próximo ataque recebido e deixa você atrás do adversário.',
  },
  bunshin: {
    id: 'bunshin', name: 'Bunshin no Jutsu', meaning: 'Técnica do Clone', category: 'Ninjutsu', rank: 'E', era: 'academia',
    acquisition: 'Aula de Iruka na Academia', requirements: {}, chakraCost: 4, staminaCost: 0, range: [0, 2], effect: 'clones',
    trains: ['Ninjutsu', 'Controle de chakra'],
    description: 'Cria cópias ilusórias sem corpo. Os clones não causam dano, mas podem atrair os golpes do adversário. Exige controle fino de chakra.',
  },
  // ——— Vida Genin ———
  'kage-bunshin': {
    id: 'kage-bunshin', name: 'Kage Bunshin no Jutsu', meaning: 'Técnica do Clone das Sombras', category: 'Ninjutsu', rank: 'B', era: 'classico',
    acquisition: 'Pergaminho proibido de Konoha', requirements: { Chakra: 12 }, chakraCost: 18, staminaCost: 0, range: [0, 2], effect: 'clones',
    trains: ['Ninjutsu', 'Chakra'], evolvesTo: ['tajuu-kage-bunshin'],
    description: 'Forma mais cópias que o Bunshin comum e exige muito mais chakra.',
  },
  gokakyu: {
    id: 'gokakyu', name: 'Katon: Gōkakyū no Jutsu', meaning: 'Grande Bola de Fogo', category: 'Ninjutsu', rank: 'C', element: 'Fogo', era: 'classico',
    acquisition: 'Tradição do clã Uchiha ou mestre de Katon', requirements: { Ninjutsu: 6, Chakra: 6 }, chakraCost: 12, staminaCost: 0, range: [1, 2], effect: 'damage', power: 18,
    trains: ['Ninjutsu', 'Chakra'],
    description: 'Uma grande esfera de fogo expelida pela boca.',
  },
};

export const ACADEMY_JUTSUS = Object.values(JUTSUS).filter((j) => j.era === 'academia');

/** Chance de executar a técnica com sucesso. Domínio e controle importam mais que reserva. */
export function castChance(mastery: number, control: number, rank: JutsuRank = 'E'): number {
  const difficulty = { E: 0, D: 8, C: 18, B: 30, A: 45, S: 60 }[rank];
  return Math.max(0.05, Math.min(0.98, 0.35 + mastery / 160 + control * 0.03 - difficulty / 100));
}
