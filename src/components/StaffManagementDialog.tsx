import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus, Check, RefreshCw } from "lucide-react";

interface StaffMember {
  id?: string;
  name: string;
  discord_id: string;
  discord_username?: string;
  discord_avatar?: string;
  email?: string;
  steam_id?: string;
  role: string;
  role_type: string;
  department: string;
  bio?: string;
  responsibilities: string[];
  is_active: boolean;
  display_order: number;
}

interface StaffManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffMember?: StaffMember | null;
  onSuccess: () => void;
}

export const StaffManagementDialog = ({ open, onOpenChange, staffMember, onSuccess }: StaffManagementDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingDiscord, setFetchingDiscord] = useState(false);
  
  // Initialize form data from staffMember prop
  const getInitialFormData = (member?: StaffMember | null): StaffMember => ({
    id: member?.id,
    name: member?.name || "",
    discord_id: member?.discord_id || "",
    discord_username: member?.discord_username || "",
    discord_avatar: member?.discord_avatar || "",
    email: member?.email || "",
    steam_id: member?.steam_id || "",
    role: member?.role || "",
    role_type: member?.role_type || "staff",
    department: member?.department || "support",
    bio: member?.bio || "",
    responsibilities: member?.responsibilities || [],
    is_active: member?.is_active ?? true,
    display_order: member?.display_order || 0,
  });

  const [formData, setFormData] = useState<StaffMember>(getInitialFormData(staffMember));

  const [responsibilityInput, setResponsibilityInput] = useState("");
  const [discordFetched, setDiscordFetched] = useState(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedIdRef = useRef<string>("");

  // Reset form data when staffMember prop changes or dialog opens
  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData(staffMember));
      setResponsibilityInput("");
      setDiscordFetched(!!staffMember?.discord_avatar);
      lastFetchedIdRef.current = staffMember?.discord_id || "";
    }
  }, [open, staffMember]);

  // Auto-fetch Discord info when a valid Discord ID is entered
  const isValidDiscordId = (id: string) => /^\d{17,19}$/.test(id);

  const fetchDiscordInfo = async (discordId: string, showToast = true) => {
    if (!discordId || !isValidDiscordId(discordId)) {
      return;
    }

    // Don't fetch if we already fetched this ID
    if (lastFetchedIdRef.current === discordId && discordFetched) {
      return;
    }

    setFetchingDiscord(true);
    setDiscordFetched(false);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-discord-user', {
        body: { discordId }
      });

      if (error) throw error;

      lastFetchedIdRef.current = discordId;
      setDiscordFetched(true);

      setFormData(prev => ({
        ...prev,
        name: prev.name || data.globalName || data.displayName,
        discord_username: data.username,
        discord_avatar: data.avatar,
      }));

      if (showToast) {
        toast({
          title: "Discord Info Synced",
          description: `Found: ${data.displayName}`,
        });
      }
    } catch (error: any) {
      console.error("Error fetching Discord info:", error);
      if (showToast) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch Discord information. Make sure the Discord ID is valid.",
          variant: "destructive",
        });
      }
    } finally {
      setFetchingDiscord(false);
    }
  };

  // Auto-fetch when Discord ID changes (with debounce)
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    if (isValidDiscordId(formData.discord_id) && formData.discord_id !== lastFetchedIdRef.current) {
      fetchTimeoutRef.current = setTimeout(() => {
        fetchDiscordInfo(formData.discord_id);
      }, 500);
    }

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [formData.discord_id]);

  // Note: Form reset is now handled in the main useEffect above

  const addResponsibility = () => {
    if (responsibilityInput.trim()) {
      setFormData({
        ...formData,
        responsibilities: [...formData.responsibilities, responsibilityInput.trim()]
      });
      setResponsibilityInput("");
    }
  };

  const removeResponsibility = (index: number) => {
    setFormData({
      ...formData,
      responsibilities: formData.responsibilities.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name?.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.role?.trim()) {
      toast({
        title: "Error",
        description: "Role Title is required",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        // Generate unique discord_id if not provided for new members
        discord_id: formData.discord_id?.trim() || `MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        // Ensure responsibilities is an array
        responsibilities: formData.responsibilities || [],
      };

      if (staffMember?.id) {
        // Update existing staff member - remove id from update data
        const { id, ...updateData } = submitData;
        const { error } = await supabase
          .from("staff_members")
          .update(updateData)
          .eq("id", staffMember.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Staff member updated successfully",
        });
      } else {
        // Create new staff member - remove id from insert data
        const { id, ...insertData } = submitData;
        const { error } = await supabase
          .from("staff_members")
          .insert([insertData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Staff member added successfully",
        });
      }

      // Send Discord welcome message only for NEW staff members
      if (!staffMember?.id) {
        try {
          await supabase.functions.invoke('send-staff-welcome', {
            body: {
              staffName: submitData.name?.trim(),
              staffDiscordId: submitData.discord_id?.startsWith('MANUAL-') ? null : submitData.discord_id,
              department: submitData.department,
              rank: submitData.role,
              avatarUrl: submitData.discord_avatar || null,
            }
          });
          toast({
            title: "Discord Welcome Sent",
            description: "Welcome message posted to Discord!",
          });
        } catch (welcomeErr) {
          console.error('Failed to send welcome message:', welcomeErr);
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving staff member:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save staff member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {staffMember ? "Edit Staff Member" : "Add Staff Member"}
          </DialogTitle>
          <DialogDescription>
            {staffMember ? "Update staff member information" : "Add a new staff member to the team"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Discord ID - Auto-fetches info */}
          <div className="space-y-2">
            <Label htmlFor="discord_id">Discord ID (Optional)</Label>
            <p className="text-xs text-muted-foreground">
              Paste a Discord ID for auto-sync, or leave empty for manual entry
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="discord_id"
                  value={formData.discord_id}
                  onChange={(e) => setFormData({ ...formData, discord_id: e.target.value })}
                  placeholder="Enter Discord ID (optional)..."
                  className={`pr-10 ${discordFetched ? 'border-green-500 bg-green-500/5' : ''}`}
                />
                {fetchingDiscord && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
                {discordFetched && !fetchingDiscord && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
              </div>
              <Button
                type="button"
                onClick={() => fetchDiscordInfo(formData.discord_id)}
                disabled={fetchingDiscord || !isValidDiscordId(formData.discord_id)}
                variant="outline"
                size="icon"
                title="Refresh Discord info"
              >
                <RefreshCw className={`w-4 h-4 ${fetchingDiscord ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            {formData.discord_avatar && (
              <div className="flex items-center gap-3 mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <img src={formData.discord_avatar} alt="Discord Avatar" className="w-12 h-12 rounded-full ring-2 ring-green-500/30" />
                <div className="text-sm flex-1">
                  <p className="font-semibold text-foreground">{formData.name || formData.discord_username}</p>
                  <p className="text-xs text-muted-foreground">@{formData.discord_username}</p>
                </div>
                <Check className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discord_username">Discord Username</Label>
              <Input
                id="discord_username"
                value={formData.discord_username}
                onChange={(e) => setFormData({ ...formData, discord_username: e.target.value })}
                placeholder="Auto-populated from Discord"
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">This field is auto-filled when fetching Discord info</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="steam_id">Steam ID</Label>
              <Input
                id="steam_id"
                value={formData.steam_id}
                onChange={(e) => setFormData({ ...formData, steam_id: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role Title *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., Head Administrator"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role_type">Role Type *</Label>
              <Select
                value={formData.role_type}
                onValueChange={(value) => setFormData({ ...formData, role_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="event_manager">Event Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Select
              value={formData.department}
              onValueChange={(value) => setFormData({ ...formData, department: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="management">Management Team</SelectItem>
                <SelectItem value="leadership">Leadership Team</SelectItem>
                <SelectItem value="administration">Administration Team</SelectItem>
                <SelectItem value="staff">Staff Team</SelectItem>
                <SelectItem value="development">Development Team</SelectItem>
                <SelectItem value="support">Support Team</SelectItem>
                <SelectItem value="events">Events Team</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Brief description about this staff member..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Responsibilities</Label>
            <div className="flex gap-2">
              <Input
                value={responsibilityInput}
                onChange={(e) => setResponsibilityInput(e.target.value)}
                placeholder="Add a responsibility"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addResponsibility())}
              />
              <Button type="button" onClick={addResponsibility} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.responsibilities.map((resp, index) => (
                <div key={index} className="bg-secondary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {resp}
                  <button
                    type="button"
                    onClick={() => removeResponsibility(index)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <Select
                value={formData.is_active ? "active" : "inactive"}
                onValueChange={(value) => setFormData({ ...formData, is_active: value === "active" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {staffMember ? "Update" : "Add"} Staff Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
