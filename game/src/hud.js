// HUD: top bar, bottom bar, right-side panel (detection, meters, legend,
// controls) and the title / pause / caught / complete screens.
import { COLORS, PLAY_W, TOP_BAR, BOTTOM_BAR } from './config.js';

const PANEL_X = PLAY_W;
const PANEL_W = 236;
const CANVAS_W = 1280;
const CANVAS_H = 720;

function fmtTime(s) {
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export function detectionLabel(state) {
  if (state.detection > 0.6) return 'ALERTED !';
  if (state.detection > 0.25) return 'SUSPICIOUS ?';
  return 'UNSEEN';
}

export function drawTopBar(ctx, state) {
  ctx.fillStyle = '#10152a';
  ctx.fillRect(0, 0, CANVAS_W, TOP_BAR);
  ctx.fillStyle = COLORS.accent;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('MIDNIGHT EXPRESS', 14, TOP_BAR / 2 + 1);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '13px Georgia, serif';
  ctx.fillText(state.carriage.name, 268, TOP_BAR / 2 + 1);
  ctx.fillStyle = COLORS.accent;
  ctx.font = 'italic 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('OBJECTIVE: Take the Brass Key, then reach the rear door', 660, TOP_BAR / 2 + 1);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText(`TIME ${fmtTime(state.time)}`, CANVAS_W - PANEL_W - 16, TOP_BAR / 2 + 1);
  ctx.fillStyle = COLORS.hudLine;
  ctx.fillRect(0, TOP_BAR - 1, CANVAS_W, 1);
}

export function drawBottomBar(ctx) {
  const y = CANVAS_H - BOTTOM_BAR;
  ctx.fillStyle = '#10152a';
  ctx.fillRect(0, y, CANVAS_W, BOTTOM_BAR);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '12px Georgia, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('WASD move · SHIFT sneak · CLICK pebble · Q steam · E interact · H notes · M mute · ESC pause · R retry', CANVAS_W / 2, y + BOTTOM_BAR / 2);
}

function meter(ctx, x, y, w, frac, fill, label, value) {
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '11px Georgia, serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);
  ctx.fillStyle = '#0d1226';
  ctx.fillRect(x + 78, y - 6, w, 12);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 78, y - 6, Math.max(0, Math.min(1, frac)) * w, 12);
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'right';
  ctx.fillText(value, x + 78 + w + 40, y);
}

export function drawRightPanel(ctx, state) {
  const x = PANEL_X, w = PANEL_W;
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(x, 0, w, CANVAS_H);
  ctx.strokeStyle = COLORS.hudLine;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, CANVAS_H); ctx.stroke();
  let y = 18;
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '11px Georgia, serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('DETECTION', x + 14, y);
  y += 22;
  const label = detectionLabel(state);
  const pill = state.detection > 0.6 ? '#e23b2e' : state.detection > 0.25 ? '#e8a13c' : '#2fae5f';
  ctx.fillStyle = pill;
  ctx.fillRect(x + 14, y, w - 28, 30);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + 16);
  y += 46;
  ctx.fillStyle = '#0d1226';
  ctx.fillRect(x + 14, y, w - 28, 10);
  ctx.fillStyle = pill;
  ctx.fillRect(x + 14, y, (w - 28) * Math.min(1, state.detection), 10);
  y += 30;
  meter(ctx, x + 14, y, 84, state.alarm, '#ff4d6d', 'ALARM', state.alarm > 0.5 ? 'HIGH' : state.alarm > 0.15 ? 'LOW' : 'QUIET');
  y += 22;
  meter(ctx, x + 14, y, 84, state.player.lit ? 1 : 0.25, '#9fc3e8', 'VISIBILITY', state.player.lit ? 'IN MOONLIGHT' : 'SHADOW');
  y += 22;
  meter(ctx, x + 14, y, 84, state.player.running ? 1 : 0.1, '#e8c85a', 'NOISE', state.player.running ? 'LOUD' : 'SILENT');
  y += 32;
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText(`LOOT ${state.player.loot} / ${state.lootTotal}`, x + 14, y);
  ctx.fillText(`SPOTTED ${state.spotted}`, x + 128, y);
  y += 22;
  ctx.fillText(`PEBBLES ${'●'.repeat(state.player.pebbles)}${'○'.repeat(Math.max(0, 5 - state.player.pebbles))}`, x + 14, y);
  y += 22;
  ctx.fillText(`STEAM ${'●'.repeat(state.player.steam)}${'○'.repeat(Math.max(0, 2 - state.player.steam))}`, x + 14, y);
  y += 26;
  ctx.fillStyle = state.player.hasKey ? '#7be3a0' : COLORS.accent;
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText(state.player.hasKey ? 'GOAL  KEY ✓ — EXIT OPEN' : 'GOAL  KEY NOT YET', x + 14, y);
  y += 30;
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '11px Georgia, serif';
  ctx.fillText('LEGEND', x + 14, y);
  y += 16;
  const legend = [
    ['#e07830', 'Conductor + vision cone'],
    ['#2e5d43', 'Berth: crouch to hide'],
    ['#7a5a34', 'Luggage: blocks sight'],
    ['#9fc3e8', 'Moonlight: seen from afar'],
    ['#123326', 'Shadow berth: hidden'],
    ['#ff4d6d', 'Alarm wire: time the gap'],
    ['#ffb347', 'Lantern: sweeping arc'],
    ['#e6ebf5', 'Steam: Q blocks vision'],
    ['#e8c85a', 'Brass Key: the prize'],
    ['#2fae5f', 'Rear door: exit once key held'],
  ];
  ctx.font = '12px Georgia, serif';
  for (const [c, t] of legend) {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(x + 20, y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.text;
    ctx.fillText(t, x + 32, y);
    y += 19;
  }
  y += 8;
  ctx.fillStyle = COLORS.textDim;
  ctx.font = 'italic 12px Georgia, serif';
  ctx.fillText('Patrols repeat — learn them,', x + 14, y); y += 16;
  ctx.fillText('wait, then move. A near miss', x + 14, y); y += 16;
  ctx.fillText('only makes them suspicious.', x + 14, y);
  y += 26;
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '11px Georgia, serif';
  ctx.fillText('CONTROLS', x + 14, y);
  y += 18;
  ctx.fillStyle = COLORS.text;
  ctx.font = '12px Georgia, serif';
  const controls = ['WASD move · SHIFT sneak (silent)', 'E interact / douse a lamp', 'CLICK throw pebble · Q steam', 'ESC pause · R retry'];
  for (const c of controls) { ctx.fillText(c, x + 14, y); y += 18; }
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8,11,24,0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#10152a';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  const w = 560, h = 300, x = (CANVAS_W - w) / 2, y = (CANVAS_H - h) / 2;
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = 'bold 30px Georgia, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(title, CANVAS_W / 2, y + 52);
  ctx.fillStyle = COLORS.text;
  ctx.font = '15px Georgia, serif';
  lines.forEach((ln, i) => ctx.fillText(ln, CANVAS_W / 2, y + 108 + i * 28));
}

export function drawScreens(ctx, state) {
  if (state.screen === 'title') {
    overlay(ctx, 'MIDNIGHT EXPRESS', [
      'A stowaway aboard a sleeper train at night.',
      'Take the Brass Key from the conductor’s safe,',
      'then slip out the rear door — unseen.',
      '',
      'ENTER — board the train',
    ], COLORS.accent);
  } else if (state.screen === 'paused') {
    overlay(ctx, 'PAUSED', ['ESC — resume', 'R — restart this carriage'], COLORS.textDim);
  } else if (state.screen === 'caught') {
    overlay(ctx, 'CAUGHT!', [
      `The conductor caught you in carriage ${state.carriageIndex + 1}.`,
      `Attempts: ${state.attempts}   ·   Loot kept: ${state.player.loot}`,
      '',
      'R — try this carriage again',
    ], '#e23b2e');
  } else if (state.screen === 'carriageComplete') {
    const ghost = state.spotted === 0;
    overlay(ctx, state.carriageIndex >= 2 ? 'ALL ABOARD — YOU MADE IT!' : 'CARRIAGE CLEAR', [
      `${state.carriage.short} — time ${fmtTime(state.time)}, loot ${state.player.loot}/${state.lootTotal}, spotted ${state.spotted}.`,
      ghost ? 'GHOST BONUS — never spotted!' : 'Spotted — the crew is on edge.',
      '',
      state.carriageIndex >= 2 ? 'ENTER — ride again' : 'ENTER — next carriage',
    ], '#7be3a0');
  }
}
