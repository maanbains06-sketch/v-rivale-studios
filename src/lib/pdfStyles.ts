import jsPDF from 'jspdf';

// ============= SLRP Premium PDF Styling System =============
// High-end professional styling for all PDF downloads

// Brand Colors
export const PDF_COLORS = {
  // Primary brand
  headerBg: [15, 18, 28] as [number, number, number],
  headerBg2: [25, 32, 48] as [number, number, number],
  accent: [0, 210, 190] as [number, number, number],
  accentDark: [0, 160, 145] as [number, number, number],
  accentGlow: [0, 230, 210] as [number, number, number],
  gold: [218, 165, 32] as [number, number, number],
  goldLight: [255, 215, 80] as [number, number, number],
  
  // India tricolor for decorative borders
  saffron: [255, 153, 51] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  green: [19, 136, 8] as [number, number, number],
  
  // Status
  success: [34, 197, 94] as [number, number, number],
  error: [239, 68, 68] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  info: [59, 130, 246] as [number, number, number],
  
  // Neutrals
  text: [20, 20, 30] as [number, number, number],
  textSecondary: [100, 105, 115] as [number, number, number],
  lightBg: [245, 246, 250] as [number, number, number],
  lightBg2: [235, 238, 245] as [number, number, number],
  border: [210, 215, 225] as [number, number, number],
  borderLight: [230, 232, 238] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
};

export const getStatusColor = (status: string): [number, number, number] => {
  switch (status) {
    case 'approved': return PDF_COLORS.success;
    case 'rejected': return PDF_COLORS.error;
    case 'on_hold': return PDF_COLORS.warning;
    case 'closed': return PDF_COLORS.textSecondary;
    default: return PDF_COLORS.accent;
  }
};

export const formatPdfDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatPdfDateShort = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Draw decorative corner brackets (premium touch)
 */
const drawCornerBrackets = (
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  size: number = 6,
  color: [number, number, number] = PDF_COLORS.accent
) => {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.6);
  // Top-left
  doc.line(x, y + size, x, y); doc.line(x, y, x + size, y);
  // Top-right
  doc.line(x + w - size, y, x + w, y); doc.line(x + w, y, x + w, y + size);
  // Bottom-left
  doc.line(x, y + h - size, x, y + h); doc.line(x, y + h, x + size, y + h);
  // Bottom-right
  doc.line(x + w - size, y + h, x + w, y + h); doc.line(x + w, y + h - size, x + w, y + h);
};

/**
 * Draw the premium SLRP branded header
 */
export const drawHeader = (
  doc: jsPDF,
  title: string,
  subtitle?: string
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Layered dark header background for depth
  doc.setFillColor(...PDF_COLORS.headerBg);
  doc.rect(0, 0, pageWidth, 48, 'F');
  
  // Subtle lighter band at bottom of header
  doc.setFillColor(...PDF_COLORS.headerBg2);
  doc.rect(0, 36, pageWidth, 12, 'F');
  
  // Side accent bars (left & right)
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(0, 0, 3, 48, 'F');
  doc.rect(pageWidth - 3, 0, 3, 48, 'F');
  
  // India tricolor stripe (premium - 3 clean bars)
  const stripeHeight = 2;
  const stripeY = 48;
  doc.setFillColor(...PDF_COLORS.saffron);
  doc.rect(0, stripeY, pageWidth / 3, stripeHeight, 'F');
  doc.setFillColor(...PDF_COLORS.white);
  doc.rect(pageWidth / 3, stripeY, pageWidth / 3, stripeHeight, 'F');
  doc.setFillColor(...PDF_COLORS.green);
  doc.rect((pageWidth / 3) * 2, stripeY, pageWidth / 3 + 1, stripeHeight, 'F');
  
  // Decorative horizontal line under SKYLIFE
  doc.setDrawColor(...PDF_COLORS.accent);
  doc.setLineWidth(0.3);
  const lineW = 50;
  doc.line(pageWidth / 2 - lineW, 18, pageWidth / 2 - 8, 18);
  doc.line(pageWidth / 2 + 8, 18, pageWidth / 2 + lineW, 18);
  
  // Small diamond in center of decorative line
  const cx = pageWidth / 2;
  doc.setFillColor(...PDF_COLORS.accent);
  doc.triangle(cx, 16.5, cx - 1.5, 18, cx, 19.5, 'F');
  doc.triangle(cx, 16.5, cx + 1.5, 18, cx, 19.5, 'F');
  
  // Logo text
  doc.setTextColor(...PDF_COLORS.accentGlow);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('SKYLIFE ROLEPLAY', pageWidth / 2, 14, { align: 'center' });
  
  // "INDIA" in tricolor with letter spacing
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const letters = [
    { char: 'I', color: PDF_COLORS.saffron },
    { char: 'N', color: PDF_COLORS.white },
    { char: 'D', color: PDF_COLORS.white },
    { char: 'I', color: PDF_COLORS.green },
    { char: 'A', color: PDF_COLORS.accentGlow },
  ];
  let letterX = pageWidth / 2 - 12;
  letters.forEach(l => {
    doc.setTextColor(...l.color);
    doc.text(l.char, letterX, 26, { align: 'center' });
    letterX += 6;
  });
  
  // Document title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, 35, { align: 'center' });
  
  // Subtitle
  if (subtitle) {
    doc.setFontSize(8);
    doc.setTextColor(160, 165, 180);
    doc.setFont('helvetica', 'italic');
    doc.text(subtitle, pageWidth / 2, 43, { align: 'center' });
  }
};

/**
 * Draw a premium section header bar with accent and icon support
 */
export const drawSectionHeader = (
  doc: jsPDF,
  title: string,
  yPos: number,
  margin: number = 15,
  contentWidth?: number
): number => {
  const cw = contentWidth || doc.internal.pageSize.getWidth() - margin * 2;
  
  // Accent bar on left (taller for premium feel)
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, yPos, 3, 9, 'F');
  
  // Header background with slight gradient effect (2-layer)
  doc.setFillColor(...PDF_COLORS.headerBg);
  doc.rect(margin + 3, yPos, cw - 3, 9, 'F');
  doc.setFillColor(...PDF_COLORS.headerBg2);
  doc.rect(margin + 3, yPos + 6, cw - 3, 3, 'F');
  
  // Right accent decoration
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin + cw - 20, yPos, 20, 1, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), margin + 8, yPos + 6.2);
  
  return yPos + 12;
};

/**
 * Draw an info box (key-value pairs in a styled container)
 */
export const drawInfoBox = (
  doc: jsPDF,
  fields: { label: string; value: string; color?: [number, number, number] }[],
  yPos: number,
  margin: number = 15
): number => {
  const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;
  const lineHeight = 8;
  const boxHeight = Math.ceil(fields.length / 2) * lineHeight + 6;
  
  // Background
  doc.setFillColor(...PDF_COLORS.lightBg);
  doc.roundedRect(margin, yPos, contentWidth, boxHeight, 3, 3, 'F');
  
  // Border
  doc.setDrawColor(...PDF_COLORS.borderLight);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, contentWidth, boxHeight, 3, 3, 'S');
  
  // Corner brackets
  drawCornerBrackets(doc, margin + 2, yPos + 2, contentWidth - 4, boxHeight - 4, 4, PDF_COLORS.accent);
  
  const halfWidth = contentWidth / 2;
  let row = 0;
  
  fields.forEach((field, i) => {
    const col = i % 2;
    if (i > 0 && col === 0) row++;
    
    const x = margin + 8 + col * halfWidth;
    const y = yPos + 9 + row * lineHeight;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...PDF_COLORS.textSecondary);
    doc.text(field.label.toUpperCase(), x, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...(field.color || PDF_COLORS.text));
    doc.text(String(field.value || 'N/A'), x, y + 4.5);
  });
  
  return yPos + boxHeight + 5;
};

/**
 * Draw a form-style field with label and value
 */
export const drawFormField = (
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  labelWidth: number = 42
) => {
  // Label cell
  doc.setFillColor(...PDF_COLORS.lightBg2);
  doc.rect(x, y, labelWidth, 8, 'F');
  
  // Full border
  doc.setDrawColor(...PDF_COLORS.borderLight);
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, 8);
  doc.line(x + labelWidth, y, x + labelWidth, y + 8);
  
  // Label
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text(label.toUpperCase(), x + 3, y + 5.5);
  
  // Value
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(value || '', x + labelWidth + 3, y + 5.5);
};

/**
 * Draw a premium detail field with card-like styling
 */
export const drawDetailField = (
  doc: jsPDF,
  label: string,
  value: string,
  yPos: number,
  margin: number = 15
): number => {
  const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = yPos;
  
  // Check page break
  if (y > pageHeight - 30) {
    doc.addPage();
    y = 20;
  }
  
  // Label bar with accent indicator
  doc.setFillColor(...PDF_COLORS.lightBg2);
  doc.rect(margin, y - 3.5, contentWidth, 0.5, 'F');
  
  // Accent dot
  doc.setFillColor(...PDF_COLORS.accent);
  doc.circle(margin + 2.5, y + 1, 1.3, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text(label.toUpperCase(), margin + 7, y + 1.5);
  y += 6;
  
  // Value with subtle left border
  doc.setDrawColor(...PDF_COLORS.borderLight);
  doc.setLineWidth(0.3);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.text);
  const val = value || 'N/A';
  
  if (val.length > 85) {
    const lines = doc.splitTextToSize(val, contentWidth - 12);
    // Left accent line for long text
    doc.setDrawColor(...PDF_COLORS.accent);
    doc.setLineWidth(0.4);
    const startY = y;
    lines.forEach((line: string) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin + 8, y);
      y += 4.5;
    });
    doc.line(margin + 4, startY - 2, margin + 4, Math.min(y - 2, pageHeight - 20));
    y += 3;
  } else {
    doc.text(val, margin + 8, y);
    y += 8;
  }
  
  return y;
};

/**
 * Draw an official-looking stamp/seal
 */
export const drawOfficialStamp = (
  doc: jsPDF,
  x: number,
  y: number,
  text: string = 'OFFICIAL',
  radius: number = 15,
  color: [number, number, number] = PDF_COLORS.accent
) => {
  // Outer circle
  doc.setDrawColor(...color);
  doc.setLineWidth(1);
  doc.circle(x, y, radius, 'S');
  
  // Inner circle
  doc.setLineWidth(0.5);
  doc.circle(x, y, radius - 2.5, 'S');
  
  // Star in center
  doc.setFillColor(...color);
  const starR = 3;
  for (let i = 0; i < 5; i++) {
    const angle1 = (i * 72 - 90) * Math.PI / 180;
    const angle2 = ((i * 72 + 36) - 90) * Math.PI / 180;
    const x1 = x + starR * Math.cos(angle1);
    const y1 = y + starR * Math.sin(angle1);
    const x2 = x + (starR * 0.4) * Math.cos(angle2);
    const y2 = y + (starR * 0.4) * Math.sin(angle2);
    doc.line(x1, y1, x2, y2);
  }
  
  // Text around the stamp
  doc.setTextColor(...color);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text(text, x, y - radius + 5.5, { align: 'center' });
  doc.text('SLRP INDIA', x, y + radius - 4, { align: 'center' });
};

/**
 * Draw a diagonal watermark across the page
 */
export const drawWatermark = (
  doc: jsPDF,
  text: string = 'SKYLIFE ROLEPLAY INDIA'
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setTextColor(220, 225, 235);
  doc.setFontSize(50);
  doc.setFont('helvetica', 'bold');
  
  // Save state
  const ctx = (doc as any).context2d;
  
  // Draw rotated watermark text
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.04 }));
  
  // Approximate diagonal text with positioning
  doc.text(text, pageWidth / 2 - 60, pageHeight / 2 + 10, {
    angle: 35,
  });
  
  doc.restoreGraphicsState();
};

/**
 * Draw premium footer on all pages
 */
export const drawFooter = (
  doc: jsPDF,
  documentType: string = 'Official Document'
) => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Watermark on every page
    drawWatermark(doc);
    
    // Footer dark bar
    doc.setFillColor(...PDF_COLORS.headerBg);
    doc.rect(0, pageHeight - 22, pageWidth, 22, 'F');
    
    // Side accent bars (matching header)
    doc.setFillColor(...PDF_COLORS.accent);
    doc.rect(0, pageHeight - 22, 3, 22, 'F');
    doc.rect(pageWidth - 3, pageHeight - 22, 3, 22, 'F');
    
    // Tricolor stripe at top of footer
    const stripeW = 40;
    const stripeX = pageWidth / 2 - stripeW / 2;
    doc.setFillColor(...PDF_COLORS.saffron);
    doc.rect(stripeX, pageHeight - 22.5, stripeW / 3, 1, 'F');
    doc.setFillColor(...PDF_COLORS.white);
    doc.rect(stripeX + stripeW / 3, pageHeight - 22.5, stripeW / 3, 1, 'F');
    doc.setFillColor(...PDF_COLORS.green);
    doc.rect(stripeX + (stripeW / 3) * 2, pageHeight - 22.5, stripeW / 3, 1, 'F');
    
    // Footer text
    doc.setFontSize(7);
    doc.setTextColor(160, 165, 180);
    doc.setFont('helvetica', 'normal');
    doc.text(`Skylife Roleplay India`, 8, pageHeight - 15);
    doc.setFontSize(6);
    doc.setTextColor(120, 125, 140);
    doc.text(documentType, 8, pageHeight - 11);
    doc.text(`Generated: ${formatPdfDate(new Date().toISOString())}`, 8, pageHeight - 7);
    
    // Page number right
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.accent);
    doc.setFont('helvetica', 'bold');
    doc.text(`${i}`, pageWidth - 12, pageHeight - 12, { align: 'center' });
    doc.setFontSize(6);
    doc.setTextColor(120, 125, 140);
    doc.setFont('helvetica', 'normal');
    doc.text(`of ${pageCount}`, pageWidth - 12, pageHeight - 8, { align: 'center' });
    
    // Confidentiality notice center
    doc.setFontSize(5.5);
    doc.setTextColor(100, 105, 120);
    doc.setFont('helvetica', 'italic');
    doc.text('This is an official electronic document of Skylife Roleplay India. Unauthorized distribution is prohibited.', pageWidth / 2, pageHeight - 4, { align: 'center' });
  }
};

/**
 * Check and handle page break, returns new yPos
 */
export const checkPageBreak = (doc: jsPDF, yPos: number, needed: number = 20): number => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (yPos + needed > pageHeight - 28) {
    doc.addPage();
    return 20;
  }
  return yPos;
};

/**
 * Draw a premium document reference bar
 */
export const drawDocumentRef = (
  doc: jsPDF,
  refId: string,
  yPos: number,
  margin: number = 15
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  
  // Subtle background bar
  doc.setFillColor(...PDF_COLORS.lightBg);
  doc.rect(margin, yPos - 3, contentWidth, 9, 'F');
  
  // Left accent
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, yPos - 3, 2, 9, 'F');
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text(`REF: ${refId}`, margin + 5, yPos + 2);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text(formatPdfDateShort(new Date().toISOString()), pageWidth - margin - 2, yPos + 2, { align: 'right' });
  
  return yPos + 10;
};

/**
 * Draw a premium summary card (for top-of-document info)
 */
export const drawSummaryCard = (
  doc: jsPDF,
  fields: { label: string; value: string; color?: [number, number, number]; bold?: boolean }[],
  yPos: number,
  margin: number = 15,
  statusBadge?: { text: string; color: [number, number, number] }
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  
  // Calculate height based on field rows (3 cols)
  const rows = Math.ceil(fields.length / 3);
  const boxHeight = rows * 16 + 8;
  
  // Card background
  doc.setFillColor(252, 253, 255);
  doc.roundedRect(margin, yPos, contentWidth, boxHeight, 3, 3, 'F');
  
  // Card border
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, contentWidth, boxHeight, 3, 3, 'S');
  
  // Top accent bar
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin + 1, yPos, contentWidth - 2, 1.5, 'F');
  
  // Corner brackets
  drawCornerBrackets(doc, margin + 3, yPos + 3, contentWidth - 6, boxHeight - 6, 5);
  
  const colWidth = (contentWidth - 16) / 3;
  let row = 0;
  
  fields.forEach((field, i) => {
    const col = i % 3;
    if (i > 0 && col === 0) row++;
    
    const x = margin + 10 + col * colWidth;
    const y = yPos + 10 + row * 16;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...PDF_COLORS.textSecondary);
    doc.text(field.label.toUpperCase(), x, y);
    
    doc.setFont('helvetica', field.bold ? 'bold' : 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...(field.color || PDF_COLORS.text));
    
    // Truncate long values
    const maxW = colWidth - 5;
    let displayVal = String(field.value || 'N/A');
    while (doc.getTextWidth(displayVal) > maxW && displayVal.length > 3) {
      displayVal = displayVal.slice(0, -4) + '...';
    }
    doc.text(displayVal, x, y + 5.5);
  });
  
  // Status badge if provided
  if (statusBadge) {
    const badgeW = 36;
    const badgeH = 9;
    const badgeX = margin + contentWidth - badgeW - 8;
    const badgeY = yPos + 6;
    
    doc.setFillColor(...statusBadge.color);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(statusBadge.text, badgeX + badgeW / 2, badgeY + 6, { align: 'center' });
  }
  
  return yPos + boxHeight + 6;
};

/**
 * Draw a styled table
 */
export const drawTable = (
  doc: jsPDF,
  headers: { label: string; x: number }[],
  rows: { values: { text: string; x: number; color?: [number, number, number]; bold?: boolean }[] }[],
  yPos: number,
  margin: number = 10
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  let y = yPos;
  
  // Table header
  doc.setFillColor(...PDF_COLORS.headerBg);
  doc.rect(margin, y, contentWidth, 9, 'F');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, y, 2, 9, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  headers.forEach(h => doc.text(h.label, h.x, y + 6.2));
  
  y += 11;
  
  rows.forEach((row, index) => {
    if (y > 268) {
      doc.addPage();
      y = 20;
      // Redraw header on new page
      doc.setFillColor(...PDF_COLORS.headerBg);
      doc.rect(margin, y, contentWidth, 9, 'F');
      doc.setFillColor(...PDF_COLORS.accent);
      doc.rect(margin, y, 2, 9, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      headers.forEach(h => doc.text(h.label, h.x, y + 6.2));
      y += 11;
    }
    
    // Alternating rows
    if (index % 2 === 0) {
      doc.setFillColor(...PDF_COLORS.lightBg);
      doc.rect(margin, y - 4, contentWidth, 8, 'F');
    }
    
    // Bottom border for each row
    doc.setDrawColor(...PDF_COLORS.borderLight);
    doc.setLineWidth(0.15);
    doc.line(margin, y + 3.5, margin + contentWidth, y + 3.5);
    
    doc.setFontSize(7);
    row.values.forEach(v => {
      doc.setTextColor(...(v.color || PDF_COLORS.text));
      doc.setFont('helvetica', v.bold ? 'bold' : 'normal');
      doc.text(v.text, v.x, y);
    });
    
    y += 8;
  });
  
  return y;
};
