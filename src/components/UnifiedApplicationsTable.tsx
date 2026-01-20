import { useState } from 'react';
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
  Phone,
  UserCheck
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

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
  contactNumber?: string;
  status: string;
  handledBy?: string;
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
  title = "Organization Applications"
}: UnifiedApplicationsTableProps) => {
  const [selectedApp, setSelectedApp] = useState<UnifiedApplication | null>(null);
  const [notes, setNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const itemsPerPage = 10;

  // Filter applications based on search
  const filteredApps = applications.filter(app => 
    app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    typeLabels[app.applicationType].toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredApps.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedApps = filteredApps.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="text-green-400">Approved</span>;
      case "rejected":
        return <span className="text-red-400">Rejected</span>;
      case "on_hold":
        return <span className="text-amber-400">On Hold</span>;
      default:
        return <span className="text-muted-foreground">Pending</span>;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
        <h2 className="text-xl font-bold uppercase tracking-wider">{title}</h2>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={() => setSelectedApp(null)}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Search Bar */}
      <div className="px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50"
          />
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
            <Phone className="w-4 h-4" />
            # CONTACT NUMBER
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
        {paginatedApps.length > 0 ? (
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

              {/* Contact Number */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-mono">
                  {app.contactNumber || '-'}
                </span>
                {app.contactNumber && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(app.contactNumber!);
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
              <div className="text-muted-foreground text-sm truncate max-w-[100px]">
                {app.handledBy || '-'}
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
                      {selectedApp.status.charAt(0).toUpperCase() + selectedApp.status.slice(1).replace('_', ' ')}
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
                  {/* Application Fields */}
                  {selectedApp.fields.map((field, index) => (
                    <div key={index} className="space-y-2">
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
                </div>
              </ScrollArea>

              {/* Actions */}
              {(onApprove || onReject || onHold) && selectedApp.status === 'pending' && (
                <div className="px-6 py-4 bg-muted/30 border-t border-border/30 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Admin Notes</label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about this application..."
                      className="min-h-[80px] bg-background/50"
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
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
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
