import {
  isOccupied,
  getImage,
  showMessage,
  getMousePos,
} from "./boardGameHelpers.js";
import { boardGameState } from "./boardGameState.js";
import { registerBoardEvents, registerUIEvents } from "./boardGameEvents.js";
import {
  drawCirclePiece,
  drawBoard,
  drawPicker,
  drawAxes,
  drawEmptyDisc,
} from "./boardGameDraw.js";

const gameMain = document.getElementById("gameMain");
gameMain.innerHTML = `
<div class="left" style="display: flex;margin-right: 40px; flex-direction: column; align-items: center; width: 20%">
  
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
          <button id="clearBoard">Wyczyść aktualną planszę</button>
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
              justify-content: center;
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
          </div>
        </div>
      </div>
      </div>
`;

const board = document.getElementById("board");
const ctxBoard = board.getContext("2d");

let cellSize = ctxBoard.canvas.width / boardGameState.cellSizeRows;
let cellGridSize = ctxBoard.canvas.width / boardGameState.gridSize;

function updateCanvasSize() {
  if (boardGameState.isFront) {
    board.width = 800;
    board.height = 800;
    cellSize = board.width / boardGameState.cellSizeRows;
  } else {
    const minCell = 70;
    const size = boardGameState.gridSize * minCell;
    board.width = size;
    board.height = size + 70;
    cellGridSize = board.width / boardGameState.gridSize;
  }
  drawAxes(board);
}

function renderBoard() {
  if (boardGameState.isFront) {
    drawBoard(ctxBoard, {
      isFront: boardGameState.isFront,
      cellSize: cellSize,
      gridSize: boardGameState.cellSizeRows,
      pieces: boardGameState.piecesFront,
    });
  } else {
    drawBoard(ctxBoard, {
      isFront: boardGameState.isFront,
      cellSize: cellGridSize,
      gridSize: boardGameState.gridSize,
      pieces: boardGameState.piecesGrid,
    });
  }
}

function drawImage(ctxBoard, img, size, x, y) {
  drawCirclePiece(ctxBoard, x, y, size, boardGameState.dragging.color, img);
  // boardGameState.isFront
  //   ? drawCirclePiece(ctxBoard, x, y, size, boardGameState.dragging.color, img)
  //   : ctxBoard.drawImage(
  //       img,
  //       x - size * 0.4,
  //       y - size * 0.4,
  //       size * 0.8,
  //       size * 0.8
  //     );
}

const boardHandlers = {
  onMouseMove: (e) => {
    if (!boardGameState.dragging) return;
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

    renderBoard();

    const cells = isFront ? cellSizeRows : gridSize + 1;

    if (dragging.img) {
      const img = loadedImages[dragging.img];
      if (img) {
        drawImage(ctxBoard, img, cellSizeDefalut, mx, my);
      } else {
        getImage(dragging.img, (imgLoaded) => {
          loadedImages[dragging.img] = imgLoaded;
          renderBoard();
        });
        drawImage(ctxBoard, img, cellSizeDefalut, mx, my);
      }
    } else {
      drawEmptyDisc(ctxBoard, cellSizeDefalut, dragging);
    }

    if (mx < 2 || my < 2 || mx > board.width || my > board.height) {
      showMessage("poza mapa");
      board.style.cursor = "default";
    } else {
      if (r >= 0 && r < cells && c >= 0 && c < cells) {
        const isLastRow = !isFront && r === gridSize;
        const isCodingDisc = !!dragging.isCodingDisc;
        if (isLastRow && !isCodingDisc) {
          showMessage(
            "Tylko krążki do kodowania można dodać w ostatnim wierszu!"
          );
          board.style.cursor = "not-allowed";
        } else if (isOccupied(isFront, x, y, piecesFront, piecesGrid)) {
          showMessage("nie można postawić");
          board.style.cursor = "not-allowed";
        } else {
          showMessage("");
          board.style.cursor = "default";
        }
      }
    }
  },
  onMouseLeave: (e) => {
    if (boardGameState.dragging) {
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
      const cellSizeDefalut = boardGameState.isFront ? cellSize : cellGridSize;

      const { c, r, x, y } = getMousePos(e, board, cellSizeDefalut);

      const cells = boardGameState.isFront
        ? boardGameState.cellSizeRows
        : boardGameState.gridSize + 1;

      const isLastRow = r === boardGameState.gridSize;
      const isCodingDisc = !!boardGameState.dragging.isCodingDisc;

      if (r >= 0 && r < cells && c >= 0 && c < cells) {
        if (
          !isOccupied(
            boardGameState.isFront,
            x,
            y,
            boardGameState.piecesFront,
            boardGameState.piecesGrid
          )
        ) {
          if (isLastRow && !isCodingDisc) {
            showMessage(
              "Tylko krążki do kodowania można dodać w ostatnim wierszu!"
            );
            return;
          }

          const pieceObj = {
            x,
            y,
            color: boardGameState.dragging.color,
            img: boardGameState.dragging.img,
            isCodingDisc: isCodingDisc,
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
        } else {
          showMessage("nie można postawić");
          return;
        }
      }
    }
  },
  onMouseDown: (e) => {
    if (boardGameState.dragging) return;

    const cellSizeDefalut = boardGameState.isFront ? cellSize : cellGridSize;

    const { mx, my, x, y } = getMousePos(e, board, cellSizeDefalut);

    const idxTable = boardGameState.isFront
      ? boardGameState.piecesFront
      : boardGameState.piecesGrid;

    const idx = idxTable.findIndex(
      (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5
    );

    if (idx !== -1) {
      boardGameState.dragging = {
        color: idxTable[idx].color,
        img: idxTable[idx].img,
        x: mx,
        y: my,
        isCodingDisc: !!idxTable[idx].isCodingDisc,
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

    let idx = boardGameState.isFront
      ? boardGameState.piecesFront.findIndex(
          (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5
        )
      : boardGameState.piecesGrid.findIndex(
          (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5
        );

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
};

function initGame() {
  drawPicker();
  //drawPalette();
  registerBoardEvents(board, boardHandlers);
  registerUIEvents(uiHandlers);
  renderBoard();
}

initGame();
