function createUnityStylePath(from, to) {
  const HORIZONTAL_OFFSET = 50;
  const CORNER_RADIUS = 10; // Increase this for smoother/rounder corners
  
  const p1 = { x: from.x + HORIZONTAL_OFFSET, y: from.y };
  const p2 = { x: to.x - HORIZONTAL_OFFSET, y: to.y };
  
  // Shorten the straight segments to make room for curves
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const radius = Math.min(CORNER_RADIUS, dist / 2);
  
  // Unit vector for the diagonal segment
  const ux = dx / dist;
  const uy = dy / dist;
  
  // Path with rounded corners at p1 and p2
  return `M ${from.x} ${from.y} 
          L ${p1.x - radius} ${p1.y} 
          Q ${p1.x} ${p1.y}, ${p1.x + radius * ux} ${p1.y + radius * uy}
          L ${p2.x - radius * ux} ${p2.y - radius * uy}
          Q ${p2.x} ${p2.y}, ${p2.x + radius} ${p2.y}
          L ${to.x} ${to.y}`;
}

window.EdgePathFunc = createUnityStylePath;

export function Load() {
  // for future initialization logic
}