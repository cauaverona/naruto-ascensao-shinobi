// Conteúdo da Era da Academia: itens, eras, currículo das aulas e perguntas.
import type { Stat } from './stats';

export interface Item { id: string; name: string; price: number; description: string; battle?: boolean }
export const ITEMS: Record<string, Item> = {
  kunai: { id: 'kunai', name: 'Kunai', price: 12, description: 'Lâmina de arremesso e de corte. Recolhida depois dos treinos.', battle: true },
  shuriken: { id: 'shuriken', name: 'Shuriken', price: 6, description: 'Estrela de arremesso. Mais precisa à distância, menos dano.', battle: true },
  onigiri: { id: 'onigiri', name: 'Onigiri', price: 15, description: 'Recupera 12 de resistência fora de combate.' },
};

export const ERAS = [
  { id: 'academia', name: 'Academia Ninja', open: true },
  { id: 'classico', name: 'Naruto Clássico', open: false },
  { id: 'timeskip', name: 'Timeskip', open: false },
  { id: 'shippuden', name: 'Início de Shippuden', open: false },
  { id: 'lendas', name: 'Ascensão das Lendas', open: false },
  { id: 'guerra', name: 'Quarta Guerra Mundial Ninja', open: false },
  { id: 'legado', name: 'Legado Shinobi', open: false },
] as const;
export type EraId = (typeof ERAS)[number]['id'];

export const PERIODS = ['Manhã', 'Tarde', 'Noite'] as const;
export const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
/** Dia do exame de graduação. */
export const EXAM_DAY = 10;
/** Ações de treino disponíveis em cada tarde. */
export const AFTERNOON_ACTIONS = 3;

export type LessonKind = 'quiz' | 'seals' | 'kunai' | 'chakra' | 'spar' | 'enroll';
export interface Lesson {
  day: number;
  title: string;
  kind: LessonKind;
  intro: string[];
  teaches?: string;
  quizTopic?: string;
  trains: Stat[];
}

export const LESSONS: Lesson[] = [
  { day: 1, title: 'Matrícula', kind: 'enroll', trains: [], intro: [] },
  { day: 2, title: 'Teoria do chakra', kind: 'chakra', trains: ['Controle de chakra', 'Chakra'], intro: [
    'Bom dia, turma! Hoje vamos falar do que move cada técnica ninja: o chakra.',
    'Ele nasce da mistura da energia física do corpo com a energia espiritual. Quem não controla essa mistura desperdiça tudo.',
    'Sentem-se direito, fechem os olhos e tentem manter o chakra estável. Eu vou observar cada um.',
  ] },
  { day: 3, title: 'Combate corpo a corpo', kind: 'spar', trains: ['Taijutsu', 'Força'], intro: [
    'Hoje vamos para o pátio. Ninguém se forma sem saber se defender sem técnicas.',
    'Duplas de treino. Começa com a saudação, termina com o selo da reconciliação. Entendido?',
  ] },
  { day: 4, title: 'Henge no Jutsu', kind: 'seals', teaches: 'henge', trains: ['Ninjutsu', 'Controle de chakra'], intro: [
    'A Transformação. Vocês vão mudar a própria aparência usando chakra.',
    'Não basta parecer outra pessoa: os selos precisam sair na ordem certa e sem hesitação.',
    'Acompanhem a sequência no quadro e repitam comigo.',
  ] },
  { day: 5, title: 'Armas de arremesso', kind: 'kunai', trains: ['Bukijutsu', 'Percepção'], intro: [
    'Kunai e shuriken. Simples de carregar, difíceis de dominar.',
    'Quem acerta o centro do alvo cinco vezes seguidas pode sair mais cedo. Quem errar, recolhe as armas da turma.',
  ] },
  { day: 6, title: 'Kawarimi no Jutsu', kind: 'seals', teaches: 'kawarimi', trains: ['Ninjutsu', 'Velocidade'], intro: [
    'A Substituição salva vidas. No instante do golpe, vocês trocam de lugar com um objeto próximo.',
    'O segredo é o tempo. Tarde demais, vocês levam o golpe. Cedo demais, o inimigo percebe.',
  ] },
  { day: 7, title: 'Bunshin no Jutsu', kind: 'seals', teaches: 'bunshin', trains: ['Ninjutsu', 'Controle de chakra'], intro: [
    'Prestem atenção: esta é a técnica do exame de graduação.',
    'O Clone é uma ilusão. Não tem corpo, não ataca. Mas um clone bem-feito confunde qualquer adversário.',
    'Chakra demais ou de menos e o clone sai torto. Controle é tudo.',
  ] },
  { day: 8, title: 'História de Konoha', kind: 'quiz', quizTopic: 'historia', trains: ['Inteligência'], intro: [
    'Um shinobi que não conhece a própria vila não sabe pelo que luta.',
    'Prova oral! Respondam com calma.',
  ] },
  { day: 9, title: 'Revisão e treino livre', kind: 'spar', trains: ['Taijutsu', 'Velocidade'], intro: [
    'Amanhã é o exame. Hoje, revisão: duplas de treino de novo.',
    'Descansem à noite. Um shinobi cansado erra os selos mais simples.',
  ] },
];

export interface Question { q: string; options: string[]; answer: number; topic: string }
export const QUESTIONS: Question[] = [
  { topic: 'chakra', q: 'O chakra nasce da mistura de quais energias?', options: ['Física e espiritual', 'Fogo e água', 'Vento e terra', 'Yin e lua'], answer: 0 },
  { topic: 'chakra', q: 'Quantas são as naturezas básicas de chakra?', options: ['Três', 'Quatro', 'Cinco', 'Sete'], answer: 2 },
  { topic: 'chakra', q: 'O que acontece com um Bunshin quando é atingido?', options: ['Revida o golpe', 'Desaparece', 'Vira um tronco', 'Explode'], answer: 1 },
  { topic: 'historia', q: 'Quem é o Hokage atual de Konoha?', options: ['Hashirama Senju', 'Hiruzen Sarutobi', 'Tobirama Senju', 'Minato Namikaze'], answer: 1 },
  { topic: 'historia', q: 'Quem foi o Primeiro Hokage?', options: ['Hiruzen Sarutobi', 'Tobirama Senju', 'Hashirama Senju', 'Danzō Shimura'], answer: 2 },
  { topic: 'historia', q: 'Em qual país fica Konohagakure?', options: ['País do Vento', 'País da Água', 'País do Fogo', 'País da Terra'], answer: 2 },
  { topic: 'historia', q: 'Qual é a ordem das patentes, da menor para a maior?', options: ['Chūnin, Genin, Jōnin', 'Genin, Chūnin, Jōnin', 'Genin, Jōnin, Chūnin', 'Jōnin, Chūnin, Genin'], answer: 1 },
  { topic: 'historia', q: 'Qual símbolo aparece na bandana de Konoha?', options: ['Uma folha', 'Uma ampulheta', 'Uma nuvem', 'Uma nota musical'], answer: 0 },
  { topic: 'tecnica', q: 'Qual técnica troca o ninja de lugar com um objeto?', options: ['Henge', 'Bunshin', 'Kawarimi', 'Kage Bunshin'], answer: 2 },
  { topic: 'tecnica', q: 'Qual técnica muda a aparência do usuário?', options: ['Henge', 'Kawarimi', 'Bunshin', 'Shunshin'], answer: 0 },
  { topic: 'tecnica', q: 'O que torna o Bunshin difícil?', options: ['Precisa de uma arma', 'Exige controle fino de chakra', 'Só funciona à noite', 'Precisa de um clã'], answer: 1 },
  { topic: 'tecnica', q: 'Qual arma é mais precisa a longa distância?', options: ['Kunai', 'Shuriken', 'Punho', 'Selo explosivo'], answer: 1 },
];

/** Os 12 selos de mão. Usados no minijogo de selos (as sequências do minijogo são do jogo, não canônicas). */
export const SEALS = [
  { kanji: '子', name: 'Ne' }, { kanji: '丑', name: 'Ushi' }, { kanji: '寅', name: 'Tora' }, { kanji: '卯', name: 'U' },
  { kanji: '辰', name: 'Tatsu' }, { kanji: '巳', name: 'Mi' }, { kanji: '午', name: 'Uma' }, { kanji: '未', name: 'Hitsuji' },
  { kanji: '申', name: 'Saru' }, { kanji: '酉', name: 'Tori' }, { kanji: '戌', name: 'Inu' }, { kanji: '亥', name: 'I' },
];
