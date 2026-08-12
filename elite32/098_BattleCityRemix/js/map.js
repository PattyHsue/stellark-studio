/**
 * UTT-v2.0 Map Engineering: Grid & Tile Rendering
 */
class BattleMap {
    constructor(ctx, size=20) {
        this.ctx = ctx;
        this.size = size;
        this.grid = Array.from({length: size}, () => Array(size).fill(0));
        this.tileSize = 600 / size;
    }

    loadLevel(lvl) {
        // Simple map generation for Stage 1
        this.grid = lvl;
    }

    draw() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const type = this.grid[r][c];
                const x = c * this.tileSize;
                const y = r * this.tileSize;
                this.drawTile(x, y, type);
            }
        }
    }

    drawTile(x, y, type) {
        const s = this.tileSize;
        switch (type) {
            case 1: // Procedural Brick
                this.ctx.fillStyle = '#8e44ad'; this.ctx.fillRect(x, y, s, s);
                this.ctx.strokeStyle = 'rgba(0,0,0,0.3)'; this.ctx.lineWidth = 1;
                // Draw internal brick lines
                this.ctx.strokeRect(x,y,s/2,s/2); this.ctx.strokeRect(x+s/2,y+s/2,s/2,s/2);
                this.ctx.fillStyle = 'rgba(255,255,255,0.1)'; this.ctx.fillRect(x,y,s,2); // Highlight
                break;
            case 2: // Metallic Steel
                let grad = this.ctx.createLinearGradient(x, y, x+s, y+s);
                grad.addColorStop(0, '#bdc3c7'); grad.addColorStop(0.5, '#7f8c8d'); grad.addColorStop(1, '#2c3e50');
                this.ctx.fillStyle = grad; this.ctx.fillRect(x, y, s, s);
                // Rivets/Bolts
                this.ctx.fillStyle = '#ecf0f1';
                [2, s-4].forEach(bx => [2, s-4].forEach(by => this.ctx.fillRect(x+bx, y+by, 2, 2)));
                break;
            case 3: // Dynamic Water (Refraction shimmer)
                this.ctx.fillStyle = '#2980b9'; this.ctx.fillRect(x, y, s, s);
                this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                this.ctx.beginPath(); this.ctx.moveTo(x, y+s/2); this.ctx.lineTo(x+s,y+s/2); this.ctx.stroke();
                break;
            case 9: // Remastered Eagle Base
                this.ctx.shadowBlur = 10; this.ctx.shadowColor = '#f39c12';
                this.ctx.fillStyle = '#f1c40f'; // Body
                this.ctx.beginPath(); this.ctx.moveTo(x+s/2, y+5);
                this.ctx.quadraticCurveTo(x+5, y+s-5, x+s/2, y+s-10);
                this.ctx.quadraticCurveTo(x+s-5, y+s-5, x+s/2, y+5); this.ctx.fill();
                this.ctx.fillStyle = '#d35400'; this.ctx.fillRect(x+s/2-2, y+s/2, 4, 10); // Core
                this.ctx.shadowBlur = 0;
                break;
        }
    }

    // Overlay (bushes) drawn AFTER tanks
    drawOverlay() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 4) {
                    this.ctx.fillStyle = 'rgba(46, 204, 113, 0.4)';
                    this.ctx.fillRect(c*this.tileSize, r*this.tileSize, this.tileSize, this.tileSize);
                }
            }
        }
    }
}
