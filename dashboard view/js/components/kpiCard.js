export function createKpiCard({ title, value, tone = '' }) {
  const node = document.createElement('article');
  node.className = 'panel';
  node.innerHTML = `
    <div class="title">${title}</div>
    <div class="value ${tone}">${value}</div>
  `;
  return node;
}
