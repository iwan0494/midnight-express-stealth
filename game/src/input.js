// Keyboard + mouse input state.
export function makeInput() {
  return {
    up: false, down: false, left: false, right: false, sneak: false,
    mouseX: 0, mouseY: 0, clicked: false,
    pressed: {}, // edge-triggered keys, consumed by main.js
  };
}

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
};

export function bindInput(input, canvas, handlers) {
  window.addEventListener('keydown', (e) => {
    const name = KEYMAP[e.code];
    if (name) { input[name] = true; e.preventDefault(); }
    if (!e.repeat) input.pressed[e.code] = true;
    if (handlers && handlers.onKey) handlers.onKey(e.code, e);
  });
  window.addEventListener('keyup', (e) => {
    const name = KEYMAP[e.code];
    if (name) input[name] = false;
  });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouseX = (e.clientX - r.left) * (canvas.width / r.width);
    input.mouseY = (e.clientY - r.top) * (canvas.height / r.height);
  });
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) input.clicked = true;
  });
  window.addEventListener('blur', () => {
    input.up = input.down = input.left = input.right = input.sneak = false;
  });
}
