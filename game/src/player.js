// The stowaway: movement, noise, pebble + steam gadgets, interaction.
import { GAME } from './config.js';
import { circleHitsSolid, pointInRect, segmentsCross } from './world.js';

export function makePlayer(start) {
  return {
    x: start.x, y: start.y, r: 13,
    angle: -Math.PI / 2,
    sneaking: false, running: false,
    hidden: false, inShadow: true, lit: false,
    pebbles: GAME.pebbles, steam: GAME.steam,
    loot: 0, hasKey: false,
    noiseTimer: 0, stepTimer: 0,
  };
}

export function updatePlayer(state, input, dt) {
  const p = state.player;
  const w = state.world;
  const mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  p.sneaking = !!input.sneak;
  const moving = mx !== 0 || my !== 0;
  p.running = moving && !p.sneaking;
  if (moving) {
    const len = Math.hypot(mx, my);
    const speed = p.sneaking ? GAME.playerSneakSpeed : GAME.playerSpeed;
    const nx = p.x + (mx / len) * speed * dt;
    const ny = p.y + (my / len) * speed * dt;
    if (!circleHitsSolid(nx, p.y, p.r, w)) p.x = nx;
    if (!circleHitsSolid(p.x, ny, p.r, w)) p.y = ny;
    p.angle = Math.atan2(my, mx);
    // Footstep noise: running is loud, creaky boards are loud even sneaking.
    let onCreaky = false;
    for (const c of w.creaky) if (pointInRect(p.x, p.y, c)) onCreaky = true;
    p.stepTimer -= dt;
    if (p.stepTimer <= 0 && (p.running || onCreaky)) {
      p.stepTimer = p.running ? 0.45 : 0.7;
      state.noiseRings.push({ x: p.x, y: p.y, r: 8, max: p.running ? 110 : 70, t: 0 });
      if (p.running) raiseNoise(state, p.x, p.y, 130);
    }
  }
  // Alarm wires: crossing one while it is lit trips the alarm.
  for (const wire of state.wires) {
    if (wireLit(wire, state.time) && segmentsCross(state.prevX, state.prevY, p.x, p.y, wire.x1, wire.y1, wire.x2, wire.y2)) {
      state.detection = Math.min(1, state.detection + 0.6);
      state.alarm = Math.min(1, state.alarm + 0.4);
      state.wireFlash = 1.2;
      for (const g of state.guards) { g.investigate = { x: p.x, y: p.y }; g.lastSeen = { x: p.x, y: p.y }; }
    }
  }
  state.prevX = p.x; state.prevY = p.y;
}

export function wireLit(wire, t) {
  const phase = (t + wire.phase) % wire.period;
  return phase < wire.period * 0.55;
}

export function throwPebble(state, tx, ty) {
  const p = state.player;
  if (p.pebbles <= 0) return false;
  p.pebbles--;
  const dx = tx - p.x, dy = ty - p.y;
  const d = Math.hypot(dx, dy);
  const max = 320;
  const s = d > max ? max / d : 1;
  const lx = p.x + dx * s, ly = p.y + dy * s;
  state.noiseRings.push({ x: lx, y: ly, r: 8, max: 150, t: 0 });
  raiseNoise(state, lx, ly, 280);
  return true;
}

export function throwSteam(state) {
  const p = state.player;
  if (p.steam <= 0) return false;
  p.steam--;
  state.steamClouds.push({ x: p.x + Math.cos(p.angle) * 46, y: p.y + Math.sin(p.angle) * 46, r: 90, t: 4 });
  return true;
}

export function raiseNoise(state, x, y, radius) {
  let nearest = null, nd = 1e9;
  for (const g of state.guards) {
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < radius && d < nd) { nearest = g; nd = d; }
  }
  if (nearest) { nearest.investigate = { x, y }; nearest.lastSeen = { x, y }; }
}

// Nearest thing the thief can use (loot, key, exit, lamp switch) within reach.
export function nearestInteractable(state) {
  const p = state.player;
  let best = null, bd = 1e9;
  const consider = (kind, x, y, d) => { if (d < bd) { bd = d; best = { kind, x, y }; } };
  for (const l of state.loot) if (!l.taken) {
    const d = Math.hypot(l.x - p.x, l.y - p.y);
    if (d < 38) consider('loot', l.x, l.y, d);
  }
  if (!state.prizeTaken) {
    const d = Math.hypot(state.prize.x - p.x, state.prize.y - p.y);
    if (d < 42) consider('prize', state.prize.x, state.prize.y, d);
  }
  if (p.hasKey) {
    const d = Math.hypot(state.exit.x - p.x, state.exit.y - p.y);
    if (d < 46) consider('exit', state.exit.x, state.exit.y, d);
  }
  for (const s of state.switches) {
    const d = Math.hypot(s.pos.x - p.x, s.pos.y - p.y);
    if (d < 44) consider('switch', s.pos.x, s.pos.y, d);
  }
  return best;
}

export function doInteract(state) {
  const it = nearestInteractable(state);
  if (!it) return null;
  const p = state.player;
  if (it.kind === 'loot') {
    for (const l of state.loot) {
      if (!l.taken && Math.hypot(l.x - it.x, l.y - it.y) < 2) { l.taken = true; p.loot++; }
    }
    return 'loot';
  }
  if (it.kind === 'prize') {
    state.prizeTaken = true; p.hasKey = true; state.exitOpen = true;
    return 'prize';
  }
  if (it.kind === 'exit') {
    state.screen = 'carriageComplete';
    return 'exit';
  }
  if (it.kind === 'switch') {
    for (const s of state.switches) {
      if (Math.hypot(s.pos.x - it.x, s.pos.y - it.y) < 2) {
        const lamp = state.lamps[s.lamp];
        if (lamp) lamp.doused = !lamp.doused;
      }
    }
    return 'switch';
  }
  return null;
}
