import { boardGameState } from "./boardGameState.js";
import { blockColors, sections } from "./boardGameData.js";
import { loadImageAsync, wrapText } from "./boardGameHelpers.js";

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
  const { isFront, pieces, boardRows, boardHeight, boardWidth } = options;

  const codeSectionY =
    boardHeight - boardGameState.codeRows * boardGameState.cellSize;

  ctxBoard.canvas.width = boardWidth;
  ctxBoard.canvas.height = boardHeight;
  ctxOverlay.canvas.height = boardHeight;
  ctxOverlay.canvas.width = boardWidth;
  ctxBoard.clearRect(0, 0, ctxBoard.canvas.width, ctxBoard.canvas.height);
  ctxOverlay.clearRect(0, 0, ctxOverlay.canvas.width, ctxOverlay.canvas.height);

  drawGrid(ctxBoard, boardRows, boardRows, boardGameState.cellSize, 0, isFront);

  if (!isFront) {
    drawCodeGrid(
      ctxBoard,
      boardGameState.codeRows,
      boardRows,
      boardGameState.cellSize,
      null,
      false,
      codeSectionY,
      0
    );
    const circleX = 0 * boardGameState.cellSize + boardGameState.cellSize / 2;
    const circleY =
      boardRows * boardGameState.cellSize +
      boardGameState.codeMargin +
      0 * boardGameState.cellSize +
      boardGameState.cellSize / 2;
    if (boardGameState.lockedImg) {
      drawCirclePiece(
        ctxBoard,
        circleX,
        circleY,
        boardGameState.cellSize,
        "#4466b0",
        boardGameState.lockedImg
      );
    } else {
      const newLockedImg = new window.Image();
      newLockedImg.src = "../assets/symbole_do_kodowania/img4.png";
      newLockedImg.onload = function () {
        boardGameState.lockedImg = newLockedImg;

        drawCirclePiece(
          ctxBoard,
          circleX,
          circleY,
          boardGameState.cellSize,
          "#4466b0",
          newLockedImg
        );
      };
    }

    // --- Linie przez środek planszy (tylko dla back) ---
    ctxBoard.save();
    ctxBoard.strokeStyle = "#ff0000";
    ctxBoard.lineWidth = 2;

    const midCol = boardRows / 2;
    const midRow = boardRows / 2;

    // pionowa linia przez środek
    ctxBoard.beginPath();
    ctxBoard.moveTo(midCol * boardGameState.cellSize, 0);
    ctxBoard.lineTo(
      midCol * boardGameState.cellSize,
      boardHeight - 4 * boardGameState.cellSize
    );
    ctxBoard.stroke();

    // pozioma linia przez środek
    ctxBoard.beginPath();
    ctxBoard.moveTo(0, midRow * boardGameState.cellSize);
    ctxBoard.lineTo(boardWidth, midRow * boardGameState.cellSize);
    ctxBoard.stroke();

    ctxBoard.restore();
  }

  drawPicture(ctxBoard, 0, 0, pieces);
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

    // Dodaj gumkę tylko w sekcji Kolorowe piksele i tylko na drugiej stronie maty
    if (!boardGameState.isFront && section.name === "Kolorowe piksele") {
      const eraserBtn = document.createElement("button");
      eraserBtn.className = "imgButton";
      eraserBtn.title = "Gumka";
      eraserBtn.style.width = "75px";
      eraserBtn.style.height = "75px";
      eraserBtn.style.borderRadius = "0";
      eraserBtn.style.border = "2px solid #333";
      eraserBtn.style.position = "relative";
      eraserBtn.style.margin = "5px";
      eraserBtn.style.background = "#eee";
      eraserBtn.innerHTML = "<span style='font-size:32px;'>🧽</span>";
      eraserBtn.onclick = () => {
        boardGameState.dragging = { isEraser: true };
        boardGameState.isPainting = false;
        boardGameState.paintColor = null;
      };
      imagesDiv.appendChild(eraserBtn);
    }
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

export function drawLabels(board) {
  // Oś Y
  const yAxis = document.getElementById("yAxis");
  yAxis.innerHTML = "";
  yAxis.style.height =
    board.height +
    boardGameState.cellSize * (boardGameState.codeRows + 1) +
    "px";
  let k = 1;
  for (
    let i = 1;
    i <= boardGameState.backSizeRows + boardGameState.codeRows + 1;
    i++
  ) {
    const div = createElement();
    if (i > boardGameState.backSizeRows + 1) {
      div.textContent = "K" + k;
      k++;
    } else {
      if (i !== boardGameState.backSizeRows + 1) div.textContent = i;
    }
    div.style.height = board.height / boardGameState.backSizeRows + "px";
    div.style.width = "28px";
    yAxis.appendChild(div);
  }

  // Oś X
  const xAxis = document.getElementById("xAxis");
  xAxis.innerHTML = "";
  xAxis.style.width = board.width + "px";
  for (let i = 0; i < boardGameState.backSizeRows; i++) {
    const div = createElement();
    div.textContent = String.fromCharCode(65 + i);
    div.style.width = board.width / boardGameState.backSizeRows + "px";
    xAxis.appendChild(div);
  }

  const showAxes = !boardGameState.isFront;
  yAxis.style.display = showAxes ? "flex" : "none";
  xAxis.style.display = showAxes ? "flex" : "none";

  function createElement() {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.fontWeight = "bold";
    div.style.fontSize = "16px";
    div.style.color = "#4a6792";
    return div;
  }
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
  boardGameState.dragging = {
    color: item.color,
    img: item.img,
    x: 0,
    y: 0,
    isCodingDisc: item.isCodingDisc ? true : false,
    isPixel: !!item.isPixel,
  };
}

function drawAxes(
  ctx,
  sizeRows,
  codeRows,
  margin,
  cellSize,
  codeSectionY,
  coordToPrint
) {
  ctx.save();
  ctx.font = "bold 20px Arial";
  ctx.fillStyle = "#4a6792";
  ctx.textAlign = "center";

  // Oś X
  for (let c = 0; c < sizeRows; c++) {
    const x = margin + c * cellSize + cellSize / 2;
    ctx.fillText(String.fromCharCode(65 + c), x, 30);
  }

  ctx.textAlign = "right";
  // Oś Y (plansza)
  for (let r = 0; r < sizeRows; r++) {
    const y = margin + r * cellSize + cellSize / 2 + 7;
    ctx.fillText((r + 1).toString(), 35, y);
  }
  // Oś Y (sekcja kodowania)
  if (!coordToPrint) {
    for (let r = 0; r < codeRows; r++) {
      const y = margin + codeSectionY + r * cellSize + cellSize / 2 + 7;
      ctx.fillText(`K${r + 1}`, 35, y);
    }
  }
  ctx.restore();
}

function drawGrid(ctx, rows, cols, cellSize, marginForAxes, isFront) {
  ctx.save();

  let x, y, color;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isFront) {
        const blockRow = Math.floor(r / 3);
        const blockCol = Math.floor(c / 3);
        color = blockColors?.[blockRow]?.[blockCol] ?? "#fff";

        x = marginForAxes + c * cellSize + cellSize / 2;
        y = marginForAxes + r * cellSize + cellSize / 2;
        drawCell(ctx, x, y, cellSize, color, true);
      } else {
        x = marginForAxes + c * cellSize;
        y = marginForAxes + r * cellSize;
        if (c === rows - 1) {
          if (marginForAxes === 0) {
            x = x - 2;
          } else {
            x = x - 1;
          }
        }
        if (r === rows - 1) {
          if (marginForAxes === 0) {
            y = y - 2;
          } else {
            y = y - 1;
          }
        }
        drawCell(ctx, x + 1, y + 1, cellSize, null, false);
      }
    }
  }

  ctx.restore();
}

function drawCodeGrid(
  ctxBoard,
  codeRows,
  boardRows,
  cellSize,
  color,
  arc,
  codeSectionY,
  codeSectionX
) {
  for (let r = 0; r < codeRows; r++) {
    for (let c = 0; c < boardRows; c++) {
      let x = codeSectionX + c * cellSize;
      let y = codeSectionY + r * cellSize;
      if (c === boardRows - 1) x = x - 2;
      drawCell(ctxBoard, x + 1, y - 1, cellSize, color, arc);
    }
  }
}

function drawPicture(ctx, marginForAxesX, marginForAxesY, pieces) {
  if (boardGameState.isFront) {
    // Na stronie front: wszystkie elementy jako krążki
    for (let p of pieces) {
      const img = p.img ? boardGameState.loadedImages[p.img] : null;
      drawCirclePiece(
        ctx,
        p.x + marginForAxesX,
        p.y + marginForAxesY,
        boardGameState.cellSize,
        p.color,
        img
      );
    }
  } else {
    // Na stronie back najpierw piksele, potem krążki
    for (let p of pieces) {
      if (!p.isPixel) continue;
      const img = p.img ? boardGameState.loadedImages[p.img] : null;
      drawSquarePiece(
        ctx,
        p.x + marginForAxesX,
        p.y + marginForAxesY,
        boardGameState.cellSize,
        p.color,
        img
      );
    }
    for (let p of pieces) {
      if (p.isPixel) continue;
      const img = p.img ? boardGameState.loadedImages[p.img] : null;
      drawCirclePiece(
        ctx,
        p.x + marginForAxesX,
        p.y + marginForAxesY,
        boardGameState.cellSize,
        p.color,
        img
      );
    }
  }
}

async function addCoordinatesToPdf(pdf, coordToPrint, pdfH, pdfW, imgH) {
  const startY = 30 + imgH + 20; // początek pod kratownicą
  const iconSize = 14; // mm
  const pdfTextSize = 10;
  const maxListY = pdfH - 5; // dolny margines strony
  const colW = pdfW / 2; // szerokość jednej kolumny
  const iconX1 = 5; // lewa kolumna
  const textX1 = iconX1 + iconSize + 2;
  const iconX2 = colW + 5; // prawa kolumna
  const textX2 = iconX2 + iconSize + 2;
  const rowHeight = iconSize + 1; // minimalna wysokość elementu

  // --- LEWA KOLUMNA ---
  let currentY1 = startY;
  for (let i = 0; i < coordToPrint.length; i += 2) {
    const group1 = coordToPrint[i];
    let textLines1 = group1
      ? wrapText(pdf, group1.coords, colW - iconSize - 15)
      : [];
    let idx1 = 0;
    let firstPage1 = true;
    while (idx1 < textLines1.length) {
      let maxLines1 = firstPage1
        ? Math.floor(
            (maxListY - currentY1 - iconSize / 1.5) / (pdfTextSize * 0.5)
          )
        : Math.floor((maxListY - currentY1) / (pdfTextSize * 0.5));
      if (maxLines1 < 1) {
        pdf.addPage();
        currentY1 = 30;
        firstPage1 = false;
        continue;
      }
      let linesLeft1 = textLines1.length - idx1;
      let linesToDraw1 = Math.max(1, Math.min(linesLeft1, maxLines1));
      if (firstPage1 && group1) {
        const discImgData1 = await createDiscImage(
          group1.img,
          group1.color,
          60
        );
        pdf.addImage(
          discImgData1,
          "PNG",
          iconX1,
          currentY1,
          iconSize,
          iconSize
        );
      }
      pdf.setFontSize(pdfTextSize);
      pdf.setTextColor("#4a6792");
      for (let l = 0; l < linesToDraw1; l++) {
        pdf.text(
          textLines1[idx1 + l],
          textX1,
          currentY1 -
            1 +
            (firstPage1 ? iconSize / 1.5 : 0) +
            l * pdfTextSize * 0.5
        );
      }
      currentY1 +=
        Math.max(
          rowHeight,
          (firstPage1 ? iconSize : 0) + (linesToDraw1 - 1) * pdfTextSize * 0.5
        ) + 2;
      idx1 += linesToDraw1;
      firstPage1 = false;
    }
  }

  // --- PRAWA KOLUMNA ---
  if (pdf.setPage) pdf.setPage(1); // jsPDF >=2.0
  let pageNum = 1;
  let currentY2 = startY;
  for (let i = 0; i < coordToPrint.length; i += 2) {
    const group2 = coordToPrint[i + 1];
    let textLines2 = group2
      ? wrapText(pdf, group2.coords, colW - iconSize - 15)
      : [];
    let idx2 = 0;
    let firstPage2 = true;
    while (idx2 < textLines2.length) {
      let maxLines2 = firstPage2
        ? Math.floor(
            (maxListY - currentY2 - iconSize / 1.5) / (pdfTextSize * 0.5)
          )
        : Math.floor((maxListY - currentY2) / (pdfTextSize * 0.5));
      if (maxLines2 < 1) {
        // Sprawdź czy kolejna strona już istnieje
        if (pageNum < pdf.getNumberOfPages()) {
          pageNum++;
          if (pdf.setPage) pdf.setPage(pageNum);
        } else {
          pdf.addPage();
          pageNum++;
          if (pdf.setPage) pdf.setPage(pageNum);
        }
        currentY2 = 30;
        firstPage2 = false;
        continue;
      }
      let linesLeft2 = textLines2.length - idx2;
      let linesToDraw2 = Math.max(1, Math.min(linesLeft2, maxLines2));
      if (firstPage2 && group2) {
        const discImgData2 = await createDiscImage(
          group2.img,
          group2.color,
          60
        );
        pdf.addImage(
          discImgData2,
          "PNG",
          iconX2,
          currentY2,
          iconSize,
          iconSize
        );
      }
      pdf.setFontSize(pdfTextSize);
      pdf.setTextColor("#4a6792");
      for (let l = 0; l < linesToDraw2; l++) {
        pdf.text(
          textLines2[idx2 + l],
          textX2,
          currentY2 -
            1 +
            (firstPage2 ? iconSize / 1.5 : 0) +
            l * pdfTextSize * 0.5
        );
      }
      currentY2 +=
        Math.max(
          rowHeight,
          (firstPage2 ? iconSize : 0) + (linesToDraw2 - 1) * pdfTextSize * 0.5
        ) + 2;
      idx2 += linesToDraw2;
      firstPage2 = false;
    }
  }
}

export async function drawPdfFile(coordToPrint) {
  const isFront = boardGameState.isFront;

  const sizeRows = isFront
    ? boardGameState.frontSizeRows
    : boardGameState.backSizeRows;

  const codeRows = boardGameState.codeRows;
  const boardWidth = sizeRows * boardGameState.cellSize;
  const boardHeight = coordToPrint
    ? (sizeRows - 4) * boardGameState.cellSize
    : sizeRows * boardGameState.cellSize;
  const codeSectionY = boardHeight + boardGameState.codeMargin;
  const codeSectionHeight = codeRows * boardGameState.cellSize;
  const marginForAxes = !isFront ? 40 : 0;

  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = boardWidth + marginForAxes;
  tmpCanvas.height =
    boardHeight + boardGameState.codeMargin + codeSectionHeight + marginForAxes;
  const tmpCtx = tmpCanvas.getContext("2d");

  tmpCtx.fillStyle = "#fff";
  tmpCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);

  if (!isFront) {
    drawAxes(
      tmpCtx,
      sizeRows,
      codeRows,
      marginForAxes,
      boardGameState.cellSize,
      codeSectionY,
      coordToPrint
    );
  }

  drawGrid(
    tmpCtx,
    sizeRows,
    sizeRows,
    boardGameState.cellSize,
    marginForAxes,
    isFront
  );
  if (isFront) {
    // --- RAMKA WOKÓŁ SIATKI ---
    tmpCtx.save();
    tmpCtx.lineWidth = 2;
    tmpCtx.strokeStyle = "#000";
    tmpCtx.strokeRect(marginForAxes, marginForAxes, boardWidth, boardHeight);
    tmpCtx.restore();
  }
  if (!isFront) {
    // --- Linie przez środek planszy (tylko dla back) ---
    tmpCtx.save();
    tmpCtx.strokeStyle = "#ff0000";
    tmpCtx.lineWidth = 2;

    const midCol = sizeRows / 2;
    const midRow = sizeRows / 2;

    // pionowa linia przez środek
    tmpCtx.beginPath();
    tmpCtx.moveTo(
      midCol * boardGameState.cellSize + marginForAxes,
      marginForAxes
    );
    tmpCtx.lineTo(
      midCol * boardGameState.cellSize + marginForAxes,
      sizeRows * boardGameState.cellSize + marginForAxes
    );
    tmpCtx.stroke();

    // pozioma linia przez środek
    tmpCtx.beginPath();
    tmpCtx.moveTo(
      marginForAxes,
      midRow * boardGameState.cellSize + marginForAxes
    );
    tmpCtx.lineTo(
      boardWidth + marginForAxes,
      midRow * boardGameState.cellSize + 40
    );
    tmpCtx.stroke();

    tmpCtx.restore();
  }

  // --- RYSOWANIE SEKCJI KODOWANIA (tylko back) ---
  if (!isFront && !coordToPrint) {
    drawCodeGrid(
      tmpCtx,
      codeRows,
      sizeRows,
      boardGameState.cellSize,
      null,
      false,
      marginForAxes + codeSectionY,
      marginForAxes
    );

    if (boardGameState.lockedImg) {
      const x = marginForAxes + boardGameState.cellSize / 2;
      const y =
        marginForAxes +
        sizeRows * boardGameState.cellSize +
        boardGameState.codeMargin +
        boardGameState.cellSize / 2;
      drawCirclePiece(
        tmpCtx,
        x,
        y,
        boardGameState.cellSize,
        "#4466b0",
        boardGameState.lockedImg
      );
    }
  }

  // --- RYSOWANIE KRĄŻKÓW/PIXELI ---
  if (!coordToPrint) {
    const pieces = isFront
      ? boardGameState.piecesFront
      : boardGameState.piecesGrid;

    drawPicture(tmpCtx, marginForAxes, marginForAxes, pieces);
  }

  // Zamień canvas na obrazek
  const imgData = tmpCanvas.toDataURL("image/png");
  const pdfW = 210;
  const pdfH = 297;

  // Obrazek na 70% szerokości strony
  const imgW = coordToPrint ? pdfW * 0.7 : pdfW * 0.9;
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

  if (!isFront && coordToPrint && coordToPrint.length > 0)
    await addCoordinatesToPdf(pdf, coordToPrint, pdfH, pdfW, imgH);

  pdf.save(`${!coordToPrint ? "plansza" : "koordynaty"}.pdf`);
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
    drawSquarePiece(ctx, size / 2, size / 2, size * 0.8, color);
  }
  return canvas.toDataURL("image/png");
}
