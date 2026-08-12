/**
 * ============================================================
 * 010_HIDDEN_OBJECT | 尋物大冒險
 * UTT-v2.0 MASTER-GRADE ENGINE | © 2026 Project Chimera
 *
 * Architecture (Xavier & Ada):
 *  - SceneOrchestrator: Generates Base Layer (Clutter) + Target Layer using stable PRNG.
 *  - CoordinateCalibration: Normalizes viewport clicks to a static 1000x1000 internal view-space.
 *  - ParticleEngine: Renders high-fidelity collection sparks via overlapping Canvas rendering without full redraws.
 *  - AutoPilot: Deterministic sequential clicker solving targets with synthetic delay.
 * ============================================================
 */
'use strict';

class AudioManager {
    constructor() { this.on = true; }
    init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ this.on = false; } }
    wake() { if (this.ctx?.state === 'suspended') this.ctx.resume(); }
    play(t) {
        if (!this.on || !this.ctx) return;
        const now = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.connect(g); g.connect(this.ctx.destination);
        if (t === 'find') {
            o.type = 'sine'; [1046, 1318, 1567].forEach((f, i) => o.frequency.setValueAtTime(f, now+i*0.08));
            g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.4);
            o.start(now); o.stop(now+0.4);
        } else if (t === 'miss') {
            o.type = 'sawtooth'; o.frequency.setValueAtTime(150, now); o.frequency.exponentialRampToValueAtTime(80, now+0.2);
            g.gain.setValueAtTime(0.08, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.25);
            o.start(now); o.stop(now+0.25);
        } else if (t === 'win') {
            o.type = 'triangle'; [523, 659, 784, 1047, 1319].forEach((f, i) => o.frequency.setValueAtTime(f, now+i*0.1));
            g.gain.setValueAtTime(0.15, now); g.gain.exponentialRampToValueAtTime(0.001, now+1.2);
            o.start(now); o.stop(now+1.2);
        } else if (t === 'lose') {
            o.type = 'square'; [300, 250, 200, 150].forEach((f, i) => o.frequency.setValueAtTime(f, now+i*0.2));
            g.gain.setValueAtTime(0.12, now); g.gain.exponentialRampToValueAtTime(0.001, now+1.0);
            o.start(now); o.stop(now+1.0);
        }
    }
}

class SceneOrchestrator {
    constructor(seed, difficulty) {
        this.seed = seed;
        this.isHard = difficulty === 'hard';
        this.baseCvs = document.createElement('canvas');
        this.baseCvs.width = 1000; this.baseCvs.height = 1000;
        
        // Allowed targets
        this.targetPool = [
            { id: 'key', icon: '🗝️', name: '秘銀鑰匙' },
            { id: 'scroll', icon: '📜', name: '禁忌卷軸' },
            { id: 'shield', icon: '🛡️', name: '守護神盾' },
            { id: 'gem', icon: '💎', name: '魔核寶石' },
            { id: 'hourglass', icon: '⏳', name: '時光沙漏' },
            { id: 'orb', icon: '🔮', name: '先知水晶' },
            { id: 'ring', icon: '💍', name: '誓約之戒' },
            { id: 'book', icon: '📘', name: '星象魔典' }
        ];
        
        this.distractors = ['📚', '🕯️', '🪙', '🧪', '🏺', '📦', '🕸️', '🧿', '🔭', '📜'];
        
        this.targets = []; // The chosen ones to find
        this.itemsMap = []; // Coordinate tracking for hitting targets
        this.targetCount = this.isHard ? 8 : 5;
        this._buildScene();
    }

    _random(min, max) {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        const r = ((t ^ t >>> 14) >>> 0) / 4294967296;
        return min + r * (max - min);
    }

    _buildScene() {
        const ctx = this.baseCvs.getContext('2d');
        
        // Background Base (Arcane Wood / Shelves)
        ctx.fillStyle = '#1e1026';
        ctx.fillRect(0, 0, 1000, 1000);
        
        // Procedural Shelves
        ctx.fillStyle = '#2d1838';
        for(let y = 150; y < 1000; y += 200) {
            ctx.fillRect(0, y, 1000, 20);
            ctx.shadowColor = '#000'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 10;
            ctx.fillRect(0, y, 1000, 5); // Shelf Lip
            ctx.shadowColor = 'transparent';
        }

        // Draw Clutter
        const clutterCount = this.isHard ? 250 : 120;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        
        for(let i=0; i<clutterCount; i++) {
            const icon = this.distractors[Math.floor(this._random(0, this.distractors.length))];
            const x = this._random(50, 950);
            const y = this._random(50, 950);
            const size = this._random(30, 70);
            const rot = this._random(-Math.PI, Math.PI);
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);
            ctx.font = `${size}px sans-serif`;
            ctx.filter = `brightness(${this._random(0.5, 0.9)}) hue-rotate(${this._random(-20, 20)}deg)`;
            ctx.fillText(icon, 0, 0);
            ctx.restore();
        }

        // Prepare Targets
        const shuffledPool = [...this.targetPool].sort(() => this._random(-1, 1));
        this.targets = shuffledPool.slice(0, this.targetCount);
        
        // Embed Targets in random locations maintaining spacing
        this.targets.forEach(t => {
            let placed = false;
            let tx, ty, size = 55;
            while(!placed) {
                tx = this._random(100, 900);
                ty = this._random(100, 900);
                // Simple collision check to avoid overlap with other targets
                let overlap = this.itemsMap.some(itm => Math.hypot(itm.x - tx, itm.y - ty) < 100);
                if (!overlap) placed = true;
            }
            
            this.itemsMap.push({ id: t.id, x: tx, y: ty, r: size, found: false, icon: t.icon });
            
            // Draw Target tightly integrated into scene
            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(this._random(-0.5, 0.5));
            ctx.font = `${size}px sans-serif`;
            // Targets get a slight golden shadow for mystic feel but not overly obvious
            ctx.shadowColor = 'rgba(245, 158, 11, 0.8)'; ctx.shadowBlur = 15;
            ctx.fillText(t.icon, 0, 0);
            ctx.restore();
        });
    }

    draw(ctx, W, H, particles) {
        // Blit the flattened cache
        ctx.clearRect(0,0,W,H);
        ctx.drawImage(this.baseCvs, 0, 0, W, H);
        
        const sx = W / 1000;
        const sy = H / 1000;

        // Draw particle effects on top
        if (particles && particles.length > 0) {
            particles.forEach(p => {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.c;
                ctx.beginPath();
                ctx.arc(p.x * sx, p.y * sy, p.r * Math.min(sx,sy), 0, Math.PI*2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;

            // Update particles
            for(let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx; p.y += p.vy;
                p.life -= 0.05;
                if(p.life <= 0) particles.splice(i, 1);
            }
        }

        // Highlight found items with a solid cyan circle to mark them
        this.itemsMap.forEach(item => {
            if (item.found) {
                ctx.save();
                ctx.strokeStyle = 'rgba(20, 184, 166, 0.8)';
                ctx.lineWidth = 4;
                ctx.setLineDash([10, 5]);
                ctx.beginPath();
                ctx.arc(item.x * sx, item.y * sy, (item.r + 10) * Math.min(sx, sy), 0, Math.PI * 2);
                ctx.stroke();
                
                // Add a checkmark overlay
                ctx.fillStyle = '#14b8a6';
                ctx.font = `bold ${Math.max(20, item.r*0.6*Math.min(sx,sy))}px sans-serif`;
                ctx.textAlign = 'center'; ctx.textBaseline='middle';
                ctx.fillText('✔️', item.x*sx, item.y*sy);
                ctx.restore();
            }
        });
    }
}

class EliteEngine {
    constructor() {
        this.cvs = document.getElementById('stage');
        this.ctx = this.cvs.getContext('2d');
        this.overlay = document.getElementById('game-overlay');
        this.flash = document.getElementById('flash-overlay');
        this.tray = document.getElementById('target-tray');
        
        this.foundEl = document.getElementById('found-val');
        this.timerEl = document.getElementById('timer-val');
        this.hintsEl = document.getElementById('hint-btn');
        
        this.audio = new AudioManager();
        this.scene = null;
        
        this.gameActive = false;
        this.difficulty = 'easy'; // easy=5, hard=8
        this.timeLeft = 60;
        this.timerIv = null;
        this.hints = 3;
        
        this.particles = [];
        this.autoMode = false;

        this._bindEvents();
        window.addEventListener('resize', () => { if(this.gameActive) this._resize(); });
    }

    _bindEvents() {
        const diffBtns = document.querySelectorAll('.diff-btn');
        diffBtns.forEach(btn => btn.addEventListener('click', e => {
            diffBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            this.difficulty = e.target.dataset.diff;
        }));

        document.getElementById('init-game-btn').addEventListener('click', () => this._startGame());
        document.getElementById('auto-pilot-toggle').addEventListener('click', () => this._toggleAuto());
        this.hintsEl.addEventListener('click', () => this._useHint());
        
        const clickHandler = (e) => this._onClick(e);
        this.cvs.addEventListener('mousedown', clickHandler);
        this.cvs.addEventListener('touchstart', e => { e.preventDefault(); clickHandler(e.touches[0]); }, {passive:false});
    }

    _resize() {
        const wrap = this.cvs.parentElement;
        this.cvs.width = wrap.clientWidth;
        this.cvs.height = wrap.clientHeight;
        this._render();
    }

    _startGame() {
        this.audio.init(); this.audio.wake();
        this.gameActive = true;
        this.overlay.classList.remove('active');
        
        this.timeLeft = this.difficulty === 'hard' ? 90 : 60;
        this.hints = 3;
        this.particles = [];
        
        this.scene = new SceneOrchestrator(Date.now(), this.difficulty);
        this._buildTray();
        this._updateHUD();
        this._resize();
        
        clearInterval(this.timerIv);
        this.timerIv = setInterval(() => {
            if(!this.gameActive || this.autoMode) return;
            this.timeLeft--;
            this._updateHUD();
            if(this.timeLeft <= 0) this._endGame(false);
        }, 1000);

        this._loop();
    }

    _buildTray() {
        this.tray.innerHTML = '';
        this.scene.targets.forEach(t => {
            const div = document.createElement('div');
            div.className = 'target-item';
            div.id = `tray-${t.id}`;
            div.innerHTML = `<span class="target-icon">${t.icon}</span><span class="target-name">${t.name}</span>`;
            this.tray.appendChild(div);
        });
    }

    // Convert DOM click to 1000x1000 internal space
    _onClick(e) {
        if (!this.gameActive || this.autoMode) return;
        this.audio.wake();
        const rect = this.cvs.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        const nx = (mx / this.cvs.width) * 1000;
        const ny = (my / this.cvs.height) * 1000;
        
        this._processHit(nx, ny);
    }

    _processHit(nx, ny) {
        let hitItem = null;
        
        for (let item of this.scene.itemsMap) {
            if (item.found) continue;
            // Pad hit radius generously for touch devices
            const dist = Math.hypot(item.x - nx, item.y - ny);
            if (dist <= item.r + 30) {
                hitItem = item;
                break;
            }
        }

        if (hitItem) {
            hitItem.found = true;
            this.audio.play('find');
            document.getElementById(`tray-${hitItem.id}`).classList.add('found');
            this._spawnParticles(hitItem.x, hitItem.y, '#14b8a6');
            this._updateHUD();
            
            if (this.scene.itemsMap.every(i => i.found)) {
                setTimeout(() => this._endGame(true), 500);
            }
        } else {
            this.audio.play('miss');
            this.timeLeft = Math.max(0, this.timeLeft - 5);
            this.flash.classList.add('active');
            setTimeout(() => this.flash.classList.remove('active'), 200);
            this._updateHUD();
            if (this.timeLeft <= 0) this._endGame(false);
        }
    }

    _spawnParticles(x, y, color) {
        for(let i=0; i<15; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = Math.random() * 5 + 2;
            this.particles.push({
                x, y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                r: Math.random() * 5 + 3,
                c: color,
                life: 1.0
            });
        }
    }

    _useHint() {
        if (!this.gameActive || this.hints <= 0) return;
        this.hints--;
        const remain = this.scene.itemsMap.filter(i => !i.found);
        if (remain.length > 0) {
            const t = remain[0];
            this._spawnParticles(t.x, t.y, '#f59e0b');
        }
        this._updateHUD();
    }

    _loop() {
        if (!this.gameActive && this.particles.length === 0) return;
        requestAnimationFrame(() => this._loop());
        this._render();
    }

    _render() {
        if(this.scene) this.scene.draw(this.ctx, this.cvs.width, this.cvs.height, this.particles);
    }

    _updateHUD() {
        const f = this.scene ? this.scene.itemsMap.filter(i=>i.found).length : 0;
        const total = this.scene ? this.scene.targetCount : 0;
        this.foundEl.textContent = `${f}/${total}`;
        this.timerEl.textContent = `${this.timeLeft}s`;
        if (this.timeLeft <= 10) this.timerEl.style.color = 'var(--accent-error)';
        else this.timerEl.style.color = '';
        this.hintsEl.innerHTML = `<span class="icon">🪄</span> 祕法啟示 (${this.hints})`;
    }

    _endGame(win) {
        this.gameActive = false;
        clearInterval(this.timerIv);
        if (this.autoMode) this._toggleAuto();

        this.audio.play(win ? 'win' : 'lose');
        
        setTimeout(() => {
            const h2 = this.overlay.querySelector('h2');
            const sub = this.overlay.querySelector('.subtitle');
            h2.textContent = win ? '🎉 封印解除！' : '💀 迷失檔案館';
            h2.className = win ? 'win-text' : 'lose-text';
            
            const f = this.scene.itemsMap.filter(i=>i.found).length;
            sub.innerHTML = `
                難度: <strong>${this.difficulty === 'hard' ? '大師' : '學徒'}</strong><br>
                尋獲: <strong>${f}/${this.scene.targetCount}</strong><br>
                剩餘時間: <strong>${this.timeLeft}s</strong>
            `;
            document.getElementById('init-game-btn').textContent = '重新潛入';
            this.overlay.classList.add('active');
        }, 1000);
    }

    /* === AI AutoPilot === */
    _toggleAuto() {
        this.autoMode = !this.autoMode;
        const s = document.getElementById('auto-pilot-status');
        const t = document.getElementById('auto-pilot-toggle');
        s.textContent = this.autoMode ? 'ON' : 'OFF';
        t.classList.toggle('active', this.autoMode);

        if(this.autoMode && this.gameActive) this._runAutoStep();
    }

    _runAutoStep() {
        if(!this.autoMode || !this.gameActive) return;
        
        const remain = this.scene.itemsMap.filter(i => !i.found);
        if(remain.length > 0) {
            const target = remain[0];
            setTimeout(() => {
                if(!this.autoMode || !this.gameActive) return;
                this._processHit(target.x, target.y);
                this._runAutoStep();
            }, 800);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => { new EliteEngine(); });
