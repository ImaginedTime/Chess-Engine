export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w";

export const PIECE = Object.freeze({
	BLACK_KING: "k",
	BLACK_QUEEN: "q",
	BLACK_ROOK: "r",
	BLACK_BISHOP: "b",
	BLACK_KNIGHT: "n",
	BLACK_PAWN: "p",
	WHITE_KING: "K",
	WHITE_QUEEN: "Q",
	WHITE_ROOK: "R",
	WHITE_BISHOP: "B",
	WHITE_KNIGHT: "N",
	WHITE_PAWN: "P",
	EMPTY: ".",
});

export const TURN = Object.freeze({
	WHITE: "white",
	BLACK: "black",
});

export const PIECE_IMAGE_POSITION = {
	[PIECE.WHITE_KING]: [0, 0],
	[PIECE.WHITE_QUEEN]: [0, 1],
	[PIECE.WHITE_BISHOP]: [0, 2],
	[PIECE.WHITE_KNIGHT]: [0, 3],
	[PIECE.WHITE_ROOK]: [0, 4],
	[PIECE.WHITE_PAWN]: [0, 5],

	[PIECE.BLACK_KING]: [1, 0],
	[PIECE.BLACK_QUEEN]: [1, 1],
	[PIECE.BLACK_BISHOP]: [1, 2],
	[PIECE.BLACK_KNIGHT]: [1, 3],
	[PIECE.BLACK_ROOK]: [1, 4],
	[PIECE.BLACK_PAWN]: [1, 5],
};
export const SPRITE_SIZE = 45; // size inside SVG
export const SQUARE_SIZE = 60; // board square size
export const CHESS_SPRITE = "./Chess_Pieces_Sprite.svg";

export const GAME_STATE = Object.freeze({
	PLAYING: "PLAYING",
	CHECKMATE: "CHECKMATE",
	STALEMATE: "STALEMATE",
	DRAW: "DRAW",
	THREEFOLD_REPETITION: "THREEFOLD_REPETITION",
});


/*********************************
	FOR THE ENGINE
********************************** */ 
// All values are in hundredth of a pawn, which is centipawn values

export const ENDGAME_THRESHOLD = 1500;
export const MAX_DEPTH_FOR_ENGINE = 4;

export const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};

// Piece-Square Tables (Tuned for White. Black will read these upside-down)
export const PST = {
    p: [
        [  0,  0,  0,  0,  0,  0,  0,  0],
        [ 50, 50, 50, 50, 50, 50, 50, 50],
        [ 10, 10, 20, 30, 30, 20, 10, 10],
        [  5,  5, 10, 25, 25, 10,  5,  5],
        [  0,  0,  0, 20, 20,  0,  0,  0],
        [  5, -5,-10,  0,  0,-10, -5,  5],
        [  5, 10, 10,-20,-20, 10, 10,  5],
        [  0,  0,  0,  0,  0,  0,  0,  0]
    ],
    n: [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    b: [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    r: [
        [  0,  0,  0,  0,  0,  0,  0,  0],
        [  5, 10, 10, 10, 10, 10, 10,  5],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [  0,  0,  0,  5,  5,  0,  0,  0]
    ],
    q: [
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [ -5,  0,  5,  5,  5,  5,  0, -5],
        [  0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [-10,  0,  5,  0,  0,  0,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20]
    ],
    // King Middle Game: Keep him tucked in the corners behind pawns
    k_mg: [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [ 20, 20,  0,  0,  0,  0, 20, 20],
        [ 20, 30, 10,  0,  0, 10, 30, 20]
    ],
    // King End Game: Bring him to the center to fight!
    k_eg: [
        [-50,-40,-30,-20,-20,-30,-40,-50],
        [-30,-20,-10,  0,  0,-10,-20,-30],
        [-30,-10, 20, 30, 30, 20,-10,-30],
        [-30,-10, 30, 40, 40, 30,-10,-30],
        [-30,-10, 30, 40, 40, 30,-10,-30],
        [-30,-10, 20, 30, 30, 20,-10,-30],
        [-30,-30,  0,  0,  0,  0,-30,-30],
        [-50,-30,-30,-30,-30,-30,-30,-50]
    ]
};
