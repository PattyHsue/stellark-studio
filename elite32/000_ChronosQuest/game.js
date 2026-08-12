/* ═══════════════════════════════════════════════════════════════════
   CHRONOS QUEST — Core Game Engine v2.0 (Class Architecture)
   Version : 2026-M4 Reconstruction
   Architect: Xavier (Systems) × Ada (Logic) × Tessa (Labs)
   ─────────────────────────────────────────────────────────────────
   Design Patterns : Facade · Factory · Single Responsibility
   Clean-Code      : SOLID · DRY · KISS
   Complexity       : O(n + p) per frame
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ══════════════════════════════════════════════════════════════════
   §0  CONFIGURATION (Immutable)
   ══════════════════════════════════════════════════════════════════ */

const CONFIG = Object.freeze({
  CANVAS_W: 1000,
  CANVAS_H: 700,
  HEADER_H: 52,

  // ── Paddle ──
  PADDLE_W:             130,
  PADDLE_H:              16,
  PADDLE_RADIUS:          8,
  PADDLE_SPEED:           8,
  PADDLE_BOTTOM_OFFSET:  30,

  // ── Ball ──
  BALL_RADIUS:      8,
  BALL_BASE_SPEED:  5.5,
  BALL_MAX_SPEED:   9,

  // ── Bricks ──
  BRICK_ROWS:        6,
  BRICK_COLS:       10,
  BRICK_W:          85,
  BRICK_H:          26,
  BRICK_PAD:         8,
  BRICK_TOP_OFFSET: 80,

  // ── Scoring ──
  INITIAL_LIVES:     3,
  POINTS_PER_BRICK: 10,
  COMBO_MULTIPLIER:  1.5,

  // ── Effects ──
  PARTICLE_COUNT:   12,
  PARTICLE_LIFE:    40,
  TRAIL_MAX_LENGTH: 20,
  TRAIL_LIFE:       12,

  // ── Auto-pilot ──
  AUTO_SMOOTHING:   0.12,
  MOUSE_SMOOTHING:  0.18,

  // ── Physics ──
  PADDLE_ANGLE_RANGE: 1.2,   // ±rad from vertical on paddle
  LAUNCH_ANGLE_JITTER: 0.4,  // random spread on launch
  BALL_SPEED_INCREMENT: 0.05,
  GRAVITY_PARTICLE: 0.06,
  BRICK_SHAKE_FRAMES: 8,
});

/* ══════════════════════════════════════════════════════════════════
   §0b  LEVEL / THEME DEFINITIONS
   ══════════════════════════════════════════════════════════════════ */

const LEVELS = Object.freeze([
  {
    theme: 'spring', name: '春之庭園',
    brickColors: [
      ['hsl(145,70%,50%)', 'hsl(145,70%,42%)'],
      ['hsl(160,65%,48%)', 'hsl(160,65%,40%)'],
      ['hsl(330,75%,62%)', 'hsl(330,75%,54%)'],
      ['hsl(100,55%,52%)', 'hsl(100,55%,44%)'],
      ['hsl(180,50%,50%)', 'hsl(180,50%,42%)'],
      ['hsl(140,60%,55%)', 'hsl(140,60%,47%)'],
    ],
    paddleColor: 'hsl(145,72%,55%)',
    ballColor:   'hsl(145,80%,65%)',
    ballGlow:    'hsla(145,90%,55%,0.6)',
  },
  {
    theme: 'summer', name: '灼陽沙漠',
    brickColors: [
      ['hsl(38,90%,55%)',  'hsl(38,90%,47%)'],
      ['hsl(25,85%,50%)',  'hsl(25,85%,42%)'],
      ['hsl(10,80%,52%)',  'hsl(10,80%,44%)'],
      ['hsl(45,88%,55%)',  'hsl(45,88%,47%)'],
      ['hsl(0,75%,50%)',   'hsl(0,75%,42%)'],
      ['hsl(50,80%,58%)',  'hsl(50,80%,50%)'],
    ],
    paddleColor: 'hsl(38,95%,58%)',
    ballColor:   'hsl(38,90%,65%)',
    ballGlow:    'hsla(38,95%,55%,0.6)',
  },
  {
    theme: 'fall', name: '紅葉峽谷',
    brickColors: [
      ['hsl(18,85%,52%)',  'hsl(18,85%,44%)'],
      ['hsl(30,80%,50%)',  'hsl(30,80%,42%)'],
      ['hsl(45,88%,52%)',  'hsl(45,88%,44%)'],
      ['hsl(8,78%,48%)',   'hsl(8,78%,40%)'],
      ['hsl(350,70%,50%)', 'hsl(350,70%,42%)'],
      ['hsl(55,75%,55%)',  'hsl(55,75%,47%)'],
    ],
    paddleColor: 'hsl(18,88%,55%)',
    ballColor:   'hsl(18,85%,62%)',
    ballGlow:    'hsla(18,90%,50%,0.6)',
  },
  {
    theme: 'winter', name: '極光冰原',
    brickColors: [
      ['hsl(195,80%,55%)', 'hsl(195,80%,47%)'],
      ['hsl(210,75%,52%)', 'hsl(210,75%,44%)'],
      ['hsl(260,70%,65%)', 'hsl(260,70%,57%)'],
      ['hsl(180,65%,50%)', 'hsl(180,65%,42%)'],
      ['hsl(230,60%,58%)', 'hsl(230,60%,50%)'],
      ['hsl(200,70%,55%)', 'hsl(200,70%,47%)'],
    ],
    paddleColor: 'hsl(195,85%,60%)',
    ballColor:   'hsl(195,80%,68%)',
    ballGlow:    'hsla(195,90%,55%,0.6)',
  },
]);


/* ══════════════════════════════════════════════════════════════════
   §1  EffectManager  —  Particle & Trail System (SRP)
   ──────────────────────────────────────────────────────────────────
   Single Responsibility: owns ALL transient visual effects.
   Complexity: O(p) per update, p = active particles + trails.
   ══════════════════════════════════════════════════════════════════ */

class EffectManager {
  constructor() {
    /** @type {{ x:number, y:number, dx:number, dy:number, life:number, maxLife:number, color:string, size:number }[]} */
    this.particles = [];
    /** @type {{ x:number, y:number, life:number }[]} */
    this.trail = [];
  }

  /* ── Factory ──────────────────────────────────────────────────── */

  /**
   * Spawn a burst of particles at (cx, cy).
   * @param {number} cx        Center X
   * @param {number} cy        Center Y
   * @param {string} color     CSS color string
   * @param {number} [count]   Number of particles (default: CONFIG.PARTICLE_COUNT)
   */
  spawnBurst(cx, cy, color, count = CONFIG.PARTICLE_COUNT) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push({
        x: cx,
        y: cy,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        life: CONFIG.PARTICLE_LIFE,
        maxLife: CONFIG.PARTICLE_LIFE,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  }

  /**
   * Append a trail dot behind the ball.
   * @param {number} x
   * @param {number} y
   */
  addTrailDot(x, y) {
    this.trail.push({ x, y, life: CONFIG.TRAIL_LIFE });
    if (this.trail.length > CONFIG.TRAIL_MAX_LENGTH) {
      this.trail.shift();
    }
  }

  /* ── Update (per frame) ──────────────────────────────────────── */

  update() {
    // Particles: integrate position + gravity, cull dead
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x  += p.dx;
      p.y  += p.dy;
      p.dy += CONFIG.GRAVITY_PARTICLE;   // subtle gravity pull
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    // Trail: decay and cull
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life--;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }
  }

  /* ── Render ──────────────────────────────────────────────────── */

  /**
   * Draw all particles onto context.
   * @param {CanvasRenderingContext2D} ctx
   */
  drawParticles(ctx) {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Draw ball trail onto context.
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} glowColor  e.g. "hsla(145,90%,55%,0.6)"
   */
  drawTrail(ctx, glowColor) {
    for (const t of this.trail) {
      const ratio = t.life / CONFIG.TRAIL_LIFE;
      const alpha = ratio * 0.25;
      ctx.fillStyle = glowColor.replace(/[\d.]+\)$/, `${alpha})`);
      ctx.beginPath();
      ctx.arc(t.x, t.y, CONFIG.BALL_RADIUS * ratio, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Reset all effects (on level change / restart). */
  reset() {
    this.particles.length = 0;
    this.trail.length = 0;
  }
}


/* ══════════════════════════════════════════════════════════════════
   §2  PhysicsEngine  —  Collision Detection (Ada's Standard)
   ──────────────────────────────────────────────────────────────────
   Pure functions: no side effects on game state, returns collision
   result objects. The caller (GameCore) decides what to do.
   ──────────────────────────────────────────────────────────────────
   Ada's Complexity Proof:
     • Wall collision   : O(1) — 4 constant boundary checks
     • Paddle collision : O(1) — single AABB + circle test
     • Brick collision  : O(n) — linear scan, early-exit on hit
     • Total per frame  : O(n) where n = alive bricks ≤ 60
   ══════════════════════════════════════════════════════════════════ */

class PhysicsEngine {

  /* ── Wall Collision ──────────────────────────────────────────── */

  /**
   * Test ball against canvas boundaries and correct position.
   * Mutates ball position/velocity directly for efficiency.
   *
   * @param {{x:number,y:number,dx:number,dy:number,r:number}} ball
   * @returns {'none'|'left'|'right'|'top'|'bottom'}  Which wall was hit
   */
  static resolveWalls(ball) {
    // Left wall
    if (ball.x - ball.r <= 0) {
      ball.x  = ball.r;
      ball.dx = Math.abs(ball.dx);
      return 'left';
    }
    // Right wall
    if (ball.x + ball.r >= CONFIG.CANVAS_W) {
      ball.x  = CONFIG.CANVAS_W - ball.r;
      ball.dx = -Math.abs(ball.dx);
      return 'right';
    }
    // Top wall (below header)
    if (ball.y - ball.r <= CONFIG.HEADER_H) {
      ball.y  = CONFIG.HEADER_H + ball.r;
      ball.dy = Math.abs(ball.dy);
      return 'top';
    }
    // Bottom (death zone)
    if (ball.y + ball.r >= CONFIG.CANVAS_H) {
      return 'bottom';
    }
    return 'none';
  }

  /* ── Paddle Collision (Angle Reflection) ─────────────────────── */

  /**
   * Ada's Angle-Reflection Formula:
   *   hitPos ∈ [0, 1] = normalised impact position on paddle surface.
   *   reflectAngle = −π/2 + (hitPos − 0.5) × PADDLE_ANGLE_RANGE
   *
   * Edge hits → sharper angles.  Centre hits → near-vertical.
   *
   * @param {{x:number,y:number,dx:number,dy:number,r:number,speed:number}} ball
   * @param {{x:number,y:number,w:number,h:number}} paddle
   * @returns {{hit:boolean, hitPos:number}}
   */
  static resolvePaddle(ball, paddle) {
    if (
      ball.dy > 0 &&
      ball.y + ball.r >= paddle.y &&
      ball.y + ball.r <= paddle.y + paddle.h + 4 &&
      ball.x >= paddle.x - ball.r &&
      ball.x <= paddle.x + paddle.w + ball.r
    ) {
      const hitPos = Math.max(0, Math.min(1,
        (ball.x - paddle.x) / paddle.w
      ));

      // Ada's angular reflection
      let angle = -Math.PI / 2 + (hitPos - 0.5) * CONFIG.PADDLE_ANGLE_RANGE;
      
      // Anti-Vertical-Lock (prevent perfect -90 degree bounce causing infinite vertical loops)
      if (Math.abs(angle - (-Math.PI / 2)) < 0.05) {
        angle += (Math.random() > 0.5 ? 1 : -1) * 0.15;
      }
      const speed = Math.min(
        ball.speed + CONFIG.BALL_SPEED_INCREMENT,
        CONFIG.BALL_MAX_SPEED
      );
      ball.speed = speed;
      ball.dx = Math.cos(angle) * speed;
      ball.dy = Math.sin(angle) * speed;
      ball.y  = paddle.y - ball.r;   // push out of paddle

      return { hit: true, hitPos };
    }
    return { hit: false, hitPos: -1 };
  }

  /* ── Boss Collision ────────────────────────────────────────── */

  static resolveBoss(ball, boss) {
    const closestX = Math.max(boss.x - boss.w / 2, Math.min(ball.x, boss.x + boss.w / 2));
    const closestY = Math.max(boss.y - boss.h / 2, Math.min(ball.y, boss.y + boss.h / 2));
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    if ((dx * dx + dy * dy) < (ball.r * ball.r)) {
      ball.dy = -ball.dy;
      return true;
    }
    return false;
  }

  /* ── Brick Collision (Circle vs AABB) ────────────────────────── */

  /**
   * Closest-point circle-to-AABB intersection test.
   *
   * Ada's Correctness Proof:
   *   Let P = (ball.x, ball.y), Q = closest point on AABB to P.
   *   Collision ⟺ ‖P − Q‖² < ball.r².
   *   This is exact for axis-aligned rectangles.
   *
   * @param {{x:number,y:number,r:number}} ball
   * @param {{x:number,y:number,w:number,h:number,alive:boolean}} brick
   * @returns {boolean}
   */
  static circleAABB(ball, brick) {
    const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.w));
    const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.h));
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    return (dx * dx + dy * dy) < (ball.r * ball.r);
  }

  /**
   * Scan all bricks for the FIRST collision.
   * Returns the index of the hit brick or -1 if none.
   *
   * Early-exit optimisation: one collision per frame is physically
   * sufficient at sub-pixel ball speeds.
   *
   * @param {{x:number,y:number,dx:number,dy:number,r:number}} ball
   * @param {Array} bricks
   * @returns {number}  Index of hit brick, or -1
   */
  static resolveBricks(ball, bricks) {
    for (let i = 0; i < bricks.length; i++) {
      const b = bricks[i];
      if (!b.alive) continue;
      if (PhysicsEngine.circleAABB(ball, b)) {
        // Reflect ball vertically
        ball.dy = -ball.dy;
        return i;
      }
    }
    return -1;
  }
}


/* ══════════════════════════════════════════════════════════════════
   §3  GameCore  —  Central Orchestrator (Facade Pattern)
   ──────────────────────────────────────────────────────────────────
   Owns: state, entities, game loop.
   Delegates: physics → PhysicsEngine, effects → EffectManager.
   ══════════════════════════════════════════════════════════════════ */

class GameCore {

  /* ── Constructor ─────────────────────────────────────────────── */

  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    /** @type {HTMLCanvasElement} */
    this.canvas = canvas;
    /** @type {CanvasRenderingContext2D} */
    this.ctx = canvas.getContext('2d');

    // Sub-systems
    this.fx = new EffectManager();
    this.audio = new window.AudioManager();
    this.bio = window.BioManager ? new window.BioManager() : null;

    // DOM references
    this.dom = {
      overlay:      document.querySelector('#game-overlay'),
      btnStart:     document.querySelector('#btn-start'),
      scoreDisplay: document.querySelector('#score-value'),
      livesDisplay: document.querySelector('#lives-value'),
      areaDisplay:  document.querySelector('#area-value'),
      autoToggle:   document.querySelector('#auto-toggle'),
    };

    // ── Game state ──
    this.phase = 'idle';   // idle | ready | playing | paused | levelClear | gameOver
    this.level = 0;
    this.score = 0;
    this.lives = CONFIG.INITIAL_LIVES;
    this.combo = 0;
    this.autoPlay = false;

    // ── Input state ──
    this.keys  = { left: false, right: false };
    this.mouse = { x: CONFIG.CANVAS_W / 2, active: false };

    // ── Entities ──
    this.paddle = null;
    this.ball   = null;
    this.bricks = [];
    this.boss   = null;

    // ── Loop timing ──
    this._lastFrameTime = 0;
    this._boundLoop = this._gameLoop.bind(this);
  }

  /* ══════════════════════════════════════════════════════════════
     §3a  Initialisation
     ══════════════════════════════════════════════════════════════ */

  /** Boot the game: bind events, build first level, start render. */
  init() {
    this._setupInput();
    this.dom.btnStart.addEventListener('click', async () => {
      if (this.phase === 'idle' || this.phase === 'gameOver') {
        await this.audio.initOrResume();
        this.audio.startBGM();
        this.startGame();
      }
    });
    this._buildLevel(0);
    this._updateHUD();
    requestAnimationFrame(this._boundLoop);
  }

  /** Reset state and start a new game. */
  startGame() {
    this.score = 0;
    this.lives = CONFIG.INITIAL_LIVES;
    this.level = 0;
    this.combo = 0;
    this.phase = 'ready';
    this._updateHUD();
    const nextLvl = LEVELS[this.level % LEVELS.length];
    document.documentElement.setAttribute('data-theme', nextLvl.theme);
    this._buildLevel(this.level);
    this._hideOverlay();
  }

  /* ── Temporary Test APIs ── */
  async jumpToTestLevel(lvlIndex) {
    this.score = 0;
    this.lives = CONFIG.INITIAL_LIVES;
    this.level = lvlIndex;
    this.combo = 0;
    this.phase = 'ready';
    this._updateHUD();
    const nextLvl = LEVELS[this.level % LEVELS.length];
    document.documentElement.setAttribute('data-theme', nextLvl.theme);
    this._buildLevel(this.level);
    this._hideOverlay();
    
    await this.audio.initOrResume();
    this.audio.startBGM();
  }

  async forceBoss() {
    if (this.phase === 'idle' || this.phase === 'gameOver' || this.phase === 'levelClear') {
      await this.jumpToTestLevel(this.level);
    }
    this.bricks.forEach(b => b.alive = false);
    this.phase = 'playing';
  }

  /* ══════════════════════════════════════════════════════════════
     §3b  Entity Factories (SRP — creation only)
     ══════════════════════════════════════════════════════════════ */

  /** @returns {{x,y,w,h,r}} Fresh paddle at centre-bottom */
  static _createPaddle() {
    return {
      x: (CONFIG.CANVAS_W - CONFIG.PADDLE_W) / 2,
      y: CONFIG.CANVAS_H - CONFIG.PADDLE_BOTTOM_OFFSET - CONFIG.PADDLE_H,
      w: CONFIG.PADDLE_W,
      h: CONFIG.PADDLE_H,
      r: CONFIG.PADDLE_RADIUS,
    };
  }

  /**
   * @param {{x,y,w}} paddle  Host paddle for initial position
   * @returns {{x,y,dx,dy,r,speed,attached}}
   */
  static _createBall(paddle) {
    return {
      x: paddle.x + paddle.w / 2,
      y: paddle.y - CONFIG.BALL_RADIUS - 2,
      dx: 0,
      dy: 0,
      r: CONFIG.BALL_RADIUS,
      speed: CONFIG.BALL_BASE_SPEED,
      attached: true,
    };
  }

  /**
   * @param {number} row
   * @param {number} col
   * @param {string} color
   * @param {string} shadow
   * @returns {{x,y,w,h,color,shadow,hp,alive,shakeT}}
   */
  static _createBrick(row, col, color, shadow) {
    const totalW  = CONFIG.BRICK_COLS * (CONFIG.BRICK_W + CONFIG.BRICK_PAD) - CONFIG.BRICK_PAD;
    const offsetX = (CONFIG.CANVAS_W - totalW) / 2;
    return {
      x: offsetX + col * (CONFIG.BRICK_W + CONFIG.BRICK_PAD),
      y: CONFIG.BRICK_TOP_OFFSET + row * (CONFIG.BRICK_H + CONFIG.BRICK_PAD),
      w: CONFIG.BRICK_W,
      h: CONFIG.BRICK_H,
      color,
      shadow,
      hp: row < 2 ? 2 : 1,
      alive: true,
      shakeT: 0,
    };
  }

  /**
   * @param {Object} lvl
   * @returns {{x,y,w,h,hp,maxHp,dx,rage,alive,time,color,glow}}
   */
  static _createBoss(lvl) {
    return {
      x: CONFIG.CANVAS_W / 2,
      y: 160,
      w: 120,
      h: 120,
      hp: 35,
      maxHp: 35,
      dx: 2.5,
      rage: false,
      alive: true,
      time: 0,
      color: lvl.paddleColor,
      glow: lvl.ballGlow
    };
  }

  /* ══════════════════════════════════════════════════════════════
     §3c  Level Builder
     ══════════════════════════════════════════════════════════════ */

  /**
   * Construct a level: set theme, build brick grid, reset paddle/ball.
   * @param {number} idx  Level index (wraps around LEVELS.length)
   */
  _buildLevel(idx) {
    const lvl = LEVELS[idx % LEVELS.length];

    // Apply theme
    document.documentElement.setAttribute('data-theme', lvl.theme);
    this.dom.areaDisplay.textContent = lvl.name;

    // Build brick grid
    this.bricks = [];
    for (let r = 0; r < CONFIG.BRICK_ROWS; r++) {
      for (let c = 0; c < CONFIG.BRICK_COLS; c++) {
        const [color, shadow] = lvl.brickColors[r % lvl.brickColors.length];
        this.bricks.push(GameCore._createBrick(r, c, color, shadow));
      }
    }

    // Spawn Bio logic
    if (this.bio) this.bio.spawnForTheme(lvl.theme, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
    
    // Boss spawns dynamically when bricks are cleared
    this.boss = null;

    // Reset entities
    this.paddle = GameCore._createPaddle();
    this.ball   = GameCore._createBall(this.paddle);
    this.fx.reset();
    this.combo  = 0;
  }

  /* ══════════════════════════════════════════════════════════════
     §3d  Input System
     ══════════════════════════════════════════════════════════════ */

  _setupInput() {
    // ── Keyboard: Arrow / A / D / Space / P ──
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowLeft': case 'a': case 'A':
          this.keys.left = true; break;
        case 'ArrowRight': case 'd': case 'D':
          this.keys.right = true; break;
        case ' ': case 'Enter':
          this._launchBall(); break;
        case 'p': case 'P':
          this._togglePause(); break;
      }
    });

    document.addEventListener('keyup', (e) => {
      switch (e.key) {
        case 'ArrowLeft': case 'a': case 'A':
          this.keys.left = false; break;
        case 'ArrowRight': case 'd': case 'D':
          this.keys.right = false; break;
      }
    });

    // ── Mouse ──
    this.canvas.addEventListener('mousemove', (e) => {
      const rect   = this.canvas.getBoundingClientRect();
      const scaleX = CONFIG.CANVAS_W / rect.width;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.active = true;
    });

    // ── Touch ──
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect   = this.canvas.getBoundingClientRect();
      const scaleX = CONFIG.CANVAS_W / rect.width;
      this.mouse.x = (e.touches[0].clientX - rect.left) * scaleX;
      this.mouse.active = true;
    }, { passive: false });

    this.canvas.addEventListener('click',      () => this._launchBall());
    this.canvas.addEventListener('touchstart', () => this._launchBall(), { passive: true });

    // ── Auto-pilot toggle ──
    this.dom.autoToggle.addEventListener('change', () => {
      this.autoPlay = this.dom.autoToggle.checked;
    });
  }

  /** Release ball from paddle with slight random angle. */
  _launchBall() {
    if (this.phase === 'idle' || this.phase === 'levelClear' || this.phase === 'gameOver') return;
    if (!this.ball.attached) return;

    this.ball.attached = false;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * CONFIG.LAUNCH_ANGLE_JITTER;
    this.ball.dx = Math.cos(angle) * this.ball.speed;
    this.ball.dy = Math.sin(angle) * this.ball.speed;
    this.phase   = 'playing';
  }

  _togglePause() {
    if (this.phase === 'playing')    this.phase = 'paused';
    else if (this.phase === 'paused') this.phase = 'playing';
  }

  /* ══════════════════════════════════════════════════════════════
     §3e  Update Logic (per frame)
     ══════════════════════════════════════════════════════════════ */

  /**
   * Move paddle based on current input mode.
   * Priority: Auto-pilot > Mouse > Keyboard.
   *
   * Auto-pilot uses lerp:  paddle.x += (target − current) × α
   * where α = CONFIG.AUTO_SMOOTHING (0.12) for smooth tracking.
   */
  _updatePaddle() {
    const p = this.paddle;

    if (this.autoPlay) {
      // ── Auto-Pilot: smooth lerp with oscillating offset ──
      // Dynamic offset ensures the ball hits off-center to prevent infinite vertical loops
      const autoOffset = Math.sin(Date.now() / 400) * (p.w * 0.35);
      const target = this.ball.x - p.w / 2 + autoOffset;
      p.x += (target - p.x) * CONFIG.AUTO_SMOOTHING;
    } else if (this.mouse.active) {
      // ── Mouse-driven (with smoothing) ──
      const target = this.mouse.x - p.w / 2;
      p.x += (target - p.x) * CONFIG.MOUSE_SMOOTHING;
    } else {
      // ── Keyboard-driven (A/D or ←/→) ──
      if (this.keys.left)  p.x -= CONFIG.PADDLE_SPEED;
      if (this.keys.right) p.x += CONFIG.PADDLE_SPEED;
    }

    // Clamp to canvas bounds
    p.x = Math.max(0, Math.min(CONFIG.CANVAS_W - p.w, p.x));
  }

  /**
   * Advance ball physics for one frame.
   * Delegates collision detection to PhysicsEngine (static class).
   */
  _updateBall() {
    const ball   = this.ball;
    const paddle = this.paddle;

    // ── Attached state: track paddle ──
    if (ball.attached) {
      ball.x = paddle.x + paddle.w / 2;
      ball.y = paddle.y - ball.r - 2;

      // Auto-pilot: auto-launch after a short delay
      if (this.autoPlay && this.phase === 'ready') {
        this._launchBall();
      }
      return;
    }

    // ── Integrate position ──
    ball.x += ball.dx;
    ball.y += ball.dy;

    // ── Wall collision ──
    const wallResult = PhysicsEngine.resolveWalls(ball);
    if (wallResult === 'bottom') {
      this._loseLife();
      return;
    } else if (wallResult !== 'none') {
      this.audio.playCrystalHit(0.5); // Lower frequency for walls
    }

    // ── Boss collision ──
    if (this.boss && this.boss.alive && PhysicsEngine.resolveBoss(ball, this.boss)) {
      this._onBossHit();
      // Ensure we don't also hit bricks in the exact same frame
      return;
    }

    // ── Paddle collision ──
    const paddleResult = PhysicsEngine.resolvePaddle(ball, paddle);
    if (paddleResult.hit) {
      this.combo = 0;
      this.audio.playWaterDrop();
      // Spawn paddle-impact particles
      const lvl = LEVELS[this.level % LEVELS.length];
      this.fx.spawnBurst(ball.x, ball.y, lvl.paddleColor, 4);
    }

    // ── Brick collision ──
    const hitIdx = PhysicsEngine.resolveBricks(ball, this.bricks);
    if (hitIdx >= 0) {
      this._onBrickHit(hitIdx);
    }

    // ── Trail ──
    this.fx.addTrailDot(ball.x, ball.y);
  }

  /**
   * Handle brick destruction: scoring, combo, particles.
   * @param {number} idx  Index into this.bricks
   */
  _onBrickHit(idx) {
    const brick = this.bricks[idx];
    brick.hp--;
    brick.shakeT = CONFIG.BRICK_SHAKE_FRAMES;

    if (brick.hp <= 0) {
      brick.alive = false;
      this.combo++;
      
      // Dynamic pitch escalation based on combo
      this.audio.playCrystalHit(1.0 + Math.min(this.combo, 12) * 0.08);

      // Combo-scaled scoring
      const points = Math.floor(
        CONFIG.POINTS_PER_BRICK *
        Math.pow(CONFIG.COMBO_MULTIPLIER, Math.min(this.combo, 10))
      );
      this.score += points;
      this._updateHUD();

      // Destruction burst
      this.fx.spawnBurst(
        brick.x + brick.w / 2,
        brick.y + brick.h / 2,
        brick.color
      );
    } else {
      // Partial hit (2-hit bricks)
      this.audio.playCrystalHit(0.8);
    }
  }

  _onBossHit() {
    const b = this.boss;
    b.hp--;
    
    // Deeper hit sound for giant entity
    this.audio.playCrystalHit(0.4);
    this.fx.spawnBurst(b.x, b.y, b.color, 12);
    this.score += 50;

    // Rage trigger
    if (b.hp < b.maxHp * 0.4 && !b.rage) {
      b.rage = true;
      b.dx *= 2; // Speed doubling
      // Ball speed increment for Rage mode
      this.ball.speed = Math.min(this.ball.speed + 1.5, CONFIG.BALL_MAX_SPEED + 2);
      this.fx.spawnBurst(b.x, b.y, '#ff3333', 50);
    }

    if (b.hp <= 0) {
      b.alive = false;
      this.score += 2500; // Boss kill reward
      this.audio.playWaterDrop(); // Triumph sound
    }

    this._updateHUD();
  }

  /* ══════════════════════════════════════════════════════════════
     §3f  Game Flow
     ══════════════════════════════════════════════════════════════ */

  _loseLife() {
    this.lives--;
    this._updateHUD();

    if (this.lives <= 0) {
      this.phase = 'gameOver';
      this.audio.stopBGM();
      this._showOverlay('遊戲結束', `最終分數：${this.score}`, '🔄 重新開始');
      return;
    }

    // Re-attach ball to paddle
    this.ball  = GameCore._createBall(this.paddle);
    this.phase = 'ready';
  }

  _initBossPhase() {
    const lvl = LEVELS[this.level % LEVELS.length];
    this.boss = GameCore._createBoss(lvl);
    this.audio.playCrystalHit(0.2); // Boss spawn resonance
    this.fx.spawnBurst(this.boss.x, this.boss.y, '#ffffff', 60);
  }

  _checkLevelClear() {
    const noBricks = this.bricks.every((b) => !b.alive);

    if (!noBricks) return;

    // Stage Transition: START -> PLAYING -> BOSS
    if (!this.boss) {
      this._initBossPhase();
      return;
    }

    if (this.boss && this.boss.alive) return; // Boss still fighting

    // BOSS -> OVER (Level clear)
    this.phase = 'levelClear';
    this.level++;

    if (this.level >= LEVELS.length) {
      this._showOverlay('🎉 全關通關！', `總分：${this.score}`, '🔄 再來一次');
      this.phase = 'gameOver';
      this.audio.stopBGM();
    } else {
      const nextLvl = LEVELS[this.level % LEVELS.length];
      document.documentElement.setAttribute('data-theme', nextLvl.theme); // Auto theme swap
      this._showOverlay(
        nextLvl.name,
        '準備進入下一區域…',
        null
      );
      setTimeout(() => {
        this._buildLevel(this.level);
        this.phase = 'ready';
        this._hideOverlay();
      }, 1200);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     §3g  Overlay (UI Layer)
     ══════════════════════════════════════════════════════════════ */

  _showOverlay(title, subtitle, buttonText) {
    const ov = this.dom.overlay;
    ov.querySelector('.title-chronos').textContent  = title || 'Chronos';
    ov.querySelector('.title-quest').textContent     = '';
    ov.querySelector('.overlay-subtitle').textContent = subtitle || '';

    if (buttonText) {
      this.dom.btnStart.textContent    = buttonText;
      this.dom.btnStart.style.display  = '';
    } else {
      this.dom.btnStart.style.display = 'none';
    }
    ov.classList.remove('hidden');
  }

  _hideOverlay() {
    this.dom.overlay.classList.add('hidden');
  }

  _updateHUD() {
    this.dom.scoreDisplay.textContent = this.score.toLocaleString();
    this.dom.livesDisplay.textContent = this.lives;
  }

  /* ══════════════════════════════════════════════════════════════
     §3h  Rendering Engine
     ══════════════════════════════════════════════════════════════ */

  _render() {
    const ctx = this.ctx;
    const lvl = LEVELS[this.level % LEVELS.length];

    ctx.clearRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

    this._drawBackground(ctx);
    if (this.bio) this.bio.draw(ctx); // Draw Bio-Engine background creatures

    this.fx.drawTrail(ctx, lvl.ballGlow);
    this._drawBricks(ctx);

    if (this.boss && this.boss.alive) {
      this._drawBoss(ctx);
    }

    this._drawPaddle(ctx, lvl);
    this._drawBall(ctx, lvl);
    this.fx.drawParticles(ctx);

    if (this.combo > 1 && this.phase === 'playing') {
      this._drawCombo(ctx, lvl);
    }
    if (this.phase === 'paused') {
      this._drawPauseScreen(ctx);
    }
  }

  _drawBackground(ctx) {
    ctx.save();
    ctx.globalAlpha  = 0.04;
    ctx.strokeStyle  = '#fff';
    ctx.lineWidth    = 1;
    const gs = 50;
    for (let x = 0; x < CONFIG.CANVAS_W; x += gs) {
      ctx.beginPath();
      ctx.moveTo(x, CONFIG.HEADER_H);
      ctx.lineTo(x, CONFIG.CANVAS_H);
      ctx.stroke();
    }
    for (let y = CONFIG.HEADER_H; y < CONFIG.CANVAS_H; y += gs) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CONFIG.CANVAS_W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawPaddle(ctx, lvl) {
    const p = this.paddle;
    ctx.save();

    // Glow
    ctx.shadowColor = lvl.ballGlow;
    ctx.shadowBlur  = 18;

    // Rounded body
    ctx.fillStyle = lvl.paddleColor;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, p.r);
    ctx.fill();

    // Top shine gradient
    const shine = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    shine.addColorStop(0,   'hsla(0,0%,100%,0.35)');
    shine.addColorStop(0.5, 'hsla(0,0%,100%,0.05)');
    shine.addColorStop(1,   'transparent');
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, p.r);
    ctx.fill();

    ctx.restore();
  }

  _drawBall(ctx, lvl) {
    const b = this.ball;
    ctx.save();

    ctx.shadowColor = lvl.ballGlow;
    ctx.shadowBlur  = 20;

    const grad = ctx.createRadialGradient(
      b.x - b.r * 0.3, b.y - b.r * 0.3, 0,
      b.x, b.y, b.r
    );
    grad.addColorStop(0,   '#fff');
    grad.addColorStop(0.5, lvl.ballColor);
    grad.addColorStop(1,   lvl.paddleColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawBricks(ctx) {
    for (const b of this.bricks) {
      if (!b.alive) continue;
      ctx.save();

      // Shake animation
      let sx = 0;
      if (b.shakeT > 0) {
        sx = Math.sin(b.shakeT * 1.8) * 3;
        b.shakeT--;
      }

      // Shadow layer
      ctx.fillStyle = b.shadow;
      ctx.beginPath();
      ctx.roundRect(b.x + sx + 1, b.y + 2, b.w, b.h, 4);
      ctx.fill();

      // Main body
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.roundRect(b.x + sx, b.y, b.w, b.h, 4);
      ctx.fill();

      // Top highlight
      const shine = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      shine.addColorStop(0,   'hsla(0,0%,100%,0.25)');
      shine.addColorStop(0.5, 'hsla(0,0%,100%,0)');
      ctx.fillStyle = shine;
      ctx.beginPath();
      ctx.roundRect(b.x + sx, b.y, b.w, b.h, 4);
      ctx.fill();

      // HP indicator (2-hit bricks)
      if (b.hp >= 2) {
        ctx.fillStyle = 'hsla(0,0%,100%,0.45)';
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2 + sx, b.y + b.h / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  _drawBoss(ctx) {
    const b = this.boss;
    ctx.save();

    // Procedural float & pulse math
    const floatY = Math.sin(b.time) * 15;
    const pulse = 1 + Math.sin(b.time * 2) * 0.05;

    ctx.translate(b.x, b.y + floatY);
    ctx.scale(pulse, pulse);

    // Advanced Edge processing: deep majestic glow
    ctx.filter = `drop-shadow(0px 0px 35px ${b.glow})`;
    
    // Rotating Sovereign Halos
    ctx.save();
    ctx.rotate(b.time * 0.5);
    ctx.strokeStyle = b.glow;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, b.w * 0.9, 0, Math.PI * 2);
    ctx.stroke();
    // Inner broken halo
    ctx.setLineDash([15, 10]);
    ctx.rotate(-b.time * 1.5);
    ctx.beginPath();
    ctx.arc(0, 0, b.w * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Sovereign Entity Geometry - Advanced Crystalline Diamond
    const coreColor = b.rage ? 'hsl(0, 95%, 45%)' : b.color;
    
    // Linear Glass Gradient
    const grad = ctx.createLinearGradient(0, -b.h/2, 0, b.h/2);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, coreColor);
    grad.addColorStop(1, '#000000');

    ctx.fillStyle = grad;
    ctx.shadowColor = b.glow;
    ctx.shadowBlur = 25;

    // Base Polygon Cut
    ctx.beginPath();
    ctx.moveTo(0, -b.h / 2);
    ctx.lineTo(b.w / 2, 0);
    ctx.lineTo(0, b.h / 2);
    ctx.lineTo(-b.w / 2, 0);
    ctx.closePath();
    ctx.fill();

    // Inner Facet Highlight (Creates a 3D faceted crystal look)
    ctx.fillStyle = 'hsla(0, 0%, 100%, 0.3)';
    ctx.beginPath();
    ctx.moveTo(0, -b.h / 2);
    ctx.lineTo(b.w / 4, 0);
    ctx.lineTo(0, b.h / 4);
    ctx.lineTo(-b.w / 4, 0);
    ctx.closePath();
    ctx.fill();

    // Throbbing Bio-Mechanical Eye Core
    const corePulse = Math.abs(Math.sin(b.time * 5));
    ctx.fillStyle = b.rage ? '#ff0000' : '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, (b.w / 5) + (corePulse * 3), 0, Math.PI * 2);
    ctx.fill();
    
    // Pupil
    ctx.fillStyle = b.rage ? '#000' : '#111';
    ctx.beginPath();
    ctx.arc(0, 0, (b.w / 10) * (b.rage ? 1.8 : 1), 0, Math.PI * 2);
    ctx.fill();

    // Rage Text Overlay
    if (b.rage && Math.sin(b.time * 12) > 0) {
      ctx.scale(1 / pulse, 1 / pulse); // Cancel the pulse scale for text
      ctx.font = '800 24px "JetBrains Mono", sans-serif';
      ctx.fillStyle = '#ff3333';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      // remove drop-shadow filter for crisp text
      ctx.filter = 'none'; 
      ctx.fillText('!!!! RAGE MODE !!!!', 0, -b.h / 2 - 30);
    }

    ctx.restore();
  }

  _drawCombo(ctx, lvl) {
    ctx.save();
    ctx.globalAlpha  = 0.85;
    ctx.font         = '700 22px "Outfit", sans-serif';
    ctx.fillStyle    = lvl.ballColor;
    ctx.textAlign    = 'center';
    ctx.shadowColor  = lvl.ballGlow;
    ctx.shadowBlur   = 12;
    ctx.fillText(`🔥 COMBO ×${this.combo}`, CONFIG.CANVAS_W / 2, CONFIG.CANVAS_H - 60);
    ctx.restore();
  }

  _drawPauseScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
    ctx.font      = '700 42px "Outfit", sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('⏸ PAUSED', CONFIG.CANVAS_W / 2, CONFIG.CANVAS_H / 2);
    ctx.font      = '400 18px "Outfit", sans-serif';
    ctx.fillStyle = 'hsla(0,0%,100%,0.6)';
    ctx.fillText('按 P 繼續遊戲', CONFIG.CANVAS_W / 2, CONFIG.CANVAS_H / 2 + 40);
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════
     §3i  Game Loop (requestAnimationFrame)
     ══════════════════════════════════════════════════════════════ */

  /**
   * Main loop — locked to ~60 fps via 16 ms frame budget.
   * @param {number} timestamp  DOMHighResTimeStamp
   */
  _gameLoop(timestamp) {
    requestAnimationFrame(this._boundLoop);

    // Frame-rate limiter (~60 fps)
    if (timestamp - this._lastFrameTime < 16) return;
    this._lastFrameTime = timestamp;

    // Update phase
    if (this.phase === 'playing' || this.phase === 'ready') {
      if (this.bio) this.bio.update(CONFIG.CANVAS_W);

      if (this.boss && this.boss.alive && this.phase === 'playing') {
        this.boss.time += 0.05;
        this.boss.x += this.boss.dx;
        // Boss boundary bounce
        if (this.boss.x < this.boss.w || this.boss.x > CONFIG.CANVAS_W - this.boss.w) {
          this.boss.dx *= -1;
        }
      }

      this._updatePaddle();
      this._updateBall();
      this.fx.update();
      this._checkLevelClear();
    }

    // Render always
    this._render();
  }
}


/* ══════════════════════════════════════════════════════════════════
   §4  BOOTSTRAP
   ══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const game = new GameCore(document.querySelector('#game-canvas'));
  game.init();

  // Expose to console for debugging / testing
  if (typeof window !== 'undefined') {
    window.__chronos = game;
  }
});
