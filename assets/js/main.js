/* Seven Sky · premshantidevelopers.in */
(() => {
  'use strict';

  /* ── Festive offer switch ──────────────────────────────────────────────
     The offer hides itself after Dussehra (20 Oct 2026, end of day IST).
     If all 21 bookings are taken earlier, set OFFER_CLOSED to true.       */
  const OFFER_CLOSED = false;
  const OFFER_END = new Date('2026-10-20T23:59:59+05:30');

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA = '917433886565';
  const offerLive = () => !OFFER_CLOSED && Date.now() < OFFER_END.getTime();

  function endOffer() {
    root.classList.add('offer-over');
    $$('[data-offer]').forEach(el => el.remove());
    setBarHeight();
  }

  /* ── WhatsApp deep links ── */
  const WA_TEXT = {
    general: "Namaste! I saw the Seven Sky website and I'm interested in a 2 BHK flat. Please share details.",
    offer: "Namaste! I'd like to know more about the Navratri–Dussehra offer (FLAT ₹1 lakh discount) at Seven Sky.",
    type1: 'Namaste! Please share the price of the Type I 2 BHK (Towers A, B & C) at Seven Sky.',
    type2: 'Namaste! Please share the price of the Type II 2 BHK (Towers D & E) at Seven Sky.',
    type3: 'Namaste! Please share the price of the Type III 2 BHK (Towers F & G) at Seven Sky.',
    brochure: 'Namaste! Please send me the Seven Sky brochure and floor plans.'
  };
  const waLink = text => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
  $$('[data-wa]').forEach(a => { a.href = waLink(WA_TEXT[a.dataset.wa] || WA_TEXT.general); });

  /* ── Header, offer bar, action bar ── */
  const header = $('.site-header');
  const bar = $('#offer-bar');
  function setBarHeight() {
    const b = $('#offer-bar');
    root.style.setProperty('--bar-h', (b ? b.offsetHeight : 0) + 'px');
  }
  try { if (sessionStorage.getItem('ss-bar-hidden') === '1' && bar) bar.remove(); } catch (e) {}
  $('.offer-bar__close')?.addEventListener('click', () => {
    $('#offer-bar')?.remove(); setBarHeight();
    try { sessionStorage.setItem('ss-bar-hidden', '1'); } catch (e) {}
  });
  window.addEventListener('resize', setBarHeight);

  const actionBar = $('#action-bar');
  const hero = $('.xh');
  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('is-solid', y > 40);
    if (actionBar && hero) actionBar.classList.toggle('is-visible', y > hero.offsetHeight * 0.6);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Mobile menu ── */
  const toggle = $('.nav__toggle');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('#mobile-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ── Countdown ── */
  const pad = n => String(n).padStart(2, '0');
  const fullBoxes = $$('[data-countdown="full"]').map(el => {
    el.innerHTML = ['Days', 'Hrs', 'Min', 'Sec'].map(l =>
      `<span class="countdown__unit"><span class="countdown__num">00</span><span class="countdown__lbl">${l}</span></span>`).join('');
    return $$('.countdown__num', el);
  });
  function tickCountdown() {
    if (!offerLive()) { endOffer(); clearInterval(cdTimer); return; }
    let s = Math.max(0, Math.floor((OFFER_END - Date.now()) / 1000));
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    const vals = [pad(d), pad(h), pad(m), pad(s)];
    fullBoxes.forEach(nums => nums.forEach((n, i) => {
      if (n.textContent !== vals[i]) {
        n.textContent = vals[i];
        if (!reduceMotion) { n.classList.remove('tick'); void n.offsetWidth; n.classList.add('tick'); }
      }
    }));
    $$('[data-countdown="short"]').forEach(el => { el.textContent = d > 0 ? `${d}d ${h}h left` : `${h}h ${m}m left`; });
  }
  let cdTimer;
  if (offerLive()) {
    const offerField = $('#f-offer');
    if (offerField) offerField.value = 'Navratri–Dussehra FLAT ₹1 lakh offer';
    tickCountdown(); cdTimer = setInterval(tickCountdown, 1000);
  } else {
    endOffer();
  }
  setBarHeight(); onScroll();

  /* ── Hero slideshow ── */
  const slides = $$('#hero-media img');
  const slideNav = $('#slide-nav');
  const caption = $('#slide-caption');
  const SLIDE_MS = 7000;
  let current = 0, slideTimer;
  slides.forEach((img, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `Show image ${i + 1}: ${img.dataset.caption}`);
    b.style.setProperty('--dur', SLIDE_MS + 'ms');
    b.innerHTML = '<i></i>';
    b.addEventListener('click', () => showSlide(i, true));
    slideNav.appendChild(b);
  });
  const navBtns = slideNav ? $$('button', slideNav) : [];
  function loadSlide(img) { if (img.dataset.srcset) { img.srcset = img.dataset.srcset; delete img.dataset.srcset; } }
  function showSlide(i, user) {
    const next = slides[i];
    loadSlide(next);
    slides[current].classList.remove('is-active');
    navBtns[current].classList.remove('is-active'); navBtns[current].setAttribute('aria-selected', 'false');
    current = i;
    // restart the Ken Burns animation on the incoming image
    next.style.animation = 'none'; void next.offsetWidth; next.style.animation = '';
    next.classList.add('is-active');
    const btn = navBtns[current];
    btn.classList.remove('is-active'); void btn.offsetWidth; btn.classList.add('is-active'); btn.setAttribute('aria-selected', 'true');
    caption.innerHTML = `<b>${next.dataset.caption}</b>`;
    if (user) schedule();
  }
  function schedule() {
    clearInterval(slideTimer);
    if (!reduceMotion) slideTimer = setInterval(() => showSlide((current + 1) % slides.length), SLIDE_MS);
  }
  if (slides.length) {
    navBtns[0].classList.add('is-active'); navBtns[0].setAttribute('aria-selected', 'true');
    window.addEventListener('load', () => { slides.slice(1).forEach(loadSlide); schedule(); });
    document.addEventListener('visibilitychange', () => document.hidden ? clearInterval(slideTimer) : schedule());
  }

  /* ── Reveal + count-up ── */
  function countUp(el) {
    const target = +el.dataset.count;
    if (reduceMotion || !target) return;
    const dur = 1400, t0 = performance.now();
    const step = t => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      $$('[data-count]', e.target).forEach(countUp);
      if (e.target.matches('[data-count]')) countUp(e.target);
      io.unobserve(e.target);
    }), { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    $$('[data-reveal], .plan__area [data-count]').forEach(el => io.observe(el));
  } else {
    $$('[data-reveal]').forEach(el => el.classList.add('is-in'));
  }

  /* ── Panorama: pans sideways as you scroll past ── */
  const pano = $('.pano'), track = $('#pano-track');
  if (pano && track && !reduceMotion) {
    let ticking = false;
    const pan = () => {
      ticking = false;
      const r = pano.getBoundingClientRect(), vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      const max = track.scrollWidth - pano.clientWidth;
      track.style.transform = `translate3d(${-max * p}px,0,0)`;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(pan); } }, { passive: true });
    window.addEventListener('resize', pan);
    $('img', track).addEventListener('load', pan);
    pan();
  } else if (pano) {
    pano.style.overflowX = 'auto'; track.style.position = 'relative';
  }

  /* ── Floor-plan tabs ── */
  const tabs = $$('.tab');
  function selectTab(tab, focus) {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !on;
      if (on) {
        panel.classList.remove('is-entering'); void panel.offsetWidth; panel.classList.add('is-entering');
        $$('[data-count]', panel).forEach(countUp);
      }
    });
    if (focus) tab.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); selectTab(tabs[(i + k + tabs.length) % tabs.length], true); }
    });
  });

  /* ── Gallery filter ── */
  const filters = $$('.filter');
  filters.forEach(f => f.addEventListener('click', () => {
    filters.forEach(x => x.setAttribute('aria-pressed', String(x === f)));
    const cat = f.dataset.filter;
    $$('.g-item').forEach(item => item.classList.toggle('is-hidden', cat !== 'all' && item.dataset.cat !== cat));
  }));

  /* ── Lightbox ── */
  const lb = $('#lightbox'), lbImg = $('#lb-img'), lbCap = $('#lb-cap'), lbCount = $('#lb-count');
  let group = [], idx = 0, lastFocus = null;
  function itemData(el) {
    const img = $('img', el);
    return {
      src: el.dataset.full || el.dataset.zoom || img.currentSrc || img.src,
      alt: img.alt,
      cap: el.dataset.caption || ($('figcaption', el)?.firstChild?.textContent || img.alt).trim(),
      note: el.dataset.note || ''
    };
  }
  function render(swap) {
    const it = group[idx];
    const apply = () => {
      lbImg.src = it.src; lbImg.alt = it.alt;
      lbCap.innerHTML = `${it.cap}${it.note ? `<small>${it.note}</small>` : ''}`;
      lbCount.textContent = group.length > 1 ? `${idx + 1} / ${group.length}` : '';
      lbImg.classList.remove('is-swapping');
    };
    if (swap && !reduceMotion) { lbImg.classList.add('is-swapping'); setTimeout(apply, 180); } else apply();
    const multi = group.length > 1;
    $('#lb-prev').hidden = !multi; $('#lb-next').hidden = !multi;
  }
  function openLb(items, i) {
    group = items; idx = i; lastFocus = document.activeElement;
    lb.hidden = false; render(false);
    requestAnimationFrame(() => lb.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    $('#lb-close').focus();
  }
  function closeLb() {
    lb.classList.remove('is-open'); document.body.style.overflow = '';
    setTimeout(() => { lb.hidden = true; }, 350);
    lastFocus?.focus();
  }
  const go = d => { idx = (idx + d + group.length) % group.length; render(true); };
  $('#lb-close').addEventListener('click', closeLb);
  $('#lb-prev').addEventListener('click', () => go(-1));
  $('#lb-next').addEventListener('click', () => go(1));
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lightbox__stage')) closeLb(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'Tab') { // keep focus inside the viewer
      const f = $$('button:not([hidden])', lb); const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  let touchX = null;
  lb.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX; touchX = null;
    if (Math.abs(dx) > 50 && group.length > 1) go(dx < 0 ? 1 : -1);
  });
  function makeZoomable(el, getGroup) {
    el.tabIndex = 0; el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `View larger: ${$('img', el).alt}`);
    const open = () => { const g = getGroup(); openLb(g.map(itemData), g.indexOf(el)); };
    el.addEventListener('click', open);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  }
  $$('.g-item').forEach(el => makeZoomable(el, () => $$('.g-item:not(.is-hidden)')));
  $$('[data-zoom]').forEach(el => makeZoomable(el, () => [el]));

  /* ── EMI calculator ── */
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const calc = $('#calc');
  if (calc) {
    const f = id => +$('#' + id).value;
    const fill = el => { el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min) * 100) + '%'); };
    const update = () => {
      const price = f('c-price') * 1e5, down = f('c-down') / 100, rate = f('c-rate') / 1200, n = f('c-years') * 12, rent = f('c-rent');
      const loan = price * (1 - down);
      const emi = rate ? loan * rate * Math.pow(1 + rate, n) / (Math.pow(1 + rate, n) - 1) : loan / n;
      $('#o-price').textContent = `₹${(+$('#c-price').value).toFixed(2).replace(/\.00$/, '')} L`;
      $('#o-down').textContent = `${f('c-down')}% · ${inr(price * down)}`;
      $('#o-rate').textContent = `${f('c-rate').toFixed(2)}%`;
      $('#o-years').textContent = `${f('c-years')} yrs`;
      $('#o-rent').textContent = inr(rent);
      $('#r-emi').textContent = inr(emi) + '/mo';
      $('#r-rent').textContent = inr(rent); $('#r-emi2').textContent = inr(emi);
      const max = Math.max(rent, emi);
      $('#b-rent').style.width = (rent / max * 100) + '%';
      $('#b-emi').style.width = (emi / max * 100) + '%';
      const diff = emi - rent;
      $('#r-verdict').innerHTML = diff > 0
        ? `For about <strong>${inr(diff)} more</strong> than your rent each month, you would be paying for a home of your own.`
        : `Your EMI could be <strong>${inr(-diff)} less</strong> than the rent you pay today, and the home would be yours.`;
      $$('input[type=range]', calc).forEach(fill);
    };
    calc.addEventListener('input', update);
    update();
  }

  /* ── Enquiry form (Formspree, with a WhatsApp fallback) ── */
  const form = $('#enquiry');
  if (form) {
    const date = $('#f-date');
    if (date) { const t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset()); date.min = t.toISOString().slice(0, 10); }
    $$('[data-offer-cta]').forEach(a => a.addEventListener('click', () => setTimeout(() => $('#f-name')?.focus({ preventScroll: true }), 700)));

    const summary = () => {
      const d = new FormData(form);
      return `Namaste! I'd like to book a site visit at Seven Sky.\nName: ${d.get('name')}\nPhone: ${d.get('phone')}` +
        (d.get('visit_date') ? `\nDate: ${d.get('visit_date')} (${d.get('visit_time')})` : '') +
        `\nLooking for: ${d.get('interest')}\nBudget: ${d.get('budget')}` + (d.get('message') ? `\nQuestion: ${d.get('message')}` : '');
    };
    const setErr = (input, msg) => {
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      input.parentElement.querySelector('.field__err').textContent = msg || '';
    };
    const validate = () => {
      const name = $('#f-name'), phone = $('#f-phone');
      const digits = phone.value.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
      const okName = name.value.trim().length >= 2;
      const okPhone = /^[6-9]\d{9}$/.test(digits);
      setErr(name, okName ? '' : 'Please enter your name.');
      setErr(phone, okPhone ? '' : 'Please enter a 10-digit mobile number.');
      if (!okName) name.focus(); else if (!okPhone) phone.focus();
      return okName && okPhone;
    };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const status = $('#form-status');
      status.textContent = ''; status.classList.remove('is-error');
      if (!validate()) return;
      form.classList.add('is-sending');
      const btnText = $('button[type=submit] span', form); const old = btnText.textContent;
      btnText.textContent = 'Sending…';
      try {
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(res.status);
        $('#success-wa').href = waLink(summary());
        form.hidden = true;
        const ok = $('#form-success'); ok.hidden = false; ok.focus();
      } catch (err) {
        status.classList.add('is-error');
        status.innerHTML = `Sorry, that didn't go through. Please <a href="${waLink(summary())}" target="_blank" rel="noopener" style="text-decoration:underline;font-weight:600">send it on WhatsApp</a> or call 74338 86565.`;
      } finally {
        form.classList.remove('is-sending'); btnText.textContent = old;
      }
    });
    $$('#f-name, #f-phone').forEach(i => i.addEventListener('input', () => { if (i.getAttribute('aria-invalid') === 'true') setErr(i, ''); }));
  }

  /* ── Nav: highlight the section in view ── */
  const links = $$('.nav__links a');
  if ('IntersectionObserver' in window && links.length) {
    const spy = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });
  }

  $('#year').textContent = new Date().getFullYear();
})();
