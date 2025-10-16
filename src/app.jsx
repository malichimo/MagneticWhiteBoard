// src/App.jsx
import React from "react";
import MagneticWhiteboard from "./components/MagneticWhiteboard";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-slate-800 my-4">
        Magnetic Whiteboard Team Builder
      </h1>
      <MagneticWhiteboard />
    </div>
  );
}
