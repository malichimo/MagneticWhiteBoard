import React from "react";
import MagneticWhiteboard from "./components/MagneticWhiteboard";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="px-4 pt-4 pb-2 print:hidden">
        <h1 className="text-2xl font-bold text-slate-800">Magnetic Whiteboard Team Builder</h1>
        <p className="text-slate-500 text-sm">Paste names → Add Magnets → Drag into teams → Lock → Print</p>
      </header>
      <div className="flex-1">
        <MagneticWhiteboard />
      </div>
    </div>
  );
}
