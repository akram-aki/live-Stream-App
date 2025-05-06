// frontend/src/signalling.js
export function createSignaling(onSignal, onOpenCallback) {
  const SIGNALING_SERVER = "ws://localhost:3000";
  const ws = new WebSocket(SIGNALING_SERVER);
  let isOpen = false;
  const pending = [];

  ws.onopen = () => {
    console.log("Connected to signaling server");
    isOpen = true;

    // first, fire your negotiation
    if (onOpenCallback) onOpenCallback();

    // then, flush any queued messages
    pending.forEach((msg) => {
      console.log("[Signaling ⇒] Flushing queued:", msg);
      ws.send(JSON.stringify(msg));
    });
    pending.length = 0;
  };

  ws.onmessage = async ({ data }) => {
    const text = data instanceof Blob ? await data.text() : data;
    console.log("[Signaling ⇐]", text);
    onSignal(JSON.parse(text));
  };

  ws.onerror = (err) => console.error("WebSocket error:", err);

  return {
    send: (msg) => {
      if (isOpen) {
        console.log("[Signaling ⇒] Sending immediately:", msg);
        ws.send(JSON.stringify(msg));
      } else {
        console.log("[Signaling ⇒] Queued before open:", msg);
        pending.push(msg);
      }
    },
  };
}
