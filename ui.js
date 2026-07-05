import { PIECE, TURN } from "./constants.js";

/**
 * Manages all UI panels: evaluation display, move history, engine stats,
 * turn indicator, and game-over modal close behavior.
 */
export default class UIManager {
	constructor() {
		// Eval elements
		this.evalBarFill = document.getElementById("eval-bar-fill");
		this.evalValue = document.getElementById("eval-value");
		this.evalLabel = document.getElementById("eval-label");

		// Engine stat elements
		this.engineDepth = document.getElementById("engine-depth");
		this.engineTime = document.getElementById("engine-time");
		this.engineEval = document.getElementById("engine-eval");

		// Turn indicator
		this.turnIndicator = document.getElementById("turn-indicator");

		// Move history
		this.movesList = document.getElementById("moves-list");
		this.moveCount = 0; // number of full moves (pairs)

		// Engine timing history: array of { moveNotation, timeMs, moveNum }
		this.timingHistory = [];

		// Game over modal close
		const viewBoardBtn = document.getElementById("view-board-btn");
		if (viewBoardBtn) {
			viewBoardBtn.addEventListener("click", () => {
				const modal = document.getElementById("game-over-modal");
				modal.style.display = "none";
			});
		}

		// Timing modal open/close
		const viewTimingBtn = document.getElementById("view-timing-btn");
		if (viewTimingBtn) {
			viewTimingBtn.addEventListener("click", () => this.openTimingModal());
		}

		const timingCloseBtn = document.getElementById("timing-close-btn");
		if (timingCloseBtn) {
			timingCloseBtn.addEventListener("click", () => this.closeTimingModal());
		}

		// Close timing modal on backdrop click
		const timingModal = document.getElementById("timing-modal");
		if (timingModal) {
			timingModal.addEventListener("click", (e) => {
				if (e.target === timingModal) this.closeTimingModal();
			});
		}
	}

	/**
	 * Update the evaluation bar and label.
	 * @param {number} evalCentipawns - Evaluation in centipawns from White's perspective.
	 */
	updateEvaluation(evalCentipawns) {
		const evalPawns = evalCentipawns / 100;

		// Clamp display between -15 and +15
		const clampedEval = Math.max(-15, Math.min(15, evalPawns));

		// Map [-15, +15] to [5%, 95%] bar width (white portion)
		const percentage = ((clampedEval + 15) / 30) * 90 + 5;
		this.evalBarFill.style.width = `${percentage}%`;

		// Format and display the number
		const sign = evalPawns > 0 ? "+" : "";
		this.evalValue.textContent = `${sign}${evalPawns.toFixed(2)}`;

		// Color the value based on who's winning
		if (evalPawns > 0.5) {
			this.evalValue.style.color = "#f8f8f8";
			this.evalLabel.textContent = "White is better";
		} else if (evalPawns < -0.5) {
			this.evalValue.style.color = "#999";
			this.evalLabel.textContent = "Black is better";
		} else {
			this.evalValue.style.color = "#e0e0e0";
			this.evalLabel.textContent = "Equal position";
		}

		// Stronger evaluations get more dramatic styling
		if (Math.abs(evalPawns) > 3) {
			this.evalLabel.textContent =
				evalPawns > 0 ? "White is winning" : "Black is winning";
		}
		if (Math.abs(evalPawns) > 8) {
			this.evalLabel.textContent =
				evalPawns > 0 ? "White is crushing" : "Black is crushing";
		}
	}

	/**
	 * Update engine stats display and record timing.
	 * @param {object} stats - { depth, timeMs, eval }
	 * @param {string} moveNotation - algebraic notation of the engine's move
	 */
	updateEngineStats(stats, moveNotation) {
		this.engineDepth.textContent = stats.depth;

		if (stats.timeMs < 1000) {
			this.engineTime.textContent = `${stats.timeMs}ms`;
		} else {
			this.engineTime.textContent = `${(stats.timeMs / 1000).toFixed(2)}s`;
		}

		const evalPawns = stats.eval / 100;
		const sign = evalPawns > 0 ? "+" : "";
		this.engineEval.textContent = `${sign}${evalPawns.toFixed(2)}`;

		// Record this timing
		this.timingHistory.push({
			moveNotation: moveNotation || "?",
			timeMs: stats.timeMs,
			moveNum: this.timingHistory.length + 1,
		});
	}

	/**
	 * Update the turn indicator.
	 * @param {string} turn - TURN.WHITE or TURN.BLACK
	 */
	updateTurnIndicator(turn) {
		const dot = this.turnIndicator.querySelector(".turn-dot");
		const label = this.turnIndicator.querySelector("span:last-child");

		dot.classList.remove("white-dot", "black-dot");
		if (turn === TURN.WHITE) {
			dot.classList.add("white-dot");
			label.textContent = "White to move";
		} else {
			dot.classList.add("black-dot");
			label.textContent = "Black to move";
		}
	}

	/**
	 * Show "thinking" indicator while engine computes.
	 */
	showThinking() {
		this.engineTime.innerHTML = `<span class="thinking-badge"><span class="thinking-dots"><span></span><span></span><span></span></span> Thinking</span>`;
	}

	/**
	 * Add a move to the move history list.
	 * @param {object} move - Move object from chess.js
	 * @param {string} turn - TURN.WHITE or TURN.BLACK (the side that just moved)
	 */
	addMove(move, turn) {
		const notation = this.toAlgebraicNotation(move);

		if (turn === TURN.WHITE) {
			// Start a new row
			this.moveCount++;

			// Clear placeholder
			const placeholder = this.movesList.querySelector(".moves-placeholder");
			if (placeholder) placeholder.remove();

			const row = document.createElement("div");
			row.classList.add("move-row");
			row.dataset.moveNum = this.moveCount;

			const numDiv = document.createElement("div");
			numDiv.classList.add("move-number");
			numDiv.textContent = `${this.moveCount}.`;

			const whiteDiv = document.createElement("div");
			whiteDiv.classList.add("move-white");
			whiteDiv.textContent = notation;

			const blackDiv = document.createElement("div");
			blackDiv.classList.add("move-black");
			blackDiv.textContent = "";

			row.appendChild(numDiv);
			row.appendChild(whiteDiv);
			row.appendChild(blackDiv);
			this.movesList.appendChild(row);
		} else {
			// Add black's move to the current row
			const rows = this.movesList.querySelectorAll(".move-row");
			if (rows.length > 0) {
				const lastRow = rows[rows.length - 1];
				const blackDiv = lastRow.querySelector(".move-black");
				if (blackDiv) {
					blackDiv.textContent = notation;
				}
			}
		}

		// Auto-scroll to the latest move
		this.movesList.scrollTop = this.movesList.scrollHeight;
	}

	/**
	 * Convert a Move object to algebraic notation.
	 * @param {object} move - Move object
	 * @returns {string} - e.g. "e4", "Nf3", "O-O", "exd5"
	 */
	toAlgebraicNotation(move) {
		const { from, to, pieceMoved, pieceCaptured, isEnPassant, isCastling } =
			move;

		// Castling
		if (isCastling) {
			return to.y === 6 ? "O-O" : "O-O-O";
		}

		const files = "abcdefgh";
		const ranks = "87654321";
		const toSquare = files[to.y] + ranks[to.x];

		const pieceType = pieceMoved.toLowerCase();
		const isCapture = pieceCaptured !== null || isEnPassant;

		// Pawn moves
		if (pieceType === "p") {
			if (isCapture) {
				let notation = files[from.y] + "x" + toSquare;
				if (move.isPawnPromotion()) notation += "=Q";
				return notation;
			}
			let notation = toSquare;
			if (move.isPawnPromotion()) notation += "=Q";
			return notation;
		}

		// Piece symbol map
		const symbols = { k: "K", q: "Q", r: "R", b: "B", n: "N" };
		const symbol = symbols[pieceType] || "";

		const captureStr = isCapture ? "x" : "";

		return symbol + captureStr + toSquare;
	}

	// ===== TIMING MODAL =====

	openTimingModal() {
		const modal = document.getElementById("timing-modal");
		modal.style.display = "flex";
		this.populateTimingModal();
	}

	closeTimingModal() {
		const modal = document.getElementById("timing-modal");
		modal.style.display = "none";
	}

	populateTimingModal() {
		const statsGrid = document.getElementById("timing-stats-grid");
		const timingList = document.getElementById("timing-list");

		// Clear previous content
		statsGrid.innerHTML = "";
		timingList.innerHTML = "";

		if (this.timingHistory.length === 0) {
			statsGrid.innerHTML = "";
			timingList.innerHTML = `<div class="timing-empty">No engine moves yet</div>`;
			return;
		}

		const times = this.timingHistory.map((t) => t.timeMs);

		// Compute stats
		const count = times.length;
		const sum = times.reduce((a, b) => a + b, 0);
		const mean = sum / count;
		const min = Math.min(...times);
		const max = Math.max(...times);

		// Median
		const sorted = [...times].sort((a, b) => a - b);
		const median =
			count % 2 === 0
				? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
				: sorted[Math.floor(count / 2)];

		// Std deviation
		const variance =
			times.reduce((acc, t) => acc + (t - mean) ** 2, 0) / count;
		const stdDev = Math.sqrt(variance);

		// Render stat cards
		const stats = [
			{ label: "Moves", value: count },
			{ label: "Average", value: this.formatTime(mean) },
			{ label: "Median", value: this.formatTime(median) },
			{ label: "Min", value: this.formatTime(min) },
			{ label: "Max", value: this.formatTime(max) },
			{ label: "Std Dev", value: this.formatTime(stdDev) },
		];

		for (const stat of stats) {
			const card = document.createElement("div");
			card.classList.add("timing-stat-card");
			card.innerHTML = `
				<div class="timing-stat-label">${stat.label}</div>
				<div class="timing-stat-value">${stat.value}</div>
			`;
			statsGrid.appendChild(card);
		}

		// Render individual timings
		for (const entry of this.timingHistory) {
			const row = document.createElement("div");
			row.classList.add("timing-list-row");
			row.innerHTML = `
				<span class="timing-list-move">#${entry.moveNum} ${entry.moveNotation}</span>
				<span class="timing-list-time">${this.formatTime(entry.timeMs)}</span>
			`;
			timingList.appendChild(row);
		}
	}

	/**
	 * Format milliseconds into a readable string.
	 */
	formatTime(ms) {
		if (typeof ms === "number" && ms < 1000) {
			return `${Math.round(ms)}ms`;
		}
		return `${(ms / 1000).toFixed(2)}s`;
	}
}
