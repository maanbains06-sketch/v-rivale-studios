import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, Trash2, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { format, addDays, addMonths } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StaffContract {
  id: string;
  staff_name: string;
  staff_email: string | null;
  staff_discord_id: string | null;
  staff_role: string | null;
  contract_data: any;
  status: string;
  valid_from: string | null;
  valid_until: string | null;
  staff_signature: string | null;
  staff_signed_at: string | null;
  owner_signature: string | null;
  owner_signed_at: string | null;
  created_at: string;
}

interface StaffContractsListProps {
  onSelectContract: (contract: StaffContract) => void;
  selectedContractId?: string;
  refreshTrigger?: number;
}

const RENEW_OPTIONS = [
  { label: "7 Days", days: 7 },
  { label: "14 Days", days: 14 },
  { label: "30 Days", days: 30 },
  { label: "3 Months", months: 3 },
  { label: "6 Months", months: 6 },
  { label: "1 Year", months: 12 },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'signed':
      return { icon: CheckCircle, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Signed' };
    case 'pending':
      return { icon: Clock, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Pending' };
    case 'expired':
      return { icon: XCircle, color: 'bg-destructive/20 text-destructive border-destructive/30', label: 'Expired' };
    case 'cancelled':
      return { icon: XCircle, color: 'bg-muted text-muted-foreground border-border', label: 'Cancelled' };
    default:
      return { icon: AlertCircle, color: 'bg-primary/20 text-primary border-primary/30', label: 'Draft' };
  }
};

const StaffContractsList = ({ onSelectContract, selectedContractId, refreshTrigger }: StaffContractsListProps) => {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<StaffContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [renewingContract, setRenewingContract] = useState<StaffContract | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, [refreshTrigger]);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from("staff_contracts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error("Error fetching staff contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContract = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this staff contract?")) return;

    try {
      const { error } = await supabase
        .from("staff_contracts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Staff contract deleted" });
      fetchContracts();
    } catch (error) {
      console.error("Error deleting contract:", error);
      toast({ title: "Failed to delete contract", variant: "destructive" });
    }
  };

  const openRenewDialog = (contract: StaffContract, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenewingContract(contract);
    setRenewDialogOpen(true);
  };

  const handleRenew = async (option: typeof RENEW_OPTIONS[number]) => {
    if (!renewingContract) return;
    setIsRenewing(true);

    try {
      const baseDate = renewingContract.valid_until
        ? new Date(renewingContract.valid_until) > new Date()
          ? new Date(renewingContract.valid_until)
          : new Date()
        : new Date();

      const newValidUntil = option.months
        ? addMonths(baseDate, option.months)
        : addDays(baseDate, option.days!);

      const { error } = await supabase
        .from("staff_contracts")
        .update({
          valid_until: newValidUntil.toISOString(),
          status: "signed",
        })
        .eq("id", renewingContract.id);

      if (error) throw error;

      toast({
        title: "Staff Contract Renewed",
        description: `Extended until ${format(newValidUntil, "dd MMM yyyy")}`,
      });
      setRenewDialogOpen(false);
      setRenewingContract(null);
      fetchContracts();
    } catch (error) {
      console.error("Error renewing contract:", error);
      toast({ title: "Failed to renew contract", variant: "destructive" });
    } finally {
      setIsRenewing(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  return (
    <>
      <Card className="border-border bg-card shadow-lg shadow-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Staff Contracts ({contracts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {contracts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 px-4">
              No staff contracts yet. Create your first agreement above.
            </p>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-1 p-4 pt-0">
                {contracts.map((contract) => {
                  const statusConfig = getStatusConfig(contract.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div
                      key={contract.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedContractId === contract.id
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                      onClick={() => onSelectContract(contract)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground text-sm truncate">
                            {contract.staff_name}
                          </p>
                          {contract.staff_role && (
                            <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/10">
                              {contract.staff_role}
                            </Badge>
                          )}
                          <Badge className={`text-xs border ${statusConfig.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Created: {format(new Date(contract.created_at), 'dd MMM yyyy')}</span>
                          {contract.valid_until && (
                            <span>Expires: {format(new Date(contract.valid_until), 'dd MMM yyyy')}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {contract.owner_signature && (
                            <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                              Owner Signed
                            </Badge>
                          )}
                          {contract.staff_signature && (
                            <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                              Staff Signed
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={(e) => openRenewDialog(contract, e)}
                          title="Renew Contract"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); onSelectContract(contract); }}
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDeleteContract(contract.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Renew Contract Dialog */}
      <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <RefreshCw className="h-5 w-5 text-primary" />
              Renew Staff Contract
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Extend the contract for <strong className="text-foreground">{renewingContract?.staff_name}</strong>.
              {renewingContract?.valid_until && (
                <>
                  {" "}Current expiry:{" "}
                  <strong className="text-foreground">{format(new Date(renewingContract.valid_until), "dd MMM yyyy")}</strong>
                  {new Date(renewingContract.valid_until) < new Date() && (
                    <Badge variant="destructive" className="ml-2 text-xs">Expired</Badge>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {RENEW_OPTIONS.map((option) => {
              const baseDate = renewingContract?.valid_until
                ? new Date(renewingContract.valid_until) > new Date()
                  ? new Date(renewingContract.valid_until)
                  : new Date()
                : new Date();
              const newDate = option.months
                ? addMonths(baseDate, option.months)
                : addDays(baseDate, option.days!);

              return (
                <Button
                  key={option.label}
                  variant="outline"
                  className="flex flex-col items-center gap-1 h-auto py-3 border-border hover:border-primary hover:bg-primary/10 text-foreground"
                  onClick={() => handleRenew(option)}
                  disabled={isRenewing}
                >
                  <span className="font-semibold text-sm">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    Until {format(newDate, "dd MMM yyyy")}
                  </span>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StaffContractsList;
