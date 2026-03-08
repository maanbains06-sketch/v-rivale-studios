import jsPDF from 'jspdf';
import {
  PDF_COLORS,
  getStatusColor,
  formatPdfDate,
  formatPdfDateShort,
  drawHeader,
  drawSectionHeader,
  drawDetailField,
  drawFooter,
  drawDocumentRef,
  checkPageBreak,
} from './pdfStyles';

interface ApplicationField {
  label: string;
  value: string | number | undefined | null;
}

interface ExportableApplication {
  id: string;
  applicantName: string;
  organization?: string;
  discordId?: string;
  status: string;
  handledBy?: string;
  handledByName?: string;
  applicationType: string;
  fields: ApplicationField[];
  adminNotes?: string | null;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  whitelist: 'Whitelist',
  staff: 'Staff',
  police: 'Police',
  ems: 'EMS',
  mechanic: 'Mechanic',
  judge: 'Judge',
  attorney: 'Attorney',
  firefighter: 'Firefighter',
  weazel_news: 'Weazel News',
  pdm: 'PDM',
  gang: 'Gang',
  creator: 'Creator',
  state: 'State Dept',
  ban_appeal: 'Ban Appeal',
};

const sanitizeForCSV = (value: string | number | undefined | null): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Export applications to CSV
export const exportApplicationsToCSV = (
  applications: ExportableApplication[],
  filename: string = 'applications'
): void => {
  if (applications.length === 0) {
    throw new Error('No applications to export');
  }

  const headers = [
    'ID', 'Applicant Name', 'Type', 'Organization', 'Discord ID',
    'Status', 'Handled By', 'Admin Notes', 'Submitted Date', 'Application Details'
  ];

  const rows = applications.map(app => {
    const details = app.fields
      .map(f => `${f.label}: ${f.value ?? 'N/A'}`)
      .join(' | ');
    
    return [
      sanitizeForCSV(app.id),
      sanitizeForCSV(app.applicantName),
      sanitizeForCSV(typeLabels[app.applicationType] || app.applicationType),
      sanitizeForCSV(app.organization),
      sanitizeForCSV(app.discordId),
      sanitizeForCSV(app.status.charAt(0).toUpperCase() + app.status.slice(1)),
      sanitizeForCSV(app.handledByName || app.handledBy || '-'),
      sanitizeForCSV(app.adminNotes),
      sanitizeForCSV(formatPdfDate(app.createdAt)),
      sanitizeForCSV(details)
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export applications to PDF (bulk report)
export const exportApplicationsToPDF = (
  applications: ExportableApplication[],
  filename: string = 'applications',
  title: string = 'Applications Report'
): void => {
  if (applications.length === 0) {
    throw new Error('No applications to export');
  }

  const doc = new jsPDF();
  const margin = 10;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Branded header
  drawHeader(doc, title, `${applications.length} Applications`);

  // Summary stats
  let yPos = 50;
  const pending = applications.filter(a => a.status === 'pending').length;
  const approved = applications.filter(a => a.status === 'approved').length;
  const rejected = applications.filter(a => a.status === 'rejected').length;
  const onHold = applications.filter(a => a.status === 'on_hold').length;
  const closed = applications.filter(a => a.status === 'closed').length;

  // Stats bar
  doc.setFillColor(...PDF_COLORS.lightBg);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 12, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.text);
  
  const statsX = margin + 5;
  doc.text(`Total: ${applications.length}`, statsX, yPos + 7);
  
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text(`Pending: ${pending}`, statsX + 30, yPos + 7);
  doc.setTextColor(...PDF_COLORS.success);
  doc.text(`Approved: ${approved}`, statsX + 62, yPos + 7);
  doc.setTextColor(...PDF_COLORS.error);
  doc.text(`Rejected: ${rejected}`, statsX + 98, yPos + 7);
  doc.setTextColor(...PDF_COLORS.warning);
  doc.text(`On Hold: ${onHold}`, statsX + 134, yPos + 7);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text(`Closed: ${closed}`, statsX + 164, yPos + 7);

  // Table header
  yPos += 18;
  
  const drawTableHeader = (y: number) => {
    doc.setFillColor(...PDF_COLORS.headerBg);
    doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
    
    // Accent bar
    doc.setFillColor(...PDF_COLORS.accent);
    doc.rect(margin, y, 2, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Applicant', margin + 5, y + 5.5);
    doc.text('Type', 58, y + 5.5);
    doc.text('Discord ID', 88, y + 5.5);
    doc.text('Status', 123, y + 5.5);
    doc.text('Handled By', 148, y + 5.5);
    doc.text('Date', 180, y + 5.5);
    return y + 10;
  };

  yPos = drawTableHeader(yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  applications.forEach((app, index) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
      yPos = drawTableHeader(yPos);
    }

    // Alternate rows
    if (index % 2 === 0) {
      doc.setFillColor(...PDF_COLORS.lightBg);
      doc.rect(margin, yPos - 3, pageWidth - margin * 2, 7, 'F');
    }

    doc.setTextColor(...PDF_COLORS.text);
    const name = app.applicantName.length > 22 
      ? app.applicantName.substring(0, 20) + '...' 
      : app.applicantName;
    doc.text(name, margin + 5, yPos);
    
    const type = typeLabels[app.applicationType] || app.applicationType;
    doc.text(type.substring(0, 14), 58, yPos);
    
    const discordId = app.discordId 
      ? (app.discordId.length > 15 ? app.discordId.substring(0, 13) + '...' : app.discordId)
      : '-';
    doc.text(discordId, 88, yPos);
    
    // Status with color
    const statusColor = getStatusColor(app.status);
    doc.setTextColor(...statusColor);
    doc.setFont('helvetica', 'bold');
    doc.text(app.status.charAt(0).toUpperCase() + app.status.slice(1).replace('_', ' '), 123, yPos);
    
    doc.setTextColor(...PDF_COLORS.text);
    doc.setFont('helvetica', 'normal');
    const handler = (app.handledByName || app.handledBy || '-');
    doc.text(handler.length > 14 ? handler.substring(0, 12) + '...' : handler, 148, yPos);
    
    doc.text(formatPdfDateShort(app.createdAt), 180, yPos);
    
    yPos += 7;
  });

  drawFooter(doc, 'Applications Report');
  doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
};

// Export single application to detailed PDF
export const exportSingleApplicationToPDF = (
  application: ExportableApplication
): void => {
  const doc = new jsPDF();
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  // Branded header
  const typeLabel = typeLabels[application.applicationType] || application.applicationType;
  drawHeader(doc, `${typeLabel} Application`, 'Detailed Application Report');

  // Document reference
  let yPos = 50;
  yPos = drawDocumentRef(doc, application.id.substring(0, 8).toUpperCase(), yPos, margin);

  // Summary box
  yPos += 2;
  const boxHeight = 30;
  doc.setFillColor(...PDF_COLORS.lightBg);
  doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, 'F');
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, 'S');

  // Applicant name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text('Applicant', margin + 5, yPos + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(application.applicantName, margin + 5, yPos + 14);

  // Discord ID
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text('Discord ID', margin + 5, yPos + 21);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(application.discordId || 'N/A', margin + 5, yPos + 27);

  // Submitted date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text('Submitted', margin + 75, yPos + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(formatPdfDate(application.createdAt), margin + 75, yPos + 14);

  // Handled by
  if (application.handledByName || application.handledBy) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.textSecondary);
    doc.text('Reviewed By', margin + 75, yPos + 21);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.text);
    doc.text(application.handledByName || application.handledBy || '-', margin + 75, yPos + 27);
  }

  // Status badge
  const statusColor = getStatusColor(application.status);
  const statusText = application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('_', ' ');
  doc.setFillColor(...statusColor);
  doc.roundedRect(pageWidth - margin - 38, yPos + 5, 33, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText, pageWidth - margin - 21.5, yPos + 11, { align: 'center' });

  // Application Responses section
  yPos += boxHeight + 8;
  yPos = drawSectionHeader(doc, 'Application Responses', yPos, margin, contentWidth);
  yPos += 3;

  application.fields.forEach((field) => {
    yPos = checkPageBreak(doc, yPos, 15);
    yPos = drawDetailField(doc, field.label, String(field.value ?? 'N/A'), yPos, margin);
  });

  // Admin Notes
  if (application.adminNotes) {
    yPos = checkPageBreak(doc, yPos, 25);
    yPos += 5;
    yPos = drawSectionHeader(doc, 'Admin Notes', yPos, margin, contentWidth);
    yPos += 3;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.textSecondary);

    const notesLines = doc.splitTextToSize(application.adminNotes, contentWidth - 8);
    notesLines.forEach((line: string) => {
      yPos = checkPageBreak(doc, yPos);
      doc.text(line, margin + 5, yPos);
      yPos += 4.5;
    });
  }

  drawFooter(doc, 'Application Detail Report');
  doc.save(`SLRP-${typeLabel.replace(/\s+/g, '-')}-${application.applicantName.replace(/\s+/g, '-')}-${application.id.substring(0, 8)}.pdf`);
};
