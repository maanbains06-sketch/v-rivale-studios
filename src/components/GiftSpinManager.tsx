import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Gift, Loader2, Send, Trash2, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface GiftedSpin {
  id: string;
  discord_id: string;
  spins_remaining: number;
  gifted_by: string;
  created_at: string;
  updated_at: string;
}

const GiftSpinManager = () => {
  const { toast } = useToast();
  const [discordId, setDiscordId] = useState("");
  const [spinCount, setSpinCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [gifts, setGifts] = useState<GiftedSpin[]>([]);
  const [fetching, setFetching] = useState(true);

  const fetchGifts = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("gifted_spins")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setGifts(data as GiftedSpin[]);
    setFetching(false);
  };

  useEffect(() => {
    fetchGifts();
  }, []);

  const handleGiftSpin = async () => {
    if (!discordId.trim()) {
      toast({ title: "Error", description: "Please enter a Discord ID", variant: "destructive" });
      return;
    }
    if (!/^\d{17,19}$/.test(discordId.trim())) {
      toast({ title: "Error", description: "Invalid Discord ID format (17-19 digits)", variant: "destructive" });
      return;
    }
    if (spinCount < 1 || spinCount > 100) {
      toast({ title: "Error", description: "Spin count must be between 1 and 100", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user already has gifted spins
      const { data: existing } = await supabase
        .from("gifted_spins")
        .select("id, spins_remaining")
        .eq("discord_id", discordId.trim())
        .gt("spins_remaining", 0)
        .maybeSingle();

      if (existing) {
        // Add to existing
        const { error } = await supabase
          .from("gifted_spins")
          .update({ spins_remaining: existing.spins_remaining + spinCount })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("gifted_spins")
          .insert({
            discord_id: discordId.trim(),
            spins_remaining: spinCount,
            gifted_by: user.id,
          });
        if (error) throw error;
      }

      toast({ title: "Success", description: `Gifted ${spinCount} spin(s) to Discord ID: ${discordId}` });
      setDiscordId("");
      setSpinCount(1);
      fetchGifts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("gifted_spins").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Gift removed" });
      fetchGifts();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <CardTitle>Gift Spins</CardTitle>
          </div>
          <CardDescription>Gift free spins to users by their Discord ID. They'll see it on the Spin & Win page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Discord ID</Label>
              <Input
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value)}
                placeholder="e.g., 833680146510381097"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Number of Spins</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={spinCount}
                onChange={(e) => setSpinCount(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>
          <Button onClick={handleGiftSpin} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Gift Spins
          </Button>
        </CardContent>
      </Card>

      {/* Active Gifts */}
      <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Active Gifted Spins</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchGifts} disabled={fetching} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {gifts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No gifted spins yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Discord ID</TableHead>
                  <TableHead className="text-center">Spins Left</TableHead>
                  <TableHead>Gifted At</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gifts.map((gift) => (
                  <TableRow key={gift.id}>
                    <TableCell className="font-mono text-sm">{gift.discord_id}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={gift.spins_remaining > 0 ? "default" : "secondary"}>
                        {gift.spins_remaining}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(gift.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(gift.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GiftSpinManager;
