/* =====================================
   CHESS TRAINING ASSISTANT
   JAVASCRIPT
===================================== */

// DATA PENYIMPANAN
const STORAGE = {
    profile: "chess_profile",
    matches: "chess_matches",
    solved: "chess_solved",
    score: "chess_score"
};

function readData(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        return fallback;
    }
}

let profile = readData(STORAGE.profile, null);
let matches = readData(STORAGE.matches, []);
let solved = readData(STORAGE.solved, []);
let score = Number(localStorage.getItem(STORAGE.score)) || 0;

// DATA PUZZLE
let puzzles = [];
let puzzleIndex = 0;
let currentPuzzle = null;
let chessGame = null;
let selectedSquare = null;
let solutionIndex = 0;
let puzzleCompleted = false;
let boardLocked = true;

// NAVIGASI
function showPage(pageName) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.querySelectorAll(".navbtn").forEach(button => {
        button.classList.remove("active");
    });

    const target = document.getElementById(pageName);
    if (target) target.classList.add("active");

    const nav = document.querySelector(
        `.navbtn[data-page="${pageName}"]`
    );
    if (nav) nav.classList.add("active");

    if (pageName === "home") updateDashboard();
    if (pageName === "analysis") updateAnalysis();
}

document.querySelectorAll(".navbtn").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

// PROFIL PEMAIN
function saveProfile() {
    const name = document.getElementById("playerName").value.trim();
    const rating = document.getElementById("playerRating").value;
    const goal = document.getElementById("playerGoal").value;

    if (!name) {
        alert("Masukkan nama pemain terlebih dahulu.");
        return;
    }

    profile = {
        name,
        rating: rating || "Belum diisi",
        goal
    };

    localStorage.setItem(STORAGE.profile, JSON.stringify(profile));

    document.getElementById("profileMessage").textContent =
        "Profil berhasil disimpan!";

    renderProfile();
    updateDashboard();
}

function renderProfile() {
    const summary = document.getElementById("profileSummary");

    if (!profile) {
        summary.textContent = "Belum ada profil yang disimpan.";
        return;
    }

    document.getElementById("playerName").value = profile.name;
    document.getElementById("playerRating").value =
        profile.rating === "Belum diisi" ? "" : profile.rating;
    document.getElementById("playerGoal").value = profile.goal;

    summary.innerHTML = `
        <strong>Nama:</strong> ${escapeHTML(profile.name)}<br>
        <strong>Rating:</strong> ${escapeHTML(String(profile.rating))}<br>
        <strong>Target:</strong> ${escapeHTML(profile.goal)}
    `;
}

// MATCH TRACKER
function addMatch() {
    const opponent = document.getElementById("opponent").value.trim();
    const date = document.getElementById("matchDate").value;
    const result = document.getElementById("matchResult").value;
    const color = document.getElementById("matchColor").value;
    const notes = document.getElementById("matchNotes").value.trim();

    if (!opponent || !date) {
        alert("Isi nama lawan dan tanggal pertandingan.");
        return;
    }

    matches.push({
        id: Date.now(),
        opponent,
        date,
        result,
        color,
        notes
    });

    localStorage.setItem(STORAGE.matches, JSON.stringify(matches));

    document.getElementById("opponent").value = "";
    document.getElementById("matchNotes").value = "";

    renderMatches();
    updateDashboard();
    updateAnalysis();

    alert("Pertandingan berhasil disimpan!");
}

function renderMatches() {
    const rows = document.getElementById("matchRows");
    const empty = document.getElementById("emptyMatches");

    rows.innerHTML = "";

    if (matches.length === 0) {
        empty.style.display = "block";
        return;
    }

    empty.style.display = "none";

    [...matches].reverse().forEach(match => {
        const tr = document.createElement("tr");

        [
            match.date,
            match.opponent,
            match.result,
            match.color,
            match.notes || "-"
        ].forEach(value => {
            const td = document.createElement("td");
            td.textContent = value;
            tr.appendChild(td);
        });

        const action = document.createElement("td");
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Hapus";
        deleteButton.className = "secondary-btn";
        deleteButton.onclick = () => deleteMatch(match.id);

        action.appendChild(deleteButton);
        tr.appendChild(action);
        rows.appendChild(tr);
    });
}

function deleteMatch(id) {
    if (!confirm("Hapus pertandingan ini?")) return;

    matches = matches.filter(match => match.id !== id);
    localStorage.setItem(STORAGE.matches, JSON.stringify(matches));

    renderMatches();
    updateDashboard();
    updateAnalysis();
}

// DASHBOARD
function updateDashboard() {
    const wins = matches.filter(m => m.result === "Menang").length;
    const rate = matches.length
        ? Math.round(wins / matches.length * 100)
        : 0;

    document.getElementById("homeGames").textContent = matches.length;
    document.getElementById("homeWins").textContent = wins;
    document.getElementById("homePuzzle").textContent = solved.length;
    document.getElementById("homeRate").textContent = rate + "%";

    const welcome = document.querySelector(".welcome-card h2");
    if (welcome) {
        welcome.textContent = profile
            ? "Welcome, " + profile.name + "!"
            : "Welcome, Chess Player!";
    }
}

// ANALISIS
function updateAnalysis() {
    const wins = matches.filter(m => m.result === "Menang").length;
    const draws = matches.filter(m => m.result === "Seri").length;
    const losses = matches.filter(m => m.result === "Kalah").length;

    const rate = matches.length
        ? Math.round(wins / matches.length * 100)
        : 0;

    document.getElementById("analysisGames").textContent = matches.length;
    document.getElementById("analysisWins").textContent = wins;
    document.getElementById("analysisDraws").textContent = draws;
    document.getElementById("analysisLosses").textContent = losses;
    document.getElementById("analysisWinRate").textContent = rate + "%";
    document.getElementById("analysisSolved").textContent = solved.length;

    let advice = "Belum ada data pertandingan. Tambahkan pertandingan untuk melihat evaluasi.";

    if (matches.length > 0) {
        if (rate >= 60) {
            advice = "Performa kemenanganmu cukup baik. Pertahankan latihan dan evaluasi setiap pertandingan.";
        } else if (rate >= 40) {
            advice = "Performa masih berkembang. Perhatikan kesalahan taktik dan rencanakan langkah lebih matang.";
        } else {
            advice = "Terus berlatih! Coba evaluasi setiap kekalahan untuk menemukan bagian yang perlu ditingkatkan.";
        }
    }

    document.getElementById("analysisAdvice").textContent = advice;
}

// PUZZLE
async function loadPuzzleSet() {
    const level = document.getElementById("puzzleLevel").value;
    const count = Number(document.getElementById("puzzleCount").value);

    const ranges = {
        beginner: [800, 1399],
        intermediate: [1400, 1799],
        advanced: [1800, 2199]
    };

    const [min, max] = ranges[level];

    const status = document.getElementById("puzzleStatus");
    status.textContent = "Sedang mengambil puzzle. Tunggu sebentar...";

    document.getElementById("loadPuzzlesBtn").disabled = true;

    try {
        const url =
            `https://chess.mauriulloa.com/v1/puzzles/random?ratingMin=${min}&ratingMax=${max}&count=${count}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Server puzzle tidak merespons.");
        }

        const data = await response.json();

        let list = Array.isArray(data)
            ? data
            : data.puzzles || data.items || data.results || data.data || [];

        if (!Array.isArray(list) || list.length === 0) {
            throw new Error("Puzzle tidak ditemukan.");
        }

        puzzles = list.filter(p => {
            return (p.positionFen || p.fen) &&
                (p.solution || p.moves);
        });

        if (puzzles.length === 0) {
            throw new Error("Format puzzle dari server belum sesuai.");
        }

        puzzleIndex = 0;
        displayPuzzle();

    } catch (error) {
        status.textContent =
            "Puzzle online gagal dimuat. Periksa koneksi internet lalu coba lagi. (" +
            error.message + ")";

        document.getElementById("puzzleBoard").innerHTML = "";
        document.getElementById("puzzleTurn").textContent = "";
    } finally {
        document.getElementById("loadPuzzlesBtn").disabled = false;
    }
}

function displayPuzzle() {
    if (!puzzles.length || puzzleIndex >= puzzles.length) {
        document.getElementById("puzzleStatus").textContent =
            "Semua puzzle dalam sesi ini selesai!";
        document.getElementById("puzzleBoard").innerHTML = "";
        return;
    }

    currentPuzzle = puzzles[puzzleIndex];

    const fen = currentPuzzle.positionFen || currentPuzzle.fen;
    const rawSolution = currentPuzzle.solution || currentPuzzle.moves;

    try {
        chessGame = new Chess(fen);
    } catch (error) {
        document.getElementById("puzzleStatus").textContent =
            "Posisi puzzle tidak valid.";
        return;
    }

    if (typeof rawSolution === "string") {
        currentPuzzleMoves = rawSolution.trim().split(/\s+/);
    } else {
        currentPuzzleMoves = rawSolution;
    }

    solutionIndex = 0;
    selectedSquare = null;
    puzzleCompleted = false;
    boardLocked = false;

    document.getElementById("puzzleNumber").textContent =
        `${puzzleIndex + 1} / ${puzzles.length}`;

    document.getElementById("puzzleRating").textContent =
        currentPuzzle.rating || "-";

    document.getElementById("puzzleScore").textContent = score;

    document.getElementById("puzzleStatus").textContent =
        "Temukan langkah terbaik!";

    document.getElementById("puzzleResult").textContent = "";
    document.getElementById("puzzleHint").textContent = "";

    document.getElementById("puzzleTurn").textContent =
        "Giliran: " + (chessGame.turn() === "w" ? "Putih" : "Hitam");

    // Jika langkah pertama adalah langkah lawan,
    // jalankan otomatis sebelum giliran pemain.
    const solver = currentPuzzle.solverColor ||
        currentPuzzle.color ||
        chessGame.turn();

    if (chessGame.turn() !== solver && currentPuzzleMoves.length) {
        const firstMove = currentPuzzleMoves[solutionIndex++];
        playUciMove(firstMove);
    }

    renderBoard();
}

let currentPuzzleMoves = [];

function playUciMove(uci) {
    if (!uci || !chessGame) return false;

    const move = {
        from: uci.substring(0, 2),
        to: uci.substring(2, 4)
    };

    if (uci.length >= 5) {
        move.promotion = uci[4];
    }

    const result = chessGame.move(move);
    return Boolean(result);
}

function renderBoard() {
    const board = document.getElementById("puzzleBoard");
    if (!board || !chessGame) return;

    board.innerHTML = "";

    const boardArray = chessGame.board();
    const symbols = {
        w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
        b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" }
    };

    const orientation = currentPuzzle &&
        (currentPuzzle.solverColor || currentPuzzle.color) === "b"
        ? "b" : "w";

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const actualRow = orientation === "w" ? row : 7 - row;
            const actualCol = orientation === "w" ? col : 7 - col;

            const file = "abcdefgh"[actualCol];
            const rank = 8 - actualRow;
            const squareName = file + rank;

            const piece = boardArray[actualRow][actualCol];
            const square = document.createElement("button");

            square.type = "button";
            square.className =
                "square " + ((actualRow + actualCol) % 2 === 0
                    ? "light" : "dark");

            if (selectedSquare === squareName) {
                square.classList.add("selected");
            }

            square.dataset.square = squareName;
            square.textContent = piece
                ? symbols[piece.color][piece.type]
                : "";

            square.addEventListener("click", () => {
                handleSquareClick(squareName);
            });

            board.appendChild(square);
        }
    }
}

function handleSquareClick(square) {
    if (!chessGame || boardLocked || puzzleCompleted) return;

    const piece = chessGame.get(square);

    if (!selectedSquare) {
        if (piece && piece.color === chessGame.turn()) {
            selectedSquare = square;
            renderBoard();
        }
        return;
    }

    if (piece && piece.color === chessGame.turn()) {
        selectedSquare = square;
        renderBoard();
        return;
    }

    const attemptedMove = {
        from: selectedSquare,
        to: square,
        promotion: "q"
    };

    const legalMove = chessGame.moves({
        square: selectedSquare,
        verbose: true
    }).find(m => m.to === square);

    if (!legalMove) {
        selectedSquare = null;
        renderBoard();
        return;
    }

    const uci = legalMove.from + legalMove.to +
        (legalMove.promotion || "");

    const expected = currentPuzzleMoves[solutionIndex];

    if (!expected) {
        selectedSquare = null;
        renderBoard();
        return;
    }

    if (uci !== expected) {
        document.getElementById("puzzleResult").textContent =
            "Belum tepat. Coba pikirkan langkah lain!";
        selectedSquare = null;
        renderBoard();
        return;
    }

    chessGame.move(attemptedMove);
    solutionIndex++;
    selectedSquare = null;

    if (solutionIndex >= currentPuzzleMoves.length) {
        finishPuzzle();
        renderBoard();
        return;
    }

    // Balasan lawan otomatis
    const opponentMove = currentPuzzleMoves[solutionIndex];

    if (!playUciMove(opponentMove)) {
        document.getElementById("puzzleResult").textContent =
            "Langkah balasan tidak dapat diproses.";
        renderBoard();
        return;
    }

    solutionIndex++;

    if (solutionIndex >= currentPuzzleMoves.length) {
        finishPuzzle();
    } else {
        document.getElementById("puzzleResult").textContent =
            "Bagus! Lanjutkan mencari langkah berikutnya.";
    }

    document.getElementById("puzzleTurn").textContent =
        "Giliran: " + (chessGame.turn() === "w" ? "Putih" : "Hitam");

    renderBoard();
}

function finishPuzzle() {
    if (puzzleCompleted) return;

    puzzleCompleted = true;
    boardLocked = true;
    score += 10;

    const puzzleId = currentPuzzle.id ||
        currentPuzzle.puzzleId ||
        "puzzle-" + puzzleIndex;

    if (!solved.includes(puzzleId)) {
        solved.push(puzzleId);
    }

    localStorage.setItem(STORAGE.solved, JSON.stringify(solved));
    localStorage.setItem(STORAGE.score, String(score));

    document.getElementById("puzzleScore").textContent = score;
    document.getElementById("puzzleResult").textContent =
        "Hebat! Puzzle berhasil diselesaikan. +10 poin.";
    document.getElementById("puzzleStatus").textContent =
        "Puzzle selesai!";

    updateDashboard();
    updateAnalysis();
}

function showPuzzleHint() {
    if (!currentPuzzle || !currentPuzzleMoves.length) {
        document.getElementById("puzzleHint").textContent =
            "Mulai latihan terlebih dahulu.";
        return;
    }

    const move = currentPuzzleMoves[solutionIndex];

    if (!move) {
        document.getElementById("puzzleHint").textContent =
            "Puzzle ini sudah selesai.";
        return;
    }

    document.getElementById("puzzleHint").textContent =
        "Petunjuk: perhatikan langkah dari kotak " +
        move.substring(0, 2) + ".";
}

function restartCurrentPuzzle() {
    if (!currentPuzzle) {
        document.getElementById("puzzleStatus").textContent =
            "Mulai latihan terlebih dahulu.";
        return;
    }

    displayPuzzle();
}

function nextPuzzle() {
    if (!puzzles.length) {
        document.getElementById("puzzleStatus").textContent =
            "Klik Mulai Latihan terlebih dahulu.";
        return;
    }

    puzzleIndex++;

    if (puzzleIndex >= puzzles.length) {
        document.getElementById("puzzleStatus").textContent =
            "Sesi selesai! Klik Mulai Latihan untuk mengambil puzzle baru.";
        document.getElementById("puzzleBoard").innerHTML = "";
        return;
    }

    displayPuzzle();
}

// EKSPOR DATA
function exportData() {
    const data = {
        profile,
        matches,
        solvedPuzzles: solved,
        puzzleScore: score,
        exportedAt: new Date().toISOString()
    };

    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "chess-training-data.json";
    link.click();

    URL.revokeObjectURL(url);
}

// KEAMANAN TEKS
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// INISIALISASI
function initializeApp() {
    const dateInput = document.getElementById("matchDate");

    if (dateInput) {
        dateInput.value = new Date().toISOString().slice(0, 10);
    }

    renderProfile();
    renderMatches();
    updateDashboard();
    updateAnalysis();

    console.log("Chess Training Assistant berhasil dimuat.");
}

initializeApp();



    
