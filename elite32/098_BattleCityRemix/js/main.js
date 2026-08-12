/**
 * UTT-v2.0 Orchestration: Iron Heart Remix Core
 */
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 600; canvas.height = 600;

    const startView = document.getElementById('start-view');
    const endView = document.getElementById('end-view');
    const retryBtn = document.getElementById('retry-btn');
    const mistakesEl = document.getElementById('e-count');
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('p-lives');
    
    // Core Modules
    const audio = new AudioManager();
    const map = new BattleMap(ctx);
    let player = null;
    let enemies = [];
    let enemyCount = 20;
    let score = 0;
    let gameActive = false;
    let autoPilot = false;
    let particles = [];
    let shakeIntensity = 0;

    const autoBtn = document.getElementById('auto-btn');
    autoBtn.onclick = () => {
        autoPilot = !autoPilot;
        autoBtn.innerText = `🤖 自動導航 (${autoPilot ? 'ON' : 'OFF'})`;
        autoBtn.classList.toggle('active');
    };
    const stage1 = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0],
        [0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0],
        [0,1,1,0,0,1,1,0,0,2,2,0,0,1,1,0,0,1,1,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0],
        [0,3,3,0,0,3,3,0,0,3,3,0,0,3,3,0,0,4,4,0],
        [0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0],
        [0,1,1,0,0,1,1,0,0,0,0,0,0,1,1,0,0,1,1,0],
        [0,1,1,0,0,1,1,0,2,2,2,2,0,1,1,0,0,1,1,0],
        [0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0],
        [0,1,1,1,1,1,1,0,2,0,0,2,0,1,1,1,1,1,1,0],
        [0,0,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,0],
        [0,1,1,0,0,1,1,0,0,0,0,0,0,1,1,0,0,1,1,0],
        [0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0],
        [0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0],
        [4,4,0,0,1,1,0,0,1,1,1,1,0,0,1,1,0,0,0,0],
        [0,1,1,0,1,1,0,0,0,0,0,0,0,0,1,1,0,1,1,0],
        [0,1,1,0,1,1,0,1,1,1,1,1,1,0,1,1,0,1,1,0],
        [0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,1,0,9,0,0,1,0,0,0,0,0,0,0]
    ];

    function init() {
        map.loadLevel(stage1);
        player = new Tank(180, 540, 'player', '#3498db');
        spawnEnemy();
        gameActive = true;
        update();
    }

    function spawnEnemy() {
        if (enemies.length < 4 && enemyCount > 0) {
            const spawns = [0, 240, 570]; // Perfect mapping to columns 0, 8, 19
            const x = spawns[Math.floor(Math.random() * 3)];
            const e = new Tank(x, 0, 'enemy', '#ff4757');
            e.dir = 2; // Face DOWN initially
            enemies.push(e);
            enemyCount--;
        }
    }

    function update() {
        if (!gameActive) return;
        
        // Shake logic
        ctx.save();
        if (shakeIntensity > 0) {
            ctx.translate(Math.random() * shakeIntensity - shakeIntensity/2, Math.random() * shakeIntensity - shakeIntensity/2);
            shakeIntensity *= 0.9;
            if (shakeIntensity < 0.1) shakeIntensity = 0;
        }

        ctx.clearRect(0, 0, 600, 600);
        map.draw();
        
        // Particle logic
        particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy; p.life -= 0.05;
            if (p.life <= 0) particles.splice(i, 1);
            else {
                ctx.fillStyle = `rgba(243, 156, 18, ${p.life})`;
                ctx.fillRect(p.x, p.y, p.s, p.s);
            }
        });

        // HUD Update
        scoreEl.innerText = score.toString().padStart(5, '0');
        mistakesEl.innerText = enemyCount;

        let playerMoved = false;

        // Auto Pilot Logic
        if (autoPilot && enemies.length > 0) {
            if (!player.autoTurnTimer) player.autoTurnTimer = 0;
            if (player.autoTurnTimer <= 0) {
                const nearest = enemies[0]; // Simple nearest target
                const dx = nearest.x - player.x;
                const dy = nearest.y - player.y;

                if (Math.abs(dx) > Math.abs(dy)) {
                    player.dir = dx > 0 ? 1 : 3;
                } else {
                    player.dir = dy > 0 ? 2 : 0;
                }
            } else {
                player.autoTurnTimer--;
            }

            // Move and Check Collision (Four-Corner with Inset)
            const nX = player.x + (player.dir === 1 ? player.v : (player.dir === 3 ? -player.v : 0));
            const nY = player.y + (player.dir === 2 ? player.v : (player.dir === 0 ? -player.v : 0));

            const inset = 4;
            const corners = [
                {x: nX + inset, y: nY + inset},
                {x: nX + 32 - inset, y: nY + inset},
                {x: nX + inset, y: nY + 32 - inset},
                {x: nX + 32 - inset, y: nY + 32 - inset}
            ];

            const blocked = corners.some(c => {
                const tr = Math.floor(c.y/30), tc = Math.floor(c.x/30);
                return tr < 0 || tr >= 20 || tc < 0 || tc >= 20 || [1, 2, 3, 9].includes(map.grid[tr][tc]);
            });

            if (!blocked) {
                player.x = nX; player.y = nY;
            } else {
                player.dir = Math.floor(Math.random() * 4); // Seek new dir if blocked
                player.autoTurnTimer = 30; // Keep random direction for 30 frames to escape corner
            }

            if (Math.random() < 0.05) { player.fire(); audio.playFire(); }
        }

        player.draw(ctx);
        player.update(map, enemies);

        enemies.forEach((e, ei) => {
            e.draw(ctx); e.update(map, [player]);
            
            // Boundary & Wall check
            const nextX = e.x + ((e.dir === 1) ? e.v : (e.dir === 3 ? -e.v : 0));
            const nextY = e.y + ((e.dir === 2) ? e.v : (e.dir === 0 ? -e.v : 0));
            
            const inset = 4;
            const corners = [
                {x: nextX + inset, y: nextY + inset},
                {x: nextX + 32 - inset, y: nextY + inset},
                {x: nextX + inset, y: nextY + 32 - inset},
                {x: nextX + 32 - inset, y: nextY + 32 - inset}
            ];

            const blocked = corners.some(c => {
                const tr = Math.floor(c.y/30), tc = Math.floor(c.x/30);
                return tr < 0 || tr >= 20 || tc < 0 || tc >= 20 || [1, 2, 3, 9].includes(map.grid[tr][tc]);
            });

            if (!blocked) {
                e.x = nextX; e.y = nextY;
            } else {
                e.dir = Math.floor(Math.random() * 4);
            }

            if (Math.random() < 0.02) { e.dir = Math.floor(Math.random() * 4); e.fire(); }

            // Bullet collision with player
            e.bullets.forEach((b, bi) => {
                if (b.x > player.x && b.x < player.x + 32 && b.y > player.y && b.y < player.y + 32) {
                    audio.playExplosion(); gameOverTrigger();
                }
            });

            // Player bullet collision with enemies
            player.bullets.forEach((pb, pbi) => {
                if (pb.x > e.x && pb.x < e.x + 32 && pb.y > e.y && pb.y < e.y + 32) {
                    enemies.splice(ei, 1); player.bullets.splice(pbi, 1);
                    audio.playExplosion(); spawnParticles(e.x+16, e.y+16, 15);
                    shakeIntensity = 10;
                    score += 100; spawnEnemy();
                }
            });
        });

        requestAnimationFrame(update);
        ctx.restore();
    }

    function spawnParticles(x, y, count) {
        for (let i=0; i<count; i++) {
            particles.push({
                x, y, 
                vx: (Math.random()-0.5)*8, 
                vy: (Math.random()-0.5)*8, 
                life: 1, s: Math.random()*4+2
            });
        }
    }

    function gameOverTrigger() {
        gameActive = false;
        shakeIntensity = 20; spawnParticles(player.x+16, player.y+16, 30);
        document.getElementById('game-overlay').classList.add('active');
        startView.style.display = 'none';
        endView.style.display = 'block';
    }

    retryBtn.onclick = () => location.reload();
    window.addEventListener('gameOverBase', gameOverTrigger);

    window.onkeydown = (e) => {
        if (!gameActive) return;
        const key = e.key.toLowerCase();
        let nextX = player.x;
        let nextY = player.y;
        
        if (key === 'w' || key === 'arrowup') { player.dir = 0; nextY -= player.v; }
        if (key === 'd' || key === 'arrowright') { player.dir = 1; nextX += player.v; }
        if (key === 's' || key === 'arrowdown') { player.dir = 2; nextY += player.v; }
        if (key === 'a' || key === 'arrowleft') { player.dir = 3; nextX -= player.v; }
        if (key === ' ') { player.fire(); audio.playFire(); return; }

        // Player Wall Collision (Four-Corner with Inset)
        const inset = 4;
        const corners = [
            {x: nextX + inset, y: nextY + inset},
            {x: nextX + 32 - inset, y: nextY + inset},
            {x: nextX + inset, y: nextY + 32 - inset},
            {x: nextX + 32 - inset, y: nextY + 32 - inset}
        ];

        const isBlocked = corners.some(c => {
            const tr = Math.floor(c.y / 30), tc = Math.floor(c.x / 30);
            return tr < 0 || tr >= 20 || tc < 0 || tc >= 20 || [1, 2, 3, 9].includes(map.grid[tr][tc]);
        });

        if (!isBlocked) {
            player.x = nextX; player.y = nextY;
        }
    };

    document.getElementById('start-game-btn').onclick = () => {
        document.getElementById('game-overlay').classList.remove('active');
        audio.init(); audio.playEngine(); init();
    };
});
