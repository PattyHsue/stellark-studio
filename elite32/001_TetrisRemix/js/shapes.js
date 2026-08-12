/**
 * UTT-v2.0 Component: Tetromino Geometric Definitions
 * Responsibility: Ada (Logic) & Maya (Visual Data)
 */

const SHAPES = {
    'I': {
        matrix: [
            [0,0,0,0],
            [1,1,1,1],
            [0,0,0,0],
            [0,0,0,0]
        ],
        color: '#00f2fe' // Cyan
    },
    'J': {
        matrix: [
            [1,0,0],
            [1,1,1],
            [0,0,0]
        ],
        color: '#0056e0' // Blue
    },
    'L': {
        matrix: [
            [0,0,1],
            [1,1,1],
            [0,0,0]
        ],
        color: '#ff8a00' // Orange
    },
    'O': {
        matrix: [
            [1,1],
            [1,1]
        ],
        color: '#ffee00' // Yellow
    },
    'S': {
        matrix: [
            [0,1,1],
            [1,1,0],
            [0,0,0]
        ],
        color: '#00ff00' // Green
    },
    'T': {
        matrix: [
            [0,1,0],
            [1,1,1],
            [0,0,0]
        ],
        color: '#9d50bb' // Purple
    },
    'Z': {
        matrix: [
            [1,1,0],
            [0,1,1],
            [0,0,0]
        ],
        color: '#ff0040' // Red
    }
};

const TETROMINO_KEYS = Object.keys(SHAPES);

function getRandomTetromino() {
    const key = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
    return {
        key: key,
        matrix: SHAPES[key].matrix.map(row => [...row]),
        color: SHAPES[key].color
    };
}

function rotateMatrix(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
    return matrix;
}
