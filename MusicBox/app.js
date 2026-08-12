/* ╔══════════════════════════════════════════════╗
   ║  Octagonal Melody — Dual-Act Theater JS      ║
   ║  Engine: Xavier (XSS) + Ada (AAL)            ║
   ╚══════════════════════════════════════════════╝ */

(function () {
    'use strict';

    // --- DOM References ---
    const html = document.documentElement;
    const canvas = document.getElementById('product-canvas');
    const ctx = canvas.getContext('2d');
    const loader = document.getElementById('loader');
    const loaderProgress = document.getElementById('loader-progress');
    const loaderPercent = document.getElementById('loader-percent');
    const ambientGlow = document.getElementById('ambient-glow');
    const video = document.getElementById('ballerina-video');
    const videoStage = document.querySelector('.video-stage');

    // --- Configuration ---
    const FRAME_COUNT = 192;
    const FRAME_PATH = (i) => `./frames/frame_${String(i).padStart(4, '0')}.jpg`;

    // --- State ---
    const images = [];
    let loadedCount = 0;
    let isReady = false;
    let lastDrawnFrame = -1;

    // ═══════ PHASE 1: Preload Frames ═══════
    function preloadFrames() {
        for (let i = 0; i < FRAME_COUNT; i++) {
            const img = new Image();
            img.onload = onFrameLoaded;
            img.onerror = onFrameLoaded; // still count errors to avoid stuck loader
            img.src = FRAME_PATH(i);
            images[i] = img;
        }
    }

    function onFrameLoaded() {
        loadedCount++;
        const pct = Math.floor((loadedCount / FRAME_COUNT) * 100);
        loaderProgress.style.width = pct + '%';
        loaderPercent.textContent = pct + '%';

        if (loadedCount >= FRAME_COUNT) {
            isReady = true;
            // Set canvas size from first valid image
            if (images[0] && images[0].naturalWidth) {
                canvas.width = images[0].naturalWidth;
                canvas.height = images[0].naturalHeight;
            } else {
                canvas.width = 1920;
                canvas.height = 1080;
            }
            drawFrame(0);
            // Hide loader with delay
            setTimeout(() => loader.classList.add('hidden'), 400);
        }
    }

    // ═══════ PHASE 2: Scroll → Frame Mapping ═══════
    function drawFrame(index) {
        if (index === lastDrawnFrame) return;
        if (!images[index] || !images[index].complete) return;
        lastDrawnFrame = index;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(images[index], 0, 0, canvas.width, canvas.height);
    }

    function getAct1ScrollFraction() {
        const act1 = document.getElementById('act1');
        const rect = act1.getBoundingClientRect();
        const actHeight = act1.offsetHeight - window.innerHeight;
        const scrolled = -rect.top;
        return Math.max(0, Math.min(1, scrolled / actHeight));
    }

    function onScroll() {
        if (!isReady) return;

        // --- Act I: Canvas frame sync ---
        const fraction = getAct1ScrollFraction();
        const frameIndex = Math.min(FRAME_COUNT - 1, Math.floor(fraction * FRAME_COUNT));
        requestAnimationFrame(() => drawFrame(frameIndex));

        // --- Ambient glow color shift ---
        const transitionEl = document.getElementById('transition');
        if (transitionEl) {
            const tRect = transitionEl.getBoundingClientRect();
            if (tRect.top < window.innerHeight * 0.5) {
                ambientGlow.classList.add('warm');
            } else {
                ambientGlow.classList.remove('warm');
            }
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // ═══════ PHASE 3: Video Autoplay (Act II) ═══════
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                videoStage.classList.add('active');
                video.play().catch(() => {}); // silently handle autoplay block
            } else {
                videoStage.classList.remove('active');
                video.pause();
            }
        });
    }, { threshold: 0.3 });

    if (videoStage) videoObserver.observe(videoStage);

    // ═══════ PHASE 4: Glass Card Reveals ═══════
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.4 });

    document.querySelectorAll('.glass-card, .transition-text, .finale-content')
        .forEach(el => cardObserver.observe(el));

    // ═══════ INIT ═══════
    preloadFrames();

})();
