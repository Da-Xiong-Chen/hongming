/* =========================================================
   弘名鋼模 — NEO edition interactions
   ========================================================= */
(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- Preloader ---------- */
  (() => {
    const loader = $('#loader'), fill = $('#loaderFill'), pct = $('#loaderPct');
    if (!loader) return;
    let v = 0, done = false;
    const finish = () => {
      if (done) return;
      done = true;
      v = 100;
      if (fill) fill.style.width = '100%';
      if (pct) pct.textContent = '100';
      setTimeout(() => {
        loader.classList.add('done');
        document.body.classList.remove('is-loading');
        startHeadline();
      }, reduced ? 0 : 380);
    };
    const tick = () => {
      if (done) return;
      v = Math.min(96, v + Math.random() * 9 + 2);
      if (fill) fill.style.width = v + '%';
      if (pct) pct.textContent = String(Math.round(v));
      if (v < 96) setTimeout(tick, 90 + Math.random() * 130);
    };
    reduced ? finish() : tick();
    window.addEventListener('load', () => setTimeout(finish, reduced ? 0 : 500));
    setTimeout(finish, 4200); // safety net
  })();

  /* ---------- Headline: split into characters ---------- */
  let headlineReady = false;
  $$('[data-split]').forEach((el, li) => {
    const chars = Array.from(el.textContent.trim());
    el.textContent = '';
    chars.forEach((c, i) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c;
      s.style.setProperty('--cd', (li * 0.16 + i * 0.045 + 0.1).toFixed(3) + 's');
      s.style.animationPlayState = 'paused';
      el.appendChild(s);
    });
  });
  function startHeadline() {
    if (headlineReady) return;
    headlineReady = true;
    $$('.hero-title .ch').forEach(s => { s.style.animationPlayState = 'running'; });
  }

  /* ---------- Theme toggle ---------- */
  (() => {
    const btn = $('#themeBtn'), root = document.documentElement;
    const sun  = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v2.2M12 20.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M1.5 12h2.2M20.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/></svg>';
    const moon = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>';
    let mode = 'dark';
    try { mode = localStorage.getItem('hm-theme') || 'dark'; } catch (e) {}
    const apply = () => {
      root.setAttribute('data-theme', mode);
      if (btn) {
        btn.innerHTML = mode === 'dark' ? sun : moon;
        btn.setAttribute('aria-label', '切換至' + (mode === 'dark' ? '淺色' : '深色') + '模式');
      }
    };
    apply();
    btn && btn.addEventListener('click', () => {
      mode = mode === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('hm-theme', mode); } catch (e) {}
      apply();
    });
  })();

  /* ---------- Mobile menu ---------- */
  (() => {
    const btn = $('#menuBtn'), nav = $('#mobileNav');
    if (!btn || !nav) return;
    const close = () => { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); document.body.classList.remove('nav-open'); };
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('nav-open', open);
    });
    $$('a', nav).forEach(a => a.addEventListener('click', close));
    addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  })();

  /* ---------- Scroll progress + sticky header + back to top ---------- */
  (() => {
    const bar = $('#progressBar'), header = $('#header'), top = $('#toTop');
    let ticking = false;
    const update = () => {
      const y = scrollY;
      const h = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      header && header.classList.toggle('stuck', y > 12);
      top && top.classList.toggle('show', y > innerHeight * 0.7);
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  })();

  /* ---------- Scroll reveal ---------- */
  (() => {
    const els = $$('[data-anim]');
    if (!els.length) return;
    if (reduced || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px' });
    els.forEach(e => io.observe(e));
  })();

  /* ---------- Number counters ---------- */
  (() => {
    const nums = $$('[data-count]');
    if (!nums.length) return;
    const run = (el) => {
      const target = parseFloat(el.dataset.count) || 0;
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      if (reduced) { el.textContent = prefix + target + suffix; return; }
      const dur = 1500, t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    nums.forEach(n => io.observe(n));
  })();

  /* ---------- Nav scroll-spy with sliding pill ---------- */
  (() => {
    const nav = $('#nav'), pill = $('#navPill');
    const links = $$('.nav-link[data-spy]');
    if (!nav || !pill || !links.length) return;

    const move = (link) => {
      if (!link) { pill.style.opacity = '0'; return; }
      pill.style.opacity = '1';
      pill.style.width = link.offsetWidth + 'px';
      pill.style.transform = 'translateX(' + link.offsetLeft + 'px)';
    };

    const sections = links.map(l => $('#' + l.dataset.spy)).filter(Boolean);
    const spy = () => {
      const mid = scrollY + innerHeight * 0.35;
      let current = null;
      sections.forEach((s, i) => { if (s.offsetTop <= mid) current = links[i]; });
      links.forEach(l => l.classList.toggle('active', l === current));
      move(current);
    };
    addEventListener('scroll', spy, { passive: true });
    addEventListener('resize', spy);
    links.forEach(l => l.addEventListener('mouseenter', () => move(l)));
    nav.addEventListener('mouseleave', spy);
    spy();
  })();

  /* ---------- Spotlight follows cursor ---------- */
  (() => {
    const sl = $('#spotlight');
    if (!sl || reduced || matchMedia('(hover: none)').matches) return;
    let x = innerWidth / 2, y = innerHeight * 0.25, cx = x, cy = y, raf = 0;
    addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    function loop() {
      cx += (x - cx) * 0.12; cy += (y - cy) * 0.12;
      sl.style.setProperty('--mx', cx + 'px');
      sl.style.setProperty('--my', cy + 'px');
      raf = (Math.abs(x - cx) > 0.5 || Math.abs(y - cy) > 0.5) ? requestAnimationFrame(loop) : 0;
    }
  })();

  /* ---------- 3D tilt + card sheen ---------- */
  (() => {
    if (reduced || matchMedia('(hover: none)').matches) return;
    $$('[data-tilt]').forEach(el => {
      const max = 7;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * max).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * max).toFixed(2) + 'deg) translateY(-4px)';
        el.style.setProperty('--px', (px * 100) + '%');
        el.style.setProperty('--py', (py * 100) + '%');
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  })();

  /* ---------- Magnetic buttons ---------- */
  (() => {
    if (reduced || matchMedia('(hover: none)').matches) return;
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.28;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.35;
        el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  })();

  /* ---------- Hero particle mesh ---------- */
  (() => {
    const cv = $('#heroCanvas');
    if (!cv || reduced) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1, pts = [], raf = 0, visible = true;
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      const r = cv.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return; // layout not settled yet
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(110, Math.max(34, (w * h) / 15000)));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 0.6
      }));
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      const light = document.documentElement.getAttribute('data-theme') === 'light';
      const rgb = light ? '28,114,173' : '120,196,245';
      ctx.clearRect(0, 0, w, h);

      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;

        const dxm = p.x - mouse.x, dym = p.y - mouse.y;
        const dm = Math.hypot(dxm, dym);
        if (dm < 130 && dm > 0.1) { p.x += (dxm / dm) * 0.7; p.y += (dym / dm) * 0.7; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgb + ',' + (light ? 0.5 : 0.65) + ')';
        ctx.fill();
      }

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 15000) {
            const a = (1 - d2 / 15000) * (light ? 0.16 : 0.22);
            ctx.strokeStyle = 'rgba(' + rgb + ',' + a.toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
    };

    cv.parentElement.addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    cv.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 160); });
    if ('ResizeObserver' in window) new ResizeObserver(() => resize()).observe(cv);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(cv);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf) draw();
    });

    resize();
    draw();
  })();

})();
