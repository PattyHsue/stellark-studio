/**
 * 019_Tycoon: Capital Ascension
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
        } catch (e) { console.warn("Wealth Audio failed."); }
    }

    playCash() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.1);
    }
}

class ParticleEmitter {
    constructor() {
        this.canvas = document.getElementById('vfx-stage');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    emit(x, y, color) {
        for(let i=0; i<10; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random()-0.5)*4,
                vy: -Math.random()*6,
                life: 1.0,
                decay: 0.02,
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
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.font = '20px Arial';
            this.ctx.fillText('$', p.x, p.y);
        });
        this.ctx.globalAlpha = 1;
    }
}

class EliteEngine {
    constructor() {
        this.wealthHUD = document.getElementById('wealth-val');
        this.incomeHUD = document.getElementById('income-val');
        this.grid = document.getElementById('investment-grid');
        this.overlay = document.getElementById('game-overlay');
        
        this.audio = new AudioManager();
        this.vfx = new ParticleEmitter();
        
        // Step 7: Data Persistence
        this.wealth = parseFloat(localStorage.getItem('tycoon_wealth')) || 50;
        this.lastTick = Date.now();
        
        this.businesses = [
            { id: 0, name: 'Lemonade Stand', cost: 10, revenue: 1, level: 0 },
            { id: 1, name: 'Street Food', cost: 100, revenue: 10, level: 0 },
            { id: 2, name: 'Tech Startup', cost: 500, revenue: 50, level: 0 },
            { id: 3, name: 'Real Estate', cost: 2500, revenue: 200, level: 0 },
            { id: 4, name: 'Bank Chain', cost: 10000, revenue: 1000, level: 0 },
            { id: 5, name: 'Space Mining', cost: 50000, revenue: 6000, level: 0 }
        ];

        this.initEvents();
        this.renderBusinesses();
        this.gameLoop();
    }

    initEvents() {
        document.getElementById('init-game-btn').onclick = () => {
            this.audio.init();
            this.overlay.classList.remove('active');
        };
    }

    renderBusinesses() {
        this.grid.innerHTML = '';
        this.businesses.forEach(biz => {
            const card = document.createElement('div');
            card.className = 'biz-card';
            card.innerHTML = `
                <div class="name">${biz.name}</div>
                <div class="lvl">LVL ${biz.level}</div>
                <div class="desc">Generates $${biz.revenue}/sec</div>
                <button class="buy-btn" id="buy-${biz.id}">BUY $${biz.cost}</button>
            `;
            this.grid.appendChild(card);
            
            card.querySelector('.buy-btn').onclick = (e) => {
                e.stopPropagation();
                this.buyBusiness(biz.id);
            };
        });
    }

    buyBusiness(id) {
        const biz = this.businesses[id];
        if (this.wealth >= biz.cost) {
            this.wealth -= biz.cost;
            biz.level++;
            biz.cost = Math.floor(biz.cost * 1.5);
            this.audio.playCash();
            this.vfx.emit(window.innerWidth/2, window.innerHeight/2, '#ffd600');
            this.updateHUD();
            this.renderBusinesses();
        }
    }

    update() {
        const now = Date.now();
        const delta = (now - this.lastTick) / 1000;
        this.lastTick = now;

        const totalIncome = this.businesses.reduce((sum, b) => sum + (b.level * b.revenue), 0);
        this.wealth += totalIncome * delta;
        
        this.vfx.update();
        if (Math.random() < 0.05 && totalIncome > 0) {
            this.vfx.emit(Math.random()*window.innerWidth, window.innerHeight, '#ffd600');
        }

        if (this.frame % 60 === 0) {
            localStorage.setItem('tycoon_wealth', this.wealth);
            this.updateHUD();
        }
        this.frame++;
    }

    updateHUD() {
        this.wealthHUD.innerText = `$${Math.floor(this.wealth).toLocaleString()}`;
        const totalIncome = this.businesses.reduce((sum, b) => sum + (b.level * b.revenue), 0);
        this.incomeHUD.innerText = `+$${totalIncome}/sec`;
        
        // Update button states
        this.businesses.forEach(biz => {
            const btn = document.getElementById(`buy-${biz.id}`);
            if (btn) btn.disabled = this.wealth < biz.cost;
        });
    }

    gameLoop() {
        this.update();
        this.vfx.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.onload = () => new EliteEngine();
