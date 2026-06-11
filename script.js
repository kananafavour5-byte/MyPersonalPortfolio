/* ═══════════════════════════════════════════════════════════
   FAVOUR KIREMA — PORTFOLIO JAVASCRIPT
   -------------------------------------------------------
   Handles:
   1. Custom magnetic cursor
   2. Mobile navigation toggle
   3. Scroll-reveal animations (IntersectionObserver)
   4. Animated skill bars (triggered on scroll)
   5. Active nav link highlighting on scroll
   6. Contact form validation + feedback
═══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────
   1. CUSTOM CURSOR
   Two-part cursor: a small solid dot that tracks the mouse
   exactly, and a larger ring that follows with a slight lag
   for a fluid "magnetic" feel.
───────────────────────────────────────────────────────── */

const cursor    = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');

// Current mouse position
let mouseX = 0;
let mouseY = 0;

// Ring lags behind the real cursor position
let ringX = 0;
let ringY = 0;

// Update the dot instantly on every mouse move
document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';
});

// Animate the ring with lerp (linear interpolation) so it
// smoothly chases the cursor rather than snapping to it
function animateRing() {
  // Pull ring position 12% of the way toward the cursor each frame
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;

  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';

  requestAnimationFrame(animateRing);
}
animateRing();

// Scale up cursor when hovering interactive elements
const interactiveSelectors = 'a, button, .project-card, .service-card, .tag, .tech-tag';

document.querySelectorAll(interactiveSelectors).forEach((el) => {
  el.addEventListener('mouseenter', () => {
    cursor.style.transform   = 'translate(-50%, -50%) scale(2.5)';
    cursor.style.background  = 'var(--plum-light)';
    cursorRing.style.width   = '52px';
    cursorRing.style.height  = '52px';
    cursorRing.style.borderColor = 'rgba(155, 111, 212, 0.6)';
  });

  el.addEventListener('mouseleave', () => {
    cursor.style.transform   = 'translate(-50%, -50%) scale(1)';
    cursor.style.background  = 'var(--rose)';
    cursorRing.style.width   = '36px';
    cursorRing.style.height  = '36px';
    cursorRing.style.borderColor = 'rgba(196, 104, 138, 0.5)';
  });
});


/* ─────────────────────────────────────────────────────────
   2. MOBILE NAVIGATION TOGGLE
   Adds / removes .open class on the nav links list when the
   hamburger button is clicked. Also closes the menu when
   any nav link is tapped (smooth UX on mobile).
───────────────────────────────────────────────────────── */

const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// Close mobile menu when a link is clicked
document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
  });
});


/* ─────────────────────────────────────────────────────────
   3. SCROLL-REVEAL ANIMATIONS
   Uses IntersectionObserver to watch every element with
   class .reveal. When the element enters the viewport by
   at least 15%, .visible is added and CSS transitions
   fade it up into place.
───────────────────────────────────────────────────────── */

// Initialise all skill-fill bars to 0 width before any
// reveal so they animate in correctly when they scroll in
document.querySelectorAll('.skill-fill').forEach((bar) => {
  bar.style.width = '0%';
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      // Trigger the CSS fade-up transition
      entry.target.classList.add('visible');

      // If this element (or any child) contains a skill bar,
      // animate it to its target width with a staggered delay
      entry.target.querySelectorAll('.skill-fill').forEach((bar, index) => {
        const targetWidth = (parseFloat(bar.dataset.width) * 100) + '%';

        setTimeout(() => {
          bar.style.width = targetWidth;
        }, index * 150); // each bar starts 150 ms after the previous
      });

      // Once revealed, stop observing this element
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.15 } // trigger when 15% of element is visible
);

// Observe every element marked for reveal
document.querySelectorAll('.reveal').forEach((el) => {
  revealObserver.observe(el);
});


/* ─────────────────────────────────────────────────────────
   4. ACTIVE NAV LINK ON SCROLL
   Highlights the nav link corresponding to whichever section
   is currently in view. Checks section positions on every
   scroll event and updates the colour of matching link.
───────────────────────────────────────────────────────── */

const sectionIds  = ['home', 'about', 'projects', 'experience', 'services', 'contact'];
const navLinkEls  = document.querySelectorAll('.nav-links a');

function updateActiveNav() {
  let currentSection = '';

  sectionIds.forEach((id) => {
    const section = document.getElementById(id);
    if (!section) return;

    const rect = section.getBoundingClientRect();
    // Section is "active" when its top is above the middle of the viewport
    if (rect.top < window.innerHeight * 0.4) {
      currentSection = id;
    }
  });

  navLinkEls.forEach((link) => {
    const isActive = link.getAttribute('href') === '#' + currentSection;
    link.style.color = isActive ? 'var(--rose)' : '';
  });
}

window.addEventListener('scroll', updateActiveNav, { passive: true });
// Run once on load so the first section is already highlighted
updateActiveNav();


/* ─────────────────────────────────────────────────────────
   5. CONTACT FORM — VALIDATION & FEEDBACK
   Simple client-side validation. Shows an inline success
   or error message without a page reload.
   Note: to actually send emails you'd hook this up to a
   backend or a service like EmailJS / Formspree.
───────────────────────────────────────────────────────── */

const sendBtn  = document.getElementById('sendBtn');
const formNote = document.getElementById('formNote');

// Helper: read a form field's trimmed value
function fieldValue(id) {
  return document.getElementById(id).value.trim();
}

// Basic email format check
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Clear all form fields
function clearForm() {
  ['name', 'email', 'subject', 'message'].forEach((id) => {
    document.getElementById(id).value = '';
  });
}

sendBtn.addEventListener('click', () => {
  const name    = fieldValue('name');
  const email   = fieldValue('email');
  const subject = fieldValue('subject');
  const message = fieldValue('message');

  // Validation
  if (!name || !email || !subject || !message) {
    formNote.style.color = 'var(--rose)';
    formNote.textContent = '✗ Please fill in all fields before sending.';
    return;
  }

  if (!isValidEmail(email)) {
    formNote.style.color = 'var(--rose)';
    formNote.textContent = '✗ Please enter a valid email address.';
    return;
  }

  // Show sending state
  sendBtn.disabled = true;
  sendBtn.querySelector('span').textContent = 'Sending...';
  formNote.textContent = '';

  // Send via EmailJS
emailjs.send(
  'service_u26li78',
  'template_cnpz2ur',
{
  name: name,
  email: email,
  subject: subject,
  message: message,
}
  )
  .then(() => {
    // Success
    formNote.style.color = 'var(--cyan)';
    formNote.textContent = '✓ Message sent! I\'ll be in touch soon.';
    sendBtn.querySelector('span').textContent = 'Send Message ✦';
    sendBtn.disabled = false;
    clearForm();
    setTimeout(() => { formNote.textContent = ''; }, 6000);
  })
  .catch((error) => {
    // Error
    formNote.style.color = 'var(--rose)';
    formNote.textContent = '✗ Something went wrong. Please email me directly.';
    sendBtn.querySelector('span').textContent = 'Send Message ✦';
    sendBtn.disabled = false;
    console.error('EmailJS error:', error);
  });
});
 

/* ─────────────────────────────────────────────────────────
   6. SMOOTH SECTION TRANSITIONS (optional enhancement)
   Adds a tiny stagger delay to reveal children inside a
   .projects-grid or .services-grid when the grid itself
   becomes visible, making cards appear one by one.
───────────────────────────────────────────────────────── */

const gridObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const cards = entry.target.querySelectorAll(
        '.project-card, .service-card'
      );

      cards.forEach((card, i) => {
        setTimeout(() => {
          card.style.opacity   = '1';
          card.style.transform = 'translateY(0)';
        }, i * 80); // 80 ms stagger per card
      });

      gridObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.05 }
);

// Prepare grid cards to be staggered in
document.querySelectorAll('.projects-grid, .services-grid').forEach((grid) => {
  grid.querySelectorAll('.project-card, .service-card').forEach((card) => {
    card.style.opacity   = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  });
  gridObserver.observe(grid);
});


/* ─────────────────────────────────────────────────────────
   PROJECT PREVIEW MODAL
   Opens an iframe preview when "Live Preview" is clicked.
   Falls back gracefully if the site blocks iframes (X-Frame-Options).
───────────────────────────────────────────────────────── */

const modalOverlay = document.getElementById('modalOverlay');
const modalIframe  = document.getElementById('modalIframe');
const modalTitle   = document.getElementById('modalTitle');
const modalLabel   = document.getElementById('modalLabel');
const modalExternal = document.getElementById('modalExternal');
const modalLoading = document.getElementById('modalLoading');
const modalClose   = document.getElementById('modalClose');

// Open modal with the project's URL and title
function openModal(url, title) {
  modalTitle.textContent    = title;
  modalLabel.textContent    = 'Live Preview';
  modalExternal.href        = url;
  modalLoading.classList.remove('hidden');

  // Remove any old blocked message
  const old = modalIframe.parentNode.querySelector('.modal-blocked');
  if (old) old.remove();

  // Load the URL in the iframe
  modalIframe.src = url;

  // Show the modal
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden'; // prevent background scroll

  // Hide the loading dots once the iframe finishes loading
  modalIframe.onload = () => {
    modalLoading.classList.add('hidden');
  };

  // Some sites (GitHub, some Vercel apps) block iframes via X-Frame-Options.
  // We can't detect this directly in JS, so we show a fallback after a timeout
  // if the iframe appears to still be blank after 8 seconds.
  setTimeout(() => {
    try {
      // If iframe loaded same-origin content, contentDocument is accessible
      // For cross-origin blocked pages, we catch the error and show fallback
      const doc = modalIframe.contentDocument;
      if (!doc || doc.body.innerHTML === '') showBlockedMessage(url);
    } catch (e) {
      // Cross-origin but not necessarily blocked — this is normal, do nothing
    }
  }, 8000);
}

// Show a fallback message when the site blocks iframes
function showBlockedMessage(url) {
  modalLoading.classList.add('hidden');

  const blocked = document.createElement('div');
  blocked.className = 'modal-blocked visible';
  blocked.innerHTML = `
    <p style="font-size:2rem">🔒</p>
    <p>This site doesn't allow embedded previews.<br/>
    You can still view it directly.</p>
    <a href="${url}" target="_blank">Open project in new tab ↗</a>
  `;
  modalIframe.parentNode.appendChild(blocked);
}

// Close modal
function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
  // Small delay before clearing src so the close animation plays first
  setTimeout(() => { modalIframe.src = ''; }, 300);
}

// Close button
modalClose.addEventListener('click', closeModal);

// Click outside the modal box to close
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// Press Escape to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// Hook up all "Live Preview" buttons on project cards
document.querySelectorAll('.preview-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.project-card');
    const url = card.dataset.url;
    const title = card.dataset.title;

    if (!url || url === '#') {
      alert('No live URL added yet for this project.');
      return;
    }

    if (url.includes('faxel-interiors.vercel.app')) {
      window.open(url, '_blank');
      return;
    }

    openModal(url, title);
  });
});