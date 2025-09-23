import { boardGameState } from "./boardGameState.js";
export function isOccupied(
  is50x50,
  isFront,
  x,
  y,
  piecesFront,
  piecesGrid,
  pieces50x50
) {
  if (is50x50) {
    return pieces50x50.some(
      (p) => Math.abs(p.x - x) < 3 && Math.abs(p.y - y) < 3 && !p.isPixel
    );
  } else {
    if (isFront) {
      // Na przedniej stronie wszystkie elementy (krążki + piksele) blokują
      return piecesFront.some(
        (p) => Math.abs(p.x - x) < 3 && Math.abs(p.y - y) < 3
      );
    } else {
      // Na tylnej stronie tylko krążki blokują (piksele są w tle)
      return piecesGrid.some(
        (p) => Math.abs(p.x - x) < 3 && Math.abs(p.y - y) < 3 && !p.isPixel
      );
    }
  }
}

export function getImage(src, callback) {
  if (!src) return;
  const img = new Image();
  img.onload = () => callback(img);
  img.src = src;
}

export function loadImageAsync(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
}

// System buforowania obrazów w różnych rozmiarach
const imageBufferCache = new Map(); // src -> Map(size -> canvas)

// Popularne rozmiary używane w aplikacji
const COMMON_SIZES = [75, 80, 100, 72, 60, 48];

export function createImageBuffer(sourceImg, targetSize) {
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d");

  // Włącz wygładzanie dla lepszej jakości
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Narysuj przeskalowany obraz na buforze
  ctx.drawImage(sourceImg, 0, 0, targetSize, targetSize);
  return canvas;
}

export async function loadImageWithBuffers(src) {
  // Załaduj oryginalny obraz
  const originalImg = await loadImageAsync(src);
  if (!originalImg) return null;

  // Utwórz mapę buforów dla tego obrazu
  const buffers = new Map();

  // Stwórz bufory dla popularnych rozmiarów
  COMMON_SIZES.forEach((size) => {
    const buffer = createImageBuffer(originalImg, size);
    buffers.set(size, buffer);
  });

  // Zachowaj oryginalny obraz
  buffers.set("original", originalImg);

  // Zapisz w cache
  imageBufferCache.set(src, buffers);

  return originalImg;
}

export function getBufferedImage(src, targetSize) {
  const buffers = imageBufferCache.get(src);
  if (!buffers) return null;

  // Sprawdź czy mamy bufor dokładnie tego rozmiaru
  if (buffers.has(targetSize)) {
    return buffers.get(targetSize);
  }

  // Jeśli nie ma bufora tego rozmiaru, stwórz go
  const originalImg = buffers.get("original");
  if (originalImg) {
    const newBuffer = createImageBuffer(originalImg, targetSize);
    buffers.set(targetSize, newBuffer);
    return newBuffer;
  }

  return null;
}

export function clearImageBuffers() {
  imageBufferCache.clear();
}

export function showMessage(txt) {
  const msg = document.getElementById("message");
  msg.textContent = txt;
}

export function getMousePos(e, board, cellSizeDefault) {
  const rect = board.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const c = Math.floor(mx / cellSizeDefault);
  const r = Math.floor(my / cellSizeDefault);
  const x = c * cellSizeDefault + cellSizeDefault / 2;
  const y = r * cellSizeDefault + cellSizeDefault / 2;
  return { mx, my, c, r, x, y };
}

export function getTouchPos(e, board, cellSize) {
  const touch = e.touches?.[0] || e.changedTouches?.[0];
  if (!touch) return { x: 0, y: 0 };
  const rect = board.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  return { x, y };
}

export function getCoordsList(backSizeRows, pieces, codeMargin) {
  // Użyj rzeczywistego cellSize ze stanu zamiast obliczania z canvas
  const cellSize = boardGameState.cellSize;
  const boardHeight = backSizeRows * cellSize;

  const groups = {};

  for (const p of pieces) {
    let col = Math.floor(p.x / cellSize);
    let row;
    let label;

    if (p.y < boardHeight) {
      row = Math.floor(p.y / cellSize) + 1;
      label = `${String.fromCharCode(65 + col)}${row}`;
    } else continue;

    const imgKey = p.img || null;
    const colorKey = p.color || null;
    const groupKey = `${imgKey}|${colorKey}`;

    if (!groups[groupKey]) {
      groups[groupKey] = {
        img: imgKey,
        color: colorKey,
        coords: [],
      };
    }
    groups[groupKey].coords.push(label);
  }

  return Object.values(groups);
}

export function wrapText(pdf, text, maxWidth) {
  const lines = [];
  const coordsText = text.join(", ");
  let currentLine = "";

  coordsText.split(", ").forEach((coord) => {
    const testLine = currentLine ? currentLine + ", " + coord : coord;
    if (pdf.getTextWidth(testLine) > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = coord;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) lines.push(currentLine);
  return lines;
}

export function addPixelAt(
  x,
  y,
  color,
  isFront,
  piecesFront,
  piecesGrid,
  pieces50x50,
  is50x50
) {
  if (!isFront || is50x50) {
    const cellSize = boardGameState.cellSize;
    const boardHeight = (is50x50 ? 5 : boardGameState.backSizeRows) * cellSize;
    const codeMargin = boardGameState.codeMargin;
    const codeRows = boardGameState.codeRows;
    // Przestrzeń między planszą a blokiem kodu
    if (
      x < 0 ||
      y < 0 ||
      x >= boardHeight ||
      y >= boardHeight + codeMargin + codeRows * cellSize
    ) {
      return false;
    }
    if (y >= boardHeight && y < boardHeight + codeMargin) {
      return false;
    }

    // Blok kodu
    const codeStartY = boardHeight + codeMargin;
    if (y >= codeStartY && y < codeStartY + codeRows * cellSize) {
      // Pierwsze pole w bloku kodu (kolumna 0, wiersz 0)
      const col = Math.floor(x / cellSize);
      const row = Math.floor((y - codeStartY) / cellSize);
      if (col === 0 && row === 0) {
        return false;
      }
    }
  }

  const idxTable = is50x50 ? pieces50x50 : isFront ? piecesFront : piecesGrid;
  const existingPixelIndex = idxTable.findIndex(
    (p) => Math.abs(p.x - x) < 2 && Math.abs(p.y - y) < 2 && p.isPixel
  );

  // Jeśli piksel już istnieje, podmień go na nowy kolor
  if (existingPixelIndex !== -1) {
    idxTable[existingPixelIndex].color = color;
    return true;
  }

  // Dodaj nowy piksel
  const pixelObj = {
    x,
    y,
    color,
    img: null,
    isCodingDisc: false,
    isPixel: true,
  };

  if (is50x50) {
    pieces50x50.push(pixelObj);
  } else {
    if (isFront) {
      piecesFront.push(pixelObj);
    } else {
      piecesGrid.push(pixelObj);
    }
  }
  return true;
}

export function getCurrentPiecesTable(boardGameState) {
  return boardGameState.isBoard50x50
    ? boardGameState.pieces50x50
    : boardGameState.isFront
    ? boardGameState.piecesFront
    : boardGameState.piecesGrid;
}

export function createPieceObj(x, y, boardGameState, isCodingDisc) {
  return {
    x,
    y,
    color: boardGameState.dragging.color,
    img: boardGameState.dragging.img,
    isCodingDisc: isCodingDisc,
    isPixel: !!boardGameState.dragging.isPixel,
  };
}

export const isDrawableImage = (val) => {
  return (
    val instanceof HTMLImageElement ||
    val instanceof HTMLCanvasElement ||
    (typeof ImageBitmap !== "undefined" && val instanceof ImageBitmap) ||
    (typeof OffscreenCanvas !== "undefined" && val instanceof OffscreenCanvas)
  );
};

// Funkcja do przeliczania pozycji elementów przy zmianie cellSize
export function rescalePiecePositions(pieces, oldCellSize, newCellSize) {
  if (!pieces || pieces.length === 0 || oldCellSize === newCellSize) {
    return;
  }

  pieces.forEach((piece) => {
    // Przelicz pozycję na współrzędne komórki (zakładając że element był na środku komórki)
    const col = Math.floor(piece.x / oldCellSize);
    const row = Math.floor(piece.y / oldCellSize);

    // Ustaw nową pozycję na środku nowej komórki
    piece.x = col * newCellSize + newCellSize / 2;
    piece.y = row * newCellSize + newCellSize / 2;
  });
}
