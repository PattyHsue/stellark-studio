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
