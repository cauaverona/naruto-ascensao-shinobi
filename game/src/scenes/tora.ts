import type { Tactic } from '../data/squad';
import { px } from '../render/gfx';
import { drawTora } from '../render/mission-art';
import type { Minigame } from './minigames';

const PLAN = {
  rastreio: { pause: 0.88, travel: 1.15, grace: 0, help: 'A marca dourada antecipa a parada. Pressione E ou A quando aparecer “Agora”.' },
  bloqueio: { pause: 1.25, travel: 1.3, grace: 0, help: 'Seu colega fecha a saída e Tora demora a virar. Pressione E ou A enquanto ele estiver parado.' },
  distracao: { pause: 0.62, travel: 0.96, grace: 1, help: 'Seu colega cobre um erro. Pressione E ou A quando Tora parar para olhar a isca.' },
  sozinho: { pause: 0.59, travel: 1.23, grace: 0, help: 'Espere Tora parar e pressione E ou A. Três passos certos para chegar perto.' },
};

export class ToraGame implements Minigame {
  title = 'Tora · Aproximação';
  help: string;
  done = false;
  score = 0;
  private time = 0;
  private caught = 0;
  private noise = 0;
  private facing = 1;
  private usedWindow = false;
  private grace: number;
  private report = '';
  private plan;

  constructor(private tactic: Tactic | 'sozinho') {
    this.plan = PLAN[tactic];
    this.grace = this.plan.grace;
    this.help = this.plan.help;
  }

  private get open() { return this.time >= this.plan.travel; }

  update(dt: number) {
    if (this.done) return;
    this.time += dt;
    if (this.time >= this.plan.travel + this.plan.pause) {
      this.time = 0;
      this.facing *= -1;
      this.usedWindow = false;
      this.report = '';
    }
  }

  press(down: boolean) {
    if (!down || this.done || this.usedWindow) return;
    this.usedWindow = true;
    if (this.open) {
      this.caught++;
      this.report = 'Mais perto';
    } else if (this.grace) {
      this.grace--;
      this.report = 'Seu colega cobriu o ruído';
    } else {
      this.noise++;
      this.report = 'Tora ouviu';
    }
    this.done = this.caught === 3 || this.noise === 2;
    this.score = this.caught === 3 ? 1 : 0;
  }

  render(g: CanvasRenderingContext2D, w: number, h: number) {
    px(g, 0, 0, w, h, 'rgba(20,36,31,.53)');
    const cx = Math.round(w / 2), base = Math.round(h * 0.55), width = Math.min(160, w - 32);
    const progress = Math.min(1, this.time / this.plan.travel);
    const x = cx + this.facing * (progress - 0.5) * (width - 32);
    px(g, cx - width / 2, base - 20, width, 30, '#2d422f');
    px(g, cx - width / 2 + 2, base - 17, width - 4, 25, '#587347');
    px(g, cx - width / 2 + 2, base + 3, width - 4, 5, '#ac8d5b');
    for (let i = 0; i < 3; i++) {
      px(g, cx - 21 + i * 16, base + 15, 12, 4, i < this.caught ? '#ecc477' : '#495948');
    }
    if (this.tactic === 'rastreio' && !this.open && progress > 0.72) px(g, cx + this.facing * (width - 32) / 2 - 7, base + 1, 14, 3, '#ecc477');
    drawTora(g, x, base, 1, this.facing, this.open ? 0 : Math.floor(this.time * 12) % 2);
    g.textAlign = 'center';
    g.font = '700 15px "Pixelify Sans", sans-serif';
    g.fillStyle = this.open && !this.usedWindow ? '#ffdf94' : '#fff1d2';
    g.fillText(this.report || (this.open ? 'Agora' : 'Espere'), cx, base - 27);
    g.textAlign = 'left';
  }

  status() { return `${this.caught}/3 passos · ${this.noise}/2 ruídos`; }
}

