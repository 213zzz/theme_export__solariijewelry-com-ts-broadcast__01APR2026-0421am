/* CDFP Hero
   - Pause animation when offscreen (IntersectionObserver)
   - Respect prefers-reduced-motion
   - Image fallbacks (missing asset / broken url)
*/
(function () {
  'use strict';

  const roots = document.querySelectorAll('[data-cdfp-root]');
  if (!roots.length) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setIntensity(root) {
    const raw = Number(root.dataset.intensity || 2);
    let mult = 1;
    if (raw <= 1) mult = 0.75;      // low
    else if (raw >= 3) mult = 1.25; // high
    root.style.setProperty('--cdfp-intensity-mult', String(mult));
  }

  function wireImageFallbacks(root) {
    const imgs = root.querySelectorAll('img[data-cdfp-img]');
    imgs.forEach((img) => {
      const bgFallback = root.querySelector('[data-cdfp-placeholder]');
      const localFallback = img.parentElement && img.parentElement.querySelector('[data-cdfp-placeholder]');
      const placeholder = localFallback || bgFallback;

      const show = () => {
        if (!placeholder) return;
        placeholder.hidden = false;
        img.hidden = true;
      };

      img.addEventListener('error', show, { passive: true });
      img.addEventListener('load', () => {
        if (!img.naturalWidth) show();
      }, { passive: true });

      if (!img.getAttribute('src')) show();
    });
  }

  function initOne(root) {
    if (root.__cdfpInited) return;
    root.__cdfpInited = true;

    const enabled = String(root.dataset.enabled) === 'true';
    if (!enabled || prefersReduced) {
      root.classList.add('is-reduced');
    } else {
      setIntensity(root);
    }

    wireImageFallbacks(root);

    // Animation active/inactive
    if (!enabled || prefersReduced) {
      root.classList.remove('is-active');
      return;
    }

    if (!('IntersectionObserver' in window)) {
      root.classList.add('is-active');
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) root.classList.add('is-active');
        else root.classList.remove('is-active');
      });
    }, { threshold: 0.18 });

    io.observe(root);

    document.addEventListener('shopify:section:unload', (e) => {
      const id = e && e.detail && e.detail.sectionId;
      if (id && String(id) === String(root.dataset.sectionId)) io.disconnect();
    }, { passive: true });
  }

  roots.forEach(initOne);

  // Theme editor hot reload
  document.addEventListener('shopify:section:load', (e) => {
    const sectionId = e && e.detail && e.detail.sectionId;
    if (!sectionId) return;
    const wrapper = document.getElementById('shopify-section-' + sectionId);
    if (!wrapper) return;
    const root = wrapper.querySelector('[data-cdfp-root]');
    if (root) initOne(root);
  }, { passive: true });
})();
