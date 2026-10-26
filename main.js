/* Noyau commun du motion : scroll fluide, titres masqués, apparitions, compteurs.
   Tout ce qui est propre au site est dans la partie "SITE" plus bas. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* menu mobile : un bouton + un panneau plein écran avec tous les liens (sans dépendre de GSAP) */
  (() => {
    const bar = $('[data-top]'), navs = $$('[data-nav]');
    if (!bar || !navs.length || bar.classList.contains('side')) return;
    const links = navs.flatMap(n => $$('a[href^="#"]', n));
    const btn = document.createElement('button');
    btn.className = 'mm-btn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Ouvrir le menu'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'mm');
    btn.innerHTML = '<span></span><span></span>';
    const panel = document.createElement('div');
    panel.className = 'mm'; panel.id = 'mm'; panel.setAttribute('data-lenis-prevent', ''); panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = '<ul>' + links.map((a, i) => '<li style="--i:' + i + '"><a href="' + a.getAttribute('href') + '"><i>' + String(i + 1).padStart(2, '0') + '</i>' + a.textContent.replace(/[→↗]/g, '').trim() + '</a></li>').join('') + '</ul>';
    bar.classList.add('has-mm'); bar.appendChild(btn); document.body.appendChild(panel);
    const set = open => {
      root.classList.toggle('mm-open', open);
      btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      panel.setAttribute('aria-hidden', !open);
      if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
    };
    btn.addEventListener('click', () => set(!root.classList.contains('mm-open')));
    panel.addEventListener('click', e => { if (e.target.closest('a')) set(false); }, true);
    addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    matchMedia('(min-width:901px)').addEventListener('change', e => { if (e.matches) set(false); });
  })();

  /* accordéon : fonctionne même sans animation */
  $$('.acc__h').forEach(b => b.addEventListener('click', () => {
    const a = b.closest('.acc'), open = !a.classList.contains('is-open');
    a.classList.toggle('is-open', open);
    b.setAttribute('aria-expanded', open);
    if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 600);
  }));

  if (!window.gsap || !window.ScrollTrigger || !window.SplitText || reduce) {
    root.classList.remove('js'); window.__ready = true; return;
  }
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const desktop = matchMedia('(min-width:901px)').matches;
    const hover = matchMedia('(hover:hover)').matches;

    const lenis = new Lenis({ lerp: 0.09 });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const t = $(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t, { duration: 1.3, offset: 0 });
    }));

    /* barre du haut, progression, lien actif */
    const top = $('[data-top]'), prog = $('[data-progress]');
    const links = $$('[data-nav] a[href^="#"]');
    const secs = links.map(a => $(a.getAttribute('href')));
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: self => {
        if (top) top.classList.toggle('is-solid', self.scroll() > 24);
        if (prog) gsap.set(prog, { scaleX: self.progress });
        const line = innerHeight * 0.4;
        secs.forEach((s, i) => {
          if (!s) return;
          const r = s.getBoundingClientRect();
          links[i].classList.toggle('is-active', r.top <= line && r.bottom >= line);
        });
      }
    });

    /* titres : lignes masquées */
    $$('[data-split]').forEach(el => {
      const d = parseFloat(el.dataset.delay || 0);
      SplitText.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit(self) {
          gsap.set(el, { visibility: 'visible' });
          return gsap.from(self.lines, { yPercent: 118, duration: 1.2, ease: 'power4.out', stagger: 0.1, delay: d,
            scrollTrigger: { trigger: el, start: 'top 90%' } });
        }
      });
    });

    /* apparitions par lots */
    const items = $$('[data-r]');
    gsap.set(items, { autoAlpha: 0, y: 30 });
    ScrollTrigger.batch(items, {
      start: 'top 92%', once: true,
      onEnter: els => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.95, ease: 'power3.out', stagger: 0.09, overwrite: true })
    });

    /* compteurs */
    $$('[data-count]').forEach(el => {
      const end = parseInt(el.dataset.count, 10), o = { v: 0 };
      el.textContent = '0';
      ScrollTrigger.create({ trigger: el, start: 'top 94%', once: true,
        onEnter: () => gsap.to(o, { v: end, duration: 1.8, delay: 0.3, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); } }) });
    });

    /* boutons magnétiques */
    if (hover) $$('.btn').forEach(btn => {
      const x = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
      const y = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
      btn.addEventListener('mousemove', e => { const r = btn.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.22); y((e.clientY - r.top - r.height / 2) * 0.3); });
      btn.addEventListener('mouseleave', () => { x(0); y(0); });
    });

    /* ===== SITE ===== */
    /* MineSafe : défilement horizontal épinglé (ordinateur) */
    const track = $('.hs__track');
    if (desktop && track) {
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      gsap.to(track, { x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '#minesafe', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 10 } });
      gsap.to('.hs__bar i', { scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: '#minesafe', start: 'top top', end: () => '+=' + dist(), scrub: true, invalidateOnRefresh: true, refreshPriority: 10 } });
    }
    /* MineSafe sur téléphone : les visuels s'empilent et se dévoilent un à un */
    if (!desktop) $$('.hs__f').forEach(f => {
      gsap.from(f, { y: 70, autoAlpha: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: f, start: 'top 90%', once: true } });
      gsap.from($('img', f), { scale: 1.14, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: f, start: 'top 90%', once: true } });
    });
    /* accueil : portrait en fondu doux et parallaxe */
    gsap.from('.hero__img img', { scale: 1.18, autoAlpha: 0, duration: 2, ease: 'power3.out' });
    gsap.to('.hero__img img', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    /* années en contour : elles se remplissent à l'arrivée */
    $$('.aw__y').forEach(y => gsap.to(y, { color: '#e6c07b', duration: 0.9, ease: 'power2.out', scrollTrigger: { trigger: y, start: 'top 75%' } }));

    /* ===== le prix : images dévoilées par masque, déclenchées à l'entrée à l'écran ===== */
    const vis = document.querySelector('.prize__vis');
    const reveal = () => $$('.rv').forEach(el => el.classList.add('is-in'));
    if (vis && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { reveal(); io.disconnect(); } }, { threshold: 0.05 });
      io.observe(vis);
      setTimeout(reveal, 6000);
    } else reveal();
    {
      gsap.fromTo('.prize__card img', { yPercent: -5, scale: 1.08 }, { yPercent: 5, scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.prize__card', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo('.prize__troph img', { yPercent: 6 }, { yPercent: -6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: '.prize__troph', start: 'top bottom', end: 'bottom top', scrub: true } });
    }
    /* ===== FIN SITE ===== */
  });

  const refresh = () => ScrollTrigger.refresh();
  addEventListener('load', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.__ready = true;
})();
