function clear(container) {
  container.innerHTML = '';
}

function appendEmpty(container, message) {
  const empty = document.createElement('div');
  empty.className = 'chart-empty';
  empty.textContent = message;
  container.append(empty);
}

export function renderBarChart(container, data = [], options = {}) {
  clear(container);
  if (!data.length) {
    appendEmpty(container, 'No chart data yet. Run ingest.');
    return;
  }

  const max = Math.max(...data.map((item) => Number(item.value || 0)), 1);
  const bars = document.createElement('div');
  bars.className = 'bars';

  data.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'bar-row';
    const label = document.createElement('span');
    label.className = 'bar-label';
    label.textContent = item.label;

    const track = document.createElement('div');
    track.className = 'bar-track';
    const fill = document.createElement('div');
    fill.className = 'bar-fill';
    fill.style.width = `${(Number(item.value || 0) / max) * 100}%`;

    const value = document.createElement('span');
    value.className = 'bar-value';
    value.textContent = `${Number(item.value || 0).toFixed(options.decimals ?? 0)}${options.unit || ''}`;

    track.append(fill);
    row.append(label, track, value);
    bars.append(row);
  });

  container.append(bars);
}

export function renderLineChart(container, points = []) {
  clear(container);
  if (!points.length) {
    appendEmpty(container, 'No chart data yet. Run ingest.');
    return;
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 620 220');
  svg.setAttribute('class', 'chart-svg');

  const max = Math.max(...points.map((point) => Number(point.value || 0)), 1);
  const xStart = 60;
  const xEnd = 580;
  const yBottom = 180;
  const yTop = 25;

  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  polyline.setAttribute('class', 'line-main');
  const area = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  area.setAttribute('class', 'line-area');

  const polylinePoints = points.map((point, index) => {
    const x = xStart + (points.length === 1 ? 0 : (index * (xEnd - xStart)) / (points.length - 1));
    const y = yBottom - (Number(point.value || 0) / max) * (yBottom - yTop);

    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', x);
    dot.setAttribute('cy', y);
    dot.setAttribute('r', '4');
    dot.setAttribute('class', 'line-dot');
    svg.append(dot);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', 204);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('class', 'line-label');
    label.textContent = point.label;
    svg.append(label);

    return `${x},${y}`;
  });

  polyline.setAttribute('points', polylinePoints.join(' '));
  const areaPoints = `${xStart},${yBottom} ${polylinePoints.join(' ')} ${xEnd},${yBottom}`;
  area.setAttribute('points', areaPoints);
  svg.append(area);
  svg.append(polyline);
  container.append(svg);
}

export function renderDonutChart(container, slices = []) {
  clear(container);
  if (!slices.length) {
    appendEmpty(container, 'No chart data yet. Run ingest.');
    return;
  }

  const total = slices.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
  const colors = ['#38bdf8', '#22d3ee', '#8b5cf6', '#34d399', '#f59e0b', '#ef4444'];

  const wrap = document.createElement('div');
  wrap.className = 'donut-wrap';

  const donut = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  donut.setAttribute('viewBox', '0 0 180 180');
  donut.setAttribute('class', 'donut-svg');

  let cumulative = 0;
  slices.forEach((slice, index) => {
    const value = Number(slice.value || 0);
    const fraction = value / total;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '90');
    circle.setAttribute('cy', '90');
    circle.setAttribute('r', '60');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', colors[index % colors.length]);
    circle.setAttribute('stroke-width', '24');
    circle.setAttribute('stroke-dasharray', `${fraction * 377} 377`);
    circle.setAttribute('stroke-dashoffset', `${-cumulative * 377}`);
    circle.setAttribute('transform', 'rotate(-90 90 90)');
    donut.append(circle);
    cumulative += fraction;
  });

  const legend = document.createElement('div');
  legend.className = 'donut-legend';
  slices.forEach((slice, index) => {
    const row = document.createElement('div');
    row.className = 'donut-row';
    row.innerHTML = `<span class="dot" style="background:${colors[index % colors.length]}"></span>${slice.label}: ${slice.value}`;
    legend.append(row);
  });

  wrap.append(donut, legend);
  container.append(wrap);
}

export function renderHeatmap(container, grid = []) {
  clear(container);
  if (!grid.length) {
    appendEmpty(container, 'No chart data yet. Run ingest.');
    return;
  }

  const metrics = Object.keys(grid[0].metrics || {});
  const values = grid.flatMap((row) => metrics.map((metric) => Number(row.metrics[metric] || 0)));
  const max = Math.max(...values, 1);

  const table = document.createElement('div');
  table.className = 'heatmap';

  const header = document.createElement('div');
  header.className = 'heatmap-row header';
  header.innerHTML = `<span>Segment</span>${metrics.map((metric) => `<span>${metric}</span>`).join('')}`;
  table.append(header);

  grid.forEach((row) => {
    const line = document.createElement('div');
    line.className = 'heatmap-row';

    const first = document.createElement('span');
    first.textContent = row.segment;
    line.append(first);

    metrics.forEach((metric) => {
      const value = Number(row.metrics[metric] || 0);
      const intensity = value / max;
      const cell = document.createElement('span');
      cell.className = 'heatmap-cell';
      cell.style.background = `rgba(56, 189, 248, ${0.12 + intensity * 0.8})`;
      cell.textContent = Number.isInteger(value) ? `${value}` : value.toFixed(2);
      line.append(cell);
    });

    table.append(line);
  });

  container.append(table);
}
