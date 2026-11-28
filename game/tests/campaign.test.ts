import { describe, it, expect } from 'vitest';
import { newCampaign, type Campaign, type Profile } from '../src/state/campaign';
import { deleteSlot, decode, importSlot, readSlot, writeSlot, memoryStore, slotKey, LAST_SLOT_KEY } from '../src/state/save';
import { academyMorning, dueEvents, extraTrainingLeft, resolveEvent, retakeDay, sleep, startAfternoon, spendAction, spendExtraTraining, WORLD_EVENTS } from '../src/systems/world';
import { train, statCost, applyTraining, learn } from '../src/systems/progression';
import { PATROL_POSTS, SEAL_CLUES } from '../src/data/genin-assignments';
import { EXAM_DAY, graduationGrade } from '../src/data/academy';
import { ACADEMY_STATS, combatPower, maxVitals } from '../src/data/stats';
import { HYOTON } from '../src/data/jutsus';
import { trainingFor } from '../src/data/training';
import { awakenHyoton, awakenOcular, ocularTrial, yukiTrial } from '../src/systems/heritage';
import { CHAPTERS } from '../src/data/classic';
import { onValleyFloor, VALLEY_ENTRY, VALLEY_MAP_FLAG, VALLEY_SASUKE } from '../src/data/valley-map';
import { canReconcile, classicChapter, resolveChapter } from '../src/systems/classic';
import { completeForestRoute, findSpareScroll, forestExamSpots, forestRoute, forestScrollStatus, gradeWrittenExam, writtenExam, writtenPassed } from '../src/systems/chunin';
import { guyPreference, requestGuyTeam } from '../src/systems/team-guy';
import { ToraGame } from '../src/scenes/tora';
import { GUY_TEAM, CLASSMATES } from '../src/data/characters';
import { answerConversation, conversation } from '../src/content/conversations';
import { supportAffinity } from '../src/systems/genin';
import { departForWaves, followRoadTracks, pendingWaveStops, reachRoadCamp, recordWaveStop, wavesStage } from '../src/systems/waves';
import { atEvacuationCheckpoint, chooseInvasionRoute, escortGroup, evacuationCount, groupSafe, invasionRoute, invasionSpots,
  reachEvacuationCheckpoint, rescueEvacuationGroup, secureInvasionRoute, startEvacuation } from '../src/systems/invasion';
import { pendingSunaGuards, recordSunaGuard, recordSunaLead, SUNA_GUARDS, SUNA_LEADS, sunaLead, sunaLeadReady } from '../src/systems/suna';
import { AKATSUKI_CLUES, AKATSUKI_ROUTES, akatsukiSpots, chooseAkatsukiRoute, finishNarutoEscort,
  narutoSafety, openAkatsukiPassage, recordAkatsukiClue, startNarutoEscort } from '../src/systems/akatsuki';
import { RESCUE_BRIEFING, RESCUE_EXIT, RESCUE_PATHS, chooseRescueRoute, clearRescueSentinel, confirmRescueTrail, formRescueTeam,
  prepareRescueApproach, rescueGuide, rescueRoute, rescueSpots } from '../src/systems/rescue';
import { VALE_LOOKOUT, VALE_REST, recordValleyDuel, restAtValley, turnInValleyReport,
  valleyEnding, valleyReportPending, valleySpots, visitValleyLookout } from '../src/systems/valley';
import {
  acceptMission, beginGenin, checkPatrolPost, collectSupply, combatStats, deferMission, finishGenin, geninStage,
  missionDeferred, MISSION_OFFERS, pendingMission, type MissionOffer,
  recordSealClue, reportPatrol, rescueTora, resolveBells, sealCase, senseiId, setToraPlan, settlePatrolDuel,
  solveSealCase, SUPPLIES, teamMembers, toraRoute, toraTactic, turnInSupplies, turnInTora,
} from '../src/systems/genin';

const profile: Profile = {
  name: 'Kenji', sex: 'Masculino', village: 'Konoha', clan: 'Sem clã', element: 'Fogo', talent: 'Taijutsu',
  attribute: 'Velocidade', past: 'Família de artesãos', skin: 'Clara', hair: 'Preto', cut: 'Curto', coat: 'Índigo',
  trim: 'Laranja', accessory: 'Nenhum', mark: 'Nenhuma', band: 'Azul',
};
const fresh = (fidelity: Campaign['settings']['fidelity'] = 'equilibrado', seed = 42) =>
  newCampaign(profile, { difficulty: 'normal', fidelity }, seed);

describe('Terreno do Vale do Fim', () => {
  it('liga a saída da Academia ao confronto pela travessia de pedra', () => {
    for (let x = 18; x <= VALLEY_SASUKE.x; x++) expect(onValleyFloor(x, VALLEY_ENTRY.y)).toBe(true);
    expect(onValleyFloor(VALE_LOOKOUT.x, VALE_LOOKOUT.y)).toBe(true);
    expect(onValleyFloor(VALE_REST.x, VALE_REST.y)).toBe(true);
    expect(onValleyFloor(325, 238)).toBe(false);
    expect(onValleyFloor(325, 278)).toBe(false);
    expect(onValleyFloor(450, 120)).toBe(false);
  });

  it('realinha uma campanha antiga uma vez, conservando margem e progresso', () => {
    const legacy = fresh();
    legacy.map = 'vale';
    legacy.x = 512;
    legacy.y = 160;
    legacy.flags['vale-chegada'] = true;
    const updated = decode(JSON.stringify(legacy));
    expect(updated).toMatchObject({
      map: 'vale', x: 512, y: VALLEY_ENTRY.y,
      flags: { 'vale-chegada': true, [VALLEY_MAP_FLAG]: true },
    });
    expect(onValleyFloor(updated.x, updated.y)).toBe(true);
    updated.y += 4;
    expect(decode(JSON.stringify(updated)).y).toBe(updated.y);
  });
});

function runDawn(c: Campaign) {
  for (const e of dueEvents(c, 'dawn')) resolveEvent(c, e);
}

describe('Arcos do Clássico', () => {
  const afterCamp = (fidelity: Campaign['settings']['fidelity'] = 'equilibrado') => {
    const c = fresh(fidelity);
    c.rank = 'Genin'; c.era = 'classico';
    Object.assign(c.flags, { 'academia-concluida': true, 'patrulha-concluida': true, 'genin-etapa': 'concluida', 'ondas-acampamento': true });
    return c;
  };
  it('percorre os 16 capítulos com saves entre objetivos, promoção e recompensa única', () => {
    let c = afterCamp();
    expect(resolveChapter(c, 'haku', 'combate')).toBe(false);
    const outcomes: Record<string, string> = { haku: 'poupado', torre: 'ajudar', final: 'lideranca', invasao: 'evacuar',
      gaara: 'acordo', tsunade: 'aliados', akatsuki: 'becos', som: 'norte', vale: 'conversou' };
    for (const chapter of CHAPTERS) {
      expect(classicChapter(c)?.id).toBe(chapter.id);
      c.map = chapter.area;
      if (chapter.id === 'escrita') {
        expect(resolveChapter(c, chapter.id)).toBe(false);
        gradeWrittenExam(c, writtenExam(c).map(question => question.options.find(option => option.correct)!.id));
      }
      if (chapter.id === 'ceu') {
        expect(resolveChapter(c, chapter.id)).toBe(false);
        expect(completeForestRoute(c, 'norte', 0.75)).toBe(true);
      }
      if (chapter.id === 'invasao') {
        expect(resolveChapter(c, chapter.id, 'evacuar')).toBe(false);
        expect(chooseInvasionRoute(c, 'evacuar')).toBe(true);
        expect(secureInvasionRoute(c, 'evacuar')).toBe(true);
        for (const group of ['mercado', 'academia'] as const) {
          expect(startEvacuation(c, group)).toBe(true);
          expect(reachEvacuationCheckpoint(c, group)).toBe(true);
          expect(rescueEvacuationGroup(c, group)).toBe(true);
        }
      }
      if (chapter.id === 'gaara') {
        expect(resolveChapter(c, 'gaara', 'acordo')).toBe(false);
        for (const guard of SUNA_GUARDS) expect(recordSunaGuard(c, guard.id)).toBe(true);
      }
      if (chapter.id === 'tsunade') {
        expect(resolveChapter(c, 'tsunade', 'aliados')).toBe(false);
        expect(recordSunaLead(c, SUNA_LEADS.carta.id)).toBe(true);
      }
      if (chapter.id === 'akatsuki') {
        for (const clue of AKATSUKI_CLUES) expect(recordAkatsukiClue(c, clue.id)).toBe(true);
        expect(chooseAkatsukiRoute(c, 'becos')).toBe(true);
        expect(startNarutoEscort(c)).toBe(true);
        expect(openAkatsukiPassage(c, 'becos')).toBe(true);
        expect(finishNarutoEscort(c, AKATSUKI_ROUTES.becos.shelter.id)).toBe(true);
      }
      if (chapter.id === 'som') {
        expect(formRescueTeam(c, '')).toBe(true);
        expect(chooseRescueRoute(c, 'norte')).toBe(true);
        expect(confirmRescueTrail(c, 'norte')).toBe(true);
        expect(clearRescueSentinel(c)).toBe(true);
      }
      if (chapter.id === 'vale') expect(visitValleyLookout(c)).toBe(true);
      const stops = pendingWaveStops(c, chapter.id);
      if (stops.length) expect(resolveChapter(c, chapter.id, outcomes[chapter.id])).toBe(false);
      for (const stop of stops) {
        expect(recordWaveStop(c, chapter.id, stop.id, stop.label)).toBe(true);
        expect(recordWaveStop(c, chapter.id, stop.id, stop.label)).toBe(false);
        c = decode(JSON.stringify(c));
      }
      expect(resolveChapter(c, chapter.id, outcomes[chapter.id])).toBe(true);
      expect(resolveChapter(c, chapter.id, outcomes[chapter.id])).toBe(false);
      c = decode(JSON.stringify(c));
    }
    expect(c.rank).toBe('Chūnin');
    expect(c.flags['classico-final']).toBe('conversou');
    expect(c.flags['classico-gaara']).toBe('acordo');
    expect(classicChapter(c)).toBeUndefined();
  });
  it.each([
    ['equilibrado', 'acordo', SUNA_LEADS.carta.id, SUNA_LEADS.enfermaria.id],
    ['fiel', 'feito', SUNA_LEADS.enfermaria.id, SUNA_LEADS.carta.id],
  ] as const)('permite a rota %s da Fronteira e mantém a pista %s após recarregar', (fidelity, outcome, lead, otherLead) => {
    let c = afterCamp(fidelity);
    c.map = 'suna';
    c.flags['classico-capitulo'] = CHAPTERS.findIndex(chapter => chapter.id === 'gaara');
    expect(recordSunaGuard(c, 'suna-vigia')).toBe(true);
    expect(recordSunaGuard(c, 'suna-vigia')).toBe(false);
    expect(resolveChapter(c, 'gaara', outcome)).toBe(false);
    c = decode(JSON.stringify(c));
    expect(pendingSunaGuards(c).map(({ id }) => id)).toEqual(['suna-guarda']);
    c.map = 'rua';
    expect(recordSunaGuard(c, 'suna-guarda')).toBe(false);
    c.map = 'suna';
    expect(recordSunaGuard(c, 'suna-guarda')).toBe(true);
    if (fidelity === 'fiel') expect(resolveChapter(c, 'gaara', 'acordo')).toBe(false);
    expect(resolveChapter(c, 'gaara', outcome)).toBe(true);
    expect(sunaLead(c).id).toBe(lead);
    c.hp = 1;
    expect(recordSunaLead(c, otherLead)).toBe(false);
    expect(recordSunaLead(c, lead)).toBe(true);
    expect(c.hp).toBe(outcome === 'acordo' ? 1 : maxVitals(c.stats).hp);
    c.hp = 2;
    expect(recordSunaLead(c, lead)).toBe(false);
    expect(c.hp).toBe(2);
    c = decode(JSON.stringify(c));
    expect(sunaLeadReady(c)).toBe(true);
    expect(resolveChapter(c, 'tsunade', 'relatorio')).toBe(true);
    expect(classicChapter(c)?.id).toBe('akatsuki');
  });
  it.each(['acordo', 'feito', undefined] as const)('continua um save 0.5.5 da busca por Tsunade com registro anterior %s', outcome => {
    const old = afterCamp();
    old.version = '0.5.5';
    old.map = 'suna';
    old.flags['classico-capitulo'] = CHAPTERS.findIndex(chapter => chapter.id === 'tsunade');
    if (outcome) old.flags['classico-gaara'] = outcome;
    const c = decode(JSON.stringify(old));
    expect(pendingSunaGuards(c)).toHaveLength(2);
    expect(recordSunaLead(c, sunaLead(c).id)).toBe(true);
    expect(resolveChapter(c, 'tsunade', 'aliados')).toBe(true);
  });
  it.each(['becos', 'cobertura'] as const)('preserva investigação, escolta e relatório dos visitantes pela rota %s', route => {
    let c = afterCamp();
    c.version = '0.5.6';
    c.flags['classico-capitulo'] = CHAPTERS.findIndex(chapter => chapter.id === 'akatsuki');
    const opponent = { id: 'akatsuki-kisame', label: 'Kisame', x: 574, y: 226, r: 24 };
    const other = route === 'becos' ? 'cobertura' : 'becos';
    expect(akatsukiSpots(c, opponent)).toHaveLength(2);
    expect(chooseAkatsukiRoute(c, route)).toBe(false);
    expect(recordAkatsukiClue(c, AKATSUKI_CLUES[1].id)).toBe(true);
    expect(recordAkatsukiClue(c, AKATSUKI_CLUES[1].id)).toBe(false);
    c = decode(JSON.stringify(c));
    expect(akatsukiSpots(c, opponent).map(({ id }) => id)).toEqual([AKATSUKI_CLUES[0].id]);
    expect(recordAkatsukiClue(c, AKATSUKI_CLUES[0].id)).toBe(true);
    expect(chooseAkatsukiRoute(c, other)).toBe(true);
    expect(chooseAkatsukiRoute(c, route)).toBe(true);
    expect(openAkatsukiPassage(c, other)).toBe(false);
    expect(resolveChapter(c, 'akatsuki', route)).toBe(false);
    if (route === 'cobertura') {
      expect(startNarutoEscort(c)).toBe(false);
      expect(akatsukiSpots(c, opponent)[0]).toEqual(opponent);
      expect(openAkatsukiPassage(c, route)).toBe(true);
    } else {
      expect(openAkatsukiPassage(c, route)).toBe(false);
    }
    expect(startNarutoEscort(c)).toBe(true);
    expect(chooseAkatsukiRoute(c, other)).toBe(false);
    c = decode(JSON.stringify(c));
    expect(narutoSafety(c)).toBe('escolta');
    if (route === 'becos') {
      expect(finishNarutoEscort(c, AKATSUKI_ROUTES.becos.shelter.id)).toBe(false);
      expect(openAkatsukiPassage(c, route)).toBe(true);
    }
    expect(finishNarutoEscort(c, AKATSUKI_ROUTES[other].shelter.id)).toBe(false);
    expect(finishNarutoEscort(c, AKATSUKI_ROUTES[route].shelter.id)).toBe(true);
    expect(akatsukiSpots(c, opponent)[0]?.id).toBe('classico-akatsuki');
    const trust = c.npcs.naruto.bond.confianca;
    expect(resolveChapter(c, 'akatsuki', other)).toBe(false);
    c = decode(JSON.stringify(c));
    expect(resolveChapter(c, 'akatsuki', route)).toBe(true);
    expect(resolveChapter(c, 'akatsuki', route)).toBe(false);
    expect(c.npcs.naruto.bond.confianca - trust).toBe(4);
    expect(c.flags['classico-akatsuki']).toBe(route);
    expect(classicChapter(c)?.id).toBe('som');
  });
  it('mantém a equipe de resgate como próximo objetivo em saves que já passaram pelos visitantes', () => {
    const old = afterCamp();
    old.version = '0.5.6';
    old.flags['classico-capitulo'] = CHAPTERS.findIndex(chapter => chapter.id === 'som');
    const c = decode(JSON.stringify(old));
    expect(classicChapter(c)?.id).toBe('som');
    expect(recordAkatsukiClue(c, AKATSUKI_CLUES[0].id)).toBe(false);
  });
  it.each(['norte', 'sul'] as const)('preserva formação, travessia %s e caminho ao Vale depois de recarregar', route => {
    let c = afterCamp();
    c.version = '0.5.7';
    c.map = 'rua';
    c.flags.equipe = 'sasuke,neji';
    c.flags['classico-capitulo'] = CHAPTERS.findIndex(ch => ch.id === 'som');
    const other = route === 'norte' ? 'sul' : 'norte';
    const sentinel = { id: 'resgate-sentinela', label: 'Sentinela', x: 542, y: 170, r: 24 };
    const points = () => rescueSpots(c, sentinel).map(({ id }) => id);
    expect(formRescueTeam(c, 'neji')).toBe(false);
    c.map = 'floresta';
    expect(points()).toEqual([RESCUE_BRIEFING.id]);
    expect(chooseRescueRoute(c, route)).toBe(false);
    expect(formRescueTeam(c, 'sasuke')).toBe(false);
    expect(formRescueTeam(c, 'tenten')).toBe(false);
    expect(formRescueTeam(c, 'neji')).toBe(true);
    expect(formRescueTeam(c, '')).toBe(false);
    expect(points()).toEqual([RESCUE_PATHS.norte.fork.id, RESCUE_PATHS.sul.fork.id]);
    expect(chooseRescueRoute(c, other)).toBe(true);
    expect(chooseRescueRoute(c, route)).toBe(true);
    c = decode(JSON.stringify(c));
    expect(rescueGuide(c)).toBe('neji');
    expect(rescueRoute(c)).toBe(route);
    expect(points()).toEqual([RESCUE_PATHS[route].trail.id, RESCUE_PATHS[other].fork.id]);
    expect(confirmRescueTrail(c, other)).toBe(false);
    expect(confirmRescueTrail(c, route)).toBe(true);
    expect(chooseRescueRoute(c, other)).toBe(false);
    expect(points()).toEqual([sentinel.id, RESCUE_PATHS[route].aid.id]);
    expect(prepareRescueApproach(c, RESCUE_PATHS[other].aid.id)).toBe(false);
    if (route === 'norte') {
      expect(prepareRescueApproach(c, RESCUE_PATHS[route].aid.id)).toBe(true);
      expect(prepareRescueApproach(c, RESCUE_PATHS[route].aid.id)).toBe(false);
      expect(points()).toEqual([sentinel.id]);
    }
    expect(resolveChapter(c, 'som', route)).toBe(false);
    expect(clearRescueSentinel(c)).toBe(true);
    expect(clearRescueSentinel(c)).toBe(false);
    expect(points()).toEqual([RESCUE_EXIT.id]);
    const trust = c.npcs.neji.bond.confianca;
    c = decode(JSON.stringify(c));
    expect(resolveChapter(c, 'som', other)).toBe(false);
    expect(resolveChapter(c, 'som', route)).toBe(true);
    expect(resolveChapter(c, 'som', route)).toBe(false);
    expect(c.npcs.neji.bond.confianca - trust).toBe(4);
    expect(c.flags['classico-som']).toBe(route);
    expect(classicChapter(c)?.id).toBe('vale');
  });
  it('continua um save antigo que já chegou ao Vale sem exigir a nova busca na floresta', () => {
    const old = afterCamp();
    old.version = '0.5.7';
    old.map = 'vale'; old.flags['classico-capitulo'] = CHAPTERS.findIndex(ch => ch.id === 'vale');
    const c = decode(JSON.stringify(old));
    expect(classicChapter(c)?.id).toBe('vale');
    expect(visitValleyLookout(c)).toBe(true);
    expect(resolveChapter(c, 'vale', 'partiu')).toBe(true);
  });
  it.each(['evacuar', 'defender'] as const)('retoma a evacuação %s após recarregar e entrega a missão apenas uma vez', route => {
    let c = afterCamp();
    c.rank = 'Chūnin'; c.map = 'rua'; c.flags['classico-capitulo'] = CHAPTERS.findIndex(ch => ch.id === 'invasao');
    const guard = { id: 'classico-invasao', label: 'Guarda', x: 608, y: 264, r: 24 };
    const other = route === 'evacuar' ? 'defender' : 'evacuar';
    expect(chooseInvasionRoute(c, other)).toBe(true);
    expect(chooseInvasionRoute(c, route)).toBe(true);
    expect(secureInvasionRoute(c, other)).toBe(false);
    expect(startEvacuation(c, 'academia')).toBe(false);
    expect(secureInvasionRoute(c, route)).toBe(true);
    expect(chooseInvasionRoute(c, other)).toBe(false);
    expect(invasionSpots(c, guard)).toHaveLength(2);
    expect(startEvacuation(c, 'academia')).toBe(true);
    expect(startEvacuation(c, 'mercado')).toBe(false);
    expect(rescueEvacuationGroup(c, 'academia')).toBe(false);
    expect(invasionSpots(c, guard)[0]?.id).toBe('invasao-baliza');
    expect(reachEvacuationCheckpoint(c, 'academia')).toBe(true);
    c = decode(JSON.stringify(c));
    expect([invasionRoute(c), escortGroup(c), atEvacuationCheckpoint(c, 'academia')]).toEqual([route, 'academia', true]);
    expect(invasionSpots(c, guard)[0]?.id).toBe('invasao-abrigo');
    expect(rescueEvacuationGroup(c, 'academia')).toBe(true);
    expect(groupSafe(c, 'academia')).toBe(true);
    expect(rescueEvacuationGroup(c, 'academia')).toBe(false);
    expect(resolveChapter(c, 'invasao', route)).toBe(false);
    expect(startEvacuation(c, 'mercado')).toBe(true);
    expect(reachEvacuationCheckpoint(c, 'mercado')).toBe(true);
    expect(rescueEvacuationGroup(c, 'mercado')).toBe(true);
    expect(evacuationCount(c)).toBe(2);
    expect(invasionSpots(c, guard)[0]?.id).toBe(guard.id);
    const xp = c.xp;
    expect(resolveChapter(c, 'invasao', other)).toBe(false);
    expect(resolveChapter(c, 'invasao', route)).toBe(true);
    expect(resolveChapter(c, 'invasao', route)).toBe(false);
    expect(c.xp - xp).toBe(70);
    expect(classicChapter(c)?.id).toBe('gaara');
  });
  it('corrige o simulado só ao entregar, preserva a nota e oferece uma nova prova após reprovar', () => {
    let c = afterCamp();
    c.map = 'sala';
    const original = writtenExam(c);
    expect(gradeWrittenExam(c, ['sair'])).toBeUndefined();
    expect(writtenExam(c)).toEqual(original);
    const wrong = original.map(question => question.options.find(option => !option.correct)!.id);
    expect(gradeWrittenExam(c, wrong)).toMatchObject({ score: 0, review: expect.arrayContaining([original[0].explanation]) });
    expect(writtenPassed(c)).toBe(false);
    c = decode(JSON.stringify(c));
    const retry = writtenExam(c);
    expect(retry).not.toEqual(original);
    expect(gradeWrittenExam(c, retry.map((question, index) => question.options.find(option => option.correct === (index !== 0))!.id))?.score).toBe(4);
    expect(writtenPassed(c)).toBe(true);
    expect(c.flags['chunin-escrita-tentativas']).toBe(2);
  });
  it.each(['norte', 'sul'] as const)('permite seguir pela rota %s e obter a Terra por troca após recarregar', path => {
    let c = afterCamp();
    c.map = 'floresta'; c.flags['classico-capitulo'] = CHAPTERS.findIndex(chapter => chapter.id === 'ceu');
    expect(forestExamSpots(c, 'ceu')?.length).toBe(2);
    expect(completeForestRoute(c, path, 0.49)).toBe(false);
    expect(completeForestRoute(c, path, 0.5)).toBe(true);
    expect(completeForestRoute(c, path === 'norte' ? 'sul' : 'norte', 1)).toBe(false);
    expect(resolveChapter(c, 'ceu')).toBe(true);
    expect(resolveChapter(c, 'terra', 'troca')).toBe(false);
    expect(findSpareScroll(c, path)).toBe(true);
    expect(findSpareScroll(c, path)).toBe(false);
    c = decode(JSON.stringify(c));
    expect(forestRoute(c)).toBe(path);
    expect(resolveChapter(c, 'terra', 'troca')).toBe(true);
    expect(c.flags['chunin-floresta-terra']).toBe('troca');
    expect(classicChapter(c)?.id).toBe('torre');
  });
  it('permite continuar o duelo em saves antigos que já têm o pergaminho do Céu', () => {
    const c = afterCamp();
    c.map = 'floresta'; c.flags['classico-capitulo'] = CHAPTERS.findIndex(chapter => chapter.id === 'terra');
    expect(forestRoute(c)).toBeUndefined();
    expect(forestScrollStatus(c)).toMatchObject({ heaven: 'em-posse', earth: 'pendente' });
    expect(resolveChapter(c, 'terra')).toBe(true);
    expect(c.flags['chunin-floresta-terra']).toBe('duelo');
  });
  it('mostra no Diário os pergaminhos pendentes, guardados, entregues e a reserva usada na troca', () => {
    const c = afterCamp();
    expect(forestScrollStatus(c)).toBeUndefined();
    c.map = 'floresta'; c.flags['classico-capitulo'] = CHAPTERS.findIndex(chapter => chapter.id === 'ceu');
    expect(forestScrollStatus(c)).toMatchObject({ heaven: 'pendente', earth: 'pendente' });
    expect(completeForestRoute(c, 'sul', 0.7)).toBe(true);
    expect(resolveChapter(c, 'ceu')).toBe(true);
    c.map = 'rua';
    expect(forestScrollStatus(decode(JSON.stringify(c)))).toMatchObject({ heaven: 'em-posse', earth: 'pendente' });
    c.map = 'floresta';
    expect(findSpareScroll(c, 'sul')).toBe(true);
    expect(forestScrollStatus(c)?.spare).toBe('em-posse');
    expect(resolveChapter(c, 'terra', 'troca')).toBe(true);
    expect(forestScrollStatus(c)).toEqual({ heaven: 'em-posse', earth: 'em-posse', spare: 'trocado' });
    expect(resolveChapter(c, 'torre', 'ajudar')).toBe(true);
    expect(forestScrollStatus(decode(JSON.stringify(c)))).toEqual({ heaven: 'entregue', earth: 'entregue', spare: 'trocado' });
  });
  it('mantém Sasuke na rota fiel e respeita o vínculo na rota alternativa', () => {
    const faithful = afterCamp('fiel');
    faithful.map = 'vale'; faithful.flags['classico-capitulo'] = CHAPTERS.length - 1;
    faithful.npcs.sasuke.bond.confianca = 100;
    expect(visitValleyLookout(faithful)).toBe(true);
    expect(resolveChapter(faithful, 'vale', 'conversou')).toBe(false);
    expect(resolveChapter(faithful, 'vale', 'partiu')).toBe(true);
    const alternate = afterCamp('alternativo');
    expect(canReconcile(alternate)).toBe(false);
    alternate.flags['classico-marca'] = 'ajudar';
    expect(canReconcile(alternate)).toBe(true);
  });
  it.each([
    ['equilibrado', false, 'conversou'], ['alternativo', true, 'resgate'],
    ['fiel', true, 'partiu'], ['equilibrado', false, 'partiu'],
  ] as const)('salva o final %s com duelo %s e entrega o relato %s uma única vez', (fidelity, won, result) => {
    let c = afterCamp(fidelity);
    c.version = '0.5.8';
    c.map = 'vale'; c.flags['classico-capitulo'] = CHAPTERS.findIndex(ch => ch.id === 'vale');
    c.npcs.sasuke.bond.confianca = 30;
    const finale = { id: 'classico-vale', x: 512, y: 160, r: 24, label: 'Sasuke' };
    expect(valleySpots(c, finale)).toEqual([VALE_LOOKOUT]);
    expect(restAtValley(c)).toBe(false);
    expect(recordValleyDuel(c)).toBe(false);
    expect(resolveChapter(c, 'vale', result)).toBe(false);
    expect(visitValleyLookout(c)).toBe(true);
    expect(visitValleyLookout(c)).toBe(false);
    expect(valleySpots(c, finale)).toEqual([finale, VALE_REST]);
    c.hp = 9;
    expect(restAtValley(c)).toBe(true);
    expect(c.hp).toBe(maxVitals(c.stats).hp);
    c.hp--;
    expect(restAtValley(c)).toBe(false);
    expect(resolveChapter(c, 'vale', 'resgate')).toBe(false);
    if (won) {
      expect(recordValleyDuel(c)).toBe(true);
      expect(recordValleyDuel(c)).toBe(false);
      expect(resolveChapter(c, 'vale', 'conversou')).toBe(false);
    }
    c = decode(JSON.stringify(c));
    expect(c.flags['vale-duelo'] === true).toBe(won);
    const xp = c.xp;
    expect(resolveChapter(c, 'vale', result)).toBe(true);
    expect(resolveChapter(c, 'vale', result)).toBe(false);
    expect(c.xp - xp).toBe(100);
    expect(valleyEnding(c)).toBe(result);
    expect(turnInValleyReport(c)).toBe(false);
    c.map = 'rua'; c = decode(JSON.stringify(c));
    expect(valleyReportPending(c)).toBe(true);
    expect(turnInValleyReport(c)).toBe(true);
    expect(turnInValleyReport(c)).toBe(false);
    expect(valleyReportPending(c)).toBe(false);
    expect(classicChapter(c)).toBeUndefined();
  });
  it('mantém o final registrado em saves antigos sem criar um relato pendente', () => {
    const old = afterCamp();
    old.version = '0.5.8';
    old.flags['classico-final'] = 'conversou';
    const c = decode(JSON.stringify(old));
    expect(valleyEnding(c)).toBe('conversou');
    expect(valleyReportPending(c)).toBe(false);
  });
  it.each([['Uchiha', 'sharingan-leitura', 11], ['Hyūga', 'juken-inicial', 8]] as const)
  ('desbloqueia a prova %s com progresso, atributos e nota', (clan, id, threshold) => {
    const c = afterCamp();
    c.profile.clan = clan;
    expect(ocularTrial(c)?.story).toBe(true);
    c.flags['classico-capitulo'] = threshold;
    c.stats.Percepção = 6; c.stats.Taijutsu = 5; c.stats['Controle de chakra'] = 5;
    expect(awakenOcular(c, 0.59)).toBe(false);
    expect(awakenOcular(c, 0.6)).toBe(true);
    expect(awakenOcular(c, 1)).toBe(false);
    expect(decode(JSON.stringify(c)).jutsus[id]).toBe(30);
  });
});

describe('Estrada para o País das Ondas', () => {
  it('preserva a escolha do prólogo, permite adiar a partida e mantém a ordem dos objetivos numa recarga', () => {
    let c = fresh();
    expect(departForWaves(c)).toBe(false);
    c.rank = 'Genin';
    Object.assign(c.flags, { 'academia-concluida': true, 'patrulha-concluida': true, 'genin-etapa': 'ondas' });
    expect(finishGenin(c, 'investigar')).toBe(true);
    expect(wavesStage(c)).toBe('partida');
    expect(departForWaves(c)).toBe(true);
    expect(departForWaves(c)).toBe(false);
    expect(followRoadTracks(c)).toBe(false);
    c.map = 'estrada';
    expect(reachRoadCamp(c)).toBe(false);
    expect(followRoadTracks(c)).toBe(true);
    c = decode(JSON.stringify(c));
    expect(c.flags['ondas-postura']).toBe('investigar');
    expect(c.map).toBe('estrada');
    expect(reachRoadCamp(c)).toBe(true);
    expect(reachRoadCamp(c)).toBe(false);
    expect(wavesStage(c)).toBe('pausa');
  });
});

describe('Vínculos', () => {
  it('oferece um assunto próprio a cada colega e deixa adiar sem alterar o vínculo', () => {
    const c = fresh();
    const characters = [...CLASSMATES, ...GUY_TEAM];
    const subjects = characters.map(id => conversation(c, id)?.text);
    expect(subjects).not.toContain(undefined);
    expect(new Set(subjects).size).toBe(characters.length);
    expect(answerConversation(c, 'neji', 'depois')).toBeUndefined();
    expect(c.npcs.neji.bond.confianca).toBe(0);
  });

  it('grava respostas, limita o ganho diário e desbloqueia uma conversa pessoal por personagem', () => {
    const c = fresh();
    expect(answerConversation(c, 'neji', 'planejar')).toBeTruthy();
    expect(c.npcs.neji.bond).toMatchObject({ respeito: 5, confianca: 5 });
    expect(answerConversation(c, 'neji', 'acolher')).toBeUndefined();
    c.day++;
    c.npcs.neji.bond.confianca = 12;
    expect(conversation(c, 'neji')?.personal).toBe(true);
    expect(answerConversation(c, 'neji', 'ouvir')).toBeTruthy();
    expect(c.npcs.neji.bond.confianca).toBe(20);
    const restored = decode(JSON.stringify(c));
    restored.day++;
    expect(conversation(restored, 'neji')?.personal).toBe(false);
    expect(restored.npcs.neji.memory).toHaveLength(2);
  });

  it('aplica bônus em dois níveis apenas a companheiros disponíveis', () => {
    const c = fresh();
    c.flags.equipe = 'neji';
    c.npcs.neji.bond = { amizade: 19, rivalidade: 0, respeito: 0, confianca: 45 };
    expect(supportAffinity(c, 'neji')).toBe(0);
    c.npcs.neji.bond.amizade = 20;
    expect(supportAffinity(c, 'neji')).toBe(1);
    c.npcs.neji.bond.respeito = 45;
    expect(supportAffinity(c, 'neji')).toBe(2);
    c.flags.equipe = 'naruto';
    expect(supportAffinity(c, 'neji')).toBe(0);
  });
});

describe('Time Guy', () => {
  it('disponibiliza os três Genin e Guy para treino na primeira tarde, fora do exame da turma', () => {
    const c = fresh();
    for (const id of [...GUY_TEAM, 'guy']) expect(c.npcs[id]).toBeDefined();
    for (const id of GUY_TEAM) {
      expect(CLASSMATES).not.toContain(id);
      expect(c.npcs[id].rank).toBe('Genin');
    }
    expect(c.npcs['rock-lee'].jutsus).toEqual({});
    expect(requestGuyTeam(c, 'rock-lee')).toBe(false);
    c.quest = 'aula';
    expect(requestGuyTeam(c, 'sasuke')).toBe(false);
    expect(requestGuyTeam(c, 'neji')).toBe(true);
    expect(guyPreference(decode(JSON.stringify(c)))).toBe('neji');
    expect(requestGuyTeam(c, null)).toBe(true);
    expect(guyPreference(c)).toBeUndefined();
  });

  it.each(GUY_TEAM)('garante %s como primeiro parceiro com Guy e seleciona só mais um Genin', (partner) => {
    const c = fresh('fiel');
    c.quest = 'aula';
    expect(requestGuyTeam(c, partner)).toBe(true);
    c.rank = 'Genin';
    c.day = EXAM_DAY + 1;
    runDawn(c);
    expect(senseiId(c)).toBe('guy');
    expect(teamMembers(c)).toHaveLength(2);
    expect(teamMembers(c)[0]).toBe(partner);
    expect(teamMembers(c)).not.toContain(c.flags['guy-reserva']);
    expect(c.events['formacao-equipes']).toBe('time-guy');
    expect(requestGuyTeam(c, null)).toBe(false);
    expect(beginGenin(c)).toBe(true);
    expect(resolveBells(c, 0.75, true)).toBe(true);
    for (const id of teamMembers(c)) expect(c.npcs[id].bond.confianca).toBe(8);
  });

  it('preserva a equipe de uma jornada antiga e migra os quatro NPCs', () => {
    const old = fresh();
    old.version = '0.4.2';
    old.rank = 'Genin';
    old.flags.equipe = 'player,ino,shino';
    old.flags.sensei = 'kurenai';
    old.flags['academia-concluida'] = true;
    for (const id of [...GUY_TEAM, 'guy']) delete old.npcs[id];
    const c = decode(JSON.stringify(old));
    expect(teamMembers(c)).toEqual(['ino', 'shino']);
    expect(senseiId(c)).toBe('kurenai');
    for (const id of [...GUY_TEAM, 'guy']) expect(c.npcs[id]).toBeDefined();
  });
});

describe('Vida Genin', () => {
  it('retira Sasuke da equipe ativa apenas no final em que ele parte e conserva o histórico', () => {
    const c = fresh();
    c.flags.equipe = 'player,sasuke,sakura';
    expect(teamMembers(c)).toEqual(['sasuke', 'sakura']);
    c.flags['classico-final'] = 'resgate';
    expect(teamMembers(c)).toEqual(['sasuke', 'sakura']);
    c.flags['classico-final'] = 'partiu';
    expect(teamMembers(decode(JSON.stringify(c)))).toEqual(['sakura']);
    expect(c.flags.equipe).toBe('player,sasuke,sakura');
  });
  function graduated(seed: number) {
    const c = fresh('alternativo', seed);
    c.rank = 'Genin';
    c.day = EXAM_DAY + 1;
    for (const id of CLASSMATES) c.flags[`exame:${id}`] = 'aprovado';
    runDawn(c);
    return c;
  }

  it('sorteia dois colegas distintos e um mentor, com variação entre sementes e estabilidade ao recarregar', () => {
    const campaigns = Array.from({ length: 24 }, (_, i) => graduated(i + 1));
    const teams = new Set(campaigns.map((c) => String(c.flags.equipe)));
    const mentors = new Set(campaigns.map(senseiId));
    expect(teams.size).toBeGreaterThan(10);
    expect(mentors.size).toBeGreaterThan(2);
    for (const c of campaigns) {
      const restored = decode(JSON.stringify(c));
      expect(teamMembers(c)).toHaveLength(2);
      expect(new Set(teamMembers(c)).size).toBe(2);
      expect(teamMembers(restored)).toEqual(teamMembers(c));
      expect(senseiId(restored)).toBe(senseiId(c));
    }
  });

  it('retoma save v0.3.2 depois da graduação e acrescenta NPCs sem apagar vínculos', () => {
    const c = graduated(17);
    c.version = '0.3.2';
    c.npcs.iruka.bond.confianca = 44;
    delete c.npcs.ino;
    delete c.npcs.kurenai;
    const restored = decode(JSON.stringify(c));
    expect(restored.npcs.iruka.bond.confianca).toBe(44);
    expect(restored.npcs.ino).toBeDefined();
    expect(restored.npcs.kurenai.rank).toBe('Jōnin');
    expect(geninStage(restored)).toBe('encontro');
  });

  it.each(Object.keys(MISSION_OFFERS) as MissionOffer[])('permite adiar %s e aceitar em outro dia sem perder progresso', (offer) => {
    const c = graduated(15);
    c.quest = 'aula';
    c.flags['genin-etapa'] = offer;
    const money = c.ryo;
    expect(deferMission(c, offer)).toBe(true);
    expect(deferMission(c, offer)).toBe(false);
    expect(missionDeferred(c)).toBe(true);
    sleep(c);
    sleep(c);
    expect(academyMorning(c)).toBe('free');
    startAfternoon(c);
    expect(spendAction(c)).toBe(false);
    const restored = decode(JSON.stringify(c));
    expect(restored.actions).toBe(2);
    expect(restored.ryo).toBe(money);
    expect(pendingMission(restored)).toBe(offer);
    expect(missionDeferred(restored)).toBe(true);
    expect(acceptMission(restored, offer)).toBe(true);
    expect(geninStage(restored)).toBe(MISSION_OFFERS[offer].active);
    expect(missionDeferred(restored)).toBe(false);
    expect(acceptMission(restored, offer)).toBe(false);
  });

  it.each(['suprimentos', 'busca'] as const)('mantém %s em andamento nos saves antigos', (stage) => {
    const c = graduated(15);
    c.version = '0.4.10';
    c.flags['genin-etapa'] = stage;
    c.flags[stage === 'suprimentos' ? SUPPLIES[0].id : 'tora-rastro'] = true;
    const restored = decode(JSON.stringify(c));
    expect(geninStage(restored)).toBe(stage);
    expect(pendingMission(restored)).toBeUndefined();
    expect(restored.flags[stage === 'suprimentos' ? SUPPLIES[0].id : 'tora-rastro']).toBe(true);
  });

  it('mantém as recompensas únicas e aplica os bônus de combate só enquanto equipados', () => {
    let c = graduated(15);
    expect(beginGenin(c)).toBe(true);
    expect(c.era).toBe('classico');
    expect(resolveBells(c, 0.8, false)).toBe(false);
    expect(resolveBells(c, 0.8, true)).toBe(true);
    expect(pendingMission(c)).toBe('suprimentos-ordem');
    expect(collectSupply(c, SUPPLIES[0].id)).toBe(false);
    expect(acceptMission(c, 'suprimentos-ordem')).toBe(true);
    const money = c.ryo;
    c.flags.equipado = 'luvas';
    expect(combatStats(c).Taijutsu).toBe(c.stats.Taijutsu + 2);
    expect(combatPower(combatStats(c))).toBe(combatPower(c.stats) + 4);
    expect(collectSupply(c, SUPPLIES[0].id)).toBe(true);
    expect(collectSupply(c, SUPPLIES[0].id)).toBe(false);
    c = decode(JSON.stringify(c));
    expect(geninStage(c)).toBe('suprimentos');
    for (const supply of SUPPLIES.slice(1)) expect(collectSupply(c, supply.id)).toBe(true);
    expect(turnInSupplies(c)).toBe(true);
    expect(turnInSupplies(c)).toBe(false);
    expect(pendingMission(c)).toBe('tora-ordem');
    expect(rescueTora(c)).toBe(false);
    expect(acceptMission(c, 'tora-ordem')).toBe(true);
    expect(rescueTora(c)).toBe(true);
    expect(turnInTora(c)).toBe(true);
    expect(turnInTora(c)).toBe(false);
    expect(c.ryo).toBe(money + 190);
    expect(finishGenin(c, 'investigar')).toBe(false);
    expect(acceptMission(c, 'selo-ordem')).toBe(true);
    const solution = sealCase(c).destination;
    expect(solveSealCase(c, solution)).toBe(false);
    expect(recordSealClue(c, SEAL_CLUES[0].id)).toBe(true);
    expect(recordSealClue(c, SEAL_CLUES[0].id)).toBe(false);
    c = decode(JSON.stringify(c));
    for (const clue of SEAL_CLUES.slice(1)) expect(recordSealClue(c, clue.id)).toBe(true);
    expect(solveSealCase(c, 'errado')).toBe(false);
    expect(solveSealCase(c, solution)).toBe(true);
    expect(solveSealCase(c, solution)).toBe(false);
    expect(acceptMission(c, 'patrulha-ordem')).toBe(true);
    expect(checkPatrolPost(c, PATROL_POSTS[1].id)).toBe(false);
    expect(settlePatrolDuel(c, true)).toBe(false);
    for (const post of PATROL_POSTS) expect(checkPatrolPost(c, post.id)).toBe(true);
    expect(settlePatrolDuel(c, false)).toBe(false);
    c = decode(JSON.stringify(c));
    expect(settlePatrolDuel(c, true)).toBe(true);
    expect(reportPatrol(c)).toBe(true);
    expect(reportPatrol(c)).toBe(false);
    expect(c.ryo).toBe(money + 460);
    expect(finishGenin(c, 'investigar')).toBe(true);
    expect(geninStage(c)).toBe('concluida');
    expect(c.flags['ondas-postura']).toBe('investigar');
  });
});

describe('polimento da campanha', () => {
  it('insere as novas missões num save antigo já encerrado e preserva a decisão sobre Tazuna', () => {
    const original = fresh();
    original.rank = 'Genin';
    Object.assign(original.flags, { 'academia-concluida': true, 'genin-etapa': 'concluida', 'ondas-postura': 'aceitar' });
    delete original.npcs.maki;
    const c = decode(JSON.stringify(original));
    expect(c.npcs.maki).toBeDefined();
    expect(geninStage(c)).toBe('selo-ordem');
    expect(acceptMission(c, 'selo-ordem')).toBe(true);
    for (const clue of SEAL_CLUES) recordSealClue(c, clue.id);
    expect(solveSealCase(c, sealCase(c).destination)).toBe(true);
    expect(acceptMission(c, 'patrulha-ordem')).toBe(true);
    for (const post of PATROL_POSTS) checkPatrolPost(c, post.id);
    expect(settlePatrolDuel(c, true)).toBe(true);
    expect(reportPatrol(c)).toBe(true);
    expect(geninStage(c)).toBe('concluida');
    expect(c.flags['ondas-postura']).toBe('aceitar');
  });
  it('reabre o treino nos dias 11 e 12 em um save antigo reprovado e oferece a repescagem no dia 13', () => {
    const old = fresh();
    old.version = '0.4.4'; old.day = EXAM_DAY + 1; old.quest = 'aula';
    old.lessonsDone.push(EXAM_DAY);
    Object.assign(old.flags, { 'exame:player': 'reprovado', repescagem: EXAM_DAY + 3 });
    const c = decode(JSON.stringify(old));
    for (const day of [11, 12]) {
      expect(c.day).toBe(day);
      expect(academyMorning(c)).toBe('free');
      startAfternoon(c);
      expect(c.actions).toBe(3);
      expect(spendAction(c)).toBe(false);
      sleep(c);
    }
    expect(retakeDay(c)).toBe(13);
    expect(academyMorning(c)).toBe('exam');
    delete c.flags.repescagem;
    expect(academyMorning(c)).toBe('exam');
  });

  it('abre dois treinos extras só depois da última ação, persiste no save e zera ao dormir', () => {
    const c = fresh();
    startAfternoon(c);
    expect(extraTrainingLeft(c)).toBe(0);
    while (c.period === 1) spendAction(c);
    expect(c.actions).toBe(0);
    expect(extraTrainingLeft(c)).toBe(2);
    const resumed = decode(JSON.stringify(c));
    spendExtraTraining(resumed);
    expect(extraTrainingLeft(resumed)).toBe(1);
    spendExtraTraining(resumed);
    spendExtraTraining(resumed);
    expect(extraTrainingLeft(resumed)).toBe(0);
    expect(resumed.period).toBe(2);
    sleep(resumed);
    expect(resumed.flags['treinos-extras']).toBeUndefined();
    expect(resumed.actions).toBe(3);
  });

  it('equilibra o exame pelas ações do jogador e exige que se aprenda Bunshin', () => {
    expect(graduationGrade(24, 0.9, 1, 3).pass).toBe(true);
    expect(graduationGrade(0, 1, 1, 10).pass).toBe(false);
    expect(graduationGrade(24, 0.1, 0.33, 3).pass).toBe(false);
    expect(graduationGrade(80, 0.25, 0, 3).pass).toBe(true);
  });

  it('dá margem para o erro de distração e fecha a captura com três paradas certas', () => {
    const distract = new ToraGame('distracao');
    distract.press(true);
    distract.update(1.7);
    distract.press(true);
    expect(distract.done).toBe(false);
    for (let i = 0; i < 3; i++) {
      distract.update(1.7);
      distract.update(1.05);
      distract.press(true);
    }
    expect(distract.score).toBe(1);
    expect(distract.done).toBe(true);
    const alone = new ToraGame('sozinho');
    alone.press(true);
    alone.update(1.9);
    alone.press(true);
    expect(alone.done).toBe(true);
    expect(alone.score).toBe(0);
  });

  it('mantém o esconderijo e o auxílio escolhido de Tora ao recarregar a jornada', () => {
    const c = fresh();
    c.rank = 'Genin';
    c.flags['academia-concluida'] = true;
    c.flags['genin-etapa'] = 'busca';
    c.flags.equipe = 'player,kiba,shikamaru';
    expect(setToraPlan(c, 'ino')).toBe(false);
    expect(setToraPlan(c, 'kiba')).toBe(true);
    expect(setToraPlan(c, 'shikamaru')).toBe(false);
    const restored = decode(JSON.stringify(c));
    expect(toraRoute(restored)).toEqual(toraRoute(c));
    expect(toraTactic(restored)).toBe('rastreio');
    expect(rescueTora(restored)).toBe(true);
    expect(restored.npcs.kiba.bond.confianca).toBe(5);
  });
});

describe('criação de campanha', () => {
  it('aplica atributo, talento e bônus de clã sem poderes desbloqueados', () => {
    const c = fresh();
    expect(c.stats.Velocidade).toBe(4);
    expect(c.stats.Taijutsu).toBe(3);
    expect(c.stats.Inteligência).toBe(3); // Sem clã: +1 Inteligência
    expect(c.jutsus).toEqual({});
    expect(c.rank).toBe('Estudante da Academia');
  });
  it('sorteia clã e afinidade de forma determinística', () => {
    const a = newCampaign({ ...profile, clan: 'Sortear', element: 'Sortear' }, { difficulty: 'normal', fidelity: 'fiel' }, 7);
    const b = newCampaign({ ...profile, clan: 'Sortear', element: 'Sortear' }, { difficulty: 'normal', fidelity: 'fiel' }, 7);
    expect(a.profile.clan).toBe(b.profile.clan);
    expect(a.profile.clan).not.toBe('Sortear');
  });
});

describe('salvamento', () => {
  it.each([
    ['local desconhecido', (state: Record<string, unknown>) => { state.map = 'exterior'; }],
    ['flags ausentes', (state: Record<string, unknown>) => { delete state.flags; }],
    ['dados de NPC incompletos', (state: Record<string, unknown>) => { state.npcs = { iruka: { memory: [] } }; }],
    ['semente inválida', (state: Record<string, unknown>) => { state.seed = -1; }],
  ])('trata %s como save ilegível, tanto ao continuar quanto ao importar', (_, change) => {
    const original = fresh();
    const state = JSON.parse(JSON.stringify(original)) as Record<string, unknown>;
    change(state);
    const broken = JSON.stringify(state), store = memoryStore();
    store.setItem(slotKey(0), broken);
    expect(readSlot(store, 0).kind).toBe('broken');
    expect(importSlot(store, 1, broken)).toEqual({ ok: false, reason: 'invalid' });
    expect(store.getItem(slotKey(0))).toBe(broken);
    expect(store.getItem(slotKey(1))).toBeNull();
  });
  it('grava e lê o mesmo estado', () => {
    const s = memoryStore(), c = fresh();
    const w = writeSlot(s, 0, c, null);
    expect(w.ok).toBe(true);
    const r = readSlot(s, 0);
    expect(r.kind).toBe('ok');
    if (r.kind === 'ok') expect(r.campaign).toEqual(c);
  });
  it('transfere a jornada para outro armazenamento e preserva inventário, equipe e objetivo', () => {
    const source = memoryStore();
    const target = memoryStore();
    const c = fresh('equilibrado', 15);
    c.rank = 'Genin';
    Object.assign(c.flags, { 'academia-concluida': true, equipe: 'kiba,hinata', sensei: 'kurenai' });
    c.inventory.shuriken = 2;
    c.flags['genin-etapa'] = 'suprimentos';
    const exported = writeSlot(source, 0, c, null);
    expect(exported.ok).toBe(true);
    if (!exported.ok) return;
    expect(importSlot(target, 1, exported.raw).ok).toBe(true);
    const imported = readSlot(target, 1);
    expect(imported.kind).toBe('ok');
    if (imported.kind === 'ok') {
      expect(imported.campaign.inventory.shuriken).toBe(2);
      expect(teamMembers(imported.campaign)).toEqual(teamMembers(c));
      expect(geninStage(imported.campaign)).toBe('suprimentos');
    }
    expect(readSlot(target, 0).kind).toBe('empty');
    expect(importSlot(target, 1, JSON.stringify(fresh()))).toEqual({ ok: false, reason: 'conflict' });
    expect(readSlot(target, 1)).toEqual(imported);
  });

  it('recusa arquivos inválidos antes de salvar e aceita o formato original da v0.2', () => {
    const store = memoryStore();
    const { stats, profile } = fresh();
    for (const raw of ['{', JSON.stringify({ ...fresh(), jutsus: null }), JSON.stringify({ ...fresh(), map: 'desconhecido' })]) {
      expect(importSlot(store, 0, raw)).toEqual({ ok: false, reason: 'invalid' });
      expect(readSlot(store, 0).kind).toBe('empty');
    }
    const raw = JSON.stringify({ schema: 2, profile, stats, day: 2, step: 2 });
    expect(importSlot(store, 0, raw).ok).toBe(true);
    const info = readSlot(store, 0);
    expect(info.kind).toBe('ok');
    if (info.kind === 'ok') expect(info.campaign.quest).toBe('aula');
  });

  it('recusa gravar quando outra aba alterou o slot', () => {
    const s = memoryStore(), c = fresh();
    writeSlot(s, 0, c, null);
    s.setItem(slotKey(0), JSON.stringify({ ...c, day: 9 }));
    expect(writeSlot(s, 0, c, null)).toEqual({ ok: false, reason: 'conflict' });
  });
  it('migra saves da v0.2.0 preservando a matrícula', () => {
    const v2 = { schema: 2, era: 'academia', profile: { ...profile }, stats: { ...fresh().stats }, rank: 'Estudante', level: 1, age: 12, day: 3, hp: 40, chakra: 22, stamina: 25, x: 10, y: 10, step: 2, seen: ['gate'], log: ['Dia 1 · Você saiu de casa para se matricular.'] };
    const c = decode(JSON.stringify(v2));
    expect(c.schema).toBe(3);
    expect(c.quest).toBe('aula');
    expect(c.lessonsDone).toContain(1);
    expect(c.day).toBe(3);
    expect(c.log.some((l) => l.text === 'Você saiu de casa para se matricular.')).toBe(true);
  });
  it('marca slot ilegível em vez de quebrar', () => {
    const s = memoryStore();
    s.setItem(slotKey(1), '{quebrado');
    expect(readSlot(s, 1).kind).toBe('broken');
    s.setItem(slotKey(2), JSON.stringify({ schema: 99 }));
    expect(readSlot(s, 2).kind).toBe('broken');
  });
  it('exclui só a jornada escolhida e limpa o atalho Continuar quando necessário', () => {
    const s = memoryStore(), c = fresh();
    writeSlot(s, 0, c, null);
    s.setItem(slotKey(1), '');
    s.setItem(LAST_SLOT_KEY, '0');
    expect(deleteSlot(s, 1, '')).toEqual({ ok: true });
    expect(s.getItem(LAST_SLOT_KEY)).toBe('0');
    const raw = s.getItem(slotKey(0))!;
    writeSlot(s, 2, c, null);
    expect(deleteSlot(s, 0, raw)).toEqual({ ok: true });
    expect(readSlot(s, 0).kind).toBe('empty');
    expect(readSlot(s, 2).kind).toBe('ok');
    expect(s.getItem(LAST_SLOT_KEY)).toBeNull();
  });
  it('preserva um save alterado depois de abrir a confirmação', () => {
    const s = memoryStore(), c = fresh();
    const saved = writeSlot(s, 0, c, null);
    if (!saved.ok) throw new Error('Falha ao preparar o save de teste');
    writeSlot(s, 0, { ...c, day: 4 }, saved.raw);
    expect(deleteSlot(s, 0, saved.raw)).toEqual({ ok: false, reason: 'conflict' });
    expect(decode(s.getItem(slotKey(0))!).day).toBe(4);
  });
  it('migra a bandana da campanha e preserva a posição escolhida ao recarregar', () => {
    const old = fresh();
    delete old.profile.bandPosition;
    expect(decode(JSON.stringify(old)).profile.bandPosition).toBe('testa');
    old.profile.bandAtWaist = true;
    expect(decode(JSON.stringify(old)).profile.bandPosition).toBe('cintura');
    const c = fresh();
    for (const position of ['testa', 'pescoco', 'braco', 'cintura', 'guardada'] as const) {
      c.profile.bandPosition = position;
      expect(decode(JSON.stringify(c)).profile.bandPosition).toBe(position);
    }
    expect(decode(JSON.stringify({ ...c, profile: { ...c.profile, bandPosition: 'invalida' } })).profile.bandPosition).toBe('testa');
  });

  it('dá o visual padrão a saves antigos e mantém a personalização escolhida', () => {
    const old = { ...fresh(), profile: { ...profile } };
    expect(decode(JSON.stringify(old)).profile).toMatchObject({
      outfit: 'Uniforme da Academia', scarf: 'Cachecol solto', accessoryTone: 'Grafite',
    });
    const custom = { ...old, profile: { ...profile, outfit: 'Colete de campo', scarf: 'Sem cachecol', accessoryTone: 'Jade' } };
    expect(decode(JSON.stringify(custom)).profile).toMatchObject(custom.profile);
  });
});

describe('treinos e herança de clã', () => {
  it('oferece um treino com ganho para cada atributo exibido na ficha', () => {
    const c = fresh();
    for (const stat of ACADEMY_STATS) {
      const drill = trainingFor(stat);
      expect(drill?.stats).toContain(stat);
      if (!drill) continue;
      const before = c.statXp[stat] + c.stats[stat];
      applyTraining(c, drill.stats, 0.75);
      expect(c.statXp[stat] + c.stats[stat]).toBeGreaterThan(before);
    }
  });

  it('encerra a Vida Genin antes de oferecer a prova de gelo, exige domínio e guarda a afinidade', () => {
    const c = fresh();
    c.profile.clan = 'Yuki';
    c.profile.element = 'Relâmpago';
    expect(yukiTrial(c).state).toBe('story');
    expect(awakenHyoton(c, 1)).toBe(false);
    c.rank = 'Genin'; c.era = 'classico';
    Object.assign(c.flags, { 'academia-concluida': true, 'genin-etapa': 'ondas', 'patrulha-concluida': true });
    expect(awakenHyoton(c, 1)).toBe(false);
    c.flags['genin-etapa'] = 'concluida';
    c.stats.Ninjutsu = 2;
    expect(yukiTrial(c).state).toBe('stats');
    c.stats.Ninjutsu = 4; c.stats['Controle de chakra'] = 5;
    expect(yukiTrial(c).state).toBe('ready');
    expect(awakenHyoton(c, 0.59)).toBe(false);
    expect(awakenHyoton(c, 0.6)).toBe(true);
    const saved = decode(JSON.stringify(c));
    expect(saved.profile.element).toBe('Relâmpago');
    expect(saved.jutsus[HYOTON]).toBe(31);
    expect(yukiTrial(saved).state).toBe('known');
    expect(awakenHyoton(saved, 1)).toBe(false);
    const other = fresh();
    Object.assign(other, { rank: c.rank, era: c.era, flags: c.flags, stats: c.stats });
    expect(awakenHyoton(other, 1)).toBe(false);
  });
});

describe('progressão', () => {
  it('custo cresce com o atributo e o treino sobe pontos', () => {
    expect(statCost(8)).toBeGreaterThan(statCost(2));
    const c = fresh();
    const before = c.stats.Força;
    train(c, 'Força', 5);
    expect(c.stats.Força).toBeGreaterThan(before);
  });
  it('domínio de técnica sobe com treino e para em 100', () => {
    const c = fresh();
    learn(c, 'bunshin');
    for (let i = 0; i < 60; i++) applyTraining(c, ['Ninjutsu'], 1, 0.9, 'bunshin');
    expect(c.jutsus.bunshin).toBeLessThanOrEqual(100);
    expect(c.jutsus.bunshin).toBeGreaterThan(80);
  });
});

describe('calendário', () => {
  it('a tarde tem três ações e vira noite', () => {
    const c = fresh();
    startAfternoon(c);
    expect(spendAction(c)).toBe(false);
    expect(spendAction(c)).toBe(false);
    expect(spendAction(c)).toBe(true);
    expect(c.period).toBe(2);
  });
  it('dormir avança o dia, recupera e faz os NPCs treinarem', () => {
    const c = fresh();
    c.hp = 1;
    const sasuke = c.npcs.sasuke.stats.Taijutsu;
    sleep(c);
    expect(c.day).toBe(2);
    expect(c.hp).toBeGreaterThan(1);
    expect(c.npcs.sasuke.stats.Taijutsu).toBeGreaterThan(sasuke);
  });
});

describe('mundo dinâmico', () => {
  it('na fidelidade máxima Naruto reprova sem a influência do jogador e a noite do pergaminho acontece', () => {
    const c = fresh('fiel');
    c.day = EXAM_DAY;
    runDawn(c);
    expect(c.flags['exame:naruto']).toBe('reprovado');
    const night = dueEvents(c, 'night').map((e) => e.id);
    expect(night).toContain('noite-do-pergaminho');
    expect(night).not.toContain('mizuki-sem-alvo');
    resolveEvent(c, WORLD_EVENTS.find((e) => e.id === 'noite-do-pergaminho')!, 'ficar');
    expect(c.flags['naruto-kage-bunshin']).toBe(true);
    expect(c.flags['exame:naruto']).toBe('aprovado-iruka');
  });

  it('se Naruto treinou com o jogador e passou, o plano de Mizuki não é forçado', () => {
    const c = fresh('fiel');
    c.flags['treino-naruto'] = 4;
    c.npcs.naruto.jutsus.bunshin = 100;
    c.npcs.naruto.stats['Controle de chakra'] = 12;
    c.day = EXAM_DAY;
    runDawn(c);
    expect(c.flags['exame:naruto']).toBe('aprovado');
    const night = dueEvents(c, 'night').map((e) => e.id);
    expect(night).not.toContain('noite-do-pergaminho');
    for (const e of dueEvents(c, 'night')) resolveEvent(c, e);
    expect(c.flags['mizuki-oculto']).toBe(true);
    expect(c.flags['naruto-kage-bunshin']).toBe(false);
  });

  it('o jogador assume o lugar de Naruto na Equipe 7 quando ele não se forma', () => {
    const c = fresh();
    c.rank = 'Genin';
    c.day = EXAM_DAY + 1;
    Object.assign(c.flags, { 'exame:naruto': 'reprovado', 'exame:sasuke': 'aprovado', 'exame:sakura': 'aprovado' });
    const news = resolveEvent(c, WORLD_EVENTS.find((e) => e.id === 'formacao-equipes')!);
    expect(c.flags.equipe).toBe('player,sasuke,sakura');
    expect(news).toContain('Equipe 7');
  });

  it('avisar Iruka evita a pegadinha do monumento', () => {
    const c = fresh();
    c.flags.pegadinha = 'avisar';
    c.day = 7;
    runDawn(c);
    expect(c.events['pegadinha-monumento']).toBe('evitada');
    expect(c.npcs.iruka.bond.confianca).toBeGreaterThan(0);
  });
});
