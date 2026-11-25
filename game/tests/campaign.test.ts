import { describe, it, expect } from 'vitest';
import { newCampaign, type Campaign, type Profile } from '../src/state/campaign';
import { deleteSlot, decode, readSlot, writeSlot, memoryStore, slotKey, LAST_SLOT_KEY } from '../src/state/save';
import { dueEvents, resolveEvent, sleep, startAfternoon, spendAction, WORLD_EVENTS } from '../src/systems/world';
import { train, statCost, applyTraining, learn } from '../src/systems/progression';
import { PATROL_POSTS, SEAL_CLUES } from '../src/data/genin-assignments';
import { EXAM_DAY, graduationGrade } from '../src/data/academy';
import { ToraGame } from '../src/scenes/tora';
import { CLASSMATES } from '../src/data/characters';
import {
  beginGenin, beginPatrol, beginSealCase, checkPatrolPost, collectSupply, combatStats, finishGenin, geninStage,
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

  it('persiste as duas missões, impede repetição de recompensa e aplica equipamento só quando equipado', () => {
    let c = graduated(15);
    expect(beginGenin(c)).toBe(true);
    expect(c.era).toBe('classico');
    expect(resolveBells(c, 0.8, false)).toBe(false);
    expect(resolveBells(c, 0.8, true)).toBe(true);
    const money = c.ryo;
    c.flags.equipado = 'luvas';
    expect(combatStats(c).Taijutsu).toBe(c.stats.Taijutsu + 2);
    expect(collectSupply(c, SUPPLIES[0].id)).toBe(true);
    expect(collectSupply(c, SUPPLIES[0].id)).toBe(false);
    c = decode(JSON.stringify(c));
    expect(geninStage(c)).toBe('suprimentos');
    for (const supply of SUPPLIES.slice(1)) expect(collectSupply(c, supply.id)).toBe(true);
    expect(turnInSupplies(c)).toBe(true);
    expect(turnInSupplies(c)).toBe(false);
    expect(rescueTora(c)).toBe(true);
    expect(turnInTora(c)).toBe(true);
    expect(turnInTora(c)).toBe(false);
    expect(c.ryo).toBe(money + 190);
    expect(finishGenin(c, 'investigar')).toBe(false);
    expect(beginSealCase(c)).toBe(true);
    const solution = sealCase(c).destination;
    expect(solveSealCase(c, solution)).toBe(false);
    expect(recordSealClue(c, SEAL_CLUES[0].id)).toBe(true);
    expect(recordSealClue(c, SEAL_CLUES[0].id)).toBe(false);
    c = decode(JSON.stringify(c));
    for (const clue of SEAL_CLUES.slice(1)) expect(recordSealClue(c, clue.id)).toBe(true);
    expect(solveSealCase(c, 'errado')).toBe(false);
    expect(solveSealCase(c, solution)).toBe(true);
    expect(solveSealCase(c, solution)).toBe(false);
    expect(beginPatrol(c)).toBe(true);
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
    expect(beginSealCase(c)).toBe(true);
    for (const clue of SEAL_CLUES) recordSealClue(c, clue.id);
    expect(solveSealCase(c, sealCase(c).destination)).toBe(true);
    expect(beginPatrol(c)).toBe(true);
    for (const post of PATROL_POSTS) checkPatrolPost(c, post.id);
    expect(settlePatrolDuel(c, true)).toBe(true);
    expect(reportPatrol(c)).toBe(true);
    expect(geninStage(c)).toBe('concluida');
    expect(c.flags['ondas-postura']).toBe('aceitar');
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
  it('dá o visual padrão a saves antigos e mantém a personalização escolhida', () => {
    const old = { ...fresh(), profile: { ...profile } };
    expect(decode(JSON.stringify(old)).profile).toMatchObject({
      outfit: 'Uniforme da Academia', scarf: 'Cachecol solto', accessoryTone: 'Grafite',
    });
    const custom = { ...old, profile: { ...profile, outfit: 'Colete de campo', scarf: 'Sem cachecol', accessoryTone: 'Jade' } };
    expect(decode(JSON.stringify(custom)).profile).toMatchObject(custom.profile);
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
