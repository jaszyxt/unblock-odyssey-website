// Applied before first paint to avoid a theme flash. Kept as an external
// file so the Content-Security-Policy can forbid all inline scripts.
(function () {
  var d = document.documentElement;
  try {
    d.dataset.theme = localStorage.getItem('uo_theme')
      || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    d.dataset.contrast = localStorage.getItem('uo_contrast') || 'normal';
    d.dataset.motion = localStorage.getItem('uo_motion')
      || (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full');
  } catch (e) { /* storage unavailable */ }
})();
