export function insidePolygon(x: number, y: number, points: readonly (readonly number[])[]): boolean {
  let inside = false;
  let previous = points[points.length - 1];
  for (const point of points) {
    const [ax, ay] = previous, [bx, by] = point;
    if ((ay > y) !== (by > y) && x < ax + (bx - ax) * (y - ay) / (by - ay)) inside = !inside;
    previous = point;
  }
  return inside;
}
