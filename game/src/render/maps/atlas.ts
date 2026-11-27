import type { MapId } from '../../data/characters';
import type { GameMap, Spot } from './types';

export interface MapGoal {
  map: MapId;
  x: number;
  y: number;
  lift: number;
  regional?: boolean;
}

type MarkerKind = 'player' | 'objective' | 'exit' | 'place' | 'mission';
interface Marker {
  id: string;
  name: string;
  kind: MarkerKind;
  x: number;
  y: number;
  to?: MapId;
}

interface AtlasInput {
  maps: Record<MapId, GameMap>;
  player: { map: MapId; x: number; y: number };
  objective: string;
  goal: MapGoal | null;
  missionSpots(map: MapId): Spot[];
  paint(g: CanvasRenderingContext2D, area: GameMap): void;
}

const AREAS: Record<MapId, string> = { rua: 'Rua da Academia', campo: 'Campo de Treino', sala: 'Sala de aula' };
const LEGEND: Record<MarkerKind, string> = {
  player: 'Você', objective: 'Objetivo', exit: 'Passagem', place: 'Local', mission: 'Missão',
};

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function markersFor(input: AtlasInput, area: GameMap): Marker[] {
  const { goal, player } = input;
  const mission = input.missionSpots(area.id);
  const exits: Marker[] = area.exits.map(({ rect, label, to }) =>
    ({ id: `saida-${to}`, name: label, kind: 'exit', to, x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }));
  if (area.id === 'rua') {
    const door = area.spots.find((spot) => spot.id === 'academia');
    if (door) exits.push({ id: door.id, name: door.label, kind: 'exit', to: 'sala', x: door.x, y: door.y });
  }
  const points: Marker[] = [
    ...exits,
    ...area.spots.filter(({ id }) => !exits.some((exit) => exit.id === id))
      .map(({ id, label, x, y }): Marker => ({ id, name: label, kind: 'place', x, y })),
    ...mission.map(({ id, label, x, y }): Marker => ({ id, name: label, kind: 'mission', x, y })),
  ];
  if (goal?.map === area.id && !goal.regional) {
    const nearby = points.findIndex((point) => Math.hypot(point.x - goal.x, point.y - goal.y) < 17);
    const target: Marker = { id: 'objetivo', name: 'Objetivo atual', kind: 'objective', x: goal.x, y: goal.y };
    if (nearby >= 0) points.splice(nearby, 1, { ...target, name: points[nearby].name, to: points[nearby].to });
    else points.unshift(target);
  }
  if (player.map === area.id) points.unshift({ id: 'jogador', name: 'Sua posição', kind: 'player', x: player.x, y: player.y });
  return points;
}

export function renderMapAtlas(root: HTMLElement, input: AtlasInput) {
  const nav = node('nav', 'atlas-areas');
  nav.setAttribute('aria-label', 'Áreas de Konoha');
  const content = node('section', 'atlas-area');
  const areaButtons = new Map<MapId, HTMLButtonElement>();
  const showArea = (id: MapId) => {
    const area = input.maps[id];
    for (const [mapId, button] of areaButtons) button.setAttribute('aria-pressed', String(mapId === id));
    const heading = node('header', 'atlas-heading');
    heading.append(node('h3', '', area.name), node('p', '', id === input.player.map ? 'Área atual' : area.region));
    const layout = node('div', 'atlas-layout');
    const mapColumn = node('div', 'atlas-art');
    const board = node('div', 'atlas-board');
    const canvas = node('canvas');
    canvas.width = 384;
    canvas.height = Math.round(canvas.width * area.h / area.w);
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', `Mapa ilustrado de ${area.name}`);
    const image = document.createElement('canvas');
    image.width = area.w; image.height = area.h;
    input.paint(image.getContext('2d')!, area);
    const g = canvas.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    g.drawImage(image, 0, 0, canvas.width, canvas.height);
    board.append(canvas);

    const detail = node('p', 'atlas-detail');
    detail.setAttribute('aria-live', 'polite');
    const panel = node('aside', 'atlas-panel');
    const goal = node('div', 'atlas-goal');
    goal.append(node('strong', '', 'Objetivo atual'), node('p', '', input.objective));
    if (input.goal && input.goal.map !== id) {
      const go = node('button', 'atlas-go', `Ver ${AREAS[input.goal.map]}`);
      go.type = 'button';
      go.onclick = () => { showArea(input.goal!.map); areaButtons.get(input.goal!.map)?.focus(); };
      goal.append(go);
    }
    const list = node('div', 'atlas-places');
    const controls: { marker: Marker; pin: HTMLButtonElement; row: HTMLButtonElement }[] = [];
    const activate = (marker: Marker) => {
      if (marker.to && marker.kind === 'exit') {
        showArea(marker.to);
        areaButtons.get(marker.to)?.focus();
        return;
      }
      for (const control of controls) {
        const active = control.marker.id === marker.id;
        control.pin.classList.toggle('is-active', active);
        control.row.setAttribute('aria-pressed', String(active));
      }
      detail.textContent = marker.kind === 'objective' ? input.objective : `${LEGEND[marker.kind]} · ${marker.name}`;
    };
    const marks = markersFor(input, area);
    for (const marker of marks) {
      const pin = node('button', `atlas-pin atlas-${marker.kind}`);
      pin.type = 'button';
      pin.style.left = `${Math.max(3, Math.min(97, marker.x / area.w * 100))}%`;
      pin.style.top = `${Math.max(5, Math.min(95, marker.y / area.h * 100))}%`;
      pin.tabIndex = -1;
      pin.title = marker.name;
      pin.setAttribute('aria-label', marker.name);
      pin.append(node('span'));
      pin.onclick = () => activate(marker);
      const row = node('button', 'atlas-point');
      row.type = 'button';
      if (marker.kind !== 'exit') row.setAttribute('aria-pressed', 'false');
      row.append(node('i', `atlas-key atlas-${marker.kind}`), node('span', '', marker.name));
      if (marker.kind === 'exit') row.append(node('b', '', '↗'));
      row.onclick = () => activate(marker);
      controls.push({ marker, pin, row });
      board.append(pin);
      list.append(row);
    }
    const legend = node('div', 'atlas-legend');
    for (const kind of Object.keys(LEGEND) as MarkerKind[]) {
      if (!marks.some((mark) => mark.kind === kind)) continue;
      const item = node('span');
      item.append(node('i', `atlas-key atlas-${kind}`), document.createTextNode(LEGEND[kind]));
      legend.append(item);
    }
    mapColumn.append(board, legend, detail);
    panel.append(goal, node('h4', '', 'Pontos no mapa'), list);
    layout.append(mapColumn, panel);
    content.replaceChildren(heading, layout);
  };
  for (const id of Object.keys(AREAS) as MapId[]) {
    const button = node('button', '', AREAS[id]);
    button.type = 'button';
    button.onclick = () => showArea(id);
    areaButtons.set(id, button);
    nav.append(button);
  }
  root.append(nav, content);
  showArea(input.player.map);
}

