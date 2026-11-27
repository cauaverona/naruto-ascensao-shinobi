// Controlador principal de telas, exploração e campanha.
import './styles.css';
import { CHARACTERS, CLASSMATES, GUY_TEAM, type MapId, type Period } from './data/characters';
import { accessorySet, bandPositionOf, BAND_POSITIONS, OUTFITS, SCARVES } from './data/appearance';
import { origin, clanByName } from './data/clans';
import { ACADEMY_STATS, combatPower, maxVitals, type Stat } from './data/stats';
import { LESSONS, PERIODS, WEEKDAYS, EXAM_DAY, EXAM_MINIMUM, graduationGrade, ITEMS, QUESTIONS } from './data/academy';
import { MAKI_SPOT, SEAL_CLUES, SEAL_DESTINATIONS } from './data/genin-assignments';
import { MENTOR_LESSON, SUPPORT, type Tactic } from './data/squad';
import { HYOTON, JUTSUS, type Jutsu } from './data/jutsus';
import { TRAINING, trainingFor, type TrainingId } from './data/training';
import { awakenHyoton, HYOTON_TRIAL_COST, HYOTON_TRIAL_SCORE, yukiTrial } from './systems/heritage';
import { newCampaign, addLog, GAME_VERSION, LOOK_DEFAULTS, type Campaign, type Profile, type Settings } from './state/campaign';
import { deleteSlot, importSlot, readSlot, writeSlot, LAST_SLOT_KEY, MAX_SAVE_BYTES, SLOT_COUNT } from './state/save';
import { restoreAll, applyTraining, learn, level, clampVitals, practice, statCost, train } from './systems/progression';
import { guyPreference, requestGuyTeam } from './systems/team-guy';
import { bond, bondLabel } from './systems/relations';
import { academyMorning, dueEvents, extraTrainingLeft, resolveEvent, retakeDay, sleep, startAfternoon, spendAction, spendExtraTraining } from './systems/world';
import {
  acceptMission, beginGenin, checkPatrolPost, collectSupply, combatStats, deferMission, equippedGear, finishGenin,
  geninStage, GEAR, missionDeferred, MISSION_OFFERS, nextPatrolPost, pendingMission, recordSealClue, reportPatrol, rescueTora, resolveBells, sealCase, sealClueCount,
  senseiId, setToraPlan, settlePatrolDuel, solveSealCase, SUPPLIES, teamMembers, toraRoute, toraTactic, TORA_TRAILS,
  turnInSupplies, turnInTora, type GearId, type GeninStage, type MissionOffer,
} from './systems/genin';
import { talk } from './content/dialogue';
import { KunaiGame, StrikeGame, ChakraGame, SealsGame, ObservationGame, JutsuPracticeGame, grade, type Minigame } from './scenes/minigames';
import { ToraGame } from './scenes/tora';
import { drawAssignmentProp, drawSupply, drawTora, drawTrack } from './render/mission-art';
import { BattleScene } from './scenes/battle';
import { makeFighter, startBattle } from './combat/engine';
import { randomSeed, Rng } from './core/rng';
import { drawActor, portrait, drawDialoguePortrait, idlePose, spritesReady, clothes, skinSet, hairSet, trimSet, bandSet, CUTS, FEMININE_CUT, ACCESSORIES, MARKS, type Actor, type Dir } from './render/sprites';
import { px } from './render/gfx';
import { audio } from './audio';
import { renderMapAtlas, type MapGoal } from './render/maps/atlas';
import { blocked, type GameMap } from './render/maps/types';
import { buildStreet } from './render/maps/street';
import { buildField } from './render/maps/field';
import { buildClassroom } from './render/maps/classroom';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const calm = matchMedia('(prefers-reduced-motion: reduce)');
const maps: Record<MapId, GameMap> = { rua: buildStreet(), campo: buildField(), sala: buildClassroom() };

// ——— Estado de sessão ———
let c: Campaign | null = null;
let slot = 0, snapshot: string | null = null, blockedWrites = false, dirty = false, savedAt = 0;
let busy = false, clock = 0, last = 0, phase = 0, walkFrame = -1, gestureUntil = 0;
let camera = { x: 0, y: 0 }, zoomCloser = innerWidth < 640 && innerHeight > innerWidth;
let lessonMode = false;
const held = new Set<string>();

interface Npc { id: string; actor: Actor; name: string; x: number; y: number; dir: Dir; frame: number; route: [number, number][]; idx: number; rest: number; dist: number }
let npcs: Npc[] = [];
let contact: { kind: 'npc'; npc: Npc } | { kind: 'spot'; id: string; label: string } | null = null;

// ——— Telas ———
type Screen = 'title' | 'slots' | 'create' | 'game';
let screen: Screen = 'title';
function show(id: Screen) {
  screen = id;
  for (const s of ['title', 'slots', 'create', 'game']) $(`s-${s}`).hidden = s !== id;
  held.clear();
  size();
}
document.querySelectorAll<HTMLButtonElement>('[data-back]').forEach((b) => (b.onclick = () => (b.dataset.back === 'title' ? openTitle() : openSlots())));

function safeRead(i: number) { try { return readSlot(localStorage, i); } catch { return null; } }
function lastPlayedSlot() {
  try {
    const value = Number(localStorage.getItem(LAST_SLOT_KEY) ?? -1);
    return Number.isInteger(value) && value >= 0 && value < SLOT_COUNT ? value : -1;
  } catch { return -1; }
}

// Menu principal navegável por teclado, mouse e toque.
let menuIndex = 0;
function menuButtons(box: HTMLElement) { return [...box.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]; }
function setCurrent(box: HTMLElement, i: number) {
  const list = menuButtons(box);
  if (!list.length) return;
  menuIndex = (i + list.length) % list.length;
  list.forEach((b, k) => b.setAttribute('aria-current', String(k === menuIndex)));
}

function openTitle() {
  show('title');
  c = null;
  const lastSlot = lastPlayedSlot();
  const info = lastSlot >= 0 ? safeRead(lastSlot) : null;
  const box = $('mainmenu');
  box.replaceChildren();
  const add = (label: string, fn: () => void) => { const b = document.createElement('button'); b.textContent = label; b.onclick = fn; b.onmouseenter = () => setCurrent(box, menuButtons(box).indexOf(b)); box.append(b); };
  if (info?.kind === 'ok') add('Continuar', () => {
    const current = safeRead(lastSlot);
    if (current?.kind === 'ok') startGame(lastSlot, current.campaign, current.raw);
    else openSlots('A última jornada não está mais disponível.');
  });
  add('Jogar', () => openSlots());
  add(`Som: ${audio.enabled ? 'ligado' : 'desligado'}`, () => { audio.toggleAll(); openTitle(); });
  add('Controles', () => toastTitle('Andar: WASD ou setas · Interagir: E ou Enter · Menu: Esc · No celular, use o direcional e o botão A.'));
  setCurrent(box, 0);
}
function toastTitle(text: string) {
  let p = $('s-title').querySelector<HTMLParagraphElement>('.titletip');
  if (!p) { p = document.createElement('p'); p.className = 'tagline titletip'; p.style.marginTop = '18px'; $('mainmenu').after(p); }
  p.textContent = text;
}

const deleteDialog = $<HTMLDialogElement>('delete-save');
let pendingDelete: { index: number; raw: string } | null = null;

deleteDialog.addEventListener('close', () => {
  const pending = pendingDelete;
  pendingDelete = null;
  if (deleteDialog.returnValue !== 'delete' || !pending) return;
  const { index, raw } = pending;
  const result = deleteSlot(localStorage, index, raw);
  const message = result.ok ? `Save da jornada ${index + 1} excluído.`
    : result.reason === 'conflict' ? 'A jornada mudou em outra aba. Confira antes de tentar excluir de novo.'
    : 'O navegador não conseguiu excluir o save.';
  openSlots(message, index);
});

const saveFile = $<HTMLInputElement>('save-file');
let importTarget: number | null = null;
saveFile.onchange = async () => {
  const index = importTarget;
  const file = saveFile.files?.[0];
  importTarget = null;
  saveFile.value = '';
  if (index === null || !file) return;
  let message = 'O arquivo escolhido não contém uma jornada compatível.';
  if (file.size > MAX_SAVE_BYTES) message = 'O arquivo excede o tamanho máximo de 1 MB.';
  else {
    try {
      const result = importSlot(localStorage, index, await file.text());
      if (result.ok) message = `Save importado para a jornada ${index + 1}.`;
      else if (result.reason === 'conflict') message = 'A jornada foi preenchida. Escolha outro slot vazio.';
      else if (result.reason === 'storage') message = 'O navegador não conseguiu guardar o save importado.';
    } catch { message = 'Não foi possível ler o arquivo escolhido.'; }
  }
  if (screen === 'slots') openSlots(message, index);
};

function exportSave(campaign: Campaign, index: number) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(campaign)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `ascensao-jornada-${index + 1}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

function openSlots(message = '', focusSlot = 0) {
  show('slots');
  c = null;
  $('slot-status').textContent = message;
  const box = $('slots');
  box.replaceChildren();
  for (let i = 0; i < SLOT_COUNT; i++) {
    const info = safeRead(i);
    const card = document.createElement('article');
    card.className = 'slot-card';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'slot';
    b.dataset.slot = String(i);
    const face = document.createElement('canvas');
    face.width = 36; face.height = 39;
    b.append(face);
    const add = (tag: string, text: string) => { const e = document.createElement(tag); e.textContent = text; b.append(e); };
    add('small', `Jornada ${i + 1}`);
    if (!info || info.kind === 'broken') {
      add('strong', 'Indisponível'); add('span', info?.kind === 'broken' ? `Save ilegível: ${info.error}` : 'Armazenamento bloqueado');
      b.disabled = true;
    } else if (info.kind === 'empty') {
      b.classList.add('empty'); add('strong', 'Vazio'); add('span', 'Criar personagem');
      b.onclick = () => openCreate(i);
    } else {
      const s = info.campaign;
      const fg = face.getContext('2d')!; fg.imageSmoothingEnabled = false;
      fg.translate(-2, -6); drawActor(fg, 20, 44, { role: 'player', look: { ...s.profile }, bandana: s.rank !== 'Estudante da Academia' }, 'down', -1);
      add('strong', s.profile.name);
      add('span', `${s.rank} · Dia ${s.day} · ${PERIODS[s.period]}`);
      add('span', `${s.profile.clan} · ${Math.max(1, Math.round(s.playtime / 60))} min de jogo`);
      b.onclick = () => {
        const current = safeRead(i);
        if (current?.kind === 'ok') startGame(i, current.campaign, current.raw);
        else openSlots('A jornada mudou. Confira os saves disponíveis.', i);
      };
    }
    card.append(b);
    const actions = el('div', 'slot-actions');
    if (info?.kind === 'empty') {
      const upload = el('button', 'ghost slot-import', 'Importar save') as HTMLButtonElement;
      upload.type = 'button';
      upload.setAttribute('aria-label', `Importar save na jornada ${i + 1}`);
      upload.onclick = () => { importTarget = i; saveFile.click(); };
      actions.append(upload);
    } else if (info?.kind === 'ok') {
      const download = el('button', 'ghost slot-export', 'Exportar save') as HTMLButtonElement;
      download.type = 'button';
      download.setAttribute('aria-label', `Exportar save da jornada ${i + 1}`);
      download.onclick = () => {
        const current = safeRead(i);
        if (current?.kind === 'ok') exportSave(current.campaign, i);
        else openSlots('A jornada mudou. Confira os saves disponíveis.', i);
      };
      actions.append(download);
    }
    if (info && info.raw !== null) {
      const raw = info.raw;
      const del = document.createElement('button');
      del.type = 'button'; del.className = 'ghost slot-delete'; del.textContent = 'Excluir save';
      del.setAttribute('aria-label', `Excluir save da jornada ${i + 1}`);
      del.onclick = () => {
        pendingDelete = { index: i, raw };
        $('delete-target').textContent = `Jornada ${i + 1} · ${info.kind === 'ok' ? info.campaign.profile.name : 'Save ilegível'}`;
        deleteDialog.returnValue = 'cancel';
        deleteDialog.showModal();
      };
      actions.append(del);
    }
    if (actions.childElementCount) card.append(actions);
    box.append(card);
  }
  for (const b of menuButtons(box)) {
    b.onmouseenter = b.onfocus = () => setCurrent(box, menuButtons(box).indexOf(b));
  }
  (box.querySelector<HTMLButtonElement>(`[data-slot="${focusSlot}"]:not(:disabled)`) ?? menuButtons(box)[0] ?? $('s-slots').querySelector('button'))?.focus();
}

// ——— Criação de personagem ———
type Key = Exclude<keyof Profile, 'bandAtWaist' | 'bandPosition'> | 'difficulty' | 'fidelity';
interface Opt { key: Key; label: string; values: readonly string[]; colors?: Record<string, string | readonly string[]>; describe?: (v: string) => string }
const palette = (key: Key, label: string, colors: NonNullable<Opt['colors']>): Opt => ({ key, label, colors, values: Object.keys(colors) });
const LABELS: Record<string, string> = { facil: 'Fácil', normal: 'Normal', dificil: 'Difícil', fiel: 'Fiel ao anime', equilibrado: 'Equilibrado', alternativo: 'Mundo alternativo' };
const CREATE_TABS: { id: string; label: string; opts: Opt[] }[] = [
  { id: 'body', label: 'Corpo', opts: [
    { key: 'sex', label: 'Sexo', values: ['Masculino', 'Feminino'] },
    palette('skin', 'Tom de pele', skinSet),
    { key: 'mark', label: 'Marca no rosto', values: MARKS },
  ] },
  { id: 'hair', label: 'Cabelo', opts: [
    { key: 'cut', label: 'Penteado', values: CUTS },
    palette('hair', 'Cor do cabelo', hairSet),
  ] },
  { id: 'outfit', label: 'Roupa', opts: [
    { key: 'outfit', label: 'Modelo', values: OUTFITS },
    palette('coat', 'Cor do traje', clothes),
    { key: 'scarf', label: 'Cachecol', values: SCARVES },
    { ...palette('trim', 'Cor do tecido', trimSet), describe: () => 'Colore o cachecol e os detalhes de tecido do traje.' },
  ] },
  { id: 'accessory', label: 'Acessórios', opts: [
    { key: 'accessory', label: 'Acessório', values: ACCESSORIES },
    { ...palette('accessoryTone', 'Acabamento', accessorySet), describe: () => 'Muda a cor dos óculos, da máscara, do brinco e da presilha.' },
    { ...palette('band', 'Cor da faixa', bandSet), describe: () => 'Colore a faixa opcional e a bandana que você recebe na graduação.' },
  ] },
  { id: 'world', label: 'Mundo', opts: [
    { key: 'difficulty', label: 'Dificuldade', values: ['facil', 'normal', 'dificil'], describe: (v) => ({ facil: 'Adversários mais fracos.', normal: 'O equilíbrio pensado para a campanha.', dificil: 'Adversários batem mais forte.' }[v] ?? '') },
    { key: 'fidelity', label: 'História', values: ['fiel', 'equilibrado', 'alternativo'], describe: (v) => ({ fiel: 'Os acontecimentos seguem o anime, a menos que você mude o rumo de propósito.', equilibrado: 'O anime é a referência, mas o mundo reage às chances e às suas escolhas.', alternativo: 'O mundo se afasta do roteiro com facilidade.' }[v] ?? '') },
  ] },
];
const DEFAULTS: Record<Key, string> = {
  name: '', sex: 'Masculino', skin: 'Dourada', hair: 'Preto', cut: 'Curto', coat: 'Índigo', difficulty: 'normal', fidelity: 'equilibrado',
  ...LOOK_DEFAULTS,
  // O destino do personagem é sorteado quando a jornada começa.
  village: 'Sortear', clan: 'Sortear', element: 'Sortear', talent: 'Sortear', attribute: 'Sortear', past: 'Sortear',
};
let form: Record<Key, string> = { ...DEFAULTS };
function availableChoices(option: Opt): readonly string[] {
  return option.key === 'cut' && form.sex === 'Feminino' ? [...option.values, FEMININE_CUT] : option.values;
}

function setCreateChoice(key: Key, value: string) {
  form[key] = value;
  if (key === 'sex' && value !== 'Feminino' && form.cut === FEMININE_CUT) form.cut = DEFAULTS.cut;
}
let createTab = 0, createRow = 0, previewDir = 0;
let previewWalking = false, previewDirty = true;
const DESTINY_NOTE = 'Seu clã, aldeia, afinidade, talento e histórico são sorteados quando a jornada começa. Só a aparência é escolha sua.';
const PREVIEW_DIRS: Dir[] = ['down', 'right', 'up', 'left'];
const PREVIEW_LABELS = ['Frente', 'Perfil direito', 'Costas', 'Perfil esquerdo'];

function readForm(): { p: Profile; s: Settings } {
  const { difficulty, fidelity, ...rest } = form;
  return { p: { ...(rest as unknown as Profile), name: $<HTMLInputElement>('f_name').value.trim() }, s: { difficulty: difficulty as Settings['difficulty'], fidelity: fidelity as Settings['fidelity'] } };
}
function selectCreateTab(i: number, focus = false) {
  createTab = i;
  createRow = 0;
  renderCreate();
  if (focus) $('ctabs').querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
}

function renderCreate() {
  const tabs = $('ctabs');
  tabs.replaceChildren(...CREATE_TABS.map((t, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.role = 'tab'; b.textContent = t.label; b.id = `look-tab-${t.id}`;
    b.setAttribute('aria-selected', String(i === createTab));
    b.setAttribute('aria-controls', 'rows');
    b.tabIndex = i === createTab ? 0 : -1;
    b.onclick = () => selectCreateTab(i, true);
    return b;
  }));
  const rows = $('rows');
  rows.replaceChildren();
  const tab = CREATE_TABS[createTab];
  rows.setAttribute('role', 'tabpanel');
  rows.setAttribute('aria-labelledby', `look-tab-${tab.id}`);
  tab.opts.forEach((o, i) => {
    const r = document.createElement('fieldset');
    r.className = 'opt';
    const name = document.createElement('legend');
    name.textContent = o.label;
    const val = document.createElement('b'); val.className = 'opt-value';
    name.append(val);
    const group = document.createElement('div');
    group.className = o.colors ? 'swatches' : 'look-choices';
    for (const value of availableChoices(o)) {
      const b = document.createElement('button');
      const label = LABELS[value] ?? value;
      b.type = 'button';
      b.dataset.choice = value;
      if (o.colors) {
        b.className = 'swatch';
        b.title = label;
        b.setAttribute('aria-label', label);
        const colors = o.colors[value];
        b.style.setProperty('--swatch', typeof colors === 'string' ? colors : `linear-gradient(135deg, ${colors[2]} 0 28%, ${colors[1]} 29% 68%, ${colors[0]} 69%)`);
      } else {
        b.className = 'look-choice';
        b.textContent = label;
      }
      b.onclick = () => { createRow = i; setCreateChoice(o.key, value); updateCreate(); };
      group.append(b);
    }
    r.addEventListener('focusin', () => { createRow = i; updateCreate(); });
    r.append(name, group);
    rows.append(r);
  });
  const d = document.createElement('p'); d.className = 'desc'; d.id = 'optDesc';
  rows.append(d);
  updateCreate();
  $('origin').textContent = DESTINY_NOTE;
}
function updateCreate() {
  const opts = CREATE_TABS[createTab].opts;
  $('rows').querySelectorAll('.opt').forEach((r, i) => {
    const opt = opts[i], value = form[opt.key];
    r.setAttribute('data-current', String(i === createRow));
    r.querySelector('.opt-value')!.textContent = LABELS[value] ?? value;
    r.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.choice === value)));
  });
  const o = opts[createRow];
  $('optDesc').textContent = o?.describe?.(form[o.key]) ?? '';
  previewDirty = true;
}
function cycleOpt(dirn: -1 | 1) {
  const o = CREATE_TABS[createTab].opts[createRow];
  const values = availableChoices(o);
  const i = values.indexOf(form[o.key]);
  setCreateChoice(o.key, values[(i + dirn + values.length) % values.length]);
  updateCreate();
  $('rows').querySelectorAll('.opt')[createRow]?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
}
function drawPreview() {
  if (!previewWalking && !previewDirty) return;
  previewDirty = false;
  const g2 = $<HTMLCanvasElement>('preview').getContext('2d')!;
  g2.clearRect(0, 0, 96, 104);
  g2.imageSmoothingEnabled = false;
  const dir = PREVIEW_DIRS[previewDir % 4];
  g2.save(); g2.scale(2, 2); drawActor(g2, 24, 47, { role: 'player', look: readForm().p }, dir, previewWalking ? Math.floor(clock * 6) % 4 : -1); g2.restore();
}
function openCreate(i: number) {
  slot = i;
  form = { ...DEFAULTS };
  $<HTMLInputElement>('f_name').value = '';
  createTab = 0; createRow = 0;
  previewWalking = false;
  $('preview-motion').setAttribute('aria-pressed', 'false');
  rotatePreview(-previewDir);
  show('create');
  renderCreate();
  $('f_name').focus();
}
function rotatePreview(step: number) {
  previewDir = (previewDir + step + 4) % 4;
  $('preview-facing').textContent = PREVIEW_LABELS[previewDir];
  previewDirty = true;
}
$('rotL').onclick = () => rotatePreview(-1);
$('rotR').onclick = () => rotatePreview(1);
$('preview-motion').onclick = () => {
  previewWalking = !previewWalking;
  $('preview-motion').setAttribute('aria-pressed', String(previewWalking));
  previewDirty = true;
};
$('f_name').oninput = () => ($('origin').textContent = DESTINY_NOTE);
$('randomize').onclick = () => {
  for (const t of CREATE_TABS) for (const o of t.opts) if (t.id !== 'world' && o.key !== 'sex') {
    const values = availableChoices(o);
    setCreateChoice(o.key, values[Math.floor(Math.random() * values.length)]);
  }
  updateCreate();
};
$('form').onsubmit = (e) => {
  e.preventDefault();
  const { p, s } = readForm();
  if (!p.name) { $('f_name').focus(); $<HTMLInputElement>('f_name').placeholder = 'Seu shinobi precisa de um nome'; return; }
  const current = safeRead(slot);
  if (current?.kind !== 'empty') { openSlots('Esta jornada não está mais vazia ou acessível.', slot); return; }
  startGame(slot, newCampaign(p, s, randomSeed()), null);
};

// ——— Salvamento ———
function save(manual = false): boolean {
  if (!c || blockedWrites) return false;
  const r = writeSlot(localStorage, slot, c, snapshot);
  if (r.ok) { snapshot = r.raw; dirty = false; if (manual) toast(`Campanha salva no slot ${slot + 1}.`); return true; }
  if (r.reason === 'conflict') { blockedWrites = true; toast('Outra aba alterou esta campanha. Volte às campanhas para recarregar.'); }
  else toast('O navegador não conseguiu salvar a campanha.');
  return false;
}
window.addEventListener('pagehide', () => { if (dirty) save(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && dirty) save(); });

// ——— Início da campanha ———
function startGame(i: number, camp: Campaign, raw: string | null) {
  slot = i; c = camp; snapshot = raw; blockedWrites = false; busy = false; lessonMode = false;
  try { localStorage.setItem(LAST_SLOT_KEY, String(i)); } catch { /* sem armazenamento */ }
  show('game');
  shownMap = null;
  // Aulas e minijogos começam do mesmo checkpoint após fechar o navegador.
  if (c.map === 'sala') enterMap('rua', 450, 204, 'down', false);
  else enterMap(c.map, c.x, c.y, c.dir, false);
  if (c.rank === 'Genin' && !geninStage(c)) {
    for (const event of dueEvents(c, 'dawn').filter((e) => e.id === 'formacao-equipes')) resolveEvent(c, event);
    placeNpcs();
  }
  save();
  refresh();
  if (c.day === 1 && c.quest === 'matricula-ficha' && c.log.length <= 1) {
    const cl = clanByName(c.profile.clan);
    void say(null, [origin(c.profile), `Clã: ${c.profile.clan}. ${cl.blurb}`, `Talento natural: ${c.profile.talent}.`, `Manhã do primeiro dia. ${c.profile.name} sai de casa com a ficha da Academia em mente.`, 'A ficha de matrícula fica no quadro de avisos da Rua da Academia, perto da escadaria.']);
  }
}

// ——— NPCs por mapa e período ———
const DAY1: Record<string, { x: number; y: number; dir: Dir; route?: [number, number][] }> = {
  iruka: { x: 458, y: 222, dir: 'down' },
  naruto: { x: 356, y: 230, dir: 'down', route: [[379, 230], [379, 217], [356, 217], [356, 230]] },
  sasuke: { x: 542, y: 219, dir: 'down', route: [[558, 219], [542, 219]] },
  sakura: { x: 506, y: 256, dir: 'down', route: [[506, 243], [521, 243], [521, 256], [506, 256]] },
  emi: { x: 315, y: 258, dir: 'right', route: [[379, 258], [379, 270], [315, 270], [315, 258]] },
  gen: { x: 190, y: 215, dir: 'down' },
};

function actorFor(id: string): Actor {
  const d = CHARACTERS[id];
  const grad = String(c?.flags[`exame:${id}`] ?? '').startsWith('aprovado');
  return { role: d.role, look: d.look, spriteId: id, bandana: grad || d.rank === 'Jōnin' || d.rank === 'Genin' };
}

function placeNpcs() {
  if (!c) return;
  npcs = [];
  const stage = geninStage(c);
  const rally = stage ? mentorLocation(stage) : null;
  const team = stage ? teamMembers(c) : [];
  const deferred = missionDeferred(c);
  for (const d of Object.values(CHARACTERS)) {
    if (c.npcs[d.id]?.alive === false) continue;
    let spot: { x: number; y: number; dir?: Dir; route?: [number, number][]; map?: MapId } | undefined;
    if (c.day === 1 && c.period === 0 && DAY1[d.id]) spot = { ...DAY1[d.id], map: 'rua' };
    else spot = d.schedule[c.period as Period];
    if (stage && d.id === senseiId(c)) spot = rally ?? { map: 'campo', x: 318, y: 266, dir: 'down' };
    const member = team.indexOf(d.id);
    if (member >= 0) {
      if (rally && !deferred) spot = { ...rally, x: rally.x + (member === 0 ? -30 : 30), y: rally.y + 12 };
      if (stage === 'suprimentos' && !c.flags[SUPPLIES[member].id]) {
        const supply = SUPPLIES[member];
        spot = { map: 'campo', x: supply.x + 23, y: supply.y - 3, dir: 'left' };
      }
      if (stage === 'busca') spot = { map: 'campo', x: 352 + member * 30, y: 287, dir: 'down' };
    }
    if (stage === 'patrulha-rota' && !nextPatrolPost(c) && d.id === 'maki') {
      spot = { map: 'campo', ...MAKI_SPOT, dir: 'down' };
    }
    if (stage && d.id === 'iruka') spot = { map: 'rua', x: 458, y: 222, dir: 'down' };
    if (!spot || (spot.map ?? 'rua') !== c.map) continue;
    if (c.map === 'sala' && !lessonMode) continue;
    // Naruto só aparece no Ichiraku à noite depois da pegadinha se não estiver limpando o monumento.
    npcs.push({ id: d.id, actor: actorFor(d.id), name: d.name, x: spot.x, y: spot.y, dir: spot.dir ?? 'down', frame: -1, route: spot.route ?? [], idx: 0, rest: 1.5, dist: 0 });
  }
  if (stage === 'ondas' && c.map === 'rua') {
    npcs.push({ id: 'tazuna', name: 'Tazuna', actor: TAZUNA, ...TAZUNA_SPOT, dir: 'down', frame: -1, route: [], idx: 0, rest: 0, dist: 0 });
  }
}

const GENIN_OBJECTIVES: Record<GeninStage, string> = {
  encontro: 'Encontre seu sensei no Campo de Treino',
  sinos: 'Fale com seu sensei para começar o teste dos sinos',
  'suprimentos-ordem': 'Missão disponível · Suprimentos do campo',
  suprimentos: 'Missão D · Confira os suprimentos com a equipe no Campo de Treino',
  entrega: 'Missão D · Entregue os suprimentos ao sensei na Rua da Academia',
  'tora-ordem': 'Missão disponível · Captura de Tora',
  busca: 'Missão D · Examine os rastros de Tora no Campo de Treino',
  retorno: 'Missão D · Leve Tora de volta ao sensei',
  'selo-ordem': 'Missão disponível · O lacre trocado',
  'selo-pistas': 'Missão D · Examine as pistas na Rua da Academia',
  'patrulha-ordem': 'Missão disponível · A ronda das lanternas',
  'patrulha-rota': 'Missão D · Confira os pontos de ronda no Campo de Treino',
  'patrulha-relato': 'Missão D · Relate a ronda ao sensei na Rua da Academia',
  ondas: 'Fale com Tazuna na Rua da Academia',
  concluida: 'Vida Genin concluída · Continue treinando e explorando Konoha',
};

const TAZUNA_SPOT = { x: 649, y: 212 };
const TAZUNA: Actor = {
  role: 'player', spriteId: 'tazuna', look: { skin: 'Bronzeada', hair: 'Prateado', cut: 'Curto', coat: 'Azul-claro',
    outfit: 'Túnica cruzada', scarf: 'Lenço curto', trim: 'Preto', accessory: 'Óculos redondos', accessoryTone: 'Bronze' },
};

function toraSpot(campaign: Campaign) {
  const { x, y } = toraRoute(campaign).shelter;
  return { id: 'tora', x, y, r: 22, label: 'Tora' };
}
function mentorLocation(stage: GeninStage): (Pick<Npc, 'x' | 'y' | 'dir'> & { map: MapId }) | null {
  if (stage === 'encontro' || stage === 'sinos' || stage === 'suprimentos-ordem') return { map: 'campo', x: 318, y: 266, dir: 'down' };
  if (stage === 'entrega' || stage === 'tora-ordem' || stage === 'retorno' || stage === 'ondas'
    || stage === 'selo-ordem' || stage === 'selo-pistas' || stage === 'patrulha-ordem' || stage === 'patrulha-relato') return { map: 'rua', x: 630, y: 224, dir: 'down' };
  return null;
}

function missionSpots(area = c?.map) {
  if (!c) return [];
  const stage = geninStage(c);
  if (area === 'rua' && stage === 'selo-pistas') return [...SEAL_CLUES];
  if (area !== 'campo') return [];
  if (stage === 'patrulha-rota') {
    const post = nextPatrolPost(c);
    return post ? [post] : [];
  }
  switch (stage) {
    case 'suprimentos': return SUPPLIES.filter(({ id }) => !c!.flags[id]).map((spot) => ({ ...spot, r: 18 }));
    case 'busca': return c.flags['tora-rastro'] ? [toraSpot(c)] : TORA_TRAILS.map(({ id, x, y, r, label }) => ({ id, x, y, r, label }));
    default: return [];
  }
}
function worldSpots() { return [...map().spots, ...missionSpots()]; }

const MISSION_BRIEFINGS: Record<MissionOffer, string[]> = {
  'suprimentos-ordem': ['Tem três caixas no Campo. Confirme o material com cada colega e recolha a que sobrar.', 'Depois, tragam o material de volta para a Rua da Academia.'],
  'tora-ordem': ['A cliente perdeu o gato Tora. Há rastros pelo Campo de Treino.', 'Examine as pistas e escolha quem vai ajudar na captura.'],
  'selo-ordem': ['A chuva apagou a etiqueta de uma encomenda. Ache o livro de entregas, o fragmento de cera e o canhoto na rua.', 'Volte quando descobrir o destino.'],
  'patrulha-ordem': ['Siga do lado leste do Campo de Treino até a marca da ronda ao sul.', 'Confira os dois postos. Maki, da guarda de Konoha, espera no fim do percurso.'],
};

async function offerMission(camp: Campaign, offer: MissionOffer, who: { name: string; actor: Actor }) {
  const { name } = MISSION_OFFERS[offer];
  const decision = await say(who, [`Missão Rank D · ${name}`, ...MISSION_BRIEFINGS[offer]], [
    { id: 'aceitar', label: 'Aceitar agora' },
    { id: 'depois', label: 'Treinar primeiro' },
  ]);
  if (decision === 'depois') {
    deferMission(camp, offer);
    return;
  }
  if (decision !== 'aceitar') return;
  const ally = offer === 'selo-ordem' ? await chooseSupport(camp, 'Quem vai ajudar a cruzar as pistas da encomenda?', 'Investigar por conta própria') : '';
  acceptMission(camp, offer, ally);
}

async function talkToTazuna(who: { name: string; actor: Actor }) {
  const camp = c;
  if (!camp || geninStage(camp) !== 'ondas') return;
  const decision = await say(who, [
    'Sou Tazuna. Estou construindo uma ponte no País das Ondas e preciso de escolta até lá.',
    'No papel é uma missão de rank C. Se quiserem conferir o percurso, esta é a hora.',
  ], [
    { id: 'investigar', label: 'Pedir detalhes sobre o risco' },
    { id: 'aceitar', label: 'Aceitar a escolta' },
    { id: 'depois', label: 'Conversar mais tarde' },
  ]);
  if ((decision === 'investigar' || decision === 'aceitar') && finishGenin(camp, decision)) {
    placeNpcs();
    save();
    await say(who, [decision === 'investigar' ? 'Tudo bem. Conto mais sobre o caminho antes da partida.' : 'Tenho muita coisa para terminar na ponte. Conto com sua equipe.',
      'Vida Genin concluída. Sua decisão ficou registrada no diário.']);
  }
}

async function talkToSensei(who: { name: string; actor: Actor }) {
  const active = c;
  if (!active) return;
  const offer = pendingMission(active);
  if (offer) {
    await offerMission(active, offer, who);
    placeNpcs();
    return;
  }
  const team = teamMembers(active);
  switch (geninStage(active)) {
    case 'encontro': {
      const group = [active.profile.name, ...team.map((id) => CHARACTERS[id].name)].join(', ');
      await say(who, [`Eu sou ${who.name}, seu sensei. Nossa equipe: ${group}.`,
        MENTOR_LESSON[senseiId(active)],
        'Pegue estas luvas. Você pode equipá-las em Itens. Antes da primeira missão, quero ver vocês trabalhando juntos.']);
      beginGenin(active);
      break;
    }
    case 'sinos': {
      const ready = await say(who, ['Há dois sinos. Escolha um apoio e faça pelo menos duas aproximações limpas.'],
        [{ id: 'pronto', label: 'Começar o teste' }, { id: 'depois', label: 'Preparar primeiro' }]);
      if (ready !== 'pronto') return;
      const ally = await chooseSupport(active, 'Quem vai abrir espaço para você?');
      const help = SUPPORT[ally];
      if (help) await say({ name: CHARACTERS[ally].name, actor: actorFor(ally) }, [
        help.tactic === 'bloqueio' ? 'Vou fechar a lateral. Você vai ter mais tempo para passar.' :
          help.tactic === 'rastreio' ? 'Vou observar o centro da guarda e marcar a abertura para você.' :
            'Na hora em que o sensei olhar para mim, vá pelos fundos.',
      ]);
      const score = await runMini(new StrikeGame(5, 'Teste dos sinos', 'Avance quando o marcador entrar na faixa.', 'bell', help?.tactic));
      const choice = await say(who, ['A distração funcionou. Um dos colegas está cercado, e os sinos estão ao seu alcance.'],
        [{ id: 'ajudar', label: 'Recuar e ajudar a equipe' }, { id: 'sozinho', label: 'Tentar pegar os sinos sozinho' }]);
      if (!resolveBells(active, score, choice === 'ajudar')) {
        await say(who, [choice !== 'ajudar' ? 'Volte para a formação. O teste termina quando a equipe trabalha junta.' :
          'Vocês voltaram juntos, mas ainda abriram a guarda. Esperem a marca dourada e tentem de novo.']);
        return;
      }
      await say(who, [score >= 0.6 ? 'Vocês entraram no tempo certo e voltaram juntos. Passaram.' : 'A entrada foi apertada. Vocês se reorganizaram a tempo e estão aprovados.',
        'Temos um primeiro trabalho de rank D. Treinem ou descansem. Quando estiverem prontos, falem comigo para conhecer a missão.']);
      break;
    }
    case 'entrega':
      if (turnInSupplies(active)) await say(who, ['Suprimentos conferidos. Aqui estão os 80 ryō da missão.',
        'Há outro trabalho reservado. Voltem quando quiserem receber a próxima missão.']);
      break;
    case 'retorno':
      if (turnInTora(active)) await say(who, ['Tora voltou para casa. A cliente deixou 110 ryō pela missão.',
        'Uma encomenda ficou sem destino. Fale comigo de novo quando quiser examinar o caso.']);
      break;
    case 'selo-pistas': {
      const count = sealClueCount(active);
      if (count < SEAL_CLUES.length) {
        await say(who, [`Você conferiu ${count} de ${SEAL_CLUES.length} pistas. Compare o livro, a cera e o recibo antes de indicar um destino.`]);
        return;
      }
      const destination = await say(who, ['Temos o livro, o fragmento e o recibo. Para onde vai a encomenda?'],
        [...SEAL_DESTINATIONS, { id: 'reler', label: 'Reler as pistas' }]);
      if (destination === 'reler') {
        await say(null, [...sealCase(active).clues]);
        return;
      }
      if (solveSealCase(active, destination)) {
        const name = SEAL_DESTINATIONS.find(({ id }) => id === destination)?.label;
        await say(who, [`A encomenda chegou a ${name}. Vocês ganharam 120 ryō. Um dos postos do campo também pediu nossa ajuda.`]);
      } else {
        await say(who, ['Esse destino não combina com o recibo. Confira a descrição da carga e a marca na cera.']);
        const ally = String(active.flags['selo-apoio'] ?? '');
        const tactic = SUPPORT[ally]?.tactic;
        if (tactic && teamMembers(active).includes(ally)) {
          const evidence = { rastreio: 1, bloqueio: 0, distracao: 2 };
          await say({ name: CHARACTERS[ally].name, actor: actorFor(ally) }, [
            'Preste atenção nesta pista antes de escolher de novo.', sealCase(active).clues[evidence[tactic]],
          ]);
        }
      }
      break;
    }
    case 'patrulha-relato':
      if (reportPatrol(active)) await say(who, ['Os postos estão confirmados e Maki assinou o relatório. A ronda rendeu 150 ryō.',
        active.flags['ondas-postura'] ? 'Seu relatório foi anexado ao registro da escolta de Tazuna.' :
          'Chegou um pedido de escolta. Quando quiser, fale com Tazuna aqui na rua.']);
      break;
    case 'ondas':
      await say(who, ['Tazuna está ao meu lado. Fale com ele quando quiser saber sobre a escolta.']);
      return;
    default: await say(who, talk(active, senseiId(active))); return;
  }
  placeNpcs();
}

async function chooseSupport(campaign: Campaign, prompt: string, solo = 'Fazer a aproximação sozinho') {
  const members = teamMembers(campaign).filter((id) => SUPPORT[id]);
  if (!members.length) return '';
  const names = { rastreio: 'Ler sinais', bloqueio: 'Fechar passagem', distracao: 'Distrair' };
  const choice = await say(null, [prompt], [
    ...members.map((id) => ({ id, label: `${CHARACTERS[id].name} · ${names[SUPPORT[id].tactic]}` })),
    { id: 'sozinho', label: solo },
  ]);
  return members.includes(choice) ? choice : '';
}

async function examineTrail(id: string) {
  if (!c || geninStage(c) !== 'busca' || c.flags['tora-rastro']) return;
  const route = toraRoute(c);
  if (route.id !== id) { await say(null, ['A marca foi deixada há tempo. Tora deve ter passado por outro caminho.']); return; }
  const ally = await chooseSupport(c, `Este rastro é fresco. Ele segue para ${route.shelter.name}. Quem vai ajudar na aproximação?`);
  if (ally) {
    const support = SUPPORT[ally];
    await say({ name: CHARACTERS[ally].name, actor: actorFor(ally) }, [support.trail, support.plan]);
  } else await say(null, ['Você guarda a pista e segue para o esconderijo.']);
  if (setToraPlan(c, ally)) toast('Rastro confirmado. Siga até o esconderijo.');
}

async function catchTora() {
  if (!c) return;
  const tactic = toraTactic(c);
  const score = await runMini(new ToraGame(tactic ?? 'sozinho'));
  if (score < 1) { await say(null, ['Tora deu um salto e voltou para o esconderijo. Espere a poeira baixar e tente de novo.']); return; }
  if (rescueTora(c)) await say(null, ['Você conseguiu pegar Tora. Encontre seu sensei na Rua da Academia.']);
}

async function patrolDuel(who: { name: string; actor: Actor }) {
  if (!c || geninStage(c) !== 'patrulha-rota' || nextPatrolPost(c)) return;
  const decision = await say(who, ['Sou Maki, da guarda. Poste aceso, marca conferida. Agora mostrem como a equipe reage quando alguém fecha a passagem.',
    'Nesta missão, as kunai e os shuriken que você usar saem do estoque.'],
    [{ id: 'pronto', label: 'Começar o duelo da ronda' }, { id: 'depois', label: 'Preparar a equipe' }]);
  if (decision !== 'pronto') return;
  const ally = await chooseSupport(c, 'Quem vai preparar a entrada no duelo?');
  const tactic = SUPPORT[ally]?.tactic;
  if (ally) await say({ name: CHARACTERS[ally].name, actor: actorFor(ally) }, [
    tactic === 'rastreio' ? 'Vi onde ela está. Você pode começar a longa distância.' :
      tactic === 'bloqueio' ? 'Eu fecho a lateral. Você começa perto dela.' :
        'Deixa comigo. Quando você entrar, ela já vai ter gasto fôlego seguindo a distração.',
  ]);
  const won = await runBattle('maki', 'Ronda das lanternas', { tactic });
  if (settlePatrolDuel(c, won === true)) {
    if (ally) bond(c, ally, { confianca: 4 }, 'Preparou comigo a entrada no duelo da ronda.');
    placeNpcs();
    save();
    await say(who, ['Perceberam a abertura e mantiveram a passagem segura. Levem meu relatório ao sensei.']);
  } else {
    restoreAll(c);
    save();
    await say(who, ['Pausa para água. A ronda continua aqui. Quando estiver pronto, tente de novo, com outra abertura se quiser.']);
  }
}

function drawMissionSpot(spot: ReturnType<typeof missionSpots>[number]) {
  const { x, y, id } = spot;
  if (id === 'tora') drawTora(g, x, y, 1, 1, calm.matches ? 0 : Math.floor(clock * 3) % 2);
  else if (id.startsWith('rastro-')) drawTrack(g, x, y, id);
  else if (id.startsWith('selo-') || id.startsWith('patrulha-')) drawAssignmentProp(g, id, x, y, calm.matches ? 0 : clock);
  else drawSupply(g, x, y, id);
}

// ——— Mapas e câmera ———
const cv = $<HTMLCanvasElement>('stage');
const g = cv.getContext('2d', { alpha: false })!;
function map() { return maps[c!.map]; }
let shownMap: MapId | null = null;

function enterMap(id: MapId, x: number, y: number, dir: Dir, fade = true) {
  const go = () => {
    if (!c) return;
    c.map = id; c.x = x; c.y = y; c.dir = dir;
    if (id === 'campo' && c.period === 0 && academyMorning(c) === 'free' && retakeDay(c) !== null) startAfternoon(c);
    if (!c.seen.includes(id)) c.seen.push(id);
    const changed = shownMap !== id; shownMap = id;
    placeNpcs();
    size();
    camera = limits();
    refresh();
    if (changed) banner(maps[id]);
  };
  if (!fade) { go(); return; }
  busy = true;
  $('fade').classList.add('on');
  setTimeout(() => { go(); $('fade').classList.remove('on'); setTimeout(() => (busy = false), 200); }, 260);
}

function limits() {
  const m = map();
  const cx = Math.round(c!.x - cv.width / 2), cy = Math.round(c!.y - cv.height * 0.58);
  return {
    x: m.w <= cv.width ? Math.round((m.w - cv.width) / 2) : Math.max(0, Math.min(m.w - cv.width, cx)),
    y: m.h <= cv.height ? Math.round((m.h - cv.height) / 2) : Math.max(0, Math.min(m.h - cv.height, cy)),
  };
}

/** Tela cheia: escala inteira de pixels, a área lógica cresce até cobrir a janela. */

function size() {
  const W = innerWidth, H = innerHeight;
  const portraitMode = H > W;
  let s = portraitMode ? Math.max(2, Math.round(W / 210)) : Math.max(1, Math.round(Math.min(W / 440, H / 250)));
  if (zoomCloser) s += 1;

  const lw = Math.ceil(W / s), lh = Math.ceil(H / s);
  if (cv.width !== lw || cv.height !== lh) { cv.width = lw; cv.height = lh; }
  cv.style.width = lw * s + 'px'; cv.style.height = lh * s + 'px';
  g.imageSmoothingEnabled = false;
}
window.addEventListener('resize', () => { size(); if (c) camera = limits(); });

// ——— HUD ———
function refresh() {
  if (!c) return;
  const v = maxVitals(c.stats);
  const extra = c.map === 'campo' ? extraTrainingLeft(c) : 0;
  const actionCount = c.period === 1 ? ` · ${c.actions} ${c.actions === 1 ? 'ação' : 'ações'}` : extra ? ` · ${extra} ${extra === 1 ? 'treino extra' : 'treinos extras'}` : '';
  $('clock').textContent = `Dia ${c.day} · ${WEEKDAYS[(c.day - 1) % 7]} · ${PERIODS[c.period]}${actionCount}`;
  $('who').textContent = c.profile.name;
  $('rank').textContent = `${c.rank} · Nível ${level(c)}`;
  $('bars').replaceChildren(...([['PV', c.hp, v.hp, 'var(--hp)'], ['CH', c.chakra, v.chakra, 'var(--ch)'], ['RES', c.stamina, v.stamina, 'var(--st)']] as const).map(([a, b, mx, col]) => {
    const e = document.createElement('div'); e.className = 'bar';
    const label = document.createElement('span'); label.textContent = a;
    const track = document.createElement('i'); track.style.setProperty('--v', `${Math.max(0, Math.min(100, (b / mx) * 100))}%`); track.style.setProperty('--c', col);
    const num = document.createElement('em'); num.textContent = `${Math.round(b)}/${mx}`;
    e.append(label, track, num); return e;
  }));
  $('objective').textContent = objective(c);
  const face = $<HTMLCanvasElement>('hudFace').getContext('2d')!;
  face.imageSmoothingEnabled = false; face.clearRect(0, 0, 40, 40); face.drawImage(portrait(playerActor()), 0, 0);
}
function playerActor(): Actor { return { role: 'player', look: { ...c!.profile }, bandana: c!.rank !== 'Estudante da Academia' }; }
function banner(m: GameMap) {
  const b = $('banner');
  $('bannerRegion').textContent = m.region;
  $('bannerName').textContent = m.name;
  b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
}

function todayLesson(cc: Campaign) { return LESSONS.find((l) => l.day === cc.day); }

function objective(cc: Campaign): string {
  if (cc.quest === 'matricula-ficha') return 'Pegue a ficha no quadro de avisos';
  if (cc.quest === 'matricula-entrega') return 'Entregue a ficha a Iruka';
  const stage = geninStage(cc);
  if (missionDeferred(cc)) return `Treino livre · Fale com ${CHARACTERS[senseiId(cc)].name} quando quiser aceitar a missão`;
  if (stage === 'busca' && cc.flags['tora-rastro']) return 'Missão D · Aproxime-se de Tora no esconderijo';
  if (stage === 'selo-pistas') {
    const count = sealClueCount(cc);
    return count === SEAL_CLUES.length ? 'Missão D · Informe o destino ao sensei' : `${GENIN_OBJECTIVES[stage]} · ${count}/${SEAL_CLUES.length}`;
  }
  if (stage === 'patrulha-rota' && !nextPatrolPost(cc)) return 'Missão D · Encontre Maki no Campo de Treino';
  if (stage === 'suprimentos') return `${GENIN_OBJECTIVES.suprimentos} · ${SUPPLIES.filter((item) => cc.flags[item.id]).length}/3`;
  if (stage) return GENIN_OBJECTIVES[stage];
  if (cc.rank === 'Genin') return 'Você é genin! Amanhã saem as equipes';
  const retake = retakeDay(cc);
  if (cc.period === 0) {
    const session = academyMorning(cc);
    if (session === 'exam') return retake !== null ? 'Repescagem hoje! Entre na Academia' : 'Exame de graduação hoje! Entre na Academia';
    if (retake !== null) return `Repescagem dia ${retake} · Vá ao Campo de Treino`;
    return session === 'lesson' ? `Aula de hoje: ${todayLesson(cc)?.title}. Entre na Academia` : 'Manhã livre';
  }
  if (cc.period === 1 && retake !== null) return `Repescagem dia ${retake} · Treine o Bunshin ou fale com Iruka · ${cc.actions} ações`;
  if (cc.period === 1) return `Tarde livre: treine no Campo de Treino (oeste) · ${cc.actions} ações`;
  const extra = extraTrainingLeft(cc);
  if (extra && cc.map === 'campo') return `${extra} ${extra === 1 ? 'treino extra disponível' : 'treinos extras disponíveis'} · Descanse quando quiser`;
  return 'Noite: jante no Ichiraku ou volte para casa e durma';
}

let toastTimer = 0;
function toast(text: string, ms = 3200) {
  const t = $('toast');
  t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (t.hidden = true), ms);
}

// ——— Diálogo ———
let dialogResolve: ((v: string) => void) | null = null;
let dialogLines: string[] = [], dialogIndex = 0, dialogChoices: { id: string; label: string }[] = [];

function say(who: { name: string; actor?: Actor } | null, lines: string[], choices: { id: string; label: string }[] = []): Promise<string> {
  busy = true; held.clear();
  dialogLines = lines; dialogIndex = 0; dialogChoices = choices;
  $('talk').hidden = false;
  $('speaker').textContent = who?.name ?? '';
  const h = $<HTMLCanvasElement>('head');
  h.hidden = !who?.actor;
  if (who?.actor) {
    const hg = h.getContext('2d')!;
    hg.imageSmoothingEnabled = false;
    hg.clearRect(0, 0, h.width, h.height);
    drawDialoguePortrait(hg, who.actor);
  }
  renderLine();
  return new Promise((res) => (dialogResolve = res));
}
function renderLine() {
  $('words').textContent = dialogLines[dialogIndex];
  const box = $('choices');
  box.replaceChildren();
  const lastLine = dialogIndex >= dialogLines.length - 1;
  $('next').hidden = lastLine && dialogChoices.length > 0;
  if (lastLine && dialogChoices.length) {
    dialogChoices.forEach((ch, i) => {
      const b = document.createElement('button');
      b.textContent = `${i + 1}. ${ch.label}`;
      b.onclick = () => closeDialog(ch.id);
      box.append(b);
    });
    markChoice(0);
  }
}
function advanceDialog() {
  if (!dialogResolve) return;
  audio.sfx('tick');
  if (dialogIndex >= dialogLines.length - 1) { if (!dialogChoices.length) closeDialog(''); return; }
  dialogIndex++;
  renderLine();
}
function closeDialog(choice: string) {
  $('talk').hidden = true;
  const r = dialogResolve; dialogResolve = null;
  busy = false;
  refresh();
  r?.(choice);
}
$('next').onclick = advanceDialog;

// ——— Interação ———
function nearestContact() {
  if (!c) return null;
  let best: typeof contact = null, dist = 30;
  for (const n of npcs) { const d = Math.hypot(c.x - n.x, c.y - n.y); if (d < dist) { dist = d; best = { kind: 'npc', npc: n }; } }
  for (const s of worldSpots()) { const d = Math.hypot(c.x - s.x, c.y - s.y); if (d < s.r && d < dist + 6) { dist = d; best = { kind: 'spot', id: s.id, label: s.label }; } }
  return best;
}

async function interact() {
  if (!c || busy || $<HTMLDialogElement>('menu').open) return;
  if (!contact) return;
  gestureUntil = clock + 0.28;
  if (contact.kind === 'npc') await talkTo(contact.npc);
  else await useSpot(contact.id);
  dirty = true; save(); refresh();
}

async function talkToGuy(who: { name: string; actor: Actor }) {
  if (!c) return;
  if (c.quest.startsWith('matricula')) {
    await say(who, ['Primeiro entregue sua matrícula a Iruka. Depois venha treinar com a gente.']);
    return;
  }
  const preferred = guyPreference(c);
  const choice = await say(who, [
    'Rock Lee, Neji e Tenten são Genin do Time 3. Pode treinar com eles enquanto estiver na Academia.',
    preferred ? `Sua preferência está registrada com ${CHARACTERS[preferred].name}. Podemos trocar até a formação das equipes.` :
      'Na sua graduação eu posso abrir uma vaga no nosso rodízio. Escolha um parceiro e eu sorteio o outro entre os dois restantes.',
  ], [
    ...GUY_TEAM.filter((id) => c!.npcs[id]?.alive).map((id) => ({ id, label: `Pedir vaga com ${CHARACTERS[id].name}` })),
    ...(preferred ? [{ id: 'cancelar', label: 'Voltar ao sorteio regular' }] : []),
    { id: 'depois', label: 'Decidir mais tarde' },
  ]);
  if (choice === 'depois') return;
  if (choice === 'cancelar' && requestGuyTeam(c, null)) {
    await say(who, ['Tudo bem. Iruka vai incluir você no sorteio regular.']);
    return;
  }
  if (requestGuyTeam(c, choice)) {
    await say(who, [`Registrado. Depois de passar no exame, você vai para o Time 3 com ${CHARACTERS[choice].name} e mais um dos nossos Genin.`]);
  }
}

async function talkTo(n: Npc) {
  if (!c) return;
  n.dir = face(c.x - n.x, c.y - n.y, n.dir);
  c.dir = face(n.x - c.x, n.y - c.y, c.dir);
  const who = { name: n.name, actor: n.actor };
  if (n.id === 'iruka' && c.quest === 'matricula-entrega') {
    await say(who, [`A ficha está em ordem, ${c.profile.name}. Vou colocar seu nome na lista da turma.`, 'Matrícula confirmada! As aulas começam amanhã cedo. Hoje à tarde, aproveite para conhecer o Campo de Treino, a oeste. Guy e os Genin dele treinam lá.']);
    c.quest = 'aula'; c.lessonsDone.push(1);
    bond(c, 'iruka', { confianca: 5 }, 'Matriculou-se na minha turma.');
    addLog(c, 'Iruka confirmou sua matrícula na Academia.');
    startAfternoon(c); placeNpcs();
    toast('Tarde livre. Cada treino gasta uma ação; quando acabarem, anoitece.');
    return;
  }
  if (n.id === 'gen') { await shop(who); return; }
  if (n.id === 'tazuna') { await talkToTazuna(who); return; }
  const stage = geninStage(c);
  if (stage && n.id === senseiId(c)) { await talkToSensei(who); return; }
  if (n.id === 'maki') { await patrolDuel(who); return; }
  if (n.id === 'guy' && !c.flags.equipe) { await talkToGuy(who); return; }
  const member = teamMembers(c).indexOf(n.id);
  if (stage === 'suprimentos' && member >= 0 && !c.flags[SUPPLIES[member].id]) {
    const supply = SUPPLIES[member];
    await say(who, [SUPPORT[n.id].supply, `${supply.label} conferida. Eu levo esta.`]);
    if (collectSupply(c, supply.id)) {
      bond(c, n.id, { confianca: 2 }, `Conferimos juntos: ${supply.label}.`);
      placeNpcs();
      toast(`${supply.label} recolhida por ${n.name}.`);
    }
    return;
  }
  if (stage === 'busca' && member >= 0) {
    await say(who, [SUPPORT[n.id].trail, SUPPORT[n.id].plan]);
    return;
  }
  if (n.id === 'iruka' && (c.period === 1 || geninStage(c))) {
    const missed = LESSONS.find((l) => l.teaches && l.day < c!.day && !(l.teaches in c!.jutsus));
    if (missed?.teaches) {
      const ch = await say(who, [`Posso revisar ${JUTSUS[missed.teaches].name} agora. Também podemos fazer a aula inteira.`],
        [{ id: 'sim', label: c.period === 1 ? 'Aprender o básico (1 ação)' : 'Aprender o básico' }, { id: 'nao', label: 'Ver aulas para repor' }]);
      if (ch === 'sim' && (c.period !== 1 || c.actions > 0)) {
        learn(c, missed.teaches, 8);
        addLog(c, `Aula de reforço com Iruka: ${JUTSUS[missed.teaches].name}.`);
        bond(c, 'iruka', { respeito: 2 });
        afterAction();
        return;
      }
    }
    const overdue = LESSONS.filter((lesson) => lesson.day > 1 && lesson.day < c!.day && !c!.lessonsDone.includes(lesson.day));
    if (overdue.length && (c.period !== 1 || c.actions > 0)) {
      const pick = await say(who, ['Podemos repor uma aula que ficou para trás. Escolha o assunto.'], [
        ...overdue.map((lesson) => ({ id: String(lesson.day), label: lesson.title })),
        { id: 'depois', label: 'Agora não' },
      ]);
      const lesson = overdue.find((option) => option.day === Number(pick));
      if (lesson) await runLesson(lesson, true);
      return;
    }
  }
  const lines = talk(c, n.id);
  const npcState = c.npcs[n.id];
  const trainingPartner = CHARACTERS[n.id].classmate || GUY_TEAM.some((id) => id === n.id);
  if (npcState && npcState.talkedDay !== c.day && (trainingPartner || n.id === 'iruka')) {
    npcState.talkedDay = c.day;
    bond(c, n.id, { amizade: 3 });
  }
  if (n.id === 'naruto' && c.period === 1 && c.map === 'campo' && npcState.bond.amizade >= 20 && 'bunshin' in c.jutsus) {
    const ch = await say(who, lines, [{ id: 'treinar', label: 'Treinar Bunshin com Naruto (1 ação)' }, { id: 'nao', label: 'Agora não' }]);
    if (ch === 'treinar' && c.actions > 0) {
      c.flags['treino-naruto'] = ((c.flags['treino-naruto'] as number) ?? 0) + 1;
      c.npcs.naruto.jutsus.bunshin = Math.min(100, (c.npcs.naruto.jutsus.bunshin ?? 0) + 9);
      c.npcs.naruto.stats['Controle de chakra'] += 0.4;
      practice(c, 'bunshin', 8);
      bond(c, 'naruto', { amizade: 6, confianca: 4 }, 'Treinou o Bunshin comigo no campo.');
      await say(who, ['Olha, olha! Esse saiu quase de pé! Valeu, de verdade!']);
      afterAction();
    }
    return;
  }
  if (trainingPartner && c.period === 1) {
    const classic = c.era === 'classico' && n.id === 'sasuke' && !('gokakyu' in c.jutsus);
    const ch = await say(who, lines, [
      { id: 'luta', label: 'Desafiar para um treino de luta (1 ação)' },
      ...(classic ? [{ id: 'katon', label: 'Treinar Katon (1 ação)' }] : []),
      { id: 'nao', label: 'Até mais' },
    ]);
    if (ch === 'luta') await spar(n);
    if (ch === 'katon') {
      const ready = Object.entries(JUTSUS.gokakyu.requirements)
        .every(([stat, minimum]) => c!.stats[stat as Stat] >= minimum);
      if (!ready) { await say(who, ['Primeiro desenvolva Ninjutsu e Chakra até 6. A chama precisa de controle e reserva.']); return; }
      await say(who, ['Repare no ritmo dos selos. Pratique mirando os alvos de pedra, longe das árvores.']);
      const score = await runMini(new SealsGame(6, seededRand(), 2.7));
      afterAction();
      if (score < 0.5) { await say(who, ['A chama apagou antes de sair. Podemos praticar outra vez.']); return; }
      learn(c, 'gokakyu', Math.round(20 + score * 20));
      addLog(c, 'Treinou com Sasuke e aprendeu Katon: Gōkakyū.');
      await say(who, ['A chama sustentou a forma. Use o Katon a média ou longa distância.']);
    }
    return;
  }
  await say(who, lines);
}

async function shop(who: { name: string; actor: Actor }) {
  if (!c) return;
  for (;;) {
    const ch = await say(who, [`${talk(c, 'gen')[0]} Você tem ${c.ryo} ryō.`], [
      ...Object.values(ITEMS).map((i) => ({ id: i.id, label: `${i.name} · ${i.price} ryō (tem ${c!.inventory[i.id] ?? 0})` })),
      ...(geninStage(c) ? Object.entries(GEAR).filter(([id]) => !c!.inventory[id])
        .map(([id, gear]) => ({ id, label: `${gear.name} · ${gear.price} ryō` })) : []),
      { id: 'sair', label: 'Só olhando, obrigado' },
    ]);
    const gear = GEAR[ch as GearId];
    if (gear && Object.hasOwn(GEAR, ch) && geninStage(c)) {
      if (c.inventory[ch]) continue;
      if (c.ryo < gear.price) { await say(who, ['Faltou dinheiro para esse equipamento.']); continue; }
      c.ryo -= gear.price;
      c.inventory[ch] = 1;
      save();
      continue;
    }
    const item = ITEMS[ch];
    if (!item) return;
    if (c.ryo < item.price) { await say(who, ['Faltou dinheiro, jovem. Volte quando receber a mesada.']); return; }
    c.ryo -= item.price;
    c.inventory[item.id] = (c.inventory[item.id] ?? 0) + 1;
    save();
  }
}

async function useSpot(id: string) {
  if (!c) return;
  if (geninStage(c) === 'suprimentos') {
    const index = SUPPLIES.findIndex((supply) => supply.id === id);
    if (index >= 0) {
      const member = teamMembers(c)[index];
      if (member) { await say(null, [`${CHARACTERS[member].name} está logo ao lado. Confirme com o colega que este é o material certo.`]); return; }
      if (collectSupply(c, id)) { toast(`${SUPPLIES[index].label} recolhida.`); placeNpcs(); return; }
    }
  }
  if (geninStage(c) === 'selo-pistas') {
    const index = SEAL_CLUES.findIndex((clue) => clue.id === id);
    if (index >= 0) {
      recordSealClue(c, id);
      await say({ name: SEAL_CLUES[index].label }, [sealCase(c).clues[index]]);
      return;
    }
  }
  if (checkPatrolPost(c, id)) {
    await say(null, [id === 'patrulha-luz' ? 'A lanterna está acesa. A chama ilumina a entrada da trilha.' :
      'Você conferiu a fita da guarda e marcou a passagem. Maki espera adiante.']);
    placeNpcs();
    return;
  }
  if (id.startsWith('rastro-')) { await examineTrail(id); return; }
  if (id === 'tora' && geninStage(c) === 'busca') { await catchTora(); return; }
  switch (id) {
    case 'quadro':
      if (c.quest === 'matricula-ficha') {
        c.quest = 'matricula-entrega';
        addLog(c, 'Você pegou a ficha de matrícula no quadro de avisos.');
        await say(null, ['Entre os avisos da semana está a ficha de matrícula com o selo da Academia.', 'Você a preenche ali mesmo. Agora é entregar a Iruka, o professor de colete verde em frente à escadaria.']);
      } else {
        await say(null, [`Aviso da Academia: exame de graduação no dia ${EXAM_DAY}. Prova prática: Bunshin no Jutsu.`, 'Embaixo, alguém desenhou um sapo com uma bandana. A tinta ainda está fresca.']);
      }
      return;
    case 'academia': return academyDoor();
    case 'casa': return home();
    case 'ichiraku': return ramen();
    case 'troncos': case 'alvos': return trainSpot(id);
    case 'meditacao': return meditationSpot();
    case 'circuito': return chooseTraining(['arrancadas', 'folego', 'resistencia']);
    case 'estudo': return chooseTraining(['leitura', 'ilusao', 'moldagem']);
    case 'selos': return practiceSpot();
    case 'carteira': await say(null, ['Seu nome está escrito a lápis no canto da carteira.']); return;
  }
}

function afterAction(solo = false) {
  if (!c) return;
  if (solo && c.period === 2) { spendExtraTraining(c); return; }
  if (spendAction(c)) {
    placeNpcs();
    toast('Anoiteceu. O Campo ainda tem dois treinos extras opcionais.');
  }
}

// ——— Minijogos ———
let mini: Minigame | null = null;
let miniResolve: ((score: number | null) => void) | null = null;
let shownMiniOptions: Minigame['options'];
const miniCancel = $<HTMLButtonElement>('mini-cancel');
function renderMiniOptions() {
  const box = $('mini').querySelector<HTMLElement>('.mini-opts')!;
  shownMiniOptions = mini?.options;
  box.replaceChildren(...(shownMiniOptions ?? []).map((o, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = '<b></b><small></small>';
    b.querySelector('b')!.textContent = o.label;
    b.querySelector('small')!.textContent = `${i + 1} · ${o.sub}`;
    b.onclick = () => { mini?.choose?.(i); renderMiniOptions(); };
    return b;
  }));
}
function runMini(mg: Minigame): Promise<number>;
function runMini(mg: Minigame, cancelable: true): Promise<number | null>;
function runMini(mg: Minigame, cancelable = false): Promise<number | null> {
  busy = true; held.clear();
  mini = mg;
  const box = $('mini');
  box.hidden = false;
  box.querySelector('.mini-title')!.textContent = mg.title;
  box.querySelector('.mini-help')!.textContent = mg.help;
  const action = $<HTMLButtonElement>('mini-action');
  action.hidden = !!mg.choose;
  action.disabled = false;
  miniCancel.hidden = !cancelable;
  action.textContent = mg instanceof ToraGame ? 'Aproximar · A' : mg instanceof ChakraGame ? 'Segure · A' : 'Agir · A';
  renderMiniOptions();
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  return new Promise((res) => (miniResolve = res));
}
function closeMini() {
  $('mini').hidden = true;
  miniCancel.hidden = true;
  mini = null;
  busy = false;
}
miniCancel.onclick = () => {
  if (miniCancel.hidden || !miniResolve || mini?.done) return;
  const resolve = miniResolve;
  miniResolve = null;
  closeMini();
  resolve(null);
};
function miniTick(dt: number) {
  if (!mini) return;
  mini.update(dt);
  $('mini').querySelector('.mini-help')!.textContent = mini.done ? mini.help : `${mini.status()} · ${mini.help}`;
  if (mini.options !== shownMiniOptions) renderMiniOptions();
  if (mini.done && miniResolve) {
    const r = miniResolve, score = mini.score;
    miniResolve = null;
    $('mini').querySelector('.mini-title')!.textContent = `${grade(score)} · ${Math.round(score * 100)} pontos`;
    $('mini').querySelector('.mini-opts')!.replaceChildren();
    $<HTMLButtonElement>('mini-action').disabled = true;
    miniCancel.hidden = true;
    setTimeout(() => { closeMini(); r(score); }, 1300);
  }
}
const seededRand = () => { const r = new Rng(c ? c.rng ^ Math.floor(clock * 1000) : 1); return () => r.next(); };

function soloTrainingSlots(cc: Campaign): number {
  return cc.period === 1 ? cc.actions : cc.map === 'campo' ? extraTrainingLeft(cc) : 0;
}

async function prepareSoloTraining(camp: Campaign): Promise<boolean> {
  if (camp.period === 0 && camp.rank === 'Genin' && academyMorning(camp) === 'free') {
    await offerAfternoon(['O Campo está livre. Quer passar para a tarde para começar a treinar?']);
    return soloTrainingSlots(camp) > 0;
  }
  if (soloTrainingSlots(camp) > 0) return true;
  await say(null, [camp.period === 0 ? 'O Campo abre à tarde.' : 'Os treinos de hoje terminaram. Volte amanhã.']);
  return false;
}

function trainingGame(kind: TrainingId, camp: Campaign): Minigame {
  switch (kind) {
    case 'troncos': return new StrikeGame(camp.stats.Força);
    case 'alvos': return new KunaiGame(camp.stats.Percepção);
    case 'meditacao': return new ChakraGame(camp.stats['Controle de chakra']);
    case 'folego': return new ChakraGame(camp.stats.Vitalidade, true);
    case 'arrancadas': case 'resistencia':
      return new StrikeGame(camp.stats[kind === 'arrancadas' ? 'Velocidade' : 'Resistência'], TRAINING[kind].name,
        'Avance quando o marcador cruzar a faixa dourada. São seis passagens.', 'track', kind === 'resistencia' ? 'bloqueio' : undefined);
    case 'leitura': case 'ilusao': return new ObservationGame(kind === 'ilusao', seededRand());
    case 'moldagem': {
      const game = new SealsGame(5, seededRand(), 2.8);
      game.title = TRAINING[kind].name;
      return game;
    }
  }
}

function progressPercent(camp: Campaign, stat: Stat) {
  return Math.min(99, Math.max(0, Math.floor((camp.statXp[stat] ?? 0) / statCost(camp.stats[stat]) * 100)));
}

async function chooseTraining(drills: TrainingId[]) {
  if (!c) return;
  const camp = c;
  if (!await prepareSoloTraining(camp)) return;
  const choice = await say(null, ['Cada exercício custa uma ação. Escolha pelo atributo que quer desenvolver.'], [
    ...drills.map((id) => ({ id, label: `${TRAINING[id].name} · ${TRAINING[id].stats.join(' e ')} · ${TRAINING[id].cost} RES` })),
    { id: '', label: 'Agora não' },
  ]);
  const drill = drills.find((id) => id === choice);
  if (drill && c === camp) await trainSpot(drill, true);
}

async function trainSpot(kind: TrainingId, confirmed = false) {
  if (!c) return;
  const camp = c;
  if (!await prepareSoloTraining(camp)) return;
  const { name, stats, cost } = TRAINING[kind];
  if (camp.stamina < cost) { await say(null, ['Você está sem fôlego. Coma um onigiri, jante no Ichiraku ou descanse.']); return; }
  if (!confirmed && camp.period === 2) {
    const choice = await say(null, [`${name} · ${cost} RES · 1 treino extra`], [{ id: 'sim', label: 'Começar treino extra' }, { id: 'nao', label: 'Agora não' }]);
    if (choice !== 'sim') return;
  }
  const score = await runMini(trainingGame(kind, camp), true);
  if (score === null) return;
  camp.stamina -= cost;
  if (kind === 'meditacao') camp.chakra = Math.min(maxVitals(camp.stats).chakra, camp.chakra + 8);
  const result = applyTraining(camp, stats, score);
  clampVitals(camp);
  const progress = stats.map((stat) => {
    const points = result.gains.find((gain) => gain.stat === stat)?.points;
    return points ? `${stat} +${points}` : `${stat} ${progressPercent(camp, stat)}%`;
  }).join(' · ');
  addLog(camp, `${name} (${Math.round(score * 100)} pontos). ${progress}.`);
  afterAction(true);
  toast(progress);
}

function yukiHint(camp: Campaign): string {
  const trial = yukiTrial(camp);
  if (trial.state === 'story') return 'O caderno da família pode ser estudado na Pedra de meditação depois de concluir a Vida Genin.';
  if (trial.state === 'stats') return `Para estudar o caderno, melhore ${trial.missing.join(' e ')}.`;
  if (trial.state === 'ready') return 'O caderno pode ser estudado na Pedra de meditação do Campo de Treino.';
  return '';
}

async function meditationSpot() {
  if (!c) return;
  const camp = c;
  const trial = yukiTrial(camp);
  if (trial.state === 'other' || trial.state === 'known') { await trainSpot('meditacao'); return; }
  if (!await prepareSoloTraining(camp)) return;
  const choice = await say(null, ['A margem do lago está quieta.'], [
    { id: 'meditar', label: 'Meditar · Controle de chakra e Chakra' },
    { id: 'yuki', label: 'Abrir o caderno da família Yuki' },
    { id: '', label: 'Agora não' },
  ]);
  if (choice === 'meditar') { await trainSpot('meditacao', true); return; }
  if (choice !== 'yuki') return;
  if (trial.state !== 'ready') { await say(null, [yukiHint(camp)]); return; }
  if (camp.chakra < HYOTON_TRIAL_COST) { await say(null, ['Você precisa de 6 CH. Medite primeiro para recuperar chakra.']); return; }
  const begin = await say(null, [
    'Entre duas páginas, um parente desenhou as mãos acima de uma tigela. Uma nota pede que você segure o chakra até a água cristalizar.',
    `Faça os selos e acerte ${Math.round(HYOTON_TRIAL_SCORE * 100)}% da prova. Uma tentativa custa ${HYOTON_TRIAL_COST} CH e uma ação.`,
  ], [{ id: 'sim', label: 'Tentar formar gelo' }, { id: '', label: 'Guardar o caderno' }]);
  if (begin !== 'sim') return;
  const score = await runMini(new JutsuPracticeGame(JUTSUS[HYOTON], playerActor(), seededRand(), HYOTON_TRIAL_SCORE), true);
  if (score === null) return;
  camp.chakra -= HYOTON_TRIAL_COST;
  const learned = awakenHyoton(camp, score);
  afterAction(true);
  save();
  const lines = learned ? ['A água cristalizou entre seus dedos. Você aprendeu Hyōton: Estilhaços de Gelo.',
    'Pratique no posto de jutsus ou use em duelo a média ou longa distância.'] :
    ['A água esfriou, mas o gelo se desfez. Tente novamente quando tiver chakra e uma ação.'];
  await say(null, lines);
}

function campaignJutsus(camp: Campaign) {
  return Object.values(JUTSUS).filter((j) => Object.hasOwn(camp.jutsus, j.id)
    && (j.era === 'academia' || camp.era === j.era) && (!j.clan || j.clan === camp.profile.clan));
}

async function practiceSpot() {
  if (!c) return;
  const camp = c;
  const known = campaignJutsus(camp);
  if (!known.length) { await say(null, ['As aulas de Iruka ensinam Henge, Kawarimi e Bunshin. Aprenda uma técnica para praticar aqui.']); return; }
  if (!await prepareSoloTraining(camp)) return;
  const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
  const canPractice = (j: Jutsu) => camp.chakra >= j.chakraCost && camp.jutsus[j.id] < 100;
  let selected: Jutsu | undefined;
  while (soloTrainingSlots(camp)) {
    if (!selected) {
      const remaining = camp.period === 1 ? `${camp.actions} na tarde` : `${extraTrainingLeft(camp)} de treino extra`;
      const choice = await say(null, [`Escolha o jutsu. Cada sessão custa 1 ação (${remaining}) e o chakra indicado.`], [
        ...known.map((j) => ({ id: j.id, label: `${j.name} · ${decimal.format(camp.jutsus[j.id])}% · ${j.chakraCost} CH` })),
        { id: '', label: 'Encerrar treino' },
      ]);
      selected = known.find((j) => j.id === choice);
      if (!selected) return;
    }
    if (!canPractice(selected)) {
      await say(null, [camp.jutsus[selected.id] >= 100 ? 'Você já atingiu o domínio máximo desse jutsu.' : 'Chakra insuficiente. A pedra de meditação fica ao sul do campo.']);
      selected = undefined;
      if (!known.some(canPractice)) return;
      continue;
    }
    const j = selected;
    const before = camp.jutsus[j.id];
    const score = await runMini(new JutsuPracticeGame(j, playerActor(), seededRand()), true);
    if (score === null) return;
    camp.chakra -= j.chakraCost;
    applyTraining(camp, j.trains, score, 0.2, j.id);
    const mastery = camp.jutsus[j.id];
    addLog(camp, `Praticou ${j.name}: domínio ${decimal.format(mastery)}%.`);
    afterAction(true);
    save();
    refresh();
    const summary = `${j.name} · domínio ${decimal.format(mastery)}% (+${decimal.format(mastery - before)})`;
    const actions = soloTrainingSlots(camp) && known.some(canPractice) ? [
      ...(canPractice(j) ? [{ id: 'repetir', label: `Repetir (${j.chakraCost} CH, 1 ${camp.period === 2 ? 'treino extra' : 'ação'})` }] : []),
      { id: 'outra', label: 'Escolher técnica' }, { id: '', label: 'Encerrar treino' },
    ] : [{ id: '', label: 'Encerrar treino' }];
    const choice = await say(null, [summary], actions);
    if (choice === 'outra') selected = undefined;
    else if (choice !== 'repetir') return;
  }
}

// ——— Combate ———
let battleScene: BattleScene | null = null;
const POWER = { facil: 0.8, normal: 1, dificil: 1.2 } as const;

function playerFighter() {
  const known = Object.fromEntries(campaignJutsus(c!).map((j) => [j.id, c!.jutsus[j.id]]));
  return makeFighter({
    id: 'player', name: c!.profile.name, role: 'player', look: { ...c!.profile }, stats: combatStats(c!), jutsus: known,
    damageReduction: equippedGear(c!) === 'colete' ? GEAR.colete.reduction : 0,
    items: { kunai: c!.inventory.kunai ?? 0, shuriken: c!.inventory.shuriken ?? 0 }, vitals: { hp: c!.hp, chakra: c!.chakra, stamina: c!.stamina },
  }, 0);
}
function npcFighter(id: string) {
  const d = CHARACTERS[id], n = c!.npcs[id];
  const techniques = { ...n.jutsus };
  if (c!.era === 'classico' && id === 'sasuke') techniques.gokakyu = 70;
  if (c!.era === 'classico' && id === 'naruto' && c!.flags['naruto-kage-bunshin']) techniques['kage-bunshin'] = 85;
  return makeFighter({ id, name: d.name, role: d.role, look: d.look, stats: n.stats, jutsus: techniques,
    items: id === 'rock-lee' ? { kunai: 0, shuriken: 0 } : undefined, personality: d.personality, power: POWER[c!.settings.difficulty] }, 1);
}

async function runBattle(id: string, title: string, patrol?: { tactic?: Tactic }) {
  if (!c) return null;
  busy = true; held.clear();
  const seed = (c.rng ^ (c.day * 7919) ^ c.wins * 31) >>> 0;
  const opponent = npcFighter(id);
  if (patrol?.tactic === 'distracao') opponent.stamina = Math.max(1, opponent.stamina - 8);
  const distance = patrol?.tactic === 'rastreio' ? 2 : patrol?.tactic === 'bloqueio' ? 0 : 1;
  const battle = startBattle(playerFighter(), opponent, seed, distance);
  const m = map(), focus = { x: c.x, y: c.y };
  const scene = new BattleScene({
    battle, title, training: !patrol, actors: [playerActor(), actorFor(id)],
    background: (bg, w, h) => paintWorld(bg, m, { x: Math.max(0, Math.min(m.w - w, focus.x - w / 2)), y: Math.max(0, Math.min(m.h - h, focus.y - h * 0.7)) }, w, h, [], c!.period),
  }, $('battle'));
  battleScene = scene;
  audio.track('luta');
  $('s-game').classList.add('inbattle');
  const result = await scene.run();
  battleScene = null;
  audio.track('vila');
  $('s-game').classList.remove('inbattle');
  busy = false;
  const me = result.fighters[0], won = result.over?.winner === 0;
  // Treino não fere de verdade: sobra ao menos um terço da vida.
  c.hp = Math.max(Math.round(maxVitals(c.stats).hp / 3), me.hp); c.chakra = me.chakra; c.stamina = me.stamina;
  if (patrol) {
    c.inventory.kunai = me.items.kunai;
    c.inventory.shuriken = me.items.shuriken;
    refresh();
    return won;
  }
  // Aprendizado pelo que foi usado na luta.
  const used = me.used;
  const gains: string[] = [];
  const t = (s: Stat, n: number) => { if (n > 0) { const p = train(c!, s, Math.min(1.2, n * 0.18)); if (p) gains.push(`${s} +${p}`); } };
  t('Taijutsu', used.taijutsu ?? 0); t('Força', (used.taijutsu ?? 0) * 0.6); t('Bukijutsu', (used.kunai ?? 0) + (used.shuriken ?? 0));
  t('Resistência', used.defend ?? 0); t('Velocidade', (used.advance ?? 0) + (used.retreat ?? 0));
  for (const j of Object.keys(c.jutsus)) if (used[j]) practice(c, j, used[j] * 3);
  c.xp += won ? 40 : 20;
  if (won) { c.wins++; bond(c, id, { rivalidade: 6, respeito: 5 }, `Perdeu para ${c.profile.name} num treino.`); c.reputation += 1; }
  else { c.losses++; bond(c, id, { respeito: 2 }, `Venceu ${c.profile.name} num treino.`); }
  addLog(c, `Treino de luta contra ${CHARACTERS[id].name}: ${won ? 'vitória' : 'derrota'}.${gains.length ? ' ' + gains.join(', ') + '.' : ''}`);
  refresh();
  if (gains.length) toast(`Evolução: ${gains.join(', ')}`);
  return won;
}

const SPAR_LINES: Record<string, [string, string, string]> = {
  naruto: ['Um treino de luta? Pode vir! Eu não vou pegar leve, tô avisando!', 'Ahh, não valeu! Amanhã eu ganho, pode escrever!', 'Viu só?! Quem vai ser Hokage sou eu!'],
  sasuke: ['...Tudo bem. Mas não me faça perder tempo.', '...Você teve sorte. Não vai acontecer de novo.', 'Ainda falta muito para você.'],
  sakura: ['Tá bom, mas sem puxar cabelo! Eu também treinei, viu?', 'Nossa... você tá forte mesmo.', 'Estudar ajuda até na luta, sabia?'],
  emi: ['Luta rapidinha? Eu tenho um recado pra entregar depois!', 'Uau! Vou contar pra rua inteira!', 'Mais rápida que um recado urgente!'],
  daichi: ['Finalmente! Vamos ver quem é mais forte de verdade.', 'Hmpf. Bom golpe. Da próxima eu revido.', 'Força ganha de truque. Eu disse.'],
  ino: ['Olhe para os meus pés. Se ficar olhando só para as mãos, já era.', 'Você esperou eu terminar a finta. Vou mudar o passo da próxima vez.', 'Enquanto você olhava a mão, eu já tinha cruzado a guarda.'],
  shikamaru: ['Que trabalho… Tudo bem. Tente me encurralar antes que eu ache uma saída.', 'Você tirou meu espaço. Acabei gastando energia à toa.', 'Eu só precisava de distância e uma abertura.'],
  choji: ['Vou segurar o primeiro golpe. Quero ver o que você faz depois.', 'Achei que aguentava mais uma. Preciso aprender a recuar.', 'Firmei os pés. Aí sobrou espaço para responder.'],
  kiba: ['Corra enquanto pode! Eu e o Akamaru treinamos arrancada desde cedo.', 'Você me viu vindo de longe, né? Preciso variar meu bote.', 'Fechei a distância antes de você armar a guarda.'],
  hinata: ['Eu vou esperar sua entrada. Posso treinar minha resposta?', 'Eu hesitei no começo. Obrigada pelo treino.', 'Esperei o momento certo e consegui. Obrigada.'],
  'rock-lee': ['Vamos ver quantos golpes conseguimos trocar sem dar um passo para trás!', 'Você me tirou do eixo. Vou treinar a perna de apoio!', 'A troca de pé funcionou. Quero repetir esse golpe amanhã!'],
  neji: ['Aproxime-se quando estiver pronto. Vou prestar atenção a cada passo.', 'Você mudou o momento do golpe. Foi uma boa leitura.', 'Seu ombro virou antes da mão. É ali que você entregou a entrada.'],
  tenten: ['Vou começar pelos arremessos. Tente cruzar o campo enquanto eu troco de mão.', 'Você quebrou minha mira mudando a distância. Vou treinar isso.', 'No meio do campo, você deu tempo para eu mirar de novo.'],
  shino: ['Vou testar o alcance. Se chegar perto, tente impedir minha saída.', 'Você cortou a rota de recuo. Isso decidiu a luta.', 'Mantive o espaço. Foi o suficiente.'],
};

async function spar(n: Npc) {
  if (!c) return;
  const who = { name: n.name, actor: n.actor };
  if (c.npcs[n.id].sparredDay === c.day) { await say(who, ['Hoje já chega de luta. Amanhã de novo.']); return; }
  if (c.stamina < 8) { await say(who, ['Você está acabado. Descansa primeiro, depois a gente luta.']); return; }
  await say(who, [SPAR_LINES[n.id]?.[0] ?? 'Vamos lá.']);
  c.npcs[n.id].sparredDay = c.day;
  const won = await runBattle(n.id, 'Treino de luta');
  await say(who, [won ? SPAR_LINES[n.id]?.[1] ?? 'Bom treino.' : SPAR_LINES[n.id]?.[2] ?? 'Bom treino.']);
  if (c.period === 1) afterAction();
}

// ——— Aulas ———
async function academyDoor() {
  if (!c) return;
  if (c.quest === 'matricula-ficha' || c.quest === 'matricula-entrega') { await say(null, ['A porta está fechada. Primeiro a matrícula: fale com Iruka em frente à escadaria.']); return; }
  if (c.period !== 0) { await say(null, ['As salas estão vazias a esta hora. A aula é de manhã.']); return; }
  if (c.lessonsDone.includes(c.day)) { await say(null, ['A aula de hoje já terminou.']); return; }
  if (c.rank === 'Genin') { await say(null, ['Você já se formou. A Academia agora é passado, e as missões são o futuro.']); return; }
  const session = academyMorning(c);
  if (session === 'exam') { await runExam(); return; }
  const lesson = todayLesson(c);
  if (session === 'free' || !lesson) {
    await offerAfternoon(retakeDay(c) !== null ? [`Sua repescagem é no dia ${retakeDay(c)}. Hoje o Campo de Treino está livre.`] :
      ['Hoje o Campo de Treino está livre.']);
    return;
  }
  await runLesson(lesson);
}

async function quiz(topic: string | undefined, count: number): Promise<number> {
  const rand = seededRand();
  const pool = QUESTIONS.filter((q) => !topic || q.topic === topic || topic === 'todas');
  const picked = [...pool].sort(() => rand() - 0.5).slice(0, count);
  let right = 0;
  const iruka = { name: 'Iruka', actor: actorFor('iruka') };
  for (const q of picked) {
    const ch = await say(iruka, [q.q], q.options.map((o, i) => ({ id: String(i), label: o })));
    if (Number(ch) === q.answer) { right++; toast('Correto!', 1100); } else toast(`Errado. Era: ${q.options[q.answer]}`, 1800);
  }
  return right / Math.max(1, picked.length);
}

const LESSON_PARTNER: Record<number, string> = { 3: 'daichi', 9: 'sasuke' };

async function runLesson(lesson: typeof LESSONS[number], makeup = false) {
  if (!c) return;
  lessonMode = true;
  enterMap('sala', 240, 172, 'up');
  await new Promise((r) => setTimeout(r, 650));
  const iruka = { name: 'Iruka', actor: actorFor('iruka') };
  await say(iruka, lesson.intro);
  let score = 0.5;
  if (lesson.kind === 'quiz') score = await quiz(lesson.quizTopic, 4);
  else if (lesson.kind === 'chakra') score = await runMini(new ChakraGame(c.stats['Controle de chakra']));
  else if (lesson.kind === 'kunai') score = await runMini(new KunaiGame(c.stats.Percepção));
  else if (lesson.kind === 'seals') score = await runMini(new SealsGame(5, seededRand(), 2.8));
  else if (lesson.kind === 'spar') {
    const partner = LESSON_PARTNER[lesson.day] ?? 'daichi';
    await say(iruka, [`${c.profile.name}, você fica com ${CHARACTERS[partner].name}. Lembrem-se: é treino. Ninguém sai machucado de verdade.`]);
    const won = await runBattle(partner, 'Aula de combate');
    score = won ? 0.85 : 0.45;
  }
  const res = applyTraining(c, lesson.trains, score, 0.55);
  if (lesson.teaches) learn(c, lesson.teaches, 10 + Math.round(score * 14));
  c.lessonsDone.push(lesson.day);
  c.lessonScores[lesson.day] = Math.round(score * 100);
  bond(c, 'iruka', { respeito: score > 0.6 ? 3 : 1 });
  const parts = [lesson.teaches ? `Você aprendeu ${JUTSUS[lesson.teaches].name} (domínio ${Math.round(c.jutsus[lesson.teaches])}%).` : '', res.gains.length ? `Evolução: ${res.gains.map((x) => `${x.stat} +${x.points}`).join(', ')}.` : ''].filter(Boolean);
  addLog(c, `Aula: ${lesson.title} (${Math.round(score * 100)} pontos). ${parts.join(' ')}`);
  await say(iruka, [score > 0.7 ? 'Muito bem! Foi um dos melhores da turma hoje.' : score > 0.45 ? 'Nada mal. Treine à tarde para fixar.' : 'Precisa praticar mais. O Campo de Treino fica aberto à tarde.', ...(parts.length ? [parts.join(' ')] : []), 'Dispensados! Até amanhã.']);
  lessonMode = false;
  if (!makeup) startAfternoon(c);
  else if (c.period === 1) spendAction(c);
  enterMap('rua', 450, 204, 'down');
  if (!makeup) toast('Tarde livre. O Campo de Treino fica a oeste, seguindo a rua.');
}

// ——— Exame de graduação ———
async function runExam() {
  if (!c) return;
  const retryDate = retakeDay(c);
  const retake = retryDate !== null;
  if (retryDate !== null && c.day < retryDate) {
    await offerAfternoon([`Sua repescagem é no dia ${retryDate}. Hoje o Campo de Treino está livre.`]);
    return;
  }
  lessonMode = true;
  enterMap('sala', 240, 172, 'up');
  await new Promise((r) => setTimeout(r, 650));
  const iruka = { name: 'Iruka', actor: actorFor('iruka') };
  await say(iruka, retake
    ? ['Repescagem. Só você e eu desta vez. Respire fundo.', 'Primeiro três perguntas. Depois, o Bunshin.']
    : ['Hoje é o exame de graduação. Primeiro, a prova escrita.', 'Depois, um por um, vocês vêm até a sala ao lado e fazem o Bunshin no Jutsu na minha frente.']);
  const written = await quiz('todas', 3);
  await say(iruka, ['Agora a prova prática. Quando estiver pronto, faça os selos e crie seus clones.']);
  const sealScore = await runMini(new SealsGame(6, seededRand(), 2.4));
  const mastery = c.jutsus.bunshin ?? 0;
  const { points, pass } = graduationGrade(mastery, sealScore, written, c.stats['Controle de chakra']);
  const report = `Nota ${points}/100 · mínimo ${EXAM_MINIMUM}. Escrita ${Math.round(written * 100)}%, selos ${Math.round(sealScore * 100)}%, domínio do Bunshin ${Math.round(mastery)}%.`;
  c.lessonsDone.push(c.day);
  if (pass) {
    c.rank = 'Genin';
    c.flags['exame:player'] = 'aprovado';
    c.reputation += 10; c.xp += 150;
    bond(c, 'iruka', { respeito: 10, confianca: 5 }, `Formou ${c.profile.name} como genin.`);
    addLog(c, `Exame de graduação: aprovado com ${points}/100. ${c.profile.name} agora é Genin.`);
    await say(iruka, [
      mastery >= 60 ? 'Três clones firmes do primeiro ao último. Excelente.' : 'Os clones ficaram de pé. Vamos à nota.',
      report,
      `Parabéns, ${c.profile.name}. Você está aprovado.`,
      'Aqui está a sua bandana. A partir de hoje você é um ninja da Folha. Na aba Ficha, você pode escolher onde usá-la.',
    ]);
    const passed = CLASSMATES.filter((id) => String(c!.flags[`exame:${id}`] ?? '').startsWith('aprovado')).map((id) => CHARACTERS[id].name);
    const failed = CLASSMATES.filter((id) => c!.flags[`exame:${id}`] === 'reprovado').map((id) => CHARACTERS[id].name);
    if (!retake && (passed.length || failed.length)) await say(iruka, [`Da turma, passaram: ${passed.join(', ') || 'ninguém ainda'}.${failed.length ? ` Não passaram: ${failed.join(', ')}.` : ''}`]);
  } else {
    c.flags['exame:player'] = 'reprovado';
    c.flags.repescagem = c.day + 3;
    addLog(c, `Exame de graduação: reprovado com ${points}/100. Repescagem marcada em três dias.`);
    await say(iruka, [
      mastery === 0 ? 'Você ainda não aprendeu o Bunshin. Sem ele não tenho como aprovar.' : 'O clone desfez antes de ficar de pé. Sinto muito, mas não posso aprovar assim.',
      report,
      `Sua repescagem será no dia ${c.day + 3}. Pratique o Bunshin no Campo de Treino ou fale comigo sobre uma aula perdida.`,
    ]);
  }
  lessonMode = false;
  startAfternoon(c);
  enterMap('rua', 450, 204, 'down');
  refresh();
}

async function ramen() {
  if (!c) return;
  const teuchi = { name: 'Teuchi' };
  if (c.period === 0) { await say(teuchi, ['Ainda estamos preparando o caldo. Volte mais tarde!']); return; }
  const ch = await say(teuchi, [`Bem-vindo ao Ichiraku! Uma tigela de lámen por 30 ryō. Você tem ${c.ryo}.`], [{ id: 'sim', label: 'Pedir lámen (recupera resistência e vida)' }, { id: 'nao', label: 'Só de passagem' }]);
  if (ch !== 'sim') return;
  if (c.ryo < 30) { await say(teuchi, ['Hmm, faltou um pouco. Fica para a próxima.']); return; }
  c.ryo -= 30;
  const v = maxVitals(c.stats);
  c.stamina = v.stamina; c.hp = Math.min(v.hp, c.hp + 15);
  const naruto = npcs.find((n) => n.id === 'naruto');
  if (naruto) { bond(c, 'naruto', { amizade: 5 }, 'Jantou comigo no Ichiraku.'); await say({ name: 'Naruto', actor: naruto.actor }, ['Você também gosta do Ichiraku?! Sabia que a gente ia se dar bem!']); }
  else await say(teuchi, ['Aqui está! Caldo quente para quem treinou o dia todo.']);
}

function advanceToAfternoon() {
  if (!c || c.period !== 0 || academyMorning(c) !== 'free') return false;
  startAfternoon(c);
  placeNpcs();
  save();
  refresh();
  return true;
}

async function offerAfternoon(lines: string[]) {
  if (!c || c.period !== 0 || academyMorning(c) !== 'free') return;
  const choice = await say(null, lines, [
    { id: 'sim', label: 'Começar a tarde de treino' }, { id: 'nao', label: 'Continuar a manhã' },
  ]);
  if (choice === 'sim') advanceToAfternoon();
}

async function home() {
  if (!c) return;
  if (c.period === 0 && academyMorning(c) === 'free') {
    const retryDate = retakeDay(c);
    await offerAfternoon(retryDate !== null ? [`A repescagem é no dia ${retryDate}. Quer seguir para a tarde de treino?`] :
      ['Quer seguir para a tarde de treino?']);
    return;
  }
  if (c.period === 0) { await say(null, [c.lessonsDone.includes(c.day) || c.day === 1 ? 'Ainda é cedo para voltar para casa.' : 'A aula começa logo. Melhor ir para a Academia.']); return; }
  if (c.period === 1) {
    const ch = await say(null, ['Descansar em casa até a noite? As ações restantes da tarde serão perdidas.'], [{ id: 'sim', label: 'Descansar até a noite' }, { id: 'nao', label: 'Continuar a tarde' }]);
    if (ch === 'sim') { c.period = 2; c.actions = 0; c.stamina = maxVitals(c.stats).stamina; placeNpcs(); }
    return;
  }
  const ch = await say(null, ['Dormir e encerrar o dia?'], [{ id: 'sim', label: 'Dormir' }, { id: 'nao', label: 'Ainda não' }]);
  if (ch !== 'sim') return;
  await endDay();
}

async function endDay() {
  if (!c) return;
  for (const e of dueEvents(c, 'night')) {
    const p = e.prompt?.(c);
    const choice = p ? await say({ name: p.speaker, actor: p.role ? actorFor(p.role) : undefined }, p.lines, p.choices) : undefined;
    const news = resolveEvent(c, e, choice);
    if (news) await say(null, [news]);
  }
  busy = true;
  $('fade').classList.add('on');
  await new Promise((r) => setTimeout(r, 450));
  sleep(c);
  c.ryo += c.day % 7 === 1 ? 50 : 0;
  addLog(c, `Dia ${c.day} começou.`);
  enterMap('rua', 117, 437, 'up', false);
  $('fade').classList.remove('on');
  busy = false;
  const news: string[] = [];
  for (const e of dueEvents(c, 'dawn')) { const n = resolveEvent(c, e); if (n) news.push(n); }
  placeNpcs();
  save();
  refresh();
  if (news.length) await say({ name: 'Notícias da vila' }, news);
  else toast(`Dia ${c.day}. ${objective(c)}.`);
  if (c.flags['academia-concluida'] && !c.flags['fim-era-visto']) {
    c.flags['fim-era-visto'] = true;
    save();
    await say({ name: 'Era da Academia concluída' }, [
      `${c.profile.name} deixou a Academia como genin da Folha, com ${c.wins} vitórias em treinos e ${Object.keys(c.jutsus).length} técnicas aprendidas.`,
      'Seu sensei está esperando no Campo de Treino. Siga a seta para encontrar a equipe.',
    ]);
  }
}

// ——— Movimento ———
function face(dx: number, dy: number, prev: Dir): Dir {
  if (Math.abs(dx) + Math.abs(dy) < 0.01) return prev;
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
}

function moveNpcs(dt: number) {
  if (!c) return;
  for (const n of npcs) {
    n.frame = -1;
    if (!n.route.length || busy) continue;
    if (n.rest > 0) { n.rest -= dt; continue; }
    const [tx, ty] = n.route[n.idx], dx = tx - n.x, dy = ty - n.y, rem = Math.hypot(dx, dy);
    if (rem < 0.1) { n.idx = (n.idx + 1) % n.route.length; n.rest = 1.6 + (n.id.length % 3); n.dist = 0; continue; }
    const step = Math.min(22 * dt, rem), x = n.x + (dx * step) / rem, y = n.y + (dy * step) / rem;
    n.dir = face(dx, dy, n.dir);
    if (Math.abs(x - c.x) < 10 && Math.abs(y - c.y) < 5) continue;
    n.x = x; n.y = y; n.dist += step; n.frame = Math.floor(n.dist / 5.3) % 4;
  }
}

function update(dt: number) {
  if (!c) return;
  const dx = Number(held.has('right')) - Number(held.has('left')), dy = Number(held.has('down')) - Number(held.has('up'));
  let moved = false;
  if ((dx || dy) && !busy && !blockedWrites) {
    const v = (78 + c.stats.Velocidade * 1.5) * dt / Math.hypot(dx, dy);
    c.dir = dy < 0 ? 'up' : dy > 0 ? 'down' : dx > 0 ? 'right' : 'left';
    const m = map(), x0 = c.x, y0 = c.y;
    const ok = (a: number, b: number) => !blocked(m, a, b) && !npcs.some((n) => Math.abs(a - n.x) < 8 && Math.abs(b - n.y) < 5);
    if (ok(c.x + dx * v, c.y)) c.x += dx * v;
    if (ok(c.x, c.y + dy * v)) c.y += dy * v;
    moved = x0 !== c.x || y0 !== c.y;
    if (moved) {
      phase += Math.hypot(c.x - x0, c.y - y0) / 8; dirty = true;
      const exit = m.exits.find((e) => c!.x >= e.rect.x && c!.x <= e.rect.x + e.rect.w && c!.y >= e.rect.y && c!.y <= e.rect.y + e.rect.h);
      if (exit) {
        if (exit.to === 'campo' && c.quest.startsWith('matricula')) { c.x = x0; c.y = y0; toast('Primeiro a matrícula: a ficha está no quadro de avisos.'); }
        else enterMap(exit.to, exit.arrive.x, exit.arrive.y, exit.arrive.dir);
      }
    }
  }
  walkFrame = moved ? Math.floor(phase) % 4 : -1;
  moveNpcs(dt);
  const next = busy ? null : nearestContact();
  const key = (x: typeof contact) => (x ? (x.kind === 'npc' ? 'n' + x.npc.id : 's' + x.id) : '');
  if (key(next) !== key(contact)) {
    contact = next;
    const b = $<HTMLButtonElement>('use');
    b.disabled = !contact;
    b.setAttribute('aria-label', contact ? `Interagir: ${contact.kind === 'npc' ? contact.npc.name : contact.label}` : 'Interagir');
  }
  const t = limits(), ease = 1 - Math.exp(-dt * 9);
  camera.x += (t.x - camera.x) * ease; camera.y += (t.y - camera.y) * ease;
  c.playtime += dt;
  if (dirty && clock - savedAt > 2) { save(); savedAt = clock; }
}

// ——— Desenho ———
function paintWorld(gg: CanvasRenderingContext2D, m: GameMap, cam: { x: number; y: number }, w: number, h: number, actors: { y: number; draw: () => void }[], period: Period, ambient = true) {
  gg.setTransform(1, 0, 0, 1, 0, 0);
  gg.fillStyle = '#1c292a'; gg.fillRect(0, 0, w, h);
  const ox = Math.round(cam.x), oy = Math.round(cam.y);
  gg.translate(-ox, -oy);
  gg.drawImage(m.ground, 0, 0);
  const list = m.things
    .filter((o) => o.x + o.img.width / 2 >= ox && o.x - o.img.width / 2 <= ox + w && o.y >= oy && o.y - o.img.height <= oy + h)
    .map((o) => ({ y: o.depth, draw: () => gg.drawImage(o.img, Math.round(o.x - o.img.width / 2), o.y - o.img.height) }));
  for (const e of m.extra ?? []) if (e.img.complete && e.img.naturalWidth) list.push({ y: e.depth, draw: () => gg.drawImage(e.img, e.x, e.y) });
  list.push(...actors);
  list.sort((a, b) => a.y - b.y).forEach((a) => a.draw());
  if (ambient) m.ambient?.(gg, calm.matches ? 0 : clock, calm.matches);
  if (!m.interior && period > 0) {
    gg.setTransform(1, 0, 0, 1, 0, 0);
    gg.fillStyle = period === 1 ? 'rgba(255,170,80,.10)' : 'rgba(18,28,70,.48)';
    gg.fillRect(0, 0, w, h);
    if (period === 2) {
      gg.globalCompositeOperation = 'lighter';
      for (const l of m.lights) {
        const x = l.x - ox, y = l.y - oy;
        if (x < -l.r || y < -l.r || x > w + l.r || y > h + l.r) continue;
        const grd = gg.createRadialGradient(x, y, 2, x, y, l.r);
        grd.addColorStop(0, 'rgba(255,190,110,.42)'); grd.addColorStop(1, 'rgba(255,150,60,0)');
        gg.fillStyle = grd; gg.fillRect(x - l.r, y - l.r, l.r * 2, l.r * 2);
      }
      gg.globalCompositeOperation = 'source-over';
    }
    gg.translate(-ox, -oy);
  }
}

function paint() {
  if (!c) return;
  const m = map();
  const actors = npcs.map((n) => ({ y: n.y, draw: () => drawActor(g, n.x, n.y, n.actor, n.dir, n.frame < 0 ? idlePose(clock, n.x * 0.017, calm.matches) : n.frame) }));
  for (const spot of missionSpots()) actors.push({ y: spot.y, draw: () => drawMissionSpot(spot) });
  const me: Actor = { role: 'player', look: { ...c.profile }, bandana: c.rank !== 'Estudante da Academia' };
  actors.push({ y: c.y, draw: () => drawActor(g, c!.x, c!.y, me, c!.dir, walkFrame < 0 ? idlePose(clock, 0, calm.matches) : walkFrame, clock < gestureUntil) });
  paintWorld(g, m, camera, cv.width, cv.height, actors, c.period);
  if (contact && !busy) {
    const [x, y] = contact.kind === 'npc' ? [contact.npc.x, contact.npc.y - (contact.npc.actor.role === 'iruka' || contact.npc.actor.role === 'gen' ? 52 : 46)] : (() => { const s = worldSpots().find((s2) => s2.id === (contact as { id: string }).id)!; return [s.x, s.y - 30]; })();
    const bob = calm.matches ? 0 : Math.round(Math.sin(clock * 5));
    px(g, x - 5, y + bob, 11, 7, '#5e4636'); px(g, x - 4, y + 1 + bob, 9, 5, '#f8e8b6'); px(g, x, y + 6 + bob, 2, 2, '#5e4636');
    for (let i = 0; i < 3; i++) px(g, x - 2 + i * 2, y + 3 + bob, 1, 1, '#8b5036');
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  drawQuestArrow();
}

// ——— Seta de objetivo ———
const EXIT_TO: Partial<Record<MapId, { x: number; y: number }>> = { campo: { x: 622, y: 240 }, sala: { x: 240, y: 262 } };

function questLocation(): MapGoal | null {
  if (!c || missionDeferred(c)) return null;
  let goal: MapGoal | null = null;
  const session = academyMorning(c);
  const lessonPending = c.period === 0 && (session === 'lesson' || session === 'exam');
  const stage = geninStage(c);
  if (stage === 'suprimentos') {
    const spot = SUPPLIES.find(({ id }) => !c!.flags[id]);
    if (spot) {
      const ally = teamMembers(c)[SUPPLIES.indexOf(spot)];
      goal = { map: 'campo', x: spot.x + (ally ? 23 : 0), y: spot.y - (ally ? 3 : 0), lift: ally ? 44 : 13 };
    }
  } else if (stage === 'busca') {
    if (c.flags['tora-rastro']) goal = { map: 'campo', ...toraSpot(c), lift: 15 };
    else goal = { map: 'campo', x: 318, y: 266, lift: 0, regional: true };
  }
  else if (stage === 'selo-pistas' && sealClueCount(c) < SEAL_CLUES.length) {
    const clue = SEAL_CLUES.find(({ id }) => !c!.flags[id])!;
    goal = { map: 'rua', x: clue.x, y: clue.y, lift: 15 };
  } else if (stage === 'patrulha-rota') {
    const spot = nextPatrolPost(c);
    goal = spot ? { map: 'campo', x: spot.x, y: spot.y, lift: 22 } : { map: 'campo', ...MAKI_SPOT, lift: 45 };
  } else if (stage === 'ondas') {
    goal = { map: 'rua', ...TAZUNA_SPOT, lift: 50 };
  } else if (stage) {
    const spot = mentorLocation(stage);
    if (spot) goal = { ...spot, lift: 53 };
  } else if (c.quest === 'matricula-ficha') goal = { map: 'rua', x: 308, y: 212, lift: 34 };
  else if (c.quest === 'matricula-entrega') {
    const ir = npcs.find((n) => n.id === 'iruka');
    goal = { map: 'rua', x: ir?.x ?? 458, y: ir?.y ?? 222, lift: 56 };
  } else if (lessonPending) goal = { map: 'rua', x: 450, y: 190, lift: 22 };
  else if (c.period === 2 && extraTrainingLeft(c) && c.map === 'campo') goal = { map: 'campo', x: 300, y: 196, lift: 32 };
  else if (c.period === 2) goal = { map: 'rua', x: 117, y: 434, lift: 30 };
  else if (c.period === 1 || (c.period === 0 && session === 'free' && retakeDay(c) !== null)) goal = { map: 'campo', x: 318, y: 266, lift: 0, regional: true };
  return goal;
}

/** A seta leva à passagem quando o objetivo fica em outra área. */
function questTarget(): { x: number; y: number; lift: number } | null {
  if (!c) return null;
  const goal = questLocation();
  if (!goal) return null;
  if (goal.regional && (c.map === goal.map || (geninStage(c) !== 'busca' && c.map !== 'rua'))) return null;
  if (goal.map !== c.map) {
    if (c.map === 'rua' && goal.map === 'campo') return { x: 22, y: 248, lift: 18 };
    const ex = EXIT_TO[c.map];
    return ex ? { x: ex.x, y: ex.y, lift: 18 } : null;
  }
  if (Math.hypot(c.x - goal.x, c.y - goal.y) < 30) return null;
  return goal;
}

function arrowShape(x: number, y: number, angle: number) {
  g.save();
  g.translate(Math.round(x), Math.round(y));
  g.rotate(angle);
  g.beginPath();
  g.moveTo(7, 0); g.lineTo(-1, -7); g.lineTo(-1, -3); g.lineTo(-7, -3); g.lineTo(-7, 3); g.lineTo(-1, 3); g.lineTo(-1, 7);
  g.closePath();
  g.lineJoin = 'miter'; g.lineWidth = 3; g.strokeStyle = '#2b1a10'; g.stroke();
  g.fillStyle = '#f0c27a'; g.fill();
  g.fillStyle = '#fff1d2'; g.fillRect(-6, -2, 6, 1);
  g.restore();
}

function drawQuestArrow() {
  const t = busy ? null : questTarget();
  if (!t) return;
  const bob = calm.matches ? 0 : Math.round(Math.sin(clock * 5) * 2);
  const sx = t.x - Math.round(camera.x), sy = t.y - t.lift - Math.round(camera.y);
  const m = 16, w = cv.width, h = cv.height;
  if (sx > m && sx < w - m && sy > m + 20 && sy < h - m) { arrowShape(sx, sy - 6 + bob, Math.PI / 2); return; }
  // Fora da tela: seta na borda apontando para o alvo (8 direções, para manter o pixel nítido).
  const cx = w / 2, cy = h / 2;
  const raw = Math.atan2(sy - cy, sx - cx);
  const ang = Math.round(raw / (Math.PI / 4)) * (Math.PI / 4);
  const ex = Math.max(m, Math.min(w - m, cx + Math.cos(raw) * w));
  const ey = Math.max(m + 44, Math.min(h - m, cy + Math.sin(raw) * h));
  const pulse = calm.matches ? 0 : Math.round(Math.sin(clock * 6) * 2);
  arrowShape(ex - Math.cos(ang) * pulse, ey - Math.sin(ang) * pulse, ang);
}

// ——— Capa animada (mesmo canvas, atrás das telas de menu) ———
const coverCast = Object.entries(DAY1).map(([id, s2]) => ({ id, ...s2 }));
function paintCover() {
  const m = maps.rua;
  const span = Math.max(0, m.w - cv.width);
  const x = calm.matches ? span * 0.45 : span * (0.5 + Math.sin(clock * 0.06) * 0.42);
  const y = Math.max(0, Math.min(m.h - cv.height, 236 - cv.height * 0.6));
  const actors = coverCast.map((n) => ({ y: n.y, draw: () => drawActor(g, n.x, n.y, { role: CHARACTERS[n.id].role }, n.dir, idlePose(clock, n.x * 0.017, calm.matches)) }));
  paintWorld(g, m, { x, y }, cv.width, cv.height, actors, 0);
  g.setTransform(1, 0, 0, 1, 0, 0);
}

// ——— Menu ———
type Tab = 'ficha' | 'tecnicas' | 'relacoes' | 'diario' | 'calendario' | 'itens' | 'mapa' | 'sistema';
const TABS: [Tab, string][] = [['ficha', 'Ficha'], ['tecnicas', 'Técnicas'], ['relacoes', 'Relações'], ['diario', 'Diário'], ['calendario', 'Calendário'], ['itens', 'Itens'], ['mapa', 'Mapa'], ['sistema', 'Sistema']];
let tab: Tab = 'ficha';
function el(tag: string, cls = '', text = '') { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
function row(a: string, b: string) { const r = el('div', 'row'); r.append(el('span', '', a), el('b', '', b)); return r; }
function bar(v: number) { const b = el('div', 'bar-mini'); const i = el('i'); i.style.width = Math.max(0, Math.min(100, v)) + '%'; b.append(i); return b; }

function openMenu() {
  if (!c || busy) return;
  held.clear();
  $('menuName').textContent = c.profile.name;
  $('menuSub').textContent = `${c.rank} · Dia ${c.day} · ${PERIODS[c.period]} · ${c.ryo} ryō`;
  refreshMenuPortrait();
  renderMenu();
  $<HTMLDialogElement>('menu').showModal();
}
function refreshMenuPortrait() {
  const g = $<HTMLCanvasElement>('menuFace').getContext('2d')!;
  g.imageSmoothingEnabled = false;
  g.drawImage(portrait(playerActor()), 0, 0);
}

function bandanaPicker(camp: Campaign) {
  const card = el('section', 'bandana-picker');
  const controls = el('div', 'bandana-controls');
  const label = document.createElement('label');
  label.htmlFor = 'bandana-position';
  label.textContent = 'Posição da bandana';
  const picker = document.createElement('select');
  picker.id = label.htmlFor;
  for (const [position, name] of Object.entries(BAND_POSITIONS)) picker.add(new Option(name, position));
  picker.value = bandPositionOf(camp.profile);
  controls.append(label, picker);
  const preview = document.createElement('canvas');
  preview.width = 160;
  preview.height = 94;
  preview.setAttribute('role', 'img');
  preview.setAttribute('aria-label', 'Prévia do personagem de frente e de perfil');
  const g = preview.getContext('2d')!;
  g.scale(2, 2);
  g.imageSmoothingEnabled = false;
  const redraw = () => {
    g.clearRect(0, 0, 80, 47);
    const actor = playerActor();
    drawActor(g, 20, 44, actor, 'down', -1);
    drawActor(g, 60, 44, actor, 'right', -1);
  };
  picker.onchange = () => {
    const previous = bandPositionOf(camp.profile);
    const next = bandPositionOf({ bandPosition: picker.value });
    if (next === previous || c !== camp) return;
    camp.profile.bandPosition = next;
    if (!save()) {
      camp.profile.bandPosition = previous;
      picker.value = previous;
    }
    refresh();
    refreshMenuPortrait();
    redraw();
  };
  redraw();
  card.append(controls, preview);
  return card;
}

function gearBenefit(gear: (typeof GEAR)[GearId]) {
  return 'stat' in gear ? `+${gear.bonus} ${gear.stat}` : `−${Math.round(gear.reduction * 100)}% de dano recebido`;
}

function renderMenu() {
  if (!c) return;
  const tabs = $('tabs');
  tabs.replaceChildren(...TABS.map(([id, label]) => { const b = el('button', '', label); b.setAttribute('aria-selected', String(id === tab)); b.onclick = () => { tab = id; renderMenu(); if (id === 'mapa') tabs.querySelector<HTMLButtonElement>('[aria-selected=true]')?.focus(); }; return b; }));
  const body = $('tabBody');
  body.replaceChildren();
  if (tab === 'ficha') {
    const mastery = Object.values(c.jutsus).reduce((a, b) => a + b, 0);
    const effective = combatStats(c);
    const power = combatPower(effective, mastery);
    const bonus = power - combatPower(c.stats, mastery);
    body.append(el('p', 'muted', origin(c.profile)));
    const g2 = el('div', 'grid2');
    g2.append(row('Patente', c.rank), row('Nível', String(level(c))), row('Poder de combate', bonus ? `${power} (+${bonus})` : String(power)), row('Reputação', String(c.reputation)),
      row('Clã', c.profile.clan), row('Afinidade', c.profile.element), row('Aldeia natal', c.profile.village), row('Idade', `${c.age} anos`));
    body.append(g2);
    const gearId = equippedGear(c);
    if (gearId) {
      const gear = GEAR[gearId];
      body.append(row(gear.name, gearBenefit(gear)));
    }
    if (c.rank !== 'Estudante da Academia') body.append(bandanaPicker(c));
    body.append(el('h3', '', 'Atributos'));
    const g3 = el('div', 'grid2');
    for (const s of ACADEMY_STATS) {
      const d = el('div');
      const drill = trainingFor(s);
      const bonus = effective[s] - c.stats[s];
      d.append(row(s, bonus ? `${effective[s]} (+${bonus})` : String(effective[s])), bar(progressPercent(c, s)));
      if (drill) d.append(el('small', 'stat-training', drill.station));
      g3.append(d);
    }
    body.append(g3);
  } else if (tab === 'tecnicas') {
    const heritage = yukiHint(c);
    if (heritage) {
      const card = el('div', 'card');
      card.append(row('Herança Yuki', 'Hyōton'), el('p', 'muted', heritage));
      body.append(card);
    }
    const known = campaignJutsus(c);
    if (!known.length) body.append(el('p', '', 'Nenhuma técnica aprendida ainda. As aulas de Iruka ensinam Henge, Kawarimi e Bunshin.'));
    for (const j of known) {
      const card = el('div', 'card');
      card.append(row(`${j.name} · rank ${j.rank}`, `${Math.round(c.jutsus[j.id])}%`), bar(c.jutsus[j.id]), el('p', 'muted', `${j.meaning}. ${j.description} Usa ${j.chakraCost} de chakra.`));
      body.append(card);
    }
  } else if (tab === 'relacoes') {
    for (const id of ['iruka', ...CLASSMATES, ...GUY_TEAM, ...new Set(['guy', ...(geninStage(c) ? [senseiId(c)] : [])])]) {
      const n = c.npcs[id], d = CHARACTERS[id], card = el('div', 'card');
      card.append(row(d.name + (d.original ? ' (original)' : ''), bondLabel(n.bond)),
        el('p', 'muted', `Amizade ${n.bond.amizade} · Rivalidade ${n.bond.rivalidade} · Respeito ${n.bond.respeito} · Confiança ${n.bond.confianca}`));
      if (n.memory.length) card.append(el('p', 'muted', 'Lembra: ' + n.memory.slice(0, 3).join(' · ')));
      body.append(card);
    }
  } else if (tab === 'diario') {
    const stage = geninStage(c);
    const preferred = guyPreference(c);
    if (preferred && !stage) body.append(row('Preferência de equipe', `Time Guy · ${CHARACTERS[preferred].name}`));
    if (stage) {
      body.append(row('Sensei', CHARACTERS[senseiId(c)].name),
        row('Equipe', [c.profile.name, ...teamMembers(c).map((id) => CHARACTERS[id].name)].join(' · ')),
        el('p', '', objective(c)));
    }
    const offer = pendingMission(c);
    if (offer) body.append(row(MISSION_OFFERS[offer].name, missionDeferred(c) ? 'Adiada' : 'Disponível'));
    const ol = el('ol', 'log');
    for (const l of c.log.slice(0, 60)) ol.append(el('li', '', `Dia ${l.day} · ${l.text}`));
    body.append(ol);
  } else if (tab === 'calendario') {
    body.append(row('Hoje', `Dia ${c.day} · ${WEEKDAYS[(c.day - 1) % 7]} · ${PERIODS[c.period]}`));
    if (c.rank === 'Genin' && c.period === 0) {
      const afternoon = el('button', 'ghost', 'Avançar para a tarde') as HTMLButtonElement;
      afternoon.onclick = () => { if (advanceToAfternoon()) $<HTMLDialogElement>('menu').close(); };
      const actions = el('div', 'agenda-actions');
      actions.append(afternoon);
      body.append(actions);
    }
    body.append(el('h3', '', 'Aulas da Academia'));
    for (const l of LESSONS) body.append(row(`Dia ${l.day} · ${l.title}`, c.lessonsDone.includes(l.day) ? 'feita' : l.day < c.day ? 'perdida' : 'a fazer'));
    const ex = c.flags['exame:player'];
    body.append(row(`Dia ${EXAM_DAY} · Exame de graduação`, ex === 'aprovado' ? 'aprovado' : ex === 'reprovado' ? `repescagem no dia ${retakeDay(c)}` : 'a fazer'));
  } else if (tab === 'itens') {
    body.append(row('Ryō', String(c.ryo)));
    if (Object.keys(GEAR).some((id) => c!.inventory[id])) body.append(el('h3', '', 'Equipamento ativo'));
    for (const [id, gear] of Object.entries(GEAR)) {
      if (!c.inventory[id]) continue;
      const active = id === equippedGear(c);
      const card = el('div', 'card');
      const button = el('button', '', active ? 'Desequipar' : 'Equipar');
      button.onclick = () => {
        if (!c) return;
        if (active) delete c.flags.equipado; else c.flags.equipado = id;
        dirty = true;
        save();
        renderMenu();
      };
      card.append(row(gear.name, gearBenefit(gear)), button);
      body.append(card);
    }
    for (const [id, n] of Object.entries(c.inventory)) if (n > 0 && !Object.hasOwn(GEAR, id)) body.append(row(ITEMS[id]?.name ?? id, `× ${n}`));
    if ((c.inventory.onigiri ?? 0) > 0) {
      const b = el('button', '', 'Comer onigiri (+12 resistência)') as HTMLButtonElement;
      b.onclick = () => { if (!c) return; c.inventory.onigiri--; c.stamina = Math.min(maxVitals(c.stats).stamina, c.stamina + 12); dirty = true; refresh(); renderMenu(); };
      body.append(el('br'), b);
    }
  } else if (tab === 'mapa') {
    renderMapAtlas(body, {
      maps, player: c, objective: objective(c), goal: questLocation(), missionSpots,
      paint: (g, area) => paintWorld(g, area, { x: 0, y: 0 }, area.w, area.h, [], 0, false),
    });
  } else if (tab === 'sistema') {
    const wrap = el('div', 'btnrow');
    const b1 = el('button', '', 'Salvar agora') as HTMLButtonElement; b1.onclick = () => save(true);
    const b2 = el('button', '', zoomCloser ? 'Afastar câmera' : 'Aproximar câmera') as HTMLButtonElement; b2.onclick = () => { zoomCloser = !zoomCloser; size(); camera = limits(); renderMenu(); };
    const b3 = el('button', '', 'Voltar às campanhas') as HTMLButtonElement; b3.onclick = () => { save(); $<HTMLDialogElement>('menu').close(); openSlots(); };
    const b4 = el('button', '', `Música: ${audio.music ? 'ligada' : 'desligada'}`) as HTMLButtonElement; b4.onclick = () => { audio.setMusic(!audio.music); renderMenu(); };
    const b5 = el('button', '', `Efeitos: ${audio.sfxOn ? 'ligados' : 'desligados'}`) as HTMLButtonElement; b5.onclick = () => { audio.setSfx(!audio.sfxOn); renderMenu(); };
    const backup = el('button', '', 'Exportar save') as HTMLButtonElement;
    backup.onclick = () => { if (c) exportSave(c, slot); };
    wrap.append(b1, backup, b4, b5, b2, b3);
    body.append(wrap, el('p', 'muted', `Versão ${GAME_VERSION} · Dificuldade ${LABELS[c.settings.difficulty]} · ${LABELS[c.settings.fidelity]} · Tempo de jogo ${Math.round(c.playtime / 60)} min.`));
  }
}
$('btnMenu').onclick = openMenu;
$('closeMenu').onclick = () => $<HTMLDialogElement>('menu').close();

// ——— Entrada ———
const DIRS: Record<string, string> = { w: 'up', a: 'left', s: 'down', d: 'right', arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right' };
let choiceIndex = 0;
function markChoice(i: number) {
  const list = [...$('choices').querySelectorAll<HTMLButtonElement>('button')];
  if (!list.length) return;
  choiceIndex = (i + list.length) % list.length;
  list.forEach((b, k) => b.setAttribute('aria-current', String(k === choiceIndex)));
  list[choiceIndex].focus();
}
function menuKeys(e: KeyboardEvent, box: HTMLElement) {
  const k = e.key.toLowerCase();
  const list = menuButtons(box);
  const active = document.activeElement;
  if (active instanceof HTMLButtonElement && !box.contains(active) && active.closest('#s-slots') && [' ', 'enter'].includes(k)) return;
  if (DIRS[k] === 'up' || DIRS[k] === 'left') { e.preventDefault(); setCurrent(box, menuIndex - 1); list[menuIndex]?.focus(); audio.sfx('hover'); }
  else if (DIRS[k] === 'down' || DIRS[k] === 'right') { e.preventDefault(); setCurrent(box, menuIndex + 1); list[menuIndex]?.focus(); audio.sfx('hover'); }
  else if ((k === 'enter' || k === 'e' || k === ' ') && !e.repeat) {
    e.preventDefault();
    (active instanceof HTMLButtonElement && list.includes(active) ? active : list[menuIndex])?.click();
  }
}
function createKeys(e: KeyboardEvent) {
  const k = e.key;
  if (document.activeElement === $('f_name') && !['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(k)) return;
  const opts = CREATE_TABS[createTab].opts;
  const tabFocus = $('ctabs').contains(document.activeElement);
  if ((tabFocus && k === 'ArrowLeft') || k === 'q' || k === 'PageUp') { e.preventDefault(); selectCreateTab((createTab + CREATE_TABS.length - 1) % CREATE_TABS.length, true); }
  else if ((tabFocus && k === 'ArrowRight') || k === 'e' || k === 'PageDown') { e.preventDefault(); selectCreateTab((createTab + 1) % CREATE_TABS.length, true); }
  else if (k === 'ArrowUp' || k === 'ArrowDown') {
    e.preventDefault();
    const step = k === 'ArrowUp' ? -1 : 1;
    createRow = (createRow + step + opts.length) % opts.length;
    $('rows').querySelectorAll('.opt')[createRow]?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
    audio.sfx('hover');
  }
  else if (k === 'ArrowLeft' || k === 'a') { e.preventDefault(); cycleOpt(-1); audio.sfx('tick'); }
  else if (k === 'ArrowRight' || k === 'd') { e.preventDefault(); cycleOpt(1); audio.sfx('tick'); }
  else if (k === 'Escape') { e.preventDefault(); openSlots(); }
}
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || deleteDialog.open) return;
  const k = e.key.toLowerCase();
  if (screen === 'title') { menuKeys(e, $('mainmenu')); return; }
  if (screen === 'slots') { if (k === 'escape') openTitle(); else menuKeys(e, $('slots')); return; }
  if (screen === 'create') { createKeys(e); return; }
  if ($<HTMLDialogElement>('menu').open) return;
  if (mini) {
    if (k === 'escape' && !miniCancel.hidden) { e.preventDefault(); miniCancel.click(); }
    else if ((k === 'e' || k === ' ' || k === 'enter') && !e.repeat && !(e.target instanceof HTMLButtonElement && $('mini').contains(e.target))) { e.preventDefault(); mini.press(true); }
    else if (/^[1-4]$/.test(k) && mini.choose && !e.repeat) { e.preventDefault(); mini.choose(Number(k) - 1); renderMiniOptions(); }
    return;
  }
  if (battleScene) {
    const list = [...document.querySelectorAll<HTMLButtonElement>('#battle .cmds button:not(:disabled)')];
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    const cols = Math.max(1, Math.round(($('battle').querySelector('.cmds') as HTMLElement).clientWidth / 156));
    const mv = { arrowleft: -1, a: -1, arrowright: 1, d: 1, arrowup: -cols, w: -cols, arrowdown: cols, s: cols }[k];
    if (mv && list.length) { e.preventDefault(); list[Math.max(0, Math.min(list.length - 1, (i < 0 ? 0 : i + mv)))].focus(); }
    else if (k === 'e' && list.length && !e.repeat) { e.preventDefault(); (i >= 0 ? list[i] : list[0]).click(); }
    return;
  }
  if (dialogResolve) {
    const atChoices = dialogChoices.length > 0 && dialogIndex >= dialogLines.length - 1;
    if (atChoices) {
      if (/^[1-9]$/.test(k) && dialogChoices[Number(k) - 1]) { e.preventDefault(); audio.sfx('confirm'); closeDialog(dialogChoices[Number(k) - 1].id); }
      else if (DIRS[k] === 'up') { e.preventDefault(); markChoice(choiceIndex - 1); audio.sfx('hover'); }
      else if (DIRS[k] === 'down') { e.preventDefault(); markChoice(choiceIndex + 1); audio.sfx('hover'); }
      else if ((k === 'e' || k === 'enter' || k === ' ') && !e.repeat) { e.preventDefault(); audio.sfx('confirm'); closeDialog(dialogChoices[choiceIndex].id); }
    } else if ((k === 'e' || k === 'enter' || k === ' ') && !e.repeat) { e.preventDefault(); advanceDialog(); }
    return;
  }
  if (k === 'escape') { e.preventDefault(); openMenu(); return; }
  if (DIRS[k]) { e.preventDefault(); held.add(DIRS[k]); }
  else if ((k === 'e' || k === 'enter' || k === ' ') && !e.repeat) { e.preventDefault(); void interact(); }
});
window.addEventListener('keyup', (e) => {
  held.delete(DIRS[e.key.toLowerCase()]);
  const k = e.key.toLowerCase();
  if (mini && (k === 'e' || k === ' ' || k === 'enter')) mini.press(false);
});
const miniAction = $<HTMLButtonElement>('mini-action');
miniAction.onpointerdown = (event) => {
  if (!mini) return;
  event.preventDefault();
  miniAction.setPointerCapture(event.pointerId);
  mini.press(true);
};
miniAction.onlostpointercapture = () => mini?.press(false);
miniAction.onpointerup = () => mini?.press(false);
miniAction.onpointercancel = () => mini?.press(false);
miniAction.onclick = (event) => {
  if (event.detail === 0) { mini?.press(true); mini?.press(false); }
};
$('app').addEventListener('pointerdown', (e) => { if (mini && !(e.target instanceof HTMLButtonElement)) mini.press(true); });
window.addEventListener('pointerup', () => mini?.press(false));
window.addEventListener('blur', () => held.clear());
document.querySelectorAll<HTMLButtonElement>('[data-d]').forEach((b) => {
  b.onpointerdown = (e) => { e.preventDefault(); b.setPointerCapture(e.pointerId); held.add(b.dataset.d!); };
  b.onpointerup = b.onpointercancel = b.onlostpointercapture = () => held.delete(b.dataset.d!);
});
$('use').onpointerdown = (e) => { if (mini) { e.preventDefault(); mini.press(true); } };
$('use').onclick = () => void (mini ? undefined : dialogResolve ? (dialogChoices.length && dialogIndex >= dialogLines.length - 1 ? undefined : advanceDialog()) : interact());
$('talk').onclick = (e) => { if (!(e.target instanceof HTMLButtonElement)) advanceDialog(); };

// ——— Laço principal ———
function loop(ms: number) {
  const dt = Math.min((ms - last) / 1000, 0.045);
  last = ms;
  if (!document.hidden) {
    clock += dt;
    if (screen === 'game' && c) {
      if (battleScene) { battleScene.setSize(cv.width, cv.height); battleScene.update(dt); battleScene.render(g, cv.width, cv.height); }
      else {
        if (!$<HTMLDialogElement>('menu').open && !mini) update(dt);
        paint();
        if (mini) { miniTick(dt); mini?.render(g, cv.width, cv.height); }
      }
    } else {
      paintCover();
      if (screen === 'create') drawPreview();
    }
  }
  requestAnimationFrame(loop);
}
size();
spritesReady.then(() => { openTitle(); requestAnimationFrame(loop); });

// Gancho de testes automáticos (só no modo de desenvolvimento).
if (import.meta.env.DEV) {
  Object.assign(window, {
    __game: {
      get c() { return c; },
      teleport(map: MapId, x: number, y: number) { enterMap(map, x, y, 'down', false); },
      interact: () => interact(),
      advance: () => advanceDialog(),
      choose: (id: string) => closeDialog(id),
      get dialog() { return dialogResolve ? { lines: dialogLines, index: dialogIndex, choices: dialogChoices } : null; },
      get contact() { return contact; },
      get landmarks() { return { npcs: npcs.map(({ id, x, y }) => ({ id, x, y })), spots: worldSpots(), exits: map().exits }; },
      walkable(x: number, y: number) { return !blocked(map(), x, y) && !npcs.some((n) => Math.abs(x - n.x) < 8 && Math.abs(y - n.y) < 5); },
      battle: (id: string) => runBattle(id, 'Treino de luta'),
      train: (k: 'troncos' | 'alvos' | 'meditacao') => trainSpot(k),
      get mini() { return mini; },
      exam: () => runExam(),
      bench() { const t = performance.now(); for (let i = 0; i < 120; i++) { update(1 / 60); paint(); } return (performance.now() - t) / 120; },
    },
  });
}

// ——— Som ———
const unlockAudio = () => audio.unlock();
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);
document.addEventListener('visibilitychange', () => audio.visible(!document.hidden));
let hovered: Element | null = null;
document.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse') return;
  const b = (e.target as Element).closest('button');
  if (b && b !== hovered && !(b as HTMLButtonElement).disabled) { hovered = b; audio.sfx('hover'); }
  else if (!b) hovered = null;
});
document.addEventListener('click', (e) => {
  const b = (e.target as Element).closest('button') as HTMLButtonElement | null;
  if (!b || b.disabled || b.dataset.d) return;
  audio.sfx(b.dataset.back || b.id === 'closeMenu' ? 'back' : 'confirm');
}, true);
