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

    const resetBoard = () => {
        board.forEach(row => row.forEach(cell => cell.resetValue()));
    };

    const markCell = (cell, player) => {
        if (cell.getValue() === "") {
            cell.mark(player)
            return true
        } else {
            return false
        }
    } 

    return {
        getBoard,
        markCell,
        resetBoard
    }
}

// Cell object
function Cell() {
    let value = "";

    const mark = (playermark) => {
        value = playermark
    };

    const getValue = () => value;

    const resetValue = () => {value = ""};

    return {
        mark,
        getValue,
        resetValue
    }
}

// Player object
function Player(name, mark, score, bot) {
    return { name, mark, score, bot };
}

// GameController IIFE
const game = (function GameController() {
    const board = Gameboard();
    const playerX = Player("Player X", "X", 0, true);
    const playerO = Player("Player O", "O", 0, true);
    let activePlayer = playerX;
    let startingPlayer = playerX;
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

    const getBoard = () => board.getBoard();
    const getActivePlayer = () => activePlayer;
    const getPlayers = () => [playerX, playerO]
    const setPlayer = (name, mark) => {
        if (mark === "X") {
            playerX.name = name;
            playerX.bot = false;
            playerO.bot = true;
            playerO.name = "Bot O";
            activePlayer = playerX;
            startingPlayer = playerX;
        }
        if (mark === "O") {
            playerO.name = name;
            playerO.bot = false;
            playerX.bot = true;
            playerX.name = "Bot X";
            activePlayer = playerO;
            startingPlayer = playerO;
        }
    }

    const switchPlayerTurn = () => {
        activePlayer = activePlayer === playerX ? playerO : playerX;
    }
    const playTurn = (row, column) => {
        const freeCell = board.markCell(board.getBoard()[row][column], getActivePlayer().mark);
        if (freeCell) {
            const result = checkGameEnd();
            if (!result.over) switchPlayerTurn();
            return { ...result, moved: true };
        } else return { over: false, moved: false };
    }
    const checkGameEnd = () => {
        const boardArray = board.getBoard();
        const win = winningIdx.some((combination) => {
            const values = combination.map(([row, col]) => boardArray[row][col].getValue());
            return values.every(x => x !=="" && x === values[0]);
        }
        )
        if (win) {
            getActivePlayer().score++;
            return { over: true, winner: getActivePlayer() };
        }
        const tie = boardArray.every((row) =>
            row.every((cell) => cell.getValue() !== "")
        );
        if (tie) {
            playerX.score++;
            playerO.score++;
            return { over: true, winner: null };
        }

        return { over: false };
    };

    const findMove = (targetMark) => {
        const boardArray = board.getBoard();
        const combo = winningIdx.find((combination) => {
            const values = combination.map(([row, col]) => boardArray[row][col].getValue()); 
            return values.filter(v => v === targetMark).length === 2 &&
                    values.filter(v => v === "").length === 1;
        });
        return combo?.find(([row, col]) => boardArray[row][col].getValue() === "");
    } 
    
    const randomMove = () => {
        const boardArray = board.getBoard();
        const emptyCells = [];

        boardArray.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell.getValue() === "") emptyCells.push([r, c])
            });
        });
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    };

    const getBotMove = (marker) => {
        const opponentMark = marker === "X" ? "O" : "X";
        return findMove(marker) || findMove(opponentMark) || randomMove();
    }

    const resetGame = () => {
        board.resetBoard();
        startingPlayer = startingPlayer === playerX ? playerO : playerX;
        activePlayer = startingPlayer;
    };

    return {
        getActivePlayer,
        getPlayers,
        setPlayer,
        playTurn,
        getBoard,
        getBotMove,
        resetGame
    }

})();

const displayController = (function () {
    let gameOverFlag = false;
    const gameContainer = document.querySelector(".game-container");
    const dialogWindow = document.querySelector("#player-select");
    const markerBtns = document.querySelectorAll(".mark-select button");
    // Add event listeneres to dialog buttons
    markerBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                const playerName = document.querySelector("#player-name").value.trim();
                if (!playerName) return;
                game.setPlayer(playerName, btn.textContent);
                dialogWindow.close();
                updateDisplay();
                fireBotMove();
            })
        })
    dialogWindow.showModal();

    const renderDisplay = () => {
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
                    const result = game.playTurn(row, col);
                    gameOverFlag = result.over;
                    updateDisplay(result);

                    // Bot's turn
                    if (!gameOverFlag && result.moved) fireBotMove();

                }
            })
        }
    };

    const updateDisplay = (result = { over : false}) => {
        const board = game.getBoard();
        const squares = document.querySelectorAll(".square");
        squares.forEach(square => {
            const row = square.dataset.row;
            const col = square.dataset.col;
            const value = board[row][col].getValue();
            square.textContent = value;
            square.dataset.mark = value;
        })
        // Update turn indicator and scoresheet
        const activePlayer = game.getActivePlayer();
        const [playerOne, playerTwo] = game.getPlayers();
        const activePlayerDOM = document.querySelector("header .turn");
        const scoreSheet = document.querySelector(".score");
        scoreSheet.textContent = `Current score: ${playerOne.name} : ${playerTwo.name} ||  ${playerOne.score} : ${playerTwo.score}`
        if (!gameOverFlag) {
            activePlayerDOM.textContent = `${activePlayer.name}'s turn! Place an ${activePlayer.mark} in a free cell...`;
        } else {
            activePlayerDOM.textContent = "";
        }
        const gameEndMsg = document.querySelector(".game-end .message");
        if (result.over) {
            gameEndMsg.textContent = result.winner
                ? `${result.winner.name} wins!`
                : "It's a tie!";
        }
    };

    const fireBotMove = () => {
        if (game.getActivePlayer().bot) {
            gameOverFlag = true; // block input while bot is thinking
            setTimeout(() => {
                const [botRow, botCol] = game.getBotMove(game.getActivePlayer().mark);
                const botResult = game.playTurn(botRow, botCol);
                gameOverFlag = botResult.over;
                updateDisplay(botResult);
            }, 500);
        }
    };

    // Render and update the display
    renderDisplay();

    // Add event listener for Restart button
    const restartBtn = document.querySelector("#restart");
    restartBtn.addEventListener("click", () => {
        game.resetGame();
        gameOverFlag = false;
        renderDisplay();
        updateDisplay();
        document.querySelector(".game-end .message").textContent = "";
        fireBotMove();
    })
    }
)();
