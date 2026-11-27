export const OUTFITS = ['Uniforme da Academia', 'Jaqueta de treino', 'Colete de campo', 'Túnica cruzada', 'Capa curta', 'Traje leve'] as const;
export const SCARVES = ['Sem cachecol', 'Cachecol solto', 'Lenço curto', 'Gola enrolada'] as const;

export const BAND_POSITIONS = { testa: 'Testa', pescoco: 'Pescoço', braco: 'Braço', cintura: 'Cintura', guardada: 'Guardada' } as const;
export type BandPosition = keyof typeof BAND_POSITIONS;

export function bandPositionOf(look?: { bandPosition?: unknown; bandAtWaist?: unknown }): BandPosition {
  const position = look?.bandPosition;
  if (typeof position === 'string' && Object.hasOwn(BAND_POSITIONS, position)) return position as BandPosition;
  return look?.bandAtWaist === true ? 'cintura' : 'testa';
}

export const accessorySet: Record<string, [string, string, string]> = {
  Grafite: ['#1c2232', '#404e65', '#94aec4'],
  Bronze: ['#392625', '#a06b42', '#f3c282'],
  Prata: ['#333b50', '#8195a9', '#d6e6ea'],
  Jade: ['#182f31', '#3d7768', '#9cd5ad'],
  Rubi: ['#421f33', '#a44559', '#e59399'],
  Lavanda: ['#302542', '#735892', '#ccb5ec'],
};

export const WARDROBE_DEFAULTS = {
  outfit: OUTFITS[0],
  scarf: SCARVES[1],
  accessoryTone: 'Grafite',
};
