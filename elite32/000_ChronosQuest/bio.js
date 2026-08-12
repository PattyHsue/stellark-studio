/* ═══════════════════════════════════════════════════════════════════
   CHRONOS QUEST — Procedural Bio-Animation Engine (Master-Grade)
   Architect: Maya (Media / GenAI) × Xavier
   ─────────────────────────────────────────────────────────────────
   Advanced Canvas 2D Procedural Entities with Trail History & Kinetics.
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

class BioManager {
  constructor() {
    this.organisms = [];
  }

  spawnForTheme(theme, canvasWidth, canvasHeight) {
    this.organisms = [];
    const count = theme === 'winter' ? 3 : (theme === 'spring' ? 6 : 4);

    for (let i = 0; i < count; i++) {
        const x = Math.random() * canvasWidth;
        const y = 80 + Math.random() * (canvasHeight - 250);
        const dx = (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random());

        // Map theme to advanced entities
        let type = 'butterfly'; 
        if (theme === 'summer') type = 'ember';
        else if (theme === 'fall') type = 'origami';
        else if (theme === 'winter') type = 'jellyfish';

        this.organisms.push({
            type,
            x, y, dx,
            baseY: y,
            size: 15 + Math.random() * 10,
            time: Math.random() * 100,
            history: [] // For trails
        });
    }
  }

  update(canvasWidth) {
    for (const org of this.organisms) {
        org.time += 0.05;
        org.x += org.dx;

        // Kinematics based on type
        if (org.type === 'butterfly') {
            org.y = org.baseY + Math.sin(org.time * 2) * 20;
        } else if (org.type === 'ember') {
            org.y = org.baseY + Math.sin(org.time) * 15;
            org.history.push({x: org.x, y: org.y});
            if (org.history.length > 15) org.history.shift();
        } else if (org.type === 'origami') {
            org.y = org.baseY + Math.cos(org.time) * 25;
        } else if (org.type === 'jellyfish') {
            org.y = org.baseY - Math.abs(Math.sin(org.time)) * 10; // Pulsing upwards
        }

        // Screen wrapping
        if (org.dx > 0 && org.x > canvasWidth + 100) { org.x = -100; org.history = []; }
        else if (org.dx < 0 && org.x < -100) { org.x = canvasWidth + 100; org.history = []; }
    }
  }

  draw(ctx) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen'; // Magical glow effect
      for (const org of this.organisms) {
          if (org.type === 'butterfly') BioAnimator.drawEtherealButterfly(ctx, org);
          else if (org.type === 'ember') BioAnimator.drawEmberSpirit(ctx, org);
          else if (org.type === 'origami') BioAnimator.drawOrigamiRay(ctx, org);
          else if (org.type === 'jellyfish') BioAnimator.drawAbyssalJellyfish(ctx, org);
      }
      ctx.restore();
  }
}

class BioAnimator {
    static drawEtherealButterfly(ctx, org) {
        ctx.save();
        ctx.translate(org.x, org.y);
        if (org.dx < 0) ctx.scale(-1, 1);
        
        const flap = Math.abs(Math.sin(org.time * 3));
        
        ctx.fillStyle = 'hsla(160, 80%, 70%, 0.6)';
        ctx.shadowColor = 'hsla(160, 100%, 80%, 0.8)';
        ctx.shadowBlur = 15;

        // Wings
        ctx.beginPath();
        // Upper wing
        ctx.bezierCurveTo(0, 0, org.size * 1.5, -org.size * flap, org.size, org.size * 0.5);
        // Lower wing
        ctx.bezierCurveTo(org.size * 0.5, org.size * 1.5, -org.size * 0.2, org.size * flap, 0, 0);
        ctx.fill();

        ctx.restore();
    }

    static drawEmberSpirit(ctx, org) {
        if (org.history.length < 2) return;
        ctx.save();
        
        // Draw fire trail
        ctx.beginPath();
        ctx.moveTo(org.history[0].x, org.history[0].y);
        for (let i = 1; i < org.history.length; i++) {
            ctx.lineTo(org.history[i].x, org.history[i].y);
        }
        ctx.strokeStyle = 'hsla(30, 100%, 60%, 0.5)';
        ctx.lineWidth = org.size * 0.8;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'hsla(15, 100%, 50%, 0.8)';
        ctx.shadowBlur = 20;
        ctx.stroke();

        // Draw Core
        ctx.translate(org.x, org.y);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, org.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    static drawOrigamiRay(ctx, org) {
        ctx.save();
        ctx.translate(org.x, org.y);
        if (org.dx < 0) ctx.scale(-1, 1);
        
        const roll = Math.sin(org.time * 1.5) * 0.5 + 0.5; // 0 to 1

        ctx.fillStyle = 'hsla(45, 90%, 60%, 0.7)';
        ctx.shadowColor = 'hsla(20, 100%, 50%, 0.6)';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-org.size * 1.5, -org.size * 0.5 * roll);
        ctx.lineTo(org.size * 2, 0);
        ctx.lineTo(-org.size * 1.5, org.size * 0.5 * roll);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = 'hsla(15, 90%, 50%, 0.9)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-org.size * 1.0, 0);
        ctx.lineTo(org.size * 2, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    static drawAbyssalJellyfish(ctx, org) {
        ctx.save();
        ctx.translate(org.x, org.y);
        // Jellyfish rotates slightly based on dx
        ctx.rotate(org.dx * 0.2);
        
        const pulse = 1 + Math.sin(org.time * 4) * 0.1;
        ctx.scale(pulse, pulse);

        ctx.fillStyle = 'hsla(220, 100%, 75%, 0.5)';
        ctx.shadowColor = 'hsla(200, 100%, 80%, 0.8)';
        ctx.shadowBlur = 25;

        // Dome
        ctx.beginPath();
        ctx.arc(0, 0, org.size, Math.PI, 0);
        ctx.quadraticCurveTo(0, org.size * 0.3, -org.size, 0);
        ctx.fill();

        // Glowing Core
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, -org.size * 0.3, org.size * 0.3, 0, Math.PI*2);
        ctx.fill();

        // Tentacles
        ctx.strokeStyle = 'hsla(200, 100%, 80%, 0.6)';
        ctx.lineWidth = 2;
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            let tx = i * org.size * 0.5;
            let ty = 0;
            ctx.moveTo(tx, ty);
            for (let j = 0; j < 5; j++) {
                tx += Math.sin(org.time * 3 + j + i) * 3;
                ty += org.size * 0.6;
                ctx.lineTo(tx, ty);
            }
            ctx.stroke();
        }

        ctx.restore();
    }
}

window.BioManager = BioManager;
