import {
	PIECE,
	TURN,
	PIECE_IMAGE_POSITION,
	SPRITE_SIZE,
	SQUARE_SIZE,
	CHESS_SPRITE,
} from "./constants.js";

export default class Board {
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

		pieceDiv.style.backgroundImage = `url('${CHESS_SPRITE}')`;
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

	closeGameOverModal() {
		const modal = document.getElementById("game-over-modal");
        modal.style.display = "hidden";
	}
}
