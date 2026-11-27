import { clanByName } from '../data/clans';
import { HYOTON, JUTSUS } from '../data/jutsus';
import type { Stat } from '../data/stats';
import { addLog, type Campaign } from '../state/campaign';
import { geninStage } from './genin';
import { learn } from './progression';

export const HYOTON_TRIAL_COST = 6;
export const HYOTON_TRIAL_SCORE = 0.6;

export function yukiTrial(c: Campaign) {
  const technique = JUTSUS[HYOTON];
  if (clanByName(c.profile.clan).hereditary !== HYOTON) return { state: 'other' } as const;
  if (Object.hasOwn(c.jutsus, HYOTON)) return { state: 'known' } as const;
  if (c.era !== 'classico' || geninStage(c) !== 'concluida') return { state: 'story' } as const;
  const missing = Object.entries(technique.requirements)
    .filter(([stat, minimum]) => c.stats[stat as Stat] < minimum)
    .map(([stat, minimum]) => `${stat} ${c.stats[stat as Stat]}/${minimum}`);
  return missing.length ? { state: 'stats', missing } as const : { state: 'ready' } as const;
}

export function awakenHyoton(c: Campaign, score: number): boolean {
  if (yukiTrial(c).state !== 'ready' || !Number.isFinite(score) || score < HYOTON_TRIAL_SCORE || score > 1) return false;
  learn(c, HYOTON, Math.round(25 + score * 10));
  addLog(c, 'Aprendeu Hyōton: Estilhaços de Gelo com o caderno da família Yuki.');
  return true;
}

