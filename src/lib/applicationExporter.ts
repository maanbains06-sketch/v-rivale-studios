import jsPDF from 'jspdf';

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

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const sanitizeForCSV = (value: string | number | undefined | null): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
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

  // Define CSV headers
  const headers = [
    'ID',
    'Applicant Name',
    'Type',
    'Organization',
    'Discord ID',
    'Status',
    'Handled By',
    'Admin Notes',
    'Submitted Date',
    'Application Details'
  ];

  // Build CSV rows
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
      sanitizeForCSV(formatDate(app.createdAt)),
      sanitizeForCSV(details)
    ].join(',');
  });

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows].join('\n');

  // Create and download file
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

// Export applications to PDF
export const exportApplicationsToPDF = (
  applications: ExportableApplication[],
  filename: string = 'applications',
  title: string = 'Applications Report'
): void => {
  if (applications.length === 0) {
    throw new Error('No applications to export');
  }

  const doc = new jsPDF();
  
  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246];
  const textColor: [number, number, number] = [30, 30, 30];
  const lightGray: [number, number, number] = [245, 245, 245];
  const successColor: [number, number, number] = [34, 197, 94];
  const errorColor: [number, number, number] = [239, 68, 68];
  const warningColor: [number, number, number] = [245, 158, 11];
  const grayColor: [number, number, number] = [107, 114, 128];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SLRP', 105, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 105, 25, { align: 'center' });

  // Summary section
  let yPos = 45;
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  // Stats
  const pending = applications.filter(a => a.status === 'pending').length;
  const approved = applications.filter(a => a.status === 'approved').length;
  const rejected = applications.filter(a => a.status === 'rejected').length;
  const onHold = applications.filter(a => a.status === 'on_hold').length;
  const closed = applications.filter(a => a.status === 'closed').length;

  doc.text(`Total Applications: ${applications.length}`, 15, yPos);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 120, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Open: ${pending}  |  Approved: ${approved}  |  Rejected: ${rejected}  |  On Hold: ${onHold}  |  Closed: ${closed}`, 15, yPos);

  // Table header
  yPos += 12;
  doc.setFillColor(...primaryColor);
  doc.rect(10, yPos, 190, 8, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Applicant', 12, yPos + 5.5);
  doc.text('Type', 55, yPos + 5.5);
  doc.text('Discord ID', 85, yPos + 5.5);
  doc.text('Status', 120, yPos + 5.5);
  doc.text('Handled By', 145, yPos + 5.5);
  doc.text('Date', 175, yPos + 5.5);

  yPos += 10;
  
  // Application rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  applications.forEach((app, index) => {
    // Check if we need a new page
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
      
      // Re-add header on new page
      doc.setFillColor(...primaryColor);
      doc.rect(10, yPos - 10, 190, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Applicant', 12, yPos - 4.5);
      doc.text('Type', 55, yPos - 4.5);
      doc.text('Discord ID', 85, yPos - 4.5);
      doc.text('Status', 120, yPos - 4.5);
      doc.text('Handled By', 145, yPos - 4.5);
      doc.text('Date', 175, yPos - 4.5);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
    }

    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(...lightGray);
      doc.rect(10, yPos - 3, 190, 7, 'F');
    }

    doc.setTextColor(...textColor);
    
    // Applicant name (truncate if too long)
    const name = app.applicantName.length > 20 
      ? app.applicantName.substring(0, 18) + '...' 
      : app.applicantName;
    doc.text(name, 12, yPos);
    
    // Type
    const type = typeLabels[app.applicationType] || app.applicationType;
    doc.text(type.substring(0, 12), 55, yPos);
    
    // Discord ID
    const discordId = app.discordId 
      ? (app.discordId.length > 15 ? app.discordId.substring(0, 13) + '...' : app.discordId)
      : '-';
    doc.text(discordId, 85, yPos);
    
    // Status with color
    switch (app.status) {
      case 'approved':
        doc.setTextColor(...successColor);
        break;
      case 'rejected':
        doc.setTextColor(...errorColor);
        break;
      case 'on_hold':
        doc.setTextColor(...warningColor);
        break;
      case 'closed':
        doc.setTextColor(...grayColor);
        break;
      default:
        doc.setTextColor(...primaryColor);
    }
    doc.text(app.status.charAt(0).toUpperCase() + app.status.slice(1).replace('_', ' '), 120, yPos);
    
    // Handled by
    doc.setTextColor(...textColor);
    const handler = (app.handledByName || app.handledBy || '-');
    doc.text(handler.length > 12 ? handler.substring(0, 10) + '...' : handler, 145, yPos);
    
    // Date
    const date = new Date(app.createdAt);
    doc.text(`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`, 175, yPos);
    
    yPos += 7;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    doc.text('SLRP - Summer Life Roleplay', 15, 290);
  }

  // Save the PDF
  doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
};

// Export single application to detailed PDF
export const exportSingleApplicationToPDF = (
  application: ExportableApplication
): void => {
  const doc = new jsPDF();
  
  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246];
  const textColor: [number, number, number] = [30, 30, 30];
  const lightGray: [number, number, number] = [245, 245, 245];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('APPLICATION DETAILS', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(typeLabels[application.applicationType] || application.applicationType, 105, 32, { align: 'center' });

  let yPos = 55;
  
  // Applicant Info Box
  doc.setFillColor(...lightGray);
  doc.rect(15, yPos, 180, 30, 'F');
  
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  
  doc.text('Applicant:', 20, yPos + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(application.applicantName, 60, yPos + 10);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Discord ID:', 20, yPos + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(application.discordId || 'N/A', 60, yPos + 18);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 20, yPos + 26);
  doc.setFont('helvetica', 'normal');
  doc.text(application.status.charAt(0).toUpperCase() + application.status.slice(1), 60, yPos + 26);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Submitted:', 110, yPos + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(application.createdAt), 145, yPos + 10);
  
  if (application.handledByName || application.handledBy) {
    doc.setFont('helvetica', 'bold');
    doc.text('Handled By:', 110, yPos + 18);
    doc.setFont('helvetica', 'normal');
    doc.text(application.handledByName || application.handledBy || '-', 145, yPos + 18);
  }

  // Application Fields
  yPos = 95;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text('Application Responses', 15, yPos);
  
  yPos += 10;
  doc.setTextColor(...textColor);
  doc.setFontSize(10);

  application.fields.forEach((field) => {
    // Check if we need a new page
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.text(field.label + ':', 15, yPos);
    
    doc.setFont('helvetica', 'normal');
    const value = String(field.value ?? 'N/A');
    
    // Handle long text with word wrap
    if (value.length > 80) {
      const lines = doc.splitTextToSize(value, 175);
      yPos += 5;
      lines.forEach((line: string) => {
        if (yPos > 275) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 15, yPos);
        yPos += 5;
      });
      yPos += 3;
    } else {
      yPos += 5;
      doc.text(value, 15, yPos);
      yPos += 8;
    }
  });

  // Admin Notes
  if (application.adminNotes) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('Admin Notes', 15, yPos);
    
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...textColor);
    
    const notesLines = doc.splitTextToSize(application.adminNotes, 175);
    notesLines.forEach((line: string) => {
      if (yPos > 275) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 15, yPos);
      yPos += 5;
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('SLRP - Summer Life Roleplay | Generated on ' + formatDate(new Date().toISOString()), 105, 290, { align: 'center' });

  // Save
  doc.save(`application-${application.applicantName.replace(/\s+/g, '-')}-${application.id.substring(0, 8)}.pdf`);
};
