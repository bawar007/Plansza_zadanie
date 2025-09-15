import { boardGameState } from "./boardGameState.js";
export function isOccupied(isFront, x, y, piecesFront, piecesGrid) {
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

export function isPixelAt(x, y, piecesGrid) {
  return piecesGrid.some(
    (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5 && p.isPixel
  );
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

export function showMessage(txt) {
  const msg = document.getElementById("message");
  msg.textContent = txt;
}

export function getMousePos(e, board, cellSizeDefalut) {
  const rect = board.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const c = Math.floor(mx / cellSizeDefalut);
  const r = Math.floor(my / cellSizeDefalut);
  const x = c * cellSizeDefalut + cellSizeDefalut / 2;
  const y = r * cellSizeDefalut + cellSizeDefalut / 2;
  return { mx, my, c, r, x, y };
}

export function getCoordsList(backSizeRows, board, pieces, codeMargin) {
  const cellSize = board.width / backSizeRows;
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
    // row = Math.floor((p.y - boardHeight - codeMargin) / cellSize) + 1;
    // label = `${String.fromCharCode(65 + col)}K${row}`;

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

export function addPixelAt(x, y, color, isFront, piecesFront, piecesGrid) {
  // Blokada: nie maluj w przestrzeni między planszą a blokiem kodu oraz na pierwszym polu w bloku kod
  if (!isFront) {
    // Parametry planszy
    const cellSize = boardGameState.cellSize;
    const boardHeight = boardGameState.backSizeRows * cellSize;
    const codeMargin = boardGameState.codeMargin;
    const codeRows = boardGameState.codeRows;

    // Przestrzeń między planszą a blokiem kodu
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

  const idxTable = isFront ? piecesFront : piecesGrid;
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

  if (isFront) {
    piecesFront.push(pixelObj);
  } else {
    piecesGrid.push(pixelObj);
  }

  return true;
}
