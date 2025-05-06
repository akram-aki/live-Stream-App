// frontend/src/Receiver.jsx
import React, { useEffect, useRef } from "react";
import { createSignaling } from "./signalling.js";

export default function Receiver() {
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicegatheringstatechange = () =>
      console.log("Receiver ICE gathering:", pc.iceGatheringState);
    pc.oniceconnectionstatechange = () =>
      console.log("Receiver ICE connection:", pc.iceConnectionState);
    pc.onconnectionstatechange = () =>
      console.log("Receiver PeerConnection:", pc.connectionState);

    pc.ontrack = (event) => {
      console.log("🔧 Receiver got track:", event.track.kind);
      const stream = event.streams[0];
      console.log("Streams on event:", stream);

      const videoEl = remoteVideoRef.current;
      videoEl.srcObject = stream;

      // ensure autoplay in all browsers
      videoEl.muted = true;
      videoEl.play().catch((err) => {
        console.warn("❌ video.play() failed:", err);
      });
    };

    const signaling = createSignaling(async (msg) => {
      console.log("[Receiver ⇐]", msg);

      if (msg.type === "offer") {
        await pc.setRemoteDescription(msg.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("[Receiver ⇒] answer:", answer);
        signaling.send({ type: "answer", answer });
      } else if (msg.type === "ice") {
        await pc.addIceCandidate(msg.candidate);
        console.log("[Receiver] added ICE candidate");
      }
    });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        console.log("[Receiver ⇒] ICE candidate:", candidate);
        signaling.send({ type: "ice", candidate });
      }
    };

    return () => pc.close();
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: 20 }}>
      <h2>Receiver</h2>
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        muted
        width="640"
        style={{ border: "1px solid #ccc" }}
      />
    </div>
  );
}
