// Gameboard object
function Gameboard() {
    const board = [];

    for (let i = 0; i < 3; i++) {
        board[i] = [];
        for (let j = 0; j < 3; j++) {
            board[i].push(Cell());
        }
    }

    const getBoard = () => board;

    const markCell = (cell, player) => {
        if (cell.getValue() === "") {
            cell.mark(player)
            return true
        } else {
            return false
        }
    } 

    const printBoard = () => {
        const boardCells = board.map((row) => 
            row.map((cell) => cell.getValue())
        );
        console.log(boardCells);
    }

    return {
        getBoard,
        markCell,
        printBoard
    }
}

// Cell object
function Cell() {
    let value = "";

    const mark = (playermark) => {
        value = playermark
    };

    const getValue = () => value;

    return {
        mark,
        getValue
    }
}

// Player object
function Player(name, mark) {
    return { name, mark };
}

// GameController IIFE
const game = (function GameController() {
    const board = Gameboard();
    const playerX = Player("Player X", "X");
    const playerO = Player("Player O", "O");
    let activePlayer = playerX;

    const getBoard = () => board.getBoard();
    const getActivePlayer = () => activePlayer;

    const switchPlayerTurn = () => {
        activePlayer = activePlayer === playerX ? playerO : playerX;
    }
    const printTurn = () => {
        board.printBoard();
        console.log(`${getActivePlayer().name}'s turn to play...`)
    }
    const playTurn = (row, column) => {
        const freeCell = board.markCell(board.getBoard()[row][column], getActivePlayer().mark);
        if (freeCell) {
            const gameOver = checkGameEnd();
            if (!gameOver) {
                switchPlayerTurn();
                printTurn();    
            }
            return gameOver;
        } else {
            console.log(`Cell row:${row} column:${column} is already occupied please try again!`)
        }
        return false
        
    }
    const checkGameEnd = () => {
        const boardArray = board.getBoard();
        const winningIdx = [
            [[0, 0], [0, 1], [0, 2]],
            [[1, 0], [1, 1], [1, 2]], 
            [[2, 0], [2, 1], [2, 2]],
            [[0, 0], [1, 0], [2, 0]],
            [[0, 1], [1, 1], [2, 1]],
            [[0, 2], [1, 2], [2, 2]],
            [[0, 0], [1, 1], [2, 2]],
            [[2, 0], [1, 1], [0, 2]],
        ];
        const win = winningIdx.some((combination) => {
            const values = combination.map(([row, col]) => boardArray[row][col].getValue());
            return values.every(x => x !=="" && x === values[0]);
        }
        )
        if (!win) {
            const tie = boardArray.every((row) =>
                row.every((cell) => cell.getValue() !== "")
            )
            if (tie) {
                const gameEnd = document.querySelector(".game-end .message");
                gameEnd.textContent = "It's a tie! Game over...";
                console.log("It's a tie! Game over...")
                return true
            }
        } else {
            const gameEnd = document.querySelector(".game-end .message");
            gameEnd.textContent = `Game is over, we have a winner: ${getActivePlayer().name}!`
            console.log(`Game is over, we have a winner: ${getActivePlayer().name}!`)
            return true
        }
        };

    printTurn();

    return {
        getActivePlayer,
        playTurn,
        getBoard
    }

})();

const displayController = (function () {
    let gameOverFlag = false;
    const gameContainer = document.querySelector(".game-container");
    gameContainer.innerHTML = "";

    for (let i = 0; i < 9; i++) {
        let square = document.createElement("div");
        square.classList.add("square");
        square.dataset.row = Math.floor(i / 3);
        square.dataset.col = i % 3;
        gameContainer.appendChild(square);

        // Add event listeners to the cells
        square.addEventListener("click", (e) => {
            if (!gameOverFlag) {
                const row = e.target.dataset.row;
                const col = e.target.dataset.col;
                gameOverFlag = game.playTurn(row, col); 
                updateDisplay();
            }
        })
    }

    const updateDisplay = () => {
        const board = game.getBoard();
        const squares = document.querySelectorAll(".square");
        squares.forEach(square => {
            const row = square.dataset.row;
            const col = square.dataset.col;
            square.textContent = board[row][col].getValue();
        })
        // Update turn indicator
        const activePlayer = game.getActivePlayer();
        const activePlayerDOM = document.querySelector(".header .turn");
        if (!gameOverFlag) {
            activePlayerDOM.textContent = `${activePlayer.name}'s turn! Place an ${activePlayer.mark} in a free cell...`;
        } else {
            activePlayerDOM.textContent = "";
        }
        

        }
    }
)();
