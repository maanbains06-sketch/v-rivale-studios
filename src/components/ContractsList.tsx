import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { FileText, Eye, Trash2, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { format, addDays, addMonths } from "date-fns";
import type { Json } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Contract {
  id: string;
  creator_name: string;
  creator_email: string | null;
  creator_discord_id: string | null;
  contract_data: Json;
  status: string;
  valid_from: string | null;
  valid_until: string | null;
  creator_signature: string | null;
  creator_signed_at: string | null;
  owner_signature: string | null;
  owner_signed_at: string | null;
  created_at: string;
}

interface ContractsListProps {
  onSelectContract: (contract: Contract) => void;
  selectedContractId?: string;
  refreshTrigger?: number;
}

const RENEW_OPTIONS = [
  { label: "7 Days", days: 7 },
  { label: "14 Days", days: 14 },
  { label: "30 Days", days: 30 },
  { label: "2 Months", months: 2 },
  { label: "3 Months", months: 3 },
  { label: "6 Months", months: 6 },
  { label: "1 Year", months: 12 },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'signed':
      return { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Signed' };
    case 'pending':
      return { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' };
    case 'expired':
      return { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Expired' };
    case 'cancelled':
      return { icon: XCircle, color: 'bg-slate-100 text-slate-800', label: 'Cancelled' };
    default:
      return { icon: AlertCircle, color: 'bg-blue-100 text-blue-800', label: 'Draft' };
  }
};

const ContractsList = ({ onSelectContract, selectedContractId, refreshTrigger }: ContractsListProps) => {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [renewingContract, setRenewingContract] = useState<Contract | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, [refreshTrigger]);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from("creator_contracts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContract = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this contract?")) return;

    try {
      const { error } = await supabase
        .from("creator_contracts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Contract deleted" });
      fetchContracts();
    } catch (error) {
      console.error("Error deleting contract:", error);
      toast({ title: "Failed to delete contract", variant: "destructive" });
    }
  };

  const openRenewDialog = (contract: Contract, e: React.MouseEvent) => {
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
        .from("creator_contracts")
        .update({
          valid_until: newValidUntil.toISOString(),
          status: "signed",
        })
        .eq("id", renewingContract.id);

      if (error) throw error;

      toast({
        title: "Contract Renewed",
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
    return <div className="animate-pulse h-48 bg-slate-100 rounded-lg" />;
  }

  return (
    <>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Saved Contracts ({contracts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {contracts.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8 px-4">
              No contracts yet. Create your first contract above.
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
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                      }`}
                      onClick={() => onSelectContract(contract)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-800 text-sm truncate">
                            {contract.creator_name}
                          </p>
                          <Badge className={`text-xs ${statusConfig.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>Created: {format(new Date(contract.created_at), 'dd MMM yyyy')}</span>
                          {contract.valid_until && (
                            <span>Expires: {format(new Date(contract.valid_until), 'dd MMM yyyy')}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {contract.owner_signature && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                              Owner Signed
                            </Badge>
                          )}
                          {contract.creator_signature && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                              Creator Signed
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
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
                          <Eye className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              Renew Contract
            </DialogTitle>
            <DialogDescription>
              Extend the contract for <strong>{renewingContract?.creator_name}</strong>.
              {renewingContract?.valid_until && (
                <>
                  {" "}Current expiry:{" "}
                  <strong>{format(new Date(renewingContract.valid_until), "dd MMM yyyy")}</strong>
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
                  className="flex flex-col items-center gap-1 h-auto py-3 hover:border-blue-400 hover:bg-blue-50"
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

export default ContractsList;
