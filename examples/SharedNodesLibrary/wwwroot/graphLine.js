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

/**
 * Vertical S-curve: exits the source socket downward and enters the
 * target socket from above.  Use this when sockets are oriented
 * Direction=Vertical (anchors on top/bottom of nodes).
 *
 * @param {{ x: number, y: number }} from  - output socket position (bottom of source node)
 * @param {{ x: number, y: number }} to    - input socket position  (top of target node)
 */
function createVerticalPath(from, to) {
  const dy = to.y - from.y;
  const dist = Math.abs(dy) + Math.abs(to.x - from.x);
  const offset = Math.min(150, dist * 0.45);
  const c1 = { x: from.x, y: from.y + offset };
  const c2 = { x: to.x,   y: to.y   - offset };
  return `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
}

window.VerticalEdgeFunc = createVerticalPath;

export function Load() {
  // for future initialization logic
}