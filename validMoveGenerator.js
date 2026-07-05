import { PIECE, TURN } from "./constants.js";

const PIECE_MOVE_FUNCTIONS = {
	[PIECE.WHITE_KING]: MovesOfKing,
	[PIECE.WHITE_QUEEN]: MovesOfQueen,
	[PIECE.WHITE_ROOK]: MovesOfRook,
	[PIECE.WHITE_BISHOP]: MovesOfBishop,
	[PIECE.WHITE_KNIGHT]: MovesOfKnight,
	[PIECE.WHITE_PAWN]: MovesOfPawn,
	[PIECE.BLACK_KING]: MovesOfKing,
	[PIECE.BLACK_QUEEN]: MovesOfQueen,
	[PIECE.BLACK_ROOK]: MovesOfRook,
	[PIECE.BLACK_BISHOP]: MovesOfBishop,
	[PIECE.BLACK_KNIGHT]: MovesOfKnight,
	[PIECE.BLACK_PAWN]: MovesOfPawn,
};

export function MovesOfRook(
	x,
	y,
	color,
	board,
	moveHistory,
	pieceColorDeterminer,
) {
	const validMoves = [];

	// check all four directions (up, down, left, right) for valid moves
	const directions = [
		[-1, 0], // up
		[1, 0], // down
		[0, -1], // left
		[0, 1], // right
	];

	for (const [dx, dy] of directions) {
		let newX = x + dx;
		let newY = y + dy;

		while (newX >= 0 && newX < 8 && newY >= 0 && newY < 8) {
			if (board[newX][newY] === PIECE.EMPTY) {
				validMoves.push([newX, newY]);
			} else {
				// if the square is occupied, check if it's an opponent's piece
				if (pieceColorDeterminer(board[newX][newY]) !== color) {
					validMoves.push([newX, newY]);
				}
				break; // stop searching in this direction
			}
			newX += dx;
			newY += dy;
		}
	}

	return validMoves;
}

export function MovesOfKnight(
	x,
	y,
	color,
	board,
	moveHistory,
	pieceColorDeterminer,
) {
	const validMoves = [];
	const knightMoves = [
		[-2, -1],
		[-2, 1],
		[-1, -2],
		[-1, 2],
		[1, -2],
		[1, 2],
		[2, -1],
		[2, 1],
	];

	for (const [dx, dy] of knightMoves) {
		const newX = x + dx;
		const newY = y + dy;

		if (newX >= 0 && newX < 8 && newY >= 0 && newY < 8) {
			if (board[newX][newY] === PIECE.EMPTY) {
				validMoves.push([newX, newY]);
			} else {
				if (pieceColorDeterminer(board[newX][newY]) !== color) {
					validMoves.push([newX, newY]);
				}
			}
		}
	}

	return validMoves;
}

export function MovesOfBishop(
	x,
	y,
	color,
	board,
	moveHistory,
	pieceColorDeterminer,
) {
	const validMoves = [];

	// check all four diagonal directions for valid moves
	const directions = [
		[-1, -1], // up-left
		[-1, 1], // up-right
		[1, -1], // down-left
		[1, 1], // down-right
	];

	for (const [dx, dy] of directions) {
		let newX = x + dx;
		let newY = y + dy;

		while (newX >= 0 && newX < 8 && newY >= 0 && newY < 8) {
			if (board[newX][newY] === PIECE.EMPTY) {
				validMoves.push([newX, newY]);
			} else {
				// if the square is occupied, check if it's an opponent's piece
				if (pieceColorDeterminer(board[newX][newY]) !== color) {
					validMoves.push([newX, newY]);
				}
				break; // stop searching in this direction
			}
			newX += dx;
			newY += dy;
		}
	}

	return validMoves;
}

export function MovesOfQueen(
	x,
	y,
	color,
	board,
	moveHistory,
	pieceColorDeterminer,
) {
	return [
		...MovesOfRook(x, y, color, board, moveHistory, pieceColorDeterminer),
		...MovesOfBishop(x, y, color, board, moveHistory, pieceColorDeterminer),
	];
}

export function MovesOfKing(
	x,
	y,
	color,
	board,
	moveHistory,
	pieceColorDeterminer,
	includeCastling = true,
) {
	const validMoves = [];
	const kingMoves = [
		[-1, -1],
		[-1, 0],
		[-1, 1],
		[0, -1],
		[0, 1],
		[1, -1],
		[1, 0],
		[1, 1],
	];

	for (const [dx, dy] of kingMoves) {
		const newX = x + dx;
		const newY = y + dy;

		if (newX >= 0 && newX < 8 && newY >= 0 && newY < 8) {
			if (board[newX][newY] === PIECE.EMPTY) {
				validMoves.push([newX, newY]);
			} else {
				if (pieceColorDeterminer(board[newX][newY]) !== color) {
					validMoves.push([newX, newY]);
				}
			}
		}
	}

	if (includeCastling) {
		// check if the king and the rook have not moved, and if the squares between them are empty and not under attack
		const kingMoved = moveHistory.some(
			(move) =>
				move.pieceMoved ===
				(color === TURN.WHITE ? PIECE.WHITE_KING : PIECE.BLACK_KING),
		);
		const kingOnOriginalSquare =
			color === TURN.WHITE ? x === 7 && y === 4 : x === 0 && y === 4;

		const kingSideRookMoved = moveHistory.some(
			(move) =>
				move.pieceMoved ===
					(color === TURN.WHITE
						? PIECE.WHITE_ROOK
						: PIECE.BLACK_ROOK) && move.from.y === 7,
		);
		const kingSideRookExists =
			board[x][7] ===
			(color === TURN.WHITE ? PIECE.WHITE_ROOK : PIECE.BLACK_ROOK);

		const queenSideRookMoved = moveHistory.some(
			(move) =>
				move.pieceMoved ===
					(color === TURN.WHITE
						? PIECE.WHITE_ROOK
						: PIECE.BLACK_ROOK) && move.from.y === 0,
		);
		const queenSideRookExists =
			board[x][0] ===
			(color === TURN.WHITE ? PIECE.WHITE_ROOK : PIECE.BLACK_ROOK);

		if (kingOnOriginalSquare && !kingMoved) {
			// King-side castling
			if (
				kingSideRookExists &&
				!kingSideRookMoved &&
				board[x][y + 1] === PIECE.EMPTY &&
				board[x][y + 2] === PIECE.EMPTY &&
				!kingInCheck(color, board, moveHistory, pieceColorDeterminer) &&
				!middleSquaresUnderAttack(
					x,
					y,
					color,
					board,
					moveHistory,
					pieceColorDeterminer,
					"king",
				)
			) {
				validMoves.push([x, y + 2, false, true]); // Castling move
			}
			// Queen-side castling
			if (
				queenSideRookExists &&
				!queenSideRookMoved &&
				board[x][y - 1] === PIECE.EMPTY &&
				board[x][y - 2] === PIECE.EMPTY &&
				board[x][y - 3] === PIECE.EMPTY &&
				!kingInCheck(color, board, moveHistory, pieceColorDeterminer) &&
				!middleSquaresUnderAttack(
					x,
					y,
					color,
					board,
					moveHistory,
					pieceColorDeterminer,
					"queen",
				)
			) {
				validMoves.push([x, y - 2, false, true]); // Castling move
			}
		}
	}

	return validMoves;
}

export function MovesOfPawn(
	x,
	y,
	color,
	board,
	moveHistory,
	pieceColorDeterminer,
) {
	const validMoves = [];

	// check if the pawn can move forward one square
	const direction = color === TURN.WHITE ? -1 : 1;
	const nextRow = x + direction;

	if (nextRow >= 0 && nextRow < 8 && board[nextRow][y] === PIECE.EMPTY) {
		validMoves.push([nextRow, y]);
	}

	// check if the pawn can move forward two squares from its starting position
	const startingRow = color === TURN.WHITE ? 6 : 1;
	if (
		x === startingRow &&
		board[nextRow][y] === PIECE.EMPTY &&
		board[nextRow + direction][y] === PIECE.EMPTY
	) {
		validMoves.push([nextRow + direction, y]);
	}

	// check if the pawn can capture an opponent's piece diagonally
	for (const dy of [-1, 1]) {
		const nextCol = y + dy;
		if (
			nextCol >= 0 &&
			nextCol < 8 &&
			board[nextRow][nextCol] !== PIECE.EMPTY &&
			pieceColorDeterminer(board[nextRow][nextCol]) !== color
		) {
			validMoves.push([nextRow, nextCol]);
		}
	}

	// check if the pawn can perform an en passant capture
	const lastMove = moveHistory[moveHistory.length - 1];

	// lastMove is a Move class Object with properties: from, to, turn, pieceMoved, pieceCaptured
	if (
		lastMove &&
		(lastMove.pieceMoved === PIECE.WHITE_PAWN ||
			lastMove.pieceMoved === PIECE.BLACK_PAWN) &&
		Math.abs(lastMove.from.x - lastMove.to.x) === 2
	) {
		const enPassantRow = color === TURN.WHITE ? 3 : 4;
		if (
			x === enPassantRow &&
			Math.abs(lastMove.to.y - y) === 1 &&
			lastMove.to.x === x
		) {
			// true indicates that this move is an en passant capture
			validMoves.push([nextRow, lastMove.to.y, true]);
		}
	}

	return validMoves;
}

export function MoveGen(
	x,
	y,
	color,
	board,
	moveHistory,
	pieceColorDeterminer,
	checkKingSafety = true,
	includesCastling = true,
) {
	const moveFunc = PIECE_MOVE_FUNCTIONS[board[x][y]];
	let validMoves = moveFunc(
		x,
		y,
		color,
		board,
		moveHistory,
		pieceColorDeterminer,
		includesCastling,
	);

	// TODO: filter moves that would put the king in check if moved
	if (checkKingSafety) {
		validMoves = validMoves.filter(
			(move) =>
				!wouldPutKingInCheck(
					x,
					y,
					move,
					board,
					color,
					pieceColorDeterminer,
				),
		);
	}

	return validMoves;
}

export function squareUnderAttack(
	x,
	y,
	color,
	board,
	moveHistory,
	pieceColorDeterminer,
) {
	for (let i = 0; i < 8; i++) {
		for (let j = 0; j < 8; j++) {
			if (
				board[i][j] === PIECE.EMPTY ||
				pieceColorDeterminer(board[i][j]) === color
			)
				continue;

			const opponentMoves = MoveGen(
				i,
				j,
				pieceColorDeterminer(board[i][j]),
				board,
				moveHistory,
				pieceColorDeterminer,
				false,
				false,
			);

			if (
				opponentMoves.some(
					(opponentMove) =>
						opponentMove[0] === x && opponentMove[1] === y,
				)
			) {
				return true; // Square is under attack
			}
		}
	}

	return false; // Square is not under attack
}

export function kingInCheck(color, board, moveHistory, pieceColorDeterminer) {
	// find king pos
	let kingPos = null;
	for (let i = 0; i < 8; i++) {
		for (let j = 0; j < 8; j++) {
			if (
				board[i][j] ===
				(color === TURN.WHITE ? PIECE.WHITE_KING : PIECE.BLACK_KING)
			) {
				kingPos = [i, j];
				break;
			}
		}
		if (kingPos) break;
	}

	return squareUnderAttack(
		kingPos[0],
		kingPos[1],
		color,
		board,
		moveHistory,
		pieceColorDeterminer,
	);
}

export function wouldPutKingInCheck(
	x,
	y,
	move, // move is an array: [targetX, targetY, isEnPassant, isCastling]
	board,
	color,
	pieceColorDeterminer,
) {
	const targetX = move[0];
	const targetY = move[1];
	const isEnPassant = move.length > 2 && move[2] === true;
	const isCastling = move.length > 3 && move[3] === true;

	const pieceMoving = board[x][y];
	const pieceCaptured = board[targetX][targetY]; // Usually EMPTY for EP/Castling, but good to store

	let epX, epY, capturedEpPawn;

	// 1. Mutate the main piece
	board[x][y] = PIECE.EMPTY;
	board[targetX][targetY] = pieceMoving;

	// 1b. Mutate special conditions
	if (isEnPassant) {
		// The captured pawn is behind the target square
		const direction = color === TURN.WHITE ? 1 : -1;
		epX = targetX + direction;
		epY = targetY;

		capturedEpPawn = board[epX][epY];
		board[epX][epY] = PIECE.EMPTY;
	} else if (isCastling) {
		// Move the rook to its new square
		if (targetY === 6) {
			// King-side
			board[x][5] = board[x][7];
			board[x][7] = PIECE.EMPTY;
		} else if (targetY === 2) {
			// Queen-side
			board[x][3] = board[x][0];
			board[x][0] = PIECE.EMPTY;
		}
	}

	// 2. Calculate if the king is in check
	const isCheck = kingInCheck(color, board, [], pieceColorDeterminer);

	// 3. Undo the main piece mutation
	board[x][y] = pieceMoving;
	board[targetX][targetY] = pieceCaptured;

	// 3b. Undo special conditions
	if (isEnPassant) {
		board[epX][epY] = capturedEpPawn;
	} else if (isCastling) {
		// Revert the rook to the corner
		if (targetY === 6) {
			board[x][7] = board[x][5];
			board[x][5] = PIECE.EMPTY;
		} else if (targetY === 2) {
			board[x][0] = board[x][3];
			board[x][3] = PIECE.EMPTY;
		}
	}

	return isCheck;
}

export function middleSquaresUnderAttack(
	x,
	y,
	color,
	board,
	moveHistory,
	pieceColorDeterminer,
	side = "king",
) {
	let middleSquares;
	if (side === "queen")
		middleSquares =
			color === TURN.WHITE
				? [
						[7, 3],
						[7, 2],
					]
				: [
						[0, 3],
						[0, 2],
					];
	else
		middleSquares =
			color === TURN.WHITE
				? [
						[7, 5],
						[7, 6],
					]
				: [
						[0, 5],
						[0, 6],
					];

	// Check if any opponent's piece can attack the squares the king would move through during castling
	for (const [mx, my] of middleSquares) {
		if (
			squareUnderAttack(
				mx,
				my,
				color,
				board,
				moveHistory,
				pieceColorDeterminer,
			)
		) {
			return true;
		}
	}

	return false;
}

export function hasLegalMove(color, board, moveHistory, pieceColorDeterminer) {
	for (let i = 0; i < 8; i++) {
		for (let j = 0; j < 8; j++) {
			if (
				board[i][j] === PIECE.EMPTY ||
				pieceColorDeterminer(board[i][j]) !== color
			) {
				continue;
			}

			const moves = MoveGen(
				i,
				j,
				color,
				board,
				moveHistory,
				pieceColorDeterminer,
			);

			if (moves.length > 0) {
				return true;
			}
		}
	}

	return false;
}

export function checkmate(color, board, moveHistory, pieceColorDeterminer) {
	return (
		kingInCheck(color, board, moveHistory, pieceColorDeterminer) &&
		!hasLegalMove(color, board, moveHistory, pieceColorDeterminer)
	);
}

export function stalemate(color, board, moveHistory, pieceColorDeterminer) {
	return (
		!kingInCheck(color, board, moveHistory, pieceColorDeterminer) &&
		!hasLegalMove(color, board, moveHistory, pieceColorDeterminer)
	);
}
