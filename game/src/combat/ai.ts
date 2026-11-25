// IA de combate. Decide antes de ver a ação do jogador e usa só informação pública:
// distância, vida e chakra aparentes, o que o adversário mostrou na última ação e as técnicas
// que já viu funcionar. Nunca lê `status.substitution` do adversário (é oculto).
import { DUEL_STYLES } from './styles';
import { Rng } from '../core/rng';
import { available, type Action, type Battle } from './engine';

export function chooseAction(b: Battle, side: 0 | 1, rng: Rng): Action {
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
    if (opening === 'guarda' && action.type === 'defend' && !me.status.defending && (b.distance === 0 || b.lastPublic[foe.side] === 'attack')) s += 0.85;
    if (opening === 'alcance' && (action.type === 'shuriken' || action.type === 'retreat')) s += b.distance === 0 && action.type === 'retreat' ? 0.85 : 0.55;
    if (opening === 'finta' && action.type === 'jutsu' && !me.status.disguised && !me.status.behind) s += action.id === 'henge' ? 0.85 : 0.25;
    return { action, s: s + rng.next() * 0.35 };
  });
  scored.sort((a, b2) => b2.s - a.s);
  return scored[0]?.action ?? { type: 'defend' };
}
