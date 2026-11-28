import { CHAPTERS, type Chapter } from '../data/classic';
import { addLog, type Campaign } from '../state/campaign';
import { geninStage, teamMembers } from './genin';
import { bond } from './relations';
import { pendingWaveStops } from './waves';
import { forestRoute, writtenPassed } from './chunin';
import { invasionReady } from './invasion';
import { pendingSunaGuards, sunaLeadReady } from './suna';
import { akatsukiReportReady } from './akatsuki';
import { rescueGuide, rescueRoute } from './rescue';

export function classicChapter(c: Campaign): Chapter | undefined {
  if (geninStage(c) !== 'concluida' || !c.flags['ondas-acampamento'] || c.flags['classico-final']) return;
  const index = Number(c.flags['classico-capitulo'] ?? 0);
  return CHAPTERS[index];
}

export function canReconcile(c: Campaign) {
  return c.settings.fidelity !== 'fiel' && (c.npcs.sasuke.bond.confianca >= 25 || c.flags['classico-marca'] === 'ajudar');
}

export const chapterChoices: Record<string, readonly string[]> = {
  haku: ['poupado', 'combate'],
  terra: ['feito', 'troca'],
  torre: ['ajudar', 'perseguir'],
  final: ['lideranca', 'genin'],
  invasao: ['evacuar', 'defender'],
  gaara: ['acordo', 'feito'],
  tsunade: ['aliados', 'relatorio'],
  akatsuki: ['becos', 'cobertura'],
  som: ['norte', 'sul'],
  vale: ['conversou', 'resgate', 'partiu'],
};

export function resolveChapter(c: Campaign, id: string, result = 'feito'): boolean {
  const chapter = classicChapter(c);
  if (!chapter || chapter.id !== id || c.map !== chapter.area) return false;
  if (pendingWaveStops(c, id).length) return false;
  if (id === 'escrita' && !writtenPassed(c)) return false;
  if (id === 'ceu' && !forestRoute(c)) return false;
  if (id === 'terra' && result === 'troca' && !c.flags['chunin-floresta-reserva']) return false;
  if (id === 'invasao' && !invasionReady(c, result)) return false;
  if (id === 'gaara' && (pendingSunaGuards(c).length > 0 || (result === 'acordo' && c.settings.fidelity === 'fiel'))) return false;
  if (id === 'tsunade' && !sunaLeadReady(c)) return false;
  if (id === 'akatsuki' && !akatsukiReportReady(c, result)) return false;
  if (id === 'som' && (result !== rescueRoute(c) || !c.flags['resgate-sentinela'])) return false;
  if (!(chapterChoices[id] ?? ['feito']).includes(result)) return false;
  if (id === 'vale') {
    if (!c.flags['vale-chegada']) return false;
    if (result === 'conversou' && (!canReconcile(c) || c.flags['vale-duelo'])) return false;
    if (result === 'resgate' && (!c.flags['vale-duelo'] || c.settings.fidelity === 'fiel')) return false;
    if (result === 'partiu' && c.flags['vale-duelo'] && c.settings.fidelity !== 'fiel') return false;
  }
  c.flags['classico-capitulo'] = CHAPTERS.indexOf(chapter) + 1;
  if (id === 'haku') c.flags['classico-haku'] = result;
  if (id === 'terra') c.flags['chunin-floresta-terra'] = result === 'troca' ? 'troca' : 'duelo';
  if (id === 'torre') c.flags['classico-marca'] = result;
  if (id === 'final' && result === 'lideranca') {
    c.flags['classico-promocao'] = true;
    if (c.rank === 'Genin') c.rank = 'Chūnin';
  }
  if (id === 'tsunade') c.flags['classico-tsunade'] = result;
  if (id === 'gaara') c.flags['classico-gaara'] = result;
  if (id === 'invasao') c.flags['classico-invasao'] = result;
  if (id === 'akatsuki') {
    c.flags['classico-akatsuki'] = result;
    bond(c, 'naruto', result === 'becos' ? { confianca: 4, amizade: 2 } : { confianca: 4, respeito: 2 },
      'Me levou até a guarda quando os viajantes apareceram.');
  }
  if (id === 'vale') {
    c.flags['classico-final'] = result;
    c.flags['vale-relato-pendente'] = true;
    if (result === 'conversou') bond(c, 'sasuke', { confianca: 6 }, 'Me ouviu no Vale e voltou comigo até a Academia.');
    if (result === 'resgate') bond(c, 'sasuke', { respeito: 5 }, 'Ficou comigo no Vale depois do duelo.');
  }
  if (id === 'som') {
    c.flags['classico-som'] = result;
    const guide = rescueGuide(c);
    if (guide) bond(c, guide, { confianca: 4, respeito: 2 }, 'Cruzou a floresta comigo na missão de resgate.');
  }
  if (['zabuza', 'final', 'gaara', 'vale'].includes(id)) {
    c.ryo += 90;
    c.xp += 100;
    c.reputation += 3;
    for (const member of teamMembers(c)) bond(c, member, { respeito: 3, confianca: 4 }, `Concluiu comigo: ${chapter.title}.`);
  }
  if (id === 'invasao') {
    c.xp += 70;
    c.reputation += 2;
    for (const member of teamMembers(c)) bond(c, member, { confianca: 3 }, 'Ajudou a evacuar os moradores na invasão de Konoha.');
  }
  addLog(c, `Clássico · ${chapter.title}. ${OUTCOMES[result] ?? 'Objetivo concluído.'}`);
  return true;
}

const OUTCOMES: Record<string, string> = {
  poupado: 'Haku baixou a guarda e revelou quem financiava o bloqueio.',
  combate: 'A equipe abriu caminho com um duelo.',
  troca: 'A troca garantiu o pergaminho da Terra. As duas equipes seguiram para a torre.',
  ajudar: 'A equipe ficou junta quando a marca apareceu e levou Sasuke à torre.',
  perseguir: 'A equipe seguiu a pista do agressor e notificou a banca.',
  lideranca: 'A banca reconheceu sua liderança e registrou a promoção a Chūnin.',
  genin: 'A banca manteve sua patente e registrou seu desempenho no duelo.',
  evacuar: 'Os dois grupos chegaram ao abrigo pelos becos laterais.',
  defender: 'Sua equipe liberou o corredor central e levou os dois grupos ao abrigo.',
  acordo: 'Gaara aceitou recuar e enviou uma mensageira da Areia ao encontro da equipe da Folha.',
  aliados: 'Tsunade concordou em voltar depois de ouvir o relato da equipe.',
  relatorio: 'Tsunade recebeu o relatório da invasão e aceitou voltar a Konoha.',
  becos: 'Naruto chegou pelos becos. A guarda reforçou a ronda junto ao Ichiraku.',
  cobertura: 'A equipe conteve Kisame e retirou Naruto pela praça. A guarda registrou o confronto.',
  norte: 'A equipe atravessou a passarela e abriu a trilha para o Vale do Fim.',
  sul: 'A equipe cruzou pelas pedras do vau e abriu a trilha para o Vale do Fim.',
  conversou: 'Sasuke aceitou voltar com a equipe para discutir o que aconteceu.',
  resgate: 'Sasuke voltou com a equipe depois do duelo.',
  partiu: 'Sasuke seguiu seu caminho. A equipe regressou com a missão registrada.',
};
