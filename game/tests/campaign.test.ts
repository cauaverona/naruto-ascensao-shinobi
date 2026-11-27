import { describe, it, expect } from 'vitest';
import { newCampaign, type Campaign, type Profile } from '../src/state/campaign';
import { deleteSlot, decode, importSlot, readSlot, writeSlot, memoryStore, slotKey, LAST_SLOT_KEY } from '../src/state/save';
import { academyMorning, dueEvents, extraTrainingLeft, resolveEvent, retakeDay, sleep, startAfternoon, spendAction, spendExtraTraining, WORLD_EVENTS } from '../src/systems/world';
import { train, statCost, applyTraining, learn } from '../src/systems/progression';
import { PATROL_POSTS, SEAL_CLUES } from '../src/data/genin-assignments';
import { EXAM_DAY, graduationGrade } from '../src/data/academy';
import { ACADEMY_STATS, combatPower } from '../src/data/stats';
import { HYOTON } from '../src/data/jutsus';
import { trainingFor } from '../src/data/training';
import { awakenHyoton, yukiTrial } from '../src/systems/heritage';
import { guyPreference, requestGuyTeam } from '../src/systems/team-guy';
import { ToraGame } from '../src/scenes/tora';
import { GUY_TEAM, CLASSMATES } from '../src/data/characters';
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

function runDawn(c: Campaign) {
  for (const e of dueEvents(c, 'dawn')) resolveEvent(c, e);
}

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
