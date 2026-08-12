/**
 * UTT-v2.0 Orchestration: Tetris Remix Main Logic
 * Responsibility: Jensen (Host) & Arthur (Automation)
 */

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const holdCanvas = document.getElementById('holdCanvas');
    const nextCanvas = document.getElementById('nextCanvas');
    const playArea = document.querySelector('.canvas-wrapper');
    const startBtn = document.getElementById('start-game-btn');
    const overlay = document.getElementById('game-overlay');
    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    const linesEl = document.getElementById('lines');
    
    // Core Modules
    const engine = new TetrisEngine();
    const renderer = new Renderer(canvas, holdCanvas, nextCanvas);
    const audio = new AudioManager();
    const effects = new EffectManager();
    const ai = new TetrisAI();
    let autopilotEnabled = false;

    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;
    let requestId = null;

    // --- Initialization ---
    function update(time = 0) {
        if (engine.isGameOver) {
            cancelAnimationFrame(requestId);
            alert('遊戲結束！您的最終分數: ' + engine.score);
            overlay.classList.add('active');
            return;
        }

        const deltaTime = time - lastTime;
        lastTime = time;

        // Auto-Pilot Decision
        if (autopilotEnabled && engine.activePiece) {
            handleAutopilot();
        }

        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            const event = engine.drop();
            processEvent(event);
            dropCounter = 0;
        }

        draw();
        requestId = requestAnimationFrame(update);
    }

    let aiMoveCounter = 0;
    const aiMoveSpeed = 50; // ms per AI action (move/rotate)

    function handleAutopilot() {
        if (!engine.activePiece) return;
        
        // Slow down AI actions slightly for visual clarity and stability
        const now = performance.now();
        if (now - aiMoveCounter < aiMoveSpeed) return;
        aiMoveCounter = now;

        const bestMove = ai.bestMove(engine);
        if (bestMove) {
            // 0. Handle Strategic Swap
            if (bestMove.shouldSwap) {
                engine.hold();
                return;
            }

            // 1. Handle Rotation FIRST
            if (engine.activePiece.rotation !== bestMove.rotation) {
                engine.rotate(1);
            }
            // 2. Handle Horizontal Movement
            else if (engine.activePiece.pos.x < bestMove.x) {
                engine.move({ x: 1, y: 0 });
            } else if (engine.activePiece.pos.x > bestMove.x) {
                engine.move({ x: -1, y: 0 });
            } else {
                // 3. Optional: Auto Hard Drop
            }
        }
    }

    function processEvent(event) {
        if (event.type === 'land') {
            audio.playLand();
            // Create landing particles
            event.matrix.forEach((row, y) => {
                row.forEach((v, x) => {
                    if (v !== 0) {
                        effects.createExplosion(
                            (event.pos.x + x) * renderer.blockSize + renderer.blockSize/2,
                            (event.pos.y + y) * renderer.blockSize + renderer.blockSize/2,
                            event.color, 3
                        );
                    }
                });
            });

            if (event.clearedLines.length > 0) {
                audio.playClear(event.clearedLines.length);
                event.clearedLines.forEach(y => {
                    effects.createLineClear(y, engine.cols, renderer.blockSize, event.color);
                });
            }
        }
    }

    function draw() {
        renderer.draw(engine, effects);
        updateUI();
    }

    function updateUI() {
        scoreEl.innerText = engine.score.toString().padStart(5, '0');
        levelEl.innerText = engine.level;
        linesEl.innerText = engine.lines;
        
        // Speed scaling
        dropInterval = Math.max(100, 1000 - (engine.level - 1) * 100);
    }

    // --- Event Listeners ---
    window.addEventListener('resize', () => renderer.resize(playArea));

    startBtn.addEventListener('click', () => {
        audio.init();
        audio.start();
        overlay.classList.remove('active');
        engine.reset();
        renderer.resize(playArea);
        lastTime = performance.now();
        update();
    });

    document.getElementById('ghost-toggle').addEventListener('click', (e) => {
        renderer.ghostEnabled = !renderer.ghostEnabled;
        e.target.innerText = `👻 輔助投射: ${renderer.ghostEnabled ? 'ON' : 'OFF'}`;
    });

    document.getElementById('autopilot-toggle').addEventListener('click', (e) => {
        autopilotEnabled = !autopilotEnabled;
        e.target.innerText = `🤖 自動駕駛: ${autopilotEnabled ? 'ON' : 'OFF'}`;
        if (autopilotEnabled) dropInterval = 100; // Fast mode for AI
    });

    document.getElementById('audio-toggle').addEventListener('click', (e) => {
        if (audio.isPlaying) {
            audio.stop();
            e.target.innerText = '🔇 靜音';
        } else {
            audio.start();
            e.target.innerText = '🔊 律動音樂';
        }
    });

    // --- Input Handling ---
    document.addEventListener('keydown', (e) => {
        if (overlay.classList.contains('active') || autopilotEnabled) return;

        let event = { type: 'move' };
        switch(e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                engine.move({ x: -1, y: 0 });
                break;
            case 'ArrowRight':
            case 'KeyD':
                engine.move({ x: 1, y: 0 });
                break;
            case 'ArrowDown':
            case 'KeyS':
                event = engine.drop();
                break;
            case 'ArrowUp':
            case 'KeyW':
                engine.rotate(1);
                break;
            case 'Space':
                event = engine.hardDrop();
                break;
            case 'KeyC':
            case 'ShiftLeft':
                engine.hold();
                break;
        }
        processEvent(event);
        draw();
    });
});
