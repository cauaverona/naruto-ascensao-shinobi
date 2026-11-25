// Ascensão Shinobi v0.3.0 — controlador principal: telas, exploração, aulas, treino, noite e menu.
import './styles.css';
import { CHARACTERS, CLASSMATES, type MapId, type Period } from './data/characters';
import { CLAN_NAMES, VILLAGES, PASTS, TALENTS, ATTRIBUTE_PICKS, origin, clanByName } from './data/clans';
import { ELEMENTS, ACADEMY_STATS, combatPower, maxVitals, type Stat } from './data/stats';
import { LESSONS, PERIODS, WEEKDAYS, EXAM_DAY, ITEMS, QUESTIONS } from './data/academy';
import { JUTSUS, castChance } from './data/jutsus';
import { newCampaign, addLog, type Campaign, type Profile, type Settings } from './state/campaign';
import { readSlot, writeSlot, SLOT_COUNT, slotKey } from './state/save';
import { applyTraining, learn, level, clampVitals, practice, statCost, train } from './systems/progression';
import { bond, bondLabel } from './systems/relations';
import { dueEvents, resolveEvent, sleep, startAfternoon, spendAction } from './systems/world';
import { talk } from './content/dialogue';
import { KunaiGame, StrikeGame, ChakraGame, SealsGame, grade, type Minigame } from './scenes/minigames';
import { BattleScene } from './scenes/battle';
import { makeFighter, startBattle } from './combat/engine';
import { randomSeed, Rng } from './core/rng';
import { drawActor, portrait, idlePose, spritesReady, clothes, skinSet, hairSet, CUTS, type Actor, type Dir } from './render/sprites';
import { px } from './render/gfx';
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
  const lastSlot = Number(localStorage.getItem('ascensao.ultimo') ?? -1);
  const info = lastSlot >= 0 ? safeRead(lastSlot) : null;
  const box = $('mainmenu');
  box.replaceChildren();
  const add = (label: string, fn: () => void) => { const b = document.createElement('button'); b.textContent = label; b.onclick = fn; b.onmouseenter = () => setCurrent(box, menuButtons(box).indexOf(b)); box.append(b); };
  if (info?.kind === 'ok') add('Continuar', () => startGame(lastSlot, info.campaign, info.raw));
  add('Jogar', openSlots);
  add('Controles', () => toastTitle('Andar: WASD ou setas · Interagir: E ou Enter · Menu: Esc · No celular, use o direcional e o botão A.'));
  setCurrent(box, 0);
}
function toastTitle(text: string) {
  let p = $('s-title').querySelector<HTMLParagraphElement>('.titletip');
  if (!p) { p = document.createElement('p'); p.className = 'tagline titletip'; p.style.marginTop = '18px'; $('mainmenu').after(p); }
  p.textContent = text;
}

function openSlots() {
  show('slots');
  c = null;
  const box = $('slots');
  box.replaceChildren();
  for (let i = 0; i < SLOT_COUNT; i++) {
    const info = safeRead(i);
    const b = document.createElement('button');
    b.className = 'slot';
    const face = document.createElement('canvas');
    face.width = 36; face.height = 39;
    b.append(face);
    const add = (tag: string, text: string) => { const e = document.createElement(tag); e.textContent = text; b.append(e); };
    add('small', `Jornada ${i + 1}`);
    if (!info || info.kind === 'broken') {
      add('strong', 'Indisponível'); add('span', info?.kind === 'broken' ? `Save ilegível: ${info.error}` : 'Armazenamento bloqueado');
      b.disabled = !info;
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
      b.onclick = () => startGame(i, s, info.raw);
    }
    b.onmouseenter = () => setCurrent(box, menuButtons(box).indexOf(b));
    box.append(b);
    if (info?.kind === 'broken' && info.raw) {
      const del = document.createElement('button');
      del.type = 'button'; del.className = 'ghost del'; del.textContent = 'Apagar save ilegível';
      del.onclick = (e) => { e.stopPropagation(); localStorage.removeItem(slotKey(i)); openSlots(); };
      b.append(del);
    }
  }
  setCurrent(box, 0);
  menuButtons(box)[0]?.focus();
}

// ——— Criação de personagem ———
type Key = keyof Profile | 'difficulty' | 'fidelity';
interface Opt { key: Key; label: string; values: readonly string[]; describe?: (v: string) => string }
const LABELS: Record<string, string> = { facil: 'Fácil', normal: 'Normal', dificil: 'Difícil', fiel: 'Fiel ao anime', equilibrado: 'Equilibrado', alternativo: 'Mundo alternativo' };
const TALENT_TEXT: Record<string, string> = {
  'Percepção': 'Nota detalhes que os outros perdem. Ajuda a mirar e a enxergar através de clones.',
  'Controle de chakra': 'Chakra preciso. Técnicas falham menos e gastam melhor a reserva.',
  Taijutsu: 'Corpo treinado desde cedo. Golpes mais fortes no corpo a corpo.',
  'Inteligência': 'Aprende rápido nas aulas e lê o adversário com calma.',
  Bukijutsu: 'Mãos firmes com kunai e shuriken.',
};
const CREATE_TABS: { id: string; label: string; opts: Opt[] }[] = [
  { id: 'id', label: 'Identidade', opts: [
    { key: 'sex', label: 'Sexo', values: ['Masculino', 'Feminino'] },
    { key: 'village', label: 'Aldeia natal', values: VILLAGES, describe: (v) => (v === 'Konoha' ? 'Nascido na Vila da Folha.' : `Nascido em ${v}, criado em Konoha sob tutela da Academia.`) },
    { key: 'clan', label: 'Clã', values: [...CLAN_NAMES, 'Sortear'], describe: (v) => (v === 'Sortear' ? 'O destino escolhe seu sangue.' : clanByName(v).blurb) },
    { key: 'element', label: 'Afinidade', values: [...ELEMENTS, 'Sortear'], describe: (v) => (v === 'Sortear' ? 'Sua natureza de chakra será sorteada.' : `Natureza de chakra: ${v}. Ela ainda vai demorar a despertar.`) },
  ] },
  { id: 'look', label: 'Aparência', opts: [
    { key: 'skin', label: 'Pele', values: Object.keys(skinSet) },
    { key: 'hair', label: 'Cabelo', values: Object.keys(hairSet) },
    { key: 'cut', label: 'Penteado', values: CUTS },
    { key: 'coat', label: 'Traje', values: Object.keys(clothes) },
  ] },
  { id: 'origin', label: 'Origem', opts: [
    { key: 'talent', label: 'Talento', values: TALENTS, describe: (v) => TALENT_TEXT[v] ?? '' },
    { key: 'attribute', label: 'Atributo +2', values: ATTRIBUTE_PICKS, describe: (v) => `Começa com ${v} mais alto.` },
    { key: 'past', label: 'Histórico', values: PASTS },
  ] },
  { id: 'world', label: 'Mundo', opts: [
    { key: 'difficulty', label: 'Dificuldade', values: ['facil', 'normal', 'dificil'], describe: (v) => ({ facil: 'Adversários mais fracos.', normal: 'O equilíbrio pensado para a campanha.', dificil: 'Adversários batem mais forte.' }[v] ?? '') },
    { key: 'fidelity', label: 'História', values: ['fiel', 'equilibrado', 'alternativo'], describe: (v) => ({ fiel: 'Os acontecimentos seguem o anime, a menos que você mude o rumo de propósito.', equilibrado: 'O anime é a referência, mas o mundo reage às chances e às suas escolhas.', alternativo: 'O mundo se afasta do roteiro com facilidade.' }[v] ?? '') },
  ] },
];
const DEFAULTS: Record<Key, string> = {
  name: '', sex: 'Masculino', village: 'Konoha', clan: 'Sem clã', element: 'Fogo', talent: 'Percepção', attribute: 'Vitalidade',
  past: 'Família de artesãos', skin: 'Dourada', hair: 'Preto', cut: 'Curto', coat: 'Índigo', difficulty: 'normal', fidelity: 'equilibrado',
};
let form: Record<Key, string> = { ...DEFAULTS };
let createTab = 0, createRow = 0, previewDir = 0;
const PREVIEW_DIRS: Dir[] = ['down', 'right', 'up', 'left'];

function readForm(): { p: Profile; s: Settings } {
  const { difficulty, fidelity, ...rest } = form;
  return { p: { ...(rest as unknown as Profile), name: $<HTMLInputElement>('f_name').value.trim() }, s: { difficulty: difficulty as Settings['difficulty'], fidelity: fidelity as Settings['fidelity'] } };
}
function renderCreate() {
  const tabs = $('ctabs');
  tabs.replaceChildren(...CREATE_TABS.map((t, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.role = 'tab'; b.textContent = t.label; b.setAttribute('aria-selected', String(i === createTab));
    b.onclick = () => { createTab = i; createRow = 0; renderCreate(); };
    return b;
  }));
  const rows = $('rows');
  rows.replaceChildren();
  const tab = CREATE_TABS[createTab];
  tab.opts.forEach((o, i) => {
    const r = document.createElement('div');
    r.className = 'opt';
    r.setAttribute('aria-current', String(i === createRow));
    const name = document.createElement('span'); name.textContent = o.label;
    const cyc = document.createElement('div'); cyc.className = 'cycle';
    const mk = (dirn: -1 | 1) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', `${o.label}: ${dirn < 0 ? 'anterior' : 'próximo'}`); b.innerHTML = `<i class="tri ${dirn < 0 ? 'l' : 'r'}"></i>`; b.onclick = () => { createRow = i; cycleOpt(dirn); }; return b; };
    const val = document.createElement('b'); val.textContent = LABELS[form[o.key]] ?? form[o.key];
    cyc.append(mk(-1), val, mk(1));
    r.append(name, cyc);
    r.onmouseenter = () => { createRow = i; markRow(); };
    rows.append(r);
  });
  const d = document.createElement('p'); d.className = 'desc'; d.id = 'optDesc';
  rows.append(d);
  markRow();
  $('origin').textContent = origin(readForm().p);
}
function markRow() {
  const opts = CREATE_TABS[createTab].opts;
  [...$('rows').querySelectorAll('.opt')].forEach((r, k) => r.setAttribute('aria-current', String(k === createRow)));
  const o = opts[createRow];
  $('optDesc').textContent = o?.describe?.(form[o.key]) ?? '';
}
function cycleOpt(dirn: -1 | 1) {
  const o = CREATE_TABS[createTab].opts[createRow];
  const i = o.values.indexOf(form[o.key]);
  form[o.key] = o.values[(i + dirn + o.values.length) % o.values.length];
  renderCreate();
}
function drawPreview() {
  const g2 = $<HTMLCanvasElement>('preview').getContext('2d')!;
  g2.clearRect(0, 0, 96, 104);
  g2.imageSmoothingEnabled = false;
  const dir = PREVIEW_DIRS[previewDir % 4];
  const p = readForm().p;
  g2.save(); g2.scale(2, 2); drawActor(g2, 24, 48, { role: 'player', look: { ...p } }, dir, Math.floor(clock * 4) % 4); g2.restore();
}
function openCreate(i: number) {
  slot = i;
  form = { ...DEFAULTS };
  $<HTMLInputElement>('f_name').value = '';
  createTab = 0; createRow = 0;
  show('create');
  renderCreate();
  $('f_name').focus();
}
$('rotL').onclick = () => (previewDir = (previewDir + 3) % 4);
$('rotR').onclick = () => (previewDir = (previewDir + 1) % 4);
$('f_name').oninput = () => ($('origin').textContent = origin(readForm().p));
$('randomize').onclick = () => {
  for (const t of CREATE_TABS) for (const o of t.opts) if (o.key !== 'difficulty' && o.key !== 'fidelity') form[o.key] = o.values[Math.floor(Math.random() * o.values.length)];
  renderCreate();
};
$('form').onsubmit = (e) => {
  e.preventDefault();
  const { p, s } = readForm();
  if (!p.name) { $('f_name').focus(); $<HTMLInputElement>('f_name').placeholder = 'Seu shinobi precisa de um nome'; return; }
  let raw: string | null = null;
  try { raw = localStorage.getItem(slotKey(slot)); } catch { raw = null; }
  startGame(slot, newCampaign(p, s, randomSeed()), raw);
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
  try { localStorage.setItem('ascensao.ultimo', String(i)); } catch { /* sem armazenamento */ }
  show('game');
  shownMap = null;
  enterMap(c.map, c.x, c.y, c.dir, false);
  save();
  refresh();
  if (c.day === 1 && c.quest === 'matricula-ficha' && c.log.length <= 1) {
    void say(null, [`Manhã do primeiro dia. ${c.profile.name} sai de casa com a ficha da Academia em mente.`, 'A ficha de matrícula fica no quadro de avisos da Rua da Academia, perto da escadaria.']);
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
  return { role: d.role, look: d.look, bandana: grad };
}

function placeNpcs() {
  if (!c) return;
  npcs = [];
  for (const d of Object.values(CHARACTERS)) {
    let spot: { x: number; y: number; dir?: Dir; route?: [number, number][]; map?: MapId } | undefined;
    if (c.day === 1 && c.period === 0 && DAY1[d.id]) spot = { ...DAY1[d.id], map: 'rua' };
    else spot = d.schedule[c.period as Period];
    if (!spot || (spot.map ?? 'rua') !== c.map) continue;
    if (c.map === 'sala' && !lessonMode) continue;
    // Naruto só aparece no Ichiraku à noite depois da pegadinha se não estiver limpando o monumento.
    npcs.push({ id: d.id, actor: actorFor(d.id), name: d.name, x: spot.x, y: spot.y, dir: spot.dir ?? 'down', frame: -1, route: spot.route ?? [], idx: 0, rest: 1.5, dist: 0 });
  }
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
  $('clock').textContent = `Dia ${c.day} · ${WEEKDAYS[(c.day - 1) % 7]} · ${PERIODS[c.period]}${c.period === 1 ? ` · ${c.actions} ${c.actions === 1 ? 'ação' : 'ações'}` : ''}`;
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
  if (cc.flags['academia-concluida']) return cc.period === 2 ? 'Noite: descanse. A vida de genin começa na próxima etapa' : 'Era da Academia concluída. Treine e fortaleça seus laços';
  if (cc.rank === 'Genin') return 'Você é genin! Amanhã saem as equipes';
  const retake = cc.flags['exame:player'] === 'reprovado' ? Number(cc.flags.repescagem) : 0;
  if (cc.period === 0) {
    if (retake) return cc.day >= retake ? 'Repescagem hoje! Entre na Academia' : `Repescagem no dia ${retake}. Treine o Bunshin`;
    if (cc.day >= EXAM_DAY && !cc.lessonsDone.includes(cc.day)) return 'Exame de graduação hoje! Entre na Academia';
    const l = todayLesson(cc);
    return l && !cc.lessonsDone.includes(cc.day) ? `Aula de hoje: ${l.title}. Entre na Academia` : 'Manhã livre';
  }
  if (cc.period === 1) return `Tarde livre: treine no Campo de Treino (oeste) · ${cc.actions} ações`;
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
  if (who?.actor) { const hg = h.getContext('2d')!; hg.imageSmoothingEnabled = false; hg.clearRect(0, 0, 40, 40); hg.drawImage(portrait(who.actor), 0, 0); }
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
  for (const s of map().spots) { const d = Math.hypot(c.x - s.x, c.y - s.y); if (d < s.r && d < dist + 6) { dist = d; best = { kind: 'spot', id: s.id, label: s.label }; } }
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

async function talkTo(n: Npc) {
  if (!c) return;
  n.dir = face(c.x - n.x, c.y - n.y, n.dir);
  c.dir = face(n.x - c.x, n.y - c.y, c.dir);
  const who = { name: n.name, actor: n.actor };
  if (n.id === 'iruka' && c.quest === 'matricula-entrega') {
    await say(who, [`A ficha está em ordem, ${c.profile.name}. Vou colocar seu nome na lista da turma.`, 'Matrícula confirmada! As aulas começam amanhã cedo. Hoje à tarde, aproveite para conhecer o Campo de Treino, a oeste.']);
    c.quest = 'aula'; c.lessonsDone.push(1);
    bond(c, 'iruka', { confianca: 5 }, 'Matriculou-se na minha turma.');
    addLog(c, 'Iruka confirmou sua matrícula na Academia.');
    startAfternoon(c); placeNpcs();
    toast('Tarde livre. Cada treino gasta uma ação; quando acabarem, anoitece.');
    return;
  }
  if (n.id === 'gen') { await shop(who); return; }
  // Aula de reforço: Iruka ensina à tarde a técnica que o jogador perdeu.
  if (n.id === 'iruka' && c.period === 1) {
    const missed = LESSONS.find((l) => l.teaches && l.day < c!.day && !(l.teaches in c!.jutsus));
    if (missed?.teaches) {
      const ch = await say(who, [`Você faltou à aula de ${JUTSUS[missed.teaches].name}. Posso passar o básico agora, mas vai custar sua tarde.`], [{ id: 'sim', label: 'Aprender agora (1 ação)' }, { id: 'nao', label: 'Depois' }]);
      if (ch === 'sim' && c.actions > 0) {
        learn(c, missed.teaches, 8);
        addLog(c, `Aula de reforço com Iruka: ${JUTSUS[missed.teaches].name}.`);
        bond(c, 'iruka', { respeito: 2 });
        afterAction();
      }
      return;
    }
  }
  const lines = talk(c, n.id);
  const npcState = c.npcs[n.id];
  if (npcState && npcState.talkedDay !== c.day && CHARACTERS[n.id].classmate || n.id === 'iruka') {
    if (npcState.talkedDay !== c.day) { npcState.talkedDay = c.day; bond(c, n.id, { amizade: 3 }); }
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
  if (CHARACTERS[n.id].classmate && c.period === 1) {
    const ch = await say(who, lines, [{ id: 'luta', label: 'Desafiar para um treino de luta (1 ação)' }, { id: 'nao', label: 'Até mais' }]);
    if (ch === 'luta') await spar(n);
    return;
  }
  await say(who, lines);
}

async function shop(who: { name: string; actor: Actor }) {
  if (!c) return;
  for (;;) {
    const ch = await say(who, [`${talk(c, 'gen')[0]} Você tem ${c.ryo} ryō.`], [
      ...Object.values(ITEMS).map((i) => ({ id: i.id, label: `${i.name} · ${i.price} ryō (tem ${c!.inventory[i.id] ?? 0})` })),
      { id: 'sair', label: 'Só olhando, obrigado' },
    ]);
    const item = ITEMS[ch];
    if (!item) return;
    if (c.ryo < item.price) { await say(who, ['Faltou dinheiro, jovem. Volte quando receber a mesada.']); return; }
    c.ryo -= item.price;
    c.inventory[item.id] = (c.inventory[item.id] ?? 0) + 1;
  }
}

async function useSpot(id: string) {
  if (!c) return;
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
    case 'troncos': case 'alvos': case 'meditacao': return trainSpot(id);
    case 'selos': return practiceSpot();
    case 'carteira': await say(null, ['Seu nome está escrito a lápis no canto da carteira.']); return;
  }
}

function afterAction() {
  if (!c) return;
  const dusk = spendAction(c);
  if (dusk) {
    placeNpcs();
    toast('O sol se põe sobre Konoha. Hora de jantar e descansar.');
  }
}

// ——— Minijogos ———
let mini: Minigame | null = null;
let miniResolve: ((score: number) => void) | null = null;
function renderMiniOptions() {
  const box = $('mini').querySelector<HTMLElement>('.mini-opts')!;
  box.replaceChildren(...(mini?.options ?? []).map((o, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = '<b></b><small></small>';
    b.querySelector('b')!.textContent = o.label;
    b.querySelector('small')!.textContent = `${i + 1} · ${o.sub}`;
    b.onclick = () => { mini?.choose?.(i); renderMiniOptions(); };
    return b;
  }));
}
function runMini(mg: Minigame): Promise<number> {
  busy = true; held.clear();
  mini = mg;
  const box = $('mini');
  box.hidden = false;
  box.querySelector('.mini-title')!.textContent = mg.title;
  box.querySelector('.mini-help')!.textContent = mg.help;
  renderMiniOptions();
  return new Promise((res) => (miniResolve = res));
}
function miniTick(dt: number) {
  if (!mini) return;
  mini.update(dt);
  $('mini').querySelector('.mini-help')!.textContent = mini.done ? mini.help : `${mini.status()} · ${mini.help}`;
  if (mini.options && $('mini').querySelectorAll('.mini-opts button').length !== mini.options.length) renderMiniOptions();
  if (mini.done && miniResolve) {
    const r = miniResolve, score = mini.score;
    miniResolve = null;
    $('mini').querySelector('.mini-title')!.textContent = `${grade(score)} · ${Math.round(score * 100)} pontos`;
    $('mini').querySelector('.mini-opts')!.replaceChildren();
    setTimeout(() => { $('mini').hidden = true; mini = null; busy = false; r(score); }, 1300);
  }
}
const seededRand = () => { const r = new Rng(c ? c.rng ^ Math.floor(clock * 1000) : 1); return () => r.next(); };

async function trainSpot(kind: 'troncos' | 'alvos' | 'meditacao') {
  if (!c) return;
  if (c.period !== 1) { await say(null, [c.period === 0 ? 'De manhã é dia de aula. O campo fica para a tarde.' : 'Está escuro demais para treinar com segurança. Melhor descansar.']); return; }
  const cost = { troncos: 6, alvos: 4, meditacao: 2 }[kind];
  if (c.stamina < cost) { await say(null, ['Você está exausto. Coma algo, jante no Ichiraku ou descanse antes de treinar de novo.']); return; }
  const stats = { troncos: ['Taijutsu', 'Força'], alvos: ['Bukijutsu', 'Percepção'], meditacao: ['Controle de chakra', 'Chakra'] }[kind] as Stat[];
  const mg = kind === 'troncos' ? new StrikeGame(c.stats.Força) : kind === 'alvos' ? new KunaiGame(c.stats.Percepção) : new ChakraGame(c.stats['Controle de chakra']);
  const score = await runMini(mg);
  c.stamina -= cost;
  if (kind === 'meditacao') c.chakra = Math.min(maxVitals(c.stats).chakra, c.chakra + 8);
  const res = applyTraining(c, stats, score);
  clampVitals(c);
  const gains = res.gains.map((g2) => `${g2.stat} +${g2.points}`).join(', ');
  addLog(c, `Treino nos ${mg.title.toLowerCase()}: ${Math.round(score * 100)} pontos.${gains ? ' ' + gains + '.' : ''}`);
  if (gains) toast(`Evolução: ${gains}`);
  afterAction();
}

async function practiceSpot() {
  if (!c) return;
  const known = Object.keys(c.jutsus).filter((j) => JUTSUS[j]?.era === 'academia');
  if (!known.length) { await say(null, ['Você ainda não aprendeu nenhuma técnica. As aulas de Iruka ensinam Henge, Kawarimi e Bunshin.']); return; }
  if (c.period !== 1) { await say(null, ['Melhor praticar à tarde, com o campo livre.']); return; }
  const ch = await say(null, ['Qual técnica praticar? Cada sessão gasta chakra e uma ação.'], [...known.map((j) => ({ id: j, label: `${JUTSUS[j].name} · domínio ${Math.round(c!.jutsus[j])}%` })), { id: '', label: 'Cancelar' }]);
  const j = JUTSUS[ch];
  if (!j) return;
  if (c.chakra < j.chakraCost * 2) { await say(null, ['Chakra baixo demais. Medite na pedra ou descanse antes.']); return; }
  const score = await runMini(new SealsGame(4, seededRand(), 2.6));
  c.chakra -= j.chakraCost * 2;
  const res = applyTraining(c, j.trains, score, 0.2, j.id);
  addLog(c, `Praticou ${j.name}: domínio ${Math.round(c.jutsus[j.id])}%.`);
  toast(`${j.name}: domínio ${Math.round(c.jutsus[j.id])}% (+${(res.mastery?.delta ?? 0).toFixed(1)})`);
  afterAction();
}

// ——— Combate ———
let battleScene: BattleScene | null = null;
const POWER = { facil: 0.8, normal: 1, dificil: 1.2 } as const;

function playerFighter() {
  const academy = Object.fromEntries(Object.entries(c!.jutsus).filter(([j]) => JUTSUS[j]?.era === 'academia'));
  return makeFighter({
    id: 'player', name: c!.profile.name, role: 'player', look: { ...c!.profile }, stats: c!.stats, jutsus: academy,
    items: { kunai: c!.inventory.kunai ?? 0, shuriken: c!.inventory.shuriken ?? 0 }, vitals: { hp: c!.hp, chakra: c!.chakra, stamina: c!.stamina },
  }, 0);
}
function npcFighter(id: string) {
  const d = CHARACTERS[id], n = c!.npcs[id];
  return makeFighter({ id, name: d.name, role: d.role, look: d.look, stats: n.stats, jutsus: n.jutsus, personality: d.personality, power: POWER[c!.settings.difficulty] }, 1);
}

async function runBattle(id: string, title: string) {
  if (!c) return null;
  busy = true; held.clear();
  const seed = (c.rng ^ (c.day * 7919) ^ c.wins * 31) >>> 0;
  const battle = startBattle(playerFighter(), npcFighter(id), seed, 1);
  const m = map(), focus = { x: c.x, y: c.y };
  const scene = new BattleScene({
    battle, title, actors: [playerActor(), actorFor(id)],
    background: (bg, w, h) => paintWorld(bg, m, { x: Math.max(0, Math.min(m.w - w, focus.x - w / 2)), y: Math.max(0, Math.min(m.h - h, focus.y - h * 0.7)) }, w, h, [], c!.period),
  }, $('battle'));
  battleScene = scene;
  $('s-game').classList.add('inbattle');
  const result = await scene.run();
  battleScene = null;
  $('s-game').classList.remove('inbattle');
  busy = false;
  const me = result.fighters[0], won = result.over?.winner === 0;
  // Treino não fere de verdade: sobra ao menos um terço da vida.
  c.hp = Math.max(Math.round(maxVitals(c.stats).hp / 3), me.hp); c.chakra = me.chakra; c.stamina = me.stamina;
  // Aprendizado pelo que foi usado na luta.
  const used = me.used;
  const gains: string[] = [];
  const t = (s: Stat, n: number) => { if (n > 0) { const p = train(c!, s, Math.min(1.2, n * 0.18)); if (p) gains.push(`${s} +${p}`); } };
  t('Taijutsu', used.taijutsu ?? 0); t('Força', (used.taijutsu ?? 0) * 0.6); t('Bukijutsu', (used.kunai ?? 0) + (used.shuriken ?? 0));
  t('Resistência', used.defend ?? 0); t('Velocidade', (used.advance ?? 0) + (used.retreat ?? 0));
  for (const j of ['henge', 'kawarimi', 'bunshin']) if (used[j]) practice(c, j, used[j] * 3);
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
  if (c.day >= EXAM_DAY) { await runExam(); return; }
  const lesson = todayLesson(c);
  if (!lesson) { await say(null, ['Hoje não há aula. Aproveite para treinar.']); return; }
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

async function runLesson(lesson: typeof LESSONS[number]) {
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
  c.lessonsDone.push(c.day);
  c.lessonScores[c.day] = Math.round(score * 100);
  bond(c, 'iruka', { respeito: score > 0.6 ? 3 : 1 });
  const parts = [lesson.teaches ? `Você aprendeu ${JUTSUS[lesson.teaches].name} (domínio ${Math.round(c.jutsus[lesson.teaches])}%).` : '', res.gains.length ? `Evolução: ${res.gains.map((x) => `${x.stat} +${x.points}`).join(', ')}.` : ''].filter(Boolean);
  addLog(c, `Aula: ${lesson.title} (${Math.round(score * 100)} pontos). ${parts.join(' ')}`);
  await say(iruka, [score > 0.7 ? 'Muito bem! Foi um dos melhores da turma hoje.' : score > 0.45 ? 'Nada mal. Treine à tarde para fixar.' : 'Precisa praticar mais. O Campo de Treino fica aberto à tarde.', ...(parts.length ? [parts.join(' ')] : []), 'Dispensados! Até amanhã.']);
  lessonMode = false;
  startAfternoon(c);
  enterMap('rua', 450, 204, 'down');
  toast('Tarde livre. O Campo de Treino fica a oeste, seguindo a rua.');
}

// ——— Exame de graduação ———
async function runExam() {
  if (!c) return;
  const retake = c.flags['exame:player'] === 'reprovado';
  if (retake && c.day < (c.flags['repescagem'] as number)) { await say(null, [`A repescagem é no dia ${c.flags['repescagem']}. Até lá, treine o Bunshin.`]); return; }
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
  const rng = new Rng(c.rng ^ 0xa5a5);
  const chance = Math.max(0.03, Math.min(0.97, castChance(mastery + sealScore * 25, c.stats['Controle de chakra']) - 0.15 + written * 0.05));
  const pass = mastery > 0 && rng.chance(chance);
  c.rng = rng.state;
  c.lessonsDone.push(c.day);
  if (pass) {
    c.rank = 'Genin';
    c.flags['exame:player'] = 'aprovado';
    c.reputation += 10; c.xp += 150;
    bond(c, 'iruka', { respeito: 10, confianca: 5 }, `Formou ${c.profile.name} como genin.`);
    addLog(c, `Exame de graduação: aprovado. ${c.profile.name} agora é Genin.`);
    await say(iruka, [
      mastery >= 60 ? 'Três clones perfeitos, firmes do primeiro ao último. Excelente.' : 'Os clones tremeram um pouco, mas estão de pé. Isso conta.',
      `Parabéns, ${c.profile.name}. Você está aprovado.`,
      'Aqui está a sua bandana. Use com orgulho: a partir de hoje você é um ninja da Folha.',
    ]);
    const passed = CLASSMATES.filter((id) => String(c!.flags[`exame:${id}`] ?? '').startsWith('aprovado')).map((id) => CHARACTERS[id].name);
    const failed = CLASSMATES.filter((id) => c!.flags[`exame:${id}`] === 'reprovado').map((id) => CHARACTERS[id].name);
    if (!retake && (passed.length || failed.length)) await say(iruka, [`Da turma, passaram: ${passed.join(', ') || 'ninguém ainda'}.${failed.length ? ` Não passaram: ${failed.join(', ')}.` : ''}`]);
  } else {
    c.flags['exame:player'] = 'reprovado';
    c.flags.repescagem = c.day + 3;
    addLog(c, 'Exame de graduação: reprovado. Repescagem marcada em três dias.');
    await say(iruka, [
      mastery === 0 ? 'Você ainda não aprendeu o Bunshin. Sem ele não tenho como aprovar.' : 'O clone desfez antes de ficar de pé. Sinto muito, mas não posso aprovar assim.',
      `Não desanime. Você terá uma repescagem no dia ${c.day + 3}. Treine o Bunshin no Campo de Treino.`,
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

async function home() {
  if (!c) return;
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
      'A vida de genin (equipes, sensei e as primeiras missões) chega na próxima etapa. Até lá, Konoha continua aberta: treine, converse e fortaleça seus laços.',
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
function paintWorld(gg: CanvasRenderingContext2D, m: GameMap, cam: { x: number; y: number }, w: number, h: number, actors: { y: number; draw: () => void }[], period: Period) {
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
  m.ambient?.(gg, calm.matches ? 0 : clock, calm.matches);
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
  const me: Actor = { role: 'player', look: { ...c.profile }, bandana: c.rank !== 'Estudante da Academia' };
  actors.push({ y: c.y, draw: () => drawActor(g, c!.x, c!.y, me, c!.dir, walkFrame < 0 ? idlePose(clock, 0, calm.matches) : walkFrame, clock < gestureUntil) });
  paintWorld(g, m, camera, cv.width, cv.height, actors, c.period);
  if (contact && !busy) {
    const [x, y] = contact.kind === 'npc' ? [contact.npc.x, contact.npc.y - (contact.npc.actor.role === 'iruka' || contact.npc.actor.role === 'gen' ? 52 : 46)] : (() => { const s = m.spots.find((s2) => s2.id === (contact as { id: string }).id)!; return [s.x, s.y - 30]; })();
    const bob = calm.matches ? 0 : Math.round(Math.sin(clock * 5));
    px(g, x - 5, y + bob, 11, 7, '#5e4636'); px(g, x - 4, y + 1 + bob, 9, 5, '#f8e8b6'); px(g, x, y + 6 + bob, 2, 2, '#5e4636');
    for (let i = 0; i < 3; i++) px(g, x - 2 + i * 2, y + 3 + bob, 1, 1, '#8b5036');
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
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
type Tab = 'ficha' | 'tecnicas' | 'relacoes' | 'diario' | 'calendario' | 'itens' | 'sistema';
const TABS: [Tab, string][] = [['ficha', 'Ficha'], ['tecnicas', 'Técnicas'], ['relacoes', 'Relações'], ['diario', 'Diário'], ['calendario', 'Calendário'], ['itens', 'Itens'], ['sistema', 'Sistema']];
let tab: Tab = 'ficha';
function el(tag: string, cls = '', text = '') { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
function row(a: string, b: string) { const r = el('div', 'row'); r.append(el('span', '', a), el('b', '', b)); return r; }
function bar(v: number) { const b = el('div', 'bar-mini'); const i = el('i'); i.style.width = Math.max(0, Math.min(100, v)) + '%'; b.append(i); return b; }

function openMenu() {
  if (!c || busy) return;
  held.clear();
  $('menuName').textContent = c.profile.name;
  $('menuSub').textContent = `${c.rank} · Dia ${c.day} · ${PERIODS[c.period]} · ${c.ryo} ryō`;
  const mf = $<HTMLCanvasElement>('menuFace').getContext('2d')!; mf.imageSmoothingEnabled = false; mf.drawImage(portrait(playerActor()), 0, 0);
  renderMenu();
  $<HTMLDialogElement>('menu').showModal();
}
function renderMenu() {
  if (!c) return;
  const tabs = $('tabs');
  tabs.replaceChildren(...TABS.map(([id, label]) => { const b = el('button', '', label); b.setAttribute('aria-selected', String(id === tab)); b.onclick = () => { tab = id; renderMenu(); }; return b; }));
  const body = $('tabBody');
  body.replaceChildren();
  const mastery = Object.values(c.jutsus).reduce((a, b) => a + b, 0);
  if (tab === 'ficha') {
    body.append(el('p', 'muted', origin(c.profile)));
    const g2 = el('div', 'grid2');
    g2.append(row('Patente', c.rank), row('Nível', String(level(c))), row('Poder de combate', String(combatPower(c.stats, mastery))), row('Reputação', String(c.reputation)),
      row('Clã', c.profile.clan), row('Afinidade', c.profile.element), row('Aldeia natal', c.profile.village), row('Idade', `${c.age} anos`));
    body.append(g2, el('h3', '', 'Atributos'));
    const g3 = el('div', 'grid2');
    for (const s of ACADEMY_STATS) { const d = el('div'); d.append(row(s, String(c.stats[s])), bar((c.statXp[s] / statCost(c.stats[s])) * 100)); g3.append(d); }
    body.append(g3);
  } else if (tab === 'tecnicas') {
    const known = Object.keys(c.jutsus);
    if (!known.length) body.append(el('p', '', 'Nenhuma técnica aprendida ainda. As aulas de Iruka ensinam Henge, Kawarimi e Bunshin.'));
    for (const id of known) {
      const j = JUTSUS[id]; const card = el('div', 'card');
      card.append(row(`${j.name} · rank ${j.rank}`, `${Math.round(c.jutsus[id])}%`), bar(c.jutsus[id]), el('p', 'muted', `${j.meaning}. ${j.description} Custo: ${j.chakraCost} de chakra.`));
      body.append(card);
    }
  } else if (tab === 'relacoes') {
    for (const id of ['iruka', 'naruto', 'sasuke', 'sakura', 'emi', 'daichi']) {
      const n = c.npcs[id], d = CHARACTERS[id], card = el('div', 'card');
      card.append(row(d.name + (d.original ? ' (original)' : ''), bondLabel(n.bond)),
        el('p', 'muted', `Amizade ${n.bond.amizade} · Rivalidade ${n.bond.rivalidade} · Respeito ${n.bond.respeito} · Confiança ${n.bond.confianca}`));
      if (n.memory.length) card.append(el('p', 'muted', 'Lembra: ' + n.memory.slice(0, 3).join(' · ')));
      body.append(card);
    }
  } else if (tab === 'diario') {
    const ol = el('ol', 'log');
    for (const l of c.log.slice(0, 60)) ol.append(el('li', '', `Dia ${l.day} · ${l.text}`));
    body.append(ol);
  } else if (tab === 'calendario') {
    body.append(row('Hoje', `Dia ${c.day} · ${WEEKDAYS[(c.day - 1) % 7]} · ${PERIODS[c.period]}`), el('h3', '', 'Aulas da Academia'));
    for (const l of LESSONS) body.append(row(`Dia ${l.day} · ${l.title}`, c.lessonsDone.includes(l.day) ? 'feita' : l.day < c.day ? 'perdida' : 'a fazer'));
    const ex = c.flags['exame:player'];
    body.append(row(`Dia ${EXAM_DAY} · Exame de graduação`, ex === 'aprovado' ? 'aprovado' : ex === 'reprovado' ? `repescagem no dia ${c.flags.repescagem}` : 'a fazer'));
  } else if (tab === 'itens') {
    body.append(row('Ryō', String(c.ryo)));
    for (const [id, n] of Object.entries(c.inventory)) if (n > 0) body.append(row(ITEMS[id]?.name ?? id, `× ${n}`));
    if ((c.inventory.onigiri ?? 0) > 0) {
      const b = el('button', '', 'Comer onigiri (+12 resistência)') as HTMLButtonElement;
      b.onclick = () => { if (!c) return; c.inventory.onigiri--; c.stamina = Math.min(maxVitals(c.stats).stamina, c.stamina + 12); dirty = true; refresh(); renderMenu(); };
      body.append(el('br'), b);
    }
  } else if (tab === 'sistema') {
    const wrap = el('div', 'btnrow');
    const b1 = el('button', '', 'Salvar agora') as HTMLButtonElement; b1.onclick = () => save(true);
    const b2 = el('button', '', zoomCloser ? 'Afastar câmera' : 'Aproximar câmera') as HTMLButtonElement; b2.onclick = () => { zoomCloser = !zoomCloser; size(); camera = limits(); renderMenu(); };
    const b3 = el('button', '', 'Voltar às campanhas') as HTMLButtonElement; b3.onclick = () => { save(); $<HTMLDialogElement>('menu').close(); openSlots(); };
    wrap.append(b1, b2, b3);
    body.append(wrap, el('p', 'muted', `Versão 0.3.0 · Dificuldade ${LABELS[c.settings.difficulty]} · ${LABELS[c.settings.fidelity]} · Tempo de jogo ${Math.round(c.playtime / 60)} min.`));
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
  if (DIRS[k] === 'up' || DIRS[k] === 'left') { e.preventDefault(); setCurrent(box, menuIndex - 1); list[menuIndex]?.focus(); }
  else if (DIRS[k] === 'down' || DIRS[k] === 'right') { e.preventDefault(); setCurrent(box, menuIndex + 1); list[menuIndex]?.focus(); }
  else if ((k === 'enter' || k === 'e' || k === ' ') && !e.repeat) { e.preventDefault(); list[menuIndex]?.click(); }
}
function createKeys(e: KeyboardEvent) {
  const k = e.key;
  if (document.activeElement === $('f_name') && !['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(k)) return;
  const opts = CREATE_TABS[createTab].opts;
  if (k === 'ArrowUp') { e.preventDefault(); $('f_name').blur(); createRow = (createRow + opts.length - 1) % opts.length; markRow(); }
  else if (k === 'ArrowDown') { e.preventDefault(); $('f_name').blur(); createRow = (createRow + 1) % opts.length; markRow(); }
  else if (k === 'ArrowLeft' || k === 'a') { e.preventDefault(); cycleOpt(-1); }
  else if (k === 'ArrowRight' || k === 'd') { e.preventDefault(); cycleOpt(1); }
  else if (k === 'q' || k === 'PageUp') { e.preventDefault(); createTab = (createTab + CREATE_TABS.length - 1) % CREATE_TABS.length; createRow = 0; renderCreate(); }
  else if (k === 'e' || k === 'PageDown') { e.preventDefault(); createTab = (createTab + 1) % CREATE_TABS.length; createRow = 0; renderCreate(); }
  else if (k === 'Escape') { e.preventDefault(); openSlots(); }
}
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (screen === 'title') { menuKeys(e, $('mainmenu')); return; }
  if (screen === 'slots') { if (k === 'escape') openTitle(); else menuKeys(e, $('slots')); return; }
  if (screen === 'create') { createKeys(e); return; }
  if ($<HTMLDialogElement>('menu').open) return;
  if (mini) {
    if ((k === 'e' || k === ' ' || k === 'enter') && !e.repeat) { e.preventDefault(); mini.press(true); }
    else if (/^[1-4]$/.test(k) && mini.choose) { e.preventDefault(); mini.choose(Number(k) - 1); renderMiniOptions(); }
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
      if (/^[1-9]$/.test(k) && dialogChoices[Number(k) - 1]) { e.preventDefault(); closeDialog(dialogChoices[Number(k) - 1].id); }
      else if (DIRS[k] === 'up') { e.preventDefault(); markChoice(choiceIndex - 1); }
      else if (DIRS[k] === 'down') { e.preventDefault(); markChoice(choiceIndex + 1); }
      else if ((k === 'e' || k === 'enter' || k === ' ') && !e.repeat) { e.preventDefault(); closeDialog(dialogChoices[choiceIndex].id); }
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
      battle: (id: string) => runBattle(id, 'Treino de luta'),
      train: (k: 'troncos' | 'alvos' | 'meditacao') => trainSpot(k),
      get mini() { return mini; },
      exam: () => runExam(),
      bench() { const t = performance.now(); for (let i = 0; i < 120; i++) { update(1 / 60); paint(); } return (performance.now() - t) / 120; },
    },
  });
}
