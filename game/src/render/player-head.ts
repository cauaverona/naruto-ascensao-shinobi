export type HeadView = 'down' | 'right' | 'up';
type Span = readonly [left: number, right: number];
type Bang = readonly [left: number, right: number, row: number];
type Tail = 'none' | 'low' | 'high' | 'twins' | 'bun' | 'braid' | 'long' | 'half' | 'waves';
interface Haircut {
  rise: number;
  crown: readonly Span[];
  front: readonly Bang[];
  side: readonly Bang[];
  nape: number;
  tail?: Tail;
}

// Coordinates are relative to the head anchor, in native sprite pixels.
const haircuts = {
  Curto: {
    rise: 0, crown: [[-3, 3], [-5, 5], [-6, 6], [-7, 6], [-7, 6], [-6, 5]],
    front: [[-5, -2, 5], [1, 4, 5], [-5, -4, 6]], side: [[-6, 1, 5], [-5, -3, 6]], nape: 8,
  },
  Franja: {
    rise: 0, crown: [[-2, 4], [-5, 6], [-6, 7], [-7, 7], [-7, 6], [-7, 5]],
    front: [[-6, 3, 6], [-4, 0, 7], [-3, -2, 8]], side: [[-6, 5, 6], [3, 5, 7], [-5, -3, 7]], nape: 9,
  },
  Preso: {
    rise: 1, crown: [[-2, 2], [-4, 4], [-5, 5], [-6, 6], [-6, 6], [-6, 5]],
    front: [[-6, -5, 5], [4, 5, 5], [-6, -6, 6]], side: [[-6, 0, 5], [-6, -3, 6]], nape: 8, tail: 'low',
  },
  'Rabo alto': {
    rise: 1, crown: [[-2, 3], [-4, 5], [-6, 6], [-7, 6], [-6, 6], [-6, 5]],
    front: [[-5, -3, 5], [3, 5, 5]], side: [[-6, 0, 5], [-6, -3, 6]], nape: 8, tail: 'high',
  },
  Chiquinhas: {
    rise: 0, crown: [[-3, 3], [-5, 5], [-6, 6], [-7, 7], [-7, 7], [-6, 6]],
    front: [[-6, -3, 6], [2, 6, 6], [-6, -5, 7], [5, 6, 7]], side: [[-6, 2, 5], [-6, -3, 7]], nape: 9, tail: 'twins',
  },
  Coque: {
    rise: 1, crown: [[-2, 2], [-4, 4], [-5, 5], [-6, 6], [-6, 6], [-6, 5]],
    front: [[-5, -4, 5], [4, 5, 5]], side: [[-6, 0, 5], [-6, -4, 6]], nape: 8, tail: 'bun',
  },
  Trança: {
    rise: 0, crown: [[-3, 2], [-5, 4], [-6, 6], [-7, 7], [-7, 6], [-7, 5]],
    front: [[-6, -3, 6], [4, 6, 6], [-6, -5, 7]], side: [[-7, 2, 5], [-6, -4, 7]], nape: 9, tail: 'braid',
  },
  Espetado: {
    rise: 4, crown: [[0, 1], [-3, 2], [-4, 4], [-7, 5], [-6, 7], [-8, 6], [-8, 7], [-7, 7], [-7, 6], [-6, 5]],
    front: [[-6, -3, 6], [2, 4, 6], [-5, -4, 7]], side: [[-7, 4, 6], [-6, -3, 7]], nape: 9,
  },
  Longo: {
    rise: 1, crown: [[-3, 3], [-5, 5], [-7, 7], [-8, 7], [-8, 8], [-8, 7], [-8, 7]],
    front: [[-7, -5, 6], [5, 7, 6], [-7, -5, 7], [5, 7, 8], [-7, -6, 9]], side: [[-7, 2, 6], [-7, -3, 7], [-7, -4, 8]], nape: 10, tail: 'long',
  },
  Cacheado: {
    rise: 2, crown: [[-2, 3], [-5, 5], [-7, 7], [-8, 8], [-8, 8], [-9, 8], [-8, 8], [-8, 7], [-7, 6]],
    front: [[-7, -5, 7], [-3, -1, 6], [2, 4, 6], [5, 7, 7]], side: [[-8, 3, 6], [-7, -3, 8]], nape: 9,
  },
  'Raspado nas laterais': {
    rise: 1, crown: [[-1, 3], [-3, 4], [-4, 4], [-4, 4], [-4, 4], [-4, 3]],
    front: [[-4, 3, 5], [-2, 1, 6]], side: [[-5, 1, 5], [-4, -2, 6]], nape: 6,
  },
  'Meio preso': {
    rise: 0, crown: [[-3, 3], [-5, 5], [-6, 6], [-7, 7], [-7, 6], [-6, 6]],
    front: [[-6, -4, 6], [2, 6, 6], [3, 5, 7]], side: [[-6, 4, 5], [3, 5, 6], [-6, -3, 7]], nape: 9, tail: 'half',
  },
  Ondulado: {
    rise: 1, crown: [[-4, 2], [-6, 5], [-7, 6], [-7, 7], [-8, 7], [-7, 8], [-7, 7]],
    front: [[-6, -3, 6], [1, 6, 6], [3, 6, 7], [-7, -5, 8]], side: [[-7, 4, 6], [2, 5, 7], [-7, -4, 8]], nape: 9, tail: 'waves',
  },
} satisfies Record<string, Haircut>;

export const CUTS = Object.keys(haircuts);
type Context = CanvasRenderingContext2D;
type Palette = readonly string[];
const fill = (g: Context, color: string, x: number, y: number, w: number, h = 1) => {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
};

export function drawPlayerFace(g: Context, view: HeadView, cx: number, top: number, feminine: boolean, [shade, skin, light]: Palette) {
  const jaw: readonly Span[] = view === 'right'
    ? [[-4, 3], [-5, 5], [-6, 5], [-6, 6], [-6, 6], [-6, 7], [-5, 7], [-5, 6], [-4, 6], [-3, 5], [-2, feminine ? 3 : 4]]
    : [[-3, 3], [-5, 5], [-6, 6], [-6, 6], [-6, 6], [-7, 7], [-7, 7], [-6, 6],
      [feminine ? -4 : -5, feminine ? 4 : 5], [feminine ? -3 : -5, feminine ? 3 : 5],
      [feminine ? -2 : -3, feminine ? 2 : 3]];
  for (const [row, [l, r]] of jaw.entries()) {
    const y = top + 1 + row;
    fill(g, shade, cx + l, y, r - l + 1);
    if (row > 0 && row < 10) fill(g, skin, cx + l + 1, y, r - l - 1);
  }
  if (view === 'up') return;
  const y = top + 9;
  if (view === 'down') {
    fill(g, light, cx - 4, y - 3, 8, 2);
    fill(g, light, cx - 2, y - 1, 4, 2);
    for (const x of [cx - 4, cx + 2]) {
      fill(g, '#302734', x, y - (feminine ? 1 : 2), feminine ? 2 : 3);
      fill(g, '#302734', x + 1, y, 1);
      if (feminine) {
        fill(g, '#4d3040', x + (x < cx ? -1 : 2), y - 1, 1);
        fill(g, light, x, y, 1);
      }
    }
    fill(g, shade, cx - 1, y + 1, feminine ? 2 : 3);
  } else {
    fill(g, light, cx + 2, y - 4, 3, 4);
    fill(g, '#302734', cx + 3, y - 2, feminine ? 2 : 3);
    fill(g, '#302734', cx + 4, y - 1, 1);
    if (feminine) fill(g, '#4d3040', cx + 2, y - 2, 1);
    fill(g, shade, cx + 5, y, 2);
  }
}

export function drawPlayerHair(g: Context, view: HeadView, cx: number, top: number, cut: string, frame: number,
  feminine: boolean, [dark, mid, light]: Palette, behind = false) {
  const style = (haircuts as Record<string, Haircut>)[cut] ?? haircuts.Curto;
  const back = view === 'up', side = view === 'right';
  const offset = side ? -1 : 0;
  const sway = frame === 0 ? -1 : frame === 2 ? 1 : 0;
  const draw = (l: number, r: number, y: number, tone: string) => fill(g, tone, cx + l + offset, top + y, r - l + 1);
  const tie = '#c57a51';
  const strand = (x: number, y: number, length: number, drift: number, width = 4) => {
    const wave = [0, 0, -1, -1, 0, 1, 1, 0];
    for (let dy = 0; dy < length; dy++) {
      const texture = style.tail === 'waves' ? wave[dy % wave.length]
        : style.tail === 'braid' && dy % 4 >= 2 ? 1 : 0;
      const xx = x + Math.round(drift * dy / Math.max(1, length - 1)) + texture;
      const w = Math.max(1, width - (dy >= length - 3 ? 1 : 0) - (dy === length - 1 ? 1 : 0));
      draw(xx, xx + w - 1, y + dy, dark);
      if (w > 2) draw(xx + 1, xx + w - 2, y + dy, dy % 4 === 1 ? light : mid);
      if (style.tail === 'braid' && dy % 4 === 3 && w >= 3) draw(xx + 1, xx + 1, y + dy, light);
    }
  };
  if (behind) {
    switch (style.tail) {
      case 'low': strand(side ? -8 : back ? -2 : 4, 6, 12, side ? -3 + sway : sway, 5); break;
      case 'high': strand(side ? -8 : back ? -1 : 4, -2, 16, side ? -4 + sway : sway + 1, 6); break;
      case 'twins':
        strand(-10, 4, 13, -2 + sway, 5);
        if (!side) strand(6, 4, 13, 2 + sway, 5);
        break;
      case 'bun':
        draw(side ? -8 : -3, side ? -4 : 3, -4, dark);
        draw(side ? -9 : -4, side ? -3 : 4, -3, dark);
        draw(side ? -9 : -4, side ? -3 : 4, -2, dark);
        draw(side ? -7 : -2, side ? -4 : 2, -3, mid);
        draw(side ? -7 : -3, side ? -2 : 3, -1, mid);
        break;
      case 'braid': strand(side ? -9 : back ? -2 : 5, 8, 14, side ? -2 + sway : sway + 1); break;
      case 'long':
        strand(-9, 5, 18, -1 + sway, 7);
        if (!side) strand(3, 5, 18, 1 + sway, 7);
        break;
      case 'half': strand(side ? -8 : back ? -2 : 5, 5, 13, side ? -2 + sway : sway, 5); break;
      case 'waves':
        strand(-9, 5, 14, sway - 1, 5);
        if (!side) strand(5, 5, 14, sway + 1, 5);
        break;
    }
    return;
  }
  for (const [i, [left, right]] of style.crown.entries()) {
    const y = i - style.rise;
    const l = left - (side && i > 1 ? 1 : 0), r = right + (back && i > 2 && !feminine ? 1 : 0);
    draw(l, r, y, dark);
    if (i > 0 && r - l > 2) draw(l + 1, r - 1, y, mid);
    if (i > 0 && i < 4 && r - l > 4) draw(l + 2, Math.min(r - 2, l + 4), y, light);
    if (cut === 'Cacheado' && i >= 2 && i <= 5) {
      for (let x = l + 2 + i % 2; x < r - 1; x += 4) draw(x, x + 1, y, i % 2 ? light : dark);
    }
  }
  if (cut === 'Espetado') {
    draw(-6, -5, -3, dark);
    draw(-6, -3, -2, dark);
    draw(-5, -4, -2, light);
    draw(4, 5, -3, dark);
    draw(3, 6, -2, dark);
    draw(4, 5, -2, mid);
  }
  if (back) {
    for (let y = style.crown.length - style.rise; y <= style.nape; y++) {
      const l = y < style.nape ? -6 : -4, r = -l;
      draw(l, r, y, dark);
      draw(l + 1, r - 1, y, mid);
      if (y % 2 === 0) draw(-3, -2, y, light);
    }
    if (style.tail === 'braid' || style.tail === 'high' || style.tail === 'half' || style.tail === 'low') {
      draw(-2, 1, 6, tie);
      for (let y = 7; y < (style.tail === 'braid' ? 20 : 15); y += 2) {
        const x = (y % 4 === 1 ? 0 : -1) + (y >= 13 ? sway : 0);
        draw(x - 1, x + 2, y, dark);
        draw(x, x + 1, y, y % 4 === 1 ? mid : light);
      }
    }
  } else {
    for (const [l, r, y] of side ? style.side : style.front) {
      draw(l, r, y, dark);
      if (r - l > 2) draw(l + 1, r - 1, y, mid);
    }
    if (style.tail === 'twins') {
      draw(-8, -7, 5, tie);
      if (!side) draw(7, 8, 5, tie);
    }
    if (style.tail === 'high' || style.tail === 'bun') draw(side ? -5 : -2, side ? -3 : 2, -1, tie);
  }
  if (cut === 'Raspado nas laterais') {
    const taper = side ? [-6] : [-5, 5];
    for (const x of taper) {
      draw(x, x + 1, 4, dark);
      draw(x, x, 5, mid);
    }
  }
}
