export const boardGameState = {
  frontSizeRows: 9,
  backSizeRows: 10,
  cellSize: 70,
  isFront: false,
  dragging: null,
  prevPiece: null,
  loadedImages: {},
  piecesFront: [],
  piecesGrid: [],
  pieces50x50: [],
  lockedImg: null,
  codeRows: 3,
  codeMargin: 0,
  isPainting: false,
  paintColor: null,
  isBoard50x50: false,
  scaleFactor: 2, // Mnożnik rozdzielczości (2x, 3x, 4x)
};
