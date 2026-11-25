// Apresentação do combate por turnos. A regra vive em combat/engine.ts; aqui só se desenha e anima.
import { Rng } from '../core/rng';
import { available, resolveRound, type Action, type Battle, type Ev } from '../combat/engine';
import { DUEL_STYLES } from '../combat/styles';
import { chooseAction } from '../combat/ai';
import { JUTSUS } from '../data/jutsus';
import { drawActor, portrait, type Actor } from '../render/sprites';
import { px } from '../render/gfx';
import { audio } from '../audio';
import { drawCombatEffect, type CombatEffect, type EffectKind } from '../render/combat-effects';

type G = CanvasRenderingContext2D;
const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Pose { dx: number; dy: number; alpha: number; frame: number }
interface Floater { x: number; y: number; text: string; color: string; age: number; big: boolean }
interface Shot { from: number; to: number; t: number; weapon: 'kunai' | 'shuriken' }

export interface BattleSetup {
  battle: Battle;
  actors: [Actor, Actor];
  title: string;
  /** Desenha o cenário da arena (coordenadas da tela lógica). */
  background(g: G, w: number, h: number): void;
}

export class BattleScene {
  private b: Battle;
  private actors: [Actor, Actor];
  private poses: [Pose, Pose] = [this.pose(), this.pose()];
  private floaters: Floater[] = [];
  private shots: Shot[] = [];
  private shake = 0;
  private effects: CombatEffect[] = [];
  private clones = [0, 0];
  private disguises = [false, false];
  private displayHp: number[];
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  private sep: number;
  private sepTarget: number;
  private intro = 0;
  private rng: Rng;
  private ui: HTMLElement;
  private resolveChoice: ((a: Action) => void) | null = null;
  private clock = 0;
  private bgCache: HTMLCanvasElement | null = null;
  private bgKey = '';
  active = true;

  constructor(private setup: BattleSetup, ui: HTMLElement) {
    this.b = setup.battle;
    this.actors = setup.actors;
    this.clones = this.b.fighters.map((f) => f.status.clones);
    this.disguises = this.b.fighters.map((f) => f.status.disguised);
    this.sep = this.sepTarget = this.zoneSep(this.b.distance);
    this.rng = new Rng(this.b.rng ^ 0x9e3779b9);
    this.ui = ui;
    this.displayHp = this.b.fighters.map((f) => f.hp);
  }

  private pose(): Pose { return { dx: 0, dy: 0, alpha: 1, frame: -1 }; }
  private zoneSep(z: number) { return [62, 128, 196][z]; }
  /** Escala dos lutadores: 2x quando há espaço, 1x em telas estreitas (retrato). */
  private get big() { return this.lastW >= 320 ? 2 : 1; }

  // ——— Laço ———
  update(dt: number) {
    this.clock += dt;
    this.intro = Math.min(1, this.intro + dt * 1.6);
    this.sep += (this.sepTarget - this.sep) * (1 - Math.exp(-dt * 10));
    this.shake = Math.max(0, this.shake - dt * 30);
    for (const effect of this.effects) effect.age += dt;
    this.effects = this.effects.filter((effect) => effect.age < effect.duration);
    for (const f of this.floaters) f.age += dt;
    this.floaters = this.floaters.filter((f) => f.age < 1.3);
    for (const s of this.shots) s.t += dt * 3.2;
    this.shots = this.shots.filter((s) => s.t < 1);
  }

  private posOf(side: number, w: number, h: number) {
    const cx = w / 2, ground = Math.round(h * 0.7);
    const half = Math.min(this.sep * (this.big / 2) + (this.big === 1 ? 14 : 0), w * 0.42) / 2;
    const p = this.poses[side];
    return { x: Math.round(cx + (side === 0 ? -half : half) + p.dx * (side === 0 ? 1 : -1)), y: ground + p.dy };
  }

  render(g: G, w: number, h: number) {
    const key = `${w}x${h}`;
    if (!this.bgCache || this.bgKey !== key) {
      this.bgCache = document.createElement('canvas');
      this.bgCache.width = w; this.bgCache.height = h;
      const bg = this.bgCache.getContext('2d')!;
      bg.imageSmoothingEnabled = false;
      this.setup.background(bg, w, h);
      bg.setTransform(1, 0, 0, 1, 0, 0);
      bg.fillStyle = 'rgba(14,21,23,.35)'; bg.fillRect(0, 0, w, h);
      this.bgKey = key;
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    const sx = !this.reducedMotion.matches && this.shake ? Math.round((Math.random() - 0.5) * this.shake) : 0;
    const sy = !this.reducedMotion.matches && this.shake ? Math.round((Math.random() - 0.5) * this.shake) : 0;
    g.drawImage(this.bgCache, sx, sy);
    const ground = Math.round(h * 0.7);
    // Faixa de chão da arena
    g.fillStyle = 'rgba(0,0,0,.18)';
    g.fillRect(0, ground + 6, w, 3);

    for (const side of [0, 1] as const) {
      const f = this.b.fighters[side];
      const { x, y } = this.posOf(side, w, h);
      const dir = side === 0 ? 'right' : 'left';
      const p = this.poses[side];
      for (let count = 1; count <= this.clones[side]; count++) {
        this.drawBig(g, this.cloneX(x, side, count) + sx, y - (count % 2) * 6 + sy, this.actors[side], dir, -1, 0.54);
      }
      const actor = this.disguises[side] ? this.actors[1 - side] : this.actors[side];
      this.drawBig(g, x + sx, y + sy, actor, dir, p.frame, p.alpha * (this.disguises[side] ? 0.88 : 1));
      if (f.status.defending) { g.fillStyle = 'rgba(240,194,122,.85)'; g.fillRect(x - 2 + sx, y - 50 * this.big + sy, 4, 4); }
    }
    for (const s of this.shots) {
      const a = this.posOf(s.from, w, h), b = this.posOf(s.to, w, h);
      const t = ease(s.t);
      const x = a.x + (b.x - a.x) * t, y = a.y - 25 * this.big + (b.y - a.y) * t - Math.sin(t * Math.PI) * 10;
      const dirn = s.from === 0 ? 1 : -1;
      px(g, Math.min(x, x - dirn * 12), y + 1, 12, 1, '#b3a48b');
      if (s.weapon === 'kunai') { px(g, x - 5 * dirn, y, 9, 1, '#c9d1d8'); px(g, x + 4 * dirn, y - 1, 2, 3, '#e8eef2'); px(g, x - 7 * dirn, y - 1, 3, 3, '#5b3a2a'); }
      else { const r = Math.floor(this.clock * 20) % 2; px(g, x - 3, y, 7, 1, '#d7dde2'); px(g, x, y - 3, 1, 7, '#d7dde2'); if (r) { px(g, x - 2, y - 2, 1, 1, '#9aa3ab'); px(g, x + 2, y + 2, 1, 1, '#9aa3ab'); } }
    }
    for (const effect of this.effects) {
      const pos = this.posOf(effect.side, w, h);
      let x = effect.offset ? this.cloneX(pos.x, effect.side, effect.offset) : pos.x;
      if (effect.kind === 'fire') {
        const target = this.posOf(1 - effect.side, w, h);
        const projectile = Math.min(1, effect.age / 0.44);
        x += (target.x - x) * projectile;
      }
      drawCombatEffect(g, effect, x + sx, pos.y + sy, this.big, this.reducedMotion.matches);
    }
    g.textAlign = 'center';
    for (const f of this.floaters) {
      const k = f.age / 1.3;
      g.globalAlpha = 1 - Math.max(0, k - 0.6) / 0.4;
      g.font = `700 ${f.big ? 16 : 11}px "Pixelify Sans", sans-serif`;
      const y = Math.round(f.y - ease(k) * 18);
      g.fillStyle = '#2b1a10'; g.fillText(f.text, f.x + 1, y + 1);
      g.fillStyle = f.color; g.fillText(f.text, f.x, y);
    }
    g.globalAlpha = 1;
    g.textAlign = 'left';
    // Faixas de cinema na entrada
    const bar = Math.round((1 - ease(this.intro)) * h * 0.5);
    if (bar > 0) { g.fillStyle = '#0e1517'; g.fillRect(0, 0, w, bar); g.fillRect(0, h - bar, w, bar); }
  }

  private cloneX(x: number, side: number, index: number) {
    const outward = side === 0 ? -1 : 1;
    const gap = Math.min(12 * this.big, (this.lastW * 0.24 - 12) / Math.max(3, this.clones[side]));
    return Math.max(12, Math.min(this.lastW - 12, x + index * gap * outward));
  }

  private effect(kind: EffectKind, side: number, duration = 0.4, offset = 0, accent?: string) {
    this.effects.push({ kind, side, duration, offset, accent, age: 0 });
  }

  private drawBig(g: G, x: number, y: number, a: Actor, dir: 'left' | 'right', frame: number, alpha: number) {
    g.save();
    g.globalAlpha = alpha;
    g.translate(x, y);
    g.scale(this.big, this.big);
    drawActor(g, 0, 0, a, dir, frame);
    g.restore();
  }

  private float(side: number, text: string, color = '#fff1d2', big = false) {
    const w = this.lastW, h = this.lastH;
    const { x, y } = this.posOf(side, w, h);
    this.floaters.push({ x, y: y - 50 * this.big, text, color, age: 0, big });
  }
  private lastW = 480; private lastH = 270;
  setSize(w: number, h: number) { this.lastW = w; this.lastH = h; }

  // ——— Interface (DOM) ———
  private el<T extends HTMLElement>(sel: string) { return this.ui.querySelector(sel) as T; }

  private renderPanels() {
    for (const side of [0, 1] as const) {
      const f = this.b.fighters[side];
      const panel = this.el(`[data-side="${side}"]`);
      panel.querySelector('strong')!.textContent = f.name;
      const bars = panel.querySelector('.bars')!;
      bars.replaceChildren(...([['PV', this.displayHp[side], f.hpMax, 'var(--hp)'], ['CH', f.chakra, f.chakraMax, 'var(--ch)'], ['RES', f.stamina, f.staminaMax, 'var(--st)']] as const).map(([l, v, m, col]) => {
        const e = document.createElement('div'); e.className = 'bar';
        const a = document.createElement('span'); a.textContent = l;
        const t = document.createElement('i'); t.style.setProperty('--v', `${Math.max(0, (v / m) * 100)}%`); t.style.setProperty('--c', col);
        const n = document.createElement('em'); n.textContent = `${Math.round(v)}/${m}`;
        e.append(a, t, n); return e;
      }));
      const tags: string[] = [];
      if (f.status.clones) tags.push(`${f.status.clones} clone${f.status.clones > 1 ? 's' : ''}`);
      if (f.status.defending) tags.push('em guarda');
      if (f.status.disguised) tags.push('disfarçado');
      if (side === 0 && f.status.substitution) tags.push('substituição pronta');
      if (f.status.behind) tags.push('nas costas do rival');
      panel.querySelector('.tags')!.textContent = tags.join(' · ');
    }
    this.el('.dist').textContent = ['Corpo a corpo', 'Distância média', 'Longa distância'][this.b.distance];
  }

  private say(text: string) { this.el('.blog').textContent = text; }

  private menu(sub: 'main' | 'jutsu' = 'main') {
    const box = this.el('.cmds');
    box.replaceChildren();
    const opts = available(this.b, 0);
    const me = this.b.fighters[0];
    const mk = (label: string, detail: string, ok: boolean, fn: () => void) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = `<b></b><small></small>`;
      btn.querySelector('b')!.textContent = label;
      btn.querySelector('small')!.textContent = detail;
      btn.disabled = !ok;
      btn.onclick = fn;
      box.append(btn);
      return btn;
    };
    const pick = (a: Action) => { box.replaceChildren(); this.resolveChoice?.(a); };
    const find = (t: Action['type']) => opts.find((o) => o.action.type === t)!;
    if (sub === 'main') {
      const dist = this.b.distance;
      mk('Taijutsu', dist ? 'Avança e golpeia' : 'Golpe corpo a corpo', true, () => pick({ type: 'taijutsu' }));
      mk('Kunai', `${me.items.kunai} restantes`, find('kunai').ok, () => pick({ type: 'kunai' }));
      mk('Shuriken', `${me.items.shuriken} restantes`, find('shuriken').ok, () => pick({ type: 'shuriken' }));
      const jut = opts.filter((o) => o.action.type === 'jutsu');
      mk('Técnicas', jut.length ? `${jut.length} conhecidas` : 'Nenhuma ainda', jut.some((o) => o.ok), () => this.menu('jutsu'));
      mk('Avançar', 'Encurta a distância', find('advance').ok, () => pick({ type: 'advance' }));
      mk('Recuar', 'Abre distância', find('retreat').ok, () => pick({ type: 'retreat' }));
      mk('Defender', 'Metade do dano, recupera fôlego', true, () => pick({ type: 'defend' }));
      mk('Concentrar', 'Recupera chakra, fica exposto', find('focus').ok, () => pick({ type: 'focus' }));
      mk('Render-se', 'Encerra a luta', true, () => pick({ type: 'yield' }));
    } else {
      for (const o of opts.filter((x) => x.action.type === 'jutsu')) {
        const id = (o.action as { id: string }).id, j = JUTSUS[id];
        mk(j.name.replace(' no Jutsu', ''), `${j.chakraCost} CH · ${o.ok ? `domínio ${Math.round(me.jutsus[id])}%` : o.why}`, o.ok, () => pick(o.action));
      }
      mk('Voltar', '', true, () => this.menu('main'));
    }
    (box.querySelector('button:not(:disabled)') as HTMLButtonElement | null)?.focus();
  }

  private choose(): Promise<Action> {
    this.menu('main');
    this.say(`Sua vez. ${this.b.round ? '' : 'Leia a distância: taijutsu rende colado, shuriken rende de longe.'}`);
    return new Promise((r) => (this.resolveChoice = r));
  }

  // ——— Execução ———
  async run(): Promise<Battle> {
    const [a, b] = this.b.fighters;
    this.ui.hidden = false;
    const face = (side: number) => { const cvs = this.el<HTMLCanvasElement>(`[data-side="${side}"] canvas`); const fg = cvs.getContext('2d')!; fg.imageSmoothingEnabled = false; fg.clearRect(0, 0, 40, 40); fg.drawImage(portrait(this.actors[side]), 0, 0); };
    face(0); face(1);
    this.renderPanels();
    const vs = this.el('.vs');
    this.el('.vs-a').textContent = a.name;
    this.el('.vs-b').textContent = b.name;
    const style = DUEL_STYLES[b.id];
    this.el('.vs-t').textContent = style ? `${this.setup.title} · ${style.title}` : this.setup.title;
    vs.classList.remove('show'); void vs.offsetWidth; vs.classList.add('show');
    await wait(1700);
    while (!this.b.over) {
      const mine = await this.choose();
      const theirs = chooseAction(this.b, 1, this.rng);
      const ev = resolveRound(this.b, [mine, theirs]);
      await this.play(ev);
      this.displayHp = this.b.fighters.map((f) => f.hp);
      this.renderPanels();
    }
    const won = this.b.over.winner === 0;
    this.say(won ? `${b.name} não consegue continuar.` : this.b.over.reason === 'yield' ? 'Você se rendeu.' : `${a.name} não consegue continuar.`);
    const end = this.el('.vs');
    this.el('.vs-t').textContent = '';
    this.el('.vs-a').textContent = won ? 'Vitória' : 'Derrota';
    this.el('.vs-b').textContent = '';
    end.classList.remove('show'); void end.offsetWidth; end.classList.add('show');
    await wait(1800);
    this.ui.hidden = true;
    this.active = false;
    return this.b;
  }

  private async play(events: Ev[]) {
    const name = (w: number) => this.b.fighters[w].name;
    for (const e of events) {
      switch (e.t) {
        case 'act':
          this.say(`${name(e.who)}: ${e.label}`);
          await wait(260);
          break;
        case 'move':
          this.sepTarget = this.zoneSep(e.distance);
          this.poses[e.who].frame = 0;
          await this.anim(e.dash ? 160 : 320, (t) => { this.poses[e.who].frame = Math.floor(t * 8) % 4; });
          this.poses[e.who].frame = -1;
          break;
        case 'strike': {
          const style = DUEL_STYLES[this.b.fighters[e.who].id];
          this.effect('slash', e.who, 0.28, 0, style?.accent);
          audio.sfx('strike');
          await this.anim(150, (t) => {
            this.poses[e.who].dx = ease(t) * (this.reducedMotion.matches ? 6 : 18);
            this.poses[e.who].frame = t > 0.45 ? 2 : 0;
            if (!this.reducedMotion.matches && style?.opener === 'finta') this.poses[e.who].dy = -Math.round(Math.sin(t * Math.PI) * 6);
          });
          break;
        }
        case 'throw':
          this.shots.push({ from: e.who, to: 1 - e.who, t: 0, weapon: e.weapon });
          this.poses[e.who].frame = 1;
          await wait(300);
          this.poses[e.who].frame = -1;
          break;
        case 'hit': {
          const p = this.poses[e.who];
          this.displayHp[e.who] = Math.max(0, this.displayHp[e.who] - e.amount);
          this.effect(e.guarded ? 'guard' : 'impact', e.who);
          audio.sfx(e.guarded ? 'guard' : 'impact');
          this.shake = e.guarded ? 1 : e.crit ? 7 : 4;
          const feedback = e.guarded ? `Bloqueio −${e.amount}` : e.crit ? `Crítico −${e.amount}` : `−${e.amount}`;
          this.say(`${name(e.who)} ${e.guarded ? 'bloqueou parte do golpe' : e.crit ? 'sofreu um golpe crítico' : 'foi atingido'}.`);
          this.float(e.who, feedback, e.guarded ? '#9be2d4' : e.crit ? '#f0c27a' : '#ff8a6e', e.crit);
          this.renderPanels();
          await this.anim(220, (t) => { p.dx = -Math.sin(t * Math.PI) * (e.guarded || this.reducedMotion.matches ? 3 : 8); });
          this.resetStrike();
          break;
        }
        case 'counter': {
          const victim = 1 - e.who;
          this.displayHp[victim] = Math.max(0, this.displayHp[victim] - e.amount);
          this.say(`${name(e.who)} respondeu com um contra-ataque.`);
          this.float(e.who, 'Contra-ataque!', '#f0c27a');
          this.effect('guard', e.who);
          this.effect('impact', victim);
          audio.sfx('impact');
          this.shake = 5;
          this.float(victim, `-${e.amount}`, '#ff8a6e');
          this.renderPanels();
          await wait(380);
          this.resetStrike();
          break;
        }
        case 'miss': {
          const p = this.poses[e.who];
          this.say(`${name(e.who)} escapou do golpe.`);
          this.float(e.who, 'Esquiva', '#cfe3ea');
          await this.anim(260, (t) => { p.dy = -Math.sin(t * Math.PI) * 14; });
          p.dy = 0;
          this.resetStrike();
          break;
        }
        case 'clone-pop':
          this.effect('smoke', e.who, 0.44, this.clones[e.who]);
          this.clones[e.who] = Math.max(0, this.clones[e.who] - 1);
          audio.sfx('chakra');
          this.say(`O golpe acertou o clone de ${name(e.who)}.`);
          this.float(e.who, 'Acertou um clone', '#cfe3ea');
          this.renderPanels();
          await wait(520);
          this.resetStrike();
          break;
        case 'substitute': {
          this.effect('smoke', e.who, 0.45);
          this.effect('log', e.who);
          audio.sfx('chakra');
          const p = this.poses[e.who];
          this.float(e.who, 'Substituição!', '#cfe3ea', true);
          await this.anim(300, (t) => { p.alpha = 1 - Math.sin(t * Math.PI) * 0.9; });
          p.alpha = 1;
          this.renderPanels();
          this.resetStrike();
          break;
        }
        case 'seals':
          this.effect('chakra', e.who, 0.34);
          audio.sfx('chakra');
          this.float(e.who, 'Selos de mão', '#e9dcc0');
          await wait(300);
          break;
        case 'clones':
          this.clones[e.who] = e.count;
          for (let i = 1; i <= e.count; i++) this.effect('smoke', e.who, 0.48, i);
          this.float(e.who, `${e.count} clone${e.count > 1 ? 's' : ''}`, '#cfe3ea', true); this.renderPanels(); await wait(420); break;
        case 'disguise':
          this.effect('smoke', e.who, 0.48);
          this.disguises[e.who] = true;
          this.float(e.who, 'Transformação', '#cfe3ea', true); this.renderPanels(); await wait(420); break;
        case 'reveal':
          this.effect('smoke', e.who, 0.36);
          this.disguises[e.who] = false;
          this.float(e.who, 'Disfarce desfeito', '#e9dcc0'); this.renderPanels(); await wait(300); break;
        case 'fail': this.effect('fizzle', e.who); this.float(e.who, 'A técnica falhou', '#ff8a6e', true); this.say(`${name(e.who)} errou os selos de ${JUTSUS[e.jutsu]?.name ?? 'uma técnica'}.`); await wait(520); break;
        case 'focus': this.effect('chakra', e.who, 0.48); this.float(e.who, `+${e.amount} CH`, '#8fd3e8'); this.renderPanels(); await wait(380); break;
        case 'defend': this.effect('guard', e.who); this.float(e.who, 'Em guarda', '#f0c27a'); this.renderPanels(); await wait(300); break;
        case 'technique': this.effect('fire', e.who, 0.55); audio.sfx('strike'); await wait(440); break;
        case 'text': this.say(e.text); await wait(500); break;
        case 'end': break;
      }
    }
    this.resetStrike();
    this.clones = this.b.fighters.map((f) => f.status.clones);
    this.disguises = this.b.fighters.map((f) => f.status.disguised);
    await wait(150);
  }

  private resetStrike() { for (const p of this.poses) { p.dx = p.dy = 0; p.frame = -1; } }

  private anim(ms: number, step: (t: number) => void) {
    return new Promise<void>((done) => {
      const t0 = performance.now();
      const tick = () => {
        const t = Math.min(1, (performance.now() - t0) / ms);
        step(t);
        if (t < 1) requestAnimationFrame(tick); else done();
      };
      requestAnimationFrame(tick);
    });
  }
}

