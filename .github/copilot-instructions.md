# Mata Online - AI Coding Agent Instructions

## Project Overview

Interactive educational board game for "coding on a carpet" (kodowanie na dywanie) - a visual programming teaching tool. The app provides a canvas-based interface where users can place colored pieces, circles, and pixels on different board configurations (9x9, 10x10, and 50x50 grids).

## Architecture

### Modular ES6 Structure

The codebase uses ES6 modules with clear separation of concerns:

- `boardGame.js` - Main entry point and orchestration
- `boardGameState.js` - Centralized state management (single source of truth)
- `boardGameData.js` - Static data definitions (sections, colors, image sets)
- `boardGameHelpers.js` - Pure utility functions
- `boardGameDraw.js` - Canvas rendering logic
- `boardGameEvents.js` - Event handler registration

### State Management Pattern

All state lives in `boardGameState` object with properties like:

```javascript
{
  isFront: true,           // Front/back board toggle
  isBoard50x50: false,     // 50x50 mode toggle
  piecesFront: [],         // Front board pieces
  piecesGrid: [],          // Back board pieces
  pieces50x50: [],         // 50x50 board pieces
  cellSize: 80,            // Dynamic cell sizing
  dragging: null,          // Current drag state
  isPainting: false,       // Pixel painting mode
}
```

### Canvas Layer System

Dual canvas approach:

- `#board` - Main rendering canvas
- `#boardOverlay` - Temporary overlay for drag previews
- Both resize dynamically based on `cellSize` and board mode

## Key Concepts

### Board Modes

1. **Front Board (9x9)** - Default view with pieces and pixels
2. **Back Board (10x10)** - Grid with coordinate system (A1-J10)
3. **50x50 Mode** - Large format board with special sizing (`cellSize: 100`)

### Piece Types

- **Circles** - Main game pieces with images from various educational sets
- **Pixels** - Colored squares for painting/drawing
- **Images** - Loaded from categorized asset folders (kodowanie_dla_najmlodszych, kolorowa_matematyka, etc.)

### Asset Organization

Educational content organized in `assets/` folders:

- `kodowanie_dla_najmlodszych/` - Basic coding symbols (1-75.png)
- `kolorowa_matematyka/` - Math symbols
- `kolorowe_sudoku/` - Sudoku pieces
- `material_obrazkowy/` - General educational images (1-112.png)
- `mata50x50/osX/`, `mata50x50/osY/` - 50x50 mode coordinate systems

## Development Patterns

### Event Handling

Events registered through `boardGameEvents.js` with handler objects:

```javascript
const boardMouseHandlers = {
  onMouseMove: (e) => {
    /* logic */
  },
  onMouseDown: (e) => {
    /* logic */
  },
  // ...
};
registerBoardMouseEvents(board, boardMouseHandlers);
```

### Rendering Pipeline

1. State change triggers `renderBoard()` call
2. `drawBoard()` clears and redraws entire canvas
3. Pieces rendered in order: pixels first, then circles/images
4. Labels and grid overlays added last

### Coordinate System

- Canvas coordinates (pixels) vs grid coordinates (cells)
- `getMousePos()` converts mouse events to grid positions
- Collision detection uses euclidean distance with tolerance (±3-5px)

### SCSS Compilation

Styles written in `boardStyle.scss`, compiled to `boardStyle.css` (include .map file)

## Common Tasks

### Adding New Piece Types

1. Add to `sections` array in `boardGameData.js`
2. Update rendering logic in `drawBoard()`
3. Handle in collision detection (`isOccupied()`)

### Modifying Board Layouts

- Adjust `frontSizeRows`/`backSizeRows` in state
- Update `updateCanvasSize()` for responsive behavior
- Modify grid drawing functions in `boardGameDraw.js`

### Asset Integration

- Place images in appropriate `assets/[category]/` folder
- Reference in `boardGameData.js` sections with relative paths
- Images load asynchronously via `loadImageAsync()`

## Browser Compatibility

- Uses modern Canvas API and ES6 modules
- Touch events for mobile support
- PDF generation via jsPDF library
- No build system - runs directly in browser
