import { describe, it, expect } from 'vitest';
import { makeFighter, startBattle, resolveRound, available, type Battle } from '../src/combat/engine';
import { chooseAction } from '../src/combat/ai';
import { CHARACTERS } from '../src/data/characters';
import { baseStats } from '../src/data/stats';
import { HYOTON } from '../src/data/jutsus';
import { Rng } from '../src/core/rng';

function duel(seed = 1): Battle {
  const a = makeFighter({ id: 'p', name: 'Jogador', role: 'player', stats: baseStats(4), jutsus: { bunshin: 100, kawarimi: 100, henge: 100 } }, 0);
  const s = CHARACTERS.sasuke;
  const b = makeFighter({ id: 'sasuke', name: 'Sasuke', role: 'sasuke', stats: s.stats, jutsus: s.jutsus, personality: s.personality }, 1);
  return startBattle(a, b, seed, 0);
}

describe('combate', () => {
  it('faz Kiba pressionar e Shino manter alcance mesmo com atributos iguais', () => {
    const habits = (id: string) => Array.from({ length: 16 }, (_, i) => {
      const battle = duel(1);
      const fighter = battle.fighters[1];
      fighter.id = id;
      fighter.personality = undefined;
      fighter.stats = baseStats(3);
      battle.distance = 2;
      return chooseAction(battle, 1, new Rng(i + 1)).type;
    });
    expect(habits('kiba').filter((action) => action === 'taijutsu' || action === 'advance').length).toBeGreaterThan(8);
    expect(habits('shino').filter((action) => action === 'shuriken').length).toBeGreaterThan(8);
  });

  it('ativa a guarda antes de um atacante mais rápido e encerra a proteção na mesma rodada', () => {
    const battle = duel(7);
    battle.fighters[0].stats.Velocidade = 20;
    battle.fighters[1].stats.Velocidade = 1;
    const defended = resolveRound(battle, [{ type: 'taijutsu' }, { type: 'defend' }]);
    expect(defended.find((event) => event.t === 'act')).toMatchObject({ who: 1, label: 'Defender' });
    expect(defended.find((event) => event.t === 'hit')).toMatchObject({ who: 1, guarded: true });
    expect(battle.fighters[1].status.defending).toBe(false);
    const exposed = resolveRound(battle, [{ type: 'taijutsu' }, { type: 'focus' }]);
    expect(exposed.find((event) => event.t === 'hit')).toMatchObject({ who: 1, guarded: false });
  });

  it.each([['advance', 0], ['retreat', 2]] as const)('mantém a distância válida quando os dois escolhem %s', (type, zone) => {
    const battle = duel();
    battle.distance = 1;
    battle.fighters[0].stats.Velocidade = 20;
    const stamina = battle.fighters[1].stamina;
    const events = resolveRound(battle, [{ type }, { type }]);
    expect(battle.distance).toBe(zone);
    expect(events.filter((event) => event.t === 'move')).toMatchObject([{ who: 0, distance: zone }]);
    expect(battle.fighters[1].stamina).toBe(stamina);
  });

  it('usa taijutsu de longe para aproximar e permite golpear da distância média', () => {
    const battle = duel(7);
    battle.distance = 2;
    const stamina = battle.fighters[0].stamina;
    const move = resolveRound(battle, [{ type: 'taijutsu' }, { type: 'defend' }]);
    expect(battle.distance).toBe(1);
    expect(battle.fighters[0].stamina).toBe(stamina - 1);
    expect(move.some((event) => event.t === 'strike')).toBe(false);
    const strike = resolveRound(battle, [{ type: 'taijutsu' }, { type: 'defend' }]);
    expect(battle.distance).toBe(0);
    expect(strike.some((event) => event.t === 'strike')).toBe(true);
  });
  it('Katon tem alcance, gasta chakra no disparo e emite evento visual', () => {
    const battle = duel(5);
    const fighter = battle.fighters[0];
    fighter.jutsus.gokakyu = 100;
    const option = () => available(battle, 0).find(({ action }) => action.type === 'jutsu' && action.id === 'gokakyu');
    expect(option()?.ok).toBe(false);
    expect(option()?.why).toBe('Fora do alcance');
    const chakra = fighter.chakra;
    resolveRound(battle, [{ type: 'jutsu', id: 'gokakyu' }, { type: 'defend' }]);
    expect(fighter.chakra).toBe(chakra);
    expect(fighter.used.gokakyu).toBeUndefined();
    battle.distance = 1;
    expect(option()?.ok).toBe(true);
    let cast = false;
    for (let seed = 1; seed <= 20; seed++) {
      const attempt = duel(seed);
      attempt.distance = 1;
      const player = attempt.fighters[0];
      player.jutsus.gokakyu = 100;
      const before = player.chakra;
      const events = resolveRound(attempt, [{ type: 'jutsu', id: 'gokakyu' }, { type: 'defend' }]);
      if (!events.some((event) => event.t === 'technique')) continue;
      expect(player.chakra).toBeLessThan(before);
      cast = true;
      break;
    }
    expect(cast).toBe(true);
  });
  it('Hyōton causa geada num acerto aberto e a iniciativa consome o efeito em uma rodada', () => {
    let found = false;
    for (let seed = 1; seed <= 35 && !found; seed++) {
      const b = duel(seed);
      b.fighters[0].jutsus[HYOTON] = 100;
      b.fighters[0].stats['Controle de chakra'] = 15;
      const action = { type: 'jutsu', id: HYOTON } as const;
      expect(available(b, 0).find(({ action }) => action.type === 'jutsu' && action.id === HYOTON)?.ok).toBe(false);
      b.distance = 1;
      const events = resolveRound(b, [action, { type: 'focus' }]);
      if (!events.some((event) => event.t === 'chill')) continue;
      expect(events).toContainEqual({ t: 'technique', who: 0, jutsu: HYOTON });
      expect(events).toContainEqual({ t: 'chill', who: 1 });
      expect(b.fighters[1].status.chilled).toBe(true);
      b.fighters[0].stats.Velocidade = 4;
      b.fighters[1].stats.Velocidade = 5;
      const closeRoll = Array.from({ length: 50 }, (_, i) => i + 1).find((seed) => {
        const rng = new Rng(seed);
        return Math.abs(rng.next() - rng.next()) < 0.25;
      });
      expect(closeRoll).toBeDefined();
      if (closeRoll === undefined) break;
      b.rng = closeRoll;
      const thawed = structuredClone(b);
      thawed.fighters[1].status.chilled = false;
      const focus = { type: 'focus' } as const;
      expect(resolveRound(thawed, [focus, focus])[0]).toMatchObject({ t: 'act', who: 1 });
      expect(resolveRound(b, [focus, focus])[0]).toMatchObject({ t: 'act', who: 0 });
      expect(b.fighters[1].status.chilled).toBe(false);
      found = true;
    }
    expect(found).toBe(true);
  });

  it('a guarda evita a geada, inclusive quando Estilhaços de Gelo acerta', () => {
    let blocked = false;
    for (let seed = 1; seed <= 20 && !blocked; seed++) {
      const b = duel(seed);
      b.distance = 1;
      b.fighters[0].jutsus[HYOTON] = 100;
      const events = resolveRound(b, [{ type: 'jutsu', id: HYOTON }, { type: 'defend' }]);
      if (!events.some((event) => event.t === 'hit' && event.guarded)) continue;
      expect(events.some((event) => event.t === 'chill')).toBe(false);
      expect(b.fighters[1].status.chilled).toBe(false);
      blocked = true;
    }
    expect(blocked).toBe(true);
  });

  it('substituição anula o golpe e deixa o defensor atrás do atacante', () => {
    const b = duel(7);
    b.fighters[0].status.substitution = true;
    b.fighters[0].stats.Velocidade = 1;
    const hp = b.fighters[0].hp;
    let ev = resolveRound(b, [{ type: 'defend' }, { type: 'taijutsu' }]);
    // Pode errar; repete até o golpe conectar.
    for (let i = 0; i < 20 && !ev.some((e) => e.t === 'substitute'); i++) {
      b.fighters[0].status.substitution = true;
      ev = resolveRound(b, [{ type: 'defend' }, { type: 'taijutsu' }]);
    }
    expect(ev.some((e) => e.t === 'substitute')).toBe(true);
    expect(b.fighters[0].status.behind).toBe(true);
    expect(b.fighters[1].knowledge).toContain('kawarimi');
    expect(b.fighters[0].hp).toBeLessThanOrEqual(hp);
  });

  it('clones ilusórios absorvem golpes e somem sem causar dano', () => {
    let popped = 0;
    for (let seed = 1; seed < 40; seed++) {
      const b = duel(seed);
      b.fighters[0].status.clones = 3;
      b.fighters[1].stats.Percepção = 1;
      const ev = resolveRound(b, [{ type: 'defend' }, { type: 'taijutsu' }]);
      if (ev.some((e) => e.t === 'clone-pop')) {
        popped++;
        expect(b.fighters[0].status.clones).toBe(2);
        expect(ev.some((e) => e.t === 'hit' && e.who === 0)).toBe(false);
      }
    }
    expect(popped).toBeGreaterThan(15);
  });

  it('técnica falha sem domínio e gasta chakra', () => {
    let fails = 0;
    for (let seed = 1; seed < 30; seed++) {
      const b = duel(seed);
      b.fighters[0].jutsus.bunshin = 0;
      b.fighters[0].stats['Controle de chakra'] = 1;
      const ch = b.fighters[0].chakra;
      const ev = resolveRound(b, [{ type: 'jutsu', id: 'bunshin' }, { type: 'defend' }]);
      expect(b.fighters[0].chakra).toBe(ch - 4);
      if (ev.some((e) => e.t === 'fail')) fails++;
    }
    expect(fails).toBeGreaterThan(10);
  });

  it('a luta termina por nocaute ou tempo e é determinística pela semente', () => {
    const run = () => {
      const b = duel(99);
      const rng = new Rng(5);
      while (!b.over) resolveRound(b, [chooseAction(b, 0, rng), chooseAction(b, 1, rng)]);
      return [b.over.winner, b.round, b.fighters[0].hp, b.fighters[1].hp].join(':');
    };
    expect(run()).toBe(run());
  });

  it('render-se encerra a luta', () => {
    const b = duel();
    resolveRound(b, [{ type: 'yield' }, { type: 'defend' }]);
    expect(b.over).toEqual({ winner: 1, reason: 'yield' });
  });

  it('a IA não lê a substituição oculta do jogador', () => {
    // Mesmo estado público, com e sem substituição preparada: a escolha tem de ser idêntica.
    for (let seed = 1; seed < 30; seed++) {
      const a = duel(seed), b = duel(seed);
      b.fighters[0].status.substitution = true;
      expect(chooseAction(a, 1, new Rng(seed))).toEqual(chooseAction(b, 1, new Rng(seed)));
    }
  });

  it('sem kunai a ação fica indisponível', () => {
    const b = duel();
    b.fighters[0].items.kunai = 0;
    expect(available(b, 0).find((o) => o.action.type === 'kunai')?.ok).toBe(false);
  });
});
