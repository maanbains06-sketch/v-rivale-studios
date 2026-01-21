import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  applicationType: ApplicationType;
  fields: ApplicationField[];
  adminNotes?: string | null;
  createdAt: string;
}

interface UnifiedApplicationsTableProps {
  applications: UnifiedApplication[];
  onApprove?: (id: string, notes: string, type: ApplicationType) => void;
  onReject?: (id: string, notes: string, type: ApplicationType) => void;
  onHold?: (id: string, notes: string, type: ApplicationType) => void;
  onClose?: (id: string, type: ApplicationType) => void;
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
  title = "Organization Applications"
}: UnifiedApplicationsTableProps) => {
  const [selectedApp, setSelectedApp] = useState<UnifiedApplication | null>(null);
  const [notes, setNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'on_hold' | 'closed'>('all');
  const [staffNames, setStaffNames] = useState<Record<string, string>>({});
  const [loadingStaff, setLoadingStaff] = useState(true);
  const { toast } = useToast();
  const itemsPerPage = 10;

  // Fetch staff names for handled_by display
  useEffect(() => {
    const fetchStaffNames = async () => {
      setLoadingStaff(true);
      try {
        const { data: staffMembers } = await supabase
          .from('staff_members')
          .select('user_id, discord_id, name, discord_username');

        if (staffMembers) {
          const nameMap: Record<string, string> = {};
          staffMembers.forEach(staff => {
            if (staff.user_id) {
              nameMap[staff.user_id] = staff.name || staff.discord_username || 'Staff';
            }
            if (staff.discord_id) {
              nameMap[staff.discord_id] = staff.name || staff.discord_username || 'Staff';
            }
          });
          setStaffNames(nameMap);
        }
      } catch (error) {
        console.error('Error fetching staff names:', error);
      } finally {
        setLoadingStaff(false);
      }
    };

    fetchStaffNames();
  }, []);

  // Get staff name by user ID or Discord ID
  const getStaffName = (handledBy?: string) => {
    if (!handledBy) return '-';
    return staffNames[handledBy] || 'Staff';
  };

  // Filter applications based on search and status
  const filteredApps = applications.filter(app => {
    const matchesSearch = app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
          <span className="flex items-center gap-1 text-green-400">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 text-red-400">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case "on_hold":
        return (
          <span className="flex items-center gap-1 text-amber-400">
            <Clock className="w-3 h-3" />
            On Hold
          </span>
        );
      case "closed":
        return (
          <span className="flex items-center gap-1 text-gray-400">
            <Check className="w-3 h-3" />
            Closed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-blue-400">
            <Clock className="w-3 h-3" />
            Open
          </span>
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
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
        <h2 className="text-xl font-bold uppercase tracking-wider">{title}</h2>
        <div className="flex items-center gap-2">
          <Badge className="bg-white/20 text-white">
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
            className="pl-10 bg-background/50"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-1">
          {(['all', 'pending', 'approved', 'rejected', 'on_hold', 'closed'] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
              className={`text-xs ${
                statusFilter === status 
                  ? status === 'pending' ? 'bg-blue-600 hover:bg-blue-700' :
                    status === 'approved' ? 'bg-green-600 hover:bg-green-700' :
                    status === 'rejected' ? 'bg-red-600 hover:bg-red-700' :
                    status === 'on_hold' ? 'bg-amber-600 hover:bg-amber-700' :
                    status === 'closed' ? 'bg-gray-600 hover:bg-gray-700' : ''
                  : ''
              }`}
            >
              {status === 'all' ? 'All' : 
               status === 'pending' ? 'Open' :
               status === 'on_hold' ? 'On Hold' :
               status.charAt(0).toUpperCase() + status.slice(1)}
              <Badge variant="secondary" className="ml-1 text-xs px-1">
                {statusCounts[status]}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Table Header */}
      <div className="px-4">
        <div className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-4 px-4 py-3 text-sm font-semibold text-amber-400 bg-background/50 rounded-lg border border-border/30">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            APPLICANT
          </div>
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            ORGANIZATION
          </div>
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4" />
            DISCORD ID
          </div>
          <div className="flex items-center gap-2">
            ⟳ STATUS
          </div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            HANDLED BY
          </div>
          <div>📋 HANDLE</div>
        </div>
      </div>

      {/* Applications List */}
      <div className="px-4 space-y-2">
        {loadingStaff ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : paginatedApps.length > 0 ? (
          paginatedApps.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-4 items-center p-4 bg-background/50 rounded-lg border border-border/30 hover:border-primary/30 hover:bg-muted/20 transition-all"
            >
              {/* Applicant */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-green-500/50">
                  <AvatarImage src={app.applicantAvatar} />
                  <AvatarFallback className="bg-green-500/20 text-green-400">
                    {app.applicantName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground truncate max-w-[150px]">
                  {app.applicantName}
                </span>
              </div>

              {/* Organization */}
              <div className="truncate text-muted-foreground">
                {app.organization || '-'}
              </div>

              {/* Discord ID */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-mono text-sm">
                  {app.discordId || '-'}
                </span>
                {app.discordId && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
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
              <div className="text-sm font-medium">
                {getStatusBadge(app.status)}
              </div>

              {/* Handled By */}
              <div className="text-muted-foreground text-sm truncate max-w-[120px]">
                {app.handledByName || getStaffName(app.handledBy) || '-'}
              </div>

              {/* Handle Button - Application Type Badge */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedApp(app);
                  setNotes(app.adminNotes || '');
                }}
                className={`${typeColors[app.applicationType]} border font-medium uppercase text-xs`}
              >
                {typeLabels[app.applicationType]}
              </Button>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No applications found.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-amber-400 font-medium">
            Page {currentPage}/{totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-primary/20">
          {selectedApp && (
            <>
              {/* Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/30">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge className={`${typeColors[selectedApp.applicationType]} px-4 py-1.5 text-sm font-semibold uppercase`}>
                        {typeLabels[selectedApp.applicationType]}
                      </Badge>
                      <DialogTitle className="text-xl font-bold">{selectedApp.applicantName}</DialogTitle>
                    </div>
                    <Badge 
                      variant={selectedApp.status === 'approved' ? 'default' : selectedApp.status === 'rejected' ? 'destructive' : 'secondary'}
                      className="text-sm"
                    >
                      {selectedApp.status === 'pending' ? 'Open' : selectedApp.status.charAt(0).toUpperCase() + selectedApp.status.slice(1).replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
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

              <ScrollArea className="max-h-[60vh] px-6 py-4">
                <div className="space-y-6">
                  {/* Application Fields - organized in rows */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedApp.fields.slice(0, 6).map((field, index) => (
                      <div key={index} className="space-y-2">
                        <label className="text-sm font-bold text-primary uppercase tracking-wide">
                          {field.label}
                        </label>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-foreground">
                          {String(field.value ?? 'N/A')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Remaining fields in full width */}
                  {selectedApp.fields.slice(6).map((field, index) => (
                    <div key={index + 6} className="space-y-2">
                      <label className="text-sm font-bold text-primary uppercase tracking-wide">
                        {field.label}
                      </label>
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/30 text-foreground whitespace-pre-wrap break-words">
                        {String(field.value ?? 'N/A')}
                      </div>
                    </div>
                  ))}

                  {/* Admin Notes Display */}
                  {selectedApp.adminNotes && (
                    <div className="space-y-2 pt-4 border-t border-border/30">
                      <label className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                        Admin Notes
                      </label>
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-foreground">
                        {selectedApp.adminNotes}
                      </div>
                    </div>
                  )}

                  {/* Handled By Info */}
                  {selectedApp.handledBy && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-blue-400 uppercase tracking-wide">
                        Handled By
                      </label>
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-foreground">
                        {selectedApp.handledByName || getStaffName(selectedApp.handledBy)}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Actions */}
              <div className="px-6 py-4 bg-muted/30 border-t border-border/30 space-y-4">
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
                            onReject(selectedApp.id, notes, selectedApp.applicationType);
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
                            onApprove(selectedApp.id, notes, selectedApp.applicationType);
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
                      <Check className="w-4 h-4 mr-2" />
                      Mark as Closed
                    </Button>
                  </div>
                )}

                {/* Already closed message */}
                {selectedApp.status === 'closed' && (
                  <div className="text-center text-muted-foreground text-sm py-2">
                    This application has been closed and handled.
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};