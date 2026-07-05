import { PIECE } from "./constants.js";

export default class Move {
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
