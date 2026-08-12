/* ╔══════════════════════════════════════════════════════╗
   ║  Stellark Nexus Hub — App JS                        ║
   ║  Engine: Xavier (XSS) + Ada (AAL)                   ║
   ║  Brand: 星月 AI x 生活 工作室                         ║
   ╚══════════════════════════════════════════════════════╝ */

(function () {
    'use strict';

    // ── 1. Navigation: Scroll Effect & Active Link ──
    const nav = document.getElementById('nav');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section, .hero, .contact');

    function onScroll() {
        // Nav background on scroll
        nav.classList.toggle('scrolled', window.scrollY > 60);

        // Active link detection
        let current = '';
        sections.forEach(sec => {
            const top = sec.offsetTop - 120;
            if (window.scrollY >= top) current = sec.getAttribute('id');
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + current);
        });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ── 2. Mobile Menu Toggle ──
    const toggle = document.getElementById('nav-toggle');
    const navLinksContainer = document.getElementById('nav-links');
    const navCtaBtn = document.getElementById('nav-cta-btn');

    if (toggle) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('open');
            navLinksContainer.classList.toggle('open');
            if (navCtaBtn) navCtaBtn.classList.toggle('open');
        });
        // Close menu on link click
        navLinksContainer.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                toggle.classList.remove('open');
                navLinksContainer.classList.remove('open');
                if (navCtaBtn) navCtaBtn.classList.remove('open');
            });
        });
    }

    // ── 3. Starfield Particle System ──
    const particleContainer = document.getElementById('hero-particles');
    const STAR_COUNT = 80;

    for (let i = 0; i < STAR_COUNT; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 2.5 + 0.5;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDuration = (Math.random() * 4 + 2) + 's';
        star.style.animationDelay = -(Math.random() * 6) + 's';
        particleContainer.appendChild(star);
    }

    // ── 4. Typing Effect ──
    const typedEl = document.getElementById('typed-text');
    const phrases = [
        '🌙 讓 AI 智慧點亮您的未來',
        '📈 掌握 AI 數位行銷的無限可能',
        '🐍 用 Python 解鎖 AI 數據洞察',
        '🎬 AI 驅動的高品質影音藝術',
        '🚀 承載 AI 夢想與數位美學的星月方舟',
    ];
    let phraseIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let pauseTimer = 0;

    function typeLoop() {
        const current = phrases[phraseIdx];
        if (!deleting) {
            // Use Array.from to handle multi-byte characters (emoji, CJK)
            const chars = Array.from(current);
            typedEl.textContent = chars.slice(0, charIdx + 1).join('');
            charIdx++;
            if (charIdx >= chars.length) {
                deleting = true;
                pauseTimer = 60; // pause at full text
            }
        } else {
            if (pauseTimer > 0) { pauseTimer--; }
            else {
                const chars = Array.from(current);
                charIdx--;
                typedEl.textContent = chars.slice(0, charIdx).join('');
                if (charIdx <= 0) {
                    deleting = false;
                    phraseIdx = (phraseIdx + 1) % phrases.length;
                }
            }
        }
        const speed = deleting && pauseTimer <= 0 ? 30 : 55;
        setTimeout(typeLoop, speed);
    }
    typeLoop();

    // ── 5. Scroll Reveal (Intersection Observer) ──
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach(el => revealObserver.observe(el));

    // ── 6. Card Mouse Glow Effect ──
    const glowCards = document.querySelectorAll('.about-card, .portfolio-card, .academy-card');
    glowCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
            card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
        });
    });

    // ── 7. FPS Monitor ──
    const fpsValue = document.getElementById('fps');
    let lastTime = performance.now();
    let frames = 0;

    function calcFPS() {
        requestAnimationFrame(() => {
            const now = performance.now();
            frames++;
            if (now > lastTime + 1000) {
                const fps = Math.round((frames * 1000) / (now - lastTime));
                fpsValue.textContent = fps;
                fpsValue.style.color = fps < 30 ? '#f87171' : fps < 50 ? '#fbbf24' : '#4ade80';
                frames = 0;
                lastTime = now;
            }
            calcFPS();
        });
    }
    calcFPS();

})();
