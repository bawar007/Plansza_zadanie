import {
  isOccupied,
  getImage,
  showMessage,
  getMousePos,
  getCoordsList,
  addPixelAt,
  getTouchPos,
} from "./boardGameHelpers.js";
import { boardGameState } from "./boardGameState.js";
import {
  registerBoardMouseEvents,
  registerBoardTouchEvents,
  registerBoardWrapperEvents,
  registerUIEvents,
  registerWindowMouseEvents,
} from "./boardGameEvents.js";
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
    <button id="switchBoard">Mata 50x50</button>
    <button id="flipBoard">Obróć matę</button>
    <button id="clearBoard">Wyczyść stronę</button>
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

const boardWrapper = document.getElementById("boardWrapper");

const boardOverlay = document.getElementById("boardOverlay");
const ctxOverlay = boardOverlay.getContext("2d");

function updateCanvasSize() {
  // Ustawmy najpierw cellSize w zależności od trybu
  if (boardGameState.isBoard50x50) {
    boardGameState.cellSize = 100;
    // 50x50 ma sekcję kodu – zastosuj margines jak na back
    boardGameState.codeMargin = 100;
    // Dodaj klasę CSS dla wrapper
    boardWrapper.className = "board50x50";
    boardOverlay.style.left = "140px";
    boardOverlay.style.top = "140px";
  } else {
    boardGameState.cellSize = 80;
    // Usuń klasę CSS dla wrapper
    boardWrapper.className = "";
    boardOverlay.style.left = "40px";
    boardOverlay.style.top = "40px";
    if (boardGameState.isFront) {
      boardGameState.codeMargin = 0;
    } else {
      boardGameState.codeMargin = 80;
    }
  }

  // Oblicz rozmiary z prawidłową wartością cellSize
  let boardWidth, boardHeight;

  if (boardGameState.isBoard50x50) {
    boardWidth = 5 * boardGameState.cellSize;
    boardHeight =
      boardGameState.codeMargin +
      5 * boardGameState.cellSize +
      boardGameState.codeRows * boardGameState.cellSize;
  } else if (boardGameState.isFront) {
    boardWidth = boardGameState.frontSizeRows * boardGameState.cellSize;
    boardHeight = boardGameState.frontSizeRows * boardGameState.cellSize;
  } else {
    boardWidth = boardGameState.backSizeRows * boardGameState.cellSize;
    boardHeight =
      boardGameState.codeMargin +
      boardGameState.backSizeRows * boardGameState.cellSize +
      boardGameState.codeRows * boardGameState.cellSize;
  }

  board.width = boardWidth;
  board.height = boardHeight;
  boardOverlay.width = boardWidth;
  boardOverlay.height = boardHeight;

  drawLabels(boardHeight, boardWidth);
}

function renderBoard() {
  if (boardGameState.isBoard50x50) {
    drawBoard(ctxOverlay, ctxBoard, {
      isFront: false,
      pieces: boardGameState.pieces50x50,
      codeRows: boardGameState.codeRows,
      boardRows: 5,
      boardWidth: 5 * boardGameState.cellSize,
      boardHeight:
        boardGameState.codeMargin +
        5 * boardGameState.cellSize +
        boardGameState.codeRows * boardGameState.cellSize,
    });
    board.style.border = "none";
    boardWrapper.style.alignItems = "flex-start";
  } else {
    if (boardGameState.isFront) {
      drawBoard(ctxOverlay, ctxBoard, {
        isFront: boardGameState.isFront,
        pieces: boardGameState.piecesFront,
        codeRows: 0,
        boardRows: boardGameState.frontSizeRows,
        boardWidth: boardGameState.frontSizeRows * boardGameState.cellSize,
        boardHeight: boardGameState.frontSizeRows * boardGameState.cellSize,
      });
      board.style.border = "2px solid #000";
      boardWrapper.style.alignItems = "center";
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
      board.style.border = "none";
      boardWrapper.style.alignItems = "flex-start";
    }
  }
}

// Obsługa dotyku dla mobilnych
let isDraggingBoard = false;
let dragStartX = 0;
let scrollStartX = 0;
let isTouchDraggingBoard = false;
let touchStartX = 0;
let touchStartY = 0;
let touchScrollStartX = 0;
let touchScrollStartY = 0;
let isTouchErasing = false;
let touchDraggingPiece = null;
let touchTimer = null;

const boardMouseHandlers = {
  onMouseMove: (e) => {
    const cellSizeDefalut = boardGameState.cellSize;
    const { mx, my, c, r, x, y } = getMousePos(e, board, cellSizeDefalut);

    // Gumka: usuwanie elementów podczas przesuwania myszy
    if (boardGameState.isErasing) {
      // Mousemove: gumka usuwa tylko piksele, niezależnie od trybu
      let idxTable = boardGameState.isBoard50x50
        ? boardGameState.pieces50x50
        : boardGameState.isFront
        ? boardGameState.piecesFront
        : boardGameState.piecesGrid;
      const idx = idxTable.findIndex(
        (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5 && p.isPixel
      );
      if (idx !== -1) {
        idxTable.splice(idx, 1);
        renderBoard();
      }
      return;
    }
    // Jeśli jesteśmy w trybie malowania pikseli
    if (
      boardGameState.isPainting &&
      boardGameState.paintColor &&
      (!boardGameState.isFront || boardGameState.isBoard50x50)
    ) {
      if (
        addPixelAt(
          x,
          y,
          boardGameState.paintColor,
          boardGameState.isFront,
          boardGameState.piecesFront,
          boardGameState.piecesGrid,
          boardGameState.pieces50x50,
          boardGameState.isBoard50x50
        )
      ) {
        renderBoard();
      }
      return;
    }

    if (!boardGameState.dragging) {
      ctxOverlay.clearRect(0, 0, boardOverlay.width, boardOverlay.height);
      return;
    }

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

    // Podgląd gumki
    if (dragging.isEraser) {
      boardGameState.isFront && !boardGameState.isBoard50x50
        ? drawCirclePiece(
            ctxOverlay,
            mx,
            my,
            cellSizeDefalut,
            "#eee",
            dragging.img
          )
        : drawSquarePiece(
            ctxOverlay,
            mx,
            my,
            cellSizeDefalut,
            "#eee",
            dragging.img
          );
      ctxOverlay.restore();
      return;
    }

    const cells = boardGameState.isBoard50x50
      ? 9
      : isFront
      ? frontSizeRows
      : backSizeRows + 4;

    // Sprawdź różne warunki blokowania
    let isBlocked = false;
    let blockMessage = "";

    // Sprawdź czy to zablokowana komórka (tylko na tylnej stronie)
    if (!boardGameState.isFront || boardGameState.isBoard50x50) {
      // Poprawne wymiary obszarów dla 50x50 i back
      const boardHeight = boardGameState.isBoard50x50
        ? 5 * boardGameState.cellSize
        : boardGameState.backSizeRows * boardGameState.cellSize;

      const codeStartY =
        boardHeight +
        (boardGameState.isBoard50x50
          ? boardGameState.codeMargin
          : boardGameState.codeMargin);

      const col = Math.floor(x / cellSizeDefalut);
      const row = Math.floor((y - codeStartY) / cellSizeDefalut);

      const isLockedCell =
        (!boardGameState.isFront || boardGameState.isBoard50x50) &&
        y >= codeStartY &&
        y < codeStartY + boardGameState.codeRows * cellSizeDefalut &&
        col === 0 &&
        row === 0;

      if (isLockedCell) {
        isBlocked = true;
        blockMessage = "Nie można modyfikować tej komórki!";
      }
    }

    // Sprawdź czy miejsce jest zajęte przez krążek (ale nie podczas malowania pikseli)
    if (
      !isBlocked &&
      (!dragging.isPixel ||
        boardGameState.isFront ||
        boardGameState.isBoard50x50)
    ) {
      const isOccupiedSpot = isOccupied(
        boardGameState.isBoard50x50,
        boardGameState.isFront,
        x,
        y,
        boardGameState.piecesFront,
        boardGameState.piecesGrid,
        boardGameState.pieces50x50
      );

      if (isOccupiedSpot) {
        isBlocked = true;
        blockMessage = "To miejsce jest zajęte!";
      }
    }

    // Ustaw kursor i komunikat na podstawie wyniku
    if (isBlocked) {
      showMessage(blockMessage);
      board.style.cursor = "not-allowed";
    } else {
      showMessage("");
      board.style.cursor = "default";
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
      if (
        (!boardGameState.isFront || boardGameState.isBoard50x50) &&
        dragging.isPixel
      ) {
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
        const isLastRow =
          (!isFront || boardGameState.isBoard50x50) && r === backSizeRows;
        const isCodingDisc = !!dragging.isCodingDisc;
        if (
          (!boardGameState.isFront || boardGameState.isBoard50x50) &&
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
        } else if (
          isOccupied(
            boardGameState.isBoard50x50,
            isFront,
            x,
            y,
            piecesFront,
            piecesGrid,
            boardGameState.pieces50x50
          )
        ) {
          showMessage("Nie można postawić");
          board.style.cursor = "not-allowed";
        } else if (
          (!boardGameState.isFront || boardGameState.isBoard50x50) &&
          boardGameState.dragging.isPixel
        ) {
          board.style.cursor = "crosshair";
        } else {
          showMessage("");
          board.style.cursor = "default";
        }
      }
    }
  },
  onMouseLeave: (e) => {
    if (boardGameState.isPainting) {
      boardGameState.isPainting = false;
      boardGameState.paintColor = null;
      board.style.cursor = "default";
      showMessage("");
    }
    if (boardGameState.isErasing) {
      boardGameState.isErasing = false;
      boardGameState.dragging = null;
      board.style.cursor = "default";
      showMessage("");
    }
    if (boardGameState.dragging) {
      ctxOverlay.clearRect(0, 0, boardOverlay.width, boardOverlay.height);
      if (boardGameState.isBoard50x50) {
        if (boardGameState.prevPiece) {
          boardGameState.pieces50x50.push(boardGameState.prevPiece);
        }
      } else {
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
      }
      boardGameState.dragging = null;
      boardGameState.prevPiece = null;
      showMessage("");
      renderBoard();
    }
    board.style.cursor = "default";
  },
  onMouseUp: (e) => {
    if (e.button !== 0) return;

    // Jeśli byliśmy w trybie malowania, zakończ malowanie
    if (boardGameState.isPainting) {
      boardGameState.paintColor = null;
      return;
    }

    if (boardGameState.dragging) {
      ctxOverlay.clearRect(0, 0, boardOverlay.width, boardOverlay.height);

      const { x, y } = getMousePos(e, board, boardGameState.cellSize);

      if (boardGameState.dragging.isEraser) {
        if (boardGameState.isErasing) {
          // Mouseup: najpierw usuń krążek, jeśli jest, potem piksel (dowolna mata)
          let idxTable = boardGameState.isBoard50x50
            ? boardGameState.pieces50x50
            : boardGameState.isFront
            ? boardGameState.piecesFront
            : boardGameState.piecesGrid;
          // Najpierw krążek (nie-piksel)
          let idxDisc = idxTable.findIndex(
            (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5 && !p.isPixel
          );
          if (idxDisc !== -1) {
            idxTable.splice(idxDisc, 1);
            boardGameState.isErasing = false;
            showMessage("");
            renderBoard();
            return;
          }
          // Jeśli nie ma krążka, usuń piksel
          let idxPixel = idxTable.findIndex(
            (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5 && p.isPixel
          );
          if (idxPixel !== -1) {
            idxTable.splice(idxPixel, 1);
            boardGameState.isErasing = false;
            showMessage("");
            renderBoard();
            return;
          }
          boardGameState.isErasing = false;
          showMessage("");
          renderBoard();
          return;
        }
      }

      const isCodingDisc = !!boardGameState.dragging.isCodingDisc;
      // Poprawne wymiary obszarów dla 50x50 i back
      const boardHeight = boardGameState.isBoard50x50
        ? 5 * boardGameState.cellSize
        : boardGameState.backSizeRows * boardGameState.cellSize;

      const codeStartY =
        boardGameState.isFront && !boardGameState.isBoard50x50
          ? 0
          : boardHeight + boardGameState.codeMargin;
      const col = Math.floor(x / boardGameState.cellSize);
      const row = Math.floor((y - codeStartY) / boardGameState.cellSize);

      const isLockedCell =
        (!boardGameState.isFront || boardGameState.isBoard50x50) &&
        y >= codeStartY &&
        y < codeStartY + boardGameState.codeRows * boardGameState.cellSize &&
        col === 0 &&
        row === 0;

      if (isLockedCell) {
        showMessage("Nie można modyfikować tej komórki!");
        return;
      }
      // Blokuj pustą przestrzeń między planszą a sekcją kodu (back i 50x50)
      if (
        !boardGameState.isFront &&
        y >= boardHeight &&
        y < boardHeight + boardGameState.codeMargin
      ) {
        // pusta przestrzeń — nic nie dodawaj
        return;
      }

      // Jeśli kliknięto w główną planszę
      if (y >= 0 && y < boardHeight) {
        const isOccupiedSpot = isOccupied(
          boardGameState.isBoard50x50,
          boardGameState.isFront,
          x,
          y,
          boardGameState.piecesFront,
          boardGameState.piecesGrid,
          boardGameState.pieces50x50
        );

        if (isOccupiedSpot) {
          return;
        }

        if (
          (!boardGameState.isFront || boardGameState.isBoard50x50) &&
          isCodingDisc
        ) {
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

        if (boardGameState.isBoard50x50) {
          boardGameState.pieces50x50.push(pieceObj);
          if (!boardGameState.dragging.isPixel) {
            boardGameState.dragging = null;
            boardGameState.prevPiece = null;
          }
        } else {
          if (boardGameState.isFront) {
            boardGameState.piecesFront.push(pieceObj);
            boardGameState.dragging = null;
            boardGameState.prevPiece = null;
          } else {
            boardGameState.piecesGrid.push(pieceObj);
            if (!boardGameState.dragging.isPixel) {
              boardGameState.dragging = null;
              boardGameState.prevPiece = null;
            }
          }
        }
        showMessage("");
        renderBoard();
      }
      // Jeśli kliknięto w pustą przestrzeń
      if (y >= boardHeight && y < codeStartY) {
        return;
      }

      // Jeśli kliknięto w sekcję kodowania
      if (
        y >= codeStartY &&
        y < codeStartY + boardGameState.codeRows * boardGameState.cellSize
      ) {
        const isOccupiedSpot = isOccupied(
          boardGameState.isBoard50x50,
          boardGameState.isFront,
          x,
          y,
          boardGameState.piecesFront,
          boardGameState.piecesGrid,
          boardGameState.pieces50x50
        );

        if (isOccupiedSpot) {
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
        if (boardGameState.isBoard50x50) {
          boardGameState.pieces50x50.push(pieceObj);
          if (!boardGameState.dragging.isPixel) {
            boardGameState.dragging = null;
            boardGameState.prevPiece = null;
          }
        } else {
          if (boardGameState.isFront) {
            boardGameState.piecesFront.push(pieceObj);
            boardGameState.dragging = null;
            boardGameState.prevPiece = null;
          } else {
            boardGameState.piecesGrid.push(pieceObj);
            if (!boardGameState.dragging.isPixel) {
              boardGameState.dragging = null;
              boardGameState.prevPiece = null;
            }
          }
        }
        showMessage("");
        renderBoard();
      }
    }
  },
  onMouseDown: (e) => {
    // Sprawdź czy mamy wybraną gumkę (tylko na tylnej stronie)
    if (boardGameState.dragging && boardGameState.dragging.isEraser) {
      boardGameState.isErasing = true;
      showMessage("Tryb gumki aktywny");
      return;
    }
    if (boardGameState.isErasing) {
      boardGameState.isErasing = false;
      boardGameState.dragging = null;
      showMessage("");
      return;
    }
    if (e.button !== 0) {
      boardGameState.dragging = null;
      boardGameState.prevPiece = null;
      boardGameState.paintColor = null;
      board.style.cursor = "default";
      showMessage("");
      return;
    }

    ctxOverlay.clearRect(0, 0, boardOverlay.width, boardOverlay.height);
    const cellSizeDefalut = boardGameState.cellSize;

    const { mx, my, x, y } = getMousePos(e, board, cellSizeDefalut);

    // Sprawdź czy mamy wybrany piksel do malowania
    if (
      (!boardGameState.isFront || boardGameState.isBoard50x50) &&
      boardGameState.dragging &&
      boardGameState.dragging.isPixel
    ) {
      // Rozpocznij malowanie - nie szukaj elementów do przeciągnięcia
      boardGameState.isPainting = true;
      boardGameState.paintColor = boardGameState.dragging.color;

      // Dodaj pierwszy piksel
      addPixelAt(
        x,
        y,
        boardGameState.paintColor,
        boardGameState.isFront,
        boardGameState.piecesFront,
        boardGameState.piecesGrid,
        boardGameState.pieces50x50,
        boardGameState.isBoard50x50
      );
      renderBoard();

      return;
    }

    // Jeśli już trzymamy krążek, nie szukaj nowych elementów do przeciągnięcia
    if (boardGameState.dragging) {
      if (!boardGameState.isFront || boardGameState.isBoard50x50) {
        if (!boardGameState.dragging.isPixel) return;
      } else {
        return;
      }
    }

    const idxTable = boardGameState.isBoard50x50
      ? boardGameState.pieces50x50
      : boardGameState.isFront
      ? boardGameState.piecesFront
      : boardGameState.piecesGrid;

    // Na przedniej stronie szukaj wszystkich elementów (krążki + piksele)
    // Na tylnej stronie szukaj tylko krążków (piksele są do malowania)
    let idx = idxTable.findIndex(
      (p) =>
        Math.abs(p.x - x) < 5 &&
        Math.abs(p.y - y) < 5 &&
        (boardGameState.isFront && !boardGameState.isBoard50x50
          ? true
          : !p.isPixel)
    );

    if (idx !== -1) {
      // Znaleziono krążek do przeciągnięcia
      boardGameState.dragging = {
        color: idxTable[idx].color,
        img: idxTable[idx].img,
        x: mx,
        y: my,
        isCodingDisc: !!idxTable[idx].isCodingDisc,
        isPixel: !!idxTable[idx].isPixel,
      };

      boardGameState.prevPiece = { ...idxTable[idx] };

      boardGameState.isBoard50x50
        ? boardGameState.pieces50x50.splice(idx, 1)
        : boardGameState.isFront
        ? boardGameState.piecesFront.splice(idx, 1)
        : boardGameState.piecesGrid.splice(idx, 1);

      renderBoard();
    }
  },
  onContextMenu: (e) => {
    e.preventDefault();
    if (boardGameState.isPainting) {
      boardGameState.isPainting = false;
      boardGameState.paintColor = null;
      board.style.cursor = "default";
      showMessage("");
      return;
    }
    if (boardGameState.isErasing) {
      boardGameState.isErasing = false;
      boardGameState.dragging = null;
      board.style.cursor = "default";
      showMessage("");
      return;
    }

    const { x, y } = getMousePos(e, board, boardGameState.cellSize);
    if (!boardGameState.dragging) {
      const idxTable = boardGameState.isBoard50x50
        ? boardGameState.pieces50x50
        : boardGameState.isFront
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
        if (boardGameState.isBoard50x50) {
          boardGameState.pieces50x50.splice(idx, 1);
        } else if (boardGameState.isFront) {
          boardGameState.piecesFront.splice(idx, 1);
        } else {
          boardGameState.piecesGrid.splice(idx, 1);
        }
        board.style.cursor = "default";
        renderBoard();
      }
    } else {
      boardGameState.dragging = null;
      boardGameState.prevPiece = null;
      board.style.cursor = "default";
      showMessage("");
      renderBoard();
      return;
    }
  },
};

const uiHandlers = {
  onClearBoard: () => {
    boardGameState.isBoard50x50
      ? (boardGameState.pieces50x50.length = 0)
      : boardGameState.isFront
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
  onSwitchBoard: () => {
    if (boardGameState.isBoard50x50) {
      boardGameState.isBoard50x50 = false;
      if (!boardGameState.isFront) {
        document.getElementById("gridSizeSelector").style.display = "block";
        document.getElementById("downloadCoords").style.display = "block";
      }

      document.getElementById("flipBoard").style.display = "block";
      document.getElementById("switchBoard").innerText = "Mata 50x50";
    } else {
      boardGameState.isBoard50x50 = true;
      document.getElementById("gridSizeSelector").style.display = "none";
      document.getElementById("downloadCoords").style.display = "none";
      document.getElementById("flipBoard").style.display = "none";
      document.getElementById("switchBoard").innerText =
        "Mata kodowanie na dywanie";
    }
    updateCanvasSize();
    drawPicker();
    renderBoard();
  },
};

const windowMouseHandlers = {
  onMouseMove: (e) => {
    if (!isDraggingBoard || boardGameState.dragging) return;
    const dx = dragStartX - e.clientX;
    boardWrapper.scrollLeft = scrollStartX + dx;
  },
  onMouseUp: (e) => {
    if (isDraggingBoard) {
      isDraggingBoard = false;
      boardWrapper.style.cursor = "default";
    }
  },
};

const boardTouchHandlers = {
  onTouchStart: (e) => {
    if (e.touches.length !== 1) return;
    // Sprawdź czy dotyk jest na elemencie do przeciągnięcia
    const { x, y } = getTouchPos(e, board, boardGameState.cellSize);
    let idxTable = boardGameState.isFront
      ? boardGameState.piecesFront
      : boardGameState.piecesGrid;
    let idx = idxTable.findIndex(
      (p) =>
        Math.abs(p.x - x) < 5 &&
        Math.abs(p.y - y) < 5 &&
        (boardGameState.isFront || !p.isPixel)
    );
    if (idx !== -1) {
      touchDraggingPiece = {
        ...idxTable[idx],
        prevX: idxTable[idx].x,
        prevY: idxTable[idx].y,
      };
      idxTable.splice(idx, 1);
    } else {
      touchDraggingPiece = null;
    }
    touchTimer = setTimeout(() => {
      // Long tap: aktywuj gumkę
      isTouchErasing = true;
      showMessage("Tryb gumki aktywny (dotyk)");
    }, 500);
  },
  onTouchMove: (e) => {
    if (touchTimer) {
      clearTimeout(touchTimer);
      touchTimer = null;
    }
    const { x, y } = getTouchPos(e, board, boardGameState.cellSize);
    if (isTouchErasing) {
      // Gumka (dotyk)
      if (boardGameState.isFront && !boardGameState.isBoard50x50) {
        // Front: usuń dowolny element z piecesFront
        let idx = boardGameState.piecesFront.findIndex(
          (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5
        );
        if (idx !== -1) {
          boardGameState.piecesFront.splice(idx, 1);
          renderBoard();
        }
      } else if (boardGameState.isBoard50x50) {
        // 50x50: usuń piksel
        let idx = boardGameState.pieces50x50.findIndex(
          (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5 && p.isPixel
        );
        if (idx !== -1) {
          boardGameState.pieces50x50.splice(idx, 1);
          renderBoard();
        }
      } else {
        // Back: usuń piksel
        let idx = boardGameState.piecesGrid.findIndex(
          (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5 && p.isPixel
        );
        if (idx !== -1) {
          boardGameState.piecesGrid.splice(idx, 1);
          renderBoard();
        }
      }
      e.preventDefault();
      return;
    }
    if (touchDraggingPiece) {
      // Przeciąganie krążka/piksela
      touchDraggingPiece.x = x;
      touchDraggingPiece.y = y;
      ctxOverlay.clearRect(0, 0, boardOverlay.width, boardOverlay.height);
      if (touchDraggingPiece.img) {
        const img = boardGameState.loadedImages[touchDraggingPiece.img];
        drawCirclePiece(
          ctxOverlay,
          x,
          y,
          boardGameState.cellSize,
          touchDraggingPiece.color,
          img
        );
      } else if (touchDraggingPiece.isPixel) {
        drawSquarePiece(
          ctxOverlay,
          x,
          y,
          boardGameState.cellSize,
          touchDraggingPiece.color,
          null
        );
      } else {
        drawEmptyDisc(ctxOverlay, boardGameState.cellSize, touchDraggingPiece);
      }
      e.preventDefault();
      return;
    }
    // Malowanie pikseli (dotyk)
    if (!boardGameState.isFront && boardGameState.paintColor) {
      if (
        addPixelAt(
          x,
          y,
          boardGameState.paintColor,
          boardGameState.isFront,
          boardGameState.piecesFront,
          boardGameState.piecesGrid,
          boardGameState.pieces50x50,
          boardGameState.isBoard50x50
        )
      ) {
        renderBoard();
      }
      e.preventDefault();
      return;
    }
  },
  onTouchEnd: (e) => {
    if (touchTimer) {
      clearTimeout(touchTimer);
      touchTimer = null;
    }
    if (isTouchErasing) {
      isTouchErasing = false;
      showMessage("");
    }
    if (touchDraggingPiece) {
      // Przypisz do najbliższego pola (snap do siatki) z uwzględnieniem scrolla
      const { x, y } = getTouchPos(e, board, boardGameState.cellSize);
      let idxTable = boardGameState.isFront
        ? boardGameState.piecesFront
        : boardGameState.piecesGrid;
      // Oblicz najbliższe pole
      const cellSize = boardGameState.cellSize;
      const col = Math.floor(x / boardGameState.cellSize);
      const row = Math.floor(y / boardGameState.cellSize);
      const snapX = col * cellSize;
      const snapY = row * cellSize;
      // Oblicz strefy
      const boardHeight = boardGameState.isBoard50x50
        ? 5 * boardGameState.cellSize
        : boardGameState.backSizeRows * boardGameState.cellSize;
      const inGap =
        !boardGameState.isFront &&
        y >= boardHeight &&
        y < boardHeight + boardGameState.codeMargin;
      if (inGap) {
        // Nie pozwalaj zrzucać w puste miejsce
        touchDraggingPiece = null;
        ctxOverlay.clearRect(0, 0, boardOverlay.width, boardOverlay.height);
        showMessage("");
        return;
      }
      // Sprawdź czy miejsce jest zajęte lub zablokowane
      const isBlocked = isOccupied(
        boardGameState.isBoard50x50,
        boardGameState.isFront,
        snapX + boardGameState.cellSize / 2,
        snapY + boardGameState.cellSize / 2,
        boardGameState.piecesFront,
        boardGameState.piecesGrid,
        boardGameState.pieces50x50
      );
      if (!isBlocked) {
        touchDraggingPiece.x = snapX + boardGameState.cellSize / 2;
        touchDraggingPiece.y = snapY + boardGameState.cellSize / 2;
        idxTable.push(touchDraggingPiece);
      } else {
        showMessage("To miejsce jest zajęte!");
        // Przywróć element na stare miejsce
        if (
          touchDraggingPiece.prevX !== undefined &&
          touchDraggingPiece.prevY !== undefined
        ) {
          touchDraggingPiece.x = touchDraggingPiece.prevX;
          touchDraggingPiece.y = touchDraggingPiece.prevY;
        }
        idxTable.push(touchDraggingPiece);
      }
      touchDraggingPiece = null;
      ctxOverlay.clearRect(0, 0, boardOverlay.width, boardOverlay.height);
      renderBoard();
    }
  },
};

const boardWrapperHandlers = {
  onMouseDown: (e) => {
    if (e.button !== 0 || e.target.id === "yAxis") return;
    isDraggingBoard = true;
    dragStartX = e.clientX;
    scrollStartX = boardWrapper.scrollLeft;
  },
  onTouchStart: (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    isTouchDraggingBoard = true;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchScrollStartX = boardWrapper.scrollLeft;
    touchScrollStartY = boardWrapper.scrollTop;
    boardWrapper.style.cursor = "grab";
  },
  onTouchMove: (e) => {
    if (!isTouchDraggingBoard || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touchStartX - touch.clientX;
    const dy = touchStartY - touch.clientY;
    boardWrapper.scrollLeft = touchScrollStartX + dx;
    boardWrapper.scrollTop = touchScrollStartY + dy;
    e.preventDefault();
  },
  onTouchEnd: (e) => {
    isTouchDraggingBoard = false;
    boardWrapper.style.cursor = "default";
  },
};

function initGame() {
  drawPicker();
  registerBoardMouseEvents(board, boardMouseHandlers);
  registerBoardTouchEvents(board, boardTouchHandlers);
  registerBoardWrapperEvents(boardWrapper, boardWrapperHandlers);
  registerWindowMouseEvents(windowMouseHandlers);
  registerUIEvents(uiHandlers);
  renderBoard();
}

initGame();
