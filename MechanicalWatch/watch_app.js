/* ╔══════════════════════════════════════════════╗
   ║  Mechanical Chronos — Nano Banana JS         ║
   ║  Engine: Xavier (XSS) + Ada (AAL)            ║
   ╚══════════════════════════════════════════════╝ */

(function() {
    'use strict';

    const canvas = document.getElementById('watch-canvas');
    const ctx = canvas.getContext('2d');
    const loader = document.getElementById('loader');
    const poster = document.getElementById('hero-poster');
    const video = document.getElementById('watch-video');
    const videoStage = document.getElementById('video-stage');

    // ═══════ PHASE 0: Configuration ═══════
    const FRAME_COUNT = 192; 
    const FRAME_PATH = (i) => `./frames/frame_${String(i).padStart(4, '0')}.jpg`;
    const images = [];
    let loadedCount = 0;
    let isReady = false;
    let lastDrawnFrame = -1;

    // ═══════ PHASE 1: Preload Frames ═══════
    function preloadFrames() {
        for (let i = 0; i < FRAME_COUNT; i++) {
            const img = new Image();
            img.onload = onFrameLoaded;
            img.onerror = onFrameLoaded;
            img.src = FRAME_PATH(i);
            images[i] = img;
        }
    }

    function onFrameLoaded() {
        loadedCount++;
        if (loadedCount >= FRAME_COUNT) {
            isReady = true;
            if (images[0] && images[0].naturalWidth) {
                canvas.width = images[0].naturalWidth;
                canvas.height = images[0].naturalHeight;
            }
            drawFrame(0);
            if (poster) poster.style.display = 'none'; // Hide poster once canvas ready
        }
    }

    function drawFrame(index) {
        if (!isReady || index === lastDrawnFrame) return;
        if (!images[index] || !images[index].complete) return;
        lastDrawnFrame = index;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(images[index], 0, 0, canvas.width, canvas.height);
    }

    // 1. Loader Logic
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 1000);
    });

    // 2. Scroll Logic for Labels
    const labels = document.querySelectorAll('.nano-label');
    
    function handleScroll() {
        const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        
        labels.forEach(label => {
            const trigger = parseFloat(label.dataset.scroll);
            if (scrollPercent > trigger && scrollPercent < trigger + 0.2) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        });

        // Sync Frame Animation
        if (isReady) {
            const frameIndex = Math.min(FRAME_COUNT - 1, Math.floor(scrollPercent * FRAME_COUNT));
            requestAnimationFrame(() => drawFrame(frameIndex));
        }

        // Dynamic Parallax for Poster
        if (poster) {
            poster.style.transform = `scale(${1 + scrollPercent * 0.2}) translateY(${scrollPercent * 100}px)`;
        }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    // 3. Act II Video Observer
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                video.play().catch(() => {});
                document.getElementById('ambient-glow').style.background = 
                    'radial-gradient(circle, rgba(255, 225, 53, 0.1) 0%, transparent 70%)';
            } else {
                video.pause();
                document.getElementById('ambient-glow').style.background = 
                    'radial-gradient(circle, rgba(255, 225, 53, 0.03) 0%, transparent 70%)';
            }
        });
    }, { threshold: 0.2 });

    if (videoStage) videoObserver.observe(videoStage);

    // 4. Fake Dashboard Logic (Blinking/Pulse)
    const stats = document.querySelectorAll('.stat .value');
    setInterval(() => {
        stats.forEach(stat => {
            if (Math.random() > 0.8) {
                stat.style.opacity = 0.5;
                setTimeout(() => stat.style.opacity = 1, 50);
            }
        });
    }, 2000);

    // 5. INIT
    preloadFrames();

})();
