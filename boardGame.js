const main = document.getElementById("main");
main.innerHTML = `
  <div id="picker" style="width: 15%"></div>
      <div
        class="center"
        style="
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 50%;
        "
      >
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
            <canvas id="board" width="500" height="500"></canvas>
          </div>
        </div>
      </div>

      <div class="lastItem">
        <h3>Ostatnio użyte</h3>
        <div
          id="paletteList"
          style="
            display: flex;
            flex-direction: row;
            align-items: flex-start;
            margin-top: 30px;
            flex-wrap: wrap;
            justify-content: space-around;
          "
        ></div>
      </div>
`;

const board = document.getElementById("board");
const ctxBoard = board.getContext("2d");

const cellSizeRows = 9;
let cellSize = ctxBoard.canvas.width / cellSizeRows;
let gridSize = 10;
let cellGridSize = ctxBoard.canvas.width / gridSize;
let isFront = true;
let dragging = null;
let draggingPieceIdx = null;
let prevPiece = null;
let paletteHistory = [];
let paletteGridHistory = [];
const loadedImages = {};
const piecesFront = [];
const piecesGrid = [];

const sections = [
  {
    name: "Kolorowe piksele",
    items: [
      { letter: null, color: "#090102", img: null },
      { letter: null, color: "#939ea6", img: null },
      { letter: null, color: "#f7ec12", img: null },
      { letter: null, color: "#ebe5c4", img: null },
      { letter: null, color: "#faa41a", img: null },
      { letter: null, color: "#ec008c", img: null },
      { letter: null, color: "#ed1e24", img: null },
      { letter: null, color: "#613d18", img: null },
      { letter: null, color: "#498ccb", img: null },
      { letter: null, color: "#292874", img: null },
      { letter: null, color: "#8066ad", img: null },
      { letter: null, color: "#288b43", img: null },
    ],
  },
  {
    name: "Krążki obrazkowe sudoku",
    items: [
      { letter: "A", color: "red", img: "./assets/a.png" },
      { letter: "B", color: "red", img: "./assets/b.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
    ],
  },
  {
    name: "Krążki symbole do kodowania",
    items: [
      { letter: "A", color: "red", img: "./assets/a.png" },
      { letter: "B", color: "red", img: "./assets/b.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
    ],
  },
  {
    name: "Krążki kolorowa matematyka",
    items: [
      { letter: "A", color: "red", img: "./assets/a.png" },
      { letter: "B", color: "red", img: "./assets/b.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
    ],
  },
  {
    name: "Krążki materiał obrazkowy",
    items: [
      { letter: "A", color: "red", img: "./assets/a.png" },
      { letter: "B", color: "red", img: "./assets/b.png" },
      { letter: "C", color: "red", img: "./assets/c.png" },
      { letter: "D", color: "red", img: "./assets/d.png" },
    ],
  },
];
const blockColors = [
  ["red", "lightblue", "orange"], //bloki 3x3 poziomy 1-3
  ["limegreen", "pink", "lightgray"], //bloki 3x3 poziomy 4-6
  ["yellow", "violet", "blue"], //bloki 3x3 poziomy 7-9
];

function getImage(src, callback) {
  if (loadedImages[src]) {
    callback(loadedImages[src]);
  } else {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      loadedImages[src] = img;
      callback(img);
    };
  }
}

function isOccupied(x, y) {
  if (isFront) {
    return piecesFront.some(
      (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5
    );
  } else {
    return piecesGrid.some(
      (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5
    );
  }
}

function showMessage(txt) {
  const msg = document.getElementById("message");
  msg.textContent = txt;
}

function drawAxes() {
  // Oś Y
  const yAxis = document.getElementById("yAxis");
  yAxis.innerHTML = "";
  yAxis.style.height = board.height + "px";
  for (let i = 1; i <= gridSize; i++) {
    const div = document.createElement("div");
    div.textContent = i;
    div.style.height = board.height / gridSize + "px";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.fontWeight = "bold";
    div.style.fontSize = "16px";
    div.style.color = "#4a6792";
    div.style.width = "28px";
    yAxis.appendChild(div);
  }

  // Oś X
  const xAxis = document.getElementById("xAxis");
  xAxis.innerHTML = "";
  xAxis.style.width = board.width + "px";
  for (let i = 0; i < gridSize; i++) {
    const div = document.createElement("div");
    div.textContent = String.fromCharCode(65 + i); // A, B, C...
    div.style.width = board.width / gridSize + "px";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.fontWeight = "bold";
    div.style.fontSize = "16px";
    div.style.color = "#4a6792";
    xAxis.appendChild(div);
  }

  const showAxes = !isFront;
  yAxis.style.visibility = showAxes ? "visible" : "hidden";
  xAxis.style.visibility = showAxes ? "visible" : "hidden";
}

function updateCanvasSize() {
  if (isFront) {
    board.width = 500;
    board.height = 500;
    cellSize = board.width / cellSizeRows;
  } else {
    const minCell = 45;
    const size = gridSize * minCell;
    board.width = size;
    board.height = size;
    cellGridSize = board.width / gridSize;
  }
  drawAxes();
}

function drawBoard() {
  ctxBoard.clearRect(0, 0, board.width, board.height);

  for (let r = 0; r < cellSizeRows; r++) {
    for (let c = 0; c < cellSizeRows; c++) {
      const blockRow = Math.floor(r / 3);
      const blockCol = Math.floor(c / 3);
      const color = blockColors[blockRow][blockCol];

      const x = c * cellSize + cellSize / 2;
      const y = r * cellSize + cellSize / 2;

      ctxBoard.beginPath();
      const size = cellSize * 0.8;
      ctxBoard.arc(x, y, cellSize / 2 - 3, 0, Math.PI * 2);
      ctxBoard.fillStyle = color;
      ctxBoard.fill();
      ctxBoard.strokeStyle = color;
      ctxBoard.stroke();
    }
  }

  for (let p of piecesFront) {
    if (p.img) {
      const size = cellSize * 0.6;
      const left = p.x - size / 2;
      const top = p.y - size / 2;
      getImage(p.img, (img) => {
        ctxBoard.drawImage(
          img,
          p.x - cellSize * 0.3,
          p.y - cellSize * 0.3,
          cellSize * 0.6,
          cellSize * 0.6
        );
        ctxBoard.save();
        ctxBoard.strokeStyle = "#333";
        ctxBoard.lineWidth = 1;
        ctxBoard.strokeRect(left, top, size, size);
        ctxBoard.restore();
      });
    } else {
      ctxBoard.beginPath();
      ctxBoard.rect(
        p.x - cellSize * 0.3,
        p.y - cellSize * 0.3,
        cellSize * 0.6,
        cellSize * 0.6
      );
      ctxBoard.fillStyle = p.color;
      ctxBoard.fill();
      ctxBoard.strokeStyle = "#333";
      ctxBoard.stroke();
      if (p.letter) {
        ctxBoard.fillStyle = "#fff";
        ctxBoard.font = "bold 22px Arial";
        ctxBoard.textAlign = "center";
        ctxBoard.textBaseline = "middle";
        ctxBoard.fillText(p.letter, p.x, p.y);
      }
    }
  }
}

function drawGridBoard() {
  ctxBoard.clearRect(0, 0, board.width, board.height);

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const x = c * cellGridSize;
      const y = r * cellGridSize;

      ctxBoard.beginPath();
      ctxBoard.rect(x, y, cellGridSize, cellGridSize);
      ctxBoard.fillStyle = "white";
      ctxBoard.fill();
      ctxBoard.strokeStyle = "black";
      ctxBoard.stroke();
    }
  }

  for (let p of piecesGrid) {
    if (p.img) {
      const size = cellGridSize * 0.6;
      const left = p.x - size / 2;
      const top = p.y - size / 2;
      getImage(p.img, (img) => {
        ctxBoard.drawImage(
          img,
          p.x - cellGridSize * 0.3,
          p.y - cellGridSize * 0.3,
          cellGridSize * 0.6,
          cellGridSize * 0.6
        );
        ctxBoard.save();
        ctxBoard.strokeStyle = "#333";
        ctxBoard.lineWidth = 1;
        ctxBoard.strokeRect(left, top, size, size);
        ctxBoard.restore();
      });
    } else {
      ctxBoard.beginPath();
      ctxBoard.arc(p.x, p.y, cellGridSize * 0.4, 0, Math.PI * 2);
      ctxBoard.fillStyle = p.color;
      ctxBoard.fill();
      ctxBoard.strokeStyle = "#333";
      ctxBoard.stroke();
      if (p.letter) {
        ctxBoard.fillStyle = "#fff";
        ctxBoard.font = "bold 22px Arial";
        ctxBoard.textAlign = "center";
        ctxBoard.textBaseline = "middle";
        ctxBoard.fillText(p.letter, p.x, p.y);
      }
    }
  }
}

function renderBoard() {
  isFront ? drawBoard() : drawGridBoard();
}

function drawPicker() {
  const picker = document.getElementById("picker");
  picker.innerHTML = "";

  const sectionSelect = document.createElement("select");
  sectionSelect.className = "sectionSelector";

  sections.forEach((section, secIdx) => {
    const option = document.createElement("option");
    option.value = secIdx;
    option.textContent = section.name;
    sectionSelect.appendChild(option);
  });
  picker.appendChild(sectionSelect);

  const imagesDiv = document.createElement("div");
  imagesDiv.className = "pickerItemsWrapper";
  picker.appendChild(imagesDiv);

  function showImages(secIdx) {
    imagesDiv.innerHTML = "";
    sections[secIdx].items.forEach((item) => {
      const imgBtn = document.createElement("button");
      imgBtn.className = "imgButton";
      imgBtn.title = item.letter;

      if (item.img) {
        const img = document.createElement("img");
        img.src = item.img;
        imgBtn.appendChild(img);
      } else {
        imgBtn.style.background = item.color || "#ccc";
        imgBtn.style.border = "2px solid #333";
        imgBtn.style.width = "50px";
        imgBtn.style.height = "50px";
        imgBtn.style.display = "inline-block";
      }

      imgBtn.onclick = () => pickFromList(item);

      imagesDiv.appendChild(imgBtn);
    });
  }

  sectionSelect.onchange = function () {
    showImages(this.value);
  };

  showImages(0);
}

function pickFromList(item) {
  if (
    !paletteHistory.some(
      (p) => p.letter === item.letter && p.color === item.color
    )
  ) {
    paletteHistory.unshift(item);
    if (paletteHistory.length > 10) paletteHistory.pop();
    drawPalette();
  }

  dragging = {
    color: item.color,
    letter: item.letter,
    img: item.img,
    x: 0,
    y: 0,
  };
  draggingPieceIdx = null;
}

function drawPalette() {
  const paletteList = document.getElementById("paletteList");
  paletteList.innerHTML = "";
  if (paletteHistory.length === 0) {
    const info = document.createElement("div");
    info.textContent = "Brak ostatnio użytych ";
    paletteList.appendChild(info);
    return;
  }
  paletteHistory.forEach((item, i) => {
    const btn = document.createElement("button");
    btn.className = "imgButton";
    btn.style.margin = "5px 0";
    btn.title = item.letter;

    if (item.img) {
      const img = document.createElement("img");
      img.src = item.img;
      btn.appendChild(img);
    } else {
      btn.style.background = item.color || "#ccc";
      btn.style.border = "2px solid #333";
      btn.style.width = "100px";
      btn.style.height = "100px";
      btn.style.display = "inline-block";
    }

    btn.onclick = () => pickFromList(item);

    paletteList.appendChild(btn);
  });
}

renderBoard();
drawPicker();
drawPalette();

board.addEventListener("mousemove", (e) => {
  if (dragging) {
    const rect = board.getBoundingClientRect();
    dragging.x = e.clientX - rect.left;
    dragging.y = e.clientY - rect.top;
    renderBoard();

    const cellSizeDefalut = isFront ? cellSize : cellGridSize;
    const cells = isFront ? cellSizeRows : gridSize;

    if (dragging.img) {
      getImage(dragging.img, (img) => {
        ctxBoard.drawImage(
          img,
          dragging.x - cellSizeDefalut * 0.4,
          dragging.y - cellSizeDefalut * 0.4,
          cellSizeDefalut * 0.8,
          cellSizeDefalut * 0.8
        );
      });
    } else {
      ctxBoard.beginPath();
      isFront
        ? ctxBoard.rect(
            dragging.x - cellSizeDefalut * 0.4,
            dragging.y - cellSizeDefalut * 0.4,
            cellSizeDefalut * 0.8,
            cellSizeDefalut * 0.8
          )
        : ctxBoard.arc(
            dragging.x,
            dragging.y,
            cellSizeDefalut * 0.4,
            0,
            Math.PI * 2
          );
      ctxBoard.fillStyle = dragging.color || "#ccc";
      ctxBoard.fill();
      ctxBoard.strokeStyle = "#333";
      ctxBoard.stroke();
    }

    const c = Math.floor(dragging.x / cellSizeDefalut);
    const r = Math.floor(dragging.y / cellSizeDefalut);

    if (
      dragging.x < 2 ||
      dragging.x > board.width ||
      dragging.y < 2 ||
      dragging.y > board.height
    ) {
      showMessage("poza mapa");
      board.style.cursor = "default";
    } else {
      if (r >= 0 && r < cells && c >= 0 && c < cells) {
        const x = c * cellSizeDefalut + cellSizeDefalut / 2;
        const y = r * cellSizeDefalut + cellSizeDefalut / 2;
        if (isOccupied(x, y)) {
          showMessage("nie można postawić");
          board.style.cursor = "not-allowed";
        } else {
          showMessage("");
          board.style.cursor = "default";
        }
      }
    }
  }
});

board.addEventListener("mouseleave", () => {
  if (dragging) {
    if (isFront) {
      if (prevPiece) {
        piecesFront.push(prevPiece);
        renderBoard();
      }
    } else {
      if (prevPiece) {
        piecesGrid.push(prevPiece);
        renderBoard();
      }
    }
    dragging = null;
    draggingPieceIdx = null;
    prevPiece = null;
    showMessage("");
    renderBoard();
  }
});

board.addEventListener("mouseup", (e) => {
  if (dragging) {
    const rect = board.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cellSizeDefalut = isFront ? cellSize : cellGridSize;
    const cells = isFront ? cellSizeRows : gridSize;

    const c = Math.floor(mx / cellSizeDefalut);
    const r = Math.floor(my / cellSizeDefalut);

    if (r >= 0 && r < cells && c >= 0 && c < cells) {
      const x = c * cellSizeDefalut + cellSizeDefalut / 2;
      const y = r * cellSizeDefalut + cellSizeDefalut / 2;
      if (!isOccupied(x, y)) {
        if (isFront) {
          piecesFront.push({
            x,
            y,
            color: dragging.color,
            letter: dragging.letter,
            img: dragging.img,
          });
        } else {
          piecesGrid.push({
            x,
            y,
            color: dragging.color,
            letter: dragging.letter,
            img: dragging.img,
          });
        }
        dragging = null;
        draggingPieceIdx = null;
        prevPiece = null;
        showMessage("");
        renderBoard();
      } else {
        showMessage("nie można postawić");
        return;
      }
    }
  }
});

board.addEventListener("mousedown", (e) => {
  if (dragging) return;

  const rect = board.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const cellSizeDefalut = isFront ? cellSize : cellGridSize;

  const c = Math.floor(mx / cellSizeDefalut);
  const r = Math.floor(my / cellSizeDefalut);

  const x = c * cellSizeDefalut + cellSizeDefalut / 2;
  const y = r * cellSizeDefalut + cellSizeDefalut / 2;

  const idx = isFront
    ? piecesFront.findIndex(
        (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5
      )
    : piecesGrid.findIndex(
        (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5
      );

  if (idx !== -1) {
    if (isFront) {
      dragging = {
        color: piecesFront[idx].color,
        letter: piecesFront[idx].letter,
        img: piecesFront[idx].img,
        x: mx,
        y: my,
      };
      draggingPieceIdx = idx;
      prevPiece = { ...piecesFront[idx] };
      piecesFront.splice(idx, 1);
    } else {
      dragging = {
        color: piecesGrid[idx].color,
        letter: piecesGrid[idx].letter,
        img: piecesGrid[idx].img,
        x: mx,
        y: my,
      };
      draggingPieceIdx = idx;
      prevPiece = { ...piecesGrid[idx] };
      piecesGrid.splice(idx, 1);
    }
    renderBoard();
  }
});

board.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const rect = board.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  let cellSizeDefalut = isFront ? cellSize : cellGridSize;

  const c = Math.floor(mx / cellSizeDefalut);
  const r = Math.floor(my / cellSizeDefalut);

  const x = c * cellSizeDefalut + cellSizeDefalut / 2;
  const y = r * cellSizeDefalut + cellSizeDefalut / 2;

  let idx = isFront
    ? piecesFront.findIndex(
        (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5
      )
    : piecesGrid.findIndex(
        (p) => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5
      );

  if (idx !== -1) {
    if (isFront) {
      piecesFront.splice(idx, 1);
    } else {
      piecesGrid.splice(idx, 1);
    }
    renderBoard();
  }
});

document.getElementById("clearBoard").addEventListener("click", () => {
  isFront ? (piecesFront.length = 0) : (piecesGrid.length = 0);
  renderBoard();
});

document.getElementById("flipBoard").addEventListener("click", () => {
  isFront = !isFront;
  document.getElementById("gridSizeSelector").style.display = isFront
    ? "none"
    : "block";
  updateCanvasSize();
  renderBoard();
});

document.getElementById("gridSizeSelector").addEventListener("change", (e) => {
  gridSize = parseInt(e.target.value, 10);
  updateCanvasSize();
  renderBoard();
});
