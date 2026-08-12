/**
 * UTT-v2.0 Tank Engineering: Motion & Projectile Logic
 */
class Tank {
    constructor(x, y, type='enemy', color='#e74c3c') {
        this.x = x; this.y = y; this.type = type; this.color = color;
        this.w = 32; this.h = 32; this.dir = 0; // 0U, 1R, 2D, 3L
        this.v = (type === 'player') ? 3 : 2;
        this.bullets = [];
        this.health = (type === 'player') ? 100 : 1;
        this.destroyed = false;
        this.lastFire = 0;
    }

    draw(ctx) {
        ctx.save(); ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        ctx.rotate(this.dir * Math.PI / 2);
        
        ctx.fillStyle = this.color; 
        ctx.fillRect(-this.w/2, -this.h/2, this.w, this.h);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.w/2, -this.h/2, this.w, this.h);
        
        ctx.fillStyle = '#fff'; ctx.fillRect(-this.w/2+14, -this.h/2-10, 4, 15); // Cannon
        
        ctx.restore();
        this.drawBullets(ctx);
    }

    fire() {
        const time = Date.now();
        if (time - this.lastFire < 800) return;
        this.lastFire = time;
        const b = { x: this.x + 14, y: this.y + 14, d: this.dir, v: 6 };
        this.bullets.push(b);
    }

    update(map, tanks) {
        this.bullets.forEach((b, i) => {
            if (b.d === 0) b.y -= b.v; if (b.d === 1) b.x += b.v;
            if (b.d === 2) b.y += b.v; if (b.d === 3) b.x -= b.v;
            if (b.x < 0 || b.x > 600 || b.y < 0 || b.y > 600) this.bullets.splice(i, 1);
            
            // Check tile collision
            const r = Math.floor(b.y / 30); const c = Math.floor(b.x / 30);
            if (r >= 0 && r < 20 && c >= 0 && c < 20) {
                const type = map.grid[r][c];
                if (type === 1) { map.grid[r][c] = 0; this.bullets.splice(i, 1); } // Break brick
                if (type === 2) { this.bullets.splice(i, 1); } // Steel block
                if (type === 9) { 
                    window.dispatchEvent(new CustomEvent('gameOverBase'));
                }
            }
        });
    }

    drawBullets(ctx) {
        this.bullets.forEach(b => {
            ctx.fillStyle = '#f1c40f'; ctx.fillRect(b.x, b.y, 4, 4);
        });
    }
}
