import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus } from "lucide-react";

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
  
  const [formData, setFormData] = useState<StaffMember>({
    name: staffMember?.name || "",
    discord_id: staffMember?.discord_id || "",
    discord_username: staffMember?.discord_username || "",
    discord_avatar: staffMember?.discord_avatar || "",
    email: staffMember?.email || "",
    steam_id: staffMember?.steam_id || "",
    role: staffMember?.role || "",
    role_type: staffMember?.role_type || "staff",
    department: staffMember?.department || "support",
    bio: staffMember?.bio || "",
    responsibilities: staffMember?.responsibilities || [],
    is_active: staffMember?.is_active ?? true,
    display_order: staffMember?.display_order || 0,
  });

  const [responsibilityInput, setResponsibilityInput] = useState("");

  const fetchDiscordInfo = async () => {
    if (!formData.discord_id) {
      toast({
        title: "Error",
        description: "Please enter a Discord ID first",
        variant: "destructive",
      });
      return;
    }

    setFetchingDiscord(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-discord-user', {
        body: { discordId: formData.discord_id }
      });

      if (error) throw error;

      setFormData({
        ...formData,
        name: formData.name || data.globalName,
        discord_username: data.displayName,
        discord_avatar: data.avatar,
      });

      toast({
        title: "Success",
        description: "Discord information fetched successfully",
      });
    } catch (error: any) {
      console.error("Error fetching Discord info:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch Discord information. Make sure the Discord ID is valid.",
        variant: "destructive",
      });
    } finally {
      setFetchingDiscord(false);
    }
  };

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
    setLoading(true);

    try {
      if (staffMember?.id) {
        // Update existing staff member
        const { error } = await supabase
          .from("staff_members")
          .update(formData)
          .eq("id", staffMember.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Staff member updated successfully",
        });
      } else {
        // Create new staff member
        const { error } = await supabase
          .from("staff_members")
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Staff member added successfully",
        });
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
          {/* Discord ID with Fetch Button */}
          <div className="space-y-2">
            <Label htmlFor="discord_id">Discord ID *</Label>
            <p className="text-xs text-muted-foreground">
              Enter the Discord ID and click "Fetch Info" to automatically populate username and avatar
            </p>
            <div className="flex gap-2">
              <Input
                id="discord_id"
                value={formData.discord_id}
                onChange={(e) => setFormData({ ...formData, discord_id: e.target.value })}
                placeholder="123456789012345678"
                required
                className="flex-1"
              />
              <Button
                type="button"
                onClick={fetchDiscordInfo}
                disabled={fetchingDiscord || !formData.discord_id}
                variant="secondary"
                className="whitespace-nowrap"
              >
                {fetchingDiscord ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Fetch Info
                  </>
                )}
              </Button>
            </div>
            {formData.discord_avatar && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded-lg">
                <img src={formData.discord_avatar} alt="Discord Avatar" className="w-10 h-10 rounded-full" />
                <div className="text-sm">
                  <p className="font-medium">{formData.discord_username}</p>
                  <p className="text-xs text-muted-foreground">Avatar fetched from Discord</p>
                </div>
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
                <SelectItem value="leadership">Leadership Team</SelectItem>
                <SelectItem value="administration">Administration Team</SelectItem>
                <SelectItem value="moderation">Moderation Team</SelectItem>
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
