const statusEl = document.getElementById('status');
const padNameEl = document.getElementById('pad-name');
const buttonsEl = document.getElementById('buttons');
const axesEl = document.getElementById('axes');

let buttonEls = [];
let axisEls = [];
let activeIndex = null;

function buildLayout(gamepad) {
  buttonsEl.innerHTML = '';
  buttonEls = gamepad.buttons.map((_, i) => {
    const div = document.createElement('div');
    div.className = 'btn';
    div.textContent = i;
    buttonsEl.appendChild(div);
    return div;
  });

  axesEl.innerHTML = '';
  axisEls = gamepad.axes.map((_, i) => {
    const row = document.createElement('div');
    row.className = 'axis-row';

    const label = document.createElement('div');
    label.className = 'axis-label';
    label.textContent = `axis ${i}`;

    const track = document.createElement('div');
    track.className = 'axis-track';
    const fill = document.createElement('div');
    fill.className = 'axis-fill';
    track.appendChild(fill);

    row.appendChild(label);
    row.appendChild(track);
    axesEl.appendChild(row);
    return fill;
  });
}

function render() {
  const pads = navigator.getGamepads();
  const gamepad = activeIndex !== null ? pads[activeIndex] : null;

  if (!gamepad) {
    requestAnimationFrame(render);
    return;
  }

  if (buttonEls.length !== gamepad.buttons.length || axisEls.length !== gamepad.axes.length) {
    buildLayout(gamepad);
  }

  gamepad.buttons.forEach((b, i) => {
    buttonEls[i].classList.toggle('pressed', b.pressed || b.value > 0.5);
  });

  gamepad.axes.forEach((v, i) => {
    const fill = axisEls[i];
    const pct = Math.min(Math.abs(v), 1) * 50;
    if (v >= 0) {
      fill.style.left = '50%';
      fill.style.width = `${pct}%`;
    } else {
      fill.style.left = `${50 - pct}%`;
      fill.style.width = `${pct}%`;
    }
  });

  requestAnimationFrame(render);
}

window.addEventListener('gamepadconnected', (e) => {
  activeIndex = e.gamepad.index;
  statusEl.textContent = 'Controller connected';
  padNameEl.textContent = e.gamepad.id;
  buildLayout(e.gamepad);
});

window.addEventListener('gamepaddisconnected', (e) => {
  if (e.gamepad.index === activeIndex) {
    activeIndex = null;
    statusEl.textContent = 'Waiting for controller… press any button';
    padNameEl.textContent = '';
    buttonsEl.innerHTML = '';
    axesEl.innerHTML = '';
  }
});

requestAnimationFrame(render);
