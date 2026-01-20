import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserPlus, Search, Check, AlertCircle } from "lucide-react";

interface AddStaffByDiscordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentLabel: string;
  departmentKey: string;
  ranks: string[];
  divisionOptions: { value: string; label: string }[];
  unitOptions: { value: string; label: string }[];
  onSuccess: () => void;
}

interface DiscordUserInfo {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  banner_url?: string;
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On Leave' },
];

const AddStaffByDiscordDialog = ({
  open,
  onOpenChange,
  departmentLabel,
  departmentKey,
  ranks,
  divisionOptions,
  unitOptions,
  onSuccess,
}: AddStaffByDiscordDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [discordId, setDiscordId] = useState('');
  const [discordInfo, setDiscordInfo] = useState<DiscordUserInfo | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    rank: '',
    badge_number: '',
    status: 'active',
    division: '',
    call_sign: '',
    strikes: '0/3',
  });

  const fetchDiscordUser = async () => {
    if (!discordId.trim()) {
      toast.error('Please enter a Discord ID');
      return;
    }

    // Validate Discord ID format (17-19 digits)
    if (!/^\d{17,19}$/.test(discordId.trim())) {
      toast.error('Invalid Discord ID format. Must be 17-19 digits.');
      return;
    }

    setFetching(true);
    setFetchError(null);
    setDiscordInfo(null);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-discord-user', {
        body: { discordId: discordId.trim() }
      });

      if (error) throw error;

      if (data?.error) {
        setFetchError(data.error);
        return;
      }

      if (data?.username) {
        setDiscordInfo({
          id: discordId.trim(),
          username: data.username,
          display_name: data.display_name || data.global_name,
          avatar_url: data.avatar_url,
          banner_url: data.banner_url,
        });
        toast.success(`Found: ${data.display_name || data.username}`);
      } else {
        setFetchError('User not found or not in server');
      }
    } catch (error: any) {
      console.error('Error fetching Discord user:', error);
      setFetchError(error.message || 'Failed to fetch Discord user');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!discordInfo) {
      toast.error('Please fetch Discord user first');
      return;
    }

    if (!formData.rank) {
      toast.error('Please select a rank');
      return;
    }

    setLoading(true);
    try {
      // Determine role_type based on department
      const getRoleType = (deptKey: string): string => {
        if (deptKey === 'staff') return 'staff';
        return 'member';
      };

      const { error } = await supabase
        .from('staff_members')
        .insert({
          name: discordInfo.display_name || discordInfo.username,
          discord_id: discordInfo.id,
          discord_username: discordInfo.username,
          discord_avatar: discordInfo.avatar_url || null,
          discord_banner: discordInfo.banner_url || null,
          role: formData.rank,
          role_type: getRoleType(departmentKey),
          department: departmentKey,
          badge_number: formData.badge_number || null,
          status: formData.status,
          division: formData.division || null,
          call_sign: formData.call_sign || null,
          strikes: formData.strikes || '0/3',
          is_active: formData.status === 'active',
        });

      if (error) throw error;

      toast.success(`${discordInfo.display_name || discordInfo.username} added successfully!`);
      
      // Reset form
      setDiscordId('');
      setDiscordInfo(null);
      setFormData({
        rank: '',
        badge_number: '',
        status: 'active',
        division: '',
        call_sign: '',
        strikes: '0/3',
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding staff:', error);
      toast.error(error.message || 'Failed to add staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDiscordId('');
    setDiscordInfo(null);
    setFetchError(null);
    setFormData({
      rank: '',
      badge_number: '',
      status: 'active',
      division: '',
      call_sign: '',
      strikes: '0/3',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-card border border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="w-5 h-5 text-primary" />
            Add Staff to {departmentLabel}
          </DialogTitle>
          <DialogDescription>
            Enter a Discord ID to auto-fetch user details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Discord ID Input */}
          <div className="space-y-3">
            <Label htmlFor="discord_id" className="text-sm font-medium">
              Discord ID <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="discord_id"
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value)}
                placeholder="e.g., 833680146510381097"
                className="h-10 font-mono flex-1"
                disabled={fetching}
              />
              <Button
                type="button"
                onClick={fetchDiscordUser}
                disabled={fetching || !discordId.trim()}
                variant="secondary"
              >
                {fetching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Right-click on a Discord user → Copy User ID
            </p>
          </div>

          {/* Discord User Preview */}
          {discordInfo && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 border-2 border-green-500/50">
                  <AvatarImage src={discordInfo.avatar_url} alt={discordInfo.username} />
                  <AvatarFallback className="bg-green-500/20 text-green-400">
                    {discordInfo.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {discordInfo.display_name || discordInfo.username}
                    </span>
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-sm text-muted-foreground">@{discordInfo.username}</span>
                </div>
              </div>
            </div>
          )}

          {/* Fetch Error */}
          {fetchError && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-sm text-destructive">{fetchError}</span>
            </div>
          )}

          {/* Only show other fields if Discord info is fetched */}
          {discordInfo && (
            <>
              {/* Rank Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="rank" className="text-sm font-medium">
                  Rank <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.rank}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, rank: value }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border z-50">
                    {ranks.map(rank => (
                      <SelectItem key={rank} value={rank}>
                        {rank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Badge Number */}
              <div className="space-y-2">
                <Label htmlFor="badge" className="text-sm font-medium">Badge Number</Label>
                <Input
                  id="badge"
                  value={formData.badge_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, badge_number: e.target.value }))}
                  placeholder="e.g., 1-ADAM-1"
                  className="h-10 font-mono"
                />
              </div>

              {/* Status Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border z-50">
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Division Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="division" className="text-sm font-medium">Division</Label>
                <Select
                  value={formData.division}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, division: value }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border z-50">
                    {divisionOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Unit Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="unit" className="text-sm font-medium">Unit</Label>
                <Select
                  value={formData.call_sign}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, call_sign: value }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border z-50">
                    {unitOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Strikes */}
              <div className="space-y-2">
                <Label htmlFor="strikes" className="text-sm font-medium">Strikes</Label>
                <Input
                  id="strikes"
                  value={formData.strikes}
                  onChange={(e) => setFormData(prev => ({ ...prev, strikes: e.target.value }))}
                  placeholder="e.g., 0/3"
                  className="h-10"
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !discordInfo} className="gap-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Add Staff
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStaffByDiscordDialog;
