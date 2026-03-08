import jsPDF from 'jspdf';
import {
  PDF_COLORS,
  formatPdfDate,
  drawHeader,
  drawSectionHeader,
  drawFooter,
  drawDocumentRef,
  drawSummaryCard,
  drawOfficialStamp,
} from './pdfStyles';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface ReceiptData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  currency: string;
  date: string;
  discount?: number;
}

export const generateReceiptPDF = (data: ReceiptData) => {
  const doc = new jsPDF();
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  // Premium branded header
  drawHeader(doc, 'PURCHASE RECEIPT', 'SLRP Official Store — Digital Receipt');

  // Document reference
  let yPos = 56;
  yPos = drawDocumentRef(doc, data.orderNumber, yPos, margin);

  // Premium summary card
  yPos = drawSummaryCard(doc, [
    { label: 'Order Number', value: data.orderNumber, bold: true },
    { label: 'Customer', value: data.customerName, bold: true },
    { label: 'Date', value: formatPdfDate(data.date) },
    { label: 'Email', value: data.customerEmail },
    { label: 'Items', value: String(data.items.length) },
    { label: 'Currency', value: data.currency },
  ], yPos, margin);

  // Items Table section
  yPos = drawSectionHeader(doc, 'Order Items', yPos, margin, contentWidth);

  // Table header
  doc.setFillColor(...PDF_COLORS.headerBg);
  doc.rect(margin, yPos, contentWidth, 9, 'F');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, yPos, 2, 9, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Item', margin + 6, yPos + 6.2);
  doc.text('Qty', margin + 105, yPos + 6.2);
  doc.text('Unit Price', margin + 122, yPos + 6.2);
  doc.text('Total', margin + contentWidth - 15, yPos + 6.2);

  yPos += 11;
  doc.setFontSize(9);

  data.items.forEach((item, index) => {
    // Alternating rows
    if (index % 2 === 0) {
      doc.setFillColor(...PDF_COLORS.lightBg);
      doc.rect(margin, yPos - 4.5, contentWidth, 10, 'F');
    }
    
    // Bottom border
    doc.setDrawColor(...PDF_COLORS.borderLight);
    doc.setLineWidth(0.15);
    doc.line(margin, yPos + 5, margin + contentWidth, yPos + 5);

    doc.setTextColor(...PDF_COLORS.text);
    doc.setFont('helvetica', 'normal');
    doc.text(item.name, margin + 6, yPos);
    doc.text(item.quantity.toString(), margin + 108, yPos);
    doc.text(formatCurrency(item.price, data.currency), margin + 122, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(item.price * item.quantity, data.currency), margin + contentWidth - 15, yPos);

    yPos += 10;
  });

  // Divider
  yPos += 4;
  doc.setDrawColor(...PDF_COLORS.accent);
  doc.setLineWidth(0.6);
  doc.line(margin + 85, yPos, margin + contentWidth, yPos);

  // Subtotal
  yPos += 9;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text('Subtotal:', margin + 110, yPos);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(formatCurrency(data.subtotal, data.currency), margin + contentWidth - 5, yPos, { align: 'right' });

  // Discount
  if (data.discount && data.discount > 0) {
    yPos += 7;
    doc.setTextColor(...PDF_COLORS.success);
    doc.setFont('helvetica', 'bold');
    doc.text(`Discount (${data.discount}%):`, margin + 110, yPos);
    doc.text('-' + formatCurrency(data.subtotal * (data.discount / 100), data.currency), margin + contentWidth - 5, yPos, { align: 'right' });
  }

  // Total — premium styled
  yPos += 12;
  doc.setFillColor(...PDF_COLORS.headerBg);
  doc.roundedRect(margin + 90, yPos - 6, contentWidth - 90, 14, 3, 3, 'F');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin + 90, yPos - 6, 3, 14, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL', margin + 102, yPos + 3);
  doc.setTextColor(...PDF_COLORS.accentGlow);
  doc.text(formatCurrency(data.total, data.currency), margin + contentWidth - 8, yPos + 3, { align: 'right' });

  // Thank you section
  yPos += 28;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('Thank you for your purchase!', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 7;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text('This is an electronic receipt. No signature required.', pageWidth / 2, yPos, { align: 'center' });

  // Official stamp
  drawOfficialStamp(doc, pageWidth - margin - 20, yPos + 20, 'PAID');

  drawFooter(doc, 'Store Receipt');
  doc.save(`SLRP-Receipt-${data.orderNumber}.pdf`);
};

const formatCurrency = (amount: number, currency: string): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    CAD: 'C$',
    AUD: 'A$',
  };

  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
};
