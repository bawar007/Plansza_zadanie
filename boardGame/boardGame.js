import {
  isOccupied,
  getImage,
  showMessage,
  getMousePos,
  isPixelAt,
} from "./boardGameHelpers.js";
import { boardGameState } from "./boardGameState.js";
import { registerBoardEvents, registerUIEvents } from "./boardGameEvents.js";
import {
  drawCirclePiece,
  drawSquarePiece,
  drawBoard,
  drawPicker,
  drawAxes,
  drawEmptyDisc,
  drawCell,
  drawPdfFile,
} from "./boardGameDraw.js";
import { blockColors } from "./boardGameData.js";

const gameMain = document.getElementById("gameMain");
gameMain.innerHTML = `
<div class="left" style="display: flex;margin-right: 40px; flex-direction: column; align-items: center; width: 20%;     position: sticky;
    top: 20px;">
 <div id="picker"></div>
   <div
          class="buttonsContainer"
          style="
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-evenly;
            width: 100%;
          "
        >
          <button id="flipBoard">Obróć matę</button>
          <button id="downloadBoardPdf">Pobierz jako PDF</button>
          <button id="clearBoard">Wyczyść aktualną stronę</button>
          <select
            id="gridSizeSelector"
            style="margin: 10px; font-size: 16px; display: none"
          >
            <option value="10">10 x 10</option>
            <option value="12">12 x 12</option>
            <option value="14">14 x 14</option>
            <option value="16">16 x 16</option>
            <option value="18">18 x 18</option>
            <option value="20">20 x 20</option>
          </select>
        </div>
<div id="message" style="color: red; height: 24px; margin: 10px"></div>
</div>
 
      <div
        class="center"
        style="
          display: flex;
          flex-direction: column;
          align-items: center;
        "
      >
        <div id="boardWrapper">
          <div
            id="yAxis"
            style="
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              margin-right: 2px;
              position: absolute;
              left: -25px;
              top: 0px;
            "
          ></div>
          <div>
            <div
              id="xAxis"
              style="
                display: flex;
                justify-content: center;
                margin-bottom: 2px;
                position: absolute;
                top: -20px;
                left: 0px;
              "
            ></div>
            <canvas id="board" width="800" height="800"></canvas>
              <canvas id="boardOverlay" width="800" height="800" style="position: absolute; left: 0; top: 0; z-index: 2; pointer-events: none;"></canvas>
          </div>
        </div>
      </div>
      </div>
`;

const board = document.getElementById("board");
const ctxBoard = board.getContext("2d");

const boardOverlay = document.getElementById("boardOverlay");
const ctxOverlay = boardOverlay.getContext("2d");

let cellSize = ctxBoard.canvas.width / boardGameState.cellSizeRows;
let cellGridSize = ctxBoard.canvas.width / boardGameState.gridSize;

function updateCanvasSize() {
  if (boardGameState.isFront) {
    board.width = 800;
    board.height = 800;
    boardOverlay.width = 800;
    boardOverlay.height = 800;
    cellSize = board.width / boardGameState.cellSizeRows;
  } else {
    const minCell = 70;
    const size = boardGameState.gridSize * minCell;
    board.width = size;
    boardOverlay.width = size;
    board.height = size;
    boardOverlay.height = size;
    cellGridSize = board.width / boardGameState.gridSize;
  }
  drawAxes(board, cellSize);
}

function renderBoard() {
  if (boardGameState.isFront) {
    drawBoard(ctxOverlay, ctxBoard, {
      isFront: boardGameState.isFront,
      cellSize: cellSize,
      gridSize: boardGameState.cellSizeRows,
      pieces: boardGameState.piecesFront,
    });
  } else {
    drawBoard(ctxOverlay, ctxBoard, {
      isFront: boardGameState.isFront,
      cellSize: cellGridSize,
      gridSize: boardGameState.gridSize,
      pieces: boardGameState.piecesGrid,
    });
  }
}

function drawImage(ctxBoard, img, size, x, y) {
  drawCirclePiece(ctxBoard, x, y, size, boardGameState.dragging.color, img);
}

const boardHandlers = {
  onMouseMove: (e) => {
    if (!boardGameState.dragging) {
      ctxOverlay.clearRect(0, 0, boardOverlay.width, boardOverlay.height);
      return;
    }
    const cellSizeDefalut = boardGameState.isFront ? cellSize : cellGridSize;
    const { mx, my, c, r, x, y } = getMousePos(e, board, cellSizeDefalut);
    const {
      dragging,
      cellSizeRows,
      gridSize,
      isFront,
      loadedImages,
      piecesFront,
      piecesGrid,
    } = boardGameState;
    dragging.x = mx;
    dragging.y = my;

    ctxOverlay.clearRect(0, 0, boardOverlay.width, boardOverlay.height);

    ctxOverlay.save();

    const cells = isFront ? cellSizeRows : gridSize + 1;

    if (!boardGameState.isFront) {
      const codeRows = 3;
      const codeMargin = 70;
      const boardHeight = boardGameState.gridSize * cellGridSize;
      const codeStartY = boardHeight + codeMargin;

      const col = Math.floor(x / cellSizeDefalut);
      const row = Math.floor((y - codeStartY) / cellSizeDefalut);

      const isLockedCell =
        !boardGameState.isFront &&
        y >= codeStartY &&
        y < codeStartY + codeRows * cellSizeDefalut &&
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
        drawImage(ctxOverlay, img, cellSizeDefalut, mx, my);
      } else {
        getImage(dragging.img, (imgLoaded) => {
          loadedImages[dragging.img] = imgLoaded;
          renderBoard();
        });
        drawImage(ctxOverlay, img, cellSizeDefalut, mx, my);
      }
    } else {
      if (!boardGameState.isFront && dragging.isPixel) {
        const size = cellSizeDefalut;
        drawSquarePiece(ctxOverlay, mx, my, size, dragging.color, null);
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
        const isLastRow = !isFront && r === gridSize;
        const isCodingDisc = !!dragging.isCodingDisc;
        if (!boardGameState.isFront && !isLastRow && isCodingDisc) {
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
      const cellSizeDefalut = boardGameState.isFront ? cellSize : cellGridSize;

      const { x, y } = getMousePos(e, board, cellSizeDefalut);

      const isCodingDisc = !!boardGameState.dragging.isCodingDisc;
      const boardHeight = boardGameState.gridSize * cellGridSize;
      const codeRows = 3;
      const codeStartY = boardGameState.isFront ? 0 : boardHeight + 70;
      const col = Math.floor(x / cellSize);
      const row = Math.floor((y - codeStartY) / cellSize);

      const isLockedCell =
        !boardGameState.isFront &&
        y >= codeStartY &&
        y < codeStartY + codeRows * cellSize &&
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
      if (y >= codeStartY && y < codeStartY + codeRows * cellSize) {
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
    const cellSizeDefalut = boardGameState.isFront ? cellSize : cellGridSize;

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

    let cellSizeDefalut = boardGameState.isFront ? cellSize : cellGridSize;
    const { x, y } = getMousePos(e, board, cellSizeDefalut);

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
    updateCanvasSize();
    drawPicker();
    renderBoard();
  },
  onGridSizeChange: (e) => {
    boardGameState.gridSize = parseInt(e.target.value, 10);
    boardGameState.isFront
      ? (boardGameState.piecesFront.length = 0)
      : (boardGameState.piecesGrid.length = 0);
    updateCanvasSize();
    renderBoard();
  },
  onDownloadBoardPdf: () => {
    drawPdfFile();
  },
};

function initGame() {
  drawPicker();
  //drawPalette();
  registerBoardEvents(board, boardHandlers);
  registerUIEvents(uiHandlers);
  renderBoard();
}

initGame();
