import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  Check, 
  X, 
  Clock, 
  Copy,
  ChevronRight
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

interface ExpandableApplicationCardProps {
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
  onApprove?: (id: string, notes: string) => void;
  onReject?: (id: string, notes: string) => void;
  onHold?: (id: string, notes: string) => void;
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

export const ExpandableApplicationCard = ({
  id,
  applicantName,
  applicantAvatar,
  organization,
  contactNumber,
  status,
  handledBy,
  applicationType,
  fields,
  adminNotes,
  createdAt,
  onApprove,
  onReject,
  onHold,
}: ExpandableApplicationCardProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [notes, setNotes] = useState(adminNotes || '');
  const { toast } = useToast();

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
    <>
      {/* Table Row Style Card */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-4 items-center p-4 bg-background/50 rounded-lg border border-border/30 hover:border-primary/30 hover:bg-muted/20 transition-all"
      >
        {/* Applicant */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={applicantAvatar} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {applicantName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground hidden md:block truncate max-w-[150px]">{applicantName}</span>
        </div>

        {/* Organization/Type */}
        <div className="truncate hidden md:block">
          <span className="text-muted-foreground">{organization || '-'}</span>
        </div>

        {/* Contact Number */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-muted-foreground">{contactNumber || '-'}</span>
          {contactNumber && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(contactNumber);
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Status */}
        <div className="text-sm font-medium">
          {getStatusBadge(status)}
        </div>

        {/* Handled By */}
        <div className="hidden md:block text-muted-foreground text-sm truncate max-w-[100px]">
          {handledBy || '-'}
        </div>

        {/* Handle Button - TYPE BADGE */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDialog(true)}
          className={`${typeColors[applicationType]} border font-medium`}
        >
          {typeLabels[applicationType]}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </motion.div>

      {/* Full Application Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-primary/20">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/30">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge className={`${typeColors[applicationType]} px-4 py-1.5 text-sm font-semibold`}>
                    {typeLabels[applicationType]}
                  </Badge>
                  <DialogTitle className="text-xl font-bold">{applicantName}</DialogTitle>
                </div>
                <Badge 
                  variant={status === 'approved' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary'}
                  className="text-sm"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Submitted on {new Date(createdAt).toLocaleDateString('en-US', { 
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
              {fields.map((field, index) => (
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
              {adminNotes && (
                <div className="space-y-2 pt-4 border-t border-border/30">
                  <label className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                    Admin Notes
                  </label>
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-foreground">
                    {adminNotes}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          {(onApprove || onReject || onHold) && status === 'pending' && (
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
                      onHold(id, notes);
                      setShowDialog(false);
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
                      onReject(id, notes);
                      setShowDialog(false);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                )}
                {onApprove && (
                  <Button 
                    onClick={() => {
                      onApprove(id, notes);
                      setShowDialog(false);
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
        </DialogContent>
      </Dialog>
    </>
  );
};