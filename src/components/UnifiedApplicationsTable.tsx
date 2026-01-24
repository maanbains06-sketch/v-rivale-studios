import { useState, useEffect, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Check, 
  X, 
  Clock, 
  Copy,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  Building,
  Hash,
  UserCheck,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  FolderOpen,
  FolderClosed,
  Eye,
  Sparkles,
  Download,
  FileText,
  FileSpreadsheet,
  Trash2,
  AlertTriangle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { exportApplicationsToCSV, exportApplicationsToPDF, exportSingleApplicationToPDF } from "@/lib/applicationExporter";
import { useDiscordNames } from "@/hooks/useDiscordNames";

export type ApplicationType = 
  | 'whitelist' 
  | 'staff' 
  | 'police' 
  | 'ems' 
  | 'mechanic' 
  | 'judge' 
  | 'attorney' 
  | 'firefighter' 
  | 'weazel_news' 
  | 'pdm' 
  | 'gang' 
  | 'creator'
  | 'state'
  | 'ban_appeal';

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

interface UnifiedApplicationsTableProps {
  applications: UnifiedApplication[];
  onApprove?: (id: string, notes: string, type: ApplicationType, applicantName: string, discordId?: string) => void;
  onReject?: (id: string, notes: string, type: ApplicationType, applicantName: string, discordId?: string) => void;
  onHold?: (id: string, notes: string, type: ApplicationType) => void;
  onClose?: (id: string, type: ApplicationType) => void;
  onMarkOpen?: (id: string, type: ApplicationType) => void;
  onDelete?: (id: string, type: ApplicationType, applicantName: string) => void;
  title?: string;
}

const typeLabels: Record<ApplicationType, string> = {
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

const typeColors: Record<ApplicationType, string> = {
  whitelist: 'bg-sky-500/20 text-sky-400 border-sky-500/30 hover:bg-sky-500/30',
  staff: 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30',
  police: 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
  ems: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
  mechanic: 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30',
  judge: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/30',
  attorney: 'bg-teal-500/20 text-teal-400 border-teal-500/30 hover:bg-teal-500/30',
  firefighter: 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30',
  weazel_news: 'bg-pink-500/20 text-pink-400 border-pink-500/30 hover:bg-pink-500/30',
  pdm: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30',
  gang: 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30',
  creator: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30 hover:bg-fuchsia-500/30',
  state: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30',
  ban_appeal: 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30',
};

export const UnifiedApplicationsTable = ({
  applications,
  onApprove,
  onReject,
  onHold,
  onClose,
  onMarkOpen,
  onDelete,
  title = "Organization Applications"
}: UnifiedApplicationsTableProps) => {
  const [selectedApp, setSelectedApp] = useState<UnifiedApplication | null>(null);
  const [notes, setNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'on_hold' | 'closed'>('all');
  const [staffNames, setStaffNames] = useState<Record<string, string>>({});
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [deleteConfirmApp, setDeleteConfirmApp] = useState<UnifiedApplication | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const itemsPerPage = 10;

  // Extract all Discord IDs from applications for batch fetching
  const discordIds = useMemo(() => {
    return applications
      .map(app => app.discordId)
      .filter((id): id is string => !!id && /^\d{17,19}$/.test(id));
  }, [applications]);

  // Use the Discord names hook to fetch display names
  const { getDisplayName, getAvatar, isLoading: isLoadingDiscordName } = useDiscordNames(discordIds);

  // Helper to get the best available name for an applicant
  const getApplicantDisplayName = (app: UnifiedApplication): string => {
    // First try to get the synced Discord display name
    if (app.discordId) {
      const discordName = getDisplayName(app.discordId);
      if (discordName) return discordName;
    }
    // Fallback to the stored applicant name
    return app.applicantName || 'Unknown';
  };

  // Helper to get avatar URL
  const getApplicantAvatar = (app: UnifiedApplication): string | undefined => {
    if (app.discordId) {
      const discordAvatar = getAvatar(app.discordId);
      if (discordAvatar) return discordAvatar;
    }
    return app.applicantAvatar;
  };

  // Fetch staff names for handled_by display - resolve by user_id from staff_members
  useEffect(() => {
    const fetchStaffNames = async () => {
      setLoadingStaff(true);
      try {
        const nameMap: Record<string, string> = {};

        // Fetch from staff_members (private table) first - admins can access this
        const { data: staffMembers, error: staffError } = await supabase
          .from('staff_members')
          .select('user_id, discord_id, name, discord_username');
        
        if (staffMembers && !staffError && staffMembers.length > 0) {
          console.log('[UnifiedApplicationsTable] Loaded staff members:', staffMembers.length);
          staffMembers.forEach(staff => {
            const displayName = staff.name || staff.discord_username || 'Staff Member';
            // Map by user_id (this is what reviewed_by stores)
            if (staff.user_id) {
              nameMap[staff.user_id] = displayName;
            }
            // Also map by discord_id for legacy lookups
            if (staff.discord_id) {
              nameMap[staff.discord_id] = displayName;
            }
          });
        }

        // Also fetch from profiles table to get names for users who may not be in staff_members
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, discord_username, discord_id');
        
        if (profiles && !profilesError) {
          console.log('[UnifiedApplicationsTable] Loaded profiles:', profiles.length);
          profiles.forEach(profile => {
            // Only add if not already mapped from staff_members
            if (profile.discord_username && !nameMap[profile.id]) {
              nameMap[profile.id] = profile.discord_username;
            }
            if (profile.discord_id && !nameMap[profile.discord_id]) {
              nameMap[profile.discord_id] = profile.discord_username || 'User';
            }
          });
        }

        // Fallback to public view if staff_members had issues
        if (Object.keys(nameMap).length === 0) {
          console.log('[UnifiedApplicationsTable] Falling back to staff_members_public view');
          const { data: publicStaff, error: publicError } = await supabase
            .from('staff_members_public')
            .select('user_id, discord_id, name, discord_username');
          
          if (publicStaff && publicStaff.length > 0) {
            console.log('[UnifiedApplicationsTable] Loaded public staff:', publicStaff.length);
            publicStaff.forEach(staff => {
              const displayName = staff.name || staff.discord_username || 'Staff Member';
              if (staff.user_id) {
                nameMap[staff.user_id] = displayName;
              }
              if (staff.discord_id) {
                nameMap[staff.discord_id] = displayName;
              }
            });
          } else {
            console.error('[UnifiedApplicationsTable] No staff data found:', publicError);
          }
        }

        console.log('[UnifiedApplicationsTable] Staff name map:', Object.keys(nameMap).length, 'entries');
        console.log('[UnifiedApplicationsTable] Sample mappings:', Object.entries(nameMap).slice(0, 5));
        setStaffNames(nameMap);
      } catch (error) {
        console.error('[UnifiedApplicationsTable] Error fetching staff names:', error);
      } finally {
        setLoadingStaff(false);
      }
    };

    fetchStaffNames();
  }, []);

  // Get staff name by user ID or Discord ID
  const getStaffName = (handledBy?: string): string => {
    if (!handledBy) return '-';
    
    // Direct lookup by user_id or discord_id
    const directMatch = staffNames[handledBy];
    if (directMatch) {
      return directMatch;
    }
    
    // Log for debugging if no match found
    console.log(`[getStaffName] No match for handledBy: ${handledBy}`);
    
    // Return a shortened ID as fallback for display
    return `Staff (${handledBy.substring(0, 8)}...)`;
  };

  // Filter applications based on search and status - include Discord display names in search
  const filteredApps = applications.filter(app => {
    const displayName = getApplicantDisplayName(app);
    const matchesSearch = displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.discordId?.includes(searchQuery) ||
      typeLabels[app.applicationType].toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredApps.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedApps = filteredApps.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
            <CheckCircle className="w-3 h-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1">
            <XCircle className="w-3 h-3" />
            Rejected
          </Badge>
        );
      case "on_hold":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1">
            <Clock className="w-3 h-3" />
            On Hold
          </Badge>
        );
      case "closed":
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 gap-1">
            <FolderClosed className="w-3 h-3" />
            Closed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1">
            <FolderOpen className="w-3 h-3" />
            Open
          </Badge>
        );
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  // Status filter counts
  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    on_hold: applications.filter(a => a.status === 'on_hold').length,
    closed: applications.filter(a => a.status === 'closed').length,
  };

  return (
    <div className="space-y-4">
      {/* Header Bar with Gradient */}
      <div className="relative overflow-hidden rounded-t-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
            <h2 className="text-xl font-bold text-primary-foreground tracking-wide">{title}</h2>
          </div>
          <Badge className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 px-4 py-1.5">
            {filteredApps.length} Applications
          </Badge>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, Discord ID, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'pending', 'approved', 'rejected', 'on_hold', 'closed'] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
              className={`text-xs font-medium transition-all ${
                statusFilter === status 
                  ? status === 'pending' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 shadow-lg' :
                    status === 'approved' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20 shadow-lg' :
                    status === 'rejected' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20 shadow-lg' :
                    status === 'on_hold' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20 shadow-lg' :
                    status === 'closed' ? 'bg-gray-600 hover:bg-gray-700 shadow-gray-500/20 shadow-lg' : 
                    'shadow-primary/20 shadow-lg'
                  : 'hover:bg-muted/50'
              }`}
            >
              {status === 'all' ? 'All' : 
               status === 'pending' ? 'Open' :
               status === 'on_hold' ? 'On Hold' :
               status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-background/20 text-[10px]">
                {statusCounts[status]}
              </span>
            </Button>
          ))}
        </div>

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-medium bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
              disabled={filteredApps.length === 0}
            >
              <Download className="w-3.5 h-3.5" />
              Export
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover/95 backdrop-blur-sm border-border shadow-2xl">
            <DropdownMenuItem 
              onClick={() => {
                try {
                  exportApplicationsToCSV(filteredApps, 'applications');
                  toast({ title: "CSV exported successfully", description: `${filteredApps.length} applications exported` });
                } catch (error) {
                  toast({ title: "Export failed", description: String(error), variant: "destructive" });
                }
              }}
              className="gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-500" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                try {
                  exportApplicationsToPDF(filteredApps, 'applications', title);
                  toast({ title: "PDF exported successfully", description: `${filteredApps.length} applications exported` });
                } catch (error) {
                  toast({ title: "Export failed", description: String(error), variant: "destructive" });
                }
              }}
              className="gap-2"
            >
              <FileText className="w-4 h-4 text-red-500" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Click hint */}
      <div className="px-4 pb-2">
        <p className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          Click on any application row to view full details and take action
        </p>
      </div>

      {/* Table Container */}
      <div className="mx-4 rounded-xl border border-border/40 overflow-hidden bg-gradient-to-b from-muted/20 to-background shadow-lg shadow-primary/5">
        {/* Table Header */}
        <div className="grid grid-cols-[2fr_1.5fr_1.5fr_120px_150px_120px] gap-2 px-4 py-3.5 bg-gradient-to-r from-muted/50 via-muted/40 to-muted/50 border-b border-border/40">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <User className="w-4 h-4" />
            Applicant
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <Building className="w-4 h-4" />
            Organization
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <Hash className="w-4 h-4" />
            Discord ID
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            ⟳ Status
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <UserCheck className="w-4 h-4" />
            Handled By
          </div>
          <div className="flex items-center justify-center text-xs font-bold text-primary uppercase tracking-wider">
            <Clock className="w-4 h-4 mr-1" />
            Reviewed
          </div>
        </div>

        {/* Applications List */}
        <div className="divide-y divide-border/30">
          {loadingStaff ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : paginatedApps.length > 0 ? (
            paginatedApps.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 30 }}
                whileHover={{ scale: 1.005, backgroundColor: "rgba(var(--primary), 0.08)" }}
                whileTap={{ scale: 0.995 }}
                className="grid grid-cols-[2fr_1.5fr_1.5fr_120px_150px_120px] gap-2 items-center px-4 py-3.5 
                           hover:bg-primary/5 transition-all duration-200 cursor-pointer group
                           border-l-4 border-l-transparent hover:border-l-primary/60
                           relative overflow-hidden"
                onClick={() => {
                  setSelectedApp(app);
                  setNotes(app.adminNotes || '');
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedApp(app);
                    setNotes(app.adminNotes || '');
                  }
                }}
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent" />
                </div>

                {/* Applicant */}
                <div className="flex items-center gap-3 min-w-0 relative z-10">
                  <Avatar className="h-10 w-10 border-2 border-primary/30 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                    <AvatarImage src={getApplicantAvatar(app)} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {getApplicantDisplayName(app).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate text-sm group-hover:text-primary transition-colors">
                        {isLoadingDiscordName(app.discordId) ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Loading...
                          </span>
                        ) : (
                          getApplicantDisplayName(app)
                        )}
                      </p>
                      <Eye className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <Badge className={`${typeColors[app.applicationType]} text-[10px] px-1.5 py-0 mt-0.5`}>
                      {typeLabels[app.applicationType]}
                    </Badge>
                  </div>
                </div>

                {/* Organization */}
                <div className="truncate text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors relative z-10">
                  {app.organization || '-'}
                </div>

                {/* Discord ID */}
                <div className="flex items-center gap-1.5 min-w-0 relative z-10">
                  <span className="text-muted-foreground font-mono text-xs truncate group-hover:text-foreground/80 transition-colors">
                    {app.discordId || '-'}
                  </span>
                  {app.discordId && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(app.discordId!);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Status */}
                <div className="relative z-10">
                  {getStatusBadge(app.status)}
                </div>

                {/* Handled By */}
                <div className="text-muted-foreground text-sm truncate relative z-10 group-hover:text-foreground/80 transition-colors">
                  {app.handledByName || getStaffName(app.handledBy) || '-'}
                </div>

                {/* Review Date/Time */}
                <div className="flex justify-center">
                  <span className="text-xs text-muted-foreground">
                    {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : '-'}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No applications found</p>
              <p className="text-sm opacity-60">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col bg-background border-primary/20">
          {selectedApp && (
            <>
              {/* Header */}
              <div className="relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
                <div className="relative px-6 py-5 border-b border-border/30">
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary/50">
                          <AvatarImage src={getApplicantAvatar(selectedApp)} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {getApplicantDisplayName(selectedApp).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <DialogTitle className="text-xl font-bold">
                            {isLoadingDiscordName(selectedApp.discordId) ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading...
                              </span>
                            ) : (
                              getApplicantDisplayName(selectedApp)
                            )}
                          </DialogTitle>
                          <Badge className={`${typeColors[selectedApp.applicationType]} mt-1`}>
                            {typeLabels[selectedApp.applicationType]}
                          </Badge>
                        </div>
                      </div>
                      {getStatusBadge(selectedApp.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      Submitted on {new Date(selectedApp.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </DialogHeader>
                </div>
              </div>

              <ScrollArea className="flex-1 min-h-0 px-6 py-5">
                <div className="space-y-5 pb-4">
                  {/* Application Fields - organized in grid */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedApp.fields.slice(0, 8).map((field, index) => (
                      <div key={index} className="space-y-1.5 p-4 rounded-lg bg-muted/30 border border-border/30">
                        <label className="text-xs font-bold text-primary uppercase tracking-wider">
                          {field.label}
                        </label>
                        <div className="text-sm text-foreground break-words">
                          {String(field.value ?? 'N/A')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Remaining fields in full width */}
                  {selectedApp.fields.slice(8).map((field, index) => (
                    <div key={index + 8} className="space-y-1.5 p-4 rounded-lg bg-muted/30 border border-border/30">
                      <label className="text-xs font-bold text-primary uppercase tracking-wider">
                        {field.label}
                      </label>
                      <div className="text-sm text-foreground whitespace-pre-wrap break-words">
                        {String(field.value ?? 'N/A')}
                      </div>
                    </div>
                  ))}

                  {/* Admin Notes Display */}
                  {selectedApp.adminNotes && (
                    <div className="space-y-1.5 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        Admin Notes
                      </label>
                      <div className="text-sm text-foreground">
                        {selectedApp.adminNotes}
                      </div>
                    </div>
                  )}

                  {/* Handled By Info */}
                  {selectedApp.handledBy && (
                    <div className="space-y-1.5 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        Handled By
                      </label>
                      <div className="text-sm text-foreground flex items-center justify-between">
                        <span>{selectedApp.handledByName || getStaffName(selectedApp.handledBy)}</span>
                        {selectedApp.reviewedAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(selectedApp.reviewedAt).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Actions */}
              <div className="px-6 py-4 bg-muted/30 border-t border-border/30 space-y-4">
                {/* Export single application button */}
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      try {
                        const displayName = getApplicantDisplayName(selectedApp);
                        exportSingleApplicationToPDF({
                          ...selectedApp,
                          applicantName: displayName,
                          handledByName: selectedApp.handledByName || getStaffName(selectedApp.handledBy)
                        });
                        toast({ title: "PDF exported", description: "Application details downloaded" });
                      } catch (error) {
                        toast({ title: "Export failed", description: String(error), variant: "destructive" });
                      }
                    }}
                    className="gap-1.5 text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF
                  </Button>
                  
                  {/* Delete button - only shown when onDelete is provided (Owner Panel only) */}
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeleteConfirmApp(selectedApp);
                      }}
                      className="gap-1.5 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Application
                    </Button>
                  )}
                </div>
                {/* Show actions for pending applications */}
                {(onApprove || onReject || onHold) && selectedApp.status === 'pending' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Admin Notes</label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about this application..."
                        className="min-h-[80px] bg-background/50"
                      />
                    </div>
                    <div className="flex gap-3 justify-end flex-wrap">
                      {onHold && (
                        <Button 
                          variant="outline"
                          onClick={() => {
                            onHold(selectedApp.id, notes, selectedApp.applicationType);
                            setSelectedApp(null);
                          }}
                          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Put On Hold
                        </Button>
                      )}
                      {onReject && (
                        <Button 
                          variant="destructive"
                          onClick={() => {
                            if (!notes.trim()) {
                              toast({ 
                                title: "Notes required", 
                                description: "Please provide a reason for rejection",
                                variant: "destructive" 
                              });
                              return;
                            }
                            const displayName = getApplicantDisplayName(selectedApp);
                            onReject(selectedApp.id, notes, selectedApp.applicationType, displayName, selectedApp.discordId);
                            setSelectedApp(null);
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      )}
                      {onApprove && (
                        <Button 
                          onClick={() => {
                            const displayName = getApplicantDisplayName(selectedApp);
                            onApprove(selectedApp.id, notes, selectedApp.applicationType, displayName, selectedApp.discordId);
                            setSelectedApp(null);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {/* Show close button for approved/rejected/on_hold applications */}
                {onClose && ['approved', 'rejected', 'on_hold'].includes(selectedApp.status) && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        onClose(selectedApp.id, selectedApp.applicationType);
                        setSelectedApp(null);
                      }}
                      className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
                    >
                      <FolderClosed className="w-4 h-4 mr-2" />
                      Mark as Closed
                    </Button>
                  </div>
                )}

                {/* Already closed message */}
                {selectedApp.status === 'closed' && (
                  <div className="text-center text-muted-foreground text-sm py-2 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    This application has been closed and handled.
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmApp} onOpenChange={(open) => !open && setDeleteConfirmApp(null)}>
        <AlertDialogContent className="border-red-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Delete Application
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to permanently delete this application from{' '}
              <span className="font-semibold text-foreground">
                {deleteConfirmApp ? getApplicantDisplayName(deleteConfirmApp) : ''}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={() => {
                if (deleteConfirmApp && onDelete) {
                  setIsDeleting(true);
                  const displayName = getApplicantDisplayName(deleteConfirmApp);
                  onDelete(deleteConfirmApp.id, deleteConfirmApp.applicationType, displayName);
                  setIsDeleting(false);
                  setDeleteConfirmApp(null);
                  setSelectedApp(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
