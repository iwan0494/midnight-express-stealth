// World: parses a carriage grid into collision / sight / zone rectangles,
// and answers line-of-sight + raycast queries against them.
import { TILE, COLS, ROWS, GRID_X, GRID_Y } from './config.js';

function rect(tx, ty, w = 1, h = 1) {
  return { x: GRID_X + tx * TILE, y: GRID_Y + ty * TILE, w: w * TILE, h: h * TILE };
}

export function buildWorld(carriage) {
  const walls = [], blockers = [], hideZones = [], litZones = [], creaky = [];
  let exit = null;
  for (let ty = 0; ty < ROWS; ty++) {
    const row = carriage.grid[ty];
    for (let tx = 0; tx < COLS; tx++) {
      const c = row[tx];
      if (c === '#') walls.push(rect(tx, ty));
      else if (c === 'L' || c === 'T') blockers.push(rect(tx, ty));
      else if (c === 'B') hideZones.push({ ...rect(tx, ty), kind: 'berth' });
      else if (c === 'I') hideZones.push({ ...rect(tx, ty), kind: 'shadow' });
      else if (c === 'W') litZones.push(rect(tx, ty));
      else if (c === 'C') creaky.push(rect(tx, ty));
      else if (c === 'E') exit = rect(tx, ty);
    }
  }
  for (const b of carriage.blindSpots) hideZones.push({ ...rect(b.tx, b.ty, b.w, b.h), kind: 'blind' });
  const solid = walls.concat(blockers);
  return { walls, blockers, solid, hideZones, litZones, creaky, exit, carriage };
}

export function pointInRect(x, y, r) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

export function pointBlocked(x, y, world) {
  for (const r of world.solid) if (pointInRect(x, y, r)) return true;
  return false;
}

// Circle vs solid rects: true if the circle at (x,y) radius r overlaps one.
export function circleHitsSolid(x, y, r, world) {
  for (const s of world.solid) {
    const cx = Math.max(s.x, Math.min(x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(y, s.y + s.h));
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

// True if the segment (x1,y1)-(x2,y2) passes through any solid rect.
export function segmentBlocked(x1, y1, x2, y2, world) {
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (pointBlocked(x1 + dx * t, y1 + dy * t, world)) return true;
  }
  return false;
}

// Distance from (x,y) along unit direction (dx,dy) until a solid is hit (or maxDist).
export function rayDistance(x, y, dx, dy, maxDist, world) {
  const step = 8;
  for (let d = step; d <= maxDist; d += step) {
    if (pointBlocked(x + dx * d, y + dy * d, world)) return d - step / 2;
  }
  return maxDist;
}

// Cone polygon points for a viewer at (x,y) facing `angle`, half-angle `half`, range `range`.
export function conePolygon(x, y, angle, half, range, world, rays = 22) {
  const pts = [{ x, y }];
  for (let i = 0; i <= rays; i++) {
    const a = angle - half + (2 * half * i) / rays;
    const d = rayDistance(x, y, Math.cos(a), Math.sin(a), range, world);
    pts.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d });
  }
  return pts;
}

// Segment / segment intersection, or null.
export function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const rX = bx - ax, rY = by - ay, sX = dx - cx, sY = dy - cy;
  const den = rX * sY - rY * sX;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((cx - ax) * sY - (cy - ay) * sX) / den;
  const u = ((cx - ax) * rY - (cy - ay) * rX) / den;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return { x: ax + t * rX, y: ay + t * rY };
  return null;
}

// Does segment (ax,ay)-(bx,by) cross the circle at (cx,cy) radius r?
export function segmentHitsCircle(ax, ay, bx, by, cx, cy, r) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((cx - ax) * dx + (cy - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = ax + t * dx, py = ay + t * dy;
  return (px - cx) * (px - cx) + (py - cy) * (py - cy) <= r * r;
}
