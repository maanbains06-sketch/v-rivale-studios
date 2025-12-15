import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Settings, Lock, Unlock, Save } from "lucide-react";
import headerStaff from "@/assets/header-staff.jpg";

interface TeamSetting {
  id: string;
  team_value: string;
  team_label: string;
  team_description: string | null;
  max_members: number;
  is_enabled: boolean;
  current_count?: number;
}

export default function AdminStaffTeams() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [teamSettings, setTeamSettings] = useState<TeamSetting[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAndFetchSettings();
  }, []);

  async function checkAdminAndFetchSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "moderator"])
        .maybeSingle();

      if (!roleData) {
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await fetchTeamSettings();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchTeamSettings() {
    try {
      // Fetch team settings
      const { data: settings, error: settingsError } = await supabase
        .from("staff_team_settings")
        .select("*")
        .order("team_label");

      if (settingsError) throw settingsError;

      // Fetch approved application counts per team
      const { data: approvedApps } = await supabase
        .from("staff_applications")
        .select("position")
        .eq("status", "approved");

      const teamCounts: Record<string, number> = {};
      approvedApps?.forEach(app => {
        teamCounts[app.position] = (teamCounts[app.position] || 0) + 1;
      });

      // Merge counts with settings
      const settingsWithCounts = settings?.map(setting => ({
        ...setting,
        current_count: teamCounts[setting.team_value] || 0
      })) || [];

      setTeamSettings(settingsWithCounts);
    } catch (error) {
      console.error("Error fetching team settings:", error);
      toast({
        title: "Error",
        description: "Failed to load team settings",
        variant: "destructive"
      });
    }
  }

  async function updateTeamSetting(teamId: string, updates: Partial<TeamSetting>) {
    setIsSaving(teamId);
    try {
      const { error } = await supabase
        .from("staff_team_settings")
        .update({
          max_members: updates.max_members,
          is_enabled: updates.is_enabled,
          updated_at: new Date().toISOString()
        })
        .eq("id", teamId);

      if (error) throw error;

      setTeamSettings(prev => 
        prev.map(team => 
          team.id === teamId ? { ...team, ...updates } : team
        )
      );

      toast({
        title: "Settings Updated",
        description: "Team capacity settings have been saved"
      });
    } catch (error) {
      console.error("Error updating team setting:", error);
      toast({
        title: "Update Failed",
        description: "Failed to save team settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(null);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader
        title="Staff Team Management"
        description="Configure team capacities and application settings"
        backgroundImage={headerStaff}
      />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {teamSettings.map(team => (
              <Card key={team.id} className="glass-effect border-primary/20">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {team.is_enabled ? (
                      <Unlock className="h-4 w-4 text-green-500" />
                    ) : (
                      <Lock className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-sm font-medium truncate">{team.team_label.replace(' Team', '')}</span>
                  </div>
                  <div className="text-2xl font-bold">
                    <span className={team.current_count! >= team.max_members ? 'text-destructive' : 'text-primary'}>
                      {team.current_count}
                    </span>
                    <span className="text-muted-foreground">/{team.max_members}</span>
                  </div>
                  <Badge variant={team.current_count! >= team.max_members ? "destructive" : "secondary"} className="mt-1">
                    {team.current_count! >= team.max_members ? "Full" : "Open"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Team Settings Cards */}
          <div className="space-y-6">
            {teamSettings.map(team => (
              <Card key={team.id} className="glass-effect border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{team.team_label}</CardTitle>
                        <CardDescription>{team.team_description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={team.is_enabled ? "default" : "secondary"}>
                      {team.is_enabled ? "Accepting Applications" : "Closed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Current Status */}
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Current Members</Label>
                      <div className="flex items-center gap-2">
                        <div className="text-3xl font-bold">
                          <span className={team.current_count! >= team.max_members ? 'text-destructive' : 'text-foreground'}>
                            {team.current_count}
                          </span>
                          <span className="text-muted-foreground text-xl"> / {team.max_members}</span>
                        </div>
                      </div>
                      {team.current_count! >= team.max_members && (
                        <p className="text-xs text-destructive">Team is full - applications locked</p>
                      )}
                    </div>

                    {/* Max Members Setting */}
                    <div className="space-y-2">
                      <Label htmlFor={`max-${team.id}`}>Maximum Members</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`max-${team.id}`}
                          type="number"
                          min={1}
                          max={20}
                          value={team.max_members}
                          onChange={(e) => {
                            const value = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                            setTeamSettings(prev =>
                              prev.map(t => t.id === team.id ? { ...t, max_members: value } : t)
                            );
                          }}
                          className="w-20"
                        />
                        <Button
                          size="sm"
                          onClick={() => updateTeamSetting(team.id, { max_members: team.max_members })}
                          disabled={isSaving === team.id}
                        >
                          {isSaving === team.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <div className="space-y-2">
                      <Label>Applications Status</Label>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={team.is_enabled}
                          onCheckedChange={(checked) => {
                            updateTeamSetting(team.id, { is_enabled: checked, max_members: team.max_members });
                          }}
                          disabled={isSaving === team.id}
                        />
                        <span className="text-sm">
                          {team.is_enabled ? "Open for applications" : "Closed"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info Box */}
          <Card className="mt-8 border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Settings className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">How Team Capacity Works</p>
                  <ul className="space-y-1">
                    <li>• When a team reaches its maximum members, applications for that team are automatically locked</li>
                    <li>• Disabling a team will hide it from the application form entirely</li>
                    <li>• Members are counted from approved staff applications only</li>
                    <li>• Increasing the max members will automatically unlock the team if it was full</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}