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
