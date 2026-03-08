import jsPDF from 'jspdf';

// ============= SLRP Branded PDF Styling System =============
// Consistent professional styling for all PDF downloads

// Brand Colors
export const PDF_COLORS = {
  // Primary brand
  headerBg: [20, 25, 35] as [number, number, number],
  accent: [0, 200, 180] as [number, number, number],       // Cyan/teal accent
  accentDark: [0, 160, 145] as [number, number, number],
  
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
  border: [210, 215, 225] as [number, number, number],
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
 * Draw the standard SLRP branded header on the current page
 */
export const drawHeader = (
  doc: jsPDF,
  title: string,
  subtitle?: string
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Dark header background
  doc.setFillColor(...PDF_COLORS.headerBg);
  doc.rect(0, 0, pageWidth, 42, 'F');
  
  // India tricolor stripe
  const stripeHeight = 1.5;
  const stripeY = 42;
  doc.setFillColor(...PDF_COLORS.saffron);
  doc.rect(0, stripeY, pageWidth / 3, stripeHeight, 'F');
  doc.setFillColor(...PDF_COLORS.white);
  doc.rect(pageWidth / 3, stripeY, pageWidth / 3, stripeHeight, 'F');
  doc.setFillColor(...PDF_COLORS.green);
  doc.rect((pageWidth / 3) * 2, stripeY, pageWidth / 3 + 1, stripeHeight, 'F');
  
  // Logo text with accent glow effect
  doc.setTextColor(...PDF_COLORS.accent);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SKYLIFE ROLEPLAY', pageWidth / 2, 15, { align: 'center' });
  
  // "INDIA" in smaller accent
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.saffron);
  doc.text('I', pageWidth / 2 - 8, 23, { align: 'center' });
  doc.setTextColor(...PDF_COLORS.white);
  doc.text('N', pageWidth / 2 - 3.5, 23, { align: 'center' });
  doc.text('D', pageWidth / 2 + 1, 23, { align: 'center' });
  doc.setTextColor(...PDF_COLORS.green);
  doc.text('I', pageWidth / 2 + 5, 23, { align: 'center' });
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('A', pageWidth / 2 + 9, 23, { align: 'center' });
  
  // Document title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(title, pageWidth / 2, 32, { align: 'center' });
  
  // Subtitle
  if (subtitle) {
    doc.setFontSize(8);
    doc.setTextColor(180, 185, 195);
    doc.text(subtitle, pageWidth / 2, 38, { align: 'center' });
  }
};

/**
 * Draw a section header bar
 */
export const drawSectionHeader = (
  doc: jsPDF,
  title: string,
  yPos: number,
  margin: number = 15,
  contentWidth?: number
): number => {
  const cw = contentWidth || doc.internal.pageSize.getWidth() - margin * 2;
  
  // Accent bar on left
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, yPos, 3, 8, 'F');
  
  // Header background
  doc.setFillColor(...PDF_COLORS.headerBg);
  doc.rect(margin + 3, yPos, cw - 3, 8, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), margin + 7, yPos + 5.5);
  
  return yPos + 10;
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
  const boxHeight = Math.ceil(fields.length / 2) * lineHeight + 4;
  
  // Background
  doc.setFillColor(...PDF_COLORS.lightBg);
  doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, 'F');
  
  // Border
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, 'S');
  
  const halfWidth = contentWidth / 2;
  let row = 0;
  
  fields.forEach((field, i) => {
    const col = i % 2;
    if (i > 0 && col === 0) row++;
    
    const x = margin + 5 + col * halfWidth;
    const y = yPos + 7 + row * lineHeight;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.textSecondary);
    doc.text(field.label + ':', x, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...(field.color || PDF_COLORS.text));
    doc.text(String(field.value || 'N/A'), x + 2, y + 4);
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
  doc.setFillColor(...PDF_COLORS.lightBg);
  doc.rect(x, y, labelWidth, 8, 'F');
  
  // Full border
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, 8);
  doc.line(x + labelWidth, y, x + labelWidth, y + 8);
  
  // Label
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text(label, x + 2, y + 5.5);
  
  // Value
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(value || '', x + labelWidth + 2, y + 5.5);
};

/**
 * Draw a field label and long-form value (for application detail fields)
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
  
  // Label with accent dot
  doc.setFillColor(...PDF_COLORS.accent);
  doc.circle(margin + 2, y - 1.5, 1.2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(label, margin + 6, y);
  y += 5;
  
  // Value
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const val = value || 'N/A';
  
  if (val.length > 85) {
    const lines = doc.splitTextToSize(val, contentWidth - 8);
    lines.forEach((line: string) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin + 6, y);
      y += 4.5;
    });
    y += 2;
  } else {
    doc.text(val, margin + 6, y);
    y += 7;
  }
  
  return y;
};

/**
 * Draw standard footer on all pages
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
    
    // Footer line
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(15, pageHeight - 18, pageWidth - 15, pageHeight - 18);
    
    // Tricolor micro-stripe
    const stripeW = 30;
    const stripeX = pageWidth / 2 - stripeW / 2;
    doc.setFillColor(...PDF_COLORS.saffron);
    doc.rect(stripeX, pageHeight - 18.5, stripeW / 3, 0.8, 'F');
    doc.setFillColor(...PDF_COLORS.white);
    doc.rect(stripeX + stripeW / 3, pageHeight - 18.5, stripeW / 3, 0.8, 'F');
    doc.setFillColor(...PDF_COLORS.green);
    doc.rect(stripeX + (stripeW / 3) * 2, pageHeight - 18.5, stripeW / 3, 0.8, 'F');
    
    // Footer text
    doc.setFontSize(7);
    doc.setTextColor(...PDF_COLORS.textSecondary);
    doc.setFont('helvetica', 'normal');
    doc.text(`Skylife Roleplay India — ${documentType}`, 15, pageHeight - 13);
    doc.text(`Generated: ${formatPdfDate(new Date().toISOString())}`, 15, pageHeight - 9);
    
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, pageHeight - 11, { align: 'right' });
    
    // Confidentiality notice
    doc.setFontSize(6);
    doc.setTextColor(170, 175, 185);
    doc.setFont('helvetica', 'italic');
    doc.text('This is an official electronic document of Skylife Roleplay India. Unauthorized distribution is prohibited.', pageWidth / 2, pageHeight - 5, { align: 'center' });
  }
};

/**
 * Check and handle page break, returns new yPos
 */
export const checkPageBreak = (doc: jsPDF, yPos: number, needed: number = 20): number => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (yPos + needed > pageHeight - 25) {
    doc.addPage();
    return 20;
  }
  return yPos;
};

/**
 * Draw a watermark-style document reference
 */
export const drawDocumentRef = (
  doc: jsPDF,
  refId: string,
  yPos: number,
  margin: number = 15
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text(`Document Ref: ${refId}`, margin, yPos);
  doc.text(`Date: ${formatPdfDateShort(new Date().toISOString())}`, pageWidth - margin, yPos, { align: 'right' });
  
  return yPos + 6;
};
