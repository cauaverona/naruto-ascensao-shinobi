import type { Stat } from './stats';

export const TRAINING = {
  troncos: { name: 'Golpes nos troncos', station: 'Troncos', stats: ['Taijutsu', 'Força'], cost: 6 },
  alvos: { name: 'Arremesso de precisão', station: 'Alvos de arremesso', stats: ['Bukijutsu', 'Percepção'], cost: 4 },
  meditacao: { name: 'Controle de chakra', station: 'Pedra de meditação', stats: ['Controle de chakra', 'Chakra'], cost: 2 },
  arrancadas: { name: 'Arrancadas entre estacas', station: 'Circuito de treino', stats: ['Velocidade', 'Resistência'], cost: 4 },
  folego: { name: 'Ritmo de fôlego', station: 'Circuito de treino', stats: ['Vitalidade', 'Resistência'], cost: 3 },
  resistencia: { name: 'Voltas de resistência', station: 'Circuito de treino', stats: ['Resistência', 'Vitalidade'], cost: 5 },
  leitura: { name: 'Leitura tática', station: 'Mesa de estudos', stats: ['Inteligência', 'Percepção'], cost: 2 },
  ilusao: { name: 'Reconhecer ilusões', station: 'Mesa de estudos', stats: ['Genjutsu', 'Inteligência'], cost: 2 },
  moldagem: { name: 'Moldagem de chakra', station: 'Mesa de estudos', stats: ['Ninjutsu', 'Controle de chakra'], cost: 3 },
} satisfies Record<string, { name: string; station: string; stats: [Stat, Stat]; cost: number }>;

export type TrainingId = keyof typeof TRAINING;

export function trainingFor(stat: Stat) {
  const drills = Object.values(TRAINING);
  return drills.find((drill) => drill.stats[0] === stat) ?? drills.find((drill) => drill.stats[1] === stat);
}

