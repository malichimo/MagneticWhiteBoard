# Magnetic Whiteboard Team Builder

A lightweight React app for arranging teams like a magnetic whiteboard.
Paste a list of names to create draggable magnets, group them by color, add labels, save/load boards, and print.

## Features
- Paste-to-create magnets (one per line or comma-separated)
- Drag and drop (mouse/touch)
- Snap-to-grid + toggle grid
- Color chips for quick team grouping
- Labels for team names
- Save / Load board state (JSON) + autosave to localStorage
- Lock to prevent accidental moves
- Print layout hides toolbar and fills page

## Stack
- Vite + React
- Tailwind CSS
- framer-motion (dragging)
- lucide-react (icons)

## Quick Start
```bash
npm install
npm run dev
```

Open the printed URL (e.g., http://localhost:5173).

## Build
```bash
npm run build
npm run preview
```

## File Structure
```
.
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    └── components/
        └── MagneticWhiteboard.jsx
```

## Printing
- Click **Lock** then **Print** for the cleanest output.
- Unlock afterward to keep editing.

## Save/Load
- **Save** downloads a JSON snapshot of the board.
- **Load** imports a previously saved JSON file.
