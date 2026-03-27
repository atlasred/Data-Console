export function createTablePanel({ title, headers, rows }) {
  const node = document.createElement('article');
  node.className = 'panel';

  const headerHtml = headers.map((h) => `<th>${h}</th>`).join('');
  const rowsHtml = rows
    .map((cols) => `<tr>${cols.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('');

  node.innerHTML = `
    <div class="title">${title}</div>
    <table>
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;

  return node;
}
