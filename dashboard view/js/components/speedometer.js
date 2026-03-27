export function createSpeedometer({ label, value = 0, max, unit = '' }) {
  const circumference = Math.PI * 70;

  const wrap = document.createElement('article');
  wrap.className = 'panel gauge-card';
  wrap.innerHTML = `
    <div class="gauge-label">${label}</div>
    <svg class="gauge" viewBox="0 0 200 120" role="img" aria-label="${label} speedometer">
      <path class="track" d="M 20 100 A 80 80 0 0 1 180 100" />
      <path class="fill" d="M 20 100 A 80 80 0 0 1 180 100" style="stroke-dasharray:${circumference};stroke-dashoffset:${circumference};"/>
    </svg>
    <div class="gauge-value"></div>
  `;

  const fill = wrap.querySelector('.fill');
  const labelNode = wrap.querySelector('.gauge-value');

  function setValue(nextValue) {
    const pct = Math.max(0, Math.min(1, nextValue / max));
    const dashOffset = circumference * (1 - pct);
    fill.style.strokeDashoffset = String(dashOffset);
    labelNode.textContent = `${nextValue}${unit} / ${max}${unit}`;
  }

  setValue(value);

  return { element: wrap, setValue };
}
