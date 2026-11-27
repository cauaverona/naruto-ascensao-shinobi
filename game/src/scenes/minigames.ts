// Minijogos de treino. Cada um devolve uma nota de 0 a 1 que vira evolução de atributo e domínio.
import type { Tactic } from '../data/squad';
import { SEALS } from '../data/academy';
import type { Jutsu } from '../data/jutsus';
import { drawCombatEffect, type EffectKind } from '../render/combat-effects';
import { drawActor, type Actor } from '../render/sprites';
import { px, ovalpx } from '../render/gfx';

type G = CanvasRenderingContext2D;

export interface Minigame {
  title: string;
  help: string;
  done: boolean;
  score: number;
  /** Opções clicáveis (minijogo de selos). */
  options?: { label: string; sub: string }[];
  update(dt: number): void;
  render(g: G, w: number, h: number): void;
  press(down: boolean): void;
  choose?(i: number): void;
  status(): string;
}

const panel = (g: G, x: number, y: number, w: number, h: number) => {
  px(g, x - 2, y - 2, w + 4, h + 4, '#2b1a10');
  px(g, x, y, w, h, '#f3e5c2');
  px(g, x, y, w, 2, '#a06b3f');
};

/** Alvo de arremesso: a mira oscila e você solta no momento certo. */
export class KunaiGame implements Minigame {
  title = 'Alvos de arremesso';
  help = 'Aperte E, espaço ou toque quando a mira passar pelo centro. 5 kunai.';
  done = false; score = 0;
  private t = 0; private marks: { x: number; y: number }[] = []; private total = 0;
  constructor(private steadiness: number) {}
  private aim(w: number, h: number) {
    const R = 34, cx = w / 2, cy = Math.round(h * 0.42);
    const speed = (1.25 + this.marks.length * 0.18) / (1 + this.steadiness * 0.05);
    return { x: cx + Math.sin(this.t * 2.3 * speed) * R * 1.15, y: cy + Math.sin(this.t * 3.1 * speed + 1.2) * R * 0.85, cx, cy, R };
  }
  private w = 480; private h = 270;
  update(dt: number) { this.t += dt; }
  render(g: G, w: number, h: number) {
    this.w = w; this.h = h;
    const { x, y, cx, cy, R } = this.aim(w, h);
    g.fillStyle = 'rgba(14,21,23,.55)'; g.fillRect(0, 0, w, h);
    px(g, cx - 2, cy + R - 2, 5, 40, '#6e5439');
    ovalpx(g, cx, cy, R + 3, R + 3, '#3b2a1e'); ovalpx(g, cx, cy, R, R, '#efe2c0'); ovalpx(g, cx, cy, Math.round(R * 0.72), Math.round(R * 0.72), '#b5483a');
    ovalpx(g, cx, cy, Math.round(R * 0.46), Math.round(R * 0.46), '#efe2c0'); ovalpx(g, cx, cy, Math.round(R * 0.2), Math.round(R * 0.2), '#b5483a');
    for (const m of this.marks) { px(g, m.x - 1, m.y - 6, 2, 7, '#5b3a2a'); px(g, m.x - 1, m.y, 2, 2, '#c9d1d8'); }
    if (!this.done) {
      g.strokeStyle = '#1b2224'; g.lineWidth = 1;
      px(g, x - 7, y, 5, 1, '#fff'); px(g, x + 3, y, 5, 1, '#fff'); px(g, x, y - 7, 1, 5, '#fff'); px(g, x, y + 3, 1, 5, '#fff');
      px(g, x - 1, y - 1, 3, 3, '#f0c27a');
    }
  }
  press(down: boolean) {
    if (!down || this.done) return;
    const { x, y, cx, cy, R } = this.aim(this.w, this.h);
    this.marks.push({ x: Math.round(x), y: Math.round(y) });
    this.total += Math.max(0, 1 - Math.hypot(x - cx, y - cy) / R);
    if (this.marks.length >= 5) { this.done = true; this.score = this.total / 5; }
  }
  status() { return `Kunai ${Math.min(5, this.marks.length + 1)}/5`; }
}

/** Troncos: golpes no tempo certo, a zona boa encolhe a cada acerto. */
export class StrikeGame implements Minigame {
  done = false; score = 0;
  private pos = 0; private dir = 1; private hits = 0; private total = 0; private zone = 0.2; private shake = 0; private last = '';
  constructor(private power: number, public title = 'Troncos de treino',
    public help = 'Aperte quando o marcador estiver na faixa dourada. 6 golpes.', private target: 'log' | 'bell' | 'track' = 'log',
    private tactic?: Tactic) {
    if (tactic === 'rastreio') this.zone = 0.27;
  }
  update(dt: number) {
    const tempo = this.tactic === 'bloqueio' ? 0.72 : 0.9;
    this.pos += this.dir * dt * (tempo + this.hits * 0.12);
    if (this.pos > 1) { this.pos = 1; this.dir = -1; }
    if (this.pos < 0) { this.pos = 0; this.dir = 1; }
    this.shake = Math.max(0, this.shake - dt * 30);
  }
  render(g: G, w: number, h: number) {
    g.fillStyle = 'rgba(14,21,23,.55)'; g.fillRect(0, 0, w, h);
    const cx = w / 2, base = Math.round(h * 0.5), s = this.shake ? Math.round((Math.random() - 0.5) * this.shake) : 0;
    if (this.target === 'bell') {
      for (const x of [cx - 13, cx + 13]) {
        px(g, x, base - 55, 2, 19, '#966749');
        ovalpx(g, x + s, base - 29, 8, 9, '#b98642');
        px(g, x - 3 + s, base - 33, 4, 6, '#f0cd75');
        px(g, x - 2 + s, base - 19, 4, 3, '#805936');
      }
    } else if (this.target === 'track') {
      px(g, cx - 42, base - 21, 84, 24, '#8f7456');
      px(g, cx - 42, base - 18, 84, 18, '#c29a68');
      for (const x of [cx - 28, cx - 2, cx + 24]) {
        px(g, x, base - 36, 2, 34, '#593f34');
        px(g, x + 2, base - 36, 10, 6, x < cx - 10 ? '#a5be77' : '#e4ad66');
      }
      px(g, cx - 39, base - 11, Math.min(76, 11 + this.hits * 12), 3, '#efcf87');
    } else {
      px(g, cx - 10 + s, base - 56, 20, 60, '#6d5338');
      px(g, cx - 8 + s, base - 56, 5, 58, '#9b7a50');
      ovalpx(g, cx + s, base - 56, 10, 3, '#c9a56c');
      px(g, cx - 10 + s, base - 38, 20, 4, '#d9c08c');
      for (let i = 0; i < this.hits; i++) px(g, cx - 6 + s + (i % 3) * 4, base - 30 + Math.floor(i / 3) * 6, 3, 1, '#3d2c1e');
    }
    const bw = Math.min(260, w - 40), bx = Math.round(cx - bw / 2), by = base + 20;
    panel(g, bx, by, bw, 12);
    const zw = Math.round(bw * this.zone), zx = Math.round(cx - zw / 2);
    px(g, zx, by + 2, zw, 8, '#f0c27a'); px(g, Math.round(cx - zw / 4), by + 2, Math.round(zw / 2), 8, '#e07a52');
    px(g, bx + Math.round(this.pos * (bw - 3)), by - 4, 3, 20, '#2b1a10');
    if (this.last) { g.font = '700 14px "Pixelify Sans", sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff1d2'; g.fillText(this.last, cx, by + 36); g.textAlign = 'left'; }
  }
  press(down: boolean) {
    if (!down || this.done) return;
    const d = Math.abs(this.pos - 0.5);
    const covered = this.tactic === 'distracao' && this.hits === 0;
    const q = d < this.zone / 4 ? 1 : d < this.zone / 2 ? 0.65 : covered ? 0.4 : 0;
    this.last = q === 1 ? 'Tempo perfeito!' : q === 0.4 ? 'Seu colega cobriu a abertura' : q ? 'Boa aproximação' : 'Errou o tempo';
    if (q) { this.shake = 6 + this.power * 0.5; this.zone = Math.max(0.08, this.zone - 0.02); }
    this.total += q; this.hits++;
    if (this.hits >= 6) { this.done = true; this.score = this.total / 6; }
  }
  status() { return `Tentativa ${Math.min(6, this.hits + 1)}/6`; }
}

/** Meditação: segure para subir o chakra e mantenha-o dentro da faixa que se move. */
export class ChakraGame implements Minigame {
  title = 'Controle de chakra';
  help = 'Segure E, espaço ou o botão A para subir o chakra; solte para descer. Fique dentro da faixa.';
  done = false; score = 0;
  private level = 0.2; private held = false; private t = 0; private inside = 0; private readonly length = 8;
  constructor(private control: number, private breathing = false) {
    if (breathing) {
      this.title = 'Ritmo de fôlego';
      this.help = 'Segure E ou A para inspirar e solte para expirar. Siga a faixa verde.';
    }
  }
  private band() { const c = 0.5 + Math.sin(this.t * 0.9) * 0.28 + Math.sin(this.t * 2.1) * 0.06; const half = 0.09 + this.control * 0.006; return [c - half, c + half]; }
  update(dt: number) {
    if (this.done) return;
    this.t += dt;
    this.level = Math.max(0, Math.min(1, this.level + (this.held ? 0.75 : -0.6) * dt));
    const [lo, hi] = this.band();
    if (this.level >= lo && this.level <= hi) this.inside += dt;
    if (this.t >= this.length) { this.done = true; this.score = Math.min(1, this.inside / (this.length * 0.85)); }
  }
  render(g: G, w: number, h: number) {
    g.fillStyle = 'rgba(14,21,23,.6)'; g.fillRect(0, 0, w, h);
    const gh = Math.min(150, h - 110), gx = Math.round(w / 2 - 9), gy = Math.round(h * 0.18);
    panel(g, gx, gy, 18, gh);
    const [lo, hi] = this.band();
    const y = (v: number) => Math.round(gy + gh - v * gh);
    px(g, gx + 2, y(hi), 14, y(lo) - y(hi), this.breathing ? '#8eb983' : '#7fcbe0');
    const ly = y(this.level);
    const inBand = this.level >= lo && this.level <= hi;
    px(g, gx - 6, ly - 1, 30, 3, inBand ? '#f0c27a' : '#2b1a10');
    const lx = gx + 40, lyy = gy + 20;
    if (this.breathing) {
      const width = Math.round(8 + this.level * 8);
      ovalpx(g, lx, lyy, width, 5, '#42664f');
      ovalpx(g, lx, lyy, width - 2, 3, inBand ? '#d0dfaa' : '#759674');
    } else {
      ovalpx(g, lx, lyy, 8, 4, inBand ? '#a6d17a' : '#6f8f4f');
      px(g, lx - 8, lyy, 16, 1, '#3e5a30');
    }
    px(g, gx + 24, gy + gh + 12, Math.round(((this.t / this.length) * 100)), 3, '#e07a52');
  }
  press(down: boolean) { this.held = down; }
  status() { return `${Math.max(0, Math.ceil(this.length - this.t))} s`; }
}

/** Selos de mão: repita a sequência escolhendo o selo certo entre quatro. */
export class SealsGame implements Minigame {
  title = 'Sequência de selos';
  help = 'Escolha o selo destacado. Teclas 1 a 4 ou toque. Rápido e sem errar.';
  done = false; score = 0;
  options: { label: string; sub: string }[] = [];
  private seq: number[]; private idx = 0; private right = 0; private t = 0; private flash = 0; private wrong = false;
  private choices: number[] = [];
  constructor(count: number, private rand: () => number, private perSeal = 2.4) {
    this.seq = Array.from({ length: count }, () => Math.floor(rand() * SEALS.length));
    this.roll();
  }
  private roll() {
    const target = this.seq[this.idx];
    const pool = new Set<number>([target]);
    while (pool.size < 4) pool.add(Math.floor(this.rand() * SEALS.length));
    this.choices = [...pool].sort(() => this.rand() - 0.5);
    this.options = this.choices.map((i) => ({ label: SEALS[i].kanji, sub: SEALS[i].name }));
  }
  update(dt: number) {
    if (this.done) return;
    this.t += dt; this.flash = Math.max(0, this.flash - dt * 3);
    if (this.t > this.perSeal) this.choose(-1);
  }
  render(g: G, w: number, h: number) {
    g.fillStyle = 'rgba(14,21,23,.6)'; g.fillRect(0, 0, w, h);
    const n = this.seq.length, size = Math.min(34, Math.floor((w - 40) / n) - 6), total = n * (size + 6) - 6;
    let x = Math.round(w / 2 - total / 2);
    const y = Math.round(h * 0.2);
    g.textAlign = 'center';
    this.seq.forEach((s, i) => {
      const cur = i === this.idx && !this.done;
      panel(g, x, y + (cur ? -4 : 0), size, size);
      if (i < this.idx) px(g, x, y, size, size, 'rgba(127,164,85,.35)');
      if (cur && this.flash && this.wrong) px(g, x, y - 4, size, size, `rgba(194,85,63,${this.flash})`);
      g.font = `700 ${Math.round(size * 0.62)}px serif`;
      g.fillStyle = i < this.idx ? '#5a7a3e' : cur ? '#c2553f' : '#6b5139';
      g.fillText(SEALS[s].kanji, x + size / 2, y + size * 0.72 + (cur ? -4 : 0));
      x += size + 6;
    });
    g.textAlign = 'left';
    if (!this.done) px(g, Math.round(w / 2 - 60), y + size + 12, Math.round(120 * (1 - this.t / this.perSeal)), 3, '#e07a52');
  }
  press() { /* selos usam escolha, não pressão */ }
  choose(i: number) {
    if (this.done) return;
    const ok = i >= 0 && this.choices[i] === this.seq[this.idx];
    if (ok) this.right += Math.max(0.55, 1 - this.t / (this.perSeal * 1.6));
    this.wrong = !ok; this.flash = ok ? 0 : 1;
    this.idx++; this.t = 0;
    if (this.idx >= this.seq.length) { this.done = true; this.score = this.right / this.seq.length; this.options = []; }
    else this.roll();
  }
  status() { return `Selo ${Math.min(this.seq.length, this.idx + 1)}/${this.seq.length}`; }
}

const POSITIONS = [
  { label: '↖', sub: 'Superior esquerda' }, { label: '↗', sub: 'Superior direita' },
  { label: '↙', sub: 'Inferior esquerda' }, { label: '↘', sub: 'Inferior direita' },
];

export class ObservationGame implements Minigame {
  title: string;
  help: string;
  done = false;
  score = 0;
  options: { label: string; sub: string }[] = [];
  private target = 0;
  private round = 0;
  private elapsed = 0;
  private earned = 0;

  constructor(private illusion: boolean, private rand: () => number) {
    this.title = illusion ? 'Reconhecer ilusões' : 'Leitura tática';
    this.help = illusion ? 'Memorize o selo verdadeiro, marcado com dois anéis. Depois aponte a posição.' :
      'Memorize a passagem livre entre os bloqueios. Depois aponte a posição.';
    this.next();
  }

  private next() {
    this.target = Math.floor(this.rand() * 4);
    this.elapsed = 0;
    this.options = [];
  }

  update(dt: number) {
    if (this.done) return;
    this.elapsed += dt;
    if (this.elapsed >= 4) this.choose(-1);
    else if (this.elapsed >= 1.2) this.options = POSITIONS;
  }

  choose(index: number) {
    if (this.done || !this.options.length) return;
    if (index === this.target) this.earned++;
    this.round++;
    if (this.round === 4) {
      this.done = true;
      this.score = this.earned / 4;
      this.options = [];
    } else this.next();
  }

  press() { /* O exercício usa escolhas direcionais. */ }

  render(g: G, w: number, h: number) {
    px(g, 0, 0, w, h, 'rgba(14,21,23,.65)');
    const x = Math.round(w / 2 - 39), y = Math.round(h * 0.13);
    const visible = this.elapsed < 1.2 && !this.done;
    for (let i = 0; i < 4; i++) {
      const tx = x + (i % 2) * 42, ty = y + Math.floor(i / 2) * 34;
      panel(g, tx, ty, 35, 27);
      if (!visible) continue;
      const correct = i === this.target;
      if (this.illusion) {
        ovalpx(g, tx + 17, ty + 14, 10, 8, correct ? '#7ab3af' : '#8f789a');
        if (correct) ovalpx(g, tx + 17, ty + 14, 6, 4, '#e3dcae');
        px(g, tx + 15, ty + 12, 4, 4, '#51465f');
      } else {
        px(g, tx + 5, ty + 7, 25, 13, correct ? '#96b978' : '#866052');
        if (correct) {
          px(g, tx + 15, ty + 10, 5, 7, '#e9e2b4');
        } else {
          for (const mark of [0, 1, 2]) px(g, tx + 8 + mark * 7, ty + 6, 3, 15, '#473f36');
        }
      }
    }
  }

  status() {
    const step = this.options.length ? 'Responda' : 'Observe';
    return `${step} · ${Math.min(4, this.round + 1)}/4`;
  }
}

export class JutsuPracticeGame extends SealsGame {
  private elapsed = 0;
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(private technique: Jutsu, private actor: Actor, rand: () => number, private successScore = 0.5) {
    super(technique.era === 'academia' ? 4 : 6, rand, 2.6);
    this.title = `Treino · ${technique.name}`;
  }

  update(dt: number) {
    if (this.done) this.elapsed += dt;
    else super.update(dt);
  }

  render(g: G, w: number, h: number) {
    if (!this.done) { super.render(g, w, h); return; }
    g.fillStyle = 'rgba(14,21,23,.55)'; g.fillRect(0, 0, w, h);
    const x = Math.round(w / 2), y = Math.round(h * 0.46);
    const effect = this.technique.effect;
    const executed = this.score >= this.successScore;
    const burst = (kind: EffectKind, at: number) =>
      drawCombatEffect(g, { kind, age: this.elapsed, duration: 1.25, side: 0, offset: 0 }, at, y, 1, this.reducedMotion);
    ovalpx(g, x, y - 1, 12, 3, '#3f4236');
    if (executed && effect === 'substitution') {
      drawActor(g, x + 32, y, this.actor, 'left', -1);
      burst('log', x); burst('smoke', x);
    } else {
      const transformed = executed && effect === 'disguise' && this.elapsed > 0.26;
      drawActor(g, x, y, transformed ? { role: 'gen' } : this.actor, 'right', -1);
      if (!executed) burst('fizzle', x);
      else if (effect === 'clones') {
        for (const offset of [-32, 32]) {
          g.save(); g.globalAlpha = this.technique.rank === 'E' ? 0.55 : 0.9;
          drawActor(g, x + offset, y, this.actor, 'right', -1); g.restore();
          burst('smoke', x + offset);
        }
      } else if (effect === 'damage') burst(this.technique.visual ?? 'fire', x + 24 + (this.reducedMotion ? 0 : this.elapsed * 30));
      else burst('smoke', x);
    }
  }
}

export function grade(score: number) {
  return score >= 0.85 ? 'Excelente!' : score >= 0.6 ? 'Bom trabalho' : score >= 0.35 ? 'Razoável' : 'Precisa treinar mais';
}
