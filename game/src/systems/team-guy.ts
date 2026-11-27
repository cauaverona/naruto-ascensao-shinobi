import { GUY_TEAM } from '../data/characters';
import { addLog, type Campaign } from '../state/campaign';
import type { Rng } from '../core/rng';

export type GuyTeammate = (typeof GUY_TEAM)[number];

export function guyPreference(c: Campaign): GuyTeammate | undefined {
  return GUY_TEAM.find((id) => c.flags['guy-preferencia'] === id);
}

export function requestGuyTeam(c: Campaign, partner: string | null): boolean {
  if (c.quest.startsWith('matricula') || c.flags.equipe) return false;
  if (partner === null) {
    delete c.flags['guy-preferencia'];
    return true;
  }
  const member = GUY_TEAM.find((id) => id === partner && c.npcs[id]?.alive);
  if (!member) return false;
  c.flags['guy-preferencia'] = member;
  return true;
}

export function formGuyTeam(c: Campaign, rng: Rng) {
  const preferred = guyPreference(c);
  if (!preferred || !c.npcs.guy?.alive || !c.npcs[preferred]?.alive) return null;
  const candidates = GUY_TEAM.filter((id) => id !== preferred && c.npcs[id]?.alive);
  if (!candidates.length) return null;
  const partner = rng.pick(candidates);
  const reserve = GUY_TEAM.find((id) => id !== preferred && id !== partner);
  c.flags['guy-reserva'] = reserve ?? '';
  c.flags.sensei = 'guy';
  addLog(c, 'Guy confirmou a vaga na rotação de missões do Time 3.');
  return [preferred, partner];
}

