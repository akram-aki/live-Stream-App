const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
let clients = [];

// WebSocket signaling
wss.on("connection", (ws) => {
  clients.push(ws);
  console.log("Client connected:", clients.length);

  ws.on("message", (message) => {
    const msgText =
      typeof message === "string" ? message : message.toString("utf8");
    console.log("[WS received]", msgText);

    // Broadcast to all *other* clients
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        console.log("[WS sending]", msgText);
        client.send(msgText);
      }
    });
  });

  ws.on("close", () => {
    clients = clients.filter((c) => c !== ws);
    console.log("Client disconnected:", clients.length);
  });
});

// Serve static frontend (Vite build)
app.use(express.static(path.join(__dirname, "../front/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../front/dist/index.html"));
});

// Listen on LAN
const PORT = 3000;
const HOST = "0.0.0.0";
server.listen(PORT, HOST, () =>
  console.log(`Signaling server listening on http://${HOST}:${PORT}`)
);
