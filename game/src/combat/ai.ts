// IA de combate. Decide antes de ver a ação do jogador e usa só informação pública:
// distância, vida e chakra aparentes, o que o adversário mostrou na última ação e as técnicas
// que já viu funcionar. Nunca lê `status.substitution` do adversário (é oculto).
import { DUEL_STYLES } from './styles';
import { HYOTON } from '../data/jutsus';
import { Rng } from '../core/rng';
import { available, type Action, type Battle } from './engine';

/** A interface anuncia as ações preparadas e executa o mesmo plano. */
export function duelIntent(b: Battle, side: 0 | 1): { action: Action; cue: string } | undefined {
  const me = b.fighters[side];
  if (me.id === 'haku') {
    const phase = b.round % 3;
    if (phase === 0 && available(b, side).some(({ action, ok }) => ok && action.type === 'jutsu' && action.id === HYOTON)) {
      return { action: { type: 'jutsu', id: HYOTON }, cue: 'Haku reúne gelo entre as mãos. Use a guarda ou uma substituição.' };
    }
    if (phase === 1 && me.chakra < me.chakraMax) {
      return { action: { type: 'focus' }, cue: 'Haku baixa as mãos para recuperar chakra. É sua chance de atacar.' };
    }
    if (b.distance === 0 && phase !== 1) {
      return { action: { type: 'retreat' }, cue: 'Haku procura espaço para lançar gelo. Você pode pressionar antes que ele se afaste.' };
    }
  }
  if (me.id === 'zabuza') {
    const phase = b.round % 3;
    if (phase === 0 && b.distance !== 2 && me.stamina >= 6) return {
      action: { type: 'taijutsu', heavy: true }, cue: 'Zabuza ergue a lâmina para um corte pesado. Defender reduz muito o impacto.',
    };
    if (phase === 1) return {
      action: { type: 'focus' }, cue: 'Zabuza apoia a lâmina no chão para recuperar o fôlego. O flanco está aberto.',
    };
  }
  if (me.id === 'floresta') {
    const phase = b.round % 4;
    if (b.round === 0 && available(b, side).some(({ action, ok }) => ok && action.type === 'jutsu' && action.id === 'bunshin')) {
      return { action: { type: 'jutsu', id: 'bunshin' }, cue: 'O batedor prepara cópias. Use arremessos leves para dissipá-las.' };
    }
    if (phase === 1 && b.distance > 0 && me.items.shuriken > 0) {
      return { action: { type: 'shuriken' }, cue: 'O batedor procura um ângulo para arremessar. Feche a distância ou use a guarda.' };
    }
    if (phase === 2) return {
      action: { type: 'focus' }, cue: 'O batedor desfaz os selos para recuperar chakra. Aproveite a abertura.',
    };
  }
  if (me.id === 'gaara') {
    const phase = b.round % 4;
    if (phase === 0) return {
      action: { type: 'defend' }, cue: 'A areia se fecha ao redor de Gaara. Use a rodada para preparar uma técnica ou recuperar resistência.',
    };
    if (phase === 1 && b.distance === 2) return {
      action: { type: 'advance' }, cue: 'Gaara avança por trás da areia. Você ainda pode atingi-lo com um arremesso.',
    };
    if (phase === 1 && me.stamina >= 6) return {
      action: { type: 'taijutsu', heavy: true }, cue: 'A areia se ergue para uma investida pesada. Defenda se ainda não tiver uma substituição preparada.',
    };
    if (phase === 2) return {
      action: { type: 'focus' }, cue: 'A areia baixa enquanto Gaara recupera o fôlego. Ataque agora, com a defesa aberta.',
    };
  }
  if (me.id === 'invasao') {
    const phase = b.round % 3;
    if (phase === 0 && b.distance === 0 && me.items.shuriken > 0) return {
      action: { type: 'retreat' }, cue: 'O invasor procura espaço para arremessar. Ataque antes do recuo ou prepare a guarda.',
    };
    if (phase !== 2 && b.distance > 0 && me.items.shuriken > 0 && me.stamina >= 2) return {
      action: { type: 'shuriken' }, cue: 'O invasor leva a mão à bolsa. Defenda o arremesso ou feche a distância.',
    };
    if (phase === 2) return {
      action: { type: 'focus' }, cue: 'O invasor baixa a guarda para recuperar fôlego. Aproveite a abertura.',
    };
  }
  if (me.id === 'akatsuki') {
    const phase = b.round % 4;
    if ((b.round === 0 || b.round === 8) && me.status.clones === 0
        && available(b, side).some(({ action, ok }) => ok && action.type === 'jutsu' && action.id === 'bunshin')) {
      return { action: { type: 'jutsu', id: 'bunshin' }, cue: 'Kisame começa a formar cópias. Prepare uma substituição ou use arremessos para dissipá-las.' };
    }
    if (phase === 1 && b.distance === 2) return {
      action: { type: 'advance' }, cue: 'Kisame arrasta a lâmina para encurtar a distância. Você ainda tem tempo para agir.',
    };
    if (phase === 1 && me.stamina >= 6) return {
      action: { type: 'taijutsu', heavy: true }, cue: 'Kisame ergue a lâmina para um golpe pesado. Use a guarda ou deixe uma substituição preparada.',
    };
    if (phase === 2) return {
      action: { type: 'focus' }, cue: 'Kisame apoia a lâmina no chão para recuperar chakra. Aproveite a abertura.',
    };
  }
  if (me.id === 'som') {
    const phase = b.round % 4;
    if (b.round === 0 && available(b, side).some(({ action, ok }) => ok && action.type === 'jutsu' && action.id === 'henge')) {
      return { action: { type: 'jutsu', id: 'henge' }, cue: 'A sentinela muda de forma entre as árvores. Prepare a guarda ou uma substituição para quando ela atacar.' };
    }
    if (phase === 1 && b.distance > 0 && me.items.shuriken > 0 && me.stamina >= 2) return {
      action: { type: 'shuriken' }, cue: 'O galho se mexe e a mão vai à bolsa. A sentinela vai arremessar da trilha lateral.',
    };
    if (phase === 1 && b.distance === 0 && me.stamina >= 6) return {
      action: { type: 'taijutsu', heavy: true }, cue: 'A sentinela firma o pé para um golpe pesado. Defenda ou use a substituição preparada.',
    };
    if (phase === 2) return {
      action: { type: 'focus' }, cue: 'A sentinela para para recompor os selos. A guarda está aberta.',
    };
  }
  if (me.id === 'sasuke-vale') {
    const phase = b.round % 4;
    const fire = available(b, side).find(({ action }) => action.type === 'jutsu' && action.id === 'gokakyu');
    if (phase === 0 && fire?.ok) return {
      action: fire.action, cue: 'Sasuke enche o peito para um Katon. Prepare a guarda ou use uma substituição.',
    };
    if (phase === 0 && b.distance === 0) return {
      action: { type: 'retreat' }, cue: 'Sasuke procura espaço para usar o Katon. Pressione se quiser manter a luta por perto.',
    };
    if (phase === 1 && b.distance === 0 && me.stamina >= 6) return {
      action: { type: 'taijutsu', heavy: true }, cue: 'Sasuke gira o corpo para um golpe pesado. Defenda ou responda com a substituição.',
    };
    if (phase === 1 && b.distance > 0 && me.items.shuriken > 0 && me.stamina >= 2) return {
      action: { type: 'shuriken' }, cue: 'Sasuke leva a mão à bolsa. Ele vai lançar shuriken para manter a distância.',
    };
    if (phase === 2) return {
      action: { type: 'focus' }, cue: 'Sasuke baixa a guarda para recuperar chakra. Aproveite a abertura.',
    };
  }
}

export function chooseAction(b: Battle, side: 0 | 1, rng: Rng): Action {
  const intent = duelIntent(b, side);
  if (intent) return intent.action;
  const me = b.fighters[side];
  const foe = b.fighters[side === 0 ? 1 : 0];
  const p = me.personality ?? { aggression: 0.5, cunning: 0.5, caution: 0.5, traits: [] };
  const hpRatio = me.hp / me.hpMax;
  const foeSeals = b.lastPublic[foe.side] === 'seals';
  const suspectsSub = foeSeals && me.knowledge.includes('kawarimi');
  const prefersMelee = me.stats.Taijutsu + me.stats.Força >= me.stats.Bukijutsu * 2 - 1;
  const lowStamina = me.stamina < 6;
  const opening = DUEL_STYLES[me.id]?.opener;

  const scored = available(b, side).filter((o) => o.ok).map(({ action }) => {
    let s = 0;
    switch (action.type) {
      case 'taijutsu':
        s = 0.55 + p.aggression * 0.9 + (b.distance === 0 ? 0.45 : b.distance === 1 ? -0.1 : -0.45) + (prefersMelee ? 0.3 : -0.1);
        if (me.status.behind) s += 1.4;
        if (suspectsSub) s -= 0.6;
        if (lowStamina) s -= 0.7;
        break;
      case 'kunai':
        s = 0.35 + me.stats.Bukijutsu * 0.06 + (b.distance >= 1 ? 0.35 : 0) + (me.status.behind ? 0.8 : 0);
        if (suspectsSub) s -= 0.3;
        break;
      case 'shuriken':
        s = 0.25 + me.stats.Bukijutsu * 0.05 + (b.distance === 2 ? 0.55 : 0.1);
        // Isca barata para gastar uma substituição suspeita.
        if (suspectsSub) s += 0.9 * p.cunning;
        if (foe.status.clones > 0) s += 0.25;
        break;
      case 'advance':
        s = (prefersMelee ? 0.5 : 0.05) + p.aggression * 0.4 - (hpRatio < 0.35 ? p.caution : 0);
        break;
      case 'retreat':
        s = (prefersMelee ? -0.2 : 0.35) + (hpRatio < 0.4 ? p.caution * 0.8 : 0) + (b.distance === 0 && !prefersMelee ? 0.3 : 0);
        break;
      case 'defend':
        s = 0.15 + p.caution * (1 - hpRatio) * 1.3 + (lowStamina ? 0.5 : 0) + (b.lastPublic[foe.side] === 'attack' ? 0.1 : 0);
        break;
      case 'focus':
        s = me.chakra / me.chakraMax < 0.35 ? 0.35 + p.cunning * 0.4 : -0.5;
        if (b.distance === 0) s -= 0.4;
        break;
      case 'jutsu': {
        const m = (me.jutsus[action.id] ?? 0) / 100;
        if (action.id === 'kawarimi') s = 0.15 + p.cunning * 0.7 * m + (hpRatio < 0.5 ? 0.35 : 0) + (b.lastPublic[foe.side] === 'attack' ? 0.15 : 0);
        else if (action.id === 'bunshin' || action.id === 'kage-bunshin') s = me.status.clones > 0 ? -1 : 0.1 + p.cunning * 0.6 * m + (foe.knowledge.includes('bunshin') ? -0.2 : 0);
        else if (action.id === 'gokakyu') s = 0.6 + p.aggression * 0.45 + m * 0.4;
        else if (action.id === 'henge') s = 0.05 + p.cunning * 0.45 * m;
        break;
      }
      default:
        s = -1;
    }
    if (opening === 'pressao' && (action.type === 'advance' || action.type === 'taijutsu') && !lowStamina) s += 0.5;
    if (opening === 'guarda' && action.type === 'defend' && b.lastPublic[side] !== 'defend' && (b.distance === 0 || b.lastPublic[foe.side] === 'attack')) s += 0.85;
    if (opening === 'alcance' && (action.type === 'shuriken' || action.type === 'retreat')) s += b.distance === 0 && action.type === 'retreat' ? 0.85 : 0.55;
    if (opening === 'finta' && action.type === 'jutsu' && !me.status.disguised && !me.status.behind) s += action.id === 'henge' ? 0.85 : 0.25;
    return { action, s: s + rng.next() * 0.35 };
  });
  scored.sort((a, b2) => b2.s - a.s);
  return scored[0]?.action ?? { type: 'defend' };
}
