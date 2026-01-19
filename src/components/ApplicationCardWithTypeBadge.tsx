import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, 
  Clock, 
  Check, 
  X, 
  FileText,
  Shield,
  Briefcase,
  Siren,
  Ambulance,
  Wrench,
  Gavel,
  Scale,
  Flame,
  Tv,
  Car,
  Users,
  Star,
  Building2
} from "lucide-react";
import { motion } from "framer-motion";

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

interface ApplicationCardWithTypeBadgeProps {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  applicationType: ApplicationType;
  fields: ApplicationField[];
  adminNotes?: string | null;
  onApprove?: (id: string, notes: string) => void;
  onReject?: (id: string, notes: string) => void;
  onHold?: (id: string, notes: string) => void;
  children?: React.ReactNode;
}

const applicationTypeConfig: Record<ApplicationType, { label: string; icon: React.ReactNode; color: string }> = {
  whitelist: { label: 'Whitelist', icon: <Shield className="w-3 h-3" />, color: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
  staff: { label: 'Staff', icon: <Star className="w-3 h-3" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  police: { label: 'Police', icon: <Siren className="w-3 h-3" />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  ems: { label: 'EMS', icon: <Ambulance className="w-3 h-3" />, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  mechanic: { label: 'Mechanic', icon: <Wrench className="w-3 h-3" />, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  judge: { label: 'Judge', icon: <Gavel className="w-3 h-3" />, color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  attorney: { label: 'Attorney', icon: <Scale className="w-3 h-3" />, color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  firefighter: { label: 'Firefighter', icon: <Flame className="w-3 h-3" />, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  weazel_news: { label: 'Weazel News', icon: <Tv className="w-3 h-3" />, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  pdm: { label: 'PDM', icon: <Car className="w-3 h-3" />, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  gang: { label: 'Gang', icon: <Users className="w-3 h-3" />, color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  creator: { label: 'Creator', icon: <Tv className="w-3 h-3" />, color: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30' },
  state: { label: 'State Dept', icon: <Building2 className="w-3 h-3" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  ban_appeal: { label: 'Ban Appeal', icon: <FileText className="w-3 h-3" />, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

export const ApplicationCardWithTypeBadge = ({
  id,
  title,
  subtitle,
  status,
  applicationType,
  fields,
  adminNotes,
  onApprove,
  onReject,
  onHold,
  children
}: ApplicationCardWithTypeBadgeProps) => {
  const [showFullDialog, setShowFullDialog] = useState(false);
  const [notes, setNotes] = useState(adminNotes || '');

  const typeConfig = applicationTypeConfig[applicationType];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "on_hold":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />On Hold</Badge>;
      default:
        return <Badge variant="secondary" className="bg-muted text-muted-foreground"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const truncateText = (text: string | undefined | null, maxLength: number = 80) => {
    if (!text) return 'N/A';
    const str = String(text);
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <Card 
          className="cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 glass-effect border-border/30 overflow-hidden"
          onClick={() => setShowFullDialog(true)}
        >
          {/* Type Badge - Outside the card content */}
          <div className="absolute -top-0 -left-0">
            <Badge className={`${typeConfig.color} rounded-br-lg rounded-tl-none border-l-0 border-t-0 flex items-center gap-1 px-3 py-1`}>
              {typeConfig.icon}
              <span className="font-medium">{typeConfig.label}</span>
            </Badge>
          </div>

          <CardHeader className="pt-10 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold truncate">{title}</CardTitle>
                <CardDescription className="truncate text-sm">{subtitle}</CardDescription>
              </div>
              <div className="flex-shrink-0">
                {getStatusBadge(status)}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Preview Fields - Show first 3 */}
            <div className="grid gap-2">
              {fields.slice(0, 3).map((field, index) => (
                <div key={index} className="min-w-0 p-2 rounded bg-muted/20 border border-border/20">
                  <p className="text-xs text-muted-foreground font-medium">{field.label}</p>
                  <p className="text-sm text-foreground break-words line-clamp-2">
                    {truncateText(String(field.value ?? ''), 100)}
                  </p>
                </div>
              ))}
            </div>

            {fields.length > 3 && (
              <p className="text-xs text-muted-foreground text-center py-1">
                + {fields.length - 3} more fields
              </p>
            )}

            {/* Click to view full details hint */}
            <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
              <Eye className="w-3.5 h-3.5" />
              <span>Click to view full application</span>
            </div>

            {children}
          </CardContent>
        </Card>
      </motion.div>

      {/* Full Details Dialog */}
      <Dialog open={showFullDialog} onOpenChange={setShowFullDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge className={`${typeConfig.color} flex items-center gap-1 px-3 py-1.5`}>
                  {typeConfig.icon}
                  <span className="font-medium">{typeConfig.label}</span>
                </Badge>
                <DialogTitle className="text-xl">{title}</DialogTitle>
              </div>
              {getStatusBadge(status)}
            </div>
            <DialogDescription className="text-base">{subtitle}</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[55vh] pr-4">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={index} className="space-y-1.5">
                  <p className="text-sm font-semibold text-primary">{field.label}</p>
                  <div className="text-sm text-foreground whitespace-pre-wrap break-words bg-muted/30 p-4 rounded-lg border border-border/50">
                    {String(field.value ?? 'N/A')}
                  </div>
                </div>
              ))}

              {adminNotes && (
                <div className="space-y-1.5 pt-4 border-t border-border/30">
                  <p className="text-sm font-semibold text-amber-400">Admin Notes</p>
                  <div className="text-sm text-foreground whitespace-pre-wrap break-words bg-amber-500/10 p-4 rounded-lg border border-amber-500/30">
                    {adminNotes}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          {(onApprove || onReject || onHold) && status === 'pending' && (
            <div className="pt-4 border-t border-border/30 space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Admin Notes (Required for rejection)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this application..."
                  className="w-full h-20 p-3 rounded-lg bg-muted/30 border border-border/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex gap-2 justify-end">
                {onHold && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      onHold(id, notes);
                      setShowFullDialog(false);
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
                        alert('Please provide a reason for rejection');
                        return;
                      }
                      onReject(id, notes);
                      setShowFullDialog(false);
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
                      setShowFullDialog(false);
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
