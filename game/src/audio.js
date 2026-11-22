// Synthesised WebAudio only — no audio files.
export function makeAudio() {
  return { ctx: null, muted: false };
}

function ensure(a) {
  if (!a.ctx) {
    try { a.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { a.ctx = null; }
  }
  if (a.ctx && a.ctx.state === 'suspended') a.ctx.resume();
  return a.ctx;
}

function beep(a, freq, dur, type, vol, when = 0) {
  if (a.muted) return;
  const ctx = ensure(a);
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(ctx.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

export const sfx = {
  step(a) { beep(a, 180, 0.05, 'triangle', 0.05); },
  pickup(a) { beep(a, 660, 0.12, 'sine', 0.12); beep(a, 990, 0.14, 'sine', 0.10, 0.08); },
  alert(a) { beep(a, 220, 0.25, 'sawtooth', 0.10); beep(a, 165, 0.3, 'sawtooth', 0.10, 0.12); },
  caught(a) { beep(a, 110, 0.5, 'sawtooth', 0.14); },
  win(a) { [523, 659, 784, 1047].forEach((f, i) => beep(a, f, 0.18, 'sine', 0.12, i * 0.12)); },
  mist(a) { beep(a, 320, 0.3, 'sine', 0.08); },
  douse(a) { beep(a, 440, 0.1, 'square', 0.06); },
};
