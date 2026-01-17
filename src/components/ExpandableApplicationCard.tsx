import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp, Eye, Clock, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ApplicationField {
  label: string;
  value: string | number | undefined | null;
  truncate?: boolean;
}

interface ExpandableApplicationCardProps {
  title: string;
  subtitle: string;
  status: string;
  fields: ApplicationField[];
  accentColor?: string;
  children?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  onViewDetails?: () => void;
}

export const ExpandableApplicationCard = ({
  title,
  subtitle,
  status,
  fields,
  accentColor = "border-border/20",
  children,
  badge,
  icon,
  onViewDetails
}: ExpandableApplicationCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullDialog, setShowFullDialog] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "on_hold":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />On Hold</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const truncateText = (text: string | undefined | null, maxLength: number = 100) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      <Card 
        className={`${accentColor} cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5`}
        onClick={() => setShowFullDialog(true)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {icon}
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base truncate">{title}</CardTitle>
                <CardDescription className="truncate">{subtitle}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {badge}
              {getStatusBadge(status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Preview - first 2 fields */}
          <div className="grid gap-2 md:grid-cols-2">
            {fields.slice(0, 2).map((field, index) => (
              <div key={index} className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium mb-0.5">{field.label}</p>
                <p className="text-sm text-foreground truncate">
                  {field.truncate !== false ? truncateText(String(field.value ?? ''), 60) : String(field.value ?? 'N/A')}
                </p>
              </div>
            ))}
          </div>

          {/* Expand/Collapse for more fields */}
          {fields.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" /> Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" /> Show {fields.length - 2} More Fields
                </>
              )}
            </Button>
          )}

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid gap-2 md:grid-cols-2 pt-2 border-t border-border/50">
                  {fields.slice(2).map((field, index) => (
                    <div key={index + 2} className="min-w-0">
                      <p className="text-xs text-muted-foreground font-medium mb-0.5">{field.label}</p>
                      <p className="text-sm text-foreground break-words">
                        {field.truncate !== false ? truncateText(String(field.value ?? ''), 100) : String(field.value ?? 'N/A')}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* View Full Details Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={(e) => {
              e.stopPropagation();
              setShowFullDialog(true);
            }}
          >
            <Eye className="w-4 h-4 mr-2" /> View Full Details
          </Button>

          {/* Action buttons passed as children */}
          {children}
        </CardContent>
      </Card>

      {/* Full Details Dialog */}
      <Dialog open={showFullDialog} onOpenChange={setShowFullDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {icon}
                <DialogTitle>{title}</DialogTitle>
              </div>
              {getStatusBadge(status)}
            </div>
            <DialogDescription>{subtitle}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={index} className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{field.label}</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words bg-muted/30 p-3 rounded-lg border border-border/50">
                    {String(field.value ?? 'N/A')}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
          {children && (
            <div className="pt-4 border-t">
              {children}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
