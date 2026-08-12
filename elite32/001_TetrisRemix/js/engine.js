/**
 * UTT-v2.0 Logic: Tetris Remix Mechanics
 * Responsibility: Ada (Algorithm Design) & Xavier (Architecture)
 */

class TetrisEngine {
    constructor(cols = 10, rows = 20) {
        this.cols = cols;
        this.rows = rows;
        this.grid = this.createGrid();
        
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        
        this.activePiece = null;
        this.nextPiece = getRandomTetromino();
        this.holdPiece = null;
        this.canHold = true;
        
        this.isGameOver = false;
    }

    createGrid() {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    }

    reset() {
        this.grid = this.createGrid();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.activePiece = null;
        this.nextPiece = getRandomTetromino();
        this.holdPiece = null;
        this.canHold = true;
        this.isGameOver = false;
        this.spawnPiece();
    }

    spawnPiece() {
        this.activePiece = this.nextPiece;
        this.activePiece.pos = { x: Math.floor(this.cols / 2) - Math.floor(this.activePiece.matrix[0].length / 2), y: 0 };
        this.activePiece.rotation = 0; // Initialize rotation tracking
        this.nextPiece = getRandomTetromino();
        this.canHold = true;

        if (this.checkCollision(this.activePiece.pos, this.activePiece.matrix)) {
            this.isGameOver = true;
        }
    }

    checkCollision(pos, matrix) {
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x] !== 0) {
                    let nx = pos.x + x;
                    let ny = pos.y + y;
                    
                    if (nx < 0 || nx >= this.cols || ny >= this.rows || (ny >= 0 && this.grid[ny][nx] !== 0)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    move(dir) {
        let newPos = { x: this.activePiece.pos.x + dir.x, y: this.activePiece.pos.y + dir.y };
        if (!this.checkCollision(newPos, this.activePiece.matrix)) {
            this.activePiece.pos = newPos;
            return true;
        }
        return false;
    }

    rotate(dir) {
        let originalMatrix = this.activePiece.matrix.map(row => [...row]);
        this.activePiece.matrix = rotateMatrix(this.activePiece.matrix, dir);
        this.activePiece.rotation = (this.activePiece.rotation + (dir > 0 ? 1 : 3)) % 4; // Track rotation
        
        // Wall Kick simple implementation
        let offset = 1;
        let pos = this.activePiece.pos.x;
        while (this.checkCollision(this.activePiece.pos, this.activePiece.matrix)) {
            this.activePiece.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > this.activePiece.matrix[0].length) {
                this.activePiece.matrix = originalMatrix;
                this.activePiece.pos.x = pos;
                this.activePiece.rotation = (this.activePiece.rotation + (dir > 0 ? 3 : 1)) % 4; // Revert
                return;
            }
        }
    }

    drop() {
        let event = { type: 'move' };
        if (!this.move({ x: 0, y: 1 })) {
            const pieceColor = this.activePiece.color;
            const piecePos = { ...this.activePiece.pos };
            const pieceMatrix = this.activePiece.matrix.map(row => [...row]);
            
            this.lockPiece();
            const clearedLines = this.clearLines();
            this.spawnPiece();
            
            event = { 
                type: 'land', 
                color: pieceColor, 
                pos: piecePos, 
                matrix: pieceMatrix,
                clearedLines: clearedLines 
            };
        }
        return event;
    }

    hardDrop() {
        let dropDistance = 0;
        while (this.move({ x: 0, y: 1 })) {
            dropDistance++;
        }
        return this.drop();
    }

    lockPiece() {
        this.activePiece.matrix.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val !== 0) {
                    let ny = this.activePiece.pos.y + y;
                    let nx = this.activePiece.pos.x + x;
                    if (ny >= 0) this.grid[ny][nx] = this.activePiece.color;
                }
            });
        });
    }

    clearLines() {
        let clearedIndices = [];
        outer: for (let y = this.rows - 1; y >= 0; y--) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x] === 0) continue outer;
            }
            clearedIndices.push(y);
            this.grid.splice(y, 1);
            this.grid.unshift(Array(this.cols).fill(0));
            y++;
        }

        if (clearedIndices.length > 0) {
            this.lines += clearedIndices.length;
            this.score += [0, 100, 300, 500, 800][clearedIndices.length] * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
        }
        return clearedIndices;
    }

    hold() {
        if (!this.canHold) return;
        
        if (!this.holdPiece) {
            this.holdPiece = { key: this.activePiece.key, color: this.activePiece.color, matrix: SHAPES[this.activePiece.key].matrix.map(row => [...row]) };
            this.spawnPiece();
        } else {
            let tempKey = this.activePiece.key;
            this.activePiece = { key: this.holdPiece.key, color: this.holdPiece.color, matrix: SHAPES[this.holdPiece.key].matrix.map(row => [...row]), pos: { x: Math.floor(this.cols / 2) - 1, y: 0 } };
            this.holdPiece = { key: tempKey, color: SHAPES[tempKey].color, matrix: SHAPES[tempKey].matrix.map(row => [...row]) };
        }
        this.canHold = false;
    }

    getGhostPos() {
        let ghostPos = { ...this.activePiece.pos };
        while (!this.checkCollision({ x: ghostPos.x, y: ghostPos.y + 1 }, this.activePiece.matrix)) {
            ghostPos.y++;
        }
        return ghostPos;
    }
}
