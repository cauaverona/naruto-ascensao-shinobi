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

export function ocularTrial(c: Campaign) {
  const lineage = clanByName(c.profile.clan).hereditary;
  if (lineage !== 'sharingan' && lineage !== 'byakugan') return;
  const technique = JUTSUS[lineage === 'sharingan' ? 'sharingan-leitura' : 'juken-inicial'];
  if (Object.hasOwn(c.jutsus, technique.id)) return;
  const chapter = Number(c.flags['classico-capitulo'] ?? 0);
  const story = c.era !== 'classico' || chapter < (lineage === 'sharingan' ? 11 : 8);
  const missing = Object.entries(technique.requirements)
    .filter(([stat, minimum]) => c.stats[stat as Stat] < minimum)
    .map(([stat, minimum]) => `${stat} ${c.stats[stat as Stat]}/${minimum}`);
  return { technique, story, missing };
}

export function awakenOcular(c: Campaign, score: number) {
  const trial = ocularTrial(c);
  if (!trial || trial.story || trial.missing.length || !Number.isFinite(score) || score < 0.6 || score > 1) return false;
  learn(c, trial.technique.id, 30);
  addLog(c, `Despertou ${trial.technique.name} na Pedra de meditação.`);
  return true;
}
