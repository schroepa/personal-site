export function initMagneticButtons(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const elements = document.querySelectorAll<HTMLElement>('[data-magnetic]');

  elements.forEach((el) => {
    const inner = el.querySelector<HTMLElement>('[data-magnetic-inner]');

    el.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const maxX = 12;
      const maxY = 8;
      const tx = (dx / (rect.width / 2)) * maxX;
      const ty = (dy / (rect.height / 2)) * maxY;

      el.style.transform = `translate(${tx}px, ${ty}px)`;
      if (inner) {
        inner.style.transform = `translate(${tx * 0.5}px, ${ty * 0.5}px)`;
      }
    });

    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform 400ms cubic-bezier(0.23, 1, 0.32, 1)';
      el.style.transform = 'translate(0, 0)';
      if (inner) {
        inner.style.transition = 'transform 400ms cubic-bezier(0.23, 1, 0.32, 1)';
        inner.style.transform = 'translate(0, 0)';
      }
      setTimeout(() => {
        el.style.transition = '';
        if (inner) inner.style.transition = '';
      }, 400);
    });

    el.addEventListener('mouseenter', () => {
      el.style.transition = '';
      if (inner) inner.style.transition = '';
    });
  });
}
