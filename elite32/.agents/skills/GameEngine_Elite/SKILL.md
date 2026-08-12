---
name: GameEngine_Elite
description: A high-performance, modular game engine for flagship web arcade games. Includes physics, audio synthesis, and AI auto-pilot.
---

# GameEngine_Elite (Local Version)

This skill provides the core logic for industrial-grade web games in the UTT-v2.0 ecosystem. 
Note: This is a local instance synchronized for Game30_26M4.

## Core Components

1. **EliteEngine**: Main core using `requestAnimationFrame`. Decouples logic from rendering.
2. **AudioManager**: Pure Web Audio API synthesis. Supports procedural BGM and SFX without external assets.
3. **ParticleEmitter**: High-fidelity VFX system for impact and destruction.
4. **AutoPilot**: Strategic AI using `lerp` for smooth tracking and path prediction.

## Implementation Standard

- **Physics**: 4-Corner Sync collision detection.
- **UI**: Glassmorphism HUD with CSS Design Tokens.
- **Mobile**: Unified Mouse/Touch event mapping.

## Usage

Initialize by instantiating `EliteEngine`.

```javascript
const engine = new EliteEngine();
```
