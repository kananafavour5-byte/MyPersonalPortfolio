/* Small static-site controller: addressable views, native dialogs and progressive interactions. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // A keyboard-accessible project gallery; all projects remain readable without JS.
  const projectTabs = $$('[data-project]');
  const projectPanels = $$('.project-panel');
  function selectProject(id, focus = false) {
    projectTabs.forEach(tab => {
      const selected = tab.dataset.project === id;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    });
    projectPanels.forEach(panel => {
      panel.hidden = panel.id !== id;
      panel.classList.toggle('panel-enter', panel.id === id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', 'project-tab-' + panel.id);
      panel.tabIndex = 0;
    });
  }
  projectTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectProject(tab.dataset.project));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % projectTabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + projectTabs.length) % projectTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = projectTabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectProject(projectTabs[next].dataset.project, true);
    });
  });
  if (projectTabs.length) selectProject(projectTabs[0].dataset.project);

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const views = $$('section[data-view]');
  const viewNames = views.map(view => view.dataset.view);
  const aliases = { experience: 'journal', services: 'skills' };
  const menu = $('#exploreMenu');
  const trigger = $('#exploreTrigger');
  const imageViewer = $('#imageViewer');
  let activeView = 'home';
  let closeTimer;
  let paused = false;

  function lockDialogs() {
    document.body.classList.toggle('modal-open', !!$('dialog[open]'));
  }
  function closeMenu(immediate = false) {
    clearTimeout(closeTimer);
    trigger.setAttribute('aria-expanded', 'false');
    if (!menu.open) return;
    const finish = () => {
      menu.close();
      menu.classList.remove('closing');
      lockDialogs();
    };
    if (immediate || reducedMotion.matches) finish();
    else {
      menu.classList.add('closing');
      closeTimer = setTimeout(finish, 180);
    }
  }
  trigger.addEventListener('click', () => {
    if (menu.open) return closeMenu();
    clearTimeout(closeTimer);
    menu.classList.remove('closing');
    menu.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    lockDialogs();
  });
  $('#closeMenu').addEventListener('click', () => closeMenu());
  menu.addEventListener('cancel', event => { event.preventDefault(); closeMenu(); });
  menu.addEventListener('close', () => { trigger.setAttribute('aria-expanded', 'false'); lockDialogs(); });

  // Native dialog supplies Escape, focus containment and return-to-opener behavior.
  [menu, imageViewer].forEach(dialog => {
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
        if (dialog === menu) closeMenu();
        else dialog.close();
      }
    });
  });

  function route(focus = true) {
    const raw = location.hash.slice(1).split('/')[0];
    const requested = aliases[raw] || raw || 'home';
    const next = viewNames.includes(requested) ? requested : 'home';
    closeMenu(true);
    if (imageViewer.open) imageViewer.close();
    activeView = next;
    document.body.dataset.view = next;
    views.forEach(view => {
      const visible = view.dataset.view === next;
      view.hidden = !visible;
      view.classList.toggle('view-enter', visible && next !== 'home');
    });
    $$('nav a[href^="#"]').forEach(link => {
      if (link.getAttribute('href') === '#' + next) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.title = next === 'home' ? 'Favour Kirema — Software Developer' : `${next[0].toUpperCase() + next.slice(1)} — Favour Kirema`;
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (focus) $(`#${next}-title`).focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', () => route());
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const hash = link.getAttribute('href');
    if (hash === '#main-content') {
      event.preventDefault();
      $(`#${activeView}-title`).focus({ preventScroll: true });
    } else if (hash === location.hash || (hash === '#home' && !location.hash)) {
      event.preventDefault();
      route();
    }
  }));
  route(false);

  // Manual gallery: owner-supplied MamaCare product screenshots.
  const slides = [
    { name: 'home', alt: 'MamaCare Kenya homepage — maternal and newborn support' },
    { name: 'journey', alt: 'MamaCare Kenya Journey — stage-based baby-care guidance' },
    { name: 'learn', alt: 'MamaCare Kenya Learn — practical newborn and postpartum education' }
  ].map(slide => ({
    src: `images/mamacare-${slide.name}.webp`,
    original: `images/mamacare-${slide.name}.png`,
    alt: slide.alt
  }));
  const galleryButton = $('.gallery-image-button');
  let currentSlide = 0;
  function showSlide(index) {
    currentSlide = (index + slides.length) % slides.length;
    const slide = slides[currentSlide];
    $('#mamacareImage').src = slide.src;
    $('#mamacareImage').alt = slide.alt;
    galleryButton.dataset.image = slide.original;
    galleryButton.dataset.caption = slide.alt;
    $('#slideStatus').textContent = `0${currentSlide + 1} / 03`;
    $$('[data-slide]').forEach((button, i) => button.setAttribute('aria-pressed', String(i === currentSlide)));
  }
  $$('[data-slide]').forEach(button => button.addEventListener('click', () => showSlide(Number(button.dataset.slide))));
  $('.project-gallery').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    showSlide(currentSlide + (event.key === 'ArrowRight' ? 1 : -1));
    $(`[data-slide="${currentSlide}"]`).focus();
  });
  let touchStart;
  galleryButton.addEventListener('touchstart', event => {
    touchStart = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
  }, { passive: true });
  let swipedAt = 0;
  galleryButton.addEventListener('touchend', event => {
    if (!touchStart) return;
    const x = event.changedTouches[0].clientX - touchStart.x;
    const y = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(x) > 50 && Math.abs(x) > Math.abs(y)) {
      showSlide(currentSlide + (x < 0 ? 1 : -1));
      swipedAt = Date.now();
    }
    touchStart = null;
  }, { passive: true });
  $$('[data-image]').forEach(button => button.addEventListener('click', () => {
    if (button === galleryButton && Date.now() - swipedAt < 400) return;
    $('#viewerTitle').textContent = button.dataset.caption;
    $('#viewerImage').src = button.dataset.image;
    $('#viewerImage').alt = button.dataset.caption;
    imageViewer.showModal();
    lockDialogs();
  }));
  $('#closeViewer').addEventListener('click', () => imageViewer.close());
  imageViewer.addEventListener('close', lockDialogs);

  // Atmospheric motion is optional, never required to operate the site.
  const motionButton = $('#motionToggle');
  try { paused = localStorage.getItem('favour-motion-paused') === 'true'; } catch (_) { /* Storage may be unavailable. */ }
  function updateMotion() {
    document.body.classList.toggle('motion-paused', paused || reducedMotion.matches);
    motionButton.setAttribute('aria-pressed', String(paused));
    $('span', motionButton).textContent = paused ? 'Play motion' : 'Pause motion';
    $('img', motionButton).src = paused ? 'icons/play.svg' : 'icons/pause.svg';
  }
  motionButton.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('favour-motion-paused', String(paused)); } catch (_) { /* No persistence needed. */ }
    updateMotion();
  });
  reducedMotion.addEventListener('change', updateMotion);
  updateMotion();
  const world = $('.world');
  let pointerFrame = 0;
  $('#home').addEventListener('pointermove', event => {
    if (reducedMotion.matches || paused || !finePointer.matches || activeView !== 'home') return;
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      world.style.setProperty('--scene-x', `${(event.clientX / innerWidth - .5) * -7}px`);
      world.style.setProperty('--scene-y', `${(event.clientY / innerHeight - .5) * -5}px`);
      pointerFrame = 0;
    });
  });
  $('#home').addEventListener('pointerleave', () => {
    world.style.setProperty('--scene-x', '0px');
    world.style.setProperty('--scene-y', '0px');
  });
  $$('.magnetic').forEach(button => {
    button.addEventListener('pointermove', event => {
      if (paused || reducedMotion.matches || !finePointer.matches) return;
      const rect = button.getBoundingClientRect();
      const x = Math.max(-3, Math.min(3, (event.clientX - rect.left - rect.width / 2) * .05));
      const y = Math.max(-3, Math.min(3, (event.clientY - rect.top - rect.height / 2) * .08));
      button.style.transform = `translate(${x}px, ${y - 1}px)`;
    });
    button.addEventListener('pointerleave', () => button.style.removeProperty('transform'));
    button.addEventListener('blur', () => button.style.removeProperty('transform'));
  });

  // Keep the original EmailJS destination, but load it only for a valid submission.
  let emailClientPromise;
  function loadEmailClient() {
    if (window.emailjs) return Promise.resolve(window.emailjs);
    if (emailClientPromise) return emailClientPromise;
    emailClientPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
      script.async = true;
      const timer = setTimeout(() => reject(new Error('The email service did not load.')), 10000);
      script.onload = () => { clearTimeout(timer); window.emailjs ? resolve(window.emailjs) : reject(new Error('Email service unavailable.')); };
      script.onerror = () => { clearTimeout(timer); reject(new Error('Email service unavailable.')); };
      document.head.appendChild(script);
    }).catch(error => { emailClientPromise = null; throw error; });
    return emailClientPromise;
  }
  const form = $('#contactForm');
  const fields = ['name', 'email', 'subject', 'message'].map(id => $('#' + id));
  const note = $('#formNote');
  fields.forEach(field => field.addEventListener('input', () => {
    field.removeAttribute('aria-invalid');
    $('#' + field.id + 'Error').textContent = '';
  }));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const invalid = [];
    fields.forEach(field => {
      let error = '';
      if (!field.value.trim()) error = 'Please fill in this field.';
      else if (field.type === 'email' && !field.validity.valid) error = 'Please enter a valid email address.';
      $('#' + field.id + 'Error').textContent = error;
      if (error) { field.setAttribute('aria-invalid', 'true'); invalid.push(field); }
      else field.removeAttribute('aria-invalid');
    });
    if (invalid.length) {
      note.textContent = 'Please check the highlighted fields before sending.';
      invalid[0].focus();
      return;
    }
    const sendButton = $('#sendBtn');
    if (sendButton.disabled) return;
    sendButton.disabled = true;
    $('span', sendButton).textContent = 'Sending…';
    note.textContent = '';
    form.setAttribute('aria-busy', 'true');
    try {
      const client = await loadEmailClient();
      client.init({ publicKey: 'Iyaj4VIJbr0oBPmEO' });
      const values = Object.fromEntries(fields.map(field => [field.id, field.value.trim()]));
      let timeout;
      try {
        await Promise.race([
          client.send('service_u26li78', 'template_cnpz2ur', values),
          new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Delivery could not be confirmed.')), 20000); })
        ]);
      } finally { clearTimeout(timeout); }
      note.textContent = "Message sent! I'll be in touch soon.";
      form.reset();
    } catch (_) {
      note.textContent = 'Delivery could not be confirmed. Your message is still here; please email kananafavour5@gmail.com directly.';
    } finally {
      sendButton.disabled = false;
      $('span', sendButton).textContent = 'Send Message';
      form.removeAttribute('aria-busy');
    }
  });
})();
