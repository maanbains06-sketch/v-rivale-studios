import { ApplicationType } from "@/components/UnifiedApplicationsTable";

interface ApplicationField {
  label: string;
  value: string | number | undefined | null;
}

interface UnifiedApplication {
  id: string;
  applicantName: string;
  applicantAvatar?: string;
  organization?: string;
  discordId?: string;
  status: string;
  handledBy?: string;
  handledByName?: string;
  reviewedAt?: string;
  applicationType: ApplicationType;
  fields: ApplicationField[];
  adminNotes?: string | null;
  createdAt: string;
}

// Transform whitelist applications
export const transformWhitelistApplications = (apps: any[]): UnifiedApplication[] => {
  return apps.map(app => ({
    id: app.id,
    applicantName: app.discord || 'Unknown',
    organization: 'Whitelist',
    discordId: app.discord_id || undefined,
    status: app.status,
    handledBy: app.reviewed_by || undefined,
    reviewedAt: app.reviewed_at || undefined,
    applicationType: 'whitelist' as ApplicationType,
    fields: [
      { label: 'Discord Username', value: app.discord },
      { label: 'Discord ID', value: app.discord_id },
      { label: 'Steam ID', value: app.steam_id },
      { label: 'Age', value: app.age },
      { label: 'RP Experience', value: app.experience },
      { label: 'Character Backstory', value: app.backstory },
    ],
    adminNotes: app.admin_notes,
    createdAt: app.created_at,
  }));
};

// Transform staff applications
export const transformStaffApplications = (apps: any[]): UnifiedApplication[] => {
  return apps.map(app => ({
    id: app.id,
    applicantName: app.full_name || 'Unknown',
    organization: app.position || 'Staff',
    discordId: app.discord_id || undefined,
    status: app.status,
    handledBy: app.reviewed_by || undefined,
    reviewedAt: app.reviewed_at || undefined,
    applicationType: 'staff' as ApplicationType,
    fields: [
      { label: 'Full Name', value: app.full_name },
      { label: 'Discord Username', value: app.discord_username },
      { label: 'Discord ID', value: app.discord_id },
      { label: 'In-Game Name', value: app.in_game_name },
      { label: 'Age', value: app.age },
      { label: 'Position Applied', value: app.position },
      { label: 'Availability', value: app.availability },
      { label: 'Playtime', value: app.playtime },
      { label: 'Experience', value: app.experience },
      { label: 'Previous Staff Experience', value: app.previous_experience },
      { label: 'Why Join', value: app.why_join },
    ],
    adminNotes: app.admin_notes,
    createdAt: app.created_at,
  }));
};

// Transform job applications (police, ems, mechanic, etc.)
export const transformJobApplications = (apps: any[]): UnifiedApplication[] => {
  return apps.map(app => {
    let applicationType: ApplicationType = 'police';
    const jobType = (app.job_type || '').toLowerCase();
    
    if (jobType.includes('police') || jobType.includes('pd')) {
      applicationType = 'police';
    } else if (jobType.includes('ems') || jobType.includes('medical')) {
      applicationType = 'ems';
    } else if (jobType.includes('mechanic')) {
      applicationType = 'mechanic';
    } else if (jobType.includes('judge')) {
      applicationType = 'judge';
    } else if (jobType.includes('attorney')) {
      applicationType = 'attorney';
    } else if (jobType.includes('gang')) {
      applicationType = 'gang';
    } else if (jobType.includes('state')) {
      applicationType = 'state';
    }

    return {
      id: app.id,
      applicantName: app.character_name || 'Unknown',
      organization: app.job_type || 'Job',
      discordId: app.discord_id || undefined,
      status: app.status,
      handledBy: app.reviewed_by || undefined,
      reviewedAt: app.reviewed_at || undefined,
      applicationType,
      fields: [
        { label: 'Character Name', value: app.character_name },
        { label: 'Discord ID', value: app.discord_id },
        { label: 'Age', value: app.age },
        { label: 'Phone Number', value: app.phone_number },
        { label: 'Job Type', value: app.job_type },
        { label: 'Previous Experience', value: app.previous_experience },
        { label: 'Availability', value: app.availability },
        { label: 'Character Background', value: app.character_background },
        { label: 'Strengths', value: app.strengths },
        { label: 'Why Join', value: app.why_join },
        { label: 'Additional Info', value: app.additional_info },
      ],
      adminNotes: app.admin_notes,
      createdAt: app.created_at,
    };
  });
};

// Transform ban appeals
export const transformBanAppeals = (apps: any[]): UnifiedApplication[] => {
  return apps.map(app => ({
    id: app.id,
    applicantName: app.discord_username || 'Unknown',
    organization: 'Ban Appeal',
    discordId: app.discord_id || undefined,
    status: app.status,
    handledBy: app.reviewed_by || undefined,
    reviewedAt: app.reviewed_at || undefined,
    applicationType: 'ban_appeal' as ApplicationType,
    fields: [
      { label: 'Discord Username', value: app.discord_username },
      { label: 'Discord ID', value: app.discord_id },
      { label: 'Steam ID', value: app.steam_id },
      { label: 'Ban Reason', value: app.ban_reason },
      { label: 'Appeal Reason', value: app.appeal_reason },
      { label: 'Additional Info', value: app.additional_info },
    ],
    adminNotes: app.admin_notes,
    createdAt: app.created_at,
  }));
};

// Transform creator applications
export const transformCreatorApplications = (apps: any[]): UnifiedApplication[] => {
  return apps.map(app => ({
    id: app.id,
    applicantName: app.full_name || 'Unknown',
    organization: app.platform || 'Creator',
    discordId: app.discord_id || undefined,
    status: app.status,
    handledBy: app.reviewed_by || undefined,
    reviewedAt: app.reviewed_at || undefined,
    applicationType: 'creator' as ApplicationType,
    fields: [
      { label: 'Full Name', value: app.full_name },
      { label: 'Discord Username', value: app.discord_username },
      { label: 'Discord ID', value: app.discord_id },
      { label: 'Platform', value: app.platform },
      { label: 'Channel URL', value: app.channel_url },
      { label: 'Average Viewers', value: app.average_viewers },
      { label: 'Content Frequency', value: app.content_frequency },
      { label: 'Content Style', value: app.content_style },
      { label: 'RP Experience', value: app.rp_experience },
      { label: 'Why Join', value: app.why_join },
      { label: 'Social Links', value: app.social_links },
    ],
    adminNotes: app.admin_notes,
    createdAt: app.created_at,
  }));
};

// Transform firefighter applications
export const transformFirefighterApplications = (apps: any[]): UnifiedApplication[] => {
  return apps.map(app => ({
    id: app.id,
    applicantName: app.real_name || app.in_game_name || 'Unknown',
    organization: 'Fire Department',
    discordId: app.discord_id || undefined,
    status: app.status,
    handledBy: app.reviewed_by || undefined,
    reviewedAt: app.reviewed_at || undefined,
    applicationType: 'firefighter' as ApplicationType,
    fields: [
      { label: 'Real Name', value: app.real_name },
      { label: 'In-Game Name', value: app.in_game_name },
      { label: 'Discord ID', value: app.discord_id },
      { label: 'Steam ID', value: app.steam_id },
      { label: 'Weekly Availability', value: app.weekly_availability },
    ],
    adminNotes: app.admin_notes,
    createdAt: app.created_at,
  }));
};

// Transform Weazel News applications
export const transformWeazelNewsApplications = (apps: any[]): UnifiedApplication[] => {
  return apps.map(app => ({
    id: app.id,
    applicantName: app.character_name || 'Unknown',
    organization: 'Weazel News',
    discordId: app.discord_id || undefined,
    status: app.status,
    handledBy: app.reviewed_by || undefined,
    reviewedAt: app.reviewed_at || undefined,
    applicationType: 'weazel_news' as ApplicationType,
    fields: [
      { label: 'Character Name', value: app.character_name },
      { label: 'Discord ID', value: app.discord_id },
      { label: 'Age', value: app.age },
      { label: 'Phone Number', value: app.phone_number },
      { label: 'Previous Experience', value: app.previous_experience },
      { label: 'Journalism Experience', value: app.journalism_experience },
      { label: 'Camera Skills', value: app.camera_skills },
      { label: 'Writing Sample', value: app.writing_sample },
      { label: 'Interview Scenario', value: app.interview_scenario },
      { label: 'Availability', value: app.availability },
      { label: 'Character Background', value: app.character_background },
      { label: 'Why Join', value: app.why_join },
      { label: 'Additional Info', value: app.additional_info },
    ],
    adminNotes: app.admin_notes,
    createdAt: app.created_at,
  }));
};

// Transform PDM applications
export const transformPDMApplications = (apps: any[]): UnifiedApplication[] => {
  return apps.map(app => ({
    id: app.id,
    applicantName: app.character_name || 'Unknown',
    organization: 'Premium Deluxe Motorsport',
    discordId: app.discord_id || undefined,
    status: app.status,
    handledBy: app.reviewed_by || undefined,
    reviewedAt: app.reviewed_at || undefined,
    applicationType: 'pdm' as ApplicationType,
    fields: [
      { label: 'Character Name', value: app.character_name },
      { label: 'Discord ID', value: app.discord_id },
      { label: 'Age', value: app.age },
      { label: 'Phone Number', value: app.phone_number },
      { label: 'Previous Experience', value: app.previous_experience },
      { label: 'Sales Experience', value: app.sales_experience },
      { label: 'Vehicle Knowledge', value: app.vehicle_knowledge },
      { label: 'Customer Scenario', value: app.customer_scenario },
      { label: 'Availability', value: app.availability },
      { label: 'Character Background', value: app.character_background },
      { label: 'Why Join', value: app.why_join },
      { label: 'Additional Info', value: app.additional_info },
    ],
    adminNotes: app.admin_notes,
    createdAt: app.created_at,
  }));
};

// Transform gang applications
export const transformGangApplications = (apps: any[]): UnifiedApplication[] => {
  return apps.map(app => ({
    id: app.id,
    applicantName: app.gang_name || app.leader_name || 'Unknown',
    organization: 'Gang RP',
    discordId: app.discord_id || undefined,
    status: app.status,
    handledBy: app.reviewed_by || undefined,
    reviewedAt: app.reviewed_at || undefined,
    applicationType: 'gang' as ApplicationType,
    fields: [
      { label: 'Gang Name', value: app.gang_name },
      { label: 'Leader Name', value: app.leader_name },
      { label: 'Discord ID', value: app.discord_id },
      { label: 'Member Count', value: app.member_count },
      { label: 'Gang Backstory', value: app.gang_backstory },
      { label: 'Territory Plans', value: app.territory_plans },
      { label: 'Activity Level', value: app.activity_level },
    ],
    adminNotes: app.admin_notes,
    createdAt: app.created_at,
  }));
};

// Combine all applications into unified list
export const combineAllApplications = (
  whitelistApps: any[],
  staffApps: any[],
  jobApps: any[],
  banAppeals: any[],
  creatorApps: any[],
  firefighterApps: any[],
  weazelApps: any[],
  pdmApps: any[],
  gangApps: any[] = []
): UnifiedApplication[] => {
  return [
    ...transformWhitelistApplications(whitelistApps),
    ...transformStaffApplications(staffApps),
    ...transformJobApplications(jobApps),
    ...transformBanAppeals(banAppeals),
    ...transformCreatorApplications(creatorApps),
    ...transformFirefighterApplications(firefighterApps),
    ...transformWeazelNewsApplications(weazelApps),
    ...transformPDMApplications(pdmApps),
    ...transformGangApplications(gangApps),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Filter applications by type
export const filterApplicationsByType = (
  apps: UnifiedApplication[],
  filterType: string
): UnifiedApplication[] => {
  if (filterType === 'all') return apps;
  
  const typeMap: Record<string, ApplicationType[]> = {
    whitelist: ['whitelist'],
    job: ['police', 'ems', 'mechanic', 'judge', 'attorney', 'state'],
    staff: ['staff'],
    ban: ['ban_appeal'],
    creator: ['creator'],
    firefighter: ['firefighter'],
    weazel: ['weazel_news'],
    pdm: ['pdm'],
    gang: ['gang'],
  };
  
  const allowedTypes = typeMap[filterType] || [];
  return apps.filter(app => allowedTypes.includes(app.applicationType));
};