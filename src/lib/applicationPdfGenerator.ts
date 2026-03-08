import jsPDF from 'jspdf';
import {
  PDF_COLORS,
  getStatusColor,
  formatPdfDate,
  drawHeader,
  drawSectionHeader,
  drawDetailField,
  drawFooter,
  drawDocumentRef,
  checkPageBreak,
} from './pdfStyles';

interface PdfField {
  label: string;
  value: string;
}

interface ApplicationPdfData {
  title: string;
  applicationType: string;
  applicantName: string;
  status: string;
  submittedAt: string;
  adminNotes?: string | null;
  fields: PdfField[];
}

export const generateApplicationPdf = (data: ApplicationPdfData) => {
  const doc = new jsPDF();
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  // Branded header
  drawHeader(doc, data.title, 'Application Document');

  // Document reference
  let yPos = 50;
  yPos = drawDocumentRef(doc, `APP-${Date.now().toString(36).toUpperCase()}`, yPos, margin);

  // Application summary box
  yPos += 2;
  const boxHeight = 28;
  doc.setFillColor(...PDF_COLORS.lightBg);
  doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, 'F');
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, 'S');

  // Left column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text('Applicant', margin + 5, yPos + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(data.applicantName, margin + 5, yPos + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text('Type', margin + 5, yPos + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(data.applicationType, margin + 5, yPos + 25);

  // Middle column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text('Submitted', margin + 70, yPos + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(formatPdfDate(data.submittedAt), margin + 70, yPos + 13);

  // Status badge (right side)
  const statusColor = getStatusColor(data.status);
  const statusText = data.status.toUpperCase().replace('_', ' ');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text('Status', pageWidth - margin - 35, yPos + 7);
  
  // Status pill
  const pillY = yPos + 11;
  doc.setFillColor(...statusColor);
  doc.roundedRect(pageWidth - margin - 38, pillY - 3, 33, 7, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText, pageWidth - margin - 21.5, pillY + 1.5, { align: 'center' });

  // Application Details section
  yPos += boxHeight + 8;
  yPos = drawSectionHeader(doc, 'Application Details', yPos, margin, contentWidth);
  yPos += 3;

  // Fields
  data.fields.forEach((field) => {
    yPos = checkPageBreak(doc, yPos, 15);
    yPos = drawDetailField(doc, field.label, field.value, yPos, margin);
  });

  // Admin Notes section
  if (data.adminNotes) {
    yPos = checkPageBreak(doc, yPos, 25);
    yPos += 5;
    yPos = drawSectionHeader(doc, 'Admin Notes', yPos, margin, contentWidth);
    yPos += 3;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.textSecondary);

    const notesLines = doc.splitTextToSize(data.adminNotes, contentWidth - 8);
    notesLines.forEach((line: string) => {
      yPos = checkPageBreak(doc, yPos);
      doc.text(line, margin + 5, yPos);
      yPos += 4.5;
    });
  }

  // Footer
  drawFooter(doc, 'Application Document');

  const safeName = data.applicantName.replace(/[^a-zA-Z0-9]/g, '-');
  doc.save(`SLRP-${data.applicationType.replace(/\s+/g, '-')}-${safeName}.pdf`);
};

// Helper to build fields from different application types
export const buildWhitelistFields = (app: any): PdfField[] => [
  { label: 'Discord Username', value: app.discord },
  { label: 'Discord ID', value: app.discord_id },
  { label: 'Age', value: String(app.age || '') },
  { label: 'Roleplay Experience', value: app.experience || '' },
  { label: 'Character Backstory', value: app.character_backstory || '' },
  { label: 'Server Rules Knowledge', value: app.server_rules || '' },
  { label: 'Why Join', value: app.why_join || '' },
  { label: 'Scenario Response', value: app.scenario_response || '' },
  { label: 'Additional Info', value: app.additional_info || '' },
];

export const buildJobFields = (app: any): PdfField[] => [
  { label: 'Job Type', value: app.job_type || '' },
  { label: 'Character Name', value: app.character_name || '' },
  { label: 'Discord ID', value: app.discord_id || '' },
  { label: 'Age', value: String(app.age || '') },
  { label: 'Phone Number', value: app.phone_number || '' },
  { label: 'Previous Experience', value: app.previous_experience || '' },
  { label: 'Why Join', value: app.why_join || '' },
  { label: 'Character Background', value: app.character_background || '' },
  { label: 'Availability', value: app.availability || '' },
  { label: 'Strengths', value: app.strengths || '' },
  { label: 'Job-Specific Answer', value: app.job_specific_answer || '' },
  { label: 'Additional Info', value: app.additional_info || '' },
];

export const buildStaffFields = (app: any): PdfField[] => [
  { label: 'Full Name', value: app.full_name || '' },
  { label: 'Age', value: String(app.age || '') },
  { label: 'Discord Username', value: app.discord_username || '' },
  { label: 'Discord ID', value: app.discord_id || '' },
  { label: 'In-Game Name', value: app.in_game_name || '' },
  { label: 'Position', value: app.position || '' },
  { label: 'Playtime', value: app.playtime || '' },
  { label: 'Experience', value: app.experience || '' },
  { label: 'Why Join', value: app.why_join || '' },
  { label: 'Availability', value: app.availability || '' },
  { label: 'Previous Experience', value: app.previous_experience || '' },
];

export const buildBanAppealFields = (app: any): PdfField[] => [
  { label: 'Discord Username', value: app.discord_username || '' },
  { label: 'Discord ID', value: app.discord_id || '' },
  { label: 'Steam ID', value: app.steam_id || '' },
  { label: 'Ban Reason', value: app.ban_reason || '' },
  { label: 'Appeal Reason', value: app.appeal_reason || '' },
  { label: 'Additional Info', value: app.additional_info || '' },
];

export const buildGangFields = (app: any): PdfField[] => [
  { label: 'Gang Name', value: app.gang_name || '' },
  { label: 'Leader Name', value: app.leader_name || '' },
  { label: 'Discord ID', value: app.discord_id || '' },
  { label: 'Member Count', value: String(app.member_count || '') },
  { label: 'Gang Background', value: app.gang_background || '' },
  { label: 'Activities', value: app.activities || '' },
  { label: 'Territory', value: app.territory || '' },
  { label: 'Rules Compliance', value: app.rules_compliance || '' },
  { label: 'Why Approve', value: app.why_approve || '' },
  { label: 'Additional Info', value: app.additional_info || '' },
];

export const buildFirefighterFields = (app: any): PdfField[] => [
  { label: 'Real Name', value: app.real_name || '' },
  { label: 'In-Game Name', value: app.in_game_name || '' },
  { label: 'Discord ID', value: app.discord_id || '' },
  { label: 'Steam ID', value: app.steam_id || '' },
  { label: 'Weekly Availability', value: app.weekly_availability || '' },
];

export const buildCreatorFields = (app: any): PdfField[] => [
  { label: 'Full Name', value: app.full_name || '' },
  { label: 'Discord Username', value: app.discord_username || '' },
  { label: 'Discord ID', value: app.discord_id || '' },
  { label: 'Steam ID', value: app.steam_id || '' },
  { label: 'Platform', value: app.platform || '' },
  { label: 'Channel URL', value: app.channel_url || '' },
  { label: 'Average Viewers', value: app.average_viewers || '' },
  { label: 'Content Frequency', value: app.content_frequency || '' },
  { label: 'Content Style', value: app.content_style || '' },
  { label: 'RP Experience', value: app.rp_experience || '' },
  { label: 'Why Join', value: app.why_join || '' },
  { label: 'Storyline Ideas', value: app.storyline_ideas || '' },
];

export const buildBusinessFields = (app: any): PdfField[] => [
  { label: 'Business Name', value: app.business_name || '' },
  { label: 'Owner Name', value: app.owner_name || '' },
  { label: 'Business Type', value: app.business_type || '' },
  { label: 'Discord ID', value: app.discord_id || '' },
  { label: 'Phone Number', value: app.phone_number || '' },
  { label: 'Business Plan', value: app.business_plan || '' },
  { label: 'Investment Amount', value: app.investment_amount || '' },
  { label: 'Employee Count', value: app.employee_count || '' },
  { label: 'Operating Hours', value: app.operating_hours || '' },
  { label: 'Target Customers', value: app.target_customers || '' },
  { label: 'Unique Selling Point', value: app.unique_selling_point || '' },
  { label: 'Previous Experience', value: app.previous_experience || '' },
  { label: 'Why This Business', value: app.why_this_business || '' },
  { label: 'Additional Info', value: app.additional_info || '' },
];

export const buildDOJFields = (app: any): PdfField[] => [
  { label: 'Character Name', value: app.character_name || '' },
  { label: 'Discord ID', value: app.discord_id || '' },
  { label: 'Age', value: String(app.age || '') },
  { label: 'Phone Number', value: app.phone_number || '' },
  { label: 'Position Type', value: app.job_type || '' },
  { label: 'Previous Experience', value: app.previous_experience || '' },
  { label: 'Why Join', value: app.why_join || '' },
  { label: 'Character Background', value: app.character_background || '' },
  { label: 'Availability', value: app.availability || '' },
  { label: 'Additional Info', value: app.additional_info || '' },
];

export const buildPDMFields = (app: any): PdfField[] => [
  { label: 'Character Name', value: app.character_name || '' },
  { label: 'Discord ID', value: app.discord_id || '' },
  { label: 'Age', value: String(app.age || '') },
  { label: 'Phone Number', value: app.phone_number || '' },
  { label: 'Previous Experience', value: app.previous_experience || '' },
  { label: 'Why Join', value: app.why_join || '' },
  { label: 'Character Background', value: app.character_background || '' },
  { label: 'Availability', value: app.availability || '' },
  { label: 'Additional Info', value: app.additional_info || '' },
];

export const buildWeazelFields = (app: any): PdfField[] => [
  { label: 'Character Name', value: app.character_name || '' },
  { label: 'Discord ID', value: app.discord_id || '' },
  { label: 'Age', value: String(app.age || '') },
  { label: 'Phone Number', value: app.phone_number || '' },
  { label: 'Previous Experience', value: app.previous_experience || '' },
  { label: 'Why Join', value: app.why_join || '' },
  { label: 'Character Background', value: app.character_background || '' },
  { label: 'Availability', value: app.availability || '' },
  { label: 'Additional Info', value: app.additional_info || '' },
];

export const buildStateDeptFields = (app: any): PdfField[] => [
  { label: 'Character Name', value: app.character_name || '' },
  { label: 'Discord ID', value: app.discord_id || '' },
  { label: 'Age', value: String(app.age || '') },
  { label: 'Phone Number', value: app.phone_number || '' },
  { label: 'Previous Experience', value: app.previous_experience || '' },
  { label: 'Why Join', value: app.why_join || '' },
  { label: 'Character Background', value: app.character_background || '' },
  { label: 'Availability', value: app.availability || '' },
  { label: 'Additional Info', value: app.additional_info || '' },
];
