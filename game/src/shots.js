// Deterministic staged scenes for the screenshots (?shot=1..4).
// Each scene freezes the game and stages one focal moment, max 3 callouts.
import { tile } from './config.js';
import { playerZones } from './guards.js';

function setGuard(state, idx, x, y, angle, guardState, coneOverride) {
  const g = state.guards[idx];
  if (!g) return;
  g.x = x; g.y = y; g.angle = angle; g.state = guardState;
  g.coneOverride = coneOverride || null;
  g.investigate = null;
}

function refreshZones(state) {
  const z = playerZones(state.player, state.world, state.lamps);
  state.player.hidden = z.hidden; state.player.inShadow = z.inShadow; state.player.lit = z.lit;
}

export function applyShot(state, id) {
  state.shotMode = true;
  state.screen = 'playing';
  state.callouts = [];
  state.steamClouds = [];
  state.noiseRings = [];
  if (id === 1) {
    // Cover: Carriage 1, thief hidden in the shadow berth, lantern sweeping.
    state.carriageIndex = 0;
    state.loadCarriage(0);
    state.player.x = tile(2, 11).x; state.player.y = tile(2, 11).y;
    state.player.sneaking = true;
    state.player.loot = 3;
    state.time = 71;
    state.detection = 0; state.alarm = 0;
    setGuard(state, 0, tile(3, 5).x, tile(3, 5).y, 0, 'CALM');
    setGuard(state, 1, tile(22, 9).x, tile(22, 9).y, Math.PI, 'CALM');
    setGuard(state, 2, tile(13, 3).x, tile(13, 3).y, Math.PI / 2, 'CALM');
    state.lanterns[0].angle = Math.PI / 2 + 0.5;
    state.callouts = [
      { x: tile(3, 5).x, y: tile(3, 5).y, lx: 150, ly: 108, text: 'PATROL: dashed route, learn it' },
      { x: state.lanterns[0].pos.x, y: state.lanterns[0].pos.y, lx: 620, ly: 108, text: 'LANTERN: a sweeping arc' },
      { x: state.player.x, y: state.player.y, lx: 300, ly: 470, text: 'YOU: hidden in the shadow berth' },
    ];
  } else if (id === 2) {
    // Play: Carriage 2, suspicious conductor investigating a pebble, wire pulsing.
    state.carriageIndex = 1;
    state.loadCarriage(1);
    state.player.x = tile(13, 7).x; state.player.y = tile(13, 7).y;
    state.player.sneaking = true;
    state.player.loot = 5; state.player.pebbles = 4;
    state.time = 147;
    state.detection = 0.52; state.alarm = 0.35;
    setGuard(state, 0, tile(8, 5).x, tile(8, 5).y, -Math.PI / 2, 'SUSPICIOUS');
    state.guards[0].investigate = { x: tile(10, 5).x, y: tile(10, 5).y };
    state.noiseRings.push({ x: tile(10, 5).x, y: tile(10, 5).y, r: 42, max: 150, t: 0.35 });
    state.wires[0].phase = 0;
    state.callouts = [
      { x: tile(8, 5).x, y: tile(8, 5).y, lx: 360, ly: 300, text: '? HEARD THE PEBBLE — off to look' },
      { x: (state.wires[0].x1 + state.wires[0].x2) / 2, y: (state.wires[0].y1 + state.wires[0].y2) / 2, lx: 650, ly: 610, text: 'ALARM WIRE — time the gap' },
      { x: state.player.x, y: state.player.y, lx: 250, ly: 610, text: 'SNEAK: slower, quieter, harder to see' },
    ];
  } else if (id === 3) {
    // Hide: Carriage 3, red cone sweeps past the hidden thief, lamp doused.
    state.carriageIndex = 2;
    state.loadCarriage(2);
    state.player.x = tile(2, 8).x; state.player.y = tile(2, 8).y;
    state.player.sneaking = true;
    state.player.loot = 7;
    state.time = 203;
    state.detection = 0.18; state.alarm = 0;
    state.lamps[2].doused = true;
    setGuard(state, 1, tile(23, 9).x, tile(23, 9).y, Math.PI, 'SUSPICIOUS', 'alert');
    setGuard(state, 0, tile(2, 3).x, tile(2, 3).y, 0, 'CALM');
    state.callouts = [
      { x: tile(23, 9).x, y: tile(23, 9).y, lx: 700, ly: 470, text: 'THE CONE SWEEPS PAST — hold still' },
      { x: state.lamps[2].pos.x, y: state.lamps[2].pos.y, lx: 560, ly: 600, text: 'LAMP DOUSED — a shadow to work in' },
      { x: state.player.x, y: state.player.y, lx: 200, ly: 430, text: 'SHADOW: hidden unless a conductor is close' },
    ];
  } else {
    // Exit: Carriage 3, key secured, rear door open, one last cone to time.
    state.carriageIndex = 2;
    state.loadCarriage(2);
    state.player.x = tile(23, 13).x; state.player.y = tile(23, 13).y;
    state.player.loot = 9; state.player.hasKey = true;
    state.prizeTaken = true; state.exitOpen = true;
    state.time = 241;
    state.detection = 0.48; state.alarm = 0.3;
    setGuard(state, 4, tile(19, 12).x, tile(19, 12).y, -Math.PI / 2, 'SUSPICIOUS');
    state.guards[4].investigate = { x: tile(21, 12).x, y: tile(21, 12).y };
    state.callouts = [
      { x: state.prize.x, y: state.prize.y, lx: 380, ly: 220, text: 'KEY SECURED: THE BRASS KEY ✓' },
      { x: tile(19, 12).x, y: tile(19, 12).y, lx: 560, ly: 430, text: 'ONE LAST CONE — time your exit' },
      { x: state.exit.x, y: state.exit.y, lx: 640, ly: 610, text: 'REAR DOOR OPEN — go' },
    ];
  }
  refreshZones(state);
}
