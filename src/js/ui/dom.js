// Small DOM helpers shared by all screens.

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function diffDots(difficulty) {
  let dots = '';
  for (let i = 1; i <= 5; i++) dots += `<i class="${i <= difficulty ? 'on' : ''}"></i>`;
  return `<span class="diff-dots" aria-label="Difficulty ${difficulty} of 5">${dots}</span>`;
}

export function starsRange(min, max) {
  const gold = '★'.repeat(max);
  const off = '★'.repeat(Math.max(0, 5 - max));
  const dim = min > 1 ? `<span class="off">${'★'.repeat(min - 1)}</span>` : '';
  return `<span class="stars" aria-label="Difficulty ${min}–${max} of 5"><span class="off">${'★'.repeat(Math.max(0, min - 1))}</span><span>${gold}</span><span class="off">${off}</span></span>`;
}
