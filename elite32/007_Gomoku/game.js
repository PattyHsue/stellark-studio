/**
 * ============================================================
 * 007_GOMOKU | 五子棋
 * UTT-v2.0 MASTER-GRADE ENGINE | © 2026 Project Chimera
 *
 * Architecture (Xavier & Ada):
 *  - Virtual Grid: 15x15 intersection matrix.
 *  - Renderer: Base Canvas for procedural grid. Overlay DOM for CSS-animated stones. Top Canvas for winning glow logic.
 *  - Pattern Recognition (Rules): Multi-axis contiguous scan tracking open/closed tail chains.
 *  - AutoPilot Heuristic: Position evaluation by simulating O(1) threat-scores for all empty cells independently.
 * ============================================================
 */
'use strict';

class AudioManager {
    constructor() { this.on = true; }
    init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ this.on = false; } }
    wake() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    play(t) {
        if (!this.on || !this.ctx) return;
        const now = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.connect(g); g.connect(this.ctx.destination);
        if (t === 'place_b') {
            o.type = 'sine'; o.frequency.setValueAtTime(300, now); o.frequency.exponentialRampToValueAtTime(100, now+0.1);
            g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.1);
            o.start(now); o.stop(now+0.1);
        } else if (t === 'place_w') {
            o.type = 'triangle'; o.frequency.setValueAtTime(450, now); o.frequency.exponentialRampToValueAtTime(150, now+0.1);
            g.gain.setValueAtTime(0.15, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.1);
            o.start(now); o.stop(now+0.1);
        } else if (t === 'win') {
            o.type = 'square'; [400, 600, 800, 1200].forEach((f, i) => o.frequency.setValueAtTime(f, now+i*0.15));
            g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.001, now+1.0);
            o.start(now); o.stop(now+1.0);
        }
    }
}

const EMPTY = 0;
const BLACK = 1;
const WHITE = -1;
const GRID_SIZE = 15;

const DIRS = [
    [0, 1],  // Horizontal
    [1, 0],  // Vertical
    [1, 1],  // Diagonal /
    [1, -1]  // Diagonal \
];

class EliteEngine {
    constructor() {
        this.boardBg = document.getElementById('board-bg');
        this.ctxBg = this.boardBg.getContext('2d');
        
        this.winLayer = document.getElementById('win-layer');
        this.ctxWin = this.winLayer.getContext('2d');
        
        this.piecesLayer = document.getElementById('pieces-layer');
        this.boardContainer = document.getElementById('board-container');
        this.infoMsg = document.getElementById('turn-display');
        this.overlay = document.getElementById('game-overlay');
        
        this.audio = new AudioManager();
        
        this.board = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(EMPTY));
        this.gameActive = false;
        this.autoMode = false;
        this.turn = BLACK;
        this.lastMove = null;
        
        this.margin = 30; // Grid padding
        this.cellSize = 0;

        this._bindEvents();
        window.addEventListener('resize', () => { if(this.gameActive) this._resizeAndDraw(); });
    }

    _bindEvents() {
        document.getElementById('init-game-btn').addEventListener('click', () => this._startGame());
        document.getElementById('auto-pilot-toggle').addEventListener('click', () => this._toggleAuto());
        
        // Touch/Mouse handling
        const placeEvent = (e) => this._onInteract(e);
        this.boardContainer.addEventListener('mousedown', placeEvent);
        this.boardContainer.addEventListener('touchstart', e => { e.preventDefault(); placeEvent(e.touches[0]); }, {passive:false});
    }

    _startGame() {
        this.audio.init(); this.audio.wake();
        this.overlay.classList.remove('active');
        this.winLayer.classList.remove('active');
        this.ctxWin.clearRect(0,0, this.winLayer.width, this.winLayer.height);
        
        this.board = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(EMPTY));
        this.piecesLayer.innerHTML = '';
        
        this.turn = BLACK;
        this.gameActive = true;
        this.autoMode = false;
        this.lastMove = null;
        
        this._updateHUD();
        this._resizeAndDraw();
    }

    _resizeAndDraw() {
        // Evaluate maximum available size keeping 1:1 aspect
        const wrap = this.boardContainer.parentElement;
        const W = wrap.clientWidth - 40;
        const H = wrap.clientHeight - 40;
        const size = Math.min(W, H, 800); // Caps out at 800px max
        
        this.cellSize = (size - (this.margin * 2)) / (GRID_SIZE - 1);
        
        this.boardContainer.style.width = `${size}px`;
        this.boardContainer.style.height = `${size}px`;
        
        this.boardBg.width = size; this.boardBg.height = size;
        this.winLayer.width = size; this.winLayer.height = size;
        
        this._drawGrid();
        this._updateStonesDOM();
    }

    _drawGrid() {
        const ctx = this.ctxBg;
        ctx.clearRect(0, 0, this.boardBg.width, this.boardBg.height);
        
        ctx.strokeStyle = '#334155'; // Dark blue-gray for nice tech feel
        ctx.lineWidth = 2;
        
        for (let i = 0; i < GRID_SIZE; i++) {
            const pos = this.margin + i * this.cellSize;
            // Horizontal
            ctx.beginPath(); ctx.moveTo(this.margin, pos); ctx.lineTo(this.boardBg.width - this.margin, pos); ctx.stroke();
            // Vertical
            ctx.beginPath(); ctx.moveTo(pos, this.margin); ctx.lineTo(pos, this.boardBg.height - this.margin); ctx.stroke();
        }
        
        // Draw 5 center/star points (Tengen, Hoshi)
        ctx.fillStyle = '#64748b';
        const stars = [3, 11, 7];
        for (let r of stars) {
            for (let c of stars) {
                if ((r===7 && c!==7) || (c===7 && r!==7)) continue; // Only corners and center
                ctx.beginPath();
                ctx.arc(this.margin + c * this.cellSize, this.margin + r * this.cellSize, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    _onInteract(e) {
        if (!this.gameActive || this.autoMode) return;
        this.audio.wake();
        
        const rect = this.boardContainer.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        // Map to intersecting grid indices
        let c = Math.round((mx - this.margin) / this.cellSize);
        let r = Math.round((my - this.margin) / this.cellSize);
        
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
            if (this.board[r][c] === EMPTY) {
                this._placeStone(r, c, this.turn);
            }
        }
    }

    _placeStone(r, c, player) {
        this.board[r][c] = player;
        this.lastMove = {r, c, player};
        this.audio.play(player === BLACK ? 'place_b' : 'place_w');
        
        // Clear previous last-move indicator
        const prev = this.piecesLayer.querySelector('.last-move');
        if (prev) prev.classList.remove('last-move');
        
        // Add new stone to DOM
        const stone = document.createElement('div');
        stone.className = `stone last-move ${player === BLACK ? 'black' : 'white'}`;
        stone.dataset.r = r; stone.dataset.c = c;
        this.piecesLayer.appendChild(stone);
        
        this._updateStonesDOM();
        
        const winInfo = this._checkWin(r, c, player);
        if (winInfo) {
            this._endGame(player, winInfo);
        } else {
            this.turn *= -1;
            this._updateHUD();
            if (this.autoMode && this.gameActive) {
                setTimeout(() => this._runAutoStep(), 300);
            }
        }
    }

    _updateStonesDOM() {
        const stones = this.piecesLayer.querySelectorAll('.stone');
        stones.forEach(s => {
            const r = parseInt(s.dataset.r);
            const c = parseInt(s.dataset.c);
            s.style.width = `${this.cellSize * 0.85}px`;
            s.style.height = `${this.cellSize * 0.85}px`;
            s.style.left = `${this.margin + c * this.cellSize}px`;
            s.style.top = `${this.margin + r * this.cellSize}px`;
        });
    }

    _checkWin(r, c, player) {
        for (let [dr, dc] of DIRS) {
            let count = 1;
            let blocks = [];
            blocks.push({r,c});
            
            // Forward
            let currR = r + dr, currC = c + dc;
            while(currR >= 0 && currR < GRID_SIZE && currC >= 0 && currC < GRID_SIZE && this.board[currR][currC] === player) {
                count++; blocks.push({r:currR, c:currC});
                currR += dr; currC += dc;
            }
            // Backward
            currR = r - dr; currC = c - dc;
            while(currR >= 0 && currR < GRID_SIZE && currC >= 0 && currC < GRID_SIZE && this.board[currR][currC] === player) {
                count++; blocks.push({r:currR, c:currC});
                currR -= dr; currC -= dc;
            }
            if (count >= 5) return blocks;
        }
        return null;
    }

    _updateHUD() {
        this.infoMsg.className = `turn-indicator ${this.turn === BLACK ? 'black-turn' : 'white-turn'}`;
        this.infoMsg.textContent = this.turn === BLACK ? '⚫ 黑子 (BLACK) 行動' : '⚪ 白子 (WHITE) 行動';
    }

    _drawWinLine(blocks) {
        this.winLayer.classList.add('active');
        const ctx = this.ctxWin;
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 15;
        
        // Sort blocks geographically
        blocks.sort((a,b) => (a.r+a.c) - (b.r+b.c));
        
        ctx.beginPath();
        ctx.moveTo(this.margin + blocks[0].c * this.cellSize, this.margin + blocks[0].r * this.cellSize);
        ctx.lineTo(this.margin + blocks[blocks.length-1].c * this.cellSize, this.margin + blocks[blocks.length-1].r * this.cellSize);
        ctx.stroke();
    }

    _endGame(winnerColor, winBlocks) {
        this.gameActive = false;
        if(this.autoMode) this._toggleAuto();
        this.audio.play('win');
        
        this._drawWinLine(winBlocks);

        setTimeout(() => {
            const h2 = document.getElementById('overlay-title');
            h2.className = 'win-text';
            h2.textContent = winnerColor === BLACK ? '🎉 黑子獲勝' : '🎉 白子獲勝';
            document.getElementById('overlay-desc').innerHTML = `五連珠模式觸發<br>連鎖識別成功`;
            document.getElementById('init-game-btn').textContent = '重置矩陣';
            this.overlay.classList.add('active');
        }, 1200);
    }

    /* === AI Heuristic Evaluation === */
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
        
        let bestScore = -1;
        let bestMoves = [];

        // Evaluates a single line threat
        const evaluateLine = (r, c, dr, dc, player) => {
            let count = 1;
            let blocks = 0;
            
            // Forward
            let fR = r+dr, fC = c+dc;
            while(fR>=0 && fR<GRID_SIZE && fC>=0 && fC<GRID_SIZE && this.board[fR][fC] === player) { count++; fR+=dr; fC+=dc; }
            if (fR<0 || fR>=GRID_SIZE || fC<0 || fC>=GRID_SIZE || this.board[fR][fC] === player * -1) blocks++;
            
            // Backward
            let bR = r-dr, bC = c-dc;
            while(bR>=0 && bR<GRID_SIZE && bC>=0 && bC<GRID_SIZE && this.board[bR][bC] === player) { count++; bR-=dr; bC-=dc; }
            if (bR<0 || bR>=GRID_SIZE || bC<0 || bC>=GRID_SIZE || this.board[bR][bC] === player * -1) blocks++;
            
            if (count >= 5) return 100000;
            if (count === 4 && blocks === 0) return 10000; // Open 4
            if (count === 4 && blocks === 1) return 1000;  // Closed 4
            if (count === 3 && blocks === 0) return 1000;  // Open 3
            if (count === 3 && blocks === 1) return 10;
            if (count === 2 && blocks === 0) return 5;
            return 0;
        };

        // If board is totally empty, play center
        if (this.lastMove === null) {
            this._placeStone(7, 7, this.turn);
            return;
        }

        // Extremely fast O(N) evaluation over all empty cells
        for (let r=0; r<GRID_SIZE; r++) {
            for (let c=0; c<GRID_SIZE; c++) {
                if (this.board[r][c] !== EMPTY) continue;
                
                // Sum threat logic
                let attackScore = 0;
                let defendScore = 0;
                for (let [dr, dc] of DIRS) {
                    attackScore += evaluateLine(r, c, dr, dc, this.turn);
                    defendScore += evaluateLine(r, c, dr, dc, this.turn * -1);
                }
                
                // Combine scores (slightly favor attack if equal)
                let totalScore = attackScore + (defendScore * 0.9);
                
                // Base randomization for identical scores to prevent deterministic loops
                totalScore += Math.random() * 2; 

                if (totalScore > bestScore) {
                    bestScore = totalScore;
                    bestMoves = [{r, c}];
                } else if (Math.abs(totalScore - bestScore) < 1) {
                    bestMoves.push({r, c});
                }
            }
        }

        const choice = bestMoves[Math.floor(Math.random() * bestMoves.length)];
        this._placeStone(choice.r, choice.c, this.turn);
    }
}

document.addEventListener('DOMContentLoaded', () => { new EliteEngine(); });
