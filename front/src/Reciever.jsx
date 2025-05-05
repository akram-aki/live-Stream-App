import React, { useEffect, useRef } from "react";
import { createSignaling } from "./signalling.js";

export default function Receiver() {
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    const pc = new RTCPeerConnection({ iceServers: [] });

    const signaling = createSignaling(async (msg) => {
      if (msg.type === "offer") {
        await pc.setRemoteDescription(msg.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        signaling.send({ type: "answer", answer });
      } else if (msg.type === "ice") {
        await pc.addIceCandidate(msg.candidate);
      }
    });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) signaling.send({ type: "ice", candidate });
    };

    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "2rem",
      }}
    >
      <h2>Receiver</h2>
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{ width: "640px" }}
      />
    </div>
  );
}
