import jsPDF from 'jspdf';

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

const PRIMARY: [number, number, number] = [59, 130, 246];
const TEXT: [number, number, number] = [30, 30, 30];
const LIGHT_GRAY: [number, number, number] = [245, 245, 245];
const SUCCESS: [number, number, number] = [34, 197, 94];
const ERROR: [number, number, number] = [239, 68, 68];
const WARNING: [number, number, number] = [245, 158, 11];

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusColor = (status: string): [number, number, number] => {
  switch (status) {
    case 'approved': return SUCCESS;
    case 'rejected': return ERROR;
    case 'on_hold': return WARNING;
    default: return PRIMARY;
  }
};

export const generateApplicationPdf = (data: ApplicationPdfData) => {
  const doc = new jsPDF();

  // Header bar
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('SLRP', 105, 16, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Summer Life Roleplay', 105, 24, { align: 'center' });

  doc.setFontSize(10);
  doc.text(data.title, 105, 34, { align: 'center' });

  // Info box
  let yPos = 50;
  doc.setFillColor(...LIGHT_GRAY);
  doc.rect(15, yPos, 180, 32, 'F');

  doc.setTextColor(...TEXT);
  doc.setFontSize(10);

  doc.setFont('helvetica', 'bold');
  doc.text('Applicant:', 20, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(data.applicantName, 55, yPos + 8);

  doc.setFont('helvetica', 'bold');
  doc.text('Type:', 20, yPos + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(data.applicationType, 55, yPos + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('Submitted:', 20, yPos + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(data.submittedAt), 55, yPos + 24);

  // Status on right side
  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 130, yPos + 8);
  const statusColor = getStatusColor(data.status);
  doc.setTextColor(...statusColor);
  doc.setFont('helvetica', 'bold');
  doc.text(data.status.toUpperCase().replace('_', ' '), 155, yPos + 8);

  // Fields section title
  yPos = 92;
  doc.setTextColor(...PRIMARY);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Application Details', 15, yPos);

  yPos += 8;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, 195, yPos);

  yPos += 8;
  doc.setTextColor(...TEXT);
  doc.setFontSize(10);

  data.fields.forEach((field) => {
    if (yPos > 265) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY);
    doc.text(field.label, 15, yPos);
    yPos += 5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT);
    const value = field.value || 'N/A';

    if (value.length > 90) {
      const lines = doc.splitTextToSize(value, 175);
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
      doc.text(value, 15, yPos);
      yPos += 8;
    }
  });

  // Admin notes section
  if (data.adminNotes) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 5;
    doc.setFillColor(...LIGHT_GRAY);
    doc.rect(15, yPos - 4, 180, 8, 'F');
    doc.setTextColor(...PRIMARY);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Admin Notes', 20, yPos + 2);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...TEXT);

    const notesLines = doc.splitTextToSize(data.adminNotes, 175);
    notesLines.forEach((line: string) => {
      if (yPos > 275) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 15, yPos);
      yPos += 5;
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    doc.text('SLRP - Summer Life Roleplay | Confidential Application Document', 105, 285, { align: 'center' });
  }

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
