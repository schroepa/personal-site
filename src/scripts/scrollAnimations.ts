export function initScrollAnimations(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // 1. Card fade-up via IntersectionObserver (fallback for ScrollTimeline)
  const fadeUpElements = document.querySelectorAll<HTMLElement>('[data-scroll="fade-up"]');

  if ('ScrollTimeline' in window) {
    fadeUpElements.forEach((el) => {
      const anim = el.animate(
        [
          { opacity: 0, transform: 'translateY(32px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        {
          fill: 'both',
          timeline: new (window as any).ScrollTimeline({
            source: el,
            axis: 'block',
          }),
          rangeStart: 'entry 0%',
          rangeEnd: 'entry 60%',
        } as any
      );
      void anim;
    });
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.animation =
              'fade-up 600ms cubic-bezier(0.16, 1, 0.3, 1) both';
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    fadeUpElements.forEach((el) => {
      el.style.opacity = '0';
      io.observe(el);
    });
  }

  // 2. Hero typographic depth parallax via scroll-driven CSS animations
  // Applied via CSS on the hero container (scroll-timeline defined in HTML/CSS)
  // The JS here sets up a scroll listener for browsers without scroll-timeline support
  const heroContainer = document.querySelector<HTMLElement>('[data-scroll="depth"]');
  if (!heroContainer) return;

  if (!CSS.supports('animation-timeline', 'scroll()')) {
    const heroHeadline = heroContainer.querySelector<HTMLElement>('.t-hero');
    const heroLead = heroContainer.querySelector<HTMLElement>('.t-lead');

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          if (heroHeadline) {
            heroHeadline.style.transform = `translateY(${-scrollY * 0.2}px)`;
          }
          if (heroLead) {
            heroLead.style.transform = `translateY(${-scrollY * 0.1}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  }
}
