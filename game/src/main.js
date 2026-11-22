// MIDNIGHT EXPRESS — game loop and state machine.
import { CARRIAGES, GAME } from './config.js';
import { buildWorld } from './world.js';
import { makeGuard, updateGuards, playerZones } from './guards.js';
import { makePlayer, updatePlayer, throwPebble, throwSteam, doInteract } from './player.js';
import { drawWorld, drawGuards, drawPlayer, drawCallouts, drawFloorLabels } from './render.js';
import { drawTopBar, drawBottomBar, drawRightPanel, drawScreens } from './hud.js';
import { makeInput, bindInput } from './input.js';
import { makeAudio, sfx } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const state = {
  screen: 'title',
  carriageIndex: 0,
  carriage: CARRIAGES[0],
  world: null,
  guards: [],
  player: null,
  loot: [], lootTotal: 0,
  prize: null, prizeTaken: false,
  exit: null, exitOpen: false,
  wires: [], lanterns: [], lamps: [], switches: [],
  steamClouds: [], noiseRings: [],
  detection: 0, alarm: 0, time: 0,
  spotted: 0, attempts: 0,
  callouts: null, shotMode: false, showPaths: true,
  prevX: 0, prevY: 0, wireFlash: 0, suspicionNoted: false, lastSeen: null,
  audio: makeAudio(),
};
window.__MX = state;

state.loadCarriage = function loadCarriage(idx) {
  const c = CARRIAGES[idx];
  state.carriageIndex = idx;
  state.carriage = c;
  state.world = buildWorld(c);
  state.guards = c.guards.map((d, i) => makeGuard(d, i));
  state.player = makePlayer(c.player);
  state.loot = c.loot.map((p) => ({ x: p.x, y: p.y, taken: false }));
  state.lootTotal = state.loot.length;
  state.prize = { x: c.prize.x, y: c.prize.y };
  state.prizeTaken = false;
  state.exit = { x: state.world.exit.x + state.world.exit.w / 2, y: state.world.exit.y + state.world.exit.h / 2 };
  state.exitOpen = false;
  state.wires = c.wires.map((w) => ({ ...w }));
  state.lanterns = c.lanterns.map((L) => ({ ...L, angle: L.baseAngle }));
  state.lamps = c.lamps.map((l) => ({ pos: { ...l.pos }, r: l.r, doused: false }));
  state.switches = c.switches.map((s) => ({ pos: { ...s.pos }, lamp: s.lamp }));
  state.steamClouds = [];
  state.noiseRings = [];
  state.detection = 0; state.alarm = 0; state.time = 0;
  state.wireFlash = 0;
  state.prevX = state.player.x; state.prevY = state.player.y;
  const z = playerZones(state.player, state.world, state.lamps);
  state.player.hidden = z.hidden; state.player.inShadow = z.inShadow; state.player.lit = z.lit;
};

const input = makeInput();
bindInput(input, canvas);

function startRun() {
  state.spotted = 0; state.attempts = 0;
  state.loadCarriage(0);
  state.screen = 'playing';
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!state.shotMode) update(dt);
  render();
  requestAnimationFrame(frame);
}

function update(dt) {
  const p = state.player;
  if (state.screen === 'playing') {
    state.time += dt;
    for (const L of state.lanterns) {
      L.angle = L.baseAngle + Math.sin(state.time * L.sweep) * 0.9;
    }
    for (const c of state.steamClouds) c.t -= dt;
    state.steamClouds = state.steamClouds.filter((c) => c.t > 0);
    for (const r of state.noiseRings) { r.t += dt * 1.6; r.r = 8 + (r.max - 8) * Math.min(1, r.t); }
    state.noiseRings = state.noiseRings.filter((r) => r.t < 1);
    if (state.wireFlash > 0) state.wireFlash -= dt;
    state.alarm = Math.max(0, state.alarm - dt * 0.03);
    updatePlayer(state, input, dt);
    const z = playerZones(p, state.world, state.lamps);
    p.hidden = z.hidden; p.inShadow = z.inShadow; p.lit = z.lit;
    const prevDetection = state.detection;
    updateGuards(state, dt);
    if (state.detection > 0.6 && prevDetection <= 0.6) sfx.alert(state.audio);
    if (state.screen === 'caught') sfx.caught(state.audio);
    if (input.clicked && p) {
      input.clicked = false;
      if (input.mouseX < 1044) throwPebble(state, input.mouseX, input.mouseY);
    }
  }
  // Edge-triggered keys.
  const pressed = input.pressed;
  if (pressed.Enter) {
    if (state.screen === 'title') startRun();
    else if (state.screen === 'carriageComplete') {
      if (state.carriageIndex >= CARRIAGES.length - 1) { state.screen = 'title'; }
      else { state.loadCarriage(state.carriageIndex + 1); state.screen = 'playing'; }
    }
  }
  if (pressed.KeyR && (state.screen === 'caught' || state.screen === 'playing' || state.screen === 'paused')) {
    state.loadCarriage(state.carriageIndex);
    state.screen = 'playing';
  }
  if (pressed.Escape) {
    if (state.screen === 'playing') state.screen = 'paused';
    else if (state.screen === 'paused') state.screen = 'playing';
  }
  if (pressed.KeyE && state.screen === 'playing') {
    const res = doInteract(state);
    if (res === 'loot' || res === 'prize') sfx.pickup(state.audio);
    if (res === 'switch') sfx.douse(state.audio);
    if (res === 'exit') sfx.win(state.audio);
  }
  if (pressed.KeyQ && state.screen === 'playing') {
    if (throwSteam(state)) sfx.mist(state.audio);
  }
  if (pressed.KeyM) state.audio.muted = !state.audio.muted;
  if (pressed.KeyH) state.showPaths = !state.showPaths;
  input.pressed = {};
}

function render() {
  ctx.clearRect(0, 0, 1280, 720);
  ctx.fillStyle = '#0b0e1c';
  ctx.fillRect(0, 0, 1280, 720);
  if (state.world) {
    drawWorld(ctx, state);
    drawGuards(ctx, state);
    drawFloorLabels(ctx, state);
    drawPlayer(ctx, state);
    drawCallouts(ctx, state);
    if (state.wireFlash > 0) {
      ctx.fillStyle = `rgba(255,77,109,${0.25 * state.wireFlash})`;
      ctx.fillRect(0, 52, 1044, 628);
    }
  }
  drawTopBar(ctx, state);
  drawBottomBar(ctx);
  drawRightPanel(ctx, state);
  drawScreens(ctx, state);
}

state.loadCarriage(0);
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  applyShot(state, Number(shot));
} else {
  state.screen = 'title';
}
requestAnimationFrame(frame);
