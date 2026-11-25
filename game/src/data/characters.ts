// Personagens simulados (seção 6). Cada NPC tem atributos, técnicas, personalidade, objetivos,
// relações, rotina e progressão própria. Conteúdo marcado com `original: true` foi criado para o jogo.
import { baseStats, type StatBlock, type Stat, type Element, type Rank } from './stats';

export type SpriteRole = 'player' | 'iruka' | 'emi' | 'gen' | 'naruto' | 'sasuke' | 'sakura';
export type MapId = 'rua' | 'campo' | 'sala';
export type Period = 0 | 1 | 2; // manhã, tarde, noite

export interface Look { skin: string; hair: string; coat: string; cut: string; clan?: string; trim?: string; accessory?: string; mark?: string; band?: string }

export interface Personality {
  /** 0..1 — tendência a atacar em vez de se proteger. */
  aggression: number;
  /** 0..1 — usa técnicas e leitura do adversário. */
  cunning: number;
  /** 0..1 — se protege quando ferido. */
  caution: number;
  traits: string[];
}

export interface Spot { map: MapId; x: number; y: number; dir?: 'up' | 'down' | 'left' | 'right'; route?: [number, number][] }

export interface CharacterDef {
  id: string;
  name: string;
  role: SpriteRole;
  look?: Look;
  age: number;
  rank: Rank | 'Civil';
  clan: string;
  /** Afinidades conhecidas publicamente nesta era. Vazio quando ainda não foi revelada. */
  affinities: Element[];
  stats: StatBlock;
  jutsus: Record<string, number>;
  personality: Personality;
  goals: string[];
  /** Hábitos de treino: atributos que o NPC desenvolve sozinho a cada dia. */
  habits: Partial<Record<Stat, number>>;
  /** Progresso diário de domínio nas técnicas que ele pratica. */
  practice?: Record<string, number>;
  schedule: Partial<Record<Period, Spot>>;
  classmate: boolean;
  original?: boolean;
}

function stats(over: Partial<StatBlock>): StatBlock {
  return { ...baseStats(1), ...over };
}

export const CHARACTERS: Record<string, CharacterDef> = {
  iruka: {
    id: 'iruka', name: 'Iruka', role: 'iruka', age: 23, rank: 'Chūnin', clan: 'Umino', affinities: [],
    stats: stats({ Vitalidade: 9, Chakra: 9, 'Controle de chakra': 10, Força: 8, Velocidade: 9, Resistência: 9, Inteligência: 10, Percepção: 9, Ninjutsu: 9, Taijutsu: 8, Bukijutsu: 9, Genjutsu: 5 }),
    jutsus: { henge: 100, kawarimi: 100, bunshin: 100 },
    personality: { aggression: 0.4, cunning: 0.7, caution: 0.6, traits: ['paciente', 'protetor', 'rigoroso nas aulas'] },
    goals: ['Formar a turma inteira', 'Que Naruto encontre seu lugar na vila'],
    habits: {}, classmate: false,
    schedule: { 0: { map: 'sala', x: 240, y: 92, dir: 'down' }, 1: { map: 'rua', x: 458, y: 222, dir: 'down' } },
  },
  naruto: {
    id: 'naruto', name: 'Naruto', role: 'naruto', age: 12, rank: 'Estudante da Academia', clan: 'Uzumaki', affinities: [],
    stats: stats({ Vitalidade: 5, Chakra: 7, 'Controle de chakra': 1, Força: 3, Velocidade: 3, Resistência: 5, Inteligência: 1, Percepção: 2, Ninjutsu: 2, Taijutsu: 3, Bukijutsu: 2 }),
    jutsus: { henge: 55, kawarimi: 45, bunshin: 4 },
    personality: { aggression: 0.9, cunning: 0.35, caution: 0.1, traits: ['barulhento', 'persistente', 'quer ser reconhecido'] },
    goals: ['Tornar-se Hokage', 'Ser reconhecido pela vila', 'Passar no exame de graduação'],
    habits: { Resistência: 0.35, Chakra: 0.3, Taijutsu: 0.25 }, practice: { bunshin: 0.6, henge: 1.5 },
    classmate: true,
    schedule: {
      0: { map: 'sala', x: 196, y: 168, dir: 'up' },
      1: { map: 'campo', x: 196, y: 236, dir: 'up', route: [[196, 236], [232, 236], [232, 252], [196, 252]] },
      2: { map: 'rua', x: 160, y: 222, dir: 'up' },
    },
  },
  sasuke: {
    id: 'sasuke', name: 'Sasuke', role: 'sasuke', age: 12, rank: 'Estudante da Academia', clan: 'Uchiha', affinities: [],
    stats: stats({ Vitalidade: 4, Chakra: 4, 'Controle de chakra': 4, Força: 4, Velocidade: 5, Resistência: 3, Inteligência: 4, Percepção: 4, Ninjutsu: 4, Taijutsu: 5, Bukijutsu: 5, Genjutsu: 2 }),
    jutsus: { henge: 85, kawarimi: 90, bunshin: 80 },
    personality: { aggression: 0.65, cunning: 0.85, caution: 0.45, traits: ['reservado', 'focado', 'orgulhoso'] },
    goals: ['Ficar mais forte', 'Superar o próprio irmão'],
    habits: { Taijutsu: 0.35, Bukijutsu: 0.35, Velocidade: 0.25 }, practice: { kawarimi: 1 },
    classmate: true,
    schedule: {
      0: { map: 'sala', x: 284, y: 136, dir: 'up' },
      1: { map: 'campo', x: 404, y: 176, dir: 'right', route: [[404, 176], [404, 196]] },
    },
  },
  sakura: {
    id: 'sakura', name: 'Sakura', role: 'sakura', age: 12, rank: 'Estudante da Academia', clan: 'Haruno', affinities: [],
    stats: stats({ Vitalidade: 3, Chakra: 3, 'Controle de chakra': 6, Força: 2, Velocidade: 3, Resistência: 2, Inteligência: 6, Percepção: 4, Ninjutsu: 3, Taijutsu: 2, Bukijutsu: 3, Genjutsu: 3 }),
    jutsus: { henge: 90, kawarimi: 80, bunshin: 85 },
    personality: { aggression: 0.35, cunning: 0.7, caution: 0.7, traits: ['estudiosa', 'determinada', 'competitiva'] },
    goals: ['Ser a melhor aluna da turma', 'Chamar a atenção de Sasuke'],
    habits: { Inteligência: 0.3, 'Controle de chakra': 0.3, Genjutsu: 0.15 },
    classmate: true,
    schedule: {
      0: { map: 'sala', x: 240, y: 136, dir: 'up' },
      1: { map: 'rua', x: 506, y: 256, dir: 'down', route: [[506, 243], [521, 243], [521, 256], [506, 256]] },
    },
  },
  emi: {
    id: 'emi', name: 'Emi', role: 'emi', age: 12, rank: 'Estudante da Academia', clan: 'Sem clã', affinities: [], original: true,
    stats: stats({ Vitalidade: 3, Chakra: 3, 'Controle de chakra': 3, Força: 2, Velocidade: 4, Resistência: 2, Inteligência: 3, Percepção: 4, Ninjutsu: 2, Taijutsu: 2, Bukijutsu: 3 }),
    jutsus: { henge: 60, kawarimi: 70, bunshin: 45 },
    personality: { aggression: 0.45, cunning: 0.55, caution: 0.5, traits: ['agitada', 'curiosa', 'sabe de tudo que acontece na vila'] },
    goals: ['Ser a mensageira mais rápida da vila'],
    habits: { Velocidade: 0.3, Percepção: 0.2 }, practice: { bunshin: 1.2 },
    classmate: true,
    schedule: {
      0: { map: 'sala', x: 196, y: 136, dir: 'up' },
      1: { map: 'rua', x: 315, y: 258, dir: 'right', route: [[379, 258], [379, 270], [315, 270], [315, 258]] },
      2: { map: 'rua', x: 600, y: 262, dir: 'left', route: [[600, 262], [660, 262]] },
    },
  },
  daichi: {
    id: 'daichi', name: 'Daichi', role: 'player', look: { skin: 'Morena', hair: 'Castanho', coat: 'Terracota', cut: 'Curto' },
    age: 12, rank: 'Estudante da Academia', clan: 'Sem clã', affinities: [], original: true,
    stats: stats({ Vitalidade: 3, Chakra: 2, 'Controle de chakra': 2, Força: 3, Velocidade: 2, Resistência: 3, Inteligência: 2, Percepção: 2, Ninjutsu: 2, Taijutsu: 3, Bukijutsu: 2 }),
    jutsus: { henge: 50, kawarimi: 55, bunshin: 30 },
    personality: { aggression: 0.8, cunning: 0.3, caution: 0.3, traits: ['competitivo', 'franco', 'filho de ferreiro'] },
    goals: ['Provar que força vale mais que técnica'],
    habits: { Força: 0.3, Taijutsu: 0.3, Resistência: 0.2 }, practice: { bunshin: 1.5 },
    classmate: true,
    schedule: {
      0: { map: 'sala', x: 284, y: 168, dir: 'up' },
      1: { map: 'campo', x: 300, y: 300, dir: 'up', route: [[300, 300], [340, 300]] },
    },
  },
  gen: {
    id: 'gen', name: 'Sr. Gen', role: 'gen', age: 58, rank: 'Civil', clan: 'Sem clã', affinities: [], original: true,
    stats: stats({}), jutsus: {},
    personality: { aggression: 0, cunning: 0.4, caution: 1, traits: ['comerciante', 'conversador'] },
    goals: ['Manter a mercearia aberta'], habits: {}, classmate: false,
    schedule: { 0: { map: 'rua', x: 190, y: 215, dir: 'down' }, 1: { map: 'rua', x: 190, y: 215, dir: 'down' }, 2: { map: 'rua', x: 190, y: 215, dir: 'down' } },
  },
};

export const CLASSMATES = Object.values(CHARACTERS).filter((c) => c.classmate).map((c) => c.id);
