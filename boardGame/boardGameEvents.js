export function registerBoardEvents(board, handlers) {
  board.addEventListener("mousemove", handlers.onMouseMove);
  board.addEventListener("mouseleave", handlers.onMouseLeave);
  board.addEventListener("mouseup", handlers.onMouseUp);
  board.addEventListener("mousedown", handlers.onMouseDown);
  board.addEventListener("contextmenu", handlers.onContextMenu);
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
}
