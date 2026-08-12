/**
 * ============================================================
 * 022_MINESWEEPER | 掃雷英雄
 * UTT-v2.0 MASTER-GRADE ENGINE | © 2026 Project Chimera
 *
 * Architecture (Xavier): Grid Logic & Canvas Renderer
 *  - BoardEngine: Constructs constraint logic graph, guarantees safe first click.
 *  - RecursiveReveal (Ada): Depth-First Search (DFS) for opening empty zero-spaces.
 *  - AI Solver (Arthur): Applies deterministic CSP (Constraint Satisfaction) rules for AutoPilot.
 *  - RadarCanvas: High-performance primitive rendering for scalable grids (16x30).
 * ============================================================
 */
'use strict';

class AudioManager {
    constructor() { this.on = true; }
    init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ this.on=false; } }
    wake() { if (this.ctx?.state === 'suspended') this.ctx.resume(); }
    play(t) {
        if (!this.on || !this.ctx) return;
        const now = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.connect(g); g.connect(this.ctx.destination);
        if (t === 'click') {
            o.type = 'sine'; o.frequency.setValueAtTime(800, now); o.frequency.exponentialRampToValueAtTime(300, now+0.1);
            g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.1);
            o.start(now); o.stop(now+0.1);
        } else if (t === 'flag') {
            o.type = 'square'; o.frequency.setValueAtTime(1000, now); o.frequency.setValueAtTime(1200, now+0.05);
            g.gain.setValueAtTime(0.05, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.1);
            o.start(now); o.stop(now+0.1);
        } else if (t === 'explode') {
            o.type = 'sawtooth'; o.frequency.setValueAtTime(100, now); o.frequency.exponentialRampToValueAtTime(20, now+0.5);
            g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.5);
            o.start(now); o.stop(now+0.5);
        } else if (t === 'win') {
            o.type = 'triangle'; [523, 659, 784, 1047].forEach((f, i) => o.frequency.setValueAtTime(f, now+i*0.1));
            g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.001, now+1.0);
            o.start(now); o.stop(now+1.0);
        }
    }
}

class BoardEngine {
    constructor(rows, cols, totalMines) {
        this.R = rows; this.C = cols; this.M = totalMines;
        this.grid = []; this.flaggedCount = 0; this.openedCount = 0;
        this.generated = false;
        
        for (let r=0; r<this.R; r++) {
            this.grid[r] = [];
            for (let c=0; c<this.C; c++) {
                this.grid[r][c] = { mine: false, open: false, flag: false, value: 0 };
            }
        }
    }

    _getNeighbors(r, c) {
        const res = [];
        for (let dr=-1; dr<=1; dr++) {
            for (let dc=-1; dc<=1; dc++) {
                if (dr===0 && dc===0) continue;
                const nr = r+dr, nc = c+dc;
                if (nr>=0 && nr<this.R && nc>=0 && nc<this.C) res.push([nr,nc]);
            }
        }
        return res;
    }

    generate(firstR, firstC) {
        let placed = 0;
        // Guaranteed safe zone around first click
        const safeZone = this._getNeighbors(firstR, firstC).map(([r,c]) => `${r},${c}`);
        safeZone.push(`${firstR},${firstC}`);

        while (placed < this.M) {
            const r = Math.floor(Math.random() * this.R);
            const c = Math.floor(Math.random() * this.C);
            if (!this.grid[r][c].mine && !safeZone.includes(`${r},${c}`)) {
                this.grid[r][c].mine = true;
                placed++;
            }
        }

        for (let r=0; r<this.R; r++) {
            for (let c=0; c<this.C; c++) {
                if(this.grid[r][c].mine) continue;
                const n = this._getNeighbors(r,c);
                this.grid[r][c].value = n.filter(([nr,nc]) => this.grid[nr][nc].mine).length;
            }
        }
        this.generated = true;
    }

    // Depth-First Search for cascading zero-open
    reveal(r, c) {
        if (!this.generated) this.generate(r, c);
        const cell = this.grid[r][c];
        if (cell.open || cell.flag) return { hit: false };
        if (cell.mine) return { hit: true };

        cell.open = true;
        this.openedCount++;
        
        if (cell.value === 0) {
            const q = [[r,c]];
            while(q.length > 0) {
                const [cr, cc] = q.pop();
                for (let [nr, nc] of this._getNeighbors(cr, cc)) {
                    const adj = this.grid[nr][nc];
                    if (!adj.open && !adj.flag) {
                        adj.open = true;
                        this.openedCount++;
                        if (adj.value === 0) q.push([nr, nc]);
                    }
                }
            }
        }
        return { hit: false };
    }

    toggleFlag(r, c) {
        if(!this.generated) return;
        const cell = this.grid[r][c];
        if (cell.open) return;
        cell.flag = !cell.flag;
        this.flaggedCount += cell.flag ? 1 : -1;
    }

    checkWin() {
        return (this.openedCount === (this.R * this.C - this.M));
    }
}

class EliteEngine {
    constructor() {
        this.cvs = document.getElementById('stage');
        this.ctx = this.cvs.getContext('2d');
        this.overlay = document.getElementById('game-overlay');
        this.minesEl = document.getElementById('mines-val');
        this.timerEl = document.getElementById('timer-val');
        
        this.audio = new AudioManager();
        this.board = null;
        this.cellSize = 36;
        
        this.config = {rows:9, cols:9, mines:10};
        this.gameActive = false;
        this.autoMode = false;
        this.flagMode = false;
        
        this.timer = 0;
        this.timerIv = null;

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
        
        const fBtn = document.getElementById('flag-btn');
        fBtn.addEventListener('click', () => {
            this.flagMode = !this.flagMode;
            fBtn.classList.toggle('active', this.flagMode);
            fBtn.innerHTML = this.flagMode ? '<span class="icon">🚩</span> 標記模式: 開' : '<span class="icon">🚩</span> 標記模式: 關';
        });

        const clickHandler = (e) => this._onInteract(e);
        this.cvs.addEventListener('mousedown', clickHandler);
        this.cvs.addEventListener('contextmenu', e => { e.preventDefault(); this._onInteract(e, true); });
    }

    _startGame() {
        this.audio.init(); this.audio.wake();
        this.board = new BoardEngine(this.config.rows, this.config.cols, this.config.mines);
        
        // Responsive Cell Size Based on Screen
        const maxW = window.innerWidth - 40;
        const maxH = window.innerHeight - document.getElementById('hud-bar').clientHeight - 40;
        const cpW = Math.floor(maxW / this.config.cols);
        const cpH = Math.floor(maxH / this.config.rows);
        this.cellSize = Math.min(Math.max(cpW, cpH, 20), 40);

        this.cvs.width = this.cellSize * this.config.cols;
        this.cvs.height = this.cellSize * this.config.rows;
        
        this.gameActive = true;
        this.timer = 0;
        this._updateHUD();
        this.overlay.classList.remove('active');
        
        clearInterval(this.timerIv);
        this.timerIv = setInterval(() => {
            if(!this.gameActive) return;
            this.timer++;
            this.timerEl.textContent = String(this.timer).padStart(3, '0');
        }, 1000);

        this._render();
    }

    _onInteract(e, isRigthClick = false) {
        if(!this.gameActive || this.autoMode) return;
        this.audio.wake();
        const rect = this.cvs.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const c = Math.floor(mx / this.cellSize);
        const r = Math.floor(my / this.cellSize);
        
        if (r<0||c<0||r>=this.board.R||c>=this.board.C) return;

        const isFlagAction = isRigthClick || (e.button === 2) || this.flagMode;

        if (isFlagAction) {
            this.board.toggleFlag(r, c);
            this.audio.play('flag');
        } else {
            if (this.board.grid[r][c].flag) return; // Prevent clicking flags
            const { hit } = this.board.reveal(r, c);
            if (hit) this._endGame(false);
            else {
                this.audio.play('click');
                if (this.board.checkWin()) this._endGame(true);
            }
        }
        this._updateHUD();
        this._render();
    }

    _render() {
        const { ctx, cvs, cellSize: s, board } = this;
        ctx.clearRect(0,0,cvs.width, cvs.height);

        const colors = ['#0ea5e9', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4', '#d946ef', '#64748b'];

        for(let r=0; r<board.R; r++) {
            for(let c=0; c<board.C; c++) {
                const x = c*s, y = r*s;
                const cell = board.grid[r][c];

                if (!cell.open) {
                    // Closed state Glassmorphism
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(x, y, s, s);
                    ctx.strokeStyle = '#1e293b';
                    ctx.strokeRect(x, y, s, s);
                    ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
                    ctx.fillRect(x+2, y+2, s-4, s-4);
                    
                    if (cell.flag) {
                        ctx.fillStyle = '#ef4444'; ctx.font = `bold ${s*0.5}px var(--font-main)`;
                        ctx.textAlign='center'; ctx.textBaseline='middle';
                        ctx.fillText('🚩', x+s/2, y+s/2 + 2);
                    }
                } else {
                    // Revealed state
                    ctx.fillStyle = cell.mine ? '#ef4444' : '#020617';
                    ctx.fillRect(x, y, s, s);
                    ctx.strokeStyle = '#1e293b';
                    ctx.strokeRect(x, y, s, s);
                    
                    if (cell.mine) {
                        ctx.fillStyle = '#fff'; ctx.font = `bold ${s*0.6}px var(--font-main)`;
                        ctx.textAlign='center'; ctx.textBaseline='middle';
                        ctx.fillText('💣', x+s/2, y+s/2+2);
                    } else if (cell.value > 0) {
                        ctx.fillStyle = colors[cell.value-1];
                        ctx.font = `bold ${s*0.6}px var(--font-main)`;
                        ctx.textAlign='center'; ctx.textBaseline='middle';
                        ctx.fillText(cell.value.toString(), x+s/2, y+s/2+2);
                    }
                }
            }
        }
    }

    _updateHUD() {
        const rem = this.config.mines - this.board.flaggedCount;
        this.minesEl.textContent = String(rem).padStart(3, '0');
        if (rem < 0) this.minesEl.classList.add('danger');
        else this.minesEl.classList.remove('danger');
    }

    _endGame(win) {
        this.gameActive = false;
        clearInterval(this.timerIv);
        if (this.autoMode) this._toggleAuto();

        // Reveal all mines if lose
        if (!win) {
            for(let r=0; r<this.board.R; r++) {
                for(let c=0; c<this.board.C; c++) {
                    if(this.board.grid[r][c].mine) this.board.grid[r][c].open = true;
                }
            }
            this._render();
            this.audio.play('explode');
        } else {
            this.audio.play('win');
        }

        setTimeout(() => {
            const h2 = this.overlay.querySelector('h2');
            const sub = this.overlay.querySelector('.subtitle');
            h2.textContent = win ? '🎉 雷區解除！' : '💥 觸發地雷';
            if (win) { h2.classList.remove('lose-text'); } else { h2.classList.add('lose-text'); }
            
            sub.innerHTML = `
                難度: <strong>${this.config.rows}x${this.config.cols}</strong><br>
                耗時: <strong>${this.timer}s</strong>
            `;
            document.getElementById('init-game-btn').textContent = '重新佈署';
            this.overlay.classList.add('active');
        }, 1500);
    }

    /* === AI AutoPilot constraint satisfaction === */
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
        let actionTaken = false;

        // If not started, click center
        if(!this.board.generated) {
            this.board.reveal(Math.floor(this.config.rows/2), Math.floor(this.config.cols/2));
            actionTaken = true;
        } else {
            // Rule 1: Find implicit mines (Unopened neighbors == Value - Flags)
            // Rule 2: Open safe cells (Flags == Value)
            
            for(let r=0; r<this.board.R; r++) {
                if(actionTaken) break;
                for(let c=0; c<this.board.C; c++) {
                    const cell = this.board.grid[r][c];
                    if(!cell.open || cell.value === 0) continue;
                    
                    const neighbors = this.board._getNeighbors(r, c);
                    let flagCount = 0;
                    const closed = [];
                    
                    neighbors.forEach(([nr, nc]) => {
                        if (this.board.grid[nr][nc].flag) flagCount++;
                        else if (!this.board.grid[nr][nc].open) closed.push([nr,nc]);
                    });

                    // Rule 1
                    if (closed.length > 0 && closed.length === (cell.value - flagCount)) {
                        closed.forEach(([nr,nc]) => { this.board.toggleFlag(nr,nc); actionTaken = true; });
                        if(actionTaken) { this.audio.play('flag'); break; }
                    }

                    // Rule 2
                    if (closed.length > 0 && flagCount === cell.value) {
                        closed.forEach(([nr,nc]) => { this.board.reveal(nr,nc); actionTaken = true; });
                        if(actionTaken) { this.audio.play('click'); break; }
                    }
                }
            }
            
            // If stuck, just guess randomly amongst unflagged closed cells
            if(!actionTaken) {
                const choices = [];
                for(let r=0; r<this.board.R; r++) {
                    for(let c=0; c<this.board.C; c++) {
                        if(!this.board.grid[r][c].open && !this.board.grid[r][c].flag) choices.push([r,c]);
                    }
                }
                if(choices.length > 0) {
                    const [r,c] = choices[Math.floor(Math.random()*choices.length)];
                    if(this.board.reveal(r,c).hit) { this._endGame(false); return; }
                    this.audio.play('click');
                    actionTaken = true;
                }
            }
        }

        if(actionTaken) {
            this._updateHUD();
            this._render();
            if (this.board.checkWin() && this.gameActive) this._endGame(true);
            else setTimeout(() => this._runAutoStep(), 300);
        } else {
            this._toggleAuto(); // Turn off if truly stuck
        }
    }
}

document.addEventListener('DOMContentLoaded', () => { new EliteEngine(); });
