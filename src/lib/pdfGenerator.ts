import jsPDF from 'jspdf';
import {
  PDF_COLORS,
  formatPdfDate,
  drawHeader,
  drawSectionHeader,
  drawFooter,
  drawDocumentRef,
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

  // Branded header
  drawHeader(doc, 'PURCHASE RECEIPT', 'SLRP Official Store');

  // Document reference
  let yPos = 50;
  yPos = drawDocumentRef(doc, data.orderNumber, yPos, margin);

  // Order & Customer Info Box
  yPos += 2;
  const boxHeight = 28;
  doc.setFillColor(...PDF_COLORS.lightBg);
  doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, 'F');
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, 'S');

  // Order Number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text('Order Number', margin + 5, yPos + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(data.orderNumber, margin + 5, yPos + 13);

  // Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text('Date', margin + 5, yPos + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(formatPdfDate(data.date), margin + 5, yPos + 25);

  // Customer
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text('Customer', margin + 90, yPos + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(data.customerName, margin + 90, yPos + 13);
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text(data.customerEmail, margin + 90, yPos + 20);

  // Items Table
  yPos += boxHeight + 8;
  yPos = drawSectionHeader(doc, 'Order Items', yPos, margin, contentWidth);

  // Table header
  doc.setFillColor(...PDF_COLORS.headerBg);
  doc.rect(margin, yPos, contentWidth, 8, 'F');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, yPos, 2, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Item', margin + 5, yPos + 5.5);
  doc.text('Qty', margin + 105, yPos + 5.5);
  doc.text('Unit Price', margin + 125, yPos + 5.5);
  doc.text('Total', margin + contentWidth - 18, yPos + 5.5);

  yPos += 10;
  doc.setTextColor(...PDF_COLORS.text);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  data.items.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(...PDF_COLORS.lightBg);
      doc.rect(margin, yPos - 4, contentWidth, 9, 'F');
    }

    doc.setTextColor(...PDF_COLORS.text);
    doc.text(item.name, margin + 5, yPos);
    doc.text(item.quantity.toString(), margin + 108, yPos);
    doc.text(formatCurrency(item.price, data.currency), margin + 125, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(item.price * item.quantity, data.currency), margin + contentWidth - 18, yPos);
    doc.setFont('helvetica', 'normal');

    yPos += 10;
  });

  // Divider
  yPos += 3;
  doc.setDrawColor(...PDF_COLORS.accent);
  doc.setLineWidth(0.5);
  doc.line(margin + 90, yPos, margin + contentWidth, yPos);

  // Subtotal
  yPos += 8;
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
    doc.text(`Discount (${data.discount}%):`, margin + 110, yPos);
    doc.text('-' + formatCurrency(data.subtotal * (data.discount / 100), data.currency), margin + contentWidth - 5, yPos, { align: 'right' });
  }

  // Total
  yPos += 10;
  doc.setFillColor(...PDF_COLORS.accent);
  doc.roundedRect(margin + 100, yPos - 5, contentWidth - 100, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL:', margin + 112, yPos + 3);
  doc.text(formatCurrency(data.total, data.currency), margin + contentWidth - 8, yPos + 3, { align: 'right' });

  // Thank you message
  yPos += 25;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('Thank you for your purchase!', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 7;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text('This is an electronic receipt. No signature required.', pageWidth / 2, yPos, { align: 'center' });

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
