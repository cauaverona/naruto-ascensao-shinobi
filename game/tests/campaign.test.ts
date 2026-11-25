import { describe, it, expect } from 'vitest';
import { newCampaign, type Campaign, type Profile } from '../src/state/campaign';
import { decode, readSlot, writeSlot, memoryStore, slotKey } from '../src/state/save';
import { dueEvents, resolveEvent, sleep, startAfternoon, spendAction, WORLD_EVENTS } from '../src/systems/world';
import { train, statCost, applyTraining, learn } from '../src/systems/progression';
import { EXAM_DAY } from '../src/data/academy';

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
