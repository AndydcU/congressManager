import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generarDiplomaPDF({ nombreParticipante, titulo, subtitulo = null, descripcion = null }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]);
  
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const { width, height } = page.getSize();

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(1, 1, 1),
  });

  const borderWidth = 15;
  page.drawRectangle({
    x: borderWidth,
    y: borderWidth,
    width: width - (borderWidth * 2),
    height: height - (borderWidth * 2),
    borderColor: rgb(0.72, 0.53, 0.04), // Dorado oscuro
    borderWidth: 8,
  });

  page.drawRectangle({
    x: borderWidth + 15,
    y: borderWidth + 15,
    width: width - (borderWidth * 2) - 30,
    height: height - (borderWidth * 2) - 30,
    borderColor: rgb(0.12, 0.23, 0.53), // Azul oscuro
    borderWidth: 3,
  });

  const centerX = width / 2;
  drawCircle(page, centerX, height - 80, 35, rgb(0.12, 0.23, 0.53));
  drawCircle(page, centerX, height - 80, 30, rgb(0.72, 0.53, 0.04));
  
  page.drawText('CERTIFICADO', {
    x: centerX - 120,
    y: height - 120,
    size: 36,
    font: fontBold,
    color: rgb(0.12, 0.23, 0.53),
  });

  page.drawText('de Participación', {
    x: centerX - 85,
    y: height - 150,
    size: 20,
    font: fontItalic,
    color: rgb(0.3, 0.3, 0.3),
  });

  drawLine(page, 150, height - 170, width - 150, height - 170, rgb(0.72, 0.53, 0.04), 2);

  page.drawText('Se otorga a:', {
    x: centerX - 60,
    y: height - 210,
    size: 16,
    font: fontItalic,
    color: rgb(0.3, 0.3, 0.3),
  });

  const nombreWidth = fontBold.widthOfTextAtSize(nombreParticipante.toUpperCase(), 28);
  page.drawText(nombreParticipante.toUpperCase(), {
    x: centerX - (nombreWidth / 2),
    y: height - 250,
    size: 28,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  drawLine(page, centerX - 250, height - 260, centerX + 250, height - 260, rgb(0.5, 0.5, 0.5), 1);

  const tituloLines = wrapText(titulo, 70);
  let yPosition = height - 310;
  
  for (const line of tituloLines) {
    const lineWidth = fontNormal.widthOfTextAtSize(line, 16);
    page.drawText(line, {
      x: centerX - (lineWidth / 2),
      y: yPosition,
      size: 16,
      font: fontNormal,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPosition -= 25;
  }

  if (subtitulo) {
    const subtituloLines = wrapText(subtitulo, 80);
    for (const line of subtituloLines) {
      const lineWidth = fontItalic.widthOfTextAtSize(line, 13);
      page.drawText(line, {
        x: centerX - (lineWidth / 2),
        y: yPosition,
        size: 13,
        font: fontItalic,
        color: rgb(0.35, 0.35, 0.35),
      });
      yPosition -= 20;
    }
  }

  if (descripcion) {
    yPosition -= 10;
    const descripcionLines = wrapText(descripcion, 85);
    for (const line of descripcionLines) {
      const lineWidth = fontNormal.widthOfTextAtSize(line, 12);
      page.drawText(line, {
        x: centerX - (lineWidth / 2),
        y: yPosition,
        size: 12,
        font: fontNormal,
        color: rgb(0.4, 0.4, 0.4),
      });
      yPosition -= 18;
    }
  }

  const fechaActual = new Date().toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const fechaText = `Guatemala, ${fechaActual}`;
  const fechaWidth = fontNormal.widthOfTextAtSize(fechaText, 11);
  page.drawText(fechaText, {
    x: centerX - (fechaWidth / 2),
    y: 140,
    size: 11,
    font: fontNormal,
    color: rgb(0.4, 0.4, 0.4),
  });

  const firmaY = 100;
  drawLine(page, centerX - 150, firmaY, centerX + 150, firmaY, rgb(0.3, 0.3, 0.3), 1);

  page.drawText('Comité Organizador', {
    x: centerX - 65,
    y: firmaY - 20,
    size: 11,
    font: fontNormal,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText('Congreso de Tecnología - UMG', {
    x: centerX - 90,
    y: firmaY - 35,
    size: 10,
    font: fontItalic,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function drawCircle(page, x, y, radius, color) {
  page.drawCircle({
    x,
    y,
    size: radius,
    color,
  });
}

function drawLine(page, x1, y1, x2, y2, color, thickness) {
  page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness,
    color,
  });
}

function wrapText(text, maxCharsPerLine) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines;
}
