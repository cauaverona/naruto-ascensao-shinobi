// Personagens simulados (seção 6). Cada NPC tem atributos, técnicas, personalidade, objetivos,
// relações, rotina e progressão própria. Conteúdo marcado com `original: true` foi criado para o jogo.
import { baseStats, type StatBlock, type Stat, type Element, type Rank } from './stats';
import type { BandPosition } from './appearance';

export type SpriteRole = 'player' | 'iruka' | 'emi' | 'gen' | 'naruto' | 'sasuke' | 'sakura';
export type MapId = 'rua' | 'campo' | 'sala' | 'estrada' | 'ondas' | 'floresta' | 'arena' | 'suna' | 'vale';
export type Period = 0 | 1 | 2; // manhã, tarde, noite

export interface Look {
  skin: string; hair: string; coat: string; cut: string;
  clan?: string; trim?: string; accessory?: string; mark?: string; band?: string;
  outfit?: string; scarf?: string; accessoryTone?: string; bandPosition?: BandPosition; bandAtWaist?: boolean;
}

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

const FIELD_PACE: Record<string, [number, number]> = {
  ino: [12, 8], shikamaru: [10, -4], choji: [12, 5], kiba: [-13, -7], hinata: [3, -14], shino: [12, -5],
  'rock-lee': [-12, -8], neji: [12, -10], tenten: [14, 8], guy: [12, 4],
};

function trainingPath(id: string, x: number, y: number): [number, number][] | undefined {
  const pace = FIELD_PACE[id];
  if (!pace) return;
  const [dx, dy] = pace;
  return [[x, y], [x + dx, y + dy]];
}

function student(id: string, name: string, clan: string, look: Look, seat: [number, number],
  training: [number, number], strength: Stat, values: [number, number, number], goal: string): CharacterDef {
  const [aggression, cunning, caution] = values;
  return {
    id, name, clan, look: { scarf: 'Sem cachecol', ...look }, role: 'player', age: 12,
    rank: 'Estudante da Academia', affinities: [], stats: stats({ [strength]: 5, Chakra: 3, Vitalidade: 3 }),
    jutsus: { henge: 45 + cunning * 35, kawarimi: 45 + caution * 35, bunshin: 62 + cunning * 25 },
    personality: { aggression, cunning, caution, traits: [goal] }, goals: [goal], habits: { [strength]: 0.22 },
    practice: { bunshin: 1.1 }, classmate: true,
    schedule: {
      0: { map: 'sala', x: seat[0], y: seat[1], dir: 'up' },
      1: { map: 'campo', x: training[0], y: training[1], dir: 'down', route: trainingPath(id, ...training) },
    },
  };
}

function teacher(id: string, name: string, clan: string, look: Look, goal: string, age: number): CharacterDef {
  return {
    id, name, clan, look: { outfit: 'Colete de campo', scarf: 'Sem cachecol', ...look }, role: 'player',
    age, rank: 'Jōnin', original: id === 'naomi', affinities: [], classmate: false, schedule: {},
    stats: { ...baseStats(8), Percepção: 10 }, jutsus: { henge: 95, kawarimi: 95, bunshin: 95 },
    personality: { aggression: 0.48, cunning: 0.8, caution: 0.58, traits: [goal] },
    goals: [goal], habits: {},
  };
}

export const GUY_TEAM = ['rock-lee', 'neji', 'tenten'] as const;

function visitingGenin(id: (typeof GUY_TEAM)[number], name: string, clan: string, look: Look, x: number, y: number,
  abilities: Partial<StatBlock>, jutsus: Record<string, number>, values: [number, number, number], goal: string): CharacterDef {
  const [aggression, cunning, caution] = values;
  return {
    id, name, clan, look: { scarf: 'Sem cachecol', ...look }, role: 'player', age: 13, rank: 'Genin', affinities: [],
    stats: stats({ Vitalidade: 3, Chakra: 3, Resistência: 3, ...abilities }), jutsus,
    personality: { aggression, cunning, caution, traits: [goal] }, goals: [goal], habits: {},
    classmate: false, schedule: { 1: { map: 'campo', x, y, dir: 'down', route: trainingPath(id, x, y) } },
  };
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
  ino: student('ino', 'Ino', 'Yamanaka',
    { skin: 'Clara', hair: 'Loiro', cut: 'Rabo lateral', coat: 'Roxo', outfit: 'Traje leve' },
    [120, 138], [380, 256], 'Inteligência', [0.56, 0.74, 0.45], 'Liderar a própria equipe'),
  shikamaru: student('shikamaru', 'Shikamaru', 'Nara',
    { skin: 'Dourada', hair: 'Preto', cut: 'Rabo alto', coat: 'Folha', outfit: 'Jaqueta de treino' },
    [120, 170], [151, 260], 'Inteligência', [0.2, 0.95, 0.72], 'Resolver problemas com o menor esforço'),
  choji: student('choji', 'Chōji', 'Akimichi',
    { skin: 'Clara', hair: 'Castanho', cut: 'Ondulado', coat: 'Musgo', outfit: 'Colete de campo' },
    [360, 136], [160, 306], 'Resistência', [0.45, 0.32, 0.62], 'Proteger os amigos'),
  kiba: student('kiba', 'Kiba', 'Inuzuka',
    { skin: 'Bronzeada', hair: 'Castanho', cut: 'Espetado', coat: 'Cinza', mark: 'Marcas vermelhas', outfit: 'Jaqueta de treino' },
    [360, 168], [501, 282], 'Velocidade', [0.85, 0.4, 0.22], 'Aprimorar o faro em parceria com Akamaru'),
  hinata: student('hinata', 'Hinata', 'Hyūga',
    { skin: 'Pálida', hair: 'Preto', cut: 'Franja', coat: 'Branco', trim: 'Roxo', outfit: 'Jaqueta de treino' },
    [196, 199], [276, 259], 'Controle de chakra', [0.37, 0.64, 0.82], 'Ganhar confiança no próprio estilo de luta'),
  shino: student('shino', 'Shino', 'Aburame',
    { skin: 'Dourada', hair: 'Preto', cut: 'Curto', coat: 'Musgo', scarf: 'Gola enrolada', accessory: 'Óculos', outfit: 'Capa curta' },
    [284, 199], [550, 316], 'Percepção', [0.31, 0.85, 0.77], 'Observar o terreno antes de agir'),
  'rock-lee': visitingGenin('rock-lee', 'Rock Lee', 'Sem clã',
    { skin: 'Clara', hair: 'Preto', cut: 'Corte tigela', coat: 'Folha', outfit: 'Traje leve', trim: 'Laranja', band: 'Vermelho', bandAtWaist: true, mark: 'Sobrancelhas fortes' },
    259, 263, { Força: 4, Velocidade: 5, Taijutsu: 6, Resistência: 4 }, {}, [0.87, 0.32, 0.37],
    'Dominar o taijutsu por meio do treino'),
  neji: visitingGenin('neji', 'Neji', 'Hyūga',
    { skin: 'Pálida', hair: 'Castanho', cut: 'Longo', coat: 'Branco', outfit: 'Túnica cruzada', band: 'Azul' },
    361, 236, { Percepção: 5, Taijutsu: 5, Velocidade: 4, 'Controle de chakra': 5 },
    { kawarimi: 60 }, [0.43, 0.72, 0.67], 'Aprimorar a precisão em combate'),
  tenten: visitingGenin('tenten', 'Tenten', 'Sem clã',
    { skin: 'Dourada', hair: 'Chocolate', cut: 'Coques duplos', coat: 'Rosa', outfit: 'Túnica cruzada', trim: 'Vermelho' },
    527, 187, { Bukijutsu: 6, Percepção: 5, Velocidade: 4 }, { kawarimi: 45 }, [0.5, 0.65, 0.54],
    'Acertar cada alvo de primeira'),
  guy: {
    ...teacher('guy', 'Might Guy', 'Sem clã', { skin: 'Bronzeada', hair: 'Preto', cut: 'Franja', coat: 'Musgo',
      trim: 'Laranja', band: 'Vermelho' }, 'Preparar Genin com disciplina e trabalho de equipe', 26),
    schedule: { 1: { map: 'campo', x: 326, y: 243, dir: 'down', route: trainingPath('guy', 326, 243) } },
  },
  kakashi: teacher('kakashi', 'Kakashi', 'Hatake', { skin: 'Clara', hair: 'Prateado', cut: 'Espetado', coat: 'Folha', accessory: 'Máscara' }, 'Ensinar o valor da equipe', 26),
  asuma: teacher('asuma', 'Asuma', 'Sarutobi', { skin: 'Bronzeada', hair: 'Preto', cut: 'Espetado', coat: 'Musgo', band: 'Preto' }, 'Ensinar a proteger os companheiros', 27),
  kurenai: teacher('kurenai', 'Kurenai', 'Yūhi', { skin: 'Pálida', hair: 'Preto', cut: 'Longo', coat: 'Branco', trim: 'Vermelho', outfit: 'Túnica cruzada', band: 'Vermelho' }, 'Treinar a atenção aos detalhes', 27),
  naomi: teacher('naomi', 'Naomi', 'Sem clã', { skin: 'Morena', hair: 'Castanho', cut: 'Trança', coat: 'Índigo' }, 'Preparar a equipe para patrulhar Konoha', 28),
  maki: {
    id: 'maki', name: 'Maki', clan: 'Sem clã', role: 'player', age: 15, rank: 'Genin', original: true,
    look: { skin: 'Oliva', hair: 'Chocolate', cut: 'Meio preso', coat: 'Terracota',
      outfit: 'Jaqueta de treino', scarf: 'Lenço curto', trim: 'Jade', band: 'Verde' },
    affinities: [], stats: stats({ Vitalidade: 2, Chakra: 3, Resistência: 2, Velocidade: 3, Taijutsu: 3, Bukijutsu: 2 }),
    jutsus: { bunshin: 38, kawarimi: 42 },
    personality: { aggression: 0.52, cunning: 0.53, caution: 0.68, traits: ['metódica', 'protetora do posto'] },
    goals: ['Preparar equipes novas para a ronda'], habits: {}, schedule: {}, classmate: false,
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
