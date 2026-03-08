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
  drawSummaryCard,
  drawTable,
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
  const contentWidth = pageWidth - margin * 2;

  // Premium branded header
  drawHeader(doc, title, `Comprehensive Report — ${applications.length} Applications`);

  // Summary stats as premium card
  let yPos = 56;
  const pending = applications.filter(a => a.status === 'pending').length;
  const approved = applications.filter(a => a.status === 'approved').length;
  const rejected = applications.filter(a => a.status === 'rejected').length;
  const onHold = applications.filter(a => a.status === 'on_hold').length;
  const closed = applications.filter(a => a.status === 'closed').length;

  yPos = drawSummaryCard(doc, [
    { label: 'Total Applications', value: String(applications.length), bold: true, color: PDF_COLORS.text },
    { label: 'Pending', value: String(pending), color: PDF_COLORS.accent },
    { label: 'Approved', value: String(approved), color: PDF_COLORS.success },
    { label: 'Rejected', value: String(rejected), color: PDF_COLORS.error },
    { label: 'On Hold', value: String(onHold), color: PDF_COLORS.warning },
    { label: 'Closed', value: String(closed), color: PDF_COLORS.textSecondary },
  ], yPos, margin);

  // Table with premium styling
  const tableHeaders = [
    { label: 'Applicant', x: margin + 5 },
    { label: 'Type', x: 58 },
    { label: 'Discord ID', x: 88 },
    { label: 'Status', x: 123 },
    { label: 'Handled By', x: 148 },
    { label: 'Date', x: 180 },
  ];

  const tableRows = applications.map(app => {
    const name = app.applicantName.length > 22 
      ? app.applicantName.substring(0, 20) + '...' 
      : app.applicantName;
    const type = typeLabels[app.applicationType] || app.applicationType;
    const discordId = app.discordId 
      ? (app.discordId.length > 15 ? app.discordId.substring(0, 13) + '...' : app.discordId)
      : '-';
    const handler = (app.handledByName || app.handledBy || '-');
    const statusColor = getStatusColor(app.status);

    return {
      values: [
        { text: name, x: margin + 5 },
        { text: type.substring(0, 14), x: 58 },
        { text: discordId, x: 88 },
        { text: app.status.charAt(0).toUpperCase() + app.status.slice(1).replace('_', ' '), x: 123, color: statusColor, bold: true },
        { text: handler.length > 14 ? handler.substring(0, 12) + '...' : handler, x: 148 },
        { text: formatPdfDateShort(app.createdAt), x: 180 },
      ]
    };
  });

  yPos = drawTable(doc, tableHeaders, tableRows, yPos, margin);

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

  // Premium branded header
  const typeLabel = typeLabels[application.applicationType] || application.applicationType;
  drawHeader(doc, `${typeLabel} Application`, 'Detailed Application Report');

  // Document reference
  let yPos = 56;
  yPos = drawDocumentRef(doc, application.id.substring(0, 8).toUpperCase(), yPos, margin);

  // Premium summary card
  const statusColor = getStatusColor(application.status);
  const statusText = application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('_', ' ');
  
  yPos = drawSummaryCard(doc, [
    { label: 'Applicant', value: application.applicantName, bold: true },
    { label: 'Discord ID', value: application.discordId || 'N/A' },
    { label: 'Submitted', value: formatPdfDate(application.createdAt) },
    ...(application.handledByName || application.handledBy ? [
      { label: 'Reviewed By', value: application.handledByName || application.handledBy || '-' },
    ] : []),
  ], yPos, margin, { text: statusText, color: statusColor });

  // Application Responses section
  yPos = drawSectionHeader(doc, 'Application Responses', yPos, margin, contentWidth);
  yPos += 2;

  application.fields.forEach((field) => {
    yPos = checkPageBreak(doc, yPos, 15);
    yPos = drawDetailField(doc, field.label, String(field.value ?? 'N/A'), yPos, margin);
  });

  // Admin Notes
  if (application.adminNotes) {
    yPos = checkPageBreak(doc, yPos, 25);
    yPos += 5;
    yPos = drawSectionHeader(doc, 'Administrative Notes', yPos, margin, contentWidth);
    yPos += 2;

    const notesLines = doc.splitTextToSize(application.adminNotes, contentWidth - 16);
    const notesH = notesLines.length * 4.5 + 8;
    
    doc.setFillColor(...PDF_COLORS.lightBg);
    doc.roundedRect(margin, yPos, contentWidth, notesH, 2, 2, 'F');
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, yPos, contentWidth, notesH, 2, 2, 'S');
    doc.setFillColor(...PDF_COLORS.warning);
    doc.rect(margin, yPos, 2, notesH, 'F');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...PDF_COLORS.text);
    
    let ny = yPos + 6;
    notesLines.forEach((line: string) => {
      doc.text(line, margin + 8, ny);
      ny += 4.5;
    });
  }

  drawFooter(doc, 'Application Detail Report');
  doc.save(`SLRP-${typeLabel.replace(/\s+/g, '-')}-${application.applicantName.replace(/\s+/g, '-')}-${application.id.substring(0, 8)}.pdf`);
};
