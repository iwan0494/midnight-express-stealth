// Conductors: 5-state patrol AI (CALM -> SUSPICIOUS -> ALERTED -> CHASE -> SEARCH)
// with raycast vision cones, a shared detection meter and graded suspicion drain.
import { GAME } from './config.js';
import { segmentBlocked, segmentHitsCircle, pointInRect } from './world.js';

export function makeGuard(def, idx) {
  return {
    id: idx,
    x: def.start.x, y: def.start.y,
    angle: -Math.PI / 2,
    state: 'CALM',
    wpIndex: 0,
    waitTimer: 0,
    waypoints: def.waypoints.map(([tx, ty]) => ({ x: 2 + tx * 40 + 20, y: 58 + ty * 40 + 20 })),
    waits: def.waits,
    investigate: null,
    lastSeen: null,
    searchTimer: 0,
    speed: GAME.guardPatrolSpeed,
  };
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function guardSeesPlayer(guard, player, world, steamClouds) {
  const dx = player.x - guard.x, dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GAME.guardRange) return 0;
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, guard.angle)) > GAME.guardConeHalf) return 0;
  if (segmentBlocked(guard.x, guard.y, player.x, player.y, world)) return 0;
  for (const c of steamClouds) {
    if (segmentHitsCircle(guard.x, guard.y, player.x, player.y, c.x, c.y, c.r)) return 0;
  }
  if (player.hidden && dist > 70) return 0;
  let vis = 1 - dist / GAME.guardRange;
  if (player.lit) vis *= 1.0; else vis *= 0.45;
  if (player.sneaking) vis *= 0.55;
  if (player.running) vis *= 1.4;
  return Math.max(0, vis);
}

export function lanternSeesPlayer(lantern, angle, player, world, steamClouds) {
  const dx = player.x - lantern.pos.x, dy = player.y - lantern.pos.y;
  const dist = Math.hypot(dx, dy);
  if (dist > lantern.range) return 0;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), angle)) > lantern.arc / 2) return 0;
  if (segmentBlocked(lantern.pos.x, lantern.pos.y, player.x, player.y, world)) return 0;
  for (const c of steamClouds) {
    if (segmentHitsCircle(lantern.pos.x, lantern.pos.y, player.x, player.y, c.x, c.y, c.r)) return 0;
  }
  if (player.hidden && dist > 70) return 0;
  return (1 - dist / lantern.range) * (player.lit ? 1 : 0.5);
}

export function moveToward(g, tx, ty, speed, dt, world) {
  const dx = tx - g.x, dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) return true;
  const step = Math.min(d, speed * dt);
  g.x += (dx / d) * step;
  g.y += (dy / d) * step;
  g.angle = Math.atan2(dy, dx);
  return d - step < 6;
}

export function updateGuards(state, dt) {
  const { guards, player, world, steamClouds } = state;
  let anySees = 0;
  for (const g of guards) {
    const vis = guardSeesPlayer(g, player, world, steamClouds);
    if (vis > 0) {
      anySees = Math.max(anySees, vis);
      g.lastSeen = { x: player.x, y: player.y };
    }
  }
  // Lantern arcs also feed detection.
  for (const L of state.lanterns) {
    const v = lanternSeesPlayer(L, L.angle, player, world, steamClouds);
    if (v > 0) { anySees = Math.max(anySees, v * 0.8); state.lastSeen = { x: player.x, y: player.y }; }
  }

  // Detection meter: fills while seen, drains graded by how well the thief hides.
  if (anySees > 0) {
    state.detection = Math.min(1, state.detection + anySees * dt * 0.95);
  } else {
    const drain = player.hidden ? 0.55 : (player.inShadow ? 0.30 : 0.12);
    state.detection = Math.max(0, state.detection - drain * dt);
  }

  const alerted = state.detection > 0.6;
  const suspicious = state.detection > 0.25;
  for (const g of guards) {
    if (alerted && g.lastSeen) {
      g.state = 'CHASE';
      const arrived = moveToward(g, g.lastSeen.x, g.lastSeen.y, GAME.guardChaseSpeed, dt, world);
      if (arrived) { g.state = 'SEARCH'; g.searchTimer = 3; }
    } else if (g.investigate) {
      g.state = 'SUSPICIOUS';
      const arrived = moveToward(g, g.investigate.x, g.investigate.y, GAME.guardInvestigateSpeed, dt, world);
      if (arrived) { g.investigate = null; g.state = 'SEARCH'; g.searchTimer = 2.5; }
    } else if (g.state === 'SEARCH') {
      g.searchTimer -= dt;
      g.angle += dt * 1.4;
      if (g.searchTimer <= 0) g.state = 'CALM';
    } else {
      g.state = suspicious ? 'SUSPICIOUS' : 'CALM';
      if (g.waitTimer > 0) {
        g.waitTimer -= dt;
      } else {
        const wp = g.waypoints[g.wpIndex];
        const arrived = moveToward(g, wp.x, wp.y, GAME.guardPatrolSpeed, dt, world);
        if (arrived) {
          g.waitTimer = g.waits[g.wpIndex % g.waits.length];
          g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
        }
      }
    }
    // Caught: a chasing conductor touches the thief.
    if ((g.state === 'CHASE' || g.state === 'ALERTED') &&
        Math.hypot(g.x - player.x, g.y - player.y) < GAME.catchDistance) {
      state.screen = 'caught';
      state.attempts++;
      state.spotted++;
    }
  }
  if (state.detection > 0.25 && state.detection <= 0.6 && !state.suspicionNoted) {
    state.suspicionNoted = true;
  }
  if (state.detection <= 0.25) state.suspicionNoted = false;
}

export function coneColor(stateName) {
  if (stateName === 'CHASE' || stateName === 'ALERTED') return 'alert';
  if (stateName === 'SUSPICIOUS' || stateName === 'SEARCH') return 'susp';
  return 'calm';
}

export function playerZones(player, world, lamps) {
  let hidden = false, inShadow = true, lit = false;
  for (const z of world.hideZones) {
    if (pointInRect(player.x, player.y, z)) {
      if (z.kind === 'berth') { if (player.sneaking) hidden = true; }
      else hidden = true;
    }
  }
  for (const z of world.litZones) {
    if (pointInRect(player.x, player.y, z)) { lit = true; inShadow = false; }
  }
  for (const lamp of lamps) {
    if (!lamp.doused && Math.hypot(player.x - lamp.pos.x, player.y - lamp.pos.y) < lamp.r) {
      lit = true; inShadow = false;
    }
  }
  return { hidden, inShadow, lit };
}
