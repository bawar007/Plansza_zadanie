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
