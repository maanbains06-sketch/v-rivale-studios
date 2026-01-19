import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useOwnerAuditLog } from '@/hooks/useOwnerAuditLog';
import { 
  Ticket, 
  Loader2, 
  Plus, 
  Trash2, 
  Copy,
  Check,
  RefreshCw,
  DollarSign,
  Calendar
} from 'lucide-react';
import { format, addDays } from 'date-fns';

interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  is_used: boolean;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
  user_id: string | null;
  used_by: string | null;
}

export const PromoCodeManager = () => {
  const { toast } = useToast();
  const { logAction } = useOwnerAuditLog();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [discount, setDiscount] = useState(10);
  const [expiryDays, setExpiryDays] = useState(30);
  const [codePrefix, setCodePrefix] = useState('SLRP');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = codePrefix.toUpperCase() + '-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createPromoCode = async () => {
    setCreating(true);
    try {
      const code = generateCode();
      const expiresAt = addDays(new Date(), expiryDays);

      const { data, error } = await supabase
        .from('promo_codes')
        .insert({
          code,
          discount_percentage: discount,
          expires_at: expiresAt.toISOString(),
          is_used: false
        })
        .select()
        .single();

      if (error) throw error;

      await logAction({
        actionType: 'promo_create',
        actionDescription: `Created promo code: ${code} (${discount}% off)`,
        targetTable: 'promo_codes',
        targetId: data.id,
        newValue: { code, discount_percentage: discount, expires_at: expiresAt }
      });

      toast({
        title: "Promo Code Created",
        description: `Code ${code} has been created with ${discount}% discount.`,
      });

      fetchPromoCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create promo code",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const deletePromoCode = async (id: string, code: string) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await logAction({
        actionType: 'promo_delete',
        actionDescription: `Deleted promo code: ${code}`,
        targetTable: 'promo_codes',
        targetId: id
      });

      toast({
        title: "Promo Code Deleted",
        description: `Code ${code} has been deleted.`,
      });

      fetchPromoCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete promo code",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({
        title: "Copied!",
        description: `Code ${code} copied to clipboard.`,
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive",
      });
    }
  };

  const getStatus = (promo: PromoCode) => {
    if (promo.is_used) return { label: 'Used', color: 'bg-green-500/20 text-green-400' };
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) return { label: 'Expired', color: 'bg-red-500/20 text-red-400' };
    return { label: 'Active', color: 'bg-blue-500/20 text-blue-400' };
  };

  // Stats
  const totalCodes = promoCodes.length;
  const usedCodes = promoCodes.filter(p => p.is_used).length;
  const activeCodes = promoCodes.filter(p => !p.is_used && (!p.expires_at || new Date(p.expires_at) > new Date())).length;
  const expiredCodes = promoCodes.filter(p => !p.is_used && p.expires_at && new Date(p.expires_at) < new Date()).length;

  if (loading) {
    return (
      <Card className="glass-effect border-border/20">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-border/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              <CardTitle className="text-gradient">Promo Codes for Tebex</CardTitle>
            </div>
            <CardDescription>Create and manage discount codes for the store</CardDescription>
          </div>
          <Button onClick={fetchPromoCodes} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground">Total Codes</p>
            <p className="text-2xl font-bold">{totalCodes}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-xs text-blue-400">Active</p>
            <p className="text-2xl font-bold text-blue-400">{activeCodes}</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <p className="text-xs text-green-400">Used</p>
            <p className="text-2xl font-bold text-green-400">{usedCodes}</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-xs text-red-400">Expired</p>
            <p className="text-2xl font-bold text-red-400">{expiredCodes}</p>
          </div>
        </div>

        {/* Create New Code */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <Label className="font-semibold">Create New Promo Code</Label>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Code Prefix</Label>
              <Input
                value={codePrefix}
                onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
                placeholder="SLRP"
                maxLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label>Discount (%)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={discount}
                onChange={(e) => setDiscount(parseInt(e.target.value) || 10)}
              />
            </div>
            <div className="space-y-2">
              <Label>Expires In (Days)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value) || 30)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={createPromoCode} disabled={creating} className="w-full">
                {creating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Code
              </Button>
            </div>
          </div>
        </div>

        {/* Codes Table */}
        {promoCodes.length === 0 ? (
          <div className="text-center py-8">
            <Ticket className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No promo codes yet</p>
            <p className="text-sm text-muted-foreground">Create your first code using the form above</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoCodes.slice(0, 20).map((promo) => {
                const status = getStatus(promo);
                return (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                          {promo.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(promo.code)}
                          className="h-7 w-7 p-0"
                        >
                          {copiedCode === promo.code ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-green-400">
                        <DollarSign className="w-4 h-4" />
                        {promo.discount_percentage}% OFF
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={status.color}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {promo.expires_at ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(promo.expires_at), 'MMM d, yyyy')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deletePromoCode(promo.id, promo.code)}
                        disabled={promo.is_used}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
