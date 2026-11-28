import { addLog, type Campaign } from '../state/campaign';
import { restoreAll } from './progression';
import { SUNA_INFIRMARY, SUNA_MESSENGER, SUNA_SOUTH_LOOKOUT, SUNA_WEST_POST } from '../data/sand-frontier-map';

export const SUNA_GUARDS = [
  { id: 'suna-guarda', label: 'Guarda do posto oeste', ...SUNA_WEST_POST, r: 23 },
  { id: 'suna-vigia', label: 'Vigia da duna sul', ...SUNA_SOUTH_LOOKOUT, r: 23 },
] as const;

export const SUNA_LEADS = {
  carta: { id: 'suna-carta', label: 'Mensageira da Areia', ...SUNA_MESSENGER, r: 23 },
  enfermaria: { id: 'suna-enfermaria', label: 'Posto de socorro', ...SUNA_INFIRMARY, r: 23 },
} as const;

const GUARD_REPORTS = {
  'suna-guarda': 'O posto oeste autorizou a passagem da equipe, com a condição de manter a saída livre para os feridos.',
  'suna-vigia': 'A vigia apontou a passagem de serviço onde Gaara espera e explicou como reconhecer uma abertura na guarda de areia.',
};

export function pendingSunaGuards(c: Campaign) {
  return SUNA_GUARDS.filter(guard => c.flags[guard.id] !== true);
}

export function recordSunaGuard(c: Campaign, id: string) {
  const guard = pendingSunaGuards(c).find(guard => guard.id === id);
  if (c.map !== 'suna' || !guard) return false;
  c.flags[guard.id] = true;
  addLog(c, GUARD_REPORTS[guard.id]);
  return true;
}

export function sunaLead(c: Campaign) {
  return SUNA_LEADS[c.flags['classico-gaara'] === 'acordo' ? 'carta' : 'enfermaria'];
}

export function sunaLeadReady(c: Campaign) {
  return c.flags['suna-pista-tsunade'] === sunaLead(c).id;
}

export function recordSunaLead(c: Campaign, id: string) {
  if (c.map !== 'suna' || sunaLead(c).id !== id || sunaLeadReady(c)) return false;
  c.flags['suna-pista-tsunade'] = id;
  if (id === 'suna-enfermaria') restoreAll(c);
  addLog(c, id === 'suna-carta'
    ? 'A mensageira entregou uma carta da Areia para apresentar a Tsunade na casa de chá.'
    : 'O posto de socorro tratou seus ferimentos e pediu que você levasse a Tsunade o registro de atendimento.');
  return true;
}
