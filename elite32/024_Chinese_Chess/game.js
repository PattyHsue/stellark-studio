/**
 * ============================================================
 * 024_CHINESE_CHESS | 象棋
 * UTT-v2.0 MASTER-GRADE ENGINE | © 2026 Project Chimera
 *
 * Architecture (Xavier & Ada):
 *  - BoardEngine: Mathematical 9x10 discrete state representation.
 *  - RulesEngine: Constrained path generation and collision detection (Horse legs, Elephant eyes, Cannon mounts).
 *  - AutoPilot (Arthur): Heuristic AI opponent (1-ply random optimal selection).
 *  - Unified Rendering: Sub-pixel resolution Canvas for lines, DOM components with CSS transitions for animating pieces.
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
        if (t === 'move') {
            o.type = 'sine'; o.frequency.setValueAtTime(400, now); o.frequency.exponentialRampToValueAtTime(100, now+0.1);
            g.gain.setValueAtTime(0.08, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.1);
            o.start(now); o.stop(now+0.1);
        } else if (t === 'capture') {
            o.type = 'sawtooth'; o.frequency.setValueAtTime(200, now); o.frequency.exponentialRampToValueAtTime(50, now+0.2);
            g.gain.setValueAtTime(0.15, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.2);
            o.start(now); o.stop(now+0.2);
        } else if (t === 'check') {
            o.type = 'square'; [600, 800].forEach((f, i) => o.frequency.setValueAtTime(f, now+i*0.1));
            g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.3);
            o.start(now); o.stop(now+0.3);
        } else if (t === 'win') {
            o.type = 'triangle'; [523, 659, 784, 1047].forEach((f, i) => o.frequency.setValueAtTime(f, now+i*0.15));
            g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.001, now+1.0);
            o.start(now); o.stop(now+1.0);
        }
    }
}

// Coordinate System: x in [0,8], y in [0,9]
// Red at y: 5-9; Black at y: 0-4
const INITIAL_STATE = [
    {id:'b_r1', type:'R', color:'black', x:0, y:0, txt:'車'}, {id:'b_h1', type:'H', color:'black', x:1, y:0, txt:'馬'},
    {id:'b_e1', type:'E', color:'black', x:2, y:0, txt:'象'}, {id:'b_a1', type:'A', color:'black', x:3, y:0, txt:'士'},
    {id:'b_k',  type:'K', color:'black', x:4, y:0, txt:'將'}, {id:'b_a2', type:'A', color:'black', x:5, y:0, txt:'士'},
    {id:'b_e2', type:'E', color:'black', x:6, y:0, txt:'象'}, {id:'b_h2', type:'H', color:'black', x:7, y:0, txt:'馬'},
    {id:'b_r2', type:'R', color:'black', x:8, y:0, txt:'車'}, {id:'b_c1', type:'C', color:'black', x:1, y:2, txt:'砲'},
    {id:'b_c2', type:'C', color:'black', x:7, y:2, txt:'砲'}, {id:'b_p1', type:'P', color:'black', x:0, y:3, txt:'卒'},
    {id:'b_p2', type:'P', color:'black', x:2, y:3, txt:'卒'}, {id:'b_p3', type:'P', color:'black', x:4, y:3, txt:'卒'},
    {id:'b_p4', type:'P', color:'black', x:6, y:3, txt:'卒'}, {id:'b_p5', type:'P', color:'black', x:8, y:3, txt:'卒'},
    
    {id:'r_r1', type:'R', color:'red', x:0, y:9, txt:'俥'}, {id:'r_h1', type:'H', color:'red', x:1, y:9, txt:'傌'},
    {id:'r_e1', type:'E', color:'red', x:2, y:9, txt:'相'}, {id:'r_a1', type:'A', color:'red', x:3, y:9, txt:'仕'},
    {id:'r_k',  type:'K', color:'red', x:4, y:9, txt:'帥'}, {id:'r_a2', type:'A', color:'red', x:5, y:9, txt:'仕'},
    {id:'r_e2', type:'E', color:'red', x:6, y:9, txt:'相'}, {id:'r_h2', type:'H', color:'red', x:7, y:9, txt:'傌'},
    {id:'r_r2', type:'R', color:'red', x:8, y:9, txt:'俥'}, {id:'r_c1', type:'C', color:'red', x:1, y:7, txt:'炮'},
    {id:'r_c2', type:'C', color:'red', x:7, y:7, txt:'炮'}, {id:'r_p1', type:'P', color:'red', x:0, y:6, txt:'兵'},
    {id:'r_p2', type:'P', color:'red', x:2, y:6, txt:'兵'}, {id:'r_p3', type:'P', color:'red', x:4, y:6, txt:'兵'},
    {id:'r_p4', type:'P', color:'red', x:6, y:6, txt:'兵'}, {id:'r_p5', type:'P', color:'red', x:8, y:6, txt:'兵'}
];

class RulesEngine {
    constructor(getPieceAt) {
        this.getPieceAt = getPieceAt;
    }

    getValidMoves(piece) {
        let moves = [];
        const {type, color, x, y} = piece;
        const dyDir = color === 'red' ? -1 : 1; 

        const addIfValid = (nx, ny) => {
            if (nx<0 || nx>8 || ny<0 || ny>9) return false;
            const target = this.getPieceAt(nx, ny);
            if (!target || target.color !== color) moves.push({x:nx, y:ny, capture: !!target});
            return !target; // return true if empty (good for sliding pieces)
        };

        if (type === 'K') {
            const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
            dirs.forEach(([dx,dy]) => {
                const nx=x+dx, ny=y+dy;
                if (nx>=3 && nx<=5 && ((color==='red' && ny>=7 && ny<=9) || (color==='black' && ny>=0 && ny<=2))) addIfValid(nx,ny);
            });
            // Flying General Check (done separately to avoid recursion stack)
        } else if (type === 'A') {
            const dirs = [[1,1], [1,-1], [-1,1], [-1,-1]];
            dirs.forEach(([dx,dy]) => {
                const nx=x+dx, ny=y+dy;
                if (nx>=3 && nx<=5 && ((color==='red' && ny>=7 && ny<=9) || (color==='black' && ny>=0 && ny<=2))) addIfValid(nx,ny);
            });
        } else if (type === 'E') {
            const dirs = [[2,2], [2,-2], [-2,2], [-2,-2]];
            dirs.forEach(([dx,dy]) => {
                const nx=x+dx, ny=y+dy;
                if (nx>=0 && nx<=8 && ((color==='red' && ny>=5 && ny<=9) || (color==='black' && ny>=0 && ny<=4))) {
                    if (!this.getPieceAt(x+dx/2, y+dy/2)) addIfValid(nx,ny); // check elephant eye
                }
            });
        } else if (type === 'H') {
            const moves_H = [
                {nx:x+1, ny:y+2, bx:x, by:y+1}, {nx:x-1, ny:y+2, bx:x, by:y+1},
                {nx:x+1, ny:y-2, bx:x, by:y-1}, {nx:x-1, ny:y-2, bx:x, by:y-1},
                {nx:x+2, ny:y+1, bx:x+1, by:y}, {nx:x+2, ny:y-1, bx:x+1, by:y},
                {nx:x-2, ny:y+1, bx:x-1, by:y}, {nx:x-2, ny:y-1, bx:x-1, by:y}
            ];
            moves_H.forEach(m => {
                if (m.nx>=0 && m.nx<=8 && m.ny>=0 && m.ny<=9 && !this.getPieceAt(m.bx, m.by)) addIfValid(m.nx, m.ny);
            });
        } else if (type === 'R') {
            const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
            dirs.forEach(([dx,dy]) => {
                let nx=x+dx, ny=y+dy;
                while(addIfValid(nx,ny)) { nx+=dx; ny+=dy; }
            });
        } else if (type === 'C') {
            const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
            dirs.forEach(([dx,dy]) => {
                let nx=x+dx, ny=y+dy;
                let foundMount = false;
                while(nx>=0 && nx<=8 && ny>=0 && ny<=9) {
                    const target = this.getPieceAt(nx, ny);
                    if (!foundMount) {
                        if (!target) moves.push({x:nx, y:ny, capture:false});
                        else foundMount = true;
                    } else {
                        if (target) {
                            if(target.color !== color) moves.push({x:nx, y:ny, capture:true});
                            break;
                        }
                    }
                    nx+=dx; ny+=dy;
                }
            });
        } else if (type === 'P') {
            addIfValid(x, y+dyDir); // forward
            // Crossed river
            if ((color==='red' && y<=4) || (color==='black' && y>=5)) {
                addIfValid(x-1, y);
                addIfValid(x+1, y);
            }
        }
        
        return moves;
    }

    isFlyingGeneral(piecesArr) {
        const rk = piecesArr.find(p => p.type==='K' && p.color==='red');
        const bk = piecesArr.find(p => p.type==='K' && p.color==='black');
        if(!rk || !bk || rk.x !== bk.x) return false;
        
        for(let y = Math.min(rk.y, bk.y) + 1; y < Math.max(rk.y, bk.y); y++) {
            if (this.getPieceAt(rk.x, y)) return false; // blocked
        }
        return true;
    }
}

class EliteEngine {
    constructor() {
        this.boardBg = document.getElementById('board-bg');
        this.piecesLayer = document.getElementById('pieces-layer');
        this.infoMsg = document.getElementById('turn-display');
        this.overlay = document.getElementById('game-overlay');
        
        this.audio = new AudioManager();
        this.ctx = this.boardBg.getContext('2d');
        
        this.rules = new RulesEngine((x,y) => this.pieces.find(p => p.x===x && p.y===y));
        
        this.padding = 30;
        this.cellSize = 0;
        
        this.gameActive = false;
        this.autoMode = false;
        this.turn = 'red';
        this.pieces = [];
        this.selectedPiece = null;
        this.validMarks = []; // Array of DOM elements
        
        this._bindEvents();
        window.addEventListener('resize', () => { if(this.gameActive) this._resizeAndDraw(); });
    }

    _bindEvents() {
        document.getElementById('init-game-btn').addEventListener('click', () => this._startGame());
        document.getElementById('auto-pilot-toggle').addEventListener('click', () => this._toggleAuto());
    }

    _startGame() {
        this.audio.init(); this.audio.wake();
        this.overlay.classList.remove('active');
        this.gameActive = true;
        this.turn = 'red';
        this.autoMode = false;
        this.selectedPiece = null;
        
        // Deep copy state object
        this.pieces = JSON.parse(JSON.stringify(INITIAL_STATE));
        
        this._resizeAndDraw();
        this._syncDOM();
        this._updateHUD();
    }

    _resizeAndDraw() {
        const wrap = document.getElementById('board-container');
        const W = wrap.parentElement.clientWidth - 20;
        const H = wrap.parentElement.clientHeight - 20;
        
        // Logical grid is 8x9 cells. Canvas should perfectly wrap it.
        const idealCellH = Math.floor((H - this.padding*2) / 9);
        const idealCellW = Math.floor((W - this.padding*2) / 8);
        this.cellSize = Math.max(30, Math.min(idealCellW, idealCellH, 60));
        
        const canvasW = this.cellSize * 8 + this.padding * 2;
        const canvasH = this.cellSize * 9 + this.padding * 2;
        
        wrap.style.width = `${canvasW}px`;
        wrap.style.height = `${canvasH}px`;
        this.boardBg.width = canvasW;
        this.boardBg.height = canvasH;
        
        this._drawBoard();
        if(this.gameActive) this._updatePositionsDOM();
    }

    _drawBoard() {
        const ctx = this.ctx;
        ctx.clearRect(0,0, this.boardBg.width, this.boardBg.height);
        
        ctx.strokeStyle = '#a3a3a3';
        ctx.lineWidth = 2;
        const P = this.padding;
        const S = this.cellSize;
        
        // Horizontal lines
        for(let i=0; i<=9; i++) {
            ctx.beginPath();
            ctx.moveTo(P, P + i*S);
            ctx.lineTo(P + 8*S, P + i*S);
            ctx.stroke();
        }
        
        // Vertical lines (break for river)
        for(let i=0; i<=8; i++) {
            ctx.beginPath();
            ctx.moveTo(P + i*S, P);
            ctx.lineTo(P + i*S, P + 4*S);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(P + i*S, P + 5*S);
            ctx.lineTo(P + i*S, P + 9*S);
            ctx.stroke();
        }
        // Left and Right border connection through river
        ctx.beginPath(); ctx.moveTo(P, P+4*S); ctx.lineTo(P, P+5*S); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(P+8*S, P+4*S); ctx.lineTo(P+8*S, P+5*S); ctx.stroke();

        // Crosses in Palace
        ctx.beginPath(); ctx.moveTo(P+3*S, P); ctx.lineTo(P+5*S, P+2*S); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(P+5*S, P); ctx.lineTo(P+3*S, P+2*S); ctx.stroke();
        
        ctx.beginPath(); ctx.moveTo(P+3*S, P+7*S); ctx.lineTo(P+5*S, P+9*S); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(P+5*S, P+7*S); ctx.lineTo(P+3*S, P+9*S); ctx.stroke();

        // River Text
        ctx.fillStyle = '#a3a3a3';
        ctx.font = `bold ${S*0.8}px var(--font-main)`;
        ctx.textAlign = 'center'; ctx.textBaseline='middle';
        ctx.fillText('楚 河', P + 2*S, P + 4.5*S);
        ctx.fillText('漢 界', P + 6*S, P + 4.5*S);
    }

    _syncDOM() {
        this.piecesLayer.innerHTML = '';
        this.pieces.forEach(p => {
            const el = document.createElement('div');
            el.className = `piece ${p.color}`;
            el.id = p.id;
            el.textContent = p.txt;
            el.addEventListener('click', (e) => { e.stopPropagation(); this._onPieceClick(p); });
            this.piecesLayer.appendChild(el);
        });
        this._updatePositionsDOM();
    }

    _updatePositionsDOM() {
        this.pieces.forEach(p => {
            const el = document.getElementById(p.id);
            if(el) {
                el.style.width = `${this.cellSize * 0.9}px`;
                el.style.height = `${this.cellSize * 0.9}px`;
                el.style.fontSize = `${this.cellSize * 0.6}px`;
                el.style.left = `${this.padding + p.x * this.cellSize}px`;
                el.style.top = `${this.padding + p.y * this.cellSize}px`;
            }
        });
    }

    _clearValidMarks() {
        this.validMarks.forEach(el => el.remove());
        this.validMarks = [];
    }

    _showValidMarks(moves) {
        this._clearValidMarks();
        moves.forEach(m => {
            const el = document.createElement('div');
            el.className = `valid-move ${m.capture ? 'valid-capture' : ''}`;
            el.style.width = `${this.cellSize * 0.5}px`;
            el.style.height = `${this.cellSize * 0.5}px`;
            el.style.left = `${this.padding + m.x * this.cellSize}px`;
            el.style.top = `${this.padding + m.y * this.cellSize}px`;
            
            el.addEventListener('click', () => { this._executeMove(this.selectedPiece, m.x, m.y); });
            this.piecesLayer.appendChild(el);
            this.validMarks.push(el);
        });
    }

    _onPieceClick(p) {
        if (!this.gameActive || (this.autoMode && this.turn === 'black')) return;
        this.audio.wake();
        
        if (p.color === this.turn) {
            // Select piece
            if(this.selectedPiece) document.getElementById(this.selectedPiece.id).classList.remove('selected');
            this.selectedPiece = p;
            document.getElementById(p.id).classList.add('selected');
            
            const moves = this.rules.getValidMoves(p);
            // Filter moves that cause Flying General suicide
            const safeMoves = moves.filter(m => {
                const dummyArr = JSON.parse(JSON.stringify(this.pieces));
                const dp = dummyArr.find(x => x.id === p.id);
                // Remove capture target in simulation
                const targetIdx = dummyArr.findIndex(x => x.x === m.x && x.y === m.y);
                if (targetIdx !== -1) dummyArr.splice(targetIdx, 1);
                dp.x = m.x; dp.y = m.y;
                return !this.rules.isFlyingGeneral(dummyArr);
            });
            
            this._showValidMarks(safeMoves);
        } else if (this.selectedPiece) {
            // Attempt capture
            const marks = this.validMarks.filter(el => el.style.left === `${this.padding + p.x * this.cellSize}px` && el.style.top === `${this.padding + p.y * this.cellSize}px`);
            if (marks.length > 0) {
                this._executeMove(this.selectedPiece, p.x, p.y);
            }
        }
    }

    _executeMove(piece, nx, ny) {
        if(this.selectedPiece) document.getElementById(this.selectedPiece.id).classList.remove('selected');
        this.selectedPiece = null;
        this._clearValidMarks();
        
        // Handle Capture
        const targetIdx = this.pieces.findIndex(p => p.x === nx && p.y === ny);
        let capturedKing = false;
        
        if (targetIdx !== -1) {
            if (this.pieces[targetIdx].type === 'K') capturedKing = true;
            const el = document.getElementById(this.pieces[targetIdx].id);
            el.style.transform = 'translate(-50%, -50%) scale(0)'; setTimeout(()=>el.remove(), 200);
            this.pieces.splice(targetIdx, 1);
            this.audio.play('capture');
        } else {
            this.audio.play('move');
        }

        piece.x = nx;
        piece.y = ny;
        this._updatePositionsDOM();

        if (capturedKing) {
            this._endGame(this.turn);
            return;
        }

        // Switch Turn
        this.turn = this.turn === 'red' ? 'black' : 'red';
        this._updateHUD();

        if (this.autoMode) {
            setTimeout(() => this._runAutoStep(), 500);
        }
    }

    _updateHUD() {
        this.infoMsg.className = `turn-indicator ${this.turn}`;
        this.infoMsg.textContent = this.turn === 'red' ? '紅方 (RED) 行動' : '黑方 (BLACK) 行動';
    }

    _endGame(winnerColor) {
        this.gameActive = false;
        this.audio.play('win');
        if (this.autoMode) this._toggleAuto();

        setTimeout(() => {
            const h2 = document.getElementById('overlay-title');
            const desc = document.getElementById('overlay-desc');
            h2.className = winnerColor === 'red' ? 'win-text' : 'lose-text';
            h2.textContent = winnerColor === 'red' ? '🎉 紅軍勝利' : '💀 黑軍勝利';
            desc.textContent = '神州武士，決戰紫禁之巔';
            
            document.getElementById('init-game-btn').textContent = '再來一局';
            this.overlay.classList.add('active');
        }, 1000);
    }

    /* === AI AutoPilot Simulator === */
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
        
        let allMoves = [];
        this.pieces.filter(p => p.color === this.turn).forEach(p => {
            const moves = this.rules.getValidMoves(p);
            moves.forEach(m => {
                // Ignore suicide moves
                const dummyArr = JSON.parse(JSON.stringify(this.pieces));
                const dp = dummyArr.find(x => x.id === p.id);
                const tIdx = dummyArr.findIndex(x => x.x === m.x && x.y === m.y);
                if (tIdx !== -1) dummyArr.splice(tIdx, 1);
                dp.x = m.x; dp.y = m.y;
                if(!this.rules.isFlyingGeneral(dummyArr)) {
                    // Heuristic: Weight captures heavily
                    const w = m.capture ? 100 : Math.random() * 10;
                    allMoves.push({piece: p, target: m, weight: w});
                }
            });
        });

        if (allMoves.length > 0) {
            allMoves.sort((a,b) => b.weight - a.weight);
            const best = allMoves[0];
            // Animate selection briefly before movement
            document.getElementById(best.piece.id).classList.add('selected');
            setTimeout(() => {
                if(!this.gameActive) return;
                this._executeMove(best.piece, best.target.x, best.target.y);
            }, 500);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => { new EliteEngine(); });
