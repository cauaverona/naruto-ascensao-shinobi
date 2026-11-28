import { ctx, offscreen, ovalpx, poly, px } from './gfx';

type G = CanvasRenderingContext2D;

export type ExamScroll = 'ceu' | 'terra' | 'reserva';

const SCROLL_SEALS = {
  ceu: ['.#####.', '...#...', '#######', '...#...', '..#.#..', '.#...#.', '#.....#'],
  terra: ['.#...#.', '.#.#.#.', '#######', '.###.#.', '.#.#.#.', '##.#..#', '...####'],
} as const;

export function drawExamScroll(g: G, x: number, y: number, kind: ExamScroll) {
  const pixel = (dx: number, dy: number, width: number, height: number, color: string) =>
    px(g, x + dx, y + dy, width, height, color);
  ovalpx(g, x, y + 1, 14, 2, 'rgba(11,18,22,.52)');
  if (kind === 'reserva') {
    const cloth = [[-13, -6], [-10, -12], [2, -15], [12, -12], [15, -5], [10, 0], [-9, 0]];
    poly(g, cloth.map(([dx, dy]) => [Math.round(x) + dx, Math.round(y) + dy]), '#362e2b');
    pixel(-11, -9, 7, 7, '#886b4d');
    pixel(-8, -12, 16, 9, '#ac8a60');
    pixel(-5, -13, 11, 2, '#c4a479');
    pixel(8, -10, 4, 7, '#795a47');
    pixel(-10, -4, 20, 3, '#715442');
    pixel(-11, -8, 24, 2, '#487181');
    pixel(2, -13, 2, 12, '#385967');
    pixel(1, -9, 5, 4, '#93c9d0');
    pixel(3, -7, 2, 2, '#254752');
    pixel(6, -5, 3, 1, '#c5b691');
    return;
  }

  const [shade, cloth, edge] = kind === 'ceu'
    ? ['#223944', '#446f82', '#8db5c6'] : ['#542d23', '#9b4c33', '#d68959'];
  // As tampas de madeira passam por cima das bordas do papel enrolado.
  pixel(-15, -15, 30, 13, '#211d21');
  pixel(-13, -14, 26, 11, shade);
  pixel(-12, -13, 24, 8, cloth);
  pixel(-12, -13, 24, 1, edge);
  pixel(-6, -14, 12, 10, '#e1cf9e');
  pixel(-5, -14, 10, 1, '#fff2c8');
  pixel(-6, -5, 12, 2, '#9d805c');
  for (const [row, pattern] of SCROLL_SEALS[kind].entries()) {
    for (const [column, mark] of [...pattern].entries()) {
      if (mark === '#') pixel(column - 3, row - 12, 1, 1, shade);
    }
  }
  for (const end of [-1, 1]) {
    const cap = end < 0 ? -15 : 10;
    pixel(cap, -17, 5, 16, '#352623');
    pixel(cap + 1, -16, 3, 13, '#92694e');
    pixel(cap + 1, -16, 3, 2, '#d5aa7d');
    pixel(cap + 2, -9, 2, 2, '#63432f');
    pixel(cap + 1, -4, 3, 2, edge);
  }
  pixel(6, -8, 3, 5, '#f0c884');
  pixel(7, -7, 1, 2, '#9b552f');
}

const fieldScrolls = new Map<ExamScroll, HTMLCanvasElement>();
export function drawFieldExamScroll(g: G, x: number, y: number, kind: ExamScroll) {
  let sprite = fieldScrolls.get(kind);
  if (!sprite) {
    sprite = offscreen(22, 14);
    const original = offscreen(34, 22);
    drawExamScroll(ctx(original), 17, 18, kind);
    ctx(sprite).drawImage(original, 0, 0, sprite.width, sprite.height);
    fieldScrolls.set(kind, sprite);
  }
  g.drawImage(sprite, Math.round(x) - 11, Math.round(y) - 11);
}

export function drawTora(g: G, x: number, y: number, scale: number, facing: number, frame: number) {
  const pixel = (dx: number, dy: number, w: number, h: number, color: string) =>
    px(g, x + (facing < 0 ? -dx - w : dx) * scale, y + dy * scale, w * scale, h * scale, color);
  const ink = '#432e32', fur = '#bc8259', lit = '#e7b281', stripe = '#875642';
  ovalpx(g, x, y, 11 * scale, 2 * scale, '#53604f');
  pixel(-8, -8, 15, 7, ink);
  pixel(-7, -7, 12, 5, fur);
  pixel(-6, -7, 11, 2, lit);
  pixel(-5, -7, 2, 4, stripe);
  pixel(-1, -7, 2, 3, stripe);
  pixel(-6 + frame, -3, 3, 3, ink);
  pixel(2 - frame, -3, 3, 3, ink);
  pixel(-11, -11 + frame, 2, 6, ink);
  pixel(-10, -8 + frame, 3, 3, stripe);
  pixel(3, -12, 8, 8, ink);
  pixel(4, -11, 6, 6, lit);
  pixel(3, -14, 3, 4, ink);
  pixel(8, -14, 3, 4, ink);
  pixel(4, -13, 1, 2, '#cc8a7a');
  pixel(9, -13, 1, 2, '#cc8a7a');
  pixel(8, -9, 1, 1, '#3a282a');
  pixel(8, -7, 3, 2, '#f2cfaa');
  pixel(10, -7, 1, 1, '#8d4a4a');
  pixel(3, -5, 4, 1, '#9a423d');
  pixel(6, -5, 1, 2, '#efc572');
}

export function drawTrack(g: G, x: number, y: number, id: string) {
  if (id === 'rastro-norte') {
    px(g, x - 11, y - 1, 8, 3, '#644d40');
    px(g, x - 7, y - 4, 6, 2, '#9d7651');
    px(g, x - 2, y - 6, 3, 3, '#ebc07b');
    px(g, x + 4, y - 10, 9, 2, '#735842');
    px(g, x + 7, y - 12, 3, 3, '#9d7651');
    px(g, x + 2, y - 8, 3, 3, '#e4ad70');
    return;
  }
  if (id === 'rastro-sul') {
    px(g, x - 10, y - 4, 13, 5, '#547451');
    px(g, x - 7, y - 9, 2, 9, '#7d955b');
    px(g, x - 3, y - 6, 2, 7, '#91a16b');
    px(g, x + 3, y - 7, 8, 2, '#dda877');
    px(g, x + 7, y - 9, 5, 2, '#f0c891');
    px(g, x + 10, y - 11, 2, 3, '#f0c891');
    return;
  }
  const ink = '#85664b';
  for (const [dx, dy] of [[-7, 0], [1, -5], [7, -11]]) {
    px(g, x + dx, y + dy, 4, 2, ink);
    px(g, x + dx - 1, y + dy - 2, 1, 1, ink);
    px(g, x + dx + 1, y + dy - 3, 1, 1, ink);
    px(g, x + dx + 3, y + dy - 2, 1, 1, ink);
  }
}

export function drawAssignmentProp(g: G, id: string, x: number, y: number, time: number) {
  const pixel = (dx: number, dy: number, w: number, h: number, color: string) =>
    px(g, x + dx, y + dy, w, h, color);
  ovalpx(g, x, y + 1, 8, 2, '#665a49');
  switch (id) {
    case 'selo-livro':
      pixel(-9, -10, 18, 11, '#4e3731');
      pixel(-8, -10, 16, 8, '#bb8759');
      pixel(-6, -9, 11, 7, '#ead9a8');
      pixel(0, -9, 1, 7, '#9b7650');
      pixel(-5, -7, 4, 1, '#9b7650');
      pixel(2, -5, 3, 1, '#9b7650');
      break;
    case 'selo-cera':
      pixel(-6, -5, 12, 6, '#663d38');
      pixel(-4, -7, 8, 7, '#b96859');
      pixel(-3, -5, 6, 3, '#e1936b');
      pixel(-1, -5, 2, 4, '#874d47');
      break;
    case 'selo-canhoto':
      pixel(-7, -8, 14, 10, '#695348');
      pixel(-6, -8, 12, 8, '#e5d2a0');
      pixel(-4, -6, 8, 1, '#a08263');
      pixel(-4, -4, 7, 1, '#a08263');
      pixel(3, -3, 2, 2, '#a45243');
      break;
    case 'patrulha-luz': {
      pixel(-2, -23, 4, 24, '#543d35');
      pixel(-1, -22, 1, 20, '#936945');
      pixel(-6, -23, 12, 3, '#594638');
      pixel(-5, -20, 10, 9, '#9e6644');
      const flame = Math.floor(time * 5) % 2;
      pixel(-3, -18, 6, 6, '#f3bb6d');
      pixel(-2, -16 - flame, 3 + flame, 4 + flame, '#ffe0a0');
      pixel(-6, -11, 12, 2, '#453732');
      break;
    }
    case 'patrulha-fita':
      pixel(-2, -17, 4, 18, '#694637');
      pixel(-1, -16, 1, 16, '#a57650');
      pixel(-4, -14, 13, 5, '#a64f42');
      pixel(-3, -14, 12, 1, '#e18a68');
      pixel(5, -10, 4, 3, '#a64f42');
      break;
  }
}

export function drawSupply(g: G, x: number, y: number, kind: string) {
  ovalpx(g, x, y + 1, 11, 2, '#736d50');
  px(g, x - 10, y - 12, 19, 13, '#44352d');
  px(g, x - 9, y - 11, 17, 4, '#d39a63');
  px(g, x - 9, y - 7, 17, 7, '#a77149');
  px(g, x - 8, y - 3, 15, 1, '#865239');
  px(g, x - 8, y - 11, 1, 10, '#edc58a');
  px(g, x + 6, y - 11, 1, 10, '#d09f68');
  const tag = kind === 'fardo-1' ? '#6b815b' : kind === 'fardo-2' ? '#a45143' : '#575f85';
  px(g, x - 3, y - 7, 6, 5, '#e9d5a4');
  px(g, x - 2, y - 6, 4, 3, tag);
}
