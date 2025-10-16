import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, Upload, Printer, Plus, Trash2, Grid, Lock, Unlock } from "lucide-react";

/**
 * Magnetic Whiteboard Team Builder
 * ------------------------------------------------------------
 * Paste a list of names to create draggable "magnets" and arrange teams.
 * - Drag anywhere on the board (mouse or touch)
 * - Snap-to-grid (optional)
 * - Color tags for quick team grouping
 * - Add labels (for team names) just like sticky notes
 * - Save / Load (JSON) + auto-save to localStorage
 * - Print friendly (toolbar hidden on print; board fills page)
 *
 * Tailwind is available automatically in Canvas. No import needed.
 */

const COLORS = [
  { name: "Slate", bg: "bg-slate-200", text: "text-slate-900" },
  { name: "Blue", bg: "bg-blue-200", text: "text-blue-900" },
  { name: "Green", bg: "bg-green-200", text: "text-green-900" },
  { name: "Yellow", bg: "bg-yellow-200", text: "text-yellow-900" },
  { name: "Orange", bg: "bg-orange-200", text: "text-orange-900" },
  { name: "Red", bg: "bg-red-200", text: "text-red-900" },
  { name: "Purple", bg: "bg-purple-200", text: "text-purple-900" },
  { name: "Pink", bg: "bg-pink-200", text: "text-pink-900" },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function parseNames(text) {
  return text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const DEFAULT_BOARD = {
  items: /** @type {Array<{id:string,type:"magnet"|"label",text:string,x:number,y:number,color:number}>} */ ([]),
  settings: { grid: true, snap: true, locked: false },
};

export default function MagneticWhiteboard() {
  const [board, setBoard] = useState(DEFAULT_BOARD);
  const [pasteText, setPasteText] = useState("");
  const [selectedColor, setSelectedColor] = useState(1); // default Blue
  const boardRef = useRef(null);

  // Intro overlay shown once (dismiss stored in localStorage)
  // Read localStorage inside useEffect to avoid runtime errors in environments
  // where window/localStorage may be unavailable during initial render.
  const [showIntro, setShowIntro] = useState(false);
  useEffect(() => {
    try {
      const shown = typeof window !== "undefined" && localStorage.getItem("mag-whiteboard-intro-shown") === "1";
      setShowIntro(!shown);
    } catch {
      setShowIntro(false);
    }
  }, []);
  const dismissIntro = () => {
    try {
      if (typeof window !== "undefined") localStorage.setItem("mag-whiteboard-intro-shown", "1");
    } catch {}
    setShowIntro(false);
  };

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mag-whiteboard-v1");
      if (saved) setBoard(JSON.parse(saved));
    } catch {}
  }, []);

  // Auto-save
  useEffect(() => {
    try {
      localStorage.setItem("mag-whiteboard-v1", JSON.stringify(board));
    } catch {}
  }, [board]);

  const gridSize = 24;

  const addMagnets = () => {
    if (!pasteText.trim()) return;
    const names = parseNames(pasteText);
    const rect = boardRef.current?.getBoundingClientRect?.();
    const baseX = 24;
    const baseY = 24;
    const next = names.map((n, i) => ({
      id: uid(),
      type: "magnet",
      text: n,
      x: baseX + (i % 4) * 140,
      y: baseY + Math.floor(i / 4) * 60,
      color: selectedColor,
    }));
    setBoard((b) => ({ ...b, items: [...b.items, ...next] }));
    setPasteText("");
  };

  const addLabel = () => {
    const id = uid();
    setBoard((b) => ({
      ...b,
      items: [
        ...b.items,
        {
          id,
          type: "label",
          text: "Team A",
          x: 24 + Math.random() * 100,
          y: 24 + Math.random() * 60,
          color: 3, // Yellow
        },
      ],
    }));
  };

  const clearBoard = () => {
    if (!confirm("Clear all magnets and labels?")) return;
    setBoard({ ...DEFAULT_BOARD });
  };

  const onDragEnd = (id, info) => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = info.point.x - rect.left;
    const y = info.point.y - rect.top;

    setBoard((b) => ({
      ...b,
      items: b.items.map((it) => {
        if (it.id !== id) return it;
        let nx = x - (it.type === "label" ? 0 : 60); // center-ish correction
        let ny = y - 20;
        if (b.settings.snap) {
          nx = Math.round(nx / gridSize) * gridSize;
          ny = Math.round(ny / gridSize) * gridSize;
        }
        // Keep within bounds
        nx = Math.max(0, Math.min(nx, rect.width - 120));
        ny = Math.max(0, Math.min(ny, rect.height - 40));
        return { ...it, x: nx, y: ny };
      }),
    }));
  };

  const handleExport = () => {
    const data = JSON.stringify(board, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "whiteboard-teams.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const json = JSON.parse(text);
        if (json?.items && json?.settings) setBoard(json);
        else alert("Invalid file format.");
      } catch (e) {
        alert("Could not parse file.");
      }
    };
    input.click();
  };

  const toggle = (key) => setBoard((b) => ({ ...b, settings: { ...b.settings, [key]: !b.settings[key] } }));

  const printBoard = () => {
    // Lock to prevent accidental drags while printing
    if (!board.settings.locked) toggle("locked");
    setTimeout(() => window.print(), 50);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 text-slate-900">
      {/* Intro overlay (hidden when dismissed) */}
      {showIntro && (
        <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-6 text-slate-900">
            <h2 className="text-lg font-semibold mb-2">Magnetic Whiteboard — Quick Start</h2>
            <p className="text-sm mb-3">
              I built you a draggable “magnetic whiteboard” app with:
            </p>
            <ul className="list-disc list-inside text-sm mb-3 space-y-1">
              <li>Paste-to-create magnets (one name per line or comma-separated)</li>
              <li>Drag & drop (mouse or touch), optional snap-to-grid</li>
              <li>Color picking for quick team grouping</li>
              <li>Add editable labels for team names</li>
              <li>Save/Load board state (JSON) + autosave to your browser</li>
              <li>Lock toggle to prevent accidental moves</li>
              <li>Print button (hides the toolbar and fills the page for clean printouts)</li>
            </ul>
            <p className="text-sm mb-4">Try this flow: Paste your roster → pick a color → “Add Magnets”. Drag names into teams, add labels as headers. Toggle Lock → Print when ready.</p>
            <div className="flex justify-end">
              <button onClick={dismissIntro} className="px-4 py-2 bg-blue-600 text-white rounded-xl">Got it</button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="print:hidden sticky top-0 z-20 w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-6xl mx-auto p-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggle("grid")}
              className={`px-3 py-2 rounded-xl border text-sm flex items-center gap-2 ${
                board.settings.grid ? "bg-slate-100" : "bg-white"
              }`}
              title="Toggle grid"
            >
              <Grid className="w-4 h-4" /> Grid
            </button>
            <button
              onClick={() => toggle("snap")}
              className={`px-3 py-2 rounded-xl border text-sm ${
                board.settings.snap ? "bg-slate-100" : "bg-white"
              }`}
              title="Toggle snap to grid"
            >
              Snap
            </button>
            <button
              onClick={() => toggle("locked")}
              className={`px-3 py-2 rounded-xl border text-sm flex items-center gap-2 ${
                board.settings.locked ? "bg-slate-100" : "bg-white"
              }`}
              title="Lock/unlock dragging"
            >
              {board.settings.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />} {board.settings.locked ? "Locked" : "Unlocked"}
            </button>
          </div>

          <div className="flex-1 min-w-[240px]">
            <textarea
              rows={1}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste names here (one per line, or comma-separated)"
              className="w-full resize-y px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1" title="Magnet color">
              {COLORS.map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColor(i)}
                  className={`w-6 h-6 rounded-full border ${c.bg} ${
                    selectedColor === i ? "ring-2 ring-offset-2 ring-slate-600" : ""
                  }`}
                  aria-label={`Select ${c.name}`}
                />
              ))}
            </div>

            <button onClick={addMagnets} className="px-3 py-2 rounded-xl border text-sm bg-blue-600 text-white flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Magnets
            </button>
            <button onClick={addLabel} className="px-3 py-2 rounded-xl border text-sm">
              + Label
            </button>

            <button onClick={handleExport} className="px-3 py-2 rounded-xl border text-sm flex items-center gap-2" title="Export JSON">
              <Download className="w-4 h-4" /> Save
            </button>
            <button onClick={handleImport} className="px-3 py-2 rounded-xl border text-sm flex items-center gap-2" title="Import JSON">
              <Upload className="w-4 h-4" /> Load
            </button>
            <button onClick={printBoard} className="px-3 py-2 rounded-xl border text-sm flex items-center gap-2" title="Print the board">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={clearBoard} className="px-3 py-2 rounded-xl border text-sm flex items-center gap-2 text-red-700" title="Clear all">
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 min-h-[600px] print:h-screen">
        <div
          ref={boardRef}
          className={`relative max-w-6xl mx-auto my-4 aspect-[16/9] w-[95%] rounded-2xl border shadow-inner overflow-hidden bg-white print:shadow-none print:border-0 print:w-[100%] print:h-[100%] print:my-0 ${
            board.settings.grid
              ? "bg-[radial-gradient(circle,_#e2e8f0_1px,_transparent_1px)] [background-size:24px_24px]"
              : "bg-white"
          }`}
        >
          {board.items.map((it) => (
            <Magnet
              key={it.id}
              item={it}
              locked={board.settings.locked}
              colorIdx={it.color}
              onChangeText={(text) =>
                setBoard((b) => ({
                  ...b,
                  items: b.items.map((x) => (x.id === it.id ? { ...x, text } : x)),
                }))
              }
              onDelete={() => setBoard((b) => ({ ...b, items: b.items.filter((x) => x.id !== it.id) }))}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      </div>

      {/* Footer tip (hidden on print) */}
      <div className="print:hidden text-center text-xs text-slate-500 pb-3">
        Tip: Paste names → choose a color → Add Magnets. Drag to arrange teams. Use Labels for team headings. Toggle Lock before printing.
      </div>
    </div>
  );
}

function Magnet({ item, locked, colorIdx, onChangeText, onDelete, onDragEnd }) {
  const ref = useRef(null);
  const color = COLORS[colorIdx] ?? COLORS[0];
  const isLabel = item.type === "label";

  return (
    <motion.div
      ref={ref}
      className={`absolute select-none ${isLabel ? "" : "w-[120px]"}`}
      initial={false}
      style={{ left: item.x, top: item.y }}
      drag={!locked}
      dragMomentum={false}
      onDragEnd={(e, info) => onDragEnd(item.id, info)}
    >
      <div
        className={`group ${color.bg} ${color.text} ${
          isLabel
            ? "px-4 py-2 rounded-2xl font-semibold shadow"
            : "px-3 py-2 rounded-2xl shadow cursor-grab active:cursor-grabbing"
        }`}
      >
        {isLabel ? (
          <ContentEditable
            value={item.text}
            onChange={onChangeText}
            className="min-w-[120px] max-w-[260px] outline-none"
          />
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ContentEditable
                value={item.text}
                onChange={onChangeText}
                className="outline-none"
              />
            </div>
            <button
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 transition text-slate-700 hover:text-red-700"
              title="Delete"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ContentEditable({ value, onChange, className = "" }) {
  const elRef = useRef(null);
  useEffect(() => {
    if (!elRef.current) return;
    if (elRef.current.innerText !== value) {
      elRef.current.innerText = value;
    }
  }, [value]);
  return (
    <div
      ref={elRef}
      className={`whitespace-pre-wrap ${className}`}
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => onChange(e.currentTarget.innerText)}
      onKeyDown={(e) => {
        // prevent newlines on labels/names with Shift+Enter allowed
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    />
  );
}
