import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOwnerAuditLog } from "@/hooks/useOwnerAuditLog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Coins, TrendingUp, Users, BarChart3, Sparkles, Plus, Pencil, Trash2,
  ArrowUpDown, Loader2, RefreshCw, Zap, Flame, Calendar
} from "lucide-react";
import SlrpToken from "@/components/SlrpToken";

interface EconomyStats {
  totalCirculation: number;
  totalEarned: number;
  totalSpent: number;
  totalUsers: number;
  inflationRate: string;
  recentTransactions: any[];
}

interface SeasonalCurrency {
  id: string;
  name: string;
  slug: string;
  icon: string;
  multiplier: number;
  is_active: boolean;
  activated_at: string | null;
}

interface ShopItemForm {
  name: string;
  description: string;
  category: string;
  item_type: string;
  item_data: any;
  price: number;
  is_limited: boolean;
  max_quantity: number | null;
  is_active: boolean;
  display_order: number;
}

const INITIAL_ITEM: ShopItemForm = {
  name: "", description: "", category: "username_style", item_type: "color",
  item_data: {}, price: 500, is_limited: false, max_quantity: null, is_active: true, display_order: 0
};

const OwnerCurrencyManager = () => {
  const { toast } = useToast();
  const { logAction } = useOwnerAuditLog();
  const [stats, setStats] = useState<EconomyStats | null>(null);
  const [seasonal, setSeasonal] = useState<SeasonalCurrency[]>([]);
  const [shopItems, setShopItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState("overview");
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<ShopItemForm>(INITIAL_ITEM);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    const { data } = await supabase.functions.invoke("token-economy", {
      body: { action: "get_economy_stats" }
    });
    if (data && !data.error) setStats(data);
  }, []);

  const loadSeasonal = useCallback(async () => {
    const { data } = await supabase.from("seasonal_currencies").select("*").order("created_at");
    setSeasonal(data || []);
  }, []);

  const loadShopItems = useCallback(async () => {
    const { data } = await supabase.from("shop_items").select("*").order("display_order");
    setShopItems(data || []);
  }, []);

  useEffect(() => {
    Promise.all([loadStats(), loadSeasonal(), loadShopItems()]).then(() => setLoading(false));

    // Realtime transaction feed
    const channel = supabase
      .channel("owner-economy")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "token_transactions" }, () => loadStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "user_wallets" }, () => loadStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadStats, loadSeasonal, loadShopItems]);

  const toggleSeasonal = async (id: string, currentlyActive: boolean) => {
    const updates: any = { is_active: !currentlyActive, updated_at: new Date().toISOString() };
    if (!currentlyActive) updates.activated_at = new Date().toISOString();
    else updates.deactivated_at = new Date().toISOString();

    await supabase.from("seasonal_currencies").update(updates).eq("id", id);
    logAction({ actionType: "toggle_seasonal_currency", actionDescription: `${currentlyActive ? "Deactivated" : "Activated"} seasonal currency` });
    toast({ title: currentlyActive ? "Currency Deactivated" : "Currency Activated!" });
    loadSeasonal();
  };

  const saveShopItem = async () => {
    if (!itemForm.name) return;
    if (editingItem) {
      await supabase.from("shop_items").update({ ...itemForm, updated_at: new Date().toISOString() }).eq("id", editingItem);
      logAction({ actionType: "update_shop_item", actionDescription: `Updated shop item: ${itemForm.name}` });
    } else {
      await supabase.from("shop_items").insert(itemForm);
      logAction({ actionType: "create_shop_item", actionDescription: `Created shop item: ${itemForm.name}` });
    }
    toast({ title: editingItem ? "Item Updated" : "Item Created" });
    setShowItemDialog(false);
    setEditingItem(null);
    setItemForm(INITIAL_ITEM);
    loadShopItems();
  };

  const deleteShopItem = async (id: string) => {
    await supabase.from("shop_items").delete().eq("id", id);
    logAction({ actionType: "delete_shop_item", actionDescription: "Deleted shop item" });
    toast({ title: "Item Deleted" });
    setDeleteItemId(null);
    loadShopItems();
  };

  const openEditItem = (item: any) => {
    setEditingItem(item.id);
    setItemForm({
      name: item.name, description: item.description || "", category: item.category,
      item_type: item.item_type, item_data: item.item_data || {}, price: item.price,
      is_limited: item.is_limited, max_quantity: item.max_quantity, is_active: item.is_active,
      display_order: item.display_order
    });
    setShowItemDialog(true);
  };

  const getAvatarUrl = (discordId?: string, avatar?: string) => {
    if (discordId && avatar) return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png?size=64`;
    return null;
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-1"><BarChart3 className="w-4 h-4" /> Economy</TabsTrigger>
          <TabsTrigger value="shop" className="gap-1"><Sparkles className="w-4 h-4" /> Shop Items</TabsTrigger>
          <TabsTrigger value="seasonal" className="gap-1"><Calendar className="w-4 h-4" /> Seasonal</TabsTrigger>
          <TabsTrigger value="transactions" className="gap-1"><ArrowUpDown className="w-4 h-4" /> Live Feed</TabsTrigger>
        </TabsList>

        {/* Economy Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30">
              <CardContent className="p-4 text-center">
                <SlrpToken size="lg" className="mx-auto mb-1" />
                <p className="text-2xl font-black text-amber-300">{stats?.totalCirculation?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">In Circulation</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-1" />
                <p className="text-2xl font-black text-green-400">{stats?.totalEarned?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">Total Earned</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-2xl font-black">{stats?.totalUsers || 0}</p>
                <p className="text-xs text-muted-foreground">Users with Wallets</p>
              </CardContent>
            </Card>
            <Card className={`${parseFloat(stats?.inflationRate || "0") > 80 ? "border-red-500/30" : "border-green-500/30"}`}>
              <CardContent className="p-4 text-center">
                <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                <p className="text-2xl font-black">{stats?.inflationRate || "0"}%</p>
                <p className="text-xs text-muted-foreground">Retention Rate</p>
              </CardContent>
            </Card>
          </div>
          <Button onClick={loadStats} variant="outline" size="sm" className="gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh Stats
          </Button>
        </TabsContent>

        {/* Shop Items Management */}
        <TabsContent value="shop">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Shop Items ({shopItems.length})</h3>
            <Button onClick={() => { setEditingItem(null); setItemForm(INITIAL_ITEM); setShowItemDialog(true); }} className="gap-1">
              <Plus className="w-4 h-4" /> Add Item
            </Button>
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shopItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                    <TableCell className="text-amber-400">{item.price}</TableCell>
                    <TableCell>{item.sold_count}{item.max_quantity ? `/${item.max_quantity}` : ""}</TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEditItem(item)}><Pencil className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteItemId(item.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Seasonal Currencies */}
        <TabsContent value="seasonal">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {seasonal.map(sc => (
              <Card key={sc.id} className={sc.is_active ? "border-green-500/30 bg-green-500/5" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{sc.icon}</span>
                      <div>
                        <h3 className="font-bold">{sc.name}</h3>
                        <p className="text-xs text-muted-foreground">{sc.multiplier}x multiplier</p>
                      </div>
                    </div>
                    <Badge variant={sc.is_active ? "default" : "secondary"}>
                      {sc.is_active ? "ACTIVE" : "Inactive"}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => toggleSeasonal(sc.id, sc.is_active)}
                    variant={sc.is_active ? "destructive" : "default"}
                    className="w-full"
                  >
                    {sc.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Live Transaction Feed */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Live Transaction Feed</CardTitle>
                <Badge variant="outline" className="animate-pulse">🔴 Live</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {(stats?.recentTransactions || []).map((tx: any) => (
                  <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/20">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={getAvatarUrl(tx.discord_id, tx.discord_avatar) || undefined} />
                      <AvatarFallback className="text-xs">{(tx.discord_username || "?")[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.discord_username || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground truncate">{tx.description || tx.source}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Shop Item" : "Add Shop Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>Name</Label>
              <Input value={itemForm.name} onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={itemForm.description} onChange={e => setItemForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={itemForm.category} onValueChange={v => setItemForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="username_style">Username Style</SelectItem>
                    <SelectItem value="badge">Badge</SelectItem>
                    <SelectItem value="profile_frame">Profile Frame</SelectItem>
                    <SelectItem value="bio_effect">Bio Effect</SelectItem>
                    <SelectItem value="limited">Limited</SelectItem>
                    <SelectItem value="elite">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Item Type</Label>
                <Select value={itemForm.item_type} onValueChange={v => setItemForm(p => ({ ...p, item_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="color">Color</SelectItem>
                    <SelectItem value="badge">Badge</SelectItem>
                    <SelectItem value="animated_badge">Animated Badge</SelectItem>
                    <SelectItem value="frame">Frame</SelectItem>
                    <SelectItem value="effect">Effect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price (SLRP)</Label>
                <Input type="number" value={itemForm.price} onChange={e => setItemForm(p => ({ ...p, price: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Display Order</Label>
                <Input type="number" value={itemForm.display_order} onChange={e => setItemForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            {/* Item Data - context dependent */}
            {(itemForm.item_type === "color" || itemForm.item_type === "frame") && (
              <div>
                <Label>Color (hex)</Label>
                <div className="flex gap-2">
                  <Input value={itemForm.item_data?.color || ""} onChange={e => setItemForm(p => ({ ...p, item_data: { ...p.item_data, color: e.target.value } }))} placeholder="#ff0000" />
                  <div className="w-10 h-10 rounded border" style={{ backgroundColor: itemForm.item_data?.color || "#000" }} />
                </div>
              </div>
            )}
            {(itemForm.item_type === "badge" || itemForm.item_type === "animated_badge") && (
              <div>
                <Label>Emoji</Label>
                <Input value={itemForm.item_data?.emoji || ""} onChange={e => setItemForm(p => ({ ...p, item_data: { ...p.item_data, emoji: e.target.value } }))} placeholder="🔥" />
              </div>
            )}
            {itemForm.item_type === "effect" && (
              <div>
                <Label>Effect Name</Label>
                <Input value={itemForm.item_data?.effect || ""} onChange={e => setItemForm(p => ({ ...p, item_data: { ...p.item_data, effect: e.target.value } }))} placeholder="sparkle, fire, neon" />
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={itemForm.is_limited} onCheckedChange={v => setItemForm(p => ({ ...p, is_limited: v }))} />
                <Label>Limited Edition</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={itemForm.is_active} onCheckedChange={v => setItemForm(p => ({ ...p, is_active: v }))} />
                <Label>Active</Label>
              </div>
            </div>
            {itemForm.is_limited && (
              <div>
                <Label>Max Quantity</Label>
                <Input type="number" value={itemForm.max_quantity || ""} onChange={e => setItemForm(p => ({ ...p, max_quantity: parseInt(e.target.value) || null }))} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>Cancel</Button>
            <Button onClick={saveShopItem}>{editingItem ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shop Item?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this item from the shop.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteItemId && deleteShopItem(deleteItemId)} className="bg-destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OwnerCurrencyManager;
