import jsPDF from 'jspdf';

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
  
  // Set colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const textColor: [number, number, number] = [30, 30, 30];
  const lightGray: [number, number, number] = [240, 240, 240];
  
  // Header - Company Logo/Name
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('SLRP STORE', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Summer Life Roleplay', 105, 30, { align: 'center' });
  
  // Receipt Title
  doc.setTextColor(...textColor);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PURCHASE RECEIPT', 105, 55, { align: 'center' });
  
  // Order Details Box
  let yPos = 70;
  doc.setFillColor(...lightGray);
  doc.rect(15, yPos, 180, 35, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  
  // Order Info
  doc.text('Order Number:', 20, yPos + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.orderNumber, 70, yPos + 10);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 20, yPos + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(data.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }), 70, yPos + 20);
  
  // Customer Info
  doc.setFont('helvetica', 'bold');
  doc.text('Customer:', 20, yPos + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customerName, 70, yPos + 30);
  
  // Items Table Header
  yPos = 120;
  doc.setFillColor(...primaryColor);
  doc.rect(15, yPos, 180, 10, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Item', 20, yPos + 7);
  doc.text('Qty', 130, yPos + 7);
  doc.text('Price', 155, yPos + 7);
  doc.text('Total', 180, yPos + 7);
  
  // Items
  yPos += 15;
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  data.items.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(...lightGray);
      doc.rect(15, yPos - 5, 180, 10, 'F');
    }
    
    doc.text(item.name, 20, yPos);
    doc.text(item.quantity.toString(), 135, yPos);
    doc.text(formatCurrency(item.price, data.currency), 155, yPos);
    doc.text(formatCurrency(item.price * item.quantity, data.currency), 180, yPos);
    
    yPos += 12;
  });
  
  // Summary Section
  yPos += 10;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, 195, yPos);
  
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  // Subtotal
  doc.text('Subtotal:', 140, yPos);
  doc.text(formatCurrency(data.subtotal, data.currency), 180, yPos, { align: 'right' });
  
  // Discount if applicable
  if (data.discount && data.discount > 0) {
    yPos += 10;
    doc.setTextColor(0, 150, 0);
    doc.text(`Discount (${data.discount}%):`, 140, yPos);
    doc.text('-' + formatCurrency(data.subtotal * (data.discount / 100), data.currency), 180, yPos, { align: 'right' });
    doc.setTextColor(...textColor);
  }
  
  // Total
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text('TOTAL:', 140, yPos);
  doc.text(formatCurrency(data.total, data.currency), 180, yPos, { align: 'right' });
  
  // Footer
  yPos = 270;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your purchase!', 105, yPos, { align: 'center' });
  doc.text('For support, contact us at support@slrp.com', 105, yPos + 5, { align: 'center' });
  doc.text('This is an electronic receipt. No signature required.', 105, yPos + 10, { align: 'center' });
  
  // Save the PDF
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
