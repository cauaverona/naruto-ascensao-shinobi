// Som do jogo, sintetizado com WebAudio: sem arquivos, funciona offline.
// A música é original: uma melodia de cordas dedilhadas na escala pentatônica Hirajoshi (ré),
// em volume baixo. Os efeitos são cliques curtos de interface, no estilo de jogos 2D.
export type Track = 'vila' | 'luta';
export type Sfx = 'hover' | 'confirm' | 'back' | 'tick';

type Bar = (number | null)[];
interface TrackDef { bpm: number; melody: Bar[]; bass: Bar[] }

// Notas em semitons a partir de ré4. Escala: 0 2 3 7 8 (+12).
const TRACKS: Record<Track, TrackDef> = {
  vila: {
    bpm: 80,
    melody: [
      [12, null, 7, null, 8, null, 7, null],
      [3, null, 7, null, 2, null, 0, null],
      [12, null, 15, null, 14, null, 12, null],
      [7, null, 3, null, 2, null, 0, null],
      [7, 8, 7, null, 3, null, 2, null],
      [3, null, 2, null, 0, null, null, null],
      [7, null, 8, null, 12, null, 8, 7],
      [7, null, 3, null, 2, null, 0, null],
    ],
    bass: [
      [-12, null, null, null, -5, null, null, null],
      [-12, null, null, null, -5, null, null, null],
      [-9, null, null, null, -5, null, null, null],
      [-12, null, null, null, -5, null, null, null],
      [-12, null, null, null, -5, null, null, null],
      [-9, null, null, null, -5, null, null, null],
      [-7, null, null, null, -5, null, null, null],
      [-12, null, null, null, null, null, null, null],
    ],
  },
  luta: {
    bpm: 116,
    melody: [
      [12, null, 12, 15, 14, null, 12, null],
      [8, null, 7, 8, 7, null, 3, null],
      [12, 14, 15, 14, 12, null, 8, 7],
      [7, null, 8, 7, 3, null, 2, 0],
    ],
    bass: [
      [-12, null, -12, null, -5, null, -12, null],
      [-9, null, -9, null, -5, null, -9, null],
      [-12, null, -12, null, -5, null, -12, -5],
      [-9, null, -5, null, -12, null, -5, null],
    ],
  },
};

const STORE = 'ascensao.audio';
const D4 = 293.66;
const freq = (semi: number) => D4 * Math.pow(2, semi / 12);

class GameAudio {
  music = true;
  sfxOn = true;
  private ctx: AudioContext | null = null;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private current: Track = 'vila';
  private step = 0;
  private nextTime = 0;
  private timer = 0;

  constructor() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) ?? 'null');
      if (s) { this.music = s.music !== false; this.sfxOn = s.sfx !== false; }
    } catch { /* usa o padrão */ }
  }

  get enabled() { return this.music || this.sfxOn; }

  private save() { try { localStorage.setItem(STORE, JSON.stringify({ music: this.music, sfx: this.sfxOn })); } catch { /* sem armazenamento */ } }

  /** Navegadores só liberam o som depois de um gesto do jogador. */
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = this.music ? 0.085 : 0;
    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.2;
    // Eco curto e suave para dar espaço às cordas.
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.34;
    const fb = ctx.createGain(); fb.gain.value = 0.32;
    const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 1800;
    const wet = ctx.createGain(); wet.gain.value = 0.38;
    this.musicBus.connect(master);
    this.musicBus.connect(delay);
    delay.connect(tone); tone.connect(fb); fb.connect(delay); tone.connect(wet); wet.connect(master);
    this.sfxBus.connect(master);
    this.nextTime = ctx.currentTime + 0.15;
    this.timer = window.setInterval(() => this.schedule(), 90);
  }

  /** Pausa tudo quando a aba fica em segundo plano. */
  visible(on: boolean) {
    if (!this.ctx) return;
    if (on) void this.ctx.resume(); else void this.ctx.suspend();
  }

  setMusic(on: boolean) {
    this.music = on; this.save();
    if (this.ctx) this.musicBus.gain.setTargetAtTime(on ? 0.085 : 0, this.ctx.currentTime, 0.15);
  }
  setSfx(on: boolean) { this.sfxOn = on; this.save(); }
  toggleAll() { const on = !this.enabled; this.setMusic(on); this.setSfx(on); }

  track(t: Track) {
    if (t === this.current) return;
    this.current = t;
    this.step = 0;
    if (this.ctx) this.nextTime = this.ctx.currentTime + 0.12;
  }

  // ——— Música ———
  private schedule() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.music) { if (ctx) this.nextTime = Math.max(this.nextTime, ctx.currentTime); return; }
    const def = TRACKS[this.current];
    const eighth = 60 / def.bpm / 2;
    while (this.nextTime < ctx.currentTime + 0.3) {
      const bar = Math.floor(this.step / 8) % def.melody.length, i = this.step % 8;
      const m = def.melody[bar][i], b = def.bass[bar][i];
      if (m !== null) this.pluck(freq(m), this.nextTime, eighth * 3.4, 0.5, 3400);
      if (b !== null) this.pluck(freq(b), this.nextTime, eighth * 4.5, 0.55, 900);
      this.nextTime += eighth;
      this.step = (this.step + 1) % (def.melody.length * 8);
    }
  }

  /** Corda dedilhada: ataque rápido, decaimento longo, harmônico sutil. */
  private pluck(f: number, t: number, dur: number, peak: number, cutoff: number) {
    const ctx = this.ctx!;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(peak, t + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(cutoff, t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(300, cutoff * 0.25), t + dur);
    env.connect(lp); lp.connect(this.musicBus);
    for (const [mult, type, gain] of [[1, 'triangle', 1], [2, 'sine', 0.28]] as const) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f * mult; g.gain.value = gain;
      o.connect(g); g.connect(env);
      o.start(t); o.stop(t + dur + 0.05);
    }
  }

  // ——— Efeitos de interface ———
  sfx(kind: Sfx) {
    const ctx = this.ctx;
    if (!ctx || !this.sfxOn || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const blip = (f0: number, f1: number, at: number, len: number, peak: number, type: OscillatorType = 'square') => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, at);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, at + len);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(peak, at + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, at + len);
      o.connect(g); g.connect(this.sfxBus);
      o.start(at); o.stop(at + len + 0.02);
    };
    switch (kind) {
      case 'hover': blip(1250, 1250, t, 0.035, 0.22); break;
      case 'tick': blip(900, 820, t, 0.03, 0.16); break;
      case 'confirm': blip(660, 660, t, 0.06, 0.3); blip(990, 990, t + 0.055, 0.1, 0.3); break;
      case 'back': blip(520, 520, t, 0.06, 0.28); blip(390, 390, t + 0.055, 0.1, 0.28); break;
    }
  }

  dispose() { clearInterval(this.timer); }
}

export const audio = new GameAudio();
