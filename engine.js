import {
	PIECE,
	TURN,
	GAME_STATE,
	PIECE_VALUES,
	PST,
	ENDGAME_THRESHOLD,
} from "./constants.js";

import { kingInCheck } from "./validMoveGenerator.js";

export default class Engine {
	constructor(chessInstance) {
		this.chess = chessInstance;
	}

	getBestMove(depth) {
		const validMoves = this.chess.getAllValidMoves(this.chess.turn);

		// Failsafe: if no moves, the game is over, engine can't move.
		if (validMoves.length === 0) return null;

		// Default to the first valid move so we never return null accidentally
		let bestMove = validMoves[0];

		// White wants the highest score, Black wants the lowest score
		const isWhite = this.chess.turn === TURN.WHITE;
		let bestEval = isWhite ? -Infinity : Infinity;

		for (let move of validMoves) {
			this.chess.executeLogicalMove(move);

			// If we are White, the next turn is Black (Minimizing).
			// If we are Black, the next turn is White (Maximizing).
			let currentEval = this.minimax(
				depth - 1,
				-Infinity,
				Infinity,
				!isWhite,
			);

			this.chess.undoLogicalMove();

			if (isWhite) {
				if (currentEval > bestEval) {
					bestEval = currentEval;
					bestMove = move;
				}
			} else {
				if (currentEval < bestEval) {
					// Black actively seeks negative scores
					bestEval = currentEval;
					bestMove = move;
				}
			}
		}
		return bestMove;
	}

	minimax(depth, alpha, beta, isMaximizingPlayer) {
		// Evaluate at leaf nodes
		if (depth === 0 || this.chess.gameState !== GAME_STATE.PLAYING) {
			return this.evaluateBoard();
		}

		const moves = this.chess.getAllValidMoves(this.chess.turn);

		// If a node has no valid moves, it's either checkmate or stalemate
		if (moves.length === 0) {
			const isCheck = kingInCheck(
				this.chess.turn,
				this.chess.board.board,
				this.chess.moveHistory,
				this.chess.board.pieceColor.bind(this.chess.board),
			);

			if (isCheck) {
				// If it's the maximizing player's turn and they are in checkmate, Black won.
				// We add/subtract depth so the engine prefers faster checkmates!
				return isMaximizingPlayer ? -100000 + depth : 100000 - depth;
			}
			return 0; // Stalemate is neutral
		}

		if (isMaximizingPlayer) {
			let maxEval = -Infinity;
			for (let move of moves) {
				this.chess.executeLogicalMove(move);
				let evalScore = this.minimax(depth - 1, alpha, beta, false);
				this.chess.undoLogicalMove();

				maxEval = Math.max(maxEval, evalScore);
				alpha = Math.max(alpha, evalScore);
				if (beta <= alpha) break; // Alpha-Beta Pruning
			}
			return maxEval;
		} else {
			let minEval = Infinity;
			for (let move of moves) {
				this.chess.executeLogicalMove(move);
				let evalScore = this.minimax(depth - 1, alpha, beta, true);
				this.chess.undoLogicalMove();

				minEval = Math.min(minEval, evalScore);
				beta = Math.min(beta, evalScore);
				if (beta <= alpha) break; // Alpha-Beta Pruning
			}
			return minEval;
		}
	}

	evaluateBoard() {
		const board = this.chess.board.board;
		let whiteMaterial = 0;
		let blackMaterial = 0;

		for (let row = 0; row < 8; row++) {
			for (let col = 0; col < 8; col++) {
				const piece = board[row][col];
				if (piece === PIECE.EMPTY) continue;

				const type = piece.toLowerCase();
				if (type !== "k" && type !== "p") {
					if (piece === piece.toUpperCase())
						whiteMaterial += PIECE_VALUES[type];
					else blackMaterial += PIECE_VALUES[type];
				}
			}
		}

		const isEndgame =
			whiteMaterial < ENDGAME_THRESHOLD &&
			blackMaterial < ENDGAME_THRESHOLD;

		let evaluation = 0;

		for (let row = 0; row < 8; row++) {
			for (let col = 0; col < 8; col++) {
				const piece = board[row][col];
				if (piece === PIECE.EMPTY) continue;

				const isWhite = piece === piece.toUpperCase();
				const type = piece.toLowerCase();
				let value = PIECE_VALUES[type];

				// PST logic is correct: White reads top-to-bottom, Black reads upside-down
				const pstRow = isWhite ? row : 7 - row;
				let pstValue = 0;

				if (type === "k") {
					pstValue = isEndgame
						? PST.k_eg[pstRow][col]
						: PST.k_mg[pstRow][col];
				} else {
					pstValue = PST[type][pstRow][col];
				}

				if (isWhite) {
					evaluation += value + pstValue;
				} else {
					evaluation -= value + pstValue;
				}
			}
		}

		// CRITICAL FIX: ALWAYS return the evaluation from White's perspective.
		// Do not flip it based on whose turn it is.
		return evaluation;
	}
}
