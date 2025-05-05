import React from "react";
import Sender from "./Sender.jsx";
import Receiver from "./Reciever.jsx";

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const role = params.get("role");
  return role === "sender" ? <Sender /> : <Receiver />;
  // return <Sender />;
}
