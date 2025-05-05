export function createSignaling(onSignal) {
  // Replace with your signaling server LAN address
  const SIGNALING_SERVER = "ws://192.168.1.50:3000";
  const ws = new WebSocket(SIGNALING_SERVER);
  ws.onopen = () => console.log("Connected to signaling server");
  ws.onmessage = ({ data }) => onSignal(JSON.parse(data));
  ws.onerror = (err) => console.error("WebSocket error:", err);
  return { send: (msg) => ws.send(JSON.stringify(msg)) };
}
