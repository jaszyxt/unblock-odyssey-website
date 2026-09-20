// Celebration effects: confetti burst using world/brand colors.

export function confetti(colors = ['#FF5252', '#FFD54F', '#4DB6AC', '#BA68C8', '#5C51D6', '#00E676'], count = 90) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDuration = `${1.6 + Math.random() * 1.6}s`;
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    if (Math.random() > 0.5) piece.style.borderRadius = '50%';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 3800);
  }
}

export function starsHtml(count, max = 3) {
  const filled = '★'.repeat(count);
  const off = '★'.repeat(Math.max(0, max - count));
  return `<span class="stars" aria-label="${count} of ${max} stars"><span>${filled}</span><span class="off">${off}</span></span>`;
}
