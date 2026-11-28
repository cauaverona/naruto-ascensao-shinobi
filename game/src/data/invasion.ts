import type { Spot } from '../render/maps/types';

export const INVASION_ROUTES = {
  evacuar: { label: 'Becos laterais', prep: { id: 'invasao-preparar', label: 'Travessa do muro', x: 544, y: 346, r: 24 } },
  defender: { label: 'Corredor central', prep: { id: 'invasao-preparar', label: 'Vigiar a passagem leste', x: 681, y: 250, r: 24 } },
} satisfies Record<string, { label: string; prep: Spot }>;

export type InvasionRoute = keyof typeof INVASION_ROUTES;

export const INVASION_GROUPS = {
  mercado: {
    point: { id: 'invasao-grupo-mercado', label: 'Moradores do mercado', x: 170, y: 249, r: 23 },
    checkpoint: {
      evacuar: { id: 'invasao-baliza', label: 'Abertura na cerca do mercado', x: 354, y: 328, r: 22 },
      defender: { id: 'invasao-baliza', label: 'Esquina protegida do mercado', x: 366, y: 269, r: 22 },
    },
  },
  academia: {
    point: { id: 'invasao-grupo-academia', label: 'Grupo da Academia', x: 502, y: 231, r: 23 },
    checkpoint: {
      evacuar: { id: 'invasao-baliza', label: 'Beco do muro da Academia', x: 514, y: 329, r: 22 },
      defender: { id: 'invasao-baliza', label: 'Encontro na praça da Academia', x: 450, y: 279, r: 22 },
    },
  },
} satisfies Record<string, { point: Spot; checkpoint: Record<InvasionRoute, Spot> }>;

export type InvasionGroup = keyof typeof INVASION_GROUPS;
export const GROUP_IDS = Object.keys(INVASION_GROUPS) as InvasionGroup[];
export const INVASION_SHELTER = { id: 'invasao-abrigo', label: 'Posto de socorro', x: 421, y: 351, r: 23 };
