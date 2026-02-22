import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Coins, Gift, Flame, Calendar, Crown, Trophy, Send, ArrowRightLeft,
  Sparkles, Palette, Shield as ShieldIcon, Frame, Type, Star, Lock, Zap,
  TrendingUp, Medal, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: string;
  item_type: string;
  item_data: any;
  price: number;
  is_limited: boolean;
  max_quantity: number | null;
  sold_count: number;
  is_active: boolean;
}

interface InventoryItem {
  id: string;
  item_id: string;
  is_equipped: boolean;
  shop_items?: ShopItem;
}

interface LeaderboardEntry {
  user_id: string;
  balance?: number;
  lifetime_earned?: number;
  lifetime_spent?: number;
  total_earned?: number;
  longest_streak?: number;
  current_streak?: number;
  discord_username?: string;
  discord_id?: string;
  discord_avatar?: string;
}

const CATEGORIES = [
  { id: "username_style", label: "Username Styles", icon: Type, color: "text-cyan-400" },
  { id: "badge", label: "Badges", icon: ShieldIcon, color: "text-amber-400" },
  { id: "profile_frame", label: "Profile Frames", icon: Frame, color: "text-purple-400" },
  { id: "bio_effect", label: "Bio Effects", icon: Sparkles, color: "text-pink-400" },
  { id: "limited", label: "Limited Items", icon: Lock, color: "text-red-400" },
  { id: "elite", label: "Elite Collection", icon: Crown, color: "text-yellow-400" },
];

const LEADERBOARD_TABS = [
  { id: "richest", label: "Richest", icon: Crown },
  { id: "top_earners_month", label: "Top Earners", icon: TrendingUp },
  { id: "top_spenders", label: "Top Spenders", icon: Coins },
  { id: "highest_streak", label: "Streaks", icon: Flame },
];

const StyleEmporium = () => {
  const { toast } = useToast();
  const {
    wallet, streak, dailyEarned, dailyCap, seasonalBalances,
    recentTransactions, canClaimDaily, loading: walletLoading,
    claimDaily, purchaseItem, equipItem, transferTokens, convertSeasonal
  } = useWallet();

  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("username_style");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardType, setLeaderboardType] = useState("richest");
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferDiscordId, setTransferDiscordId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [mainTab, setMainTab] = useState("shop");

  useEffect(() => {
    loadShopItems();
    loadInventory();
  }, []);

  useEffect(() => {
    loadLeaderboard(leaderboardType);
  }, [leaderboardType]);

  const loadShopItems = async () => {
    const { data } = await supabase.from("shop_items").select("*").eq("is_active", true).order("display_order");
    setShopItems(data || []);
  };

  const loadInventory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("user_inventory").select("*, shop_items(*)").eq("user_id", user.id);
    setInventory(data || []);
  };

  const loadLeaderboard = async (type: string) => {
    const { data } = await supabase.functions.invoke("token-economy", {
      body: { action: "get_leaderboard", type }
    });
    setLeaderboard(data?.leaderboard || []);
  };

  const handleClaimDaily = async () => {
    setClaimingDaily(true);
    await claimDaily();
    setClaimingDaily(false);
  };

  const handlePurchase = async (item: ShopItem) => {
    const success = await purchaseItem(item.id);
    if (success) loadInventory();
  };

  const handleEquip = async (itemId: string, category: string) => {
    await equipItem(itemId, category);
    loadInventory();
  };

  const handleTransfer = async () => {
    if (!transferDiscordId || !transferAmount) return;
    const success = await transferTokens(transferDiscordId, parseInt(transferAmount));
    if (success) {
      setShowTransfer(false);
      setTransferDiscordId("");
      setTransferAmount("");
    }
  };

  const filteredItems = shopItems.filter(i => i.category === selectedCategory);
  const ownedIds = new Set(inventory.map(i => i.item_id));
  const equippedIds = new Set(inventory.filter(i => i.is_equipped).map(i => i.item_id));

  const getAvatarUrl = (discordId?: string, avatar?: string) => {
    if (discordId && avatar) return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png?size=64`;
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-primary via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  STYLE EMPORIUM
                </span>
              </h1>
              <p className="text-muted-foreground mt-1">Customize your profile with SLRP Tokens</p>
            </div>
            <div className="flex items-center gap-3">
              <Card className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-amber-500/30">
                <CardContent className="p-3 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span className="text-xl font-bold text-amber-300">{wallet.balance.toLocaleString()}</span>
                  <span className="text-xs text-amber-400/70">SLRP</span>
                </CardContent>
              </Card>
              <Button variant="outline" size="sm" className="border-cyan-500/30 text-cyan-400" onClick={() => setShowTransfer(true)}>
                <Send className="w-4 h-4 mr-1" /> Transfer
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Daily Reward Banner */}
        <AnimatePresence>
          {canClaimDaily && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-6">
              <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-cyan-500/10 border-primary/30 overflow-hidden relative">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Daily Login Reward Available!</p>
                      <p className="text-sm text-muted-foreground">
                        🔥 Streak: {streak.current_streak} days | Claim +25 tokens (+ streak bonuses)
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleClaimDaily} disabled={claimingDaily} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white">
                    {claimingDaily ? "Claiming..." : "Claim Now"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Card className="bg-card/50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-lg font-bold text-amber-400">{wallet.balance.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Lifetime Earned</p>
              <p className="text-lg font-bold text-green-400">{wallet.lifetime_earned.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Lifetime Spent</p>
              <p className="text-lg font-bold text-red-400">{wallet.lifetime_spent.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Streak</p>
              <p className="text-lg font-bold text-orange-400">{streak.current_streak}🔥</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Daily Earned</p>
              <p className="text-lg font-bold">{dailyEarned}/{dailyCap}</p>
            </CardContent>
          </Card>
        </div>

        {/* Seasonal Currency Banners */}
        {seasonalBalances.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {seasonalBalances.map(sb => (
              <Card key={sb.id} className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{sb.seasonal_currencies?.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{sb.seasonal_currencies?.name}</p>
                      <p className="text-xs text-muted-foreground">{sb.balance} tokens</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => convertSeasonal(sb.currency_id, sb.balance)} disabled={sb.balance <= 0}>
                    <ArrowRightLeft className="w-3 h-3 mr-1" /> Convert
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="shop" className="gap-2"><Palette className="w-4 h-4" /> Shop</TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2"><Star className="w-4 h-4" /> My Items</TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2"><Trophy className="w-4 h-4" /> Leaderboard</TabsTrigger>
            <TabsTrigger value="history" className="gap-2"><Clock className="w-4 h-4" /> History</TabsTrigger>
          </TabsList>

          {/* Shop Tab */}
          <TabsContent value="shop">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Category Sidebar */}
              <div className="w-full md:w-56 shrink-0">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    {CATEGORIES.map(cat => (
                      <Button
                        key={cat.id}
                        variant={selectedCategory === cat.id ? "default" : "ghost"}
                        className="w-full justify-start gap-2 mb-1"
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        <cat.icon className={`w-4 h-4 ${selectedCategory === cat.id ? "" : cat.color}`} />
                        {cat.label}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Items Grid */}
              <div className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.length === 0 && (
                    <Card className="col-span-full">
                      <CardContent className="p-8 text-center text-muted-foreground">
                        <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No items available in this category yet.</p>
                        <p className="text-sm">Check back soon!</p>
                      </CardContent>
                    </Card>
                  )}
                  {filteredItems.map(item => {
                    const owned = ownedIds.has(item.id);
                    const equipped = equippedIds.has(item.id);
                    return (
                      <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className={`overflow-hidden transition-all hover:border-primary/50 ${owned ? "border-green-500/30" : ""} ${item.is_limited ? "border-red-500/30" : ""}`}>
                          {/* Item Preview */}
                          <div className="h-32 bg-gradient-to-br from-primary/5 to-purple-500/5 flex items-center justify-center relative">
                            {item.item_type === "color" && (
                              <div className="w-16 h-16 rounded-xl" style={{ backgroundColor: item.item_data?.color || "#fff" }} />
                            )}
                            {item.item_type === "badge" && (
                              <div className="text-4xl">{item.item_data?.emoji || "🏅"}</div>
                            )}
                            {item.item_type === "frame" && (
                              <div className="w-16 h-16 border-4 rounded-xl" style={{ borderColor: item.item_data?.color || "#8b5cf6" }} />
                            )}
                            {item.item_type === "effect" && (
                              <Sparkles className="w-12 h-12 text-purple-400 animate-pulse" />
                            )}
                            {item.item_type === "animated_badge" && (
                              <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="text-4xl">
                                {item.item_data?.emoji || "⚡"}
                              </motion.div>
                            )}
                            {item.is_limited && (
                              <Badge className="absolute top-2 right-2 bg-red-500/90 text-white text-[10px]">
                                LIMITED {item.max_quantity ? `${item.sold_count}/${item.max_quantity}` : ""}
                              </Badge>
                            )}
                            {owned && (
                              <Badge className="absolute top-2 left-2 bg-green-500/90 text-white text-[10px]">OWNED</Badge>
                            )}
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                            {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1">
                                <Coins className="w-3 h-3 text-amber-400" />
                                <span className="text-sm font-bold text-amber-400">{item.price.toLocaleString()}</span>
                              </div>
                              {owned ? (
                                <Button size="sm" variant={equipped ? "default" : "outline"} onClick={() => handleEquip(item.id, item.category)} className="text-xs h-7">
                                  {equipped ? "Equipped ✓" : "Equip"}
                                </Button>
                              ) : (
                                <Button size="sm" onClick={() => handlePurchase(item)} disabled={wallet.balance < item.price} className="text-xs h-7 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                                  Buy
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {inventory.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No items yet. Visit the shop to get started!</p>
                  </CardContent>
                </Card>
              )}
              {inventory.map(inv => {
                const item = inv.shop_items as any as ShopItem;
                if (!item) return null;
                return (
                  <Card key={inv.id} className={`${inv.is_equipped ? "border-primary/50 bg-primary/5" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm">{item.name}</h3>
                        {inv.is_equipped && <Badge variant="default" className="text-[10px]">Active</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{item.category.replace("_", " ")}</p>
                      <Button size="sm" variant={inv.is_equipped ? "outline" : "default"} className="w-full" onClick={() => handleEquip(inv.item_id, item.category)}>
                        {inv.is_equipped ? "Unequip" : "Equip"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {LEADERBOARD_TABS.map(tab => (
                <Button key={tab.id} variant={leaderboardType === tab.id ? "default" : "outline"} size="sm" onClick={() => setLeaderboardType(tab.id)} className="gap-1 whitespace-nowrap">
                  <tab.icon className="w-3 h-3" /> {tab.label}
                </Button>
              ))}
            </div>
            <Card>
              <CardContent className="p-0">
                {leaderboard.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No data yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {leaderboard.map((entry, idx) => (
                      <div key={entry.user_id} className={`flex items-center gap-4 p-4 ${idx < 3 ? "bg-amber-500/5" : ""}`}>
                        <span className={`text-lg font-black w-8 ${idx === 0 ? "text-amber-400" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-700" : "text-muted-foreground"}`}>
                          #{idx + 1}
                        </span>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={getAvatarUrl(entry.discord_id, entry.discord_avatar) || undefined} />
                          <AvatarFallback className="text-xs">{(entry.discord_username || "?")[0]}</AvatarFallback>
                        </Avatar>
                        <span className="flex-1 font-medium text-sm truncate">{entry.discord_username || "Unknown"}</span>
                        <span className="font-bold text-amber-400">
                          {(entry.balance ?? entry.total_earned ?? entry.lifetime_spent ?? entry.longest_streak ?? 0).toLocaleString()}
                          {leaderboardType === "highest_streak" ? " 🔥" : " SLRP"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {recentTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No transactions yet.</p>
                ) : (
                  <div className="space-y-2">
                    {recentTransactions.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{tx.description || tx.source}</p>
                          <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                        </div>
                        <span className={`font-bold ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                          {tx.amount > 0 ? "+" : ""}{tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Transfer Dialog */}
        <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-cyan-400" /> Transfer SLRP Tokens
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Receiver Discord ID</Label>
                <Input placeholder="Enter 17-19 digit Discord ID" value={transferDiscordId} onChange={e => setTransferDiscordId(e.target.value)} />
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" placeholder="Enter amount" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">5% tax will be applied. Total: {transferAmount ? Math.ceil(parseInt(transferAmount) * 1.05) : 0}</p>
              </div>
              <p className="text-sm text-muted-foreground">Your balance: <span className="text-amber-400 font-bold">{wallet.balance.toLocaleString()}</span></p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTransfer(false)}>Cancel</Button>
              <Button onClick={handleTransfer} disabled={!transferDiscordId || !transferAmount} className="bg-gradient-to-r from-cyan-500 to-cyan-600">
                Send Tokens
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StyleEmporium;
