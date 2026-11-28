import { addLog, type Campaign } from '../state/campaign';
import { geninStage } from './genin';
import { VILLAGE_CRATE, VILLAGE_DECK, VILLAGE_MOORING, VILLAGE_WINCH } from '../data/waves-village-map';

export type WavesStage = 'partida' | 'estrada' | 'acampamento' | 'pausa';

export function wavesStage(c: Campaign): WavesStage | null {
  if (geninStage(c) !== 'concluida') return null;
  if (c.flags['ondas-acampamento']) return 'pausa';
  if (c.flags['ondas-rastros']) return 'acampamento';
  return c.flags['ondas-partida'] ? 'estrada' : 'partida';
}

export function departForWaves(c: Campaign) {
  if (wavesStage(c) !== 'partida') return false;
  c.flags['ondas-partida'] = true;
  addLog(c, 'Missão C · A equipe saiu de Konoha para escoltar Tazuna ao País das Ondas.');
  return true;
}

export function followRoadTracks(c: Campaign) {
  if (c.map !== 'estrada' || wavesStage(c) !== 'estrada') return false;
  c.flags['ondas-rastros'] = true;
  addLog(c, 'Na estrada, a equipe encontrou marcas de carroça que abandonavam a rota junto ao riacho.');
  return true;
}

export function reachRoadCamp(c: Campaign) {
  if (c.map !== 'estrada' || wavesStage(c) !== 'acampamento') return false;
  c.flags['ondas-acampamento'] = true;
  addLog(c, 'A escolta montou um acampamento antes da travessia. A equipe guardou a pista do riacho.');
  return true;
}

export const WAVE_STOPS = {
  haku: [
    { id: 'ondas-caixote', label: 'Caixote do cais', ...VILLAGE_CRATE, r: 21 },
    { id: 'ondas-amarra', label: 'Estaca das amarras', ...VILLAGE_MOORING, r: 21 },
  ],
  zabuza: [
    { id: 'ondas-guincho', label: 'Trabalhadores do guincho', ...VILLAGE_WINCH, r: 21 },
    { id: 'ondas-tablado', label: 'Trabalhadores do tablado', ...VILLAGE_DECK, r: 20 },
  ],
} as const;

export function pendingWaveStops(c: Campaign, chapter: string) {
  const stops = chapter === 'haku' ? WAVE_STOPS.haku : chapter === 'zabuza' ? WAVE_STOPS.zabuza : [];
  return stops.filter(({ id }) => !c.flags[id]);
}

export function recordWaveStop(c: Campaign, chapter: string, id: string, note: string) {
  if (c.map !== 'ondas' || !pendingWaveStops(c, chapter).some(stop => stop.id === id)) return false;
  c.flags[id] = true;
  addLog(c, note);
  return true;
}
