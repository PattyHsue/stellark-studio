/**
 * 020_Slots: Cyber Neon Fortune
 * UTT-v2.0 Master-Grade Industrial Implementation
 */

"use strict";

class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isReady = false;
    }

    init() {
        if (this.isReady) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.6;
            this.isReady = true;
        } catch (e) { console.warn("Cyber Audio failed."); }
    }

    playSpin() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.5);
        g.gain.setValueAtTime(0.05, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.5);
    }

    playWin() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        [0, 0.1, 0.2].forEach(t => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.frequency.setValueAtTime(440 + t*100, now + t);
            g.gain.setValueAtTime(0.1, now + t);
            g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.2);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(now + t);
            osc.stop(now + t + 0.2);
        });
    }
}

class ParticleEmitter {
    constructor() {
        this.particles = [];
    }
    emit(x, y, color) {
        for(let i=0; i<30; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random()-0.5)*15,
                vy: (Math.random()-0.5)*15,
                life: 1.0,
                decay: 0.02 + Math.random()*0.02,
                color
            });
        }
    }
    update() {
        for(let i=this.particles.length-1; i>=0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy;
            p.life -= p.decay;
            if(p.life <= 0) this.particles.splice(i,1);
        }
    }
    draw(ctx) {
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.fillRect(p.x, p.y, 5, 5);
        });
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

class EliteEngine {
    constructor() {
        this.canvas = document.getElementById('stage');
        this.ctx = this.canvas.getContext('2d');
        this.creditsHUD = document.getElementById('credits-val');
        this.winHUD = document.getElementById('win-val');
        this.overlay = document.getElementById('game-overlay');
        
        this.symbols = ['🍒', '🍋', '🔔', '💎', '7️⃣', '🛡️'];
        this.reelsCount = 3;
        this.reelWidth = 120;
        this.reelHeight = 250;
        
        this.audio = new AudioManager();
        this.vfx = new ParticleEmitter();
        
        // Step 7: Data Persistence
        this.credits = parseInt(localStorage.getItem('cyberSlots_credits')) || 10000;
        this.isSpinning = false;
        this.autoSpin = false;
        
        this.reels = Array.from({length: this.reelsCount}, (_, i) => ({
            id: i,
            symbols: this.shuffle([...this.symbols, ...this.symbols]),
            offset: 0,
            speed: 0,
            stopping: false,
            finalOffset: 0
        }));

        this.initEvents();
        this.resize();
        this.gameLoop();
    }

    shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }

    initEvents() {
        window.addEventListener('resize', () => this.resize());
        document.getElementById('init-game-btn').onclick = () => {
            this.audio.init();
            this.overlay.classList.remove('active');
        };
        document.getElementById('spin-btn').onclick = () => this.spin();
        document.getElementById('auto-pilot-toggle').onclick = () => {
            this.autoSpin = !this.autoSpin;
            document.getElementById('auto-pilot-toggle').classList.toggle('active');
        };
    }

    resize() {
        const wrapper = document.getElementById('slot-machine');
        const minDim = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.5);
        this.canvas.width = Math.max(minDim, 320);
        this.canvas.height = this.canvas.width * 0.6;
        this.reelWidth = this.canvas.width / 3;
        this.rowHeight = this.canvas.height / 3.5;
    }

    spin() {
        if (this.isSpinning) return;
        if (this.credits < 100) return;
        
        this.credits -= 100;
        this.updateHUD();
        this.isSpinning = true;
        this.audio.playSpin();

        this.reels.forEach((reel, i) => {
            reel.speed = 20 + Math.random() * 10;
            reel.stopping = false;
            setTimeout(() => { reel.stopping = true; }, 1500 + i * 500);
        });
    }

    update() {
        this.vfx.update();
        let allStopped = true;
        
        this.reels.forEach(reel => {
            if (reel.speed > 0) {
                allStopped = false;
                reel.offset += reel.speed;
                if (reel.stopping) {
                    reel.speed *= 0.96;
                    if (reel.speed < 1) {
                        reel.speed = 0;
                        reel.offset = Math.round(reel.offset / 80) * 80; // Snap
                    }
                }
            }
        });

        if (this.isSpinning && allStopped) {
            this.isSpinning = false;
            this.checkResult();
            if (this.autoSpin) setTimeout(() => this.spin(), 1000);
        }
    }

    checkResult() {
        const results = this.reels.map(r => {
            const index = Math.floor(r.offset / 80) % r.symbols.length;
            return r.symbols[index];
        });

        if (results[0] === results[1] && results[1] === results[2]) {
            const sym = results[0];
            const multiplier = sym === '7️⃣' ? 50 : (sym === '💎' ? 20 : 10);
            const win = 100 * multiplier;
            this.credits += win;
            this.audio.playWin();
            this.vfx.emit(this.canvas.width/2, this.canvas.height/2, '#ffd700');
            this.winHUD.innerText = win;
        }
        localStorage.setItem('cyberSlots_credits', this.credits);
        this.updateHUD();
    }

    updateHUD() {
        this.creditsHUD.innerText = this.credits.toLocaleString();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const startX = (this.canvas.width - (this.reelsCount * this.reelWidth)) / 2;
        const startY = (this.canvas.height - this.reelHeight) / 2;

        // Draw Reel Housing
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(startX, startY, this.reelsCount * this.reelWidth, this.reelHeight);
        
        // Clipping region for reels
        this.ctx.beginPath();
        this.ctx.rect(startX, startY, this.reelsCount * this.reelWidth, this.reelHeight);
        this.ctx.clip();

        this.reels.forEach((reel, i) => {
            const rx = startX + i * this.reelWidth;
            
            // Motion Blur Effect
            if (reel.speed > 5) {
                this.ctx.filter = `blur(${reel.speed / 4}px)`;
            }

            reel.symbols.forEach((sym, j) => {
                const sy = startY + (j * this.rowHeight + reel.offset) % (reel.symbols.length * this.rowHeight) - this.rowHeight;
                this.ctx.font = `${this.rowHeight * 0.6}px serif`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(sym, rx + this.reelWidth/2, sy + this.rowHeight * 0.7);
            });
            
            this.ctx.filter = 'none';
        });

        this.ctx.restore();
        this.vfx.draw(this.ctx);
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.onload = () => new EliteEngine();
