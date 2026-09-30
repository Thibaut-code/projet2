(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const cards = document.querySelectorAll('.creation-card');
  const previews = document.querySelectorAll('.preview-window');
  const resize = () => previews.forEach(el => el.style.setProperty('--preview-scale', String(el.clientWidth / 1440)));
  if ('ResizeObserver' in window) { const observer = new ResizeObserver(resize); previews.forEach(el => observer.observe(el)); }
  else window.addEventListener('resize', resize);
  resize();
  if (!motion.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('entering'); observer.unobserve(entry.target); }
    }), {threshold:.08});
    cards.forEach(card => { card.classList.add('entering'); observer.observe(card); });
  }
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) cards.forEach(card => {
    card.addEventListener('pointermove', event => {
      if (motion.matches) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--tilt-x', `${(0.5 - (event.clientY - rect.top) / rect.height) * 3}deg`);
      card.style.setProperty('--tilt-y', `${((event.clientX - rect.left) / rect.width - 0.5) * 3}deg`);
    });
    card.addEventListener('pointerleave', () => { card.style.removeProperty('--tilt-x'); card.style.removeProperty('--tilt-y'); });
  });
  motion.addEventListener('change', () => { if (motion.matches) cards.forEach(card => { card.classList.remove('entering'); card.style.removeProperty('--tilt-x'); card.style.removeProperty('--tilt-y'); }); });
})();
