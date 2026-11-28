type Plate = 'center' | 'right' | 'hidden';

/** Faixa de dois pixels e placa embutida na silhueta do personagem. */
export function paintBandana(g: CanvasRenderingContext2D, x: number, y: number, width: number, color: string, plate: Plate) {
  if (width < 3) return;
  g.save();
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = color;
  g.fillRect(x, y, width, 2);
  if (plate !== 'hidden') {
    const size = Math.min(width, plate === 'right' ? 4 : 5);
    const px = plate === 'right' ? x + width - size : x + Math.floor((width - size) / 2);
    g.fillStyle = '#74808d';
    g.fillRect(px, y + 1, size, 1);
    g.fillStyle = '#cdd4d7';
    g.fillRect(px, y, size, 1);
    g.fillStyle = '#4c5767';
    g.fillRect(px + Math.floor(size / 2), y + 1, 1, 1);
  }
  g.restore();
}
