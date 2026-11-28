import type { MapId, Look } from './characters';
import type { StatBlock } from './stats';
import { VALLEY_SASUKE } from './valley-map';
import { FOREST_EARTH, FOREST_SENTINEL, FOREST_TOWER } from './forest-map';
import { FOREST_ROUTES } from './chunin';
import { ROAD_BOAT } from './waves-road-map';
import { VILLAGE_HAKU, VILLAGE_ZABUZA } from './waves-village-map';
import { ARENA_FINAL, ARENA_PRELIMINARY } from './chunin-arena-map';
import { SUNA_SERVICE_GATE, SUNA_TEA_HOUSE } from './sand-frontier-map';

export interface Chapter {
  id: string;
  title: string;
  area: MapId;
  objective: string;
  x: number;
  y: number;
}

export const CHAPTERS: readonly Chapter[] = [
  { id: 'barco', title: 'Travessia sob neblina', area: 'estrada', objective: 'Encontre o barco escondido junto ao acampamento', ...ROAD_BOAT },
  { id: 'haku', title: 'Um encontro na margem', area: 'ondas', objective: 'Investigue as pegadas próximas aos cais', ...VILLAGE_HAKU },
  { id: 'zabuza', title: 'A ponte inacabada', area: 'ondas', objective: 'Proteja os trabalhadores no fim da ponte', ...VILLAGE_ZABUZA },
  { id: 'inscricao', title: 'Inscrição Chūnin', area: 'rua', objective: 'Procure a banca perto da Academia', x: 414, y: 226 },
  { id: 'escrita', title: 'Prova escrita', area: 'sala', objective: 'Resolva cinco situações táticas na prova escrita', x: 240, y: 190 },
  { id: 'ceu', title: 'Pergaminho do Céu', area: 'floresta', objective: 'Escolha uma passagem para recuperar o pergaminho do Céu', x: FOREST_ROUTES.norte.scout.x, y: FOREST_ROUTES.norte.scout.y },
  { id: 'terra', title: 'Pergaminho da Terra', area: 'floresta', objective: 'Encontre a equipe do Som na clareira ou procure um pergaminho para trocar', ...FOREST_EARTH },
  { id: 'torre', title: 'A torre da floresta', area: 'floresta', objective: 'Leve os dois pergaminhos à torre', ...FOREST_TOWER },
  { id: 'preliminar', title: 'Eliminatória Chūnin', area: 'arena', objective: 'Entre no círculo da eliminatória', ...ARENA_PRELIMINARY },
  { id: 'final', title: 'Final Chūnin', area: 'arena', objective: 'Demonstre como você lideraria um esquadrão', ...ARENA_FINAL },
  { id: 'invasao', title: 'Alarme em Konoha', area: 'rua', objective: 'Proteja a rota de evacuação da Academia', x: 608, y: 264 },
  { id: 'gaara', title: 'Fronteira da Areia', area: 'suna', objective: 'Gaara · Encontre-o na passagem de serviço a leste', ...SUNA_SERVICE_GATE },
  { id: 'tsunade', title: 'Em busca de Tsunade', area: 'suna', objective: 'Fale com a viajante na casa de chá da fronteira', ...SUNA_TEA_HOUSE },
  { id: 'akatsuki', title: 'Visitantes ao anoitecer', area: 'rua', objective: 'Investigue a ameaça relatada por Tsunade', x: 574, y: 226 },
  { id: 'som', title: 'Equipe de resgate', area: 'floresta', objective: 'Siga o rastro de Sasuke até a saída leste da floresta', ...FOREST_SENTINEL },
  { id: 'vale', title: 'Vale do Fim', area: 'vale', objective: 'Alcance Sasuke na margem do vale', ...VALLEY_SASUKE },
];

interface StoryOpponent { name: string; look: Look; stats: Partial<StatBlock>; techniques?: Record<string, number> }
export const STORY_OPPONENTS: Record<string, StoryOpponent> = {
  haku: { name: 'Haku', look: { skin: 'Pálida', hair: 'Preto', cut: 'Longo', coat: 'Branco', accessory: 'Máscara' }, stats: { Velocidade: 5, Vitalidade: 2, Resistência: 2, Ninjutsu: 4, 'Controle de chakra': 5 }, techniques: { hyoton: 75 } },
  zabuza: { name: 'Zabuza', look: { skin: 'Oliva', hair: 'Preto', cut: 'Espetado', coat: 'Cinza', accessory: 'Máscara' }, stats: { Força: 5, Vitalidade: 4, Taijutsu: 4, Velocidade: 2, Bukijutsu: 4 }, techniques: { kawarimi: 65 } },
  floresta: { name: 'Batedor do Som', look: { skin: 'Dourada', hair: 'Castanho', cut: 'Curto', coat: 'Cinza' }, stats: { Velocidade: 4, Vitalidade: 2, Resistência: 2, Força: 2 }, techniques: { bunshin: 42 } },
  invasao: { name: 'Invasor do Som', look: { skin: 'Oliva', hair: 'Chocolate', cut: 'Espetado', coat: 'Musgo', accessory: 'Máscara' }, stats: { Resistência: 3, Bukijutsu: 5, Força: 4 } },
  gaara: { name: 'Gaara', look: { skin: 'Pálida', hair: 'Ruivo', cut: 'Espetado', coat: 'Terracota', mark: 'Marcas vermelhas' }, stats: { Vitalidade: 6, Chakra: 7, Resistência: 7, Velocidade: 4 }, techniques: { kawarimi: 85 } },
  akatsuki: { name: 'Kisame', look: { skin: 'Pálida', hair: 'Azul', cut: 'Espetado', coat: 'Preto', trim: 'Vermelho', outfit: 'Capa curta', scarf: 'Gola enrolada' }, stats: { Vitalidade: 5, Chakra: 8, Força: 4, Bukijutsu: 6 }, techniques: { bunshin: 75 } },
  som: { name: 'Sentinela do Quarteto', look: { skin: 'Clara', hair: 'Prateado', cut: 'Longo', coat: 'Roxo' }, stats: { Vitalidade: 5, Força: 4, Velocidade: 5, Taijutsu: 4, Bukijutsu: 4 }, techniques: { henge: 70 } },
};
