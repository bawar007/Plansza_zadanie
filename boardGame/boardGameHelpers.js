export function isOccupied(isFront, x, y, piecesFront, piecesGrid) {
  if (isFront) {
    return piecesFront.some(
      (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5
    );
  } else {
    return piecesGrid.some(
      (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5 && !p.isPixel
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

export function getCoordsList(gridSize, board, pieces) {
  const cellSize = board.width / gridSize;
  const codeMargin = 70;
  const boardHeight = gridSize * cellSize;

  // Grupowanie po obrazku i kolorze
  const groups = {};

  for (const p of pieces) {
    let col = Math.floor(p.x / cellSize);
    let row;
    let label;

    if (p.y < boardHeight) {
      row = Math.floor(p.y / cellSize) + 1;
      label = `${String.fromCharCode(65 + col)}${row}`;
    } else {
      row = Math.floor((p.y - boardHeight - codeMargin) / cellSize) + 1;
      label = `${String.fromCharCode(65 + col)}K${row}`;
    }

    // Klucz: img+color (null jeśli brak)
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

  // Zamiana na tablicę obiektów
  return Object.values(groups);
}
