/* ═══════════════════════════════════════════════════════
   Stellark Typography Gallery · fonts.js
   Xavier (XSS) + Arthur (AAA) · UTT v2.0
   ═══════════════════════════════════════════════════════ */

'use strict';

// ── Scroll Reveal ──────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.transitionDelay = `${i * 0.08}s`;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll(
  '.showcase-block, .pair-card, .scale-row, .font-specimen, .font-meta'
).forEach(el => {
  el.classList.add('reveal-up');
  revealObserver.observe(el);
});

// ── Parallax Glows ─────────────────────────────────────
const g1 = document.querySelector('.g1');
const g2 = document.querySelector('.g2');
document.addEventListener('mousemove', (e) => {
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;
  if (g1) g1.style.transform = `translate(${x * 40}px, ${y * 30}px) scale(1)`;
  if (g2) g2.style.transform = `translate(${-x * 30}px, ${-y * 20}px) scale(1)`;
});

// ── Active Section Highlight ───────────────────────────
const sections = document.querySelectorAll('.font-section');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.borderTopColor = 'var(--section-color, var(--accent))';
    }
  });
}, { threshold: 0.2 });
sections.forEach(s => sectionObserver.observe(s));

// ── Pair Card Magnetic Effect ──────────────────────────
document.querySelectorAll('.pair-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
    card.style.transform = `translateY(-8px) rotateX(${-y}deg) rotateY(${x}deg)`;
    card.style.transition = 'transform 0.1s ease';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform 0.4s cubic-bezier(0.16,1,0.3,1)';
  });
});

// ── Console Branding ───────────────────────────────────
console.log(
  '%cStellark Typography Gallery\n%cCrafted by UTT v2.0 · Xavier + Victor + Maya',
  'color:#ff6b35;font-family:serif;font-size:18px;font-weight:bold',
  'color:#7878a0;font-size:12px'
);
