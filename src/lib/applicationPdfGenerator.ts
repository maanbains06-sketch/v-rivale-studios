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
  drawSummaryCard,
  drawOfficialStamp,
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

  // Premium branded header
  drawHeader(doc, data.title, 'Official Application Document');

  // Document reference bar
  let yPos = 56;
  yPos = drawDocumentRef(doc, `APP-${Date.now().toString(36).toUpperCase()}`, yPos, margin);

  // Premium summary card with status badge
  const statusColor = getStatusColor(data.status);
  const statusText = data.status.toUpperCase().replace('_', ' ');
  
  yPos = drawSummaryCard(doc, [
    { label: 'Applicant', value: data.applicantName, bold: true },
    { label: 'Application Type', value: data.applicationType },
    { label: 'Submitted', value: formatPdfDate(data.submittedAt) },
  ], yPos, margin, { text: statusText, color: statusColor });

  // Application Details section
  yPos = drawSectionHeader(doc, 'Application Details', yPos, margin, contentWidth);
  yPos += 2;

  // Fields
  data.fields.forEach((field) => {
    yPos = checkPageBreak(doc, yPos, 15);
    yPos = drawDetailField(doc, field.label, field.value, yPos, margin);
  });

  // Admin Notes section
  if (data.adminNotes) {
    yPos = checkPageBreak(doc, yPos, 25);
    yPos += 5;
    yPos = drawSectionHeader(doc, 'Administrative Notes', yPos, margin, contentWidth);
    yPos += 2;

    // Notes in a styled box
    const notesLines = doc.splitTextToSize(data.adminNotes, contentWidth - 16);
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
    yPos += notesH + 5;
  }

  // Official stamp at bottom
  yPos = checkPageBreak(doc, yPos, 40);
  drawOfficialStamp(doc, pageWidth - margin - 20, yPos + 15, data.status === 'approved' ? 'APPROVED' : 'RECEIVED');

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
