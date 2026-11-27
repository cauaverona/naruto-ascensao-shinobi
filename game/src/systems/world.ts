// Calendário e simulador de acontecimentos mundiais (seção 5).
// A história do anime é a linha de referência, não um roteiro obrigatório: cada acontecimento tem
// janela, pré-requisitos, envolvidos, resultados possíveis e consequências. Quando o contexto deixa
// de existir, o acontecimento não é forçado e uma alternativa coerente assume o lugar dele.
import type { Campaign } from '../state/campaign';
import { addLog } from '../state/campaign';
import { CHARACTERS, CLASSMATES, GUY_TEAM, type Period } from '../data/characters';
import { AFTERNOON_ACTIONS, EXAM_DAY, LESSONS } from '../data/academy';
import { castChance } from '../data/jutsus';
import type { Stat } from '../data/stats';
import { Rng } from '../core/rng';
import { formGuyTeam } from './team-guy';
import { bond } from './relations';
import { restoreAll } from './progression';

export type Phase = 'dawn' | 'night';

export interface Prompt { speaker: string; role?: string; lines: string[]; choices: { id: string; label: string }[] }

export interface WorldEvent {
  id: string;
  title: string;
  phase: Phase;
  window: [number, number];
  involves: string[];
  requires(c: Campaign): boolean;
  /** Cena com escolha do jogador antes da resolução. */
  prompt?(c: Campaign): Prompt | null;
  resolve(c: Campaign, rng: Rng, choice?: string): string;
  outcomes: Record<string, { apply?(c: Campaign): void; news?: (c: Campaign) => string | null }>;
}

const f = (c: Campaign, k: string) => c.flags[k];

// ——— Exame dos colegas ———
/** Resultado do Bunshin de um NPC no exame. Exame exige um clone convincente: é mais rígido que em combate. */
export function npcExamChance(c: Campaign, id: string): number {
  const n = c.npcs[id];
  return Math.max(0.02, castChance(n.jutsus.bunshin ?? 0, n.stats['Controle de chakra']) - 0.22);
}

export const WORLD_EVENTS: WorldEvent[] = [
  {
    id: 'convite-pegadinha', title: 'Um convite à noite', phase: 'night', window: [5, 7], involves: ['naruto'],
    requires: (c) => c.npcs.naruto.bond.amizade >= 15 && !f(c, 'pegadinha'),
    prompt: (c) => ({
      speaker: 'Naruto', role: 'naruto',
      lines: [
        `Psiu! ${c.profile.name}! Sou eu, aqui na janela!`,
        'Amanhã cedo eu vou deixar o monumento dos Hokage com uma cara nova. Tinta, pincel, tudo pronto!',
        'Vem comigo? Vai ser a coisa mais lendária que essa vila já viu!',
      ],
      choices: [
        { id: 'aceitar', label: 'Topar a pegadinha' },
        { id: 'recusar', label: 'Recusar e ir dormir' },
        { id: 'avisar', label: 'Recusar e avisar Iruka de manhã' },
      ],
    }),
    resolve: (_c, _r, choice) => choice ?? 'recusar',
    outcomes: {
      aceitar: { apply: (c) => { c.flags.pegadinha = 'aceitar'; bond(c, 'naruto', { amizade: 10 }, 'Topou a pegadinha do monumento.'); } },
      recusar: { apply: (c) => { c.flags.pegadinha = 'recusar'; bond(c, 'naruto', { amizade: -2 }); } },
      avisar: { apply: (c) => { c.flags.pegadinha = 'avisar'; } },
    },
  },
  {
    id: 'pegadinha-monumento', title: 'O monumento dos Hokage', phase: 'dawn', window: [7, 7], involves: ['naruto', 'iruka'],
    requires: () => true,
    resolve: (c) => (f(c, 'pegadinha') === 'avisar' ? 'evitada' : f(c, 'pegadinha') === 'aceitar' ? 'com-jogador' : 'canon'),
    outcomes: {
      canon: {
        apply: (c) => { bond(c, 'iruka', {}, 'Pegou Naruto pintando o monumento.'); },
        news: () => 'O rosto dos Hokage amanheceu pintado. Iruka arrastou Naruto até a Academia e o colocou para limpar tudo.',
      },
      'com-jogador': {
        apply: (c) => {
          c.reputation -= 5; c.flags.limpeza = c.day;
          bond(c, 'naruto', { amizade: 15, confianca: 10 }, 'Pintamos o monumento juntos.');
          bond(c, 'iruka', { respeito: -8 }, 'Ajudou Naruto a pintar o monumento.');
        },
        news: (c) => `Você e Naruto pintaram o monumento antes do sol nascer. Iruka pegou os dois. Hoje à tarde, ${c.profile.name} limpa pedra em vez de treinar.`,
      },
      evitada: {
        apply: (c) => {
          bond(c, 'iruka', { confianca: 12 }, 'Avisou sobre a pegadinha do monumento.');
          bond(c, 'naruto', { amizade: -12, rivalidade: 6 }, 'Contou a Iruka sobre a pegadinha.');
          c.flags['monumento-limpo'] = true;
        },
        news: () => 'Iruka esperou Naruto ao pé do monumento antes do amanhecer. A tinta voltou para casa sem uso, e Naruto passou o dia emburrado.',
      },
    },
  },
  {
    id: 'exame-colegas', title: 'Exame de graduação da turma', phase: 'dawn', window: [EXAM_DAY, EXAM_DAY], involves: CLASSMATES,
    requires: () => true,
    resolve: (c, rng) => {
      for (const id of CLASSMATES) {
        let pass = rng.chance(npcExamChance(c, id));
        // Na fidelidade máxima, Naruto só passa se o jogador mudou o rumo dele de verdade.
        if (id === 'naruto' && c.settings.fidelity === 'fiel' && !((c.flags['treino-naruto'] as number) >= 3)) pass = false;
        c.flags[`exame:${id}`] = pass ? 'aprovado' : 'reprovado';
        if (pass) c.npcs[id].rank = 'Genin';
      }
      return c.flags['exame:naruto'] === 'aprovado' ? 'naruto-aprovado' : 'canon';
    },
    outcomes: {
      canon: {},
      'naruto-aprovado': { apply: (c) => bond(c, 'naruto', { amizade: 10 }, 'Passou no exame depois de treinar o Bunshin comigo.') },
    },
  },
  {
    id: 'noite-do-pergaminho', title: 'O pergaminho proibido', phase: 'night', window: [EXAM_DAY, EXAM_DAY], involves: ['naruto', 'iruka'],
    requires: (c) => c.flags['exame:naruto'] === 'reprovado',
    prompt: (c) => {
      const choices = [
        { id: 'procurar', label: 'Sair para ajudar nas buscas' },
        { id: 'ficar', label: 'Ficar em casa' },
      ];
      if (f(c, 'naruto-confidencia')) choices.splice(1, 0, { id: 'avisar', label: 'Contar a Iruka sobre o “teste secreto” de Naruto' });
      return {
        speaker: 'Mensageiro', lines: [
          'Batidas fortes na porta. Um chūnin ofegante fala depressa:',
          '“O pergaminho proibido sumiu da torre do Hokage. Todos os ninjas disponíveis estão nas ruas.”',
          f(c, 'naruto-confidencia') ? 'Você se lembra do que Naruto contou à tarde, sobre um teste secreto para reprovados.' : 'Lá fora, lanternas correm em direção à floresta.',
        ], choices,
      };
    },
    resolve: (_c, _r, choice) => choice ?? 'ficar',
    outcomes: {
      ficar: {
        apply: (c) => { c.flags['exame:naruto'] = 'aprovado-iruka'; c.flags['naruto-kage-bunshin'] = true; c.flags['mizuki-preso'] = true; },
        news: () => 'De manhã, a vila só fala disso: Naruto recuperou o pergaminho proibido, derrotou o traidor Mizuki com centenas de clones e recebeu a bandana das mãos de Iruka.',
      },
      procurar: {
        apply: (c) => {
          c.flags['exame:naruto'] = 'aprovado-iruka'; c.flags['naruto-kage-bunshin'] = true; c.flags['mizuki-preso'] = true;
          c.reputation += 5;
          bond(c, 'naruto', { amizade: 12, respeito: 10 }, 'Viu meus clones na floresta naquela noite.');
          bond(c, 'iruka', { confianca: 8 }, 'Ajudou nas buscas pelo pergaminho.');
        },
        news: () => 'Você chegou à clareira a tempo de ver a floresta cheia de Narutos. Mizuki, o instrutor, era o traidor. Iruka, ferido, amarrou a própria bandana na testa de Naruto.',
      },
      avisar: {
        apply: (c) => {
          c.flags['exame:naruto'] = 'reprovado'; c.flags['naruto-kage-bunshin'] = false; c.flags['mizuki-preso'] = true;
          bond(c, 'iruka', { confianca: 20, respeito: 10 }, 'Me avisou do falso teste de Mizuki.');
          bond(c, 'naruto', { confianca: -10 }, 'Contou o segredo do teste para Iruka.');
        },
        news: () => 'Iruka interceptou Naruto antes que ele chegasse ao pergaminho. Mizuki foi preso tentando fugir. Naruto continua sem a bandana.',
      },
    },
  },
  {
    id: 'mizuki-sem-alvo', title: 'Uma noite tranquila', phase: 'night', window: [EXAM_DAY, EXAM_DAY], involves: [],
    // Contexto invalidado: Naruto passou, então o plano de Mizuki não acontece agora. Fica oculto ao jogador.
    requires: (c) => c.flags['exame:naruto'] === 'aprovado',
    resolve: () => 'oculto',
    outcomes: { oculto: { apply: (c) => { c.flags['mizuki-oculto'] = true; c.flags['naruto-kage-bunshin'] = false; } } },
  },
  {
    id: 'formacao-equipes', title: 'Formação das equipes Genin', phase: 'dawn', window: [EXAM_DAY + 1, Infinity], involves: [...CLASSMATES, ...GUY_TEAM, 'guy'],
    requires: (c) => c.rank === 'Genin' && !f(c, 'equipe'),
    resolve: (c, rng) => {
      const passed = (id: string) => String(c.flags[`exame:${id}`] ?? '').startsWith('aprovado');
      const canonical = ['naruto', 'sasuke', 'sakura'];
      const intact = canonical.every(passed);
      const shuffleTeams = c.settings.fidelity === 'alternativo';
      let members: string[];
      let outcome: string;
      const openingInTeam7 = !passed('naruto') && passed('sasuke') && passed('sakura');
      const guyTeam = formGuyTeam(c, rng);
      const fillTeam7 = !guyTeam && openingInTeam7 && !shuffleTeams && (c.settings.fidelity === 'fiel' || rng.chance(0.68));
      if (guyTeam) {
        members = guyTeam;
        outcome = 'time-guy';
      } else if (fillTeam7) {
        members = ['sasuke', 'sakura'];
        c.flags.sensei = 'kakashi';
        outcome = 'jogador-time7';
      } else {
        const eligible = CLASSMATES.filter((id) => !intact || shuffleTeams || !canonical.includes(id));
        const pool = eligible.filter(passed);
        const reserves = eligible.filter((id) => !passed(id));
        members = [];
        while (members.length < 2) {
          const from = pool.length ? pool : reserves;
          const id = from.splice(rng.int(0, from.length - 1), 1)[0];
          members.push(id);
          if (!passed(id)) c.flags[`exame:${id}`] = 'aprovado na repescagem';
        }
        const mentors = intact && !shuffleTeams ? ['asuma', 'kurenai', 'naomi'] : ['kakashi', 'asuma', 'kurenai', 'naomi'];
        c.flags.sensei = rng.pick(mentors);
        outcome = intact && !shuffleTeams ? 'canon' : 'alternativa';
      }
      for (const id of CLASSMATES) if (passed(id)) c.npcs[id].rank = 'Genin';
      c.flags.equipe = ['player', ...members].join(',');
      c.flags['academia-concluida'] = true;
      return outcome;
    },
    outcomes: {
      canon: { news: (c) => `Iruka leu as equipes. Equipe 7: Naruto, Sasuke e Sakura, sob Kakashi Hatake. A sua: ${teamText(c)}. O jōnin responsável será apresentado em breve.` },
      'jogador-time7': {
        apply: (c) => { bond(c, 'sasuke', { respeito: 5 }); bond(c, 'sakura', { amizade: 3 }); },
        news: (c) => `Sem Naruto entre os formados, Iruka refez a lista. Equipe 7: ${c.profile.name}, Sasuke e Sakura, sob Kakashi Hatake.`,
      },
      'time-guy': { news: (c) => {
        const reserve = CHARACTERS[String(c.flags['guy-reserva'])]?.name;
        return `Guy abriu uma vaga no rodízio do Time 3: ${teamText(c)}.${reserve ? ` ${reserve} continua treinando com o Time Guy e fica na reserva da sua equipe.` : ''}`;
      } },
      alternativa: { news: (c) => `As equipes mudaram em relação ao planejado. A sua: ${teamText(c)}.` },
    },
  },
];

function teamText(c: Campaign): string {
  const ids = String(c.flags.equipe ?? '').split(',').filter(Boolean);
  const names = ids.map((id) => (id === 'player' ? c.profile.name : CHARACTERS[id]?.name ?? id));
  return names.length > 1 ? names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1] : names[0] ?? c.profile.name;
}

/** Acontecimentos prontos para a fase atual. */
export function dueEvents(c: Campaign, phase: Phase): WorldEvent[] {
  return WORLD_EVENTS.filter((e) => e.phase === phase && !c.events[e.id] && c.day >= e.window[0] && c.day <= e.window[1] && e.requires(c));
}

/** Resolve um acontecimento e devolve a notícia para o jogador (ou null se for oculto). */
export function resolveEvent(c: Campaign, e: WorldEvent, choice?: string): string | null {
  const rng = new Rng(c.rng);
  const outcome = e.resolve(c, rng, choice);
  c.rng = rng.state;
  c.events[e.id] = outcome;
  const o = e.outcomes[outcome];
  o?.apply?.(c);
  const news = o?.news?.(c) ?? null;
  if (news) addLog(c, news);
  return news;
}

/** Treino independente dos NPCs (seção 6): eles evoluem mesmo sem o jogador. */
export function npcTick(c: Campaign) {
  for (const def of Object.values(CHARACTERS)) {
    const n = c.npcs[def.id];
    if (!n?.alive) continue;
    for (const [stat, v] of Object.entries(def.habits) as [Stat, number][]) n.stats[stat] = Math.round((n.stats[stat] + v) * 100) / 100;
    for (const [j, v] of Object.entries(def.practice ?? {})) n.jutsus[j] = Math.min(100, (n.jutsus[j] ?? 0) + v);
  }
}

export function periodSchedule(id: string, period: Period) {
  return CHARACTERS[id]?.schedule[period];
}

// ——— Calendário ———
export function retakeDay(c: Campaign): number | null {
  if (c.flags['exame:player'] !== 'reprovado') return null;
  const date = Number(c.flags.repescagem);
  return Number.isSafeInteger(date) && date >= EXAM_DAY ? date : c.day;
}

export function academyMorning(c: Campaign): 'enrollment' | 'lesson' | 'exam' | 'free' {
  if (c.quest.startsWith('matricula')) return 'enrollment';
  if (c.rank === 'Genin' || c.lessonsDone.includes(c.day)) return 'free';
  const retake = retakeDay(c);
  if (retake !== null) return c.day >= retake ? 'exam' : 'free';
  if (c.day >= EXAM_DAY) return 'exam';
  return LESSONS.some((lesson) => lesson.day === c.day) ? 'lesson' : 'free';
}

const EXTRA_TRAINING = 2;

export function extraTrainingLeft(c: Campaign): number {
  if (c.period !== 2) return 0;
  const remaining = c.flags['treinos-extras'];
  return typeof remaining === 'number' && Number.isInteger(remaining) ? Math.max(0, Math.min(EXTRA_TRAINING, remaining)) : 0;
}

export function spendExtraTraining(c: Campaign) {
  const remaining = extraTrainingLeft(c);
  if (remaining > 0) c.flags['treinos-extras'] = remaining - 1;
}

export function startAfternoon(c: Campaign) {
  c.period = 1;
  c.actions = AFTERNOON_ACTIONS - (c.flags.limpeza === c.day ? 2 : 0);
}

/** Gasta uma ação da tarde. Retorna true quando a tarde acabou. */
export function spendAction(c: Campaign): boolean {
  if (c.period !== 1) return false;
  c.actions -= 1;
  if (c.actions <= 0) {
    c.period = 2;
    c.actions = 0;
    c.flags['treinos-extras'] = EXTRA_TRAINING;
    return true;
  }
  return false;
}

export function sleep(c: Campaign) {
  c.day += 1;
  c.period = 0;
  c.actions = AFTERNOON_ACTIONS;
  delete c.flags['treinos-extras'];
  restoreAll(c);
  npcTick(c);
}
