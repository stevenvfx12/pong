const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "public")));

let waitingPlayer = null;
const matches = new Map(); 

wss.on("connection", (ws) => {
  console.log("New connection");

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "findMatch") {
      if (waitingPlayer === null) {
        
        waitingPlayer = ws;
        ws.send(JSON.stringify({ type: "status", message: "Waiting for an opponent..." }));
      } else {
        
        const opponent = waitingPlayer;
        waitingPlayer = null;

        
        matches.set(ws, opponent);
        matches.set(opponent, ws);

        ws.send(JSON.stringify({ type: "matchFound", role: "player1" }));
        opponent.send(JSON.stringify({ type: "matchFound", role: "player2" }));
      }
    } else if (data.type === "paddleMove") {
      const opponent = matches.get(ws);
      if (opponent) {
        opponent.send(JSON.stringify({ type: "paddleMove", position: data.position }));
      }
    } else if (data.type === "ballUpdate") {
      const opponent = matches.get(ws);
      if (opponent) {
        opponent.send(JSON.stringify({ type: "ballUpdate", state: data.state }));
      }
    }
  });

  ws.on("close", () => {
    
    if (waitingPlayer === ws) {
      waitingPlayer = null;
    }
    const opponent = matches.get(ws);
    if (opponent) {
      opponent.send(JSON.stringify({ type: "disconnect" }));
      matches.delete(opponent);
    }
    matches.delete(ws);
  });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
