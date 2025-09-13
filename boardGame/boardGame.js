import {
  isOccupied,
  getImage,
  showMessage,
  getMousePos,
  isPixelAt,
  getCoordsList,
} from "./boardGameHelpers.js";
import { boardGameState } from "./boardGameState.js";
import { registerBoardEvents, registerUIEvents } from "./boardGameEvents.js";
import {
  drawCirclePiece,
  drawSquarePiece,
  drawBoard,
  drawPicker,
  drawEmptyDisc,
  drawPdfFile,
  drawLabels,
} from "./boardGameDraw.js";

const gameMain = document.getElementById("gameMain");
gameMain.innerHTML = `
<div class="pickerPanel">
  <div id="picker"></div>
  <div id="message"></div>

  <div class="buttonsContainer">
    <select id="gridSizeSelector" style="margin: 10px; font-size: 16px; display: none">
      <option value="10">10 x 10</option>
      <option value="12">12 x 12</option>
      <option value="14">14 x 14</option>
      <option value="16">16 x 16</option>
      <option value="18">18 x 18</option>
      <option value="20">20 x 20</option>
    </select>
    <button id="clearBoard">Wyczyść stronę</button>
    <button id="flipBoard">Obróć matę</button>
    <button id="downloadBoardPdf">Pobierz jako PDF</button>
    <button id="downloadCoords" style="display: none">Pobierz koordynaty</button>
  </div>
</div>
<div id="boardWrapper">
    <div id="yAxis"></div>
    <div>
      <div id="xAxis"></div>
      <canvas id="board" width="800" height="800"></canvas>
      <canvas id="boardOverlay" width="800" height="800"></canvas>
    </div>
  </div>
</div>
`;

const board = document.getElementById("board");
const ctxBoard = board.getContext("2d");

const boardOverlay = document.getElementById("boardOverlay");
const ctxOverlay = boardOverlay.getContext("2d");

function updateCanvasSize() {
  const boardSize = boardGameState.isFront
    ? boardGameState.frontSizeRows * boardGameState.cellSize
    : boardGameState.backSizeRows * boardGameState.cellSize;
  console.log(boardSize);

  board.width = boardSize;
  board.height = boardSize;
  boardOverlay.width = boardSize;
  boardOverlay.height = boardSize;

  if (boardGameState.isFront) {
    boardGameState.codeMargin = 0;
  } else {
    boardGameState.codeMargin = 80;
  }

  drawLabels(board);
}

function renderBoard() {
  if (boardGameState.isFront) {
    drawBoard(ctxOverlay, ctxBoard, {
      isFront: boardGameState.isFront,
      pieces: boardGameState.piecesFront,
      codeRows: 0,
      boardRows: boardGameState.frontSizeRows,
      boardWidth: boardGameState.frontSizeRows * boardGameState.cellSize,
      boardHeight: boardGameState.frontSizeRows * boardGameState.cellSize,
    });
  } else {
    drawBoard(ctxOverlay, ctxBoard, {
      isFront: boardGameState.isFront,
      pieces: boardGameState.piecesGrid,
      codeRows: boardGameState.codeRows,
      boardRows: boardGameState.backSizeRows,
      boardWidth: boardGameState.backSizeRows * boardGameState.cellSize,
      boardHeight:
        boardGameState.codeMargin +
        boardGameState.backSizeRows * boardGameState.cellSize +
        boardGameState.codeRows * boardGameState.cellSize,
    });
  }
}

const boardHandlers = {
  onMouseMove: (e) => {
    if (!boardGameState.dragging) {
      ctxOverlay.clearRect(0, 0, boardOverlay.width, boardOverlay.height);
      return;
    }
    const cellSizeDefalut = boardGameState.cellSize;
    const { mx, my, c, r, x, y } = getMousePos(e, board, cellSizeDefalut);
    const {
      dragging,
      frontSizeRows,
      backSizeRows,
      isFront,
      loadedImages,
      piecesFront,
      piecesGrid,
    } = boardGameState;

    dragging.x = mx;
    dragging.y = my;

    ctxOverlay.clearRect(0, 0, boardOverlay.width, boardOverlay.height);
    ctxOverlay.save();

    const cells = isFront ? frontSizeRows : backSizeRows + 4;

    if (!boardGameState.isFront) {
      const boardHeight = boardGameState.backSizeRows * boardGameState.cellSize;
      const codeStartY = boardHeight + boardGameState.codeMargin;

      const col = Math.floor(x / cellSizeDefalut);
      const row = Math.floor((y - codeStartY) / cellSizeDefalut);

      const isLockedCell =
        !boardGameState.isFront &&
        y >= codeStartY &&
        y < codeStartY + boardGameState.codeRows * cellSizeDefalut &&
        col === 0 &&
        row === 0;

      if (isLockedCell) {
        showMessage("Nie można modyfikować tej komórki!");
        board.style.cursor = "not-allowed";
      } else {
        showMessage("");
        board.style.cursor = "default";
      }
    }

    if (dragging.img) {
      const img = loadedImages[dragging.img];
      if (img) {
        drawCirclePiece(
          ctxOverlay,
          mx,
          my,
          cellSizeDefalut,
          boardGameState.dragging.color,
          img
        );
      } else {
        getImage(dragging.img, (imgLoaded) => {
          loadedImages[dragging.img] = imgLoaded;
          renderBoard();
        });
        drawCirclePiece(
          ctxOverlay,
          mx,
          my,
          cellSizeDefalut,
          boardGameState.dragging.color,
          img
        );
      }
    } else {
      if (!boardGameState.isFront && dragging.isPixel) {
        drawSquarePiece(
          ctxOverlay,
          mx,
          my,
          cellSizeDefalut,
          dragging.color,
          null
        );
      } else {
        drawEmptyDisc(ctxOverlay, cellSizeDefalut, dragging);
      }
    }

    ctxOverlay.restore();

    if (mx < 2 || my < 2 || mx > board.width || my > board.height) {
      showMessage("poza mapa");
      board.style.cursor = "default";
    } else {
      if (r >= 0 && r < cells && c >= 0 && c < cells) {
        const isLastRow = !isFront && r === backSizeRows;
        const isCodingDisc = !!dragging.isCodingDisc;
        if (
          !boardGameState.isFront &&
          r >= 0 &&
          r < cells - 3 &&
          c >= 0 &&
          c < cells - 3 &&
          !isLastRow &&
          isCodingDisc
        ) {
          showMessage(
            "Krążki do kodowania można dodać tylko w sekcjach k1, k2, k3 !"
          );
          board.style.cursor = "not-allowed";
        } else if (isOccupied(isFront, x, y, piecesFront, piecesGrid)) {
          showMessage("Nie można postawić");
          board.style.cursor = "not-allowed";
        } else if (
          boardGameState.dragging.isPixel &&
          isPixelAt(x, y, boardGameState.piecesGrid)
        ) {
          board.style.cursor = "not-allowed";
          showMessage("Nie można malować na już istniejącym pixelu!");
        } else {
          showMessage("");
          board.style.cursor = "default";
        }
      }
    }
  },
  onMouseLeave: (e) => {
    if (boardGameState.dragging) {
      ctxOverlay.clearRect(0, 0, boardOverlay.width, boardOverlay.height);
      if (boardGameState.isFront) {
        if (boardGameState.prevPiece) {
          boardGameState.piecesFront.push(boardGameState.prevPiece);
          renderBoard();
        }
      } else {
        if (boardGameState.prevPiece) {
          boardGameState.piecesGrid.push(boardGameState.prevPiece);
          renderBoard();
        }
      }
      boardGameState.dragging = null;
      boardGameState.prevPiece = null;
      showMessage("");
      renderBoard();
    }
  },
  onMouseUp: (e) => {
    if (boardGameState.dragging) {
      ctxOverlay.clearRect(0, 0, boardOverlay.width, boardOverlay.height);

      const { x, y } = getMousePos(e, board, boardGameState.cellSize);

      const isCodingDisc = !!boardGameState.dragging.isCodingDisc;
      const boardHeight = boardGameState.backSizeRows * boardGameState.cellSize;

      const codeStartY = boardGameState.isFront ? 0 : boardHeight + 70;
      const col = Math.floor(x / boardGameState.cellSize);
      const row = Math.floor((y - codeStartY) / boardGameState.cellSize);

      const isLockedCell =
        !boardGameState.isFront &&
        y >= codeStartY &&
        y < codeStartY + boardGameState.codeRows * boardGameState.cellSize &&
        col === 0 &&
        row === 0;

      if (isLockedCell) {
        showMessage("Nie można modyfikować tej komórki!");
        return;
      }
      // Jeśli kliknięto w główną planszę
      if (y >= 0 && y < boardHeight) {
        if (
          !isOccupied(
            boardGameState.isFront,
            x,
            y,
            boardGameState.piecesFront,
            boardGameState.piecesGrid
          )
        ) {
          if (boardGameState.dragging.isPixel) {
            if (isPixelAt(x, y, boardGameState.piecesGrid)) {
              showMessage("Nie można malować na już istniejącym pixelu!");
              return;
            }
          }
          if (!boardGameState.isFront && isCodingDisc) {
            showMessage(
              "Krążki do kodowania można dodać tylko w sekcjach k1, k2, k3 !"
            );
            return;
          }
          const pieceObj = {
            x,
            y,
            color: boardGameState.dragging.color,
            img: boardGameState.dragging.img,
            isCodingDisc: isCodingDisc,
            isPixel: !!boardGameState.dragging.isPixel,
          };

          if (boardGameState.isFront) {
            boardGameState.piecesFront.push(pieceObj);
          } else {
            boardGameState.piecesGrid.push(pieceObj);
          }
          boardGameState.dragging = null;
          boardGameState.prevPiece = null;
          showMessage("");
          renderBoard();
        }
      }
      // Jeśli kliknięto w pustą przestrzeń
      if (y >= boardHeight && y < codeStartY) {
        // Nie dodawaj krążka!
        return;
      }

      // Jeśli kliknięto w sekcję kodowania
      if (
        y >= codeStartY &&
        y < codeStartY + boardGameState.codeRows * boardGameState.cellSize
      ) {
        if (
          !isOccupied(
            boardGameState.isFront,
            x,
            y,
            boardGameState.piecesFront,
            boardGameState.piecesGrid
          )
        ) {
          if (boardGameState.dragging.isPixel) {
            if (isPixelAt(x, y, boardGameState.piecesGrid)) {
              showMessage("Nie można malować na już istniejącym pixelu!");
              return;
            }
          }
          const pieceObj = {
            x,
            y,
            color: boardGameState.dragging.color,
            img: boardGameState.dragging.img,
            isCodingDisc: isCodingDisc,
            isPixel: !!boardGameState.dragging.isPixel,
          };

          if (boardGameState.isFront) {
            boardGameState.piecesFront.push(pieceObj);
          } else {
            boardGameState.piecesGrid.push(pieceObj);
          }
          boardGameState.dragging = null;
          boardGameState.prevPiece = null;
          showMessage("");
          renderBoard();
        }
      }
    }
  },
  onMouseDown: (e) => {
    if (boardGameState.dragging) return;

    ctxOverlay.clearRect(0, 0, boardOverlay.width, boardOverlay.height);
    const cellSizeDefalut = boardGameState.cellSize;

    const { mx, my, x, y } = getMousePos(e, board, cellSizeDefalut);

    const idxTable = boardGameState.isFront
      ? boardGameState.piecesFront
      : boardGameState.piecesGrid;

    let idx = idxTable.findIndex(
      (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5 && !p.isPixel
    );
    if (idx === -1) {
      idx = idxTable.findIndex(
        (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5 && p.isPixel
      );
    }

    if (idx !== -1) {
      boardGameState.dragging = {
        color: idxTable[idx].color,
        img: idxTable[idx].img,
        x: mx,
        y: my,
        isCodingDisc: !!idxTable[idx].isCodingDisc,
        isPixel: !!idxTable[idx].isPixel,
      };

      boardGameState.prevPiece = { ...idxTable[idx] };

      boardGameState.isFront
        ? boardGameState.piecesFront.splice(idx, 1)
        : boardGameState.piecesGrid.splice(idx, 1);

      renderBoard();
    }
  },
  onContextMenu: (e) => {
    e.preventDefault();
    const { x, y } = getMousePos(e, board, boardGameState.cellSize);

    const idxTable = boardGameState.isFront
      ? boardGameState.piecesFront
      : boardGameState.piecesGrid;
    let idx = idxTable.findIndex(
      (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5 && !p.isPixel
    );
    if (idx === -1) {
      idx = idxTable.findIndex(
        (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5 && p.isPixel
      );
    }

    if (idx !== -1) {
      if (boardGameState.isFront) {
        boardGameState.piecesFront.splice(idx, 1);
      } else {
        boardGameState.piecesGrid.splice(idx, 1);
      }
      renderBoard();
    }
  },
};

const uiHandlers = {
  onClearBoard: () => {
    boardGameState.isFront
      ? (boardGameState.piecesFront.length = 0)
      : (boardGameState.piecesGrid.length = 0);
    renderBoard();
  },
  onFlipBoard: () => {
    boardGameState.isFront = !boardGameState.isFront;
    document.getElementById("gridSizeSelector").style.display =
      boardGameState.isFront ? "none" : "block";
    document.getElementById("downloadCoords").style.display =
      boardGameState.isFront ? "none" : "block";
    updateCanvasSize();
    drawPicker();
    renderBoard();
  },
  onGridSizeChange: (e) => {
    boardGameState.backSizeRows = parseInt(e.target.value, 10);
    boardGameState.isFront
      ? (boardGameState.piecesFront.length = 0)
      : (boardGameState.piecesGrid.length = 0);
    updateCanvasSize();
    renderBoard();
  },
  onDownloadBoardPdf: () => {
    drawPdfFile();
  },
  onDownloadCoords: () => {
    const coords = getCoordsList(
      boardGameState.backSizeRows,
      board,
      boardGameState.piecesGrid,
      boardGameState.codeMargin
    );
    if (coords.length === 0) {
      alert("Brak koordynatów do zapisania!");
      return;
    }
    drawPdfFile(coords);
  },
};

function initGame() {
  drawPicker();
  registerBoardEvents(board, boardHandlers);
  registerUIEvents(uiHandlers);
  renderBoard();
}

initGame();
