export function initTextReveal(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const wordElements = document.querySelectorAll<HTMLElement>('[data-reveal="words"]');
  const lineElements = document.querySelectorAll<HTMLElement>('[data-reveal="lines"]');

  function revealWords(el: HTMLElement, baseDelay = 0): void {
    const text = el.textContent ?? '';
    const words = text.split(/\s+/).filter(Boolean);
    el.innerHTML = '';

    words.forEach((word, i) => {
      const outer = document.createElement('span');
      outer.className = 'reveal-outer';

      const inner = document.createElement('span');
      inner.className = 'reveal-word';
      inner.textContent = word;
      inner.style.animationDelay = `${baseDelay + i * 55}ms`;

      outer.appendChild(inner);
      el.appendChild(outer);

      if (i < words.length - 1) {
        el.appendChild(document.createTextNode(' '));
      }
    });
  }

  function revealLines(el: HTMLElement, baseDelay = 0): void {
    const text = el.textContent ?? '';
    const lines = text.split('\n').filter(Boolean);
    el.innerHTML = '';

    lines.forEach((line, i) => {
      const outer = document.createElement('span');
      outer.className = 'reveal-outer';
      outer.style.display = 'block';

      const inner = document.createElement('span');
      inner.className = 'reveal-word';
      inner.style.display = 'block';
      inner.textContent = line;
      inner.style.animationDelay = `${baseDelay + i * 80}ms`;

      outer.appendChild(inner);
      el.appendChild(outer);
    });
  }

  wordElements.forEach((el) => revealWords(el));
  lineElements.forEach((el) => revealLines(el, 200));
}
