import {
	PIECE,
	TURN,
	PIECE_IMAGE_POSITION,
	SPRITE_SIZE,
	SQUARE_SIZE,
	GAME_STATE,
	START_FEN,
	MAX_DEPTH_FOR_ENGINE
} from "./constants.js";

import { MoveGen, checkmate, stalemate } from "./validMoveGenerator.js";

import { Engine } from "./engine.js";

class Move {
	constructor(
		from,
		to,
		turn,
		pieceMoved,
		pieceCaptured,
		isEnPassant = false,
		isCastling = false,
	) {
		// from and to are objects with x and y properties
		// turn is either "white" or "black"
		// pieceMoved is the piece that was moved, pieceCaptured is the piece that was captured (if any)

		this.from = from;
		this.to = to;
		this.turn = turn;
		this.pieceMoved = pieceMoved;
		this.pieceCaptured = pieceCaptured;
		this.isEnPassant = isEnPassant;
		this.isCastling = isCastling;
	}

	isPawnPromotion() {
		if (this.pieceMoved === PIECE.WHITE_PAWN && this.to.x === 0) {
			return true;
		}
		if (this.pieceMoved === PIECE.BLACK_PAWN && this.to.x === 7) {
			return true;
		}
		return false;
	}
}

class Board {
	constructor(fen) {
		this.board = this.fromFEN(fen);
		this.boardDOM = document.getElementById("board");

		this.createBoardDOM();
	}

	fromFEN(fen) {
		const boardPart = fen.split(" ")[0];
		const ranks = boardPart.split("/");
		const board = [];

		for (let rank of ranks) {
			const row = [];
			for (let i = 0; i < rank.length; i++) {
				const char = rank[i];
				if (isNaN(char)) {
					row.push(char);
				} else {
					// Fill empty spaces
					const emptyCount = parseInt(char);
					for (let j = 0; j < emptyCount; j++) {
						row.push(PIECE.EMPTY);
					}
				}
			}
			board.push(row);
		}
		return board;
	}

	createBoardDOM() {
		this.boardDOM.innerHTML = ""; // Clear previous board

		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				const square = document.createElement("div");
				square.classList.add("square");
				square.classList.add((i + j) % 2 === 0 ? "light" : "dark");

				square.appendChild(this.setPieceImage(this.board[i][j]));
				this.boardDOM.appendChild(square);
			}
		}
	}

	setPieceImage(piece) {
		const pieceDiv = document.createElement("div");
		pieceDiv.classList.add("piece");

		if (piece === PIECE.EMPTY) {
			pieceDiv.style.backgroundImage = "none";
			return pieceDiv;
		}

		const [row, col] = PIECE_IMAGE_POSITION[piece];

		pieceDiv.style.backgroundImage = "url('./Chess_Pieces_Sprite.svg')";
		pieceDiv.style.backgroundSize = `${6 * SQUARE_SIZE}px ${2 * SQUARE_SIZE}px`;
		pieceDiv.style.backgroundPosition = `${-col * SQUARE_SIZE}px ${-row * SQUARE_SIZE}px`;
		return pieceDiv;
	}

	pieceColor(piece) {
		if (piece === PIECE.EMPTY) return null;
		return piece === piece.toUpperCase() ? TURN.WHITE : TURN.BLACK;
	}

	showWrongSelectionAnimation(x, y) {
		// console.log("wrong click");

		// vibrate the square, with a red overlay for 0.5s
		const square = this.boardDOM.children[x * 8 + y];
		const pieceDiv = square.firstChild;

		pieceDiv.classList.add("wrong-selection");

		setTimeout(() => {
			pieceDiv.classList.remove("wrong-selection");
		}, 500);
	}

	updatePosition(x1, y1, piece) {
		this.board[x1][y1] = piece;
		this.updateBoardDOM();
	}

	updateBoardDOM() {
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				const square = this.boardDOM.children[i * 8 + j];

				square.innerHTML = "";
				square.appendChild(this.setPieceImage(this.board[i][j]));
			}
		}
	}

	highlightValidMoves(validMoves, turn) {
		for (let move of validMoves) {
			const [x, y] = move;
			// for each move, if there is a piece of the other color, place a circle encircling the piece, else create a small circle in the center of the square
			const square = this.boardDOM.children[x * 8 + y];
			const piece = this.board[x][y];

			if (this.pieceColor(piece) !== turn && piece !== PIECE.EMPTY) {
				square.classList.add("encircle");
			} else {
				square.classList.add("highlight");
			}
		}
	}

	removeHighlightsAndEncircles() {
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				const square = this.boardDOM.children[i * 8 + j];
				square.classList.remove("highlight");
				square.classList.remove("encircle");
			}
		}
	}

	highlightLastMove(move) {
		// reset all the last-move classes
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				const square = this.boardDOM.children[i * 8 + j];
				square.classList.remove("last-move");
			}
		}

		const { from, to } = move;

		this.boardDOM.children[from.x * 8 + from.y].classList.add("last-move");
		this.boardDOM.children[to.x * 8 + to.y].classList.add("last-move");
	}

	openPromotionModal(turn, callback) {
		const modal = document.getElementById("promotion-modal");
		modal.style.display = "flex";

		const promotionOptions = document.getElementById("promotion-options");
		promotionOptions.innerHTML = "";

		const pieces = [
			turn === TURN.WHITE ? PIECE.WHITE_QUEEN : PIECE.BLACK_QUEEN,
			turn === TURN.WHITE ? PIECE.WHITE_ROOK : PIECE.BLACK_ROOK,
			turn === TURN.WHITE ? PIECE.WHITE_BISHOP : PIECE.BLACK_BISHOP,
			turn === TURN.WHITE ? PIECE.WHITE_KNIGHT : PIECE.BLACK_KNIGHT,
		];

		for (let piece of pieces) {
			const pieceDiv = document.createElement("div");
			pieceDiv.classList.add("promotion-piece");
			pieceDiv.appendChild(this.setPieceImage(piece));
			pieceDiv.addEventListener("click", () => {
				modal.style.display = "none";
				callback(piece);
			});
			promotionOptions.appendChild(pieceDiv);
		}
	}

	showGameOverModal(title, subtitle) {
		const modal = document.getElementById("game-over-modal");
		const titleElement = document.getElementById("game-over-title");
		const subtitleElement = document.getElementById("game-over-subtitle");

		titleElement.textContent = title;
		subtitleElement.textContent = subtitle;

		modal.style.display = "flex";
	}
}

class Chess {
	constructor(fen = START_FEN) {
		this.board = new Board(fen);
		this.selectedSquare = null;
		this.validMovesOfSelection = [];
		this.turn =
			fen.split(" ").length > 1
				? fen.split(" ")[1].toLowerCase() === "w"
					? TURN.WHITE
					: TURN.BLACK
				: TURN.WHITE;

		this.moveHistory = [];
		this.gameState = GAME_STATE.PLAYING;

		// the chess engine attached
		this.engine = new Engine(this);

		this.board.boardDOM.addEventListener("click", (event) => {
			const rect = this.board.boardDOM.getBoundingClientRect();
			const x = Math.floor((event.clientY - rect.top) / SQUARE_SIZE);
			const y = Math.floor((event.clientX - rect.left) / SQUARE_SIZE);

			this.handleClick(x, y);
		});
	}

	handleClick(x, y) {
		// Game has ended
		if (this.gameState !== GAME_STATE.PLAYING) {
			return;
		}

		// no square is already selected to make a move, so select the square
		if (!this.selectedSquare) {
			this.selectSquare(x, y);
			return;
		}

		// some square is already selected, check if the clicked square is a valid move
		const { x: x1, y: y1 } = this.selectedSquare;

		// check if same square clicked
		if (x1 === x && y1 === y) {
			this.unselectSquare();
			return;
		}

		// check if the same color piece is clicked, if so, change the selection
		if (
			this.board.pieceColor(this.board.board[x][y]) === this.turn &&
			this.board.board[x][y] !== PIECE.EMPTY
		) {
			this.selectSquare(x, y);
			return;
		}

		// the move needs to be in the valid moves of the selected piece
		let rawMove = this.validMovesOfSelection.find(
			(move) => move[0] === x && move[1] === y,
		);

		if (!rawMove) {
			this.board.showWrongSelectionAnimation(x, y);
			this.board.removeHighlightsAndEncircles();
			this.selectedSquare = null;
			return;
		}

		let move = new Move(
			{ x: x1, y: y1 },
			{ x, y },
			this.turn,
			this.board.board[x1][y1],
			this.board.board[x][y] === PIECE.EMPTY
				? null
				: this.board.board[x][y],
			rawMove.length > 2 && rawMove[2] === true, // isEnPassant
			rawMove.length > 3 && rawMove[3] === true, // isCastling
		);

		// add the move to history
		this.moveHistory.push(move);

		// make the move on the board
		this.board.updatePosition(x, y, this.board.board[x1][y1]);
		this.board.updatePosition(x1, y1, PIECE.EMPTY);

		if (move.isEnPassant) this.captureEnPassantPawn(x, y);
		if (move.isCastling) this.moveRookForCastle(x, y);
		if (move.isPawnPromotion()) this.promotePawn(x, y);

		this.unselectSquare();
		this.switchTurn();

		// highlight the last move
		this.board.highlightLastMove(
			this.moveHistory[this.moveHistory.length - 1],
		);
	}

	genValidMoves(x, y) {
		const piece = this.board.board[x][y];

		return MoveGen(
			x,
			y,
			this.board.pieceColor(piece),
			this.board.board,
			this.moveHistory,
			this.board.pieceColor.bind(this.board),
		);
	}

	getAllValidMoves(color) {
		const allMoves = [];
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				if (this.board.pieceColor(this.board.board[i][j]) !== color)
					continue;

				// Get raw coordinates from your generator
				const rawMoves = this.genValidMoves(i, j);

				// Convert raw coordinates into Move objects for the engine
				for (let rawMove of rawMoves) {
					const targetX = rawMove[0];
					const targetY = rawMove[1];

					allMoves.push(
						new Move(
							{ x: i, y: j },
							{ x: targetX, y: targetY },
							color,
							this.board.board[i][j], // pieceMoved
							this.board.board[targetX][targetY] === PIECE.EMPTY
								? null
								: this.board.board[targetX][targetY], // pieceCaptured
							rawMove.length > 2 && rawMove[2] === true, // isEnPassant
							rawMove.length > 3 && rawMove[3] === true, // isCastling
						),
					);
				}
			}
		}
		return allMoves;
	}

	selectSquare(x, y) {
		this.unselectSquare();

		// trying to select an empty square
		if (this.board.board[x][y] === PIECE.EMPTY) return;

		// trying to select opponent's piece
		if (this.board.pieceColor(this.board.board[x][y]) !== this.turn) {
			this.board.showWrongSelectionAnimation(x, y);
			return;
		}

		// trying to select my own piece

		// get valid moves of the piece
		this.validMovesOfSelection = this.genValidMoves(x, y);

		if (this.validMovesOfSelection.length === 0) {
			this.board.showWrongSelectionAnimation(x, y);
			return;
		}

		this.selectedSquare = { x, y };
		this.board.highlightValidMoves(this.validMovesOfSelection, this.turn);
	}

	unselectSquare() {
		this.selectedSquare = null;
		this.validMovesOfSelection = [];
		this.board.removeHighlightsAndEncircles();
	}

	moveRookForCastle(x, y) {
		if (y === 6) {
			// king-side castling
			this.board.updatePosition(x, 5, this.board.board[x][7]);
			this.board.updatePosition(x, 7, PIECE.EMPTY);
		} else if (y === 2) {
			// queen-side castling
			this.board.updatePosition(x, 3, this.board.board[x][0]);
			this.board.updatePosition(x, 0, PIECE.EMPTY);
		}
	}

	captureEnPassantPawn(x, y) {
		// en passant capture, remove the captured pawn
		const direction = this.turn === TURN.WHITE ? 1 : -1;
		this.board.updatePosition(x + direction, y, PIECE.EMPTY);
	}

	promotePawn(x, y) {
		this.board.openPromotionModal(this.turn, (promotedPiece) =>
			this.board.updatePosition(x, y, promotedPiece),
		);
	}

	switchTurn() {
		this.turn = this.turn === TURN.WHITE ? TURN.BLACK : TURN.WHITE;

		this.updateGameState();

		switch (this.gameState) {
			case GAME_STATE.CHECKMATE:
				console.log(`${this.turn} is checkmated.`);
				this.endgame();
				break;

			case GAME_STATE.STALEMATE:
				console.log("Stalemate.");
				this.endgame();
				break;
		}

		// If it's Black's turn, tell the engine to make a move
		if (this.turn === TURN.BLACK) {
			// Use setTimeout to allow the DOM to update the human's last move
			// visually before the heavy engine calculation freezes the thread
			setTimeout(() => {
				this.playEngineMove();
			}, 50);
		}
	}

	updateGameState() {
		if (
			checkmate(
				this.turn,
				this.board.board,
				this.moveHistory,
				this.board.pieceColor.bind(this.board),
			)
		) {
			this.gameState = GAME_STATE.CHECKMATE;
			return;
		}

		if (
			stalemate(
				this.turn,
				this.board.board,
				this.moveHistory,
				this.board.pieceColor.bind(this.board),
			)
		) {
			this.gameState = GAME_STATE.STALEMATE;
			return;
		}

		this.gameState = GAME_STATE.PLAYING;
	}

	endgame() {
		// Prevent any further selections
		this.selectedSquare = null;
		this.validMovesOfSelection = [];

		this.board.removeHighlightsAndEncircles();

		// Disable the board
		this.board.boardDOM.style.pointerEvents = "none";
		this.board.boardDOM.style.opacity = "0.85";

		let title = "";
		let subtitle = "";

		switch (this.gameState) {
			case GAME_STATE.CHECKMATE:
				title = "Checkmate";

				// this.turn is the side that has just been checkmated
				subtitle =
					this.turn === TURN.WHITE ? "Black wins!" : "White wins!";
				break;

			case GAME_STATE.STALEMATE:
				title = "Stalemate";
				subtitle = "Draw";
				break;

			case GAME_STATE.DRAW:
				title = "Draw";
				subtitle = "";
				break;

			case GAME_STATE.THREEFOLD_REPETITION:
				title = "Draw";
				subtitle = "Threefold Repetition";
				break;

			default:
				return;
		}

		this.board.showGameOverModal(title, subtitle);
	}

	executeLogicalMove(move) {
		const { from, to, pieceMoved, isEnPassant, isCastling } = move;

		// 1. Move the main piece
		this.board.board[to.x][to.y] = pieceMoved;
		this.board.board[from.x][from.y] = PIECE.EMPTY;

		// 2. Handle special moves
		if (isEnPassant) {
			const direction = this.turn === TURN.WHITE ? 1 : -1;
			this.board.board[to.x + direction][to.y] = PIECE.EMPTY;
		} else if (isCastling) {
			if (to.y === 6) {
				// King-side
				this.board.board[from.x][5] = this.board.board[from.x][7];
				this.board.board[from.x][7] = PIECE.EMPTY;
			} else if (to.y === 2) {
				// Queen-side
				this.board.board[from.x][3] = this.board.board[from.x][0];
				this.board.board[from.x][0] = PIECE.EMPTY;
			}
		} else if (move.isPawnPromotion()) {
			// For engine search, automatically promote to Queen to save tree depth
			// TODO: allow the engine to explore other pawn promotions
			const promotedPiece =
				this.turn === TURN.WHITE
					? PIECE.WHITE_QUEEN
					: PIECE.BLACK_QUEEN;
			this.board.board[to.x][to.y] = promotedPiece;
		}

		// 3. Update state
		this.moveHistory.push(move);
		this.turn = this.turn === TURN.WHITE ? TURN.BLACK : TURN.WHITE;
	}

	undoLogicalMove() {
		const move = this.moveHistory.pop();
		if (!move) return;

		const { from, to, pieceMoved, pieceCaptured, isEnPassant, isCastling } =
			move;

		// 1. Revert turn
		this.turn = this.turn === TURN.WHITE ? TURN.BLACK : TURN.WHITE;

		// 2. Move the main piece back (this naturally reverts pawn promotions too)
		this.board.board[from.x][from.y] = pieceMoved;
		// Restore captured piece, or set to empty if nothing was captured
		this.board.board[to.x][to.y] = pieceCaptured || PIECE.EMPTY;

		// 3. Handle special move reversions
		if (isEnPassant) {
			this.board.board[to.x][to.y] = PIECE.EMPTY; // Clear the target square
			const direction = this.turn === TURN.WHITE ? 1 : -1;
			const capturedPawn =
				this.turn === TURN.WHITE ? PIECE.BLACK_PAWN : PIECE.WHITE_PAWN;
			this.board.board[to.x + direction][to.y] = capturedPawn;
		} else if (isCastling) {
			if (to.y === 6) {
				// King-side
				this.board.board[from.x][7] = this.board.board[from.x][5]; // Rook back to corner
				this.board.board[from.x][5] = PIECE.EMPTY;
			} else if (to.y === 2) {
				// Queen-side
				this.board.board[from.x][0] = this.board.board[from.x][3]; // Rook back to corner
				this.board.board[from.x][3] = PIECE.EMPTY;
			}
		}
	}

	playEngineMove() {
		// 1. Ask engine for best move (e.g., search depth of 4)
		const bestMove = this.engine.getBestMove(MAX_DEPTH_FOR_ENGINE);

		if (!bestMove) return;

		// 2. Extract coordinates
		const { from, to, pieceMoved, isEnPassant, isCastling } = bestMove;

		// 3. Update the physical board UI (similar to the bottom half of handleClick)
		this.moveHistory.push(bestMove);

		this.board.updatePosition(to.x, to.y, pieceMoved);
		this.board.updatePosition(from.x, from.y, PIECE.EMPTY);

		if (isEnPassant) this.captureEnPassantPawn(to.x, to.y);
		if (isCastling) this.moveRookForCastle(to.x, to.y);
		if (bestMove.isPawnPromotion()) {
			// For the engine, auto-promote to Queen so it doesn't open the modal
			// TODO: allow the engine to explore other pawn promotions.
			this.board.updatePosition(to.x, to.y, PIECE.BLACK_QUEEN);
		}

		// 4. Highlight and switch back to human
		this.board.highlightLastMove(bestMove);
		this.switchTurn();
	}
}

window.onload = () => {
	const chess = new Chess();
};
