/**
 * ============================================================
 * 013_MEMORY_MATCHING | 記憶翻牌
 * UTT-v2.0 MASTER-GRADE ENGINE | © 2026 Project Chimera
 *
 * Architecture (Xavier & Ada):
 *  - StateMachine: Strictly controls interaction (Idle -> WaitSecond -> Delay/Resolving -> Idle).
 *  - CardEngine: Employs DOM for CSS hardware-accelerated 3D flips (Canvas is overkill here and loses CSS 3D fluidity).
 *  - AutoPilot (Arthur): Implements a tracking hash map (Perfect Memory Simulator) to resolve known pairs with 100% pathing efficiency.
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
        if (t === 'flip') {
            o.type = 'sine'; o.frequency.setValueAtTime(400, now); o.frequency.exponentialRampToValueAtTime(700, now+0.1);
            g.gain.setValueAtTime(0.05, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.1);
            o.start(now); o.stop(now+0.1);
        } else if (t === 'match') {
            o.type = 'triangle'; [800, 1200].forEach((f, i) => o.frequency.setValueAtTime(f, now+i*0.08));
            g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.2);
            o.start(now); o.stop(now+0.2);
        } else if (t === 'fail') {
            o.type = 'sawtooth'; o.frequency.setValueAtTime(200, now); o.frequency.exponentialRampToValueAtTime(150, now+0.2);
            g.gain.setValueAtTime(0.08, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.25);
            o.start(now); o.stop(now+0.25);
        } else if (t === 'win') {
            o.type = 'sine'; [523, 659, 784, 1047, 1319].forEach((f, i) => o.frequency.setValueAtTime(f, now+i*0.1));
            g.gain.setValueAtTime(0.15, now); g.gain.exponentialRampToValueAtTime(0.001, now+1.0);
            o.start(now); o.stop(now+1.0);
        }
    }
}

class EliteEngine {
    constructor() {
        this.grid = document.getElementById('card-grid');
        this.overlay = document.getElementById('game-overlay');
        this.movesEl = document.getElementById('moves-val');
        this.pairsEl = document.getElementById('pairs-val');
        this.timerEl = document.getElementById('timer-val');
        
        this.audio = new AudioManager();
        
        // Game State Machine
        this.STATE = 'IDLE'; // IDLE, WAIT_SECOND, RESOLVING
        this.cards = [];
        this.firstCard = null;
        this.secondCard = null;
        
        this.config = { rows: 4, cols: 4, delay: 1000 };
        this.gameActive = false;
        this.autoMode = false;
        
        this.moves = 0;
        this.matchedPairs = 0;
        this.totalPairs = 0;
        this.timer = 0;
        this.timerIv = null;

        // AutoPilot Hash Map (simulates memory)
        this.aiMemory = new Map(); // id -> [index1, index2]

        this.symbols = ['🧿', '🧬', '⚛️', '🦠', '🚀', '🛰️', '🪐', '☄️', '🌌', '⚡', '💻', '🔋', '🔮', '🛡️', '💠', '🌀'];

        this._bindEvents();
    }

    _bindEvents() {
        const btns = document.querySelectorAll('.diff-btn');
        btns.forEach(btn => btn.addEventListener('click', e => {
            btns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            this.config = JSON.parse(e.target.dataset.config);
        }));

        document.getElementById('init-game-btn').addEventListener('click', () => this._startGame());
        document.getElementById('auto-pilot-toggle').addEventListener('click', () => this._toggleAuto());
        window.addEventListener('resize', () => this._onResize());
    }

    _onResize() {
        if (!this.gameActive) return;
        const ga = document.getElementById('game-area');
        const padding = 40;
        const availableW = ga.clientWidth - padding;
        const availableH = ga.clientHeight - padding;
        
        const aspect = 0.8; // card width/height ratio
        // Test varying card widths to find max that fits
        let cardW = 150;
        let cardH = cardW / aspect;
        
        while (cardW > 30 && ((cardW * this.config.cols + 15*(this.config.cols-1)) > availableW || (cardH * this.config.rows + 15*(this.config.rows-1)) > availableH)) {
            cardW -= 5;
            cardH = cardW / aspect;
        }

        this.grid.style.gridTemplateColumns = `repeat(${this.config.cols}, ${cardW}px)`;
        this.grid.style.gridTemplateRows = `repeat(${this.config.rows}, ${cardH}px)`;
    }

    _startGame() {
        this.audio.init(); this.audio.wake();
        this.gameActive = true;
        this.overlay.classList.remove('active');
        
        this.moves = 0;
        this.matchedPairs = 0;
        this.totalPairs = (this.config.rows * this.config.cols) / 2;
        this.timer = 0;
        this.STATE = 'IDLE';
        this.aiMemory.clear();
        
        this._buildDeck();
        this._onResize();
        this._updateHUD();

        clearInterval(this.timerIv);
        this.timerIv = setInterval(() => {
            if(!this.gameActive || this.autoMode) return;
            this.timer++;
            const m = Math.floor(this.timer/60).toString().padStart(2,'0');
            const s = (this.timer%60).toString().padStart(2,'0');
            this.timerEl.textContent = `${m}:${s}`;
        }, 1000);
    }

    _buildDeck() {
        this.grid.innerHTML = '';
        this.cards = [];
        
        let deck = [];
        for (let i = 0; i < this.totalPairs; i++) {
            deck.push(this.symbols[i], this.symbols[i]);
        }
        
        // Fisher-Yates element swap constraint
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        deck.forEach((sym, idx) => {
            const dom = document.createElement('div');
            dom.className = 'memory-card';
            dom.dataset.id = sym;
            dom.dataset.idx = idx;
            
            dom.innerHTML = `
                <div class="card-face card-front"></div>
                <div class="card-face card-back">${sym}</div>
            `;
            
            dom.addEventListener('click', () => this._onCardClick(dom));
            
            this.grid.appendChild(dom);
            this.cards.push({ dom, sym, idx, flipped: false, matched: false });
        });
    }

    _onCardClick(dom) {
        // STATE MACHINE GUARD
        if (this.STATE === 'RESOLVING' || !this.gameActive || this.autoMode) return;
        this.audio.wake();

        const idx = parseInt(dom.dataset.idx);
        const card = this.cards[idx];
        
        if (card.flipped || card.matched) return;

        this._flipAction(card);

        if (this.STATE === 'IDLE') {
            this.firstCard = card;
            this.STATE = 'WAIT_SECOND';
        } else if (this.STATE === 'WAIT_SECOND') {
            this.secondCard = card;
            this.moves++;
            this._updateHUD();
            this.STATE = 'RESOLVING';
            this._checkMatch();
        }
    }

    _flipAction(card) {
        card.flipped = true;
        card.dom.classList.add('flipped');
        this.audio.play('flip');
        
        // AutoPilot memory population
        if (!this.aiMemory.has(card.sym)) this.aiMemory.set(card.sym, []);
        if (!this.aiMemory.get(card.sym).includes(card.idx)) {
            this.aiMemory.get(card.sym).push(card.idx);
        }
    }

    _checkMatch() {
        if (this.firstCard.sym === this.secondCard.sym) {
            this.audio.play('match');
            this.matchedPairs++;
            this.firstCard.matched = true; this.secondCard.matched = true;
            this.firstCard.dom.classList.add('matched');
            this.secondCard.dom.classList.add('matched');
            this._resetState();
            this._updateHUD();
            
            if (this.matchedPairs === this.totalPairs) this._endGame(true);
        } else {
            this.audio.play('fail');
            setTimeout(() => {
                this.firstCard.flipped = false; this.secondCard.flipped = false;
                this.firstCard.dom.classList.remove('flipped');
                this.secondCard.dom.classList.remove('flipped');
                this._resetState();
            }, this.config.delay);
        }
    }

    _resetState() {
        this.firstCard = null;
        this.secondCard = null;
        this.STATE = 'IDLE';
    }

    _updateHUD() {
        this.movesEl.textContent = this.moves;
        this.pairsEl.textContent = `${this.matchedPairs}/${this.totalPairs}`;
    }

    _endGame(win) {
        this.gameActive = false;
        clearInterval(this.timerIv);
        if (this.autoMode) this._toggleAuto();
        
        this.audio.play('win');
        setTimeout(() => {
            const h2 = this.overlay.querySelector('h2');
            h2.textContent = '🎉 突觸連結完成';
            h2.style.background = 'linear-gradient(135deg, #01ffc3, #05d9e8)';
            h2.style.webkitBackgroundClip = 'text';
            h2.style.webkitTextFillColor = 'transparent';
            
            const sub = this.overlay.querySelector('.subtitle');
            sub.innerHTML = `
                難度: <strong>${this.config.rows}x${this.config.cols}</strong><br>
                總步數: <strong>${this.moves}</strong><br>
                耗時: <strong>${this.timerEl.textContent}</strong>
            `;
            document.getElementById('init-game-btn').textContent = '重新初始化';
            this.overlay.classList.add('active');
        }, 800);
    }

    /* === AutoPilot Algorithm === */
    _toggleAuto() {
        this.autoMode = !this.autoMode;
        const s = document.getElementById('auto-pilot-status');
        const t = document.getElementById('auto-pilot-toggle');
        s.textContent = this.autoMode ? 'ON' : 'OFF';
        t.classList.toggle('active', this.autoMode);

        if(this.autoMode && this.gameActive && this.STATE === 'IDLE') this._runAutoStep();
    }

    _runAutoStep() {
        if(!this.autoMode || !this.gameActive || this.STATE !== 'IDLE') return;

        // 1. Check if we know any full pairs in memory
        let executionTarget = null;
        for (let [sym, indices] of this.aiMemory.entries()) {
            const unMatchedIndices = indices.filter(idx => !this.cards[idx].matched);
            if (unMatchedIndices.length === 2) {
                executionTarget = unMatchedIndices;
                break;
            }
        }

        if (executionTarget) {
            // Execute match protocol
            this._aiClick(executionTarget[0]);
            setTimeout(() => {
                if(!this.autoMode) return;
                this._aiClick(executionTarget[1]);
                setTimeout(() => this._runAutoStep(), 800);
            }, 600);
            return;
        }

        // 2. Explore: pick a random unknown card
        const unknowns = this.cards.filter(c => !c.flipped && !c.matched && !this._isKnownInMem(c.idx));
        if (unknowns.length > 0) {
            const pick1 = unknowns[Math.floor(Math.random() * unknowns.length)];
            this._aiClick(pick1.idx);

            setTimeout(() => {
                if(!this.autoMode) return;
                // After flipping, check memory again OR randomly guess another
                const knownMatch = this.aiMemory.get(pick1.sym).find(idx => idx !== pick1.idx && !this.cards[idx].matched);
                if (knownMatch !== undefined) {
                    this._aiClick(knownMatch);
                } else {
                    const unknowns2 = this.cards.filter(c => !c.flipped && !c.matched && !this._isKnownInMem(c.idx));
                    if (unknowns2.length > 0) {
                        const pick2 = unknowns2[Math.floor(Math.random() * unknowns2.length)];
                        this._aiClick(pick2.idx);
                    }
                }
                
                // Wait for resolving delay + extra
                setTimeout(() => this._runAutoStep(), this.config.delay + 400);

            }, 600);
        }
    }

    _isKnownInMem(idx) {
        for (let indices of this.aiMemory.values()) {
            if (indices.includes(idx)) return true;
        }
        return false;
    }

    _aiClick(idx) {
        if(!this.gameActive) return;
        const card = this.cards[idx];
        if (card && !card.flipped && !card.matched) {
            const prevState = this.autoMode;
            this.autoMode = false; // Briefly bypass guard
            this._onCardClick(card.dom);
            this.autoMode = prevState;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => { new EliteEngine(); });
