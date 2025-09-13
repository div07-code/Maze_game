
const size = 60; // Maze size
const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let cols, rows, wallBreakLimit, timeLeft, cellSize;
let mazeGrid = [];
let current;
let stack = [];
let player = { x: 0, y: 0 };
let gameWon = false;
let wallsBroken = 0;
let wallBreakAnimations = [];

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

  // Init maze grid
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      mazeGrid.push(new Cell(x, y));
    }
  }

  // Set starting cell after mazeGrid is built
current = mazeGrid[0];



// Start maze build + game loop
buildMaze(() => {
  drawMaze();
  gameLoop();
  initTimer();
});


}


let countdown;
const timerElement = document.getElementById("timer");

async function initTimer() {
  const response = await fetch("/get_level_config");
  const data = await response.json();
  timeLeft = data.time_limit;  // ← get timer from backend 
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
      alert("⏱️ Time's up! Try again!");
      window.location.href = `/index`;
    }
  }, 1000);
}

// Cell class for maze generation
class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.visited = false;
    this.walls = [true, true, true, true]; // Top, Right, Bottom, Left
  }

  getIndex(x, y) {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return -1;
    return x + y * cols;
  }

  checkNeighbors() {
    const neighbors = [];
    const directions = [
      [this.x, this.y - 1], // Up
      [this.x + 1, this.y], // Right
      [this.x, this.y + 1], // Down
      [this.x - 1, this.y]  // Left
    ];

    directions.forEach(([nx, ny]) => {
      const neighbor = mazeGrid[this.getIndex(nx, ny)];
      if (neighbor && !neighbor.visited) neighbors.push(neighbor);
    });

    return neighbors.length > 0
      ? neighbors[Math.floor(Math.random() * neighbors.length)]
      : undefined;
  }

  draw() {
    const x = this.x * cellSize;
    const y = this.y * cellSize;

    // 🔹 Add cell background based on visited state
    ctx.fillStyle = this.visited ? "#111" : "#000";

    ctx.fillRect(x, y, cellSize, cellSize);

    // 🔹 Wall styles
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#00ffff";
    ctx.shadowBlur = 6;

    if (this.walls[0]) drawLine(x, y, x + cellSize, y); // Top wall
    if (this.walls[1]) drawLine(x + cellSize, y, x + cellSize, y + cellSize); // Right wall
    if (this.walls[2]) drawLine(x + cellSize, y + cellSize, x, y + cellSize); // Bottom wall
    if (this.walls[3]) drawLine(x, y + cellSize, x, y); // Left wall

    ctx.shadowBlur = 0; // Reset
  }

}

function drawLine(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function removeWalls(a, b) {
  const x = a.x - b.x;
  const y = a.y - b.y;

  if (x === 1) {
    a.walls[3] = false;
    b.walls[1] = false;
  } else if (x === -1) {
    a.walls[1] = false;
    b.walls[3] = false;
  }
  if (y === 1) {
    a.walls[0] = false;
    b.walls[2] = false;
  } else if (y === -1) {
    a.walls[2] = false;
    b.walls[0] = false;
  }
}
function animateWallBreak(cellA, cellB, wallIndex, duration = 90) {
    wallBreakAnimations.push({ cellA, cellB, wallIndex, frame: 0, duration });
  }
  

function generateMazeStep() {
  current.visited = true;
  const next = current.checkNeighbors();
  if (next) {
    next.visited = true;
    stack.push(current);
    removeWalls(current, next);
    current = next;
  } else if (stack.length > 0) {
    current = stack.pop();
  }
}

function drawMaze() {
  mazeGrid.forEach(cell => cell.draw());
}

function buildMaze(callback) {
  function loop() {
    for (let i = 0; i < 10; i++) generateMazeStep();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    centerMazeOnCanvas();  
    drawMaze();
    if (stack.length > 0) requestAnimationFrame(loop);
    else callback();
  }
  loop();
}

function drawEndPoint() {
  const x = (cols - 1) * cellSize;
  const y = (rows - 1) * cellSize;
  ctx.fillStyle = "#00ff00";
  ctx.fillRect(x + cellSize / 4, y + cellSize / 4, cellSize / 2, cellSize / 2);
}

function checkWin() {
  if (!gameWon && player.x === cols - 1 && player.y === rows - 1) {
    gameWon = true;
    clearInterval(countdown);

    fetch('/next_level', {
      method: 'POST',
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || "You Win!");
        window.location.href = `/level_select`;  // This restarts the game with the new level
      })
      .catch(err => {
        console.error("Failed to progress to next level:", err);
        alert("You win! But could not progress to next level.");
        window.location.href = `/index`;

      });
  }
}


  
function showQuestionModal(question, wallIndex, currentIdx, nextIdx, newX, newY)
{
    const modal = document.getElementById("questionModal");
    const questionText = document.getElementById("questionText");
    const optionsDiv = document.getElementById("options");
  
    questionText.textContent = question.question;
    optionsDiv.innerHTML = '';
  
    for (let opt in question.options) {
      const btn = document.createElement("button");
      btn.textContent = `${opt}: ${question.options[opt]}`;
      btn.className = "question-option"; // You can target it using a class in CSS

  
      btn.onclick = () => {
        const answerData = { id: question.id, answer: opt };
  
        fetch('/validate_answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answerData)
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
      alert(`Correct! You can go through! (${wallsBroken}/${wallBreakLimit} used)`);
    } else {
      alert("⚠️ Wall break limit reached. Find a path without questions!");
    }
  } else {
    alert("❌ Incorrect! Wall remains.");
  }
  modal.style.display = "none"; // ✅ Move here, outside if
});

      };
      optionsDiv.appendChild(btn);
    }
  
    modal.style.display = "flex";
  }
  
// Player rendering
function renderPlayer() {
  const playerX = player.x * cellSize + cellSize / 2;
  const playerY = player.y * cellSize + cellSize / 2;
  ctx.fillStyle = "#ff0000";
  ctx.beginPath();
  ctx.arc(playerX, playerY, cellSize / 4, 0, 2 * Math.PI);
  ctx.fill();
}
document.addEventListener('keydown', e => {
  if (document.getElementById("questionModal").style.display === "flex") return;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();  // prevent scroll
  
      const dx = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: 0, ArrowDown: 0 };
      const dy = { ArrowRight: 0, ArrowLeft: 0, ArrowUp: -1, ArrowDown: 1 };
      const wallIdx = {
        ArrowUp: 0,
        ArrowRight: 1,
        ArrowDown: 2,
        ArrowLeft: 3
      };
  
      const newX = player.x + dx[e.key];
      const newY = player.y + dy[e.key];
  
      if (newX >= 0 && newX < cols && newY >= 0 && newY < rows) {
        const currentIdx = player.y * cols + player.x;
        const nextIdx = newY * cols + newX;
  
        // Check current cell wall in movement direction
        if (mazeGrid[currentIdx].walls[wallIdx[e.key]]) {
          // Wall exists: block movement, show question
          fetch('/get_question')
            .then(response => response.json())
            .then(data => {
              if (data.error) {
                alert('No question available!');
                return;
              }
  
            const question = data;
            const wallIndex = wallIdx[e.key];
            showQuestionModal(question, wallIndex, currentIdx, nextIdx, newX, newY);

            })
            .catch(error => console.error('Error fetching question:', error));
        } else {
          // No wall, move freely
          player.x = newX;
          player.y = newY;
        }
      }
    }
  });

function centerMazeOnCanvas() {
  const mazeWidth = cols * cellSize;
  const mazeHeight = rows * cellSize;
  const offsetX = (canvas.width - mazeWidth) / 2;
  const offsetY = (canvas.height - mazeHeight) / 2;
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset any previous transforms
  ctx.translate(offsetX, offsetY);
}

function gameLoop() {
  requestAnimationFrame(gameLoop);
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  centerMazeOnCanvas(); // Center everything drawn after this

  drawMaze();

  // Draw wall break animations
  wallBreakAnimations = wallBreakAnimations.filter(anim => {
    const progress = anim.frame / anim.duration;
    const x1 = anim.cellA.x * cellSize;
    const y1 = anim.cellA.y * cellSize;

    ctx.strokeStyle = `rgba(255, 255, 0, ${1 - progress})`;
    ctx.lineWidth = 3;

    ctx.beginPath();
    switch (anim.wallIndex) {
      case 0: ctx.moveTo(x1 + cellSize * progress, y1); ctx.lineTo(x1 + cellSize * (1 - progress), y1); break;
      case 1: ctx.moveTo(x1 + cellSize, y1 + cellSize * progress); ctx.lineTo(x1 + cellSize, y1 + cellSize * (1 - progress)); break;
      case 2: ctx.moveTo(x1 + cellSize * progress, y1 + cellSize); ctx.lineTo(x1 + cellSize * (1 - progress), y1 + cellSize); break;
      case 3: ctx.moveTo(x1, y1 + cellSize * progress); ctx.lineTo(x1, y1 + cellSize * (1 - progress)); break;
    }
    ctx.stroke();
    anim.frame++;
    return anim.frame <= anim.duration;
  });

  drawEndPoint();
  checkWin();
  renderPlayer();
}
  
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  cellSize = Math.min(canvas.width / cols, canvas.height / rows);
  centerMazeOnCanvas();
  drawMaze();
});

if (player.x === exitCell.x && player.y === exitCell.y) {
  gameWon = true;
  clearInterval(countdown);

  const level = cols / 10; // because your levels scale 10x10 → 40x40
  fetch("/submit_score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ level: level, time_left: timeLeft })
  })
    .then(res => res.json())
    .then(data => {
      alert(`🎉 You escaped the Maze!\nScore: ${data.score}`);
      return fetch("/next_level", { method: "POST" });
    })
    .then(res => res.json())
    .then(data => {
      if (data.message.includes("completed")) {
        alert(data.message);
        window.location.href = "/leaderboard"; // show leaderboard after all levels
      } else {
        window.location.href = "/index";
      }
    });
}
