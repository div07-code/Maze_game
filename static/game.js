const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Global vars
let cols, rows, wallBreakLimit, timeLeft, cellSize;
let mazeGrid = [];
let current;
let stack = [];
let player = { x: 0, y: 0 };
let gameWon = false;
let wallsBroken = 0;
let wallBreakAnimations = [];
let countdown;

// UI
const timerElement = document.getElementById("timer");

// ---------------------------------------------------
// INITIALIZE MAZE
// ---------------------------------------------------

function initMaze(config) {
  cols = config.cols;
  rows = config.rows;
  wallBreakLimit = config.wall_break_limit;
  timeLeft = config.time_limit;
  cellSize = Math.min(canvas.width / cols, canvas.height / rows);

  mazeGrid = [];
  stack = [];
  player = { x: 0, y: 0 };
  gameWon = false;
  wallsBroken = 0;
  wallBreakAnimations = [];

  // Create cells
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      mazeGrid.push(new Cell(x, y));
    }
  }

  current = mazeGrid[0];

  buildMaze(() => {
    drawMaze();
    gameLoop();
    initTimer();
  });
}

// ---------------------------------------------------
// TIMER
// ---------------------------------------------------

async function initTimer() {
  const response = await fetch("/get_level_config");
  const data = await response.json();
  timeLeft = data.time_limit;

  timerElement.innerText = `⏳ ${timeLeft}s`;
  startCountdown();
}

function startCountdown() {
  clearInterval(countdown);

  countdown = setInterval(() => {
    timeLeft--;
    timerElement.innerText = `⏳ ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(countdown);
      alert("⏱ Time's up! Try again.");
      window.location.href = "/index";
    }
  }, 1000);
}

// ---------------------------------------------------
// CELL CLASS
// ---------------------------------------------------

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.visited = false;
    this.walls = [true, true, true, true]; // top, right, bottom, left
  }

  getIndex(x, y) {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return -1;
    return x + y * cols;
  }

  checkNeighbors() {
    const neighbors = [];
    const dirs = [
      [this.x, this.y - 1],
      [this.x + 1, this.y],
      [this.x, this.y + 1],
      [this.x - 1, this.y],
    ];

    dirs.forEach(([nx, ny]) => {
      const neighbor = mazeGrid[this.getIndex(nx, ny)];
      if (neighbor && !neighbor.visited) neighbors.push(neighbor);
    });

    return neighbors.length
      ? neighbors[Math.floor(Math.random() * neighbors.length)]
      : undefined;
  }

  draw() {
    const x = this.x * cellSize;
    const y = this.y * cellSize;

    ctx.fillStyle = this.visited ? "#111" : "#000";
    ctx.fillRect(x, y, cellSize, cellSize);

    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#00ffff";
    ctx.shadowBlur = 6;

    if (this.walls[0]) drawLine(x, y, x + cellSize, y);
    if (this.walls[1]) drawLine(x + cellSize, y, x + cellSize, y + cellSize);
    if (this.walls[2]) drawLine(x + cellSize, y + cellSize, x, y + cellSize);
    if (this.walls[3]) drawLine(x, y + cellSize, x, y);

    ctx.shadowBlur = 0;
  }
}

// ---------------------------------------------------
// MAZE GENERATION
// ---------------------------------------------------

function drawLine(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function removeWalls(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  if (dx === 1) {
    a.walls[3] = false; b.walls[1] = false;
  } else if (dx === -1) {
    a.walls[1] = false; b.walls[3] = false;
  }

  if (dy === 1) {
    a.walls[0] = false; b.walls[2] = false;
  } else if (dy === -1) {
    a.walls[2] = false; b.walls[0] = false;
  }
}

function generateMazeStep() {
  current.visited = true;
  const next = current.checkNeighbors();

  if (next) {
    next.visited = true;
    stack.push(current);
    removeWalls(current, next);
    current = next;
  } else if (stack.length) {
    current = stack.pop();
  }
}

function buildMaze(callback) {
  function loop() {
    for (let i = 0; i < 15; i++) generateMazeStep();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    centerMazeOnCanvas();
    drawMaze();

    if (stack.length > 0) requestAnimationFrame(loop);
    else callback();
  }
  loop();
}

function drawMaze() {
  mazeGrid.forEach(cell => cell.draw());
}

function centerMazeOnCanvas() {
  const mazeWidth = cols * cellSize;
  const mazeHeight = rows * cellSize;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate((canvas.width - mazeWidth) / 2, (canvas.height - mazeHeight) / 2);
}

// ---------------------------------------------------
// WALL BREAK ANIMATION
// ---------------------------------------------------

function animateWallBreak(cellA, cellB, wallIndex, duration = 90) {
  wallBreakAnimations.push({ cellA, cellB, wallIndex, frame: 0, duration });
}

// ---------------------------------------------------
// QUESTION MODAL
// ---------------------------------------------------

function showQuestionModal(question, wallIndex, currentIdx, nextIdx, newX, newY) {
  const modal = document.getElementById("questionModal");
  const questionText = document.getElementById("questionText");
  const optionsDiv = document.getElementById("options");

  questionText.textContent = question.question;
  optionsDiv.innerHTML = "";

  for (let opt in question.options) {
    const btn = document.createElement("button");
    btn.textContent = `${opt}: ${question.options[opt]}`;
    btn.className = "question-option";

    btn.onclick = () => {
      fetch("/validate_answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: question.id, answer: opt }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.correct) {
            if (wallsBroken < wallBreakLimit) {
              wallsBroken++;
              animateWallBreak(mazeGrid[currentIdx], mazeGrid[nextIdx], wallIndex);

              setTimeout(() => {
                removeWalls(mazeGrid[currentIdx], mazeGrid[nextIdx]);
                player.x = newX;
                player.y = newY;
              }, 300);
            } else alert("⚠ Wall break limit reached!");
          } else {
            alert("❌ Incorrect!");
          }

          modal.style.display = "none";
        });
    };

    optionsDiv.appendChild(btn);
  }

  modal.style.display = "flex";
}

// ---------------------------------------------------
// MOVEMENT
// ---------------------------------------------------

document.addEventListener("keydown", (e) => {
  if (document.getElementById("questionModal").style.display === "flex") return;

  const allowed = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  if (!allowed.includes(e.key)) return;

  e.preventDefault();

  const dx = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: 0, ArrowDown: 0 };
  const dy = { ArrowRight: 0, ArrowLeft: 0, ArrowUp: -1, ArrowDown: 1 };
  const wallIdx = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 };

  const newX = player.x + dx[e.key];
  const newY = player.y + dy[e.key];

  if (newX < 0 || newX >= cols || newY < 0 || newY >= rows) return;

  const currentIdx = player.y * cols + player.x;
  const nextIdx = newY * cols + newX;

  if (mazeGrid[currentIdx].walls[wallIdx[e.key]]) {
    fetch("/get_question")
      .then(res => res.json())
      .then(q => {
        if (q.error) return alert("No question available!");
        showQuestionModal(q, wallIdx[e.key], currentIdx, nextIdx, newX, newY);
      });
  } else {
    player.x = newX;
    player.y = newY;
  }
});

// ---------------------------------------------------
// WIN LOGIC — FIXED SUBMIT SCORE
// ---------------------------------------------------

function checkWin() {
  if (!gameWon && player.x === cols - 1 && player.y === rows - 1) {
    gameWon = true;

    clearInterval(countdown);

    const score = timeLeft * 10;

    // Submit score properly
    fetch('/submit_score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score: score,
        walls_broken: wallsBroken,
        time_left: timeLeft
      })
    })
    .then(() => {
      // Unlock next level
      fetch("/next_level", { method: "POST" })
        .then(res => res.json())
        .then(() => {
          alert("🎉 Level Completed!");
          window.location.href = "/level_select";
        });
    });
  }
}

// ---------------------------------------------------
// GAME LOOP
// ---------------------------------------------------

function renderPlayer() {
  const px = player.x * cellSize + cellSize / 2;
  const py = player.y * cellSize + cellSize / 2;

  ctx.fillStyle = "#ff0000";
  ctx.beginPath();
  ctx.arc(px, py, cellSize / 4, 0, 2 * Math.PI);
  ctx.fill();
}

function drawEndPoint() {
  const x = (cols - 1) * cellSize;
  const y = (rows - 1) * cellSize;
  ctx.fillStyle = "#00ff00";
  ctx.shadowColor = "#00ff00";
  ctx.shadowBlur = 12;
  ctx.fillRect(x + cellSize / 4, y + cellSize / 4, cellSize / 2, cellSize / 2);
  ctx.shadowBlur = 0;
}

function gameLoop() {
  requestAnimationFrame(gameLoop);

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  centerMazeOnCanvas();
  drawMaze();

  // wall break animations
  wallBreakAnimations = wallBreakAnimations.filter(anim => {
    const progress = anim.frame / anim.duration;
    const x1 = anim.cellA.x * cellSize;
    const y1 = anim.cellA.y * cellSize;

    ctx.strokeStyle = `rgba(255, 255, 0, ${1 - progress})`;
    ctx.lineWidth = 3;

    ctx.beginPath();
    switch (anim.wallIndex) {
      case 0: ctx.moveTo(x1 + cellSize * progress, y1); break;
      case 1: ctx.moveTo(x1 + cellSize, y1 + cellSize * progress); break;
      case 2: ctx.moveTo(x1 + cellSize * progress, y1 + cellSize); break;
      case 3: ctx.moveTo(x1, y1 + cellSize * progress); break;
    }
    ctx.stroke();

    anim.frame++;
    return anim.frame <= anim.duration;
  });

  drawEndPoint();
  checkWin();
  renderPlayer();

  ctx.restore();
}

// ---------------------------------------------------

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  cellSize = Math.min(canvas.width / cols, canvas.height / rows);
  centerMazeOnCanvas();
  drawMaze();
});
