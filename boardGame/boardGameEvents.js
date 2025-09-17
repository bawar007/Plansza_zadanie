export function registerBoardMouseEvents(board, handlers) {
  board.addEventListener("mousemove", handlers.onMouseMove);
  board.addEventListener("mouseleave", handlers.onMouseLeave);
  board.addEventListener("mouseup", handlers.onMouseUp);
  board.addEventListener("mousedown", handlers.onMouseDown);
  board.addEventListener("contextmenu", handlers.onContextMenu);
}

export function registerWindowMouseEvents(handlers) {
  window.addEventListener("mouseup", handlers.onMouseUp);
  window.addEventListener("mousemove", handlers.onMouseMove);
}

export function registerBoardTouchEvents(board, handlers) {
  board.addEventListener("touchstart", handlers.onTouchStart, {
    passive: false,
  });
  board.addEventListener("touchmove", handlers.onTouchMove, { passive: false });
  board.addEventListener("touchend", handlers.onTouchEnd, { passive: false });
}

export function registerBoardWrapperEvents(boardWrapper, handlers) {
  boardWrapper.addEventListener("mousedown", handlers.onMouseDown);
  boardWrapper.addEventListener("touchmove", handlers.onTouchMove, {
    passive: false,
  });
  boardWrapper.addEventListener("touchend", handlers.onTouchEnd, {
    passive: false,
  });
  boardWrapper.addEventListener("touchstart", handlers.onTouchStart, {
    passive: false,
  });
}

export function registerUIEvents(handlers) {
  document
    .getElementById("clearBoard")
    .addEventListener("click", handlers.onClearBoard);
  document
    .getElementById("flipBoard")
    .addEventListener("click", handlers.onFlipBoard);
  document
    .getElementById("gridSizeSelector")
    .addEventListener("change", handlers.onGridSizeChange);

  document.getElementById("downloadBoardPdf").onclick = () => {
    handlers.onDownloadBoardPdf();
  };
  document.getElementById("downloadCoords").onclick = handlers.onDownloadCoords;
  document
    .getElementById("switchBoard")
    .addEventListener("click", handlers.onSwitchBoard);
}
