# 幾何律動 (Tetris Remix) 核心工程源碼

這份純文字文件整合了 JavaScript 源碼，專供 NotebookLM 分析使用。它包含了 AI 權重演算法、純代碼繪圖與音訊頻率合成邏輯。

## 檔案：ai.js
`javascript
/**
 * UTT-v2.0 Intelligence: Heuristic Tetris AI (Auto-Pilot)
 * Responsibility: Ada (Logic Scientist) & Xavier (Software Architect)
 */

class TetrisAI {
    constructor() {
        // Heuristic Weights (Standard Pierre Dellacherie / Genetic Optimized)
        this.weights = {
            height: -0.51,
            lines: 0.76,
            holes: -0.35,
            bumpiness: -0.18
        };
    }

    /**
     * Find the best move for the current piece
     * @param {TetrisEngine} engine 
     */
    /**
     * Find the best move considering both the active piece and the hold piece
     */
    bestMove(engine) {
        // 1. Evaluate current piece
        let currentBest = this.evaluatePiece(engine.grid, engine.activePiece.key, engine.cols);
        
        // 2. Evaluate hold piece (if allowed)
        let holdBest = null;
        if (engine.canHold) {
            const holdKey = engine.holdPiece ? engine.holdPiece.key : engine.nextPiece.key;
            holdBest = this.evaluatePiece(engine.grid, holdKey, engine.cols);
        }

        // 3. Compare and decide
        if (holdBest && holdBest.score > currentBest.score) {
            return { ...holdBest, shouldSwap: true };
        }
        return { ...currentBest, shouldSwap: false };
    }

    evaluatePiece(grid, pieceKey, cols) {
        let bestScore = -Infinity;
        let bestMove = null;
        const baseMatrix = SHAPES[pieceKey].matrix.map(row => [...row]);

        for (let r = 0; r < 4; r++) {
            let matrix = this.rotateMatrix(baseMatrix, r);
            for (let x = -2; x <= cols; x++) {
                if (this.checkCollision(grid, matrix, { x, y: 0 })) continue;
                let y = this.getDropHeight(grid, matrix, x);
                let score = this.evaluate(grid, matrix, x, y);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { x, rotation: r, score: score };
                }
            }
        }
        return bestMove;
    }

    rotateMatrix(matrix, times) {
        let m = matrix.map(row => [...row]);
        for (let i = 0; i < times; i++) {
            // Transpose
            m = m[0].map((_, colIndex) => m.map(row => row[colIndex]));
            // Reverse rows
            m.forEach(row => row.reverse());
        }
        return m;
    }

    getDropHeight(grid, matrix, x) {
        let y = 0;
        while (!this.checkCollision(grid, matrix, { x, y: y + 1 })) {
            y++;
        }
        return y;
    }

    checkCollision(grid, matrix, pos) {
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x] !== 0) {
                    let ny = pos.y + y;
                    let nx = pos.x + x;
                    if (ny >= grid.length || nx < 0 || nx >= grid[0].length || (ny >= 0 && grid[ny][nx] !== 0)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    evaluate(grid, matrix, px, py) {
        // Clone grid and place piece
        const rows = grid.length;
        const cols = grid[0].length;
        const tempGrid = grid.map(row => [...row]);
        
        matrix.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val !== 0 && py + y >= 0) {
                    tempGrid[py + y][px + x] = 1;
                }
            });
        });

        // Calculate features
        let linesCleared = 0;
        for (let y = 0; y < rows; y++) {
            if (tempGrid[y].every(cell => cell !== 0)) {
                linesCleared++;
                tempGrid.splice(y, 1);
                tempGrid.unshift(Array(cols).fill(0));
            }
        }

        const heights = this.getHeights(tempGrid);
        const aggregateHeight = heights.reduce((a, b) => a + b, 0);
        const holes = this.countHoles(tempGrid);
        const bumpiness = this.getBumpiness(heights);

        return (aggregateHeight * this.weights.height) +
               (linesCleared * this.weights.lines) +
               (holes * this.weights.holes) +
               (bumpiness * this.weights.bumpiness);
    }

    getHeights(grid) {
        const cols = grid[0].length;
        const rows = grid.length;
        let heights = Array(cols).fill(0);
        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                if (grid[y][x] !== 0) {
                    heights[x] = rows - y;
                    break;
                }
            }
        }
        return heights;
    }

    countHoles(grid) {
        let holes = 0;
        for (let x = 0; x < grid[0].length; x++) {
            let blockFound = false;
            for (let y = 0; y < grid.length; y++) {
                if (grid[y][x] !== 0) blockFound = true;
                else if (blockFound) holes++;
            }
        }
        return holes;
    }

    getBumpiness(heights) {
        let bumpiness = 0;
        for (let i = 0; i < heights.length - 1; i++) {
            bumpiness += Math.abs(heights[i] - heights[i + 1]);
        }
        return bumpiness;
    }
}

`

## 檔案：audio.js
`javascript
/**
 * UTT-v2.0 Audio: Cyber-Rhythm Synthesis
 * Responsibility: Tessa (Technical Designer)
 */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.bpm = 120;
        this.beatCount = 0;
    }

    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    start() {
        this.isPlaying = true;
        this.tick();
    }

    stop() {
        this.isPlaying = false;
    }

    tick() {
        if (!this.isPlaying) return;
        
        const interval = (60 / this.bpm) * 1000 / 2; // Eighth notes
        this.playBeat(this.beatCount % 8);
        this.beatCount++;
        
        setTimeout(() => this.tick(), interval);
    }

    playBeat(step) {
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        
        // Bass Drum (Step 0, 4)
        if (step % 4 === 0) this.synthKick(time);
        
        // Hi-Hat (Step 2, 6)
        if (step % 2 === 1) this.synthHiHat(time);
        
        // Bass Line (Melodic)
        const notes = [110, 110, 164, 110, 146, 110, 130, 220]; // A2, E3...
        this.synthBass(time, notes[step]);
    }

    synthKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.1);
    }

    synthHiHat(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(2000, time);
        gain.gain.setValueAtTime(0.05, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.05);
    }

    synthBass(time, freq) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.2);
    }
    
    playClear(count) {
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        const baseFreq = 440;
        
        for (let i = 0; i < count; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const freq = baseFreq * Math.pow(1.2, i); // Harmonic increase
            
            osc.frequency.setValueAtTime(freq, time + i * 0.05);
            osc.frequency.exponentialRampToValueAtTime(freq * 2, time + i * 0.05 + 0.1);
            
            gain.gain.setValueAtTime(0.1, time + i * 0.05);
            gain.gain.linearRampToValueAtTime(0, time + i * 0.05 + 0.1);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time + i * 0.05);
            osc.stop(time + i * 0.05 + 0.1);
        }
    }

    playLand() {
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, time);
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.linearRampToValueAtTime(0, time + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.1);
    }
}

`

## 檔案：renderer.js
`javascript
/**
 * UTT-v2.0 Visuals: Tetris Remix Renderer (Canvas 2D)
 * Responsibility: Victor (Director) & Maya (Artist)
 */

class Renderer {
    constructor(gameCanvas, holdCanvas, nextCanvas) {
        this.canvas = gameCanvas;
        this.ctx = gameCanvas.getContext('2d');
        this.holdCtx = holdCanvas.getContext('2d');
        this.nextCtx = nextCanvas.getContext('2d');
        
        this.cols = 10;
        this.rows = 20;
        this.blockSize = 30; // Will be scaled
        this.ghostEnabled = true;
        
        // Procedural Bio-Animation
        this.creatures = Array.from({ length: 5 }, () => ({
            x: Math.random() * 500,
            y: Math.random() * 800,
            size: Math.random() * 20 + 10,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.5 + 0.2,
            color: `hsla(${Math.random() * 360}, 70%, 70%, 0.1)`
        }));
    }

    resize(container) {
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.blockSize = this.canvas.width / this.cols;

        [this.holdCtx.canvas, this.nextCtx.canvas].forEach(cvs => {
            const parent = cvs.parentElement;
            cvs.width = parent.clientWidth;
            cvs.height = parent.clientWidth;
        });
    }

    draw(engine, effects) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 0. Bio-Animation Background
        this.drawBioAnimation();

        // 1. Grid Lines
        this.ctx.strokeStyle = 'rgba(0, 242, 254, 0.05)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.cols; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.blockSize, 0);
            this.ctx.lineTo(x * this.blockSize, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.rows; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.blockSize);
            this.ctx.lineTo(this.canvas.width, y * this.blockSize);
            this.ctx.stroke();
        }

        // 2. Locked Pieces
        engine.grid.forEach((row, y) => {
            row.forEach((color, x) => {
                if (color !== 0) this.drawBlock(this.ctx, x, y, color);
            });
        });

        // 3. Ghost Piece
        if (this.ghostEnabled && engine.activePiece) {
            let ghostPos = engine.getGhostPos();
            this.drawMatrix(this.ctx, engine.activePiece.matrix, ghostPos, engine.activePiece.color, 0.15);
        }

        // 4. Active Piece
        if (engine.activePiece) {
            this.drawMatrix(this.ctx, engine.activePiece.matrix, engine.activePiece.pos, engine.activePiece.color, 1);
        }

        // 5. Particles / VFX
        if (effects) {
            effects.update();
            effects.draw(this.ctx);
        }

        // 6. Sidebars
        this.drawSubCanvas(this.holdCtx, engine.holdPiece, !engine.canHold);
        this.drawSubCanvas(this.nextCtx, engine.nextPiece);
    }

    drawBioAnimation() {
        this.ctx.save();
        this.creatures.forEach(c => {
            c.y -= c.speed;
            c.phase += 0.02;
            const ox = Math.sin(c.phase) * 20;
            if (c.y < -50) c.y = this.canvas.height + 50;

            this.ctx.fillStyle = c.color;
            this.ctx.beginPath();
            // Draw a Jellyfish-like creature
            this.ctx.arc(c.x + ox, c.y, c.size, Math.PI, 0);
            this.ctx.fill();
            
            // Tentacles
            for (let i = 0; i < 3; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(c.x + ox - c.size + (i * c.size), c.y);
                this.ctx.quadraticCurveTo(c.x + ox, c.y + c.size * 1.5, c.x + ox - c.size + (i * c.size) + Math.sin(c.phase + i) * 10, c.y + c.size * 2);
                this.ctx.strokeStyle = c.color;
                this.ctx.stroke();
            }
        });
        this.ctx.restore();
    }

    drawMatrix(ctx, matrix, pos, color, alpha = 1) {
        ctx.globalAlpha = alpha;
        matrix.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val !== 0) {
                    this.renderBlock(ctx, (pos.x + x) * this.blockSize, (pos.y + y) * this.blockSize, this.blockSize, color);
                }
            });
        });
        ctx.globalAlpha = 1;
    }

    drawBlock(ctx, x, y, color) {
        this.renderBlock(ctx, x * this.blockSize, y * this.blockSize, this.blockSize, color);
    }

    renderBlock(ctx, px, py, size, color) {
        const pad = 2;
        const drawSize = size - pad * 2;
        
        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowBlur = size / 2;
        ctx.shadowColor = color;
        
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(px + pad, py + pad, drawSize, drawSize, size / 8);
        } else {
            ctx.rect(px + pad, py + pad, drawSize, drawSize);
        }
        ctx.fill();
        
        // Bloom inner
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(px + pad + 2, py + pad + 2, drawSize / 3, 2);
        
        ctx.restore();
    }

    drawSubCanvas(ctx, piece, isLocked = false) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        if (!piece) return;
        
        ctx.save();
        if (isLocked) {
            ctx.globalAlpha = 0.3; // Dim the hold piece if already used
            ctx.filter = 'grayscale(100%)';
        }
        
        const m = piece.matrix;
        const bs = ctx.canvas.width / 5; 
        const ox = (ctx.canvas.width - m[0].length * bs) / 2;
        const oy = (ctx.canvas.height - m.length * bs) / 2;
        
        m.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val !== 0) {
                    this.renderBlock(ctx, ox + x * bs, oy + y * bs, bs, piece.color);
                }
            });
        });
        ctx.restore();
    }
}

`

