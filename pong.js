const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");
const findMatchButton = document.getElementById("findMatch");

const ws = new WebSocket(`ws://${location.host}`);
let playerIndex = null;
let isGameActive = false;

findMatchButton.addEventListener("click", () => {
  ws.send(JSON.stringify({ type: "findMatch" }));
  findMatchButton.disabled = true;
  findMatchButton.innerText = "Finding match...";
});

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "status") {
    console.log(data.message);
  } else if (data.type === "matchFound") {
    playerIndex = data.role === "player1" ? 1 : 2;
    console.log(`Match found! You are Player ${playerIndex}`);
    isGameActive = true;
    findMatchButton.style.display = "none";
    updateGame();
  } else if (data.type === "paddleMove" && data.player !== playerIndex) {
    opponentY = data.position;
  } else if (data.type === "ballUpdate") {
    ballX = data.state.ballX;
    ballY = data.state.ballY;
  } else if (data.type === "disconnect") {
    console.log("Opponent disconnected");
    isGameActive = false;
    alert("Your opponent has left the game.");
    location.reload();
  }
};

// Game variables
const paddleWidth = 10;
const paddleHeight = 100;
const ballRadius = 10;
let playerY = canvas.height / 2 - paddleHeight / 2;
let opponentY = canvas.height / 2 - paddleHeight / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 4;
let ballSpeedY = 4;

document.addEventListener("mousemove", (event) => {
  if (!isGameActive) return;

  const rect = canvas.getBoundingClientRect();
  playerY = event.clientY - rect.top - paddleHeight / 2;

  if (playerIndex !== null) {
    ws.send(JSON.stringify({ type: "paddleMove", position: playerY }));
  }
});

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawBall(x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRect(0, playerY, paddleWidth, paddleHeight, "white");
  drawRect(canvas.width - paddleWidth, opponentY, paddleWidth, paddleHeight, "white");
  drawBall(ballX, ballY, ballRadius, "white");
}

function updateGame() {
  if (!isGameActive) return;

  if (playerIndex === 1) {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    if (ballY <= 0 || ballY >= canvas.height) {
      ballSpeedY *= -1;
    }

    if (ballX <= 0 || ballX >= canvas.width) {
      ballSpeedX *= -1;
    }

    ws.send(JSON.stringify({ type: "ballUpdate", state: { ballX, ballY } }));
  }

  drawGame();
  requestAnimationFrame(updateGame);
}
