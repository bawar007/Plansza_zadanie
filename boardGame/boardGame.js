import {
  isOccupied,
  getImage,
  showMessage,
  getMousePos,
  isPixelAt,
  getCoordsList,
  addPixelAt,
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

const SCROLL_EDGE = 200;
const SCROLL_STEP = 5;
let scrollDirectionX = 0;
let scrollDirectionY = 0;
let scrollAnimFrame = null;
let isDraggingBoard = false;
let dragStartX = 0;
let scrollStartX = 0;

function smoothScrollBoard() {
  if (scrollDirectionX !== 0 || scrollDirectionY !== 0) {
    let newScrollX = boardWrapper.scrollLeft + scrollDirectionX * SCROLL_STEP;
    let newScrollY = boardWrapper.scrollTop + scrollDirectionY * SCROLL_STEP;
    newScrollX = Math.max(
      0,
      Math.min(newScrollX, boardWrapper.scrollWidth - boardWrapper.clientWidth)
    );
    newScrollY = Math.max(
      0,
      Math.min(
        newScrollY,
        boardWrapper.scrollHeight - boardWrapper.clientHeight
      )
    );
    boardWrapper.scrollLeft = newScrollX;
    scrollAnimFrame = requestAnimationFrame(smoothScrollBoard);
  }
}

const boardHandlers = {
  onMouseMove: (e) => {
    const cellSizeDefalut = boardGameState.cellSize;
    const { mx, my, c, r, x, y } = getMousePos(e, board, cellSizeDefalut);

    // --- Płynne auto-scroll zawsze gdy kursor blisko krawędzi ---
    const wrapperRect = boardWrapper.getBoundingClientRect();
    scrollDirectionX = 0;
    if (e.clientX - wrapperRect.left < SCROLL_EDGE) {
      scrollDirectionX = -1;
    } else if (wrapperRect.right - e.clientX < SCROLL_EDGE) {
      scrollDirectionX = 1;
    }

    if (scrollDirectionX !== 0) {
      if (!scrollAnimFrame)
        scrollAnimFrame = requestAnimationFrame(smoothScrollBoard);
    } else {
      if (scrollAnimFrame) {
        cancelAnimationFrame(scrollAnimFrame);
        scrollAnimFrame = null;
      }
    }

    // Gumka: usuwanie pikseli podczas przesuwania myszy
    if (boardGameState.isErasing && !boardGameState.isFront) {
      const idx = boardGameState.piecesGrid.findIndex(
        (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5 && p.isPixel
      );
      if (idx !== -1) {
        boardGameState.piecesGrid.splice(idx, 1);
        renderBoard();
      }
      return;
    }
    // Jeśli jesteśmy w trybie malowania pikseli
    if (
      boardGameState.isPainting &&
      boardGameState.paintColor &&
      !boardGameState.isFront
    ) {
      if (
        addPixelAt(
          x,
          y,
          boardGameState.paintColor,
          boardGameState.isFront,
          boardGameState.piecesFront,
          boardGameState.piecesGrid
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
      drawSquarePiece(ctxOverlay, mx, my, cellSizeDefalut, "#eee", null);
      ctxOverlay.restore();
      return;
    }

    // ...istniejąca logika podglądu dla malowania i krążków...
    const cells = isFront ? frontSizeRows : backSizeRows + 4;

    // Sprawdź różne warunki blokowania
    let isBlocked = false;
    let blockMessage = "";

    // Sprawdź czy to zablokowana komórka (tylko na tylnej stronie)
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
        isBlocked = true;
        blockMessage = "Nie można modyfikować tej komórki!";
      }
    }

    // Sprawdź czy miejsce jest zajęte przez krążek (ale nie podczas malowania pikseli)
    if (!isBlocked && (!dragging.isPixel || boardGameState.isFront)) {
      const isOccupiedSpot = isOccupied(
        boardGameState.isFront,
        x,
        y,
        boardGameState.piecesFront,
        boardGameState.piecesGrid
      );

      if (isOccupiedSpot) {
        isBlocked = true;
        blockMessage = "To miejsce jest zajęte!";

        const table = boardGameState.isFront
          ? boardGameState.piecesFront
          : boardGameState.piecesGrid;
        const blocking = table.find(
          (p) =>
            Math.abs(p.x - x) < 5 &&
            Math.abs(p.y - y) < 5 &&
            (boardGameState.isFront || !p.isPixel)
        );
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
        } else if (!boardGameState.isFront && boardGameState.dragging.isPixel) {
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
          if (!boardGameState.isFront) {
            const idx = boardGameState.piecesGrid.findIndex(
              (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5 && p.isPixel
            );
            if (idx !== -1) {
              boardGameState.piecesGrid.splice(idx, 1);
            }
          }
          boardGameState.isErasing = false;
          showMessage("");
          renderBoard();
          return;
        }
      }

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
        const isOccupiedSpot = isOccupied(
          boardGameState.isFront,
          x,
          y,
          boardGameState.piecesFront,
          boardGameState.piecesGrid
        );

        if (isOccupiedSpot) {
          return;
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
          boardGameState.dragging = null;
          boardGameState.prevPiece = null;
        } else {
          boardGameState.piecesGrid.push(pieceObj);
          if (!boardGameState.dragging.isPixel) {
            boardGameState.dragging = null;
            boardGameState.prevPiece = null;
          }
        }
        showMessage("");
        renderBoard();
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
        const isOccupiedSpot = isOccupied(
          boardGameState.isFront,
          x,
          y,
          boardGameState.piecesFront,
          boardGameState.piecesGrid
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

        showMessage("");
        renderBoard();
      }
    }
  },
  onMouseDown: (e) => {
    // Sprawdź czy mamy wybraną gumkę (tylko na tylnej stronie)
    if (
      !boardGameState.isFront &&
      boardGameState.dragging &&
      boardGameState.dragging.isEraser
    ) {
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

    // Sprawdź czy mamy wybrany piksel do malowania (tylko na tylnej stronie)
    if (
      !boardGameState.isFront &&
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
        boardGameState.piecesGrid
      );
      renderBoard();
      return;
    }

    // Jeśli już trzymamy krążek (nie piksel), nie szukaj nowych elementów do przeciągnięcia
    if (boardGameState.dragging) {
      if (!boardGameState.isFront) {
        if (!boardGameState.dragging.isPixel) return;
      } else {
        return;
      }
    }

    const idxTable = boardGameState.isFront
      ? boardGameState.piecesFront
      : boardGameState.piecesGrid;

    // Na przedniej stronie szukaj wszystkich elementów (krążki + piksele)
    // Na tylnej stronie szukaj tylko krążków (piksele są do malowania)
    let idx = idxTable.findIndex(
      (p) =>
        Math.abs(p.x - x) < 5 &&
        Math.abs(p.y - y) < 5 &&
        (boardGameState.isFront || !p.isPixel)
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

      boardGameState.isFront
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

// Drag-to-scroll dla planszy (myszą)
boardWrapper.addEventListener("mousedown", function (e) {
  if (e.button !== 0 || e.target.id === "yAxis") return;
  isDraggingBoard = true;
  dragStartX = e.clientX;
  scrollStartX = boardWrapper.scrollLeft;
});

window.addEventListener("mousemove", function (e) {
  if (!isDraggingBoard) return;
  const dx = dragStartX - e.clientX;
  boardWrapper.scrollLeft = scrollStartX + dx;
});

window.addEventListener("mouseup", function (e) {
  if (isDraggingBoard) {
    isDraggingBoard = false;
    boardWrapper.style.cursor = "default";
  }
});

// Zatrzymaj animację scrolla przy opuszczeniu planszy
board.addEventListener("mouseleave", () => {
  scrollDirectionX = 0;
  if (scrollAnimFrame) {
    cancelAnimationFrame(scrollAnimFrame);
    scrollAnimFrame = null;
  }
});

// Obsługa dotyku dla mobilnych
let isTouchDraggingBoard = false;
let touchStartX = 0;
let touchStartY = 0;
let touchScrollStartX = 0;
let touchScrollStartY = 0;
let isTouchPainting = false;
let isTouchErasing = false;
let touchDraggingPiece = null;

boardWrapper.addEventListener(
  "touchstart",
  function (e) {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    isTouchDraggingBoard = true;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchScrollStartX = boardWrapper.scrollLeft;
    touchScrollStartY = boardWrapper.scrollTop;
    boardWrapper.style.cursor = "grab";
  },
  { passive: false }
);

boardWrapper.addEventListener(
  "touchmove",
  function (e) {
    if (!isTouchDraggingBoard || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touchStartX - touch.clientX;
    const dy = touchStartY - touch.clientY;
    boardWrapper.scrollLeft = touchScrollStartX + dx;
    boardWrapper.scrollTop = touchScrollStartY + dy;
    e.preventDefault();
  },
  { passive: false }
);

boardWrapper.addEventListener(
  "touchend",
  function (e) {
    isTouchDraggingBoard = false;
    boardWrapper.style.cursor = "default";
  },
  { passive: false }
);

// Obsługa tap/long tap na planszy
let touchTimer = null;
let touchMoved = false;
let touchStartBoardX = 0;
let touchStartBoardY = 0;

function getTouchPos(e, board, cellSize) {
  const touch = e.touches?.[0] || e.changedTouches?.[0];
  if (!touch) return { x: 0, y: 0 };
  const rect = board.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  return { x, y };
}

board.addEventListener(
  "touchstart",
  function (e) {
    if (e.touches.length !== 1) return;
    touchMoved = false;
    const touch = e.touches[0];
    touchStartBoardX = touch.clientX;
    touchStartBoardY = touch.clientY;
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
  { passive: false }
);

board.addEventListener(
  "touchmove",
  function (e) {
    touchMoved = true;
    if (touchTimer) {
      clearTimeout(touchTimer);
      touchTimer = null;
    }
    const touch = e.touches[0];
    const { x, y } = getTouchPos(e, board, boardGameState.cellSize);
    if (isTouchErasing) {
      // Gumka: usuwanie pikseli
      let idx = boardGameState.piecesGrid.findIndex(
        (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5 && p.isPixel
      );
      if (idx !== -1) {
        boardGameState.piecesGrid.splice(idx, 1);
        renderBoard();
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
          boardGameState.piecesGrid
        )
      ) {
        renderBoard();
      }
      e.preventDefault();
      return;
    }
  },
  { passive: false }
);

board.addEventListener(
  "touchend",
  function (e) {
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
      // Sprawdź czy miejsce jest zajęte lub zablokowane
      const isBlocked = isOccupied(
        boardGameState.isFront,
        snapX + boardGameState.cellSize / 2,
        snapY + boardGameState.cellSize / 2,
        boardGameState.piecesFront,
        boardGameState.piecesGrid
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
  { passive: false }
);
