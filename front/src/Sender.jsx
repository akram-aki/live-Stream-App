import React, { useEffect, useRef, useState } from "react";
import { createSignaling } from "./Signalling.js";

export default function Sender() {
  const localVideoRef = useRef(null);
  const [stream, setStream] = useState(null);

  // Get local camera
  useEffect(() => {
    async function init() {
      const s = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      localVideoRef.current.srcObject = s;
      setStream(s);
    }
    init();
  }, []);

  // WebRTC logic
  useEffect(() => {
    if (!stream) return;
    const pc = new RTCPeerConnection({ iceServers: [] });
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const signaling = createSignaling(async (msg) => {
      if (msg.type === "answer") {
        await pc.setRemoteDescription(msg.answer);
      } else if (msg.type === "ice") {
        await pc.addIceCandidate(msg.candidate);
      }
    });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) signaling.send({ type: "ice", candidate });
    };

    async function negotiate() {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signaling.send({ type: "offer", offer });
    }
    negotiate();
  }, [stream]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "2rem",
      }}
    >
      <h2>Sender</h2>
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        style={{ width: "640px" }}
      />
    </div>
  );
}
