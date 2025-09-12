import { boardGameState } from "./boardGameState.js";
import { blockColors, sections } from "./boardGameData.js";

export function drawCell(ctxBoard, x, y, size, color, arc) {
  ctxBoard.beginPath();
  arc
    ? ctxBoard.arc(x, y, size / 2 - 3, 0, Math.PI * 2)
    : ctxBoard.rect(x, y, size, size);
  ctxBoard.fillStyle = color ? color : "white";
  ctxBoard.fill();
  ctxBoard.strokeStyle = color ? color : "black";
  ctxBoard.stroke();
}

export function drawBoard(ctxOverlay, ctxBoard, options) {
  const {
    isFront,
    cellSize, // rozmiar komórki
    gridSize, // liczba wierszy/kolumn
    pieces, // tablica krążków
  } = options;

  const codeRows = 3;
  const codeMargin = 70;

  // Rozmiary planszy i sekcji kodowania
  const rows = isFront ? 9 : gridSize;

  const boardWidth = gridSize * cellSize;
  const boardHeight = gridSize * cellSize;
  const codeSectionY = boardHeight + codeMargin;
  const codeSectionHeight = codeRows * cellSize;

  // Ustaw rozmiar canvasu
  ctxBoard.canvas.width = boardWidth;
  !isFront &&
    (ctxBoard.canvas.height = boardHeight + codeMargin + codeSectionHeight);
  !isFront &&
    (ctxOverlay.canvas.height = boardHeight + codeMargin + codeSectionHeight);
  ctxBoard.clearRect(0, 0, ctxBoard.canvas.width, ctxBoard.canvas.height);
  ctxOverlay.clearRect(0, 0, ctxOverlay.canvas.width, ctxOverlay.canvas.height);

  // --- Rysowanie komórek ---
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < gridSize; c++) {
      let x,
        y,
        color = null;

      if (isFront) {
        const blockRow = Math.floor(r / 3);
        const blockCol = Math.floor(c / 3);
        color = blockColors?.[blockRow]?.[blockCol] ?? "#fff";

        x = c * cellSize + cellSize / 2;
        y = r * cellSize + cellSize / 2;
        drawCell(ctxBoard, x, y, cellSize, color, true);
      } else {
        x = c * cellSize;
        y = r * cellSize;
        drawCell(ctxBoard, x, y, cellSize, null, false);
      }
    }
  }

  if (!isFront) {
    for (let r = 0; r < codeRows; r++) {
      for (let c = 0; c < gridSize; c++) {
        const x = c * cellSize;
        const y = codeSectionY + r * cellSize;
        drawCell(ctxBoard, x, y, cellSize, null, false);
      }
    }

    if (boardGameState.lockedImg) {
      const cellSize = options.cellSize;
      const x = 0 * cellSize + cellSize / 2; // kolumna A (0)
      const y = gridSize * cellSize + codeMargin + 0 * cellSize + cellSize / 2; // K1 (pierwszy wiersz kodowania)

      drawCirclePiece(
        ctxBoard,
        x,
        y,
        cellSize,
        "#4466b0",
        boardGameState.lockedImg
      );
    } else {
      const newLockedImg = new window.Image();
      newLockedImg.src = "../assets/symbole_do_kodowania/img4.png";
      newLockedImg.onload = function () {
        boardGameState.lockedImg = newLockedImg;
        const cellSize = options.cellSize;
        const x = 0 * cellSize + cellSize / 2; // kolumna A (0)
        const y =
          gridSize * cellSize + codeMargin + 0 * cellSize + cellSize / 2; // K1 (pierwszy wiersz kodowania)

        drawCirclePiece(ctxBoard, x, y, cellSize, "#4466b0", newLockedImg);
      };
    }

    // --- Dolna linia planszy (tylko dla back) ---

    ctxBoard.save();
    ctxBoard.beginPath();
    ctxBoard.lineWidth = 2.2;
    ctxBoard.strokeStyle = "#333";
    const y = gridSize * cellSize;
    ctxBoard.moveTo(0, y);
    ctxBoard.lineTo(boardWidth, y);
    ctxBoard.stroke();
    ctxBoard.restore();

    // --- Linie przez środek planszy (tylko dla back) ---

    ctxBoard.save();
    ctxBoard.strokeStyle = "#ff0000";
    ctxBoard.lineWidth = 2;

    const midCol = gridSize / 2;
    const midRow = rows / 2;

    // pionowa linia przez środek
    ctxBoard.beginPath();
    ctxBoard.moveTo(midCol * cellSize, 0);
    ctxBoard.lineTo(midCol * cellSize, boardHeight);
    ctxBoard.stroke();

    // pozioma linia przez środek
    ctxBoard.beginPath();
    ctxBoard.moveTo(0, midRow * cellSize);
    ctxBoard.lineTo(boardWidth, midRow * cellSize);
    ctxBoard.stroke();

    ctxBoard.restore();
  } else {
    ctxBoard.save();
    ctxBoard.lineWidth = 4;
    ctxBoard.strokeStyle = "#000";
    ctxBoard.strokeRect(0, 0, boardWidth, boardHeight);
    ctxBoard.restore();
  }
  // --- Rysowanie pionków ---
  for (let p of pieces) {
    const img = p.img ? boardGameState.loadedImages[p.img] : null;
    const size = cellSize;

    if (isFront || !p.isPixel) {
      drawCirclePiece(ctxBoard, p.x, p.y, size, p.color, img);
    } else {
      drawSquarePiece(ctxBoard, p.x, p.y, size, p.color, img);
    }
  }
}

export function drawPicker() {
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
    const section = sections[secIdx];
    const colors = section.backgroundColors || false;

    const forColoring = section.items.filter((item) => item.color === null);
    const noColoring = section.items.filter((item) => item.color !== null);

    const createBtn = (item, color) => {
      const borderRadius = boardGameState.isFront
        ? "50%"
        : item.isPixel
        ? "0"
        : "50%";

      const imgBtn = document.createElement("button");
      imgBtn.className = "imgButton";
      imgBtn.title = "";
      imgBtn.style.width = "75px";
      imgBtn.style.height = "75px";
      imgBtn.style.borderRadius = borderRadius;
      imgBtn.style.border = `2px solid ${color === "#ffffff" ? "#000" : color}`;
      imgBtn.style.position = "relative";
      imgBtn.style.margin = "5px";
      imgBtn.style.background = color;

      if (item.img) {
        const img = document.createElement("img");
        img.src = item.img;
        img.style.width = "85%";
        img.style.height = "85%";
        img.style.position = "absolute";
        img.style.top = "7.5%";
        img.style.left = "7.5%";
        img.style.borderRadius = borderRadius;
        imgBtn.appendChild(img);
      }

      imgBtn.onclick = () => pickFromList({ ...item, color });
      imagesDiv.appendChild(imgBtn);
    };

    if (colors) {
      colors.forEach((bgColor) =>
        forColoring.forEach((item) => createBtn(item, bgColor))
      );
      noColoring.forEach((item) => createBtn(item, item.color || "#ccc"));
    } else {
      section.items.forEach((item) => createBtn(item, item.color || "#ccc"));
    }
  }

  sectionSelect.onchange = function () {
    showImages(this.value);
  };

  showImages(0);
}

// export function drawPalette() {
//   const paletteList = document.getElementById("paletteList");
//   paletteList.innerHTML = "";
//   if (boardGameState.paletteHistory.length === 0) {
//     const info = document.createElement("div");
//     info.textContent = "Brak ostatnio użytych";
//     paletteList.appendChild(info);
//     return;
//   }
//   boardGameState.paletteHistory.forEach((item, i) => {
//     const btn = document.createElement("button");
//     btn.className = "imgButton";
//     btn.style.margin = "10px 0";
//     btn.style.width = "100px";
//     btn.style.height = "100px";
//     btn.style.borderRadius = "50%";
//     btn.style.border = "2px solid #333";
//     btn.style.background = item.color || "#ccc";
//     btn.style.position = "relative";
//     btn.style.display = "block";

//     // Dodaj obrazek na środku jeśli jest
//     if (item.img) {
//       const img = document.createElement("img");
//       img.src = item.img;
//       img.style.width = "85%";
//       img.style.height = "85%";
//       img.style.position = "absolute";
//       img.style.top = "7.5%";
//       img.style.left = "7.5%";
//       img.style.borderRadius = "50%";
//       btn.appendChild(img);
//     }

//     btn.onclick = () => pickFromList(item);

//     paletteList.appendChild(btn);
//   });
// }

export function drawCirclePiece(ctx, x, y, size, color, img) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = color || "#ccc";
  ctx.fill();
  ctx.strokeStyle = color === "#ffffff" ? "#000" : "#333";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  if (img) {
    const imgSize = size * 0.8;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, imgSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x - imgSize / 2, y - imgSize / 2, imgSize, imgSize);
    ctx.restore();
  }
}

export function drawSquarePiece(ctx, x, y, size, color, img) {
  const left = x - size / 2;
  const top = y - size / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(left, top, size, size);
  ctx.fillStyle = color || "#ccc";
  ctx.fill();
  ctx.strokeStyle = color === "#ffffff" ? "#000" : "#333";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, size, size);
    ctx.clip();
    ctx.drawImage(img, left, top, size, size);
    ctx.restore();
  }
}

export function drawAxes(board, cellSize) {
  // Oś Y
  console.log(cellSize);

  const yAxis = document.getElementById("yAxis");
  yAxis.innerHTML = "";
  yAxis.style.height = board.height + cellSize * 4 + "px";
  let k = 1;
  for (let i = 1; i <= boardGameState.gridSize + 4; i++) {
    const div = document.createElement("div");
    if (i > boardGameState.gridSize + 1) {
      div.textContent = "K" + k;
      k++;
    } else {
      if (i !== boardGameState.gridSize + 1) div.textContent = i;
    }
    div.style.height = board.height / boardGameState.gridSize + "px";
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
  for (let i = 0; i < boardGameState.gridSize; i++) {
    const div = document.createElement("div");
    div.textContent = String.fromCharCode(65 + i); // A, B, C...
    div.style.width = board.width / boardGameState.gridSize + "px";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.fontWeight = "bold";
    div.style.fontSize = "16px";
    div.style.color = "#4a6792";
    xAxis.appendChild(div);
  }

  const showAxes = !boardGameState.isFront;
  yAxis.style.visibility = showAxes ? "visible" : "hidden";
  xAxis.style.visibility = showAxes ? "visible" : "hidden";
}
export function drawEmptyDisc(ctxBoard, size, dragging) {
  ctxBoard.beginPath();
  ctxBoard.arc(dragging.x, dragging.y, size * 0.4, 0, Math.PI * 2);
  ctxBoard.fillStyle = dragging.color || "#ccc";
  ctxBoard.fill();
  ctxBoard.strokeStyle = "#333";
  ctxBoard.stroke();
}

function pickFromList(item) {
  if (
    !boardGameState.paletteHistory.some(
      (p) => p.img === item.img && p.color === item.color
    )
  ) {
    boardGameState.paletteHistory.unshift(item);
    if (boardGameState.paletteHistory.length > 10)
      boardGameState.paletteHistory.pop();
    //drawPalette();
  }
  console.log(item);

  boardGameState.dragging = {
    color: item.color,
    img: item.img,
    x: 0,
    y: 0,
    isCodingDisc: item.isCodingDisc ? true : false,
    isPixel: !!item.isPixel,
  };
}

export async function drawPdfFile(coordToPrint) {
  {
    const board = document.getElementById("board");
    const isFront = boardGameState.isFront;

    // Parametry planszy
    const gridSize = isFront
      ? boardGameState.cellSizeRows
      : boardGameState.gridSize;
    const cellSize = board.width / gridSize;
    const codeRows = isFront ? 0 : 3;
    const codeMargin = isFront ? 0 : 70;
    const boardWidth = gridSize * cellSize;
    const boardHeight = gridSize * cellSize;
    const codeSectionY = boardHeight + codeMargin;
    const codeSectionHeight = codeRows * cellSize;

    // Utwórz tymczasowy canvas o odpowiednich wymiarach
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = boardWidth + 40;
    tmpCanvas.height = boardHeight + codeMargin + codeSectionHeight + 40;
    const tmpCtx = tmpCanvas.getContext("2d");

    // Białe tło
    tmpCtx.fillStyle = "#fff";
    tmpCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);

    if (!isFront) {
      // --- OPISY OSI X ---
      tmpCtx.save();
      tmpCtx.font = "bold 20px Arial";
      tmpCtx.fillStyle = "#4a6792";
      tmpCtx.textAlign = "center";
      for (let c = 0; c < gridSize; c++) {
        const x = 40 + c * cellSize + cellSize / 2;
        const y = 30;
        tmpCtx.fillText(String.fromCharCode(65 + c), x, y);
      }
      tmpCtx.restore();

      // --- OPISY OSI Y ---
      tmpCtx.save();
      tmpCtx.font = "bold 20px Arial";
      tmpCtx.fillStyle = "#4a6792";
      tmpCtx.textAlign = "right";
      for (let r = 0; r < gridSize; r++) {
        const x = 35;
        const y = 40 + r * cellSize + cellSize / 2 + 7;
        tmpCtx.fillText((r + 1).toString(), x, y);
      }
      for (let r = 0; r < codeRows; r++) {
        const x = 35;
        const y = 40 + codeSectionY + r * cellSize + cellSize / 2 + 7;
        tmpCtx.fillText(`K${r + 1}`, x, y);
      }
    }
    tmpCtx.restore();

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        let x,
          y,
          color = null;

        if (isFront) {
          const blockRow = Math.floor(r / 3);
          const blockCol = Math.floor(c / 3);
          color = blockColors?.[blockRow]?.[blockCol] ?? "#fff";

          x = 40 + c * cellSize + cellSize / 2;
          y = 40 + r * cellSize + cellSize / 2;
          drawCell(tmpCtx, x, y, cellSize, color, true);
        } else {
          x = 40 + c * cellSize;
          y = 40 + r * cellSize;
          drawCell(tmpCtx, x, y, cellSize, null, false);
        }
      }
    }

    // --- RAMKA WOKÓŁ SIATKI ---
    tmpCtx.save();
    tmpCtx.lineWidth = 2;
    tmpCtx.strokeStyle = "#000";
    tmpCtx.strokeRect(40, 40, boardWidth, boardHeight);
    tmpCtx.restore();

    // --- RYSOWANIE SEKCJI KODOWANIA (tylko back) ---
    if (!isFront) {
      for (let r = 0; r < codeRows; r++) {
        for (let c = 0; c < gridSize; c++) {
          const x = 40 + c * cellSize;
          const y = 40 + codeSectionY + r * cellSize;
          tmpCtx.strokeStyle = "#000";
          tmpCtx.lineWidth = 1;
          tmpCtx.strokeRect(x, y, cellSize, cellSize);
        }
      }
      if (boardGameState.lockedImg) {
        const cellSize = board.width / gridSize;
        const x = 40 + cellSize / 2; // UWAGA: +40 przesunięcie jak dla innych komórek!
        const y = 40 + gridSize * cellSize + codeMargin + cellSize / 2;
        drawCirclePiece(
          tmpCtx,
          x,
          y,
          cellSize,
          "#4466b0",
          boardGameState.lockedImg
        );
      } else {
        console.log("Brak obrazka do zablokowanego krążka: ");
      }
      // Ramka wokół sekcji kodowania
      tmpCtx.save();
      tmpCtx.lineWidth = 2;
      tmpCtx.strokeStyle = "#000";
      tmpCtx.strokeRect(40, 40 + codeSectionY, boardWidth, codeSectionHeight);
      tmpCtx.restore();
    }

    // --- RYSOWANIE KRĄŻKÓW/PIXELI ---
    if (!coordToPrint) {
      const pieces = isFront
        ? boardGameState.piecesFront
        : boardGameState.piecesGrid;
      for (let p of pieces) {
        const img = p.img ? boardGameState.loadedImages[p.img] : null;
        if (isFront || !p.isPixel) {
          drawCirclePiece(tmpCtx, p.x + 40, p.y + 40, cellSize, p.color, img);
        } else {
          drawSquarePiece(tmpCtx, p.x + 40, p.y + 40, cellSize, p.color, img);
        }
      }
    }

    // Zamień canvas na obrazek
    const imgData = tmpCanvas.toDataURL("image/png");
    const pdfW = 210;
    const pdfH = 297;

    // Obrazek na 70% szerokości strony

    const imgW = coordToPrint ? pdfW * 0.4 : pdfW * 0.7;
    const scale = imgW / tmpCanvas.width;
    const imgH = tmpCanvas.height * scale;
    const offsetX = (pdfW - imgW) / 2;
    const offsetY = 30;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [pdfW, pdfH],
    });

    pdf.addImage(imgData, "PNG", offsetX, offsetY, imgW, imgH);

    // Dodaj logo i tekst TYLKO na pierwszej stronie!
    const logo = new window.Image();
    logo.src = "assets/images/logo.png";
    await new Promise((res) => (logo.onload = res));
    const logoCanvas = document.createElement("canvas");
    logoCanvas.width = logo.width;
    logoCanvas.height = logo.height;
    const logoCtx = logoCanvas.getContext("2d");
    logoCtx.drawImage(logo, 0, 0);
    const logoBase64 = logoCanvas.toDataURL("image/png");
    pdf.addImage(logoBase64, "PNG", 10, 10, 30, 15);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor("#000");
    pdf.textWithLink("www.kodowanienadywanie.pl", pdfW - 10, 18, {
      align: "right",
    });

    if (!isFront && coordToPrint && coordToPrint.length > 0) {
      let listY = offsetY + imgH + 20; // pod planszą
      let iconSize = 16; // mm
      let pdfTextSize = 12;
      const maxListY = pdfH - 30; // dolny margines strony

      for (const group of coordToPrint) {
        // Tworzenie miniatury
        const discImgData = await createDiscImage(group.img, group.color, 60);

        // Dodaj obrazek krążka
        pdf.addImage(discImgData, "PNG", 5, listY, iconSize, iconSize);

        // --- ZAWIJANIE TEKSTU KOORDYNATÓW ---
        pdf.setFontSize(pdfTextSize);
        pdf.setTextColor("#333");
        const coordsText = group.coords.join(", ");
        const maxTextWidth = 170; // mm, dostosuj do szerokości strony
        let textLines = [];
        let currentLine = "";

        coordsText.split(", ").forEach((coord) => {
          const testLine = currentLine ? currentLine + ", " + coord : coord;
          if (pdf.getTextWidth(testLine) > maxTextWidth && currentLine) {
            textLines.push(currentLine);
            currentLine = coord;
          } else {
            currentLine = testLine;
          }
        });
        if (currentLine) textLines.push(currentLine);

        // Dodaj tekst koordynatów, każda linia pod poprzednią
        textLines.forEach((line, i) => {
          pdf.text(
            line,
            5 + iconSize + 8,
            listY - 1 + iconSize / 1.5 + i * (pdfTextSize + 2)
          );
        });

        // Przesuń Y o wysokość wszystkich linii
        listY += iconSize + 6 + (textLines.length - 1) * (pdfTextSize + 2);

        // --- DODAJ NOWĄ STRONĘ JEŚLI NIE MIEŚCI SIĘ NA JEDNEJ ---
        if (listY + iconSize + 6 > maxListY) {
          pdf.addPage();
          listY = 30; // nowa strona, margines od góry
        }
      }
    }

    pdf.save(`${!coordToPrint ? "plansza" : "koordynaty"}.pdf`);
  }
}

export async function createDiscImage(img, color, size = 60) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (img) {
    const loadedImg = await loadImageAsync(img);
    if (loadedImg) {
      drawCirclePiece(ctx, size / 2, size / 2, size, color, loadedImg);
    }
  } else {
    drawSquarePiece(ctx, size / 2, size / 2, size, color);
  }
  return canvas.toDataURL("image/png");
}

function loadImageAsync(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
}
