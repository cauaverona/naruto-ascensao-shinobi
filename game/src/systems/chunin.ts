import { Rng } from '../core/rng';
import { FOREST_ROUTES, TACTICAL_QUESTIONS, WRITTEN_PASS, WRITTEN_QUESTIONS, type ForestRoute } from '../data/chunin';
import { CHAPTERS } from '../data/classic';
import { addLog, type Campaign } from '../state/campaign';
import type { Spot } from '../render/maps/types';

export function writtenExam(c: Campaign) {
  const attempt = Number(c.flags['chunin-escrita-tentativas'] ?? 0);
  const rng = new Rng(c.seed ^ Math.imul(attempt + 1, 0x9e3779b1));
  return rng.shuffle([...TACTICAL_QUESTIONS]).slice(0, WRITTEN_QUESTIONS).map(question => ({
    ...question, options: rng.shuffle(question.answers.map(([label, correct], index) => ({
      id: `${question.id}-${index}`, label, correct: correct === true,
    }))),
  }));
}

export function writtenPassed(c: Campaign) {
  return Number(c.flags['chunin-escrita-melhor'] ?? 0) >= WRITTEN_PASS;
}

export function gradeWrittenExam(c: Campaign, answers: readonly string[]) {
  const questions = writtenExam(c);
  if (c.map !== 'sala' || answers.length !== questions.length || writtenPassed(c)) return;
  const marked = questions.map((question, index) => question.options.find(option => option.id === answers[index]));
  if (marked.some(answer => !answer)) return;
  const score = marked.filter(answer => answer?.correct).length;
  const review = questions.filter((_, index) => !marked[index]?.correct).map(question => question.explanation);
  c.flags['chunin-escrita-tentativas'] = Number(c.flags['chunin-escrita-tentativas'] ?? 0) + 1;
  c.flags['chunin-escrita-melhor'] = Math.max(Number(c.flags['chunin-escrita-melhor'] ?? 0), score);
  addLog(c, `Exame Chūnin · Prova escrita: ${score}/${questions.length} acertos.`);
  return { score, review };
}

export function forestRoute(c: Campaign): ForestRoute | undefined {
  const route = c.flags['chunin-floresta-rota'];
  return route === 'norte' || route === 'sul' ? route : undefined;
}

const HEAVEN_CHAPTER = CHAPTERS.findIndex(({ id }) => id === 'ceu');
const EARTH_CHAPTER = CHAPTERS.findIndex(({ id }) => id === 'terra');
const TOWER_CHAPTER = CHAPTERS.findIndex(({ id }) => id === 'torre');

export function forestScrollStatus(c: Campaign) {
  // O capítulo também registra os pergaminhos de saves anteriores ao sistema de troca.
  const chapter = Number(c.flags['classico-capitulo'] ?? 0);
  if (chapter < HEAVEN_CHAPTER) return;
  const delivered = chapter > TOWER_CHAPTER;
  return {
    heaven: delivered ? 'entregue' : chapter > HEAVEN_CHAPTER ? 'em-posse' : 'pendente',
    earth: delivered ? 'entregue' : chapter > EARTH_CHAPTER ? 'em-posse' : 'pendente',
    spare: c.flags['chunin-floresta-reserva']
      ? c.flags['chunin-floresta-terra'] === 'troca' ? 'trocado' : 'em-posse'
      : undefined,
  } as const;
}

export function completeForestRoute(c: Campaign, route: ForestRoute, score: number) {
  if (c.map !== 'floresta' || forestRoute(c) || !Number.isFinite(score) || score < FOREST_ROUTE_PASS || score > 1) return false;
  c.flags['chunin-floresta-rota'] = route;
  addLog(c, `Floresta da Morte · Sua equipe preparou a passagem pelas ${FOREST_ROUTES[route].label.toLocaleLowerCase('pt-BR')}.`);
  return true;
}

export const FOREST_ROUTE_PASS = 0.5;

export function findSpareScroll(c: Campaign, route: ForestRoute) {
  if (c.map !== 'floresta' || (forestRoute(c) ?? 'norte') !== route || c.flags['chunin-floresta-reserva']) return false;
  c.flags['chunin-floresta-reserva'] = true;
  addLog(c, 'Floresta da Morte · A equipe encontrou um pergaminho do Céu avulso, que pode trocar com outra equipe.');
  return true;
}

export function forestExamSpots(c: Campaign, chapter: string): Spot[] | undefined {
  const route = forestRoute(c);
  if (chapter === 'ceu') {
    return route ? [FOREST_ROUTES[route].scroll] : Object.values(FOREST_ROUTES).map(path => path.scout);
  }
  if (chapter === 'terra') {
    return c.flags['chunin-floresta-reserva'] ? [] : [FOREST_ROUTES[route ?? 'norte'].cache];
  }
}
