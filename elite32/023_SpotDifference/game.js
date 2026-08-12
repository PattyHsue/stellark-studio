/**
 * ============================================================
 * 023_SPOT_DIFFERENCE | 鏡影迷蹤
 * UTT-v2.0 MASTER-GRADE ENGINE | © 2026 Project Chimera
 *
 * Architecture (Xavier): Dual-Canvas synchronization. 
 *  - SceneGenerator: Procedurally draws a complex Cyber-Botanical scene.
 *  - MutatorEngine: Modifies rendering rules for the right canvas based on a defined set of hotspots.
 *  - HotspotManager: Bounding box checking scaling with responsive canvas.
 *  - AutoPilot: Simulated AI solving path.
 *
 * Complexity (Ada): 
 *  - Collision check: O(H) where H is hotspot count.
 *  - Rendering: O(C) where C is component count. Re-rendered ONLY upon resize or mark.
 * ============================================================
 */
'use strict';

/* ============================================================
 * S1: AUDIO MANAGER
 * ============================================================ */
class AudioManager {
    constructor() { this.ctx = null; this.on = true; }
    init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { this.on = false; } }
    wake() { if (this.ctx?.state === 'suspended') this.ctx.resume(); }
    play(t) {
        if (!this.on || !this.ctx) return;
        try {
            const now = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.connect(g); g.connect(this.ctx.destination);
            if (t === 'correct') {
                o.type = 'sine'; [659, 880, 1046].forEach((f, i) => o.frequency.setValueAtTime(f, now + i * 0.08));
                g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                o.start(now); o.stop(now + 0.4);
            } else if (t === 'wrong') {
                o.type = 'sawtooth'; o.frequency.setValueAtTime(150, now); o.frequency.exponentialRampToValueAtTime(80, now + 0.2);
                g.gain.setValueAtTime(0.08, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                o.start(now); o.stop(now + 0.25);
            } else if (t === 'win') {
                o.type = 'sine'; [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => o.frequency.setValueAtTime(f, now + i * 0.1));
                g.gain.setValueAtTime(0.12, now); g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
                o.start(now); o.stop(now + 1.2);
            } else if (t === 'lose') {
                o.type = 'square'; [300, 250, 200, 150].forEach((f, i) => o.frequency.setValueAtTime(f, now + i * 0.2));
                g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
                o.start(now); o.stop(now + 1.0);
            }
        } catch(e) {}
    }
}

/* ============================================================
 * S2: PROCEDURAL SCENE GENERATOR
 * ============================================================ */
class SceneGenerator {
    constructor(seed, difficulty) {
        this.seed = seed;
        this.components = [];
        this.hotspots = [];
        this.targetCount = difficulty === 'hard' ? 8 : 5;
        this._buildScene();
    }

    _random(min, max) {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        const r = ((t ^ t >>> 14) >>> 0) / 4294967296;
        return min + r * (max - min);
    }

    // A layout defined on a 1000x1000 virtual unit grid
    _buildScene() {
        // Sky Gradient
        this.components.push({ type: 'bg', color1: '#1e0c3a', color2: '#0b162c' });

        // Back Mountains
        for (let i=0; i<3; i++) {
            this.components.push({ type: 'mountain', x: this._random(100, 900), y: 600, w: this._random(300, 500), h: this._random(200, 400), c: '#1f1338' });
        }

        // Cyber Buildings
        for (let i=0; i<6; i++) {
            this.components.push({
                type: 'building', id: `b${i}`,
                x: 100 + i * 150, y: 700, w: this._random(80, 120), h: this._random(250, 500),
                c: `hsl(${this._random(260, 320)}, 50%, 20%)`, windowC: `hsl(${this._random(180, 220)}, 80%, 60%)`
            });
        }

        // Bioluminescent Trees
        for(let i=0; i<8; i++) {
            this.components.push({
                type: 'tree', id: `t${i}`,
                x: this._random(50, 950), y: this._random(750, 950), r: this._random(40, 70),
                c: `hsl(${this._random(280, 340)}, 80%, 50%)`
            });
        }

        // Moon
        this.components.push({ type: 'moon', id: 'm1', x: 800, y: 200, r: 80, c: '#e879f9' });

        // Floating Orbs
        for (let i=0; i<15; i++) {
            this.components.push({
                type: 'orb', id: `o${i}`,
                x: this._random(50, 950), y: this._random(50, 950), r: this._random(5, 12),
                c: '#06b6d4'
            });
        }

        // Generate Mutations (Differences)
        this._generateMutations();
    }

    _generateMutations() {
        const candidates = this.components.filter(c => c.id);
        const shuffled = [...candidates].sort(() => this._random(-1, 1));
        
        for (let i=0; i<this.targetCount; i++) {
            const trg = shuffled[i];
            const mut = { id: trg.id, original: {...trg}, mutated: {...trg}, hit: false };

            // Decide mutation type
            const rType = this._random(0, 3);
            if (trg.type === 'building') {
                if(rType < 1) mut.mutated.windowC = '#ef4444'; // Color shift
                else if (rType < 2) Object.assign(mut.mutated, {w: trg.w*0.5, x: trg.x+20}); // Scale
                else mut.mutated.h = 0; // Removed
            } else if (trg.type === 'tree') {
                if(rType < 1.5) mut.mutated.c = '#06b6d4';
                else mut.mutated.r = trg.r * 1.5;
            } else if (trg.type === 'moon') {
                Object.assign(mut.mutated, {x: 200, c: '#f59e0b'});
            } else if (trg.type === 'orb') {
                mut.mutated.r = 0; // Missing
            }

            // Define hit circle bounding based on merged bounds
            const cx = (trg.x + (mut.mutated.x || trg.x)) / 2;
            const cy = (trg.y + (mut.mutated.y || trg.y)) / 2;
            const cr = Math.max(trg.w||trg.r, mut.mutated.w||mut.mutated.r||0) * 1.5 + 20;

            mut.hitArea = { x: cx, y: (trg.type==='building') ? cy - trg.h/2 : cy, r: cr };
            this.hotspots.push(mut);
        }
    }

    render(ctx, isMutated, W, H, foundList) {
        ctx.clearRect(0,0,W,H);
        const sx = W / 1000;
        const sy = H / 1000;

        // Apply mutations to a copy
        const renderList = this.components.map(c => {
            if (isMutated) {
                const h = this.hotspots.find(ht => ht.id === c.id);
                if (h) return h.mutated;
            }
            return c;
        });

        // Loop & Draw
        renderList.forEach(c => {
            if (c.r === 0 || c.h === 0) return;

            if (c.type === 'bg') {
                const g = ctx.createLinearGradient(0,0,0,H);
                g.addColorStop(0, c.color1); g.addColorStop(1, c.color2);
                ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
            }
            else if (c.type === 'mountain') {
                ctx.fillStyle = c.c;
                ctx.beginPath();
                ctx.moveTo(c.x*sx, c.y*sy);
                ctx.lineTo((c.x - c.w/2)*sx, 1000*sy);
                ctx.lineTo((c.x + c.w/2)*sx, 1000*sy);
                ctx.fill();
            }
            else if (c.type === 'building') {
                ctx.fillStyle = c.c;
                ctx.fillRect(c.x*sx, (c.y - c.h)*sy, c.w*sx, c.h*sy);
                // Windows
                ctx.fillStyle = c.windowC;
                for(let wy=c.y-c.h+20; wy<c.y-20; wy+=40) {
                    for(let wx=c.x+15; wx<c.x+c.w-15; wx+=25) {
                        ctx.fillRect(wx*sx, wy*sy, 10*sx, 20*sy);
                    }
                }
            }
            else if (c.type === 'tree') {
                ctx.fillStyle = '#0f172a'; // Trunk
                ctx.fillRect((c.x-10)*sx, c.y*sy, 20*sx, 100*sy);
                ctx.fillStyle = c.c; // Leaves
                ctx.globalAlpha = 0.8;
                ctx.beginPath(); ctx.arc(c.x*sx, c.y*sy, c.r*Math.min(sx,sy), 0, Math.PI*2); ctx.fill();
                ctx.globalAlpha = 1;
            }
            else if (c.type === 'moon') {
                ctx.fillStyle = c.c;
                ctx.shadowColor = c.c; ctx.shadowBlur = 30;
                ctx.beginPath(); ctx.arc(c.x*sx, c.y*sy, c.r*Math.min(sx,sy), 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;
            }
            else if (c.type === 'orb') {
                ctx.fillStyle = c.c;
                ctx.beginPath(); ctx.arc(c.x*sx, c.y*sy, c.r*Math.min(sx,sy), 0, Math.PI*2); ctx.fill();
            }
        });

        // Draw circles for found spots
        foundList.forEach(id => {
            const hs = this.hotspots.find(h => h.id === id);
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(hs.hitArea.x*sx, hs.hitArea.y*sy, hs.hitArea.r*Math.min(sx,sy), 0, Math.PI*2);
            ctx.stroke();
        });
    }
}

/* ============================================================
 * S3: ELITE ENGINE
 * ============================================================ */
class EliteEngine {
    constructor() {
        this.cL = document.getElementById('stage-left');
        this.ctxL = this.cL.getContext('2d');
        this.cR = document.getElementById('stage-right');
        this.ctxR = this.cR.getContext('2d');
        
        this.flashL = document.getElementById('flash-left');
        this.flashR = document.getElementById('flash-right');
        
        this.foundEl = document.getElementById('found-val');
        this.scoreEl = document.getElementById('score-val');
        this.timerEl = document.getElementById('timer-val');
        this.lifeEl = document.getElementById('life-val');
        
        this.diffBtns = document.querySelectorAll('.diff-btn');
        this.overlay = document.getElementById('game-overlay');
        
        this.audio = new AudioManager();
        
        this.gameActive = false;
        this.difficulty = 'easy'; // easy=5, hard=8
        this.score = 0;
        this.lives = 3;
        this.timeLeft = 60;
        this.timerIv = null;
        this.hints = 3;
        
        this.autoMode = false;
        this.foundIDs = [];
        this.scene = null;

        this._bindEvents();
        window.addEventListener('resize', () => this._resize());
    }

    _bindEvents() {
        document.getElementById('init-game-btn').addEventListener('click', () => this._startGame());
        
        this.diffBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.diffBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.difficulty = e.target.dataset.diff;
            });
        });

        document.getElementById('auto-pilot-toggle').addEventListener('click', () => this._toggleAuto());
        document.getElementById('hint-btn').addEventListener('click', () => this._useHint());
        
        const clickHandler = (e, cvs) => this._onCanvasClick(e, cvs);
        this.cL.addEventListener('mousedown', e => clickHandler(e, this.cL));
        this.cR.addEventListener('mousedown', e => clickHandler(e, this.cR));
        this.cL.addEventListener('touchstart', e => { e.preventDefault(); clickHandler(e.touches[0], this.cL); }, {passive:false});
        this.cR.addEventListener('touchstart', e => { e.preventDefault(); clickHandler(e.touches[0], this.cR); }, {passive:false});
    }

    _resize() {
        if (!this.gameActive) return;
        const resizeCanvas = (cvs) => {
            const rect = cvs.parentElement.getBoundingClientRect();
            cvs.width = rect.width;
            cvs.height = rect.height;
        };
        resizeCanvas(this.cL);
        resizeCanvas(this.cR);
        this._render();
    }

    _startGame() {
        this.audio.init();
        this.audio.wake();
        this.gameActive = true;
        this.overlay.classList.remove('active');
        
        this.score = 0;
        this.lives = 3;
        this.timeLeft = this.difficulty === 'hard' ? 90 : 60;
        this.hints = 3;
        this.foundIDs = [];
        
        // Random seed based on time
        this.scene = new SceneGenerator(Date.now(), this.difficulty);
        
        this._resize();
        this._startTimer();
        this._updateHUD();
    }

    _onCanvasClick(e, targetCvs) {
        if (!this.gameActive || this.autoMode) return;
        this.audio.wake();
        
        const rect = targetCvs.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        // Normalize coordinates to 1000x1000 grid
        const nx = (mx / targetCvs.width) * 1000;
        const ny = (my / targetCvs.height) * 1000;
        
        this._checkHit(nx, ny);
    }

    _checkHit(nx, ny) {
        let hitId = null;
        for (let hs of this.scene.hotspots) {
            if (this.foundIDs.includes(hs.id)) continue;
            const dist = Math.hypot(hs.hitArea.x - nx, hs.hitArea.y - ny);
            if (dist <= hs.hitArea.r + 20) { // Slight padding 20
                hitId = hs.id;
                break;
            }
        }

        if (hitId) {
            // Correct
            this.foundIDs.push(hitId);
            this.score += 150;
            this.audio.play('correct');
            this._updateHUD();
            this._render();
            if (this.foundIDs.length >= this.scene.targetCount) {
                this._endGame(true);
            }
        } else {
            // Wrong
            this.audio.play('wrong');
            this.lives--;
            this.timeLeft = Math.max(0, this.timeLeft - 5);
            this.timerEl.classList.add('warning');
            setTimeout(() => this.timerEl.classList.remove('warning'), 1000);
            
            this.flashL.classList.add('active');
            this.flashR.classList.add('active');
            setTimeout(() => {
                this.flashL.classList.remove('active');
                this.flashR.classList.remove('active');
            }, 300);

            this._updateHUD();
            if (this.lives <= 0 || this.timeLeft <= 0) this._endGame(false);
        }
    }

    _useHint() {
        if (!this.gameActive || this.hints <= 0) return;
        this.hints--;
        this.score = Math.max(0, this.score - 50); // Penalty
        
        // Find undiscovered
        const unfound = this.scene.hotspots.filter(h => !this.foundIDs.includes(h.id));
        if (unfound.length > 0) {
            const target = unfound[0];
            const sx = this.cL.width / 1000;
            const sy = this.cL.height / 1000;
            
            // Draw temporary highlight
            const drawHint = (ctx) => {
                ctx.save();
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 3;
                ctx.setLineDash([10, 10]);
                ctx.beginPath();
                ctx.arc(target.hitArea.x*sx, target.hitArea.y*sy, target.hitArea.r*Math.min(sx,sy) + 30, 0, Math.PI*2);
                ctx.stroke();
                ctx.restore();
            };
            drawHint(this.ctxL);
            drawHint(this.ctxR);
            setTimeout(() => this._render(), 1000);
        }
        this._updateHUD();
    }

    _render() {
        if (!this.scene) return;
        this.scene.render(this.ctxL, false, this.cL.width, this.cL.height, this.foundIDs);
        this.scene.render(this.ctxR, true, this.cR.width, this.cR.height, this.foundIDs);
    }

    _startTimer() {
        clearInterval(this.timerIv);
        this.timerIv = setInterval(() => {
            if (!this.gameActive || this.autoMode) return;
            this.timeLeft--;
            this._updateHUD();
            if (this.timeLeft <= 0) this._endGame(false);
        }, 1000);
    }

    _updateHUD() {
        this.foundEl.textContent = `${this.foundIDs.length}/${this.scene.targetCount}`;
        this.scoreEl.textContent = this.score;
        this.timerEl.textContent = `${this.timeLeft}s`;
        if (this.timeLeft <= 10) this.timerEl.style.color = '#ef4444';
        else this.timerEl.style.color = '';
        this.lifeEl.textContent = '❤️'.repeat(Math.max(0, this.lives)) + '🖤'.repeat(3 - Math.max(0, this.lives));
        document.getElementById('hint-btn').innerHTML = `<span class="icon">🔍</span> 提示 (${this.hints})`;
    }

    _toggleAuto() {
        this.autoMode = !this.autoMode;
        const s = document.getElementById('auto-pilot-status');
        const t = document.getElementById('auto-pilot-toggle');
        s.textContent = this.autoMode ? 'ON' : 'OFF';
        t.classList.toggle('active', this.autoMode);

        if (this.autoMode && this.gameActive) {
            this._runAutoPilotStep();
        }
    }

    _runAutoPilotStep() {
        if (!this.autoMode || !this.gameActive) return;
        
        const unfound = this.scene.hotspots.filter(h => !this.foundIDs.includes(h.id));
        if (unfound.length > 0) {
            const target = unfound[0];
            setTimeout(() => {
                if (!this.autoMode || !this.gameActive) return;
                this._checkHit(target.hitArea.x, target.hitArea.y);
                this._runAutoPilotStep();
            }, 1200);
        }
    }

    _endGame(win) {
        this.gameActive = false;
        clearInterval(this.timerIv);
        
        if (this.autoMode) {
            this.autoMode = false;
            document.getElementById('auto-pilot-status').textContent = 'OFF';
            document.getElementById('auto-pilot-toggle').classList.remove('active');
        }

        if (win) {
            this.score += this.timeLeft * 10; // Time bonus
            this.audio.play('win');
        } else {
            this.audio.play('lose');
        }

        // Delay overlay
        setTimeout(() => {
            const h2 = this.overlay.querySelector('h2');
            const sub = this.overlay.querySelector('.subtitle');
            h2.textContent = win ? '🎉 挑戰成功！' : '💀 挑戰失敗';
            if (win) {
                h2.classList.add('win-text');
                h2.classList.remove('lose-text');
                h2.style.background = 'linear-gradient(135deg, #d946ef, #06b6d4)';
                h2.style.webkitBackgroundClip = 'text';
                h2.style.webkitTextFillColor = 'transparent';
            } else {
                h2.classList.add('lose-text');
                h2.classList.remove('win-text');
                h2.style.background = '#ef4444';
                h2.style.webkitBackgroundClip = 'text';
                h2.style.webkitTextFillColor = 'transparent';
            }
            
            sub.innerHTML = `
                總分: <strong>${this.score}</strong><br>
                找到: <strong>${this.foundIDs.length} / ${this.scene.targetCount}</strong><br>
                剩餘時間: <strong>${this.timeLeft}s</strong>
            `;
            document.getElementById('init-game-btn').textContent = '重置幻境';
            this.overlay.classList.add('active');
        }, 800);
    }
}

/* ============================================================
 * BOOTSTRAP
 * ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    new EliteEngine();
});
