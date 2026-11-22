// Canvas rendering: moonlit carriage, state-coloured cones, patrol paths with
// waypoint timers, hatched blind spots, and clamped callout labels (max 3).
import { TILE, COLS, ROWS, GRID_X, GRID_Y, COLORS, PLAY_W, PLAY_H, TOP_BAR } from './config.js';
import { conePolygon, pointInRect } from './world.js';
import { wireLit } from './player.js';
import { coneColor } from './guards.js';

function drawCone(ctx, poly, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function coneFill(kind) {
  if (kind === 'alert') return 'rgba(226,59,46,0.32)';
  if (kind === 'susp') return 'rgba(240,120,40,0.26)';
  return 'rgba(232,178,60,0.20)';
}

function labelBox(ctx, x, y, text, align = 'center') {
  ctx.font = 'bold 13px Georgia, serif';
  const w = ctx.measureText(text).width + 16;
  const h = 24;
  let bx = align === 'center' ? x - w / 2 : x;
  bx = Math.max(8, Math.min(PLAY_W - w - 8, bx));
  let by = Math.max(TOP_BAR + 6, Math.min(PLAY_H + TOP_BAR - h - 8, y - h / 2));
  ctx.fillStyle = 'rgba(10,14,28,0.88)';
  ctx.strokeStyle = COLORS.brass;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.rect(bx, by, w, h); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f7ead0';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + w / 2, by + h / 2 + 0.5);
  return { x: bx + w / 2, y: by + h / 2, w, h };
}

export function drawWorld(ctx, state) {
  const { world, carriage } = state;
  // Floor: light wood checker.
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const x = GRID_X + tx * TILE, y = GRID_Y + ty * TILE;
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = COLORS.floorLine;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, TILE, TILE);
    }
  }
  // Moonlight pools under the windows.
  for (const z of world.litZones) {
    ctx.fillStyle = COLORS.moonPool;
    ctx.fillRect(z.x, z.y, z.w, z.h);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(z.x, z.y, z.w, 6);
  }
  // Shadow pools (hide).
  for (const z of world.hideZones) {
    if (z.kind === 'shadow') {
      ctx.fillStyle = 'rgba(18,51,38,0.55)';
      ctx.fillRect(z.x, z.y, z.w, z.h);
    }
  }
  // Hatched blind-spot zones.
  for (const z of world.hideZones) {
    if (z.kind !== 'blind') continue;
    ctx.save();
    ctx.beginPath(); ctx.rect(z.x, z.y, z.w, z.h); ctx.clip();
    ctx.fillStyle = 'rgba(46,93,67,0.35)';
    ctx.fillRect(z.x, z.y, z.w, z.h);
    ctx.strokeStyle = 'rgba(242,230,200,0.55)';
    ctx.lineWidth = 2;
    for (let d = -z.h; d < z.w; d += 14) {
      ctx.beginPath();
      ctx.moveTo(z.x + d, z.y + z.h);
      ctx.lineTo(z.x + d + z.h, z.y);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(242,230,200,0.8)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(z.x + 0.5, z.y + 0.5, z.w, z.h);
  }
  // Creaky boards.
  for (const c of world.creaky) {
    ctx.fillStyle = 'rgba(90,58,32,0.45)';
    ctx.fillRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
    ctx.strokeStyle = 'rgba(242,230,200,0.5)';
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(c.x + 3.5, c.y + 3.5, c.w - 7, c.h - 7);
    ctx.setLineDash([]);
  }
  // (Floor labels are drawn on top of the cones by main.js, via drawFloorLabels.)
  // Walls with brass trim.
  for (const r of world.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(r.x, r.y, r.w, 5);
    ctx.strokeStyle = COLORS.wallTrim;
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w, r.h);
  }
  // Furniture: berths, luggage, tables.
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const c = carriage.grid[ty][tx];
      const x = GRID_X + tx * TILE, y = GRID_Y + ty * TILE;
      if (c === 'B') {
        ctx.fillStyle = COLORS.green;
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = COLORS.cream;
        ctx.fillRect(x + 6, y + 6, TILE - 12, 8);
        ctx.strokeStyle = COLORS.brass; ctx.lineWidth = 1;
        ctx.strokeRect(x + 3.5, y + 3.5, TILE - 7, TILE - 7);
      } else if (c === 'L') {
        ctx.fillStyle = '#7a5a34';
        ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
        ctx.strokeStyle = COLORS.brassLight; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + TILE - 4, y + TILE - 4);
        ctx.moveTo(x + TILE - 4, y + 4); ctx.lineTo(x + 4, y + TILE - 4);
        ctx.stroke();
      } else if (c === 'T') {
        ctx.fillStyle = COLORS.woodDark;
        ctx.beginPath(); ctx.arc(x + TILE / 2, y + TILE / 2, 15, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = COLORS.brass; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = COLORS.cream;
        ctx.beginPath(); ctx.arc(x + TILE / 2, y + TILE / 2, 5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  // Lamps (lit glow / doused).
  for (const lamp of state.lamps) {
    if (!lamp.doused) {
      const g = ctx.createRadialGradient(lamp.pos.x, lamp.pos.y, 4, lamp.pos.x, lamp.pos.y, lamp.r);
      g.addColorStop(0, 'rgba(255,205,110,0.22)');
      g.addColorStop(1, 'rgba(255,205,110,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(lamp.pos.x, lamp.pos.y, lamp.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = lamp.doused ? '#5a5346' : '#ffd76e';
    ctx.beginPath(); ctx.arc(lamp.pos.x, lamp.pos.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COLORS.brass; ctx.lineWidth = 1.5; ctx.stroke();
  }
  // Alarm wires (pulsing).
  for (const wire of state.wires) {
    const lit = wireLit(wire, state.time);
    ctx.strokeStyle = lit ? COLORS.wire : 'rgba(255,77,109,0.25)';
    ctx.lineWidth = lit ? 3 : 2;
    ctx.beginPath(); ctx.moveTo(wire.x1, wire.y1); ctx.lineTo(wire.x2, wire.y2); ctx.stroke();
    ctx.fillStyle = lit ? COLORS.wire : 'rgba(255,77,109,0.4)';
    ctx.beginPath(); ctx.arc(wire.x1, wire.y1, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(wire.x2, wire.y2, 3.5, 0, Math.PI * 2); ctx.fill();
  }
  // Lanterns: sweeping arcs.
  for (const L of state.lanterns) {
    const poly = conePolygon(L.pos.x, L.pos.y, L.angle, L.arc / 2, L.range, world, 18);
    drawCone(ctx, poly, 'rgba(255,179,71,0.13)', 'rgba(255,179,71,0.45)');
    ctx.fillStyle = '#ffb347';
    ctx.beginPath(); ctx.arc(L.pos.x, L.pos.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7a4a12'; ctx.lineWidth = 2; ctx.stroke();
  }
  // Loot + prize.
  for (const l of state.loot) {
    if (l.taken) continue;
    ctx.fillStyle = COLORS.loot;
    ctx.beginPath(); ctx.arc(l.x, l.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a6a10'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#8a6a10';
    ctx.font = 'bold 9px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('¢', l.x, l.y + 0.5);
  }
  if (!state.prizeTaken) {
    const p = state.prize;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(-0.4);
    ctx.fillStyle = COLORS.prize;
    ctx.fillRect(-11, -4, 18, 8);
    ctx.beginPath(); ctx.arc(10, 0, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a6a10';
    ctx.fillRect(8, -2, 4, 4);
    ctx.restore();
    ctx.strokeStyle = 'rgba(232,200,90,0.8)';
    ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, Math.PI * 2); ctx.stroke();
  }
  // Exit (rear door).
  const e = world.exit;
  ctx.fillStyle = state.exitOpen ? COLORS.exit : '#3d5a48';
  ctx.fillRect(e.x - 2, e.y - 2, e.w + 4, e.h + 4);
  ctx.fillStyle = state.exitOpen ? '#7be3a0' : '#6a8a76';
  ctx.font = 'bold 11px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2 + 0.5);
  if (state.exitOpen) {
    ctx.strokeStyle = 'rgba(123,227,160,0.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(e.x + e.w / 2, e.y + e.h / 2, 26, 0, Math.PI * 2); ctx.stroke();
  }
  // Steam clouds.
  for (const c of state.steamClouds) {
    ctx.fillStyle = `rgba(230,235,245,${0.28 + 0.10 * Math.sin(state.time * 3)})`;
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(c.x - 24, c.y + 12, 34, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(c.x + 26, c.y - 10, 30, 0, Math.PI * 2); ctx.fill();
  }
  // Noise rings.
  for (const r of state.noiseRings) {
    ctx.strokeStyle = `rgba(242,230,200,${0.8 * (1 - r.t)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
  }
}

export function drawFloorLabels(ctx, state) {
  const { world } = state;
  ctx.font = 'bold 10px Georgia, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const c of world.creaky) {
    ctx.fillStyle = 'rgba(10,14,28,0.75)';
    const w = 92;
    ctx.fillRect(c.x + c.w / 2 - w / 2, c.y + c.h / 2 - 8, w, 16);
    ctx.fillStyle = '#d8c49a';
    ctx.fillText('CREAKY BOARDS', c.x + c.w / 2, c.y + c.h / 2 + 0.5);
  }
  for (const z of world.hideZones) {
    if (z.kind !== 'blind') continue;
    ctx.fillStyle = 'rgba(10,14,28,0.75)';
    ctx.fillRect(z.x + z.w / 2 - 46, z.y + z.h / 2 - 8, 92, 16);
    ctx.fillStyle = '#e8f0d8';
    ctx.fillText('BLIND SPOT', z.x + z.w / 2, z.y + z.h / 2 + 0.5);
  }
}

export function drawGuards(ctx, state) {
  // Patrol paths first (dashed, with waypoint dots + wait timers).
  for (const g of state.guards) {
    const pts = [{ x: g.x, y: g.y }, ...g.waypoints];
    ctx.strokeStyle = 'rgba(242,230,200,0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.setLineDash([]);
    g.waypoints.forEach((wp, i) => {
      ctx.fillStyle = '#f2e6c8';
      ctx.beginPath(); ctx.arc(wp.x, wp.y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#4a3226'; ctx.lineWidth = 1; ctx.stroke();
      const wait = g.waits[i % g.waits.length];
      ctx.font = 'bold 10px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#f2e6c8';
      ctx.fillText(`${wait}s`, wp.x, wp.y - 7);
    });
  }
  // Vision cones (state-coloured), then the conductors.
  for (const g of state.guards) {
    const kind = g.coneOverride || coneColor(g.state);
    const poly = conePolygon(g.x, g.y, g.angle, 0.61, 270, state.world, 20);
    drawCone(ctx, poly, coneFill(kind),
      kind === 'alert' ? 'rgba(226,59,46,0.8)' : kind === 'susp' ? 'rgba(240,120,40,0.7)' : 'rgba(232,178,60,0.55)');
  }
  for (const g of state.guards) {
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath(); ctx.arc(g.x, g.y, 12, 0, Math.PI * 2); ctx.fill();
    if (g.state === 'SUSPICIOUS' || g.state === 'CHASE' || g.state === 'ALERTED' || g.state === 'SEARCH') {
      ctx.strokeStyle = COLORS.guardRing; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(g.x, g.y, 15, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.strokeStyle = '#5a2c10'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(g.x, g.y, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#fff2cf'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 14, g.y + Math.sin(g.angle) * 14);
    ctx.stroke();
    if (g.state === 'SUSPICIOUS' || g.state === 'SEARCH') {
      ctx.fillStyle = '#fff2cf';
      ctx.font = 'bold 16px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('?', g.x, g.y - 16);
    }
    if (g.state === 'CHASE' || g.state === 'ALERTED') {
      ctx.fillStyle = '#ff5a4a';
      ctx.font = 'bold 16px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('!', g.x, g.y - 16);
    }
  }
}

export function drawPlayer(ctx, state) {
  const p = state.player;
  ctx.fillStyle = COLORS.player;
  ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#0d4a46'; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = '#e8f7f5'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + Math.cos(p.angle) * 15, p.y + Math.sin(p.angle) * 15);
  ctx.stroke();
  if (p.hidden) {
    ctx.fillStyle = '#7be3a0';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('HIDDEN', p.x, p.y - 17);
  }
}

export function drawCallouts(ctx, state) {
  if (!state.callouts) return;
  const drawn = [];
  for (const c of state.callouts.slice(0, 3)) {
    // Leader line from the element to a clamped label box.
    const box = labelBox(ctx, c.lx, c.ly, c.text);
    drawn.push(box);
    ctx.strokeStyle = 'rgba(242,230,200,0.85)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    const edgeX = Math.max(box.x - box.w / 2, Math.min(c.x, box.x + box.w / 2));
    ctx.lineTo(edgeX, box.y);
    ctx.stroke();
    ctx.fillStyle = '#f2e6c8';
    ctx.beginPath(); ctx.arc(c.x, c.y, 3, 0, Math.PI * 2); ctx.fill();
  }
  return drawn;
}
