import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDiscordNames } from "@/hooks/useDiscordNames";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Shield, UserPlus, Trash2, Search, RefreshCw, 
  Building2, Briefcase, Users, Settings, CheckCircle, XCircle, FileText
} from "lucide-react";
import { format } from "date-fns";

interface PanelAccessEntry {
  id: string;
  discord_id: string;
  discord_username: string | null;
  panel_type: string;
  granted_by: string | null;
  granted_at: string;
  is_active: boolean;
  notes: string | null;
  roster_departments: string[] | null;
  departments: string[] | null;
}

interface DiscordUserInfo {
  username: string;
  avatar: string | null;
  global_name: string | null;
}

// Contract Panel is owner-only by default, but owner can manually grant access
const PANEL_TYPES = [
  { id: "business", label: "Business Panel", icon: Building2, description: "Manage business job applications", hasDepartments: true },
  { id: "job", label: "Job Panel", icon: Briefcase, description: "Manage department job applications", hasDepartments: true },
  { id: "roster", label: "Roster Panel", icon: Users, description: "View and edit department rosters", hasDepartments: true },
  { id: "admin", label: "Admin Panel", icon: Settings, description: "Full admin access to all features", hasDepartments: false },
  { id: "contract", label: "Contract Panel", icon: FileText, description: "Manage creator contracts (Owner-only by default)", hasDepartments: false },
  { id: "staff_contract", label: "Staff Contract", icon: Shield, description: "Access Staff & Administrator Agreement contracts", hasDepartments: false },
  { id: "creator_contract", label: "Creator Contract", icon: FileText, description: "Access Content Creator contracts", hasDepartments: false },
];

// Department options for each panel type
const PANEL_DEPARTMENTS: Record<string, { id: string; label: string; description: string }[]> = {
  business: [
    { id: "all", label: "All Business Types", description: "Access to all business applications" },
    { id: "restaurant", label: "Restaurant", description: "Restaurant business applications" },
    { id: "dealership", label: "Dealership", description: "Vehicle dealership applications" },
    { id: "nightclub", label: "Nightclub", description: "Nightclub/bar applications" },
    { id: "retail", label: "Retail Store", description: "Retail store applications" },
    { id: "services", label: "Services", description: "Service business applications" },
  ],
  job: [
    { id: "all", label: "All Departments", description: "Access to all job applications" },
    { id: "pd", label: "Police Department", description: "Police job applications" },
    { id: "ems", label: "EMS Department", description: "EMS job applications" },
    { id: "fire", label: "Fire Department", description: "Fire dept job applications" },
    { id: "mechanic", label: "Mechanic Shop", description: "Mechanic job applications" },
    { id: "doj", label: "Department of Justice", description: "DOJ job applications" },
    { id: "state", label: "State Department", description: "State dept job applications" },
    { id: "weazel", label: "Weazel News", description: "Weazel News job applications" },
    { id: "pdm", label: "Premium Deluxe Motorsport", description: "PDM job applications" },
  ],
  roster: [
    { id: "all", label: "All Departments", description: "Access to all department rosters" },
    { id: "police", label: "Police Department", description: "SLPD roster access" },
    { id: "ems", label: "EMS Department", description: "EMS roster access" },
    { id: "fire", label: "Fire Department", description: "Fire dept roster access" },
    { id: "mechanic", label: "Mechanic Shop", description: "Mechanic roster access" },
    { id: "doj", label: "Department of Justice", description: "DOJ roster access" },
    { id: "state", label: "State Department", description: "State dept roster access" },
    { id: "weazel", label: "Weazel News", description: "Weazel News roster access" },
    { id: "pdm", label: "Premium Deluxe Motorsport", description: "PDM roster access" },
    { id: "staff", label: "Server Staff", description: "Staff roster access" },
  ],
};

// Backward compatibility - keep ROSTER_DEPARTMENTS for existing code
const ROSTER_DEPARTMENTS = PANEL_DEPARTMENTS.roster;

const PanelAccessManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<PanelAccessEntry[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [panelFilter, setPanelFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Add form state
  const [newDiscordId, setNewDiscordId] = useState("");
  const [newPanelType, setNewPanelType] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newDepartments, setNewDepartments] = useState<string[]>([]);
  const [newRosterDepartments, setNewRosterDepartments] = useState<string[]>([]); // Keep for backward compatibility
  const [fetchingUser, setFetchingUser] = useState(false);
  const [fetchedUser, setFetchedUser] = useState<DiscordUserInfo | null>(null);
  const [fetchError, setFetchError] = useState("");

  // Collect all Discord IDs from entries and staff members
  const allDiscordIds = [
    ...entries.map(e => e.discord_id),
    ...staffMembers.map(s => s.discord_id)
  ].filter(Boolean);
  
  // Fetch Discord names for all entries
  const { getDisplayName, getAvatar, isLoading: discordLoading, nameCache, refetch: refetchDiscord } = useDiscordNames(allDiscordIds);

  useEffect(() => {
    loadEntries();
    loadStaffMembers();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("panel_access")
        .select("*")
        .order("granted_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error loading panel access:", error);
      toast({
        title: "Error",
        description: "Failed to load panel access entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("staff_members")
        .select("id, discord_id, discord_username, discord_avatar, name, role, is_active")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (error) {
      console.error("Error loading staff members:", error);
    }
  };

  const fetchDiscordUser = async () => {
    if (!newDiscordId || !/^\d{17,19}$/.test(newDiscordId)) {
      setFetchError("Please enter a valid Discord ID (17-19 digits)");
      return;
    }

    setFetchingUser(true);
    setFetchError("");
    setFetchedUser(null);

    try {
      const { data, error } = await supabase.functions.invoke("fetch-discord-user", {
        body: { discordId: newDiscordId },
      });

      // Handle both direct response and nested user format
      const userData = data?.user || data;
      
      if (error || !userData) {
        setFetchError("Could not find Discord user");
        return;
      }

      setFetchedUser({
        username: userData.username,
        avatar: userData.avatar || null,
        global_name: userData.globalName || userData.global_name || userData.displayName,
      });
    } catch (error) {
      console.error("Error fetching Discord user:", error);
      setFetchError("Failed to fetch Discord user");
    } finally {
      setFetchingUser(false);
    }
  };

  const handleAddAccess = async () => {
    if (!newDiscordId || !newPanelType) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get departments for the selected panel type
      const panelHasDepts = PANEL_TYPES.find(p => p.id === newPanelType)?.hasDepartments;
      const selectedDepts = panelHasDepts 
        ? (newDepartments.includes("all") ? null : newDepartments.length > 0 ? newDepartments : null)
        : null;
      
      // For roster panel, also set roster_departments for backward compatibility
      const rosterDepts = newPanelType === "roster" ? selectedDepts : null;
      
      const { error } = await supabase
        .from("panel_access")
        .insert({
          discord_id: newDiscordId,
          discord_username: fetchedUser?.global_name || fetchedUser?.username || null,
          panel_type: newPanelType,
          granted_by: user?.id,
          notes: newNotes || null,
          roster_departments: rosterDepts,
          departments: selectedDepts,
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already Exists",
            description: "This user already has access to this panel",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Access Granted",
        description: `Panel access granted to ${fetchedUser?.username || newDiscordId}`,
      });

      setShowAddDialog(false);
      resetAddForm();
      loadEntries();
    } catch (error) {
      console.error("Error adding access:", error);
      toast({
        title: "Error",
        description: "Failed to grant panel access",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (entry: PanelAccessEntry) => {
    try {
      const { error } = await supabase
        .from("panel_access")
        .update({ is_active: !entry.is_active })
        .eq("id", entry.id);

      if (error) throw error;

      toast({
        title: entry.is_active ? "Access Disabled" : "Access Enabled",
        description: `Panel access ${entry.is_active ? "disabled" : "enabled"} for ${entry.discord_username || entry.discord_id}`,
      });

      loadEntries();
    } catch (error) {
      console.error("Error toggling access:", error);
      toast({
        title: "Error",
        description: "Failed to update access",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccess = async (id: string) => {
    try {
      const { error } = await supabase
        .from("panel_access")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Access Removed",
        description: "Panel access has been removed",
      });

      loadEntries();
    } catch (error) {
      console.error("Error deleting access:", error);
      toast({
        title: "Error",
        description: "Failed to remove access",
        variant: "destructive",
      });
    }
  };

  const resetAddForm = () => {
    setNewDiscordId("");
    setNewPanelType("");
    setNewNotes("");
    setNewDepartments([]);
    setNewRosterDepartments([]);
    setFetchedUser(null);
    setFetchError("");
  };

  // Toggle department selection (generic for any panel type)
  const toggleDepartment = (deptId: string) => {
    if (deptId === "all") {
      // If "all" is selected, clear others and just set "all"
      setNewDepartments(prev => prev.includes("all") ? [] : ["all"]);
    } else {
      setNewDepartments(prev => {
        // Remove "all" if another specific dept is selected
        const filtered = prev.filter(d => d !== "all");
        if (filtered.includes(deptId)) {
          return filtered.filter(d => d !== deptId);
        }
        return [...filtered, deptId];
      });
    }
  };

  // Get departments display for any panel type
  const getDepartmentsDisplay = (entry: PanelAccessEntry) => {
    const panelConfig = PANEL_TYPES.find(p => p.id === entry.panel_type);
    if (!panelConfig?.hasDepartments) return null;
    
    // Use departments or fall back to roster_departments for backward compatibility
    const departments = entry.departments || entry.roster_departments;
    
    if (!departments || departments.length === 0) {
      return <Badge variant="outline" className="text-xs">All {entry.panel_type === "business" ? "Types" : "Departments"}</Badge>;
    }
    if (departments.includes("all")) {
      return <Badge variant="outline" className="text-xs">All {entry.panel_type === "business" ? "Types" : "Departments"}</Badge>;
    }
    
    const deptConfig = PANEL_DEPARTMENTS[entry.panel_type] || [];
    return (
      <div className="flex flex-wrap gap-1">
        {departments.slice(0, 2).map(dept => (
          <Badge key={dept} variant="secondary" className="text-xs">
            {deptConfig.find(d => d.id === dept)?.label || dept}
          </Badge>
        ))}
        {departments.length > 2 && (
          <Badge variant="outline" className="text-xs">+{departments.length - 2}</Badge>
        )}
      </div>
    );
  };

  // Keep old function for backward compatibility
  const getRosterDepartmentsDisplay = (entry: PanelAccessEntry) => getDepartmentsDisplay(entry);

  const getPanelIcon = (panelType: string) => {
    const panel = PANEL_TYPES.find(p => p.id === panelType);
    if (!panel) return <Shield className="h-4 w-4" />;
    const Icon = panel.icon;
    return <Icon className="h-4 w-4" />;
  };

  const getPanelLabel = (panelType: string) => {
    return PANEL_TYPES.find(p => p.id === panelType)?.label || panelType;
  };

  const filteredEntries = entries.filter(entry => {
    const displayName = getDisplayName(entry.discord_id) || entry.discord_username || '';
    const matchesSearch = 
      entry.discord_id.includes(searchQuery) ||
      displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.discord_username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPanel = panelFilter === "all" || entry.panel_type === panelFilter;
    return matchesSearch && matchesPanel;
  });

  // Group entries by Discord ID for display
  const groupedByUser = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.discord_id]) {
      acc[entry.discord_id] = {
        discord_id: entry.discord_id,
        discord_username: entry.discord_username,
        panels: [],
      };
    }
    acc[entry.discord_id].panels.push(entry);
    return acc;
  }, {} as Record<string, { discord_id: string; discord_username: string | null; panels: PanelAccessEntry[] }>);

  // Group entries by panel type
  const entriesByPanel = PANEL_TYPES.reduce((acc, panel) => {
    acc[panel.id] = entries.filter(e => e.panel_type === panel.id && e.is_active);
    return acc;
  }, {} as Record<string, PanelAccessEntry[]>);

  // Get display name from Discord API or fallback to stored username or staff member info
  const getEntryDisplayName = (entry: PanelAccessEntry) => {
    // First check if we have a fetched name from Discord API
    const fetchedName = getDisplayName(entry.discord_id);
    if (fetchedName) return fetchedName;
    
    // Fallback to stored username
    if (entry.discord_username) return entry.discord_username;
    
    // Check if this is a staff member
    const staffMember = staffMembers.find(s => s.discord_id === entry.discord_id);
    if (staffMember) return staffMember.name || staffMember.discord_username;
    
    return "Unknown User";
  };

  const getEntryAvatar = (discordId: string) => {
    // First check Discord API fetched avatar
    const fetchedAvatar = getAvatar(discordId);
    if (fetchedAvatar) return fetchedAvatar;
    
    // Fallback to staff member avatar
    const staffMember = staffMembers.find(s => s.discord_id === discordId);
    if (staffMember?.discord_avatar) return staffMember.discord_avatar;
    
    return null;
  };

  const handleRefresh = async () => {
    await loadEntries();
    await loadStaffMembers();
    refetchDiscord();
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Panel Access Management
            </CardTitle>
            <CardDescription>
              Grant and manage access to admin panels by Discord ID
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Access
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Panel Overview Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              All ({entries.filter(e => e.is_active).length})
            </TabsTrigger>
            {PANEL_TYPES.map(panel => {
              const count = entriesByPanel[panel.id]?.length || 0;
              return (
                <TabsTrigger key={panel.id} value={panel.id} className="flex items-center gap-2">
                  <panel.icon className="h-4 w-4" />
                  {panel.label} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* All Users Tab */}
          <TabsContent value="all">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Discord ID or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin" />
                <p>Loading access entries...</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="space-y-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No panel access entries found</p>
                  <p className="text-sm mt-2">Add users by clicking "Add Access" to grant panel permissions</p>
                </div>
                
                {/* Show Staff Members Section */}
                {staffMembers.length > 0 && (
                  <Card className="border-border/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Staff Members (Auto Access)
                      </CardTitle>
                      <CardDescription>
                        These staff members have automatic access based on their roles
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {staffMembers.map(staff => {
                          const displayName = getDisplayName(staff.discord_id) || staff.name || staff.discord_username;
                          const avatar = getAvatar(staff.discord_id) || staff.discord_avatar;
                          return (
                            <div key={staff.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={avatar || undefined} />
                                <AvatarFallback className="bg-primary/20 text-primary">
                                  {displayName?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{displayName}</p>
                                <p className="text-xs text-muted-foreground">{staff.role}</p>
                              </div>
                              <Badge variant="secondary" className="text-xs">Staff</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Panel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Granted</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={getEntryAvatar(entry.discord_id) || undefined} />
                              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                {getEntryDisplayName(entry).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{getEntryDisplayName(entry)}</p>
                              <p className="text-xs text-muted-foreground font-mono">{entry.discord_id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {getPanelIcon(entry.panel_type)}
                              <span>{getPanelLabel(entry.panel_type)}</span>
                            </div>
                            {getRosterDepartmentsDisplay(entry)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {entry.is_active ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              <XCircle className="h-3 w-3 mr-1" />
                              Disabled
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(entry.granted_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {entry.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={entry.is_active}
                              onCheckedChange={() => handleToggleActive(entry)}
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Access?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove {getEntryDisplayName(entry)}'s access to the {getPanelLabel(entry.panel_type)}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteAccess(entry.id)}>
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Staff Members Section */}
                {staffMembers.length > 0 && (
                  <Card className="border-border/30 mt-6">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Staff Members (Auto Access)
                      </CardTitle>
                      <CardDescription>
                        Staff members have automatic access to panels based on their roles
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {staffMembers.map(staff => {
                          const displayName = getDisplayName(staff.discord_id) || staff.name || staff.discord_username;
                          const avatar = getAvatar(staff.discord_id) || staff.discord_avatar;
                          return (
                            <div key={staff.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={avatar || undefined} />
                                <AvatarFallback className="bg-primary/20 text-primary">
                                  {displayName?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{displayName}</p>
                                <p className="text-xs text-muted-foreground">{staff.role}</p>
                              </div>
                              <Badge variant="secondary" className="text-xs shrink-0">Staff</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Individual Panel Tabs */}
          {PANEL_TYPES.map(panel => (
            <TabsContent key={panel.id} value={panel.id}>
              <Card className="border-border/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <panel.icon className="h-5 w-5 text-primary" />
                    {panel.label} Users
                  </CardTitle>
                  <CardDescription>{panel.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Granted Access Users */}
                  {entriesByPanel[panel.id]?.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No users have been granted access to this panel</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => {
                          setNewPanelType(panel.id);
                          setShowAddDialog(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {entriesByPanel[panel.id]?.map(entry => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={getEntryAvatar(entry.discord_id) || undefined} />
                              <AvatarFallback className="bg-primary/20 text-primary">
                                {getEntryDisplayName(entry).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{getEntryDisplayName(entry)}</p>
                              <p className="text-xs text-muted-foreground">
                                Added {format(new Date(entry.granted_at), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={entry.is_active}
                              onCheckedChange={() => handleToggleActive(entry)}
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Access?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove {getEntryDisplayName(entry)}'s access to the {panel.label}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteAccess(entry.id)}>
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Staff Members with Auto Access */}
                  {staffMembers.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Staff members with automatic access:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {staffMembers.slice(0, 6).map(staff => {
                          const displayName = getDisplayName(staff.discord_id) || staff.name || staff.discord_username;
                          const avatar = getAvatar(staff.discord_id) || staff.discord_avatar;
                          return (
                            <div key={staff.id} className="flex items-center gap-2 px-2 py-1 bg-muted/30 rounded-full text-xs">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={avatar || undefined} />
                                <AvatarFallback className="text-[10px]">
                                  {displayName?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span>{displayName}</span>
                            </div>
                          );
                        })}
                        {staffMembers.length > 6 && (
                          <Badge variant="secondary" className="text-xs">
                            +{staffMembers.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      {/* Add Access Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) resetAddForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Grant Panel Access
            </DialogTitle>
            <DialogDescription>
              Add a user by their Discord ID to grant them access to a specific panel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Discord ID */}
            <div className="space-y-2">
              <Label htmlFor="discord_id">Discord ID</Label>
              <div className="flex gap-2">
                <Input
                  id="discord_id"
                  placeholder="Enter 17-19 digit Discord ID"
                  value={newDiscordId}
                  onChange={(e) => {
                    setNewDiscordId(e.target.value.replace(/\D/g, ""));
                    setFetchedUser(null);
                    setFetchError("");
                  }}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  onClick={fetchDiscordUser}
                  disabled={fetchingUser || !newDiscordId}
                >
                  {fetchingUser ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Fetch"}
                </Button>
              </div>
              {fetchError && (
                <p className="text-sm text-destructive">{fetchError}</p>
              )}
              {fetchedUser && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  {fetchedUser.avatar ? (
                    <img src={fetchedUser.avatar} alt="Avatar" className="h-10 w-10 rounded-full" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{fetchedUser.global_name || fetchedUser.username}</p>
                    <p className="text-sm text-muted-foreground">@{fetchedUser.username}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                </div>
              )}
            </div>

            {/* Panel Type */}
            <div className="space-y-2">
              <Label htmlFor="panel_type">Panel</Label>
              <Select value={newPanelType} onValueChange={(val) => {
                setNewPanelType(val);
                // Reset departments when panel changes
                setNewDepartments([]);
                setNewRosterDepartments([]);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a panel" />
                </SelectTrigger>
                <SelectContent>
                  {PANEL_TYPES.map(panel => (
                    <SelectItem key={panel.id} value={panel.id}>
                      <div className="flex items-center gap-2">
                        <panel.icon className="h-4 w-4" />
                        <span>{panel.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newPanelType && (
                <p className="text-sm text-muted-foreground">
                  {PANEL_TYPES.find(p => p.id === newPanelType)?.description}
                </p>
              )}
            </div>

            {/* Departments Selection - show for panels that have departments */}
            {newPanelType && PANEL_TYPES.find(p => p.id === newPanelType)?.hasDepartments && PANEL_DEPARTMENTS[newPanelType] && (
              <div className="space-y-2">
                <Label>
                  {newPanelType === "roster" ? "Roster Departments" : 
                   newPanelType === "job" ? "Job Departments" : 
                   newPanelType === "business" ? "Business Types" : "Departments"}
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select which {newPanelType === "business" ? "business types" : "departments"} this user can access
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 bg-muted/20 rounded-lg border border-border/50">
                  {PANEL_DEPARTMENTS[newPanelType].map(dept => (
                    <div
                      key={dept.id}
                      onClick={() => toggleDepartment(dept.id)}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                        newDepartments.includes(dept.id)
                          ? "bg-primary/20 border border-primary/50"
                          : "bg-background/50 border border-border/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        newDepartments.includes(dept.id)
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/50"
                      }`}>
                        {newDepartments.includes(dept.id) && (
                          <CheckCircle className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="text-sm">{dept.label}</span>
                    </div>
                  ))}
                </div>
                {newDepartments.length > 0 && !newDepartments.includes("all") && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {newDepartments.map(d => PANEL_DEPARTMENTS[newPanelType]?.find(r => r.id === d)?.label).join(", ")}
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this access grant..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAccess} disabled={!newDiscordId || !newPanelType}>
              <UserPlus className="h-4 w-4 mr-2" />
              Grant Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PanelAccessManager;
