// frontend/src/Sender.jsx
import React, { useEffect, useRef, useState } from "react";
import { createSignaling } from "./signalling.js";

export default function Sender() {
  const localVideoRef = useRef(null);
  const [stream, setStream] = useState(null);

  // 1) grab the camera
  useEffect(() => {
    async function initMedia() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        localVideoRef.current.srcObject = s;
        setStream(s);
        console.log("🔧 Local stream obtained");
      } catch (err) {
        console.error("❌ getUserMedia failed:", err);
      }
    }
    initMedia();
  }, []);

  // 2) once we have a stream, set up the PeerConnection + signaling
  useEffect(() => {
    if (!stream) return;

    // — create PeerConnection with a public STUN (helps ICE)
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // — logging PeerConnection state
    pc.oniceconnectionstatechange = () =>
      console.log("ICE connection state:", pc.iceConnectionState);
    pc.onconnectionstatechange = () =>
      console.log("PeerConnection state:", pc.connectionState);
    pc.onicegatheringstatechange = () =>
      console.log("ICE gathering state:", pc.iceGatheringState);

    // — add our local tracks
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
      console.log("🔧 Added local track:", track.kind);
    });

    // — function to kickoff an SDP offer
    const negotiate = async () => {
      try {
        console.log("🔧 Creating offer…");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log("[Sender ⇒] offer:", pc.localDescription);
        signaling.send({ type: "offer", offer: pc.localDescription });
      } catch (err) {
        console.error("❌ negotiate() error:", err);
      }
    };

    // — wire up signaling, passing onSignal + onOpen callback
    const signaling = createSignaling(
      async (msg) => {
        console.log("[Sender ⇐] received:", msg);
        if (msg.type === "answer") {
          console.log("🔧 Setting remote description (answer)");
          await pc.setRemoteDescription(msg.answer);
        } else if (msg.type === "ice") {
          console.log("🔧 Adding ICE candidate");
          await pc.addIceCandidate(msg.candidate);
        }
      },
      () => {
        // only call negotiate once WS is open
        console.log("🛰️ Signaling open — starting SDP exchange");
        negotiate();
      }
    );

    // — send ICE candidates as they’re gathered
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        console.log("[Sender ⇒] ICE candidate:", candidate);
        signaling.send({ type: "ice", candidate });
      }
    };

    // cleanup
    return () => {
      pc.close();
      console.log("🔧 PeerConnection closed");
    };
  }, [stream]);

  return (
    <div style={{ textAlign: "center", marginTop: 20 }}>
      <h2>Sender</h2>
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        width="640"
        style={{ border: "1px solid #ccc" }}
      />
    </div>
  );
}
