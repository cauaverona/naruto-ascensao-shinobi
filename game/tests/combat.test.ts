import { describe, it, expect } from 'vitest';
import { makeFighter, startBattle, resolveRound, available, type Battle } from '../src/combat/engine';
import { chooseAction } from '../src/combat/ai';
import { CHARACTERS } from '../src/data/characters';
import { baseStats } from '../src/data/stats';
import { Rng } from '../src/core/rng';

function duel(seed = 1): Battle {
  const a = makeFighter({ id: 'p', name: 'Jogador', role: 'player', stats: baseStats(4), jutsus: { bunshin: 100, kawarimi: 100, henge: 100 } }, 0);
  const s = CHARACTERS.sasuke;
  const b = makeFighter({ id: 'sasuke', name: 'Sasuke', role: 'sasuke', stats: s.stats, jutsus: s.jutsus, personality: s.personality }, 1);
  return startBattle(a, b, seed, 0);
}

describe('combate', () => {
  it('substituição anula o golpe e deixa o defensor atrás do atacante', () => {
    const b = duel(7);
    b.fighters[0].status.substitution = true;
    b.fighters[0].stats.Velocidade = 1; // o adversário age primeiro
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
