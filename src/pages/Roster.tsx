import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRosterAccess } from "@/hooks/useRosterAccess";
import { 
  Shield, 
  Siren, 
  Flame, 
  Ambulance, 
  Wrench,
  Gavel,
  Tv,
  Car,
  Building,
  Loader2,
  Users,
  Star,
  Crown,
  Medal,
  Award,
  ChevronRight,
  Pencil,
  Save,
  X,
  Lock,
  UserPlus,
  Trash2,
  MoreVertical
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AddStaffByDiscordDialog from "@/components/AddStaffByDiscordDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import headerJobsBg from "@/assets/header-guides-new.jpg";

interface RosterMember {
  id: string;
  name: string;
  rank: string;
  badge_number?: string;
  status: 'active' | 'inactive' | 'on_leave';
  division?: string;
  discord_avatar?: string;
  strikes?: string;
  call_sign?: string;
}

interface DepartmentRoster {
  department: string;
  shortName: string;
  icon: React.ReactNode;
  accentColor: string;
  members: RosterMember[];
  ranks?: string[];
}

// No example data - all rank sections always visible

const getRankIcon = (index: number) => {
  if (index === 0) return <Crown className="w-4 h-4 text-yellow-400" />;
  if (index === 1) return <Star className="w-4 h-4 text-amber-400" />;
  if (index === 2) return <Medal className="w-4 h-4 text-orange-400" />;
  return <Award className="w-4 h-4 text-muted-foreground" />;
};

const getDivisionColor = (division: string): string => {
  const d = division.toLowerCase();
  if (d.includes('administration') || d.includes('management') || d.includes('command')) return 'text-red-400 bg-red-500/15 border-red-500/30';
  if (d.includes('patrol')) return 'text-blue-400 bg-blue-500/15 border-blue-500/30';
  if (d.includes('traffic')) return 'text-green-400 bg-green-500/15 border-green-500/30';
  if (d.includes('investigation')) return 'text-purple-400 bg-purple-500/15 border-purple-500/30';
  if (d.includes('training')) return 'text-orange-400 bg-orange-500/15 border-orange-500/30';
  if (d.includes('field')) return 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30';
  if (d.includes('sales')) return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
  if (d.includes('medical')) return 'text-pink-400 bg-pink-500/15 border-pink-500/30';
  if (d.includes('engine') || d.includes('ladder')) return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
  if (d.includes('judiciary') || d.includes('prosecution') || d.includes('defense')) return 'text-violet-400 bg-violet-500/15 border-violet-500/30';
  if (d.includes('on-air') || d.includes('production')) return 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30';
  if (d.includes('repairs')) return 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30';
  return 'text-gray-400 bg-gray-500/15 border-gray-500/30';
};

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On Leave' },
];

// Department-specific division options
const divisionOptionsByDept: Record<string, { value: string; label: string }[]> = {
  police: [
    { value: 'Administration', label: 'Administration' },
    { value: 'Patrol', label: 'Patrol' },
    { value: 'Traffic Enforcement', label: 'Traffic Enforcement' },
    { value: 'Investigations', label: 'Investigations' },
    { value: 'Training', label: 'Training' },
    { value: 'SWAT', label: 'SWAT' },
    { value: 'K-9 Unit', label: 'K-9 Unit' },
  ],
  ems: [
    { value: 'Administration', label: 'Administration' },
    { value: 'Medical', label: 'Medical' },
    { value: 'Field Ops', label: 'Field Ops' },
    { value: 'Training', label: 'Training' },
    { value: 'Air Rescue', label: 'Air Rescue' },
  ],
  fire: [
    { value: 'Command', label: 'Command' },
    { value: 'Engine 1', label: 'Engine 1' },
    { value: 'Engine 2', label: 'Engine 2' },
    { value: 'Ladder 1', label: 'Ladder 1' },
    { value: 'Training', label: 'Training' },
    { value: 'Hazmat', label: 'Hazmat' },
  ],
  mechanic: [
    { value: 'Management', label: 'Management' },
    { value: 'Repairs', label: 'Repairs' },
    { value: 'Custom Work', label: 'Custom Work' },
    { value: 'Training', label: 'Training' },
  ],
  doj: [
    { value: 'Judiciary', label: 'Judiciary' },
    { value: 'Prosecution', label: 'Prosecution' },
    { value: 'Defense', label: 'Defense' },
    { value: 'Administration', label: 'Administration' },
  ],
  state: [
    { value: 'Executive Office', label: 'Executive Office' },
    { value: 'Highway Patrol', label: 'Highway Patrol' },
    { value: 'Investigations', label: 'Investigations' },
    { value: 'Licensing', label: 'Licensing' },
    { value: 'Administration', label: 'Administration' },
  ],
  weazel: [
    { value: 'Management', label: 'Management' },
    { value: 'On-Air', label: 'On-Air' },
    { value: 'Field', label: 'Field' },
    { value: 'Production', label: 'Production' },
    { value: 'Training', label: 'Training' },
  ],
  pdm: [
    { value: 'Management', label: 'Management' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Training', label: 'Training' },
  ],
  staff: [
    { value: 'Leadership', label: 'Leadership' },
    { value: 'Administration', label: 'Administration' },
    { value: 'Management', label: 'Management' },
    { value: 'Support', label: 'Support' },
    { value: 'Development', label: 'Development' },
  ],
};

// Department-specific unit options
const unitOptionsByDept: Record<string, { value: string; label: string }[]> = {
  police: [
    { value: 'ADAM', label: 'ADAM' },
    { value: 'BRAVO', label: 'BRAVO' },
    { value: 'CHARLIE', label: 'CHARLIE' },
    { value: 'DELTA', label: 'DELTA' },
    { value: 'ECHO', label: 'ECHO' },
    { value: 'FOXTROT', label: 'FOXTROT' },
    { value: 'GOLF', label: 'GOLF' },
    { value: 'HOTEL', label: 'HOTEL' },
    { value: 'AIR-1', label: 'AIR-1' },
    { value: 'K9-1', label: 'K9-1' },
  ],
  ems: [
    { value: 'MEDIC-1', label: 'MEDIC-1' },
    { value: 'MEDIC-2', label: 'MEDIC-2' },
    { value: 'MEDIC-3', label: 'MEDIC-3' },
    { value: 'RESCUE-1', label: 'RESCUE-1' },
    { value: 'AIR-RESCUE', label: 'AIR-RESCUE' },
    { value: 'SUPERVISOR', label: 'SUPERVISOR' },
  ],
  fire: [
    { value: 'ENGINE-1', label: 'ENGINE-1' },
    { value: 'ENGINE-2', label: 'ENGINE-2' },
    { value: 'LADDER-1', label: 'LADDER-1' },
    { value: 'RESCUE-1', label: 'RESCUE-1' },
    { value: 'BATTALION-1', label: 'BATTALION-1' },
    { value: 'HAZMAT-1', label: 'HAZMAT-1' },
  ],
  mechanic: [
    { value: 'BAY-1', label: 'BAY-1' },
    { value: 'BAY-2', label: 'BAY-2' },
    { value: 'BAY-3', label: 'BAY-3' },
    { value: 'CUSTOM', label: 'CUSTOM' },
    { value: 'TOW-1', label: 'TOW-1' },
  ],
  doj: [
    { value: 'COURT-1', label: 'COURT-1' },
    { value: 'COURT-2', label: 'COURT-2' },
    { value: 'CHAMBERS', label: 'CHAMBERS' },
    { value: 'PROSECUTION', label: 'PROSECUTION' },
    { value: 'DEFENSE', label: 'DEFENSE' },
  ],
  state: [
    { value: 'GOVERNOR', label: 'GOVERNOR' },
    { value: 'HIGHWAY-1', label: 'HIGHWAY-1' },
    { value: 'HIGHWAY-2', label: 'HIGHWAY-2' },
    { value: 'SPECIAL-OPS', label: 'SPECIAL-OPS' },
    { value: 'ADMIN', label: 'ADMIN' },
  ],
  weazel: [
    { value: 'NEWS-VAN-1', label: 'NEWS-VAN-1' },
    { value: 'NEWS-VAN-2', label: 'NEWS-VAN-2' },
    { value: 'STUDIO-A', label: 'STUDIO-A' },
    { value: 'STUDIO-B', label: 'STUDIO-B' },
    { value: 'FIELD-1', label: 'FIELD-1' },
  ],
  pdm: [
    { value: 'SHOWROOM', label: 'SHOWROOM' },
    { value: 'LOT-A', label: 'LOT-A' },
    { value: 'LOT-B', label: 'LOT-B' },
    { value: 'FINANCE', label: 'FINANCE' },
    { value: 'OFFICE', label: 'OFFICE' },
  ],
  staff: [
    { value: 'ADMIN', label: 'ADMIN' },
    { value: 'SUPPORT', label: 'SUPPORT' },
    { value: 'DEV', label: 'DEV' },
    { value: 'MOD', label: 'MOD' },
  ],
};

// Get combined division options for backwards compatibility
const getAllDivisionOptions = () => {
  const allOptions = new Map<string, { value: string; label: string }>();
  Object.values(divisionOptionsByDept).forEach(options => {
    options.forEach(opt => allOptions.set(opt.value, opt));
  });
  return Array.from(allOptions.values());
};

const divisionOptions = getAllDivisionOptions();

const Roster = () => {
  const [loading, setLoading] = useState(true);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [editedData, setEditedData] = useState<Record<string, Record<string, RosterMember>>>({});
  const [saving, setSaving] = useState(false);
  const [addStaffDialogOpen, setAddStaffDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("police-department");
  const [selectedDeptForAdd, setSelectedDeptForAdd] = useState<{
    departmentLabel: string;
    departmentKey: string;
    shortName: string;
    ranks: string[];
  } | null>(null);
  const { hasAccess, canEdit, loading: accessLoading, isOwner } = useRosterAccess();

  // Helper to check if a rank is Governor
  const isGovernorRank = (rankName: string) => rankName.toLowerCase() === 'governor';

  const fetchStaff = async () => {
    if (!hasAccess && !accessLoading) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('staff_members')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching staff:', error);
      toast.error(error.message || 'Failed to load roster data');
      setStaffMembers([]);
    } else {
      setStaffMembers(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!accessLoading) {
      fetchStaff();
    }
  }, [hasAccess, accessLoading]);

  // Map display keys to database-compatible department values
  const getDatabaseDepartmentKey = (shortName: string): string => {
    const mapping: Record<string, string> = {
      'police': 'police',
      'ems': 'ems',
      'fire': 'fire',
      'mechanic': 'mechanic',
      'doj': 'doj',
      'weazel': 'weazel',
      'pdm': 'pdm',
      'staff': 'staff',
    };
    return mapping[shortName.toLowerCase()] || shortName.toLowerCase();
  };

  const handleOpenAddStaffDialog = (dept: { department: string; shortName: string; ranks?: string[] }, shortKey: string) => {
    const dbKey = getDatabaseDepartmentKey(shortKey);
    setSelectedDeptForAdd({
      departmentLabel: dept.department,
      departmentKey: dbKey, // Use database-compatible key
      shortName: dept.shortName,
      ranks: dept.ranks || [],
    });
    setAddStaffDialogOpen(true);
  };

  const handleAddStaffSuccess = () => {
    fetchStaff();
  };

  const handleDeleteStaff = async () => {
    if (!memberToDelete || !canEdit) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('staff_members')
        .delete()
        .eq('id', memberToDelete.id);

      if (error) {
        console.error('Error deleting staff member:', error);
        toast.error('Failed to delete staff member');
      } else {
        toast.success(`${memberToDelete.name || 'Staff member'} has been removed from the roster`);
        await fetchStaff();
      }
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      toast.error(error.message || 'Failed to delete staff member');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    }
  };

  const confirmDelete = (member: RosterMember) => {
    setMemberToDelete({ id: member.id, name: member.name });
    setDeleteDialogOpen(true);
  };

  const getDepartmentMembers = (key: string, filters: string[]): RosterMember[] => {
    return staffMembers
      .filter((s) => filters.some((f) => s.department?.toLowerCase().includes(f)))
      .map((s) => ({
        id: s.id,
        name: s.name,
        rank: s.role,
        badge_number: s.badge_number || s.discord_id?.slice(-6) || '-',
        status: (s.status || (s.is_active ? 'active' : 'inactive')) as RosterMember['status'],
        division: s.division || '-',
        call_sign: s.call_sign || '-',
        discord_avatar: s.discord_avatar,
        strikes: s.strikes || '0/3',
      }));
  };

  const departments: DepartmentRoster[] = [
    {
      department: "Police Department",
      shortName: "Police",
      icon: <Siren className="w-4 h-4" />,
      accentColor: "blue",
      members: getDepartmentMembers('police', ['police', 'pd', 'lspd']),
      ranks: ['Police Commissioner', 'Police Chief', 'Police Asst. Chief', 'Captain', 'Lieutenant', 'Head Sergeant', 'Sergeant', 'Corporal', 'Senior Officer', 'Officer', 'Solo Cadet', 'Cadet'],
    },
    {
      department: "EMS Department",
      shortName: "EMS",
      icon: <Ambulance className="w-4 h-4" />,
      accentColor: "red",
      members: getDepartmentMembers('ems', ['ems', 'medical', 'hospital']),
      ranks: ['EMS Director', 'Chief Physician', 'Senior Paramedic', 'Paramedic', 'EMT', 'EMT Trainee'],
    },
    {
      department: "Fire Department",
      shortName: "Fire",
      icon: <Flame className="w-4 h-4" />,
      accentColor: "orange",
      members: getDepartmentMembers('fire', ['fire', 'fd', 'lsfd']),
      ranks: ['Fire Chief', 'Captain', 'Lieutenant', 'Senior Firefighter', 'Firefighter', 'Probationary'],
    },
    {
      department: "Mechanic Shop",
      shortName: "Mechanic",
      icon: <Wrench className="w-4 h-4" />,
      accentColor: "amber",
      members: getDepartmentMembers('mechanic', ['mechanic', 'garage', 'repair']),
      ranks: ['Head Mechanic', 'Senior Mechanic', 'Mechanic', 'Junior Mechanic', 'Apprentice'],
    },
    {
      department: "Department of Justice",
      shortName: "DOJ",
      icon: <Gavel className="w-4 h-4" />,
      accentColor: "purple",
      members: getDepartmentMembers('doj', ['justice', 'doj', 'court', 'legal']),
      ranks: ['Chief Justice', 'Senior Judge', 'Judge', 'Attorney General', 'Asst. District Attorney', 'Public Defender'],
    },
    {
      department: "Weazel News",
      shortName: "Weazel",
      icon: <Tv className="w-4 h-4" />,
      accentColor: "pink",
      members: getDepartmentMembers('weazel', ['weazel', 'news', 'media']),
      ranks: ['News Director', 'Lead Anchor', 'Senior Reporter', 'Field Reporter', 'Cameraman', 'Intern Reporter'],
    },
    {
      department: "Premium Deluxe Motorsport",
      shortName: "PDM",
      icon: <Car className="w-4 h-4" />,
      accentColor: "cyan",
      members: getDepartmentMembers('pdm', ['pdm', 'motorsport', 'dealership', 'deluxe']),
      ranks: ['General Manager', 'Sales Manager', 'Senior Sales', 'Sales Associate', 'Sales Trainee'],
    },
    {
      department: "State Department",
      shortName: "State",
      icon: <Building className="w-4 h-4" />,
      accentColor: "emerald",
      members: getDepartmentMembers('state', ['state', 'government', 'governor', 'sahp', 'highway']),
      ranks: ['Governor', 'State Trooper Commander', 'Senior Trooper', 'State Trooper', 'Trooper Cadet'],
    },
    {
      department: "Server Staff",
      shortName: "Staff",
      icon: <Shield className="w-4 h-4" />,
      accentColor: "violet",
      members: staffMembers
        .filter(
          (s) =>
            s.department?.toLowerCase().includes('staff') ||
            s.department?.toLowerCase().includes('admin') ||
            s.department?.toLowerCase().includes('management') ||
            !s.department
        )
        .map((s) => ({
          id: s.id,
          name: s.name,
          rank: s.role,
          badge_number: s.badge_number || s.discord_id?.slice(-6) || '-',
          status: (s.status || (s.is_active ? 'active' : 'inactive')) as RosterMember['status'],
          division: s.division || '-',
          call_sign: s.call_sign || '-',
          discord_avatar: s.discord_avatar,
          strikes: s.strikes || '-',
        })),
      ranks: ['Owner', 'Co-Owner', 'Head Admin', 'Admin', 'Senior Moderator', 'Moderator', 'Trial Mod'],
    }
  ];

  const getRankOrder = (rank: string, ranks?: string[]): number => {
    if (!ranks) return 999;
    const idx = ranks.findIndex(r => rank.toLowerCase() === r.toLowerCase());
    if (idx !== -1) return idx;
    return ranks.findIndex(r => rank.toLowerCase().includes(r.toLowerCase()));
  };

  const toggleEditMode = (deptKey: string, members: RosterMember[]) => {
    if (editMode[deptKey]) {
      // Cancel edit mode
      setEditMode(prev => ({ ...prev, [deptKey]: false }));
      setEditedData(prev => {
        const newData = { ...prev };
        delete newData[deptKey];
        return newData;
      });
    } else {
      // Enable edit mode and initialize data
      const memberData: Record<string, RosterMember> = {};
      members.forEach(m => {
        memberData[m.id] = { ...m };
      });
      setEditedData(prev => ({ ...prev, [deptKey]: memberData }));
      setEditMode(prev => ({ ...prev, [deptKey]: true }));
    }
  };

  const updateMemberField = (deptKey: string, memberId: string, field: keyof RosterMember, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [deptKey]: {
        ...prev[deptKey],
        [memberId]: {
          ...prev[deptKey]?.[memberId],
          [field]: value,
        }
      }
    }));
  };

  const saveChanges = async (deptKey: string) => {
    setSaving(true);
    try {
      const deptData = editedData[deptKey];
      if (!deptData) {
        toast.error('No changes to save');
        return;
      }

      const updates = Object.entries(deptData).map(([memberId, member]) => ({
        id: memberId,
        name: member.name,
        role: member.rank,
        badge_number: member.badge_number || null,
        status: member.status,
        division: member.division || null,
        call_sign: member.call_sign || null,
        strikes: member.strikes || null,
        is_active: member.status === 'active',
      }));

      let successCount = 0;
      let errorCount = 0;

      for (const update of updates) {
        const { error } = await supabase
          .from('staff_members')
          .update({
            name: update.name,
            role: update.role,
            badge_number: update.badge_number,
            status: update.status,
            division: update.division,
            call_sign: update.call_sign,
            strikes: update.strikes,
            is_active: update.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', update.id);

        if (error) {
          console.error('Error updating member:', update.id, error);
          errorCount++;
        } else {
          successCount++;
        }
      }

      if (errorCount > 0) {
        toast.warning(`Saved ${successCount} changes, ${errorCount} failed`);
      } else {
        toast.success(`Roster changes saved successfully! (${successCount} members updated)`);
      }

      await fetchStaff();

      setEditMode((prev) => ({ ...prev, [deptKey]: false }));
      setEditedData((prev) => {
        const newData = { ...prev };
        delete newData[deptKey];
        return newData;
      });
    } catch (error: any) {
      console.error('Error saving changes:', error);
      toast.error(error.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const getMemberValue = (deptKey: string, member: RosterMember, field: keyof RosterMember): string => {
    if (editMode[deptKey] && editedData[deptKey]?.[member.id]) {
      return (editedData[deptKey][member.id][field] as string) || '';
    }
    return (member[field] as string) || '';
  };

  // Show loading while checking access
  if (accessLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader 
          title="Department Rosters"
          description="Official personnel listings for all departments"
          badge="Official Rosters"
          backgroundImage={headerJobsBg}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  // Show access denied message for unauthorized users
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader 
          title="Department Rosters"
          description="Official personnel listings for all departments"
          badge="Restricted Access"
          backgroundImage={headerJobsBg}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Access Restricted</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              You don't have permission to view the department rosters. This page is only accessible to staff members and users with specific Discord roles.
            </p>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader 
        title="Department Rosters"
        description="Official personnel listings for all departments"
        badge="Official Rosters"
        backgroundImage={headerJobsBg}
      />

      <div className="container mx-auto px-4 py-8">
        {(
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-auto gap-1 p-1.5 bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-xl">
                {departments.map((dept) => (
                  <TabsTrigger 
                    key={dept.department}
                    value={dept.department.toLowerCase().replace(/\s+/g, '-')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                      data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
                  >
                    {dept.icon}
                    <span className="hidden sm:inline">{dept.shortName}</span>
                    <span className="text-xs opacity-60">({dept.members.length})</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {departments.map((dept) => {
              const deptKey = dept.department.toLowerCase().replace(/\s+/g, '-');
              // Get short key for division/unit options lookup
              const shortKey = dept.shortName.toLowerCase().replace(/\s+/g, '-');
              const deptDivisionOptions = divisionOptionsByDept[shortKey] || divisionOptions;
              const deptUnitOptions = unitOptionsByDept[shortKey] || [];
              
              const sorted = [...dept.members].sort((a, b) => 
                getRankOrder(a.rank, dept.ranks) - getRankOrder(b.rank, dept.ranks)
              );

              const byRank: Record<string, RosterMember[]> = {};
              sorted.forEach(m => {
                const exactMatch = dept.ranks?.find(r => 
                  m.rank.toLowerCase().trim() === r.toLowerCase().trim()
                );
                const partialMatch = !exactMatch ? dept.ranks?.find(r => 
                  m.rank.toLowerCase().includes(r.toLowerCase()) ||
                  r.toLowerCase().includes(m.rank.toLowerCase())
                ) : null;
                const match = exactMatch || partialMatch || m.rank;
                if (!byRank[match]) byRank[match] = [];
                byRank[match].push(m);
              });

              const isEditing = editMode[deptKey];

              return (
                <TabsContent 
                  key={dept.department}
                  value={deptKey}
                  className="space-y-6"
                >
                  {/* Department Header */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-muted/50 border border-border p-6 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                    
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/10">
                          <span className="text-primary">{dept.icon}</span>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">{dept.department}</h2>
                          <p className="text-muted-foreground text-sm">Official Personnel Roster</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleEditMode(deptKey, dept.members)}
                              disabled={saving}
                              className="gap-2"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveChanges(deptKey)}
                              disabled={saving}
                              className="gap-2"
                            >
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              Save
                            </Button>
                          </div>
                        ) : canEdit ? (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleOpenAddStaffDialog(dept, shortKey)}
                              className="gap-2"
                            >
                              <UserPlus className="w-4 h-4" />
                              Add Staff
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleEditMode(deptKey, dept.members)}
                              className="gap-2"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </Button>
                          </>
                        ) : null}
                        <div className="text-center ml-2">
                          <div className="text-2xl font-bold text-primary">{dept.members.length}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rank Sections - Always show all ranks with proper spacing */}
                  <div className="space-y-8">
                    {dept.ranks?.map((rankName, rankIdx) => {
                      const members = byRank[rankName] || [];
                      // Always render rank section even when empty
                      return (
                          <div 
                            key={rankName}
                            className="relative rounded-xl overflow-hidden border border-border bg-card shadow-xl"
                            style={{
                              boxShadow: '0 4px 24px -4px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05) inset'
                            }}
                          >
                            {/* Rank Header */}
                            <div className="relative px-5 py-4 bg-gradient-to-r from-muted/80 via-muted/60 to-muted/80 border-b border-border">
                              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                              
                              <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {getRankIcon(rankIdx)}
                                  <h3 className="font-bold text-lg tracking-wide">{rankName}</h3>
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                                  <Users className="w-3.5 h-3.5 text-primary" />
                                  <span className="text-sm font-medium text-primary">{members.length}</span>
                                </div>
                              </div>
                            </div>

                            {/* Table Header - Dynamic based on rank */}
                            {isGovernorRank(rankName) ? (
                              <div className={`grid ${canEdit ? 'grid-cols-5' : 'grid-cols-4'} px-5 py-3 bg-muted/30 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground`}>
                                <div className="flex items-center gap-2">
                                  <span className="w-8" />
                                  <span>Name</span>
                                </div>
                                <div className="text-center">Rank</div>
                                <div className="text-center">Status</div>
                                <div className="text-center">Division</div>
                                {canEdit && <div className="text-center">Actions</div>}
                              </div>
                            ) : (
                              <div className={`grid ${canEdit ? 'grid-cols-8' : 'grid-cols-7'} px-5 py-3 bg-muted/30 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground`}>
                                <div className="flex items-center gap-2">
                                  <span className="w-8" />
                                  <span>Officer</span>
                                </div>
                                <div className="text-center">Rank</div>
                                <div className="text-center">Badge Number</div>
                                <div className="text-center">Strikes</div>
                                <div className="text-center">Status</div>
                                <div className="text-center">Division</div>
                                <div className="text-center">Unit</div>
                                {canEdit && <div className="text-center">Actions</div>}
                              </div>
                            )}

                            {/* Members */}
                            <div className="divide-y divide-border/50 min-h-[60px]">
                              {members.length > 0 ? members.map((member, idx) => (
                                isGovernorRank(rankName) ? (
                                  /* Governor-specific row layout - no badge/strikes, Name instead of Officer */
                                  <div 
                                    key={member.id}
                                    className={`grid ${canEdit ? 'grid-cols-5' : 'grid-cols-4'} px-5 py-3 items-center transition-colors hover:bg-muted/30
                                      ${idx % 2 === 0 ? 'bg-transparent' : 'bg-muted/10'}`}
                                  >
                                    {/* Name */}
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-9 w-9 border-2 border-border shadow-md">
                                        <AvatarImage src={member.discord_avatar} />
                                        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                                          {getMemberValue(deptKey, member, 'name')?.charAt(0) || '?'}
                                        </AvatarFallback>
                                      </Avatar>
                                      {isEditing ? (
                                        <Input
                                          value={getMemberValue(deptKey, member, 'name')}
                                          onChange={(e) => updateMemberField(deptKey, member.id, 'name', e.target.value)}
                                          placeholder="Name"
                                          className="h-8 text-sm"
                                        />
                                      ) : (
                                        <span className={`font-medium ${member.name ? 'text-foreground' : 'text-muted-foreground'}`}>
                                          {member.name || 'Vacant'}
                                        </span>
                                      )}
                                    </div>

                                    {/* Rank */}
                                    <div className="flex justify-center">
                                      {isEditing ? (
                                        <Select
                                          value={getMemberValue(deptKey, member, 'rank')}
                                          onValueChange={(value) => updateMemberField(deptKey, member.id, 'rank', value)}
                                        >
                                          <SelectTrigger className="h-8 w-36 text-xs">
                                            <SelectValue placeholder="Rank" />
                                          </SelectTrigger>
                                          <SelectContent className="bg-popover border border-border z-50 max-h-60">
                                            {dept.ranks?.map(rank => (
                                              <SelectItem key={rank} value={rank}>
                                                {rank}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <span className="text-sm text-muted-foreground">{member.rank}</span>
                                      )}
                                    </div>

                                    {/* Status */}
                                    <div className="flex justify-center">
                                      {isEditing ? (
                                        <Select
                                          value={getMemberValue(deptKey, member, 'status')}
                                          onValueChange={(value) => updateMemberField(deptKey, member.id, 'status', value)}
                                        >
                                          <SelectTrigger className="h-8 w-28 text-xs">
                                            <SelectValue placeholder="Status" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {statusOptions.map(opt => (
                                              <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <>
                                          {member.status === 'active' ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-500 text-xs font-medium">
                                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                              Active
                                            </span>
                                          ) : member.status === 'on_leave' ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-medium">
                                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                              On Leave
                                            </span>
                                          ) : (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-500/15 border border-gray-500/30 text-gray-400 text-xs font-medium">
                                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                              Inactive
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>

                                    {/* Division */}
                                    <div className="flex justify-center">
                                      {isEditing ? (
                                        <Select
                                          value={getMemberValue(deptKey, member, 'division')}
                                          onValueChange={(value) => updateMemberField(deptKey, member.id, 'division', value)}
                                        >
                                          <SelectTrigger className="h-8 w-32 text-xs">
                                            <SelectValue placeholder="Division" />
                                          </SelectTrigger>
                                          <SelectContent className="bg-popover border border-border z-50">
                                            {deptDivisionOptions.map(opt => (
                                              <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getDivisionColor(member.division || '')}`}>
                                          {member.division || '-'}
                                        </span>
                                      )}
                                    </div>

                                    {/* Actions - Dropdown */}
                                    {canEdit && (
                                      <div className="flex justify-center">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-8 w-8 p-0"
                                            >
                                              <MoreVertical className="w-4 h-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="bg-popover border border-border z-50">
                                            <DropdownMenuItem
                                              onClick={() => toggleEditMode(deptKey, dept.members)}
                                              className="cursor-pointer"
                                            >
                                              <Pencil className="w-4 h-4 mr-2" />
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => confirmDelete(member)}
                                              className="cursor-pointer text-destructive focus:text-destructive"
                                            >
                                              <Trash2 className="w-4 h-4 mr-2" />
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  /* Standard row layout for all other ranks */
                                  <div 
                                    key={member.id}
                                    className={`grid ${canEdit ? 'grid-cols-8' : 'grid-cols-7'} px-5 py-3 items-center transition-colors hover:bg-muted/30
                                      ${idx % 2 === 0 ? 'bg-transparent' : 'bg-muted/10'}`}
                                  >
                                    {/* Officer */}
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-9 w-9 border-2 border-border shadow-md">
                                        <AvatarImage src={member.discord_avatar} />
                                        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                                          {getMemberValue(deptKey, member, 'name')?.charAt(0) || '?'}
                                        </AvatarFallback>
                                      </Avatar>
                                      {isEditing ? (
                                        <Input
                                          value={getMemberValue(deptKey, member, 'name')}
                                          onChange={(e) => updateMemberField(deptKey, member.id, 'name', e.target.value)}
                                          placeholder="Name"
                                          className="h-8 text-sm"
                                        />
                                      ) : (
                                        <span className={`font-medium ${member.name ? 'text-foreground' : 'text-muted-foreground'}`}>
                                          {member.name || 'Vacant'}
                                        </span>
                                      )}
                                    </div>

                                    {/* Rank */}
                                    <div className="flex justify-center">
                                      {isEditing ? (
                                        <Select
                                          value={getMemberValue(deptKey, member, 'rank')}
                                          onValueChange={(value) => updateMemberField(deptKey, member.id, 'rank', value)}
                                        >
                                          <SelectTrigger className="h-8 w-36 text-xs">
                                            <SelectValue placeholder="Rank" />
                                          </SelectTrigger>
                                          <SelectContent className="bg-popover border border-border z-50 max-h-60">
                                            {dept.ranks?.map(rank => (
                                              <SelectItem key={rank} value={rank}>
                                                {rank}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <span className="text-sm text-muted-foreground">{member.rank}</span>
                                      )}
                                    </div>

                                    {/* Badge */}
                                    <div className="text-center">
                                      {isEditing ? (
                                        <Input
                                          value={getMemberValue(deptKey, member, 'badge_number')}
                                          onChange={(e) => updateMemberField(deptKey, member.id, 'badge_number', e.target.value)}
                                          placeholder="Badge #"
                                          className="h-8 text-sm font-mono text-center"
                                        />
                                      ) : (
                                        <span className="font-mono text-sm px-2.5 py-1 rounded-md bg-muted border border-border">
                                          {member.badge_number || '-'}
                                        </span>
                                      )}
                                    </div>

                                    {/* Strikes */}
                                    <div className="text-center">
                                      {isEditing ? (
                                        <Input
                                          value={getMemberValue(deptKey, member, 'strikes')}
                                          onChange={(e) => updateMemberField(deptKey, member.id, 'strikes', e.target.value)}
                                          placeholder="0/3"
                                          className="h-8 text-sm text-center"
                                        />
                                      ) : (
                                        <span className="text-muted-foreground">{member.strikes || '-'}</span>
                                      )}
                                    </div>

                                    {/* Status */}
                                    <div className="flex justify-center">
                                      {isEditing ? (
                                        <Select
                                          value={getMemberValue(deptKey, member, 'status')}
                                          onValueChange={(value) => updateMemberField(deptKey, member.id, 'status', value)}
                                        >
                                          <SelectTrigger className="h-8 w-28 text-xs">
                                            <SelectValue placeholder="Status" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {statusOptions.map(opt => (
                                              <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <>
                                          {member.status === 'active' ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-500 text-xs font-medium">
                                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                              Active
                                            </span>
                                          ) : member.status === 'on_leave' ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-medium">
                                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                              On Leave
                                            </span>
                                          ) : (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-500/15 border border-gray-500/30 text-gray-400 text-xs font-medium">
                                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                              Inactive
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>

                                    {/* Division */}
                                    <div className="flex justify-center">
                                      {isEditing ? (
                                        <Select
                                          value={getMemberValue(deptKey, member, 'division')}
                                          onValueChange={(value) => updateMemberField(deptKey, member.id, 'division', value)}
                                        >
                                          <SelectTrigger className="h-8 w-32 text-xs">
                                            <SelectValue placeholder="Division" />
                                          </SelectTrigger>
                                          <SelectContent className="bg-popover border border-border z-50">
                                            {deptDivisionOptions.map(opt => (
                                              <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getDivisionColor(member.division || '')}`}>
                                          {member.division || '-'}
                                        </span>
                                      )}
                                    </div>

                                    {/* Unit */}
                                    <div className="flex justify-center">
                                      {isEditing ? (
                                        <Select
                                          value={getMemberValue(deptKey, member, 'call_sign')}
                                          onValueChange={(value) => updateMemberField(deptKey, member.id, 'call_sign', value)}
                                        >
                                          <SelectTrigger className="h-8 w-28 text-xs">
                                            <SelectValue placeholder="Unit" />
                                          </SelectTrigger>
                                          <SelectContent className="bg-popover border border-border z-50">
                                            {deptUnitOptions.map(opt => (
                                              <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <span className="text-muted-foreground text-sm">{member.call_sign || '-'}</span>
                                      )}
                                    </div>

                                    {/* Actions - Dropdown */}
                                    {canEdit && (
                                      <div className="flex justify-center">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-8 w-8 p-0"
                                            >
                                              <MoreVertical className="w-4 h-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="bg-popover border border-border z-50">
                                            <DropdownMenuItem
                                              onClick={() => toggleEditMode(deptKey, dept.members)}
                                              className="cursor-pointer"
                                            >
                                              <Pencil className="w-4 h-4 mr-2" />
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => confirmDelete(member)}
                                              className="cursor-pointer text-destructive focus:text-destructive"
                                            >
                                              <Trash2 className="w-4 h-4 mr-2" />
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    )}
                                  </div>
                                )
                              )) : (
                                <div className="flex items-center justify-center py-6 text-muted-foreground text-sm italic">
                                  <span>No members assigned to this rank</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Unmatched ranks */}
                      {Object.entries(byRank)
                        .filter(([rank]) => !dept.ranks?.includes(rank))
                        .map(([rank, members]) => (
                          <div 
                            key={rank}
                            className="relative rounded-xl overflow-hidden border border-border bg-card shadow-xl"
                          >
                            <div className="px-5 py-4 bg-muted/50 border-b border-border">
                              <div className="flex items-center gap-3">
                                <Award className="w-4 h-4 text-muted-foreground" />
                                <h3 className="font-bold text-lg">{rank}</h3>
                                <span className="text-sm text-muted-foreground">({members.length})</span>
                              </div>
                            </div>
                            <div className="divide-y divide-border/50">
                              {members.map((member, idx) => (
                                <div 
                                  key={member.id}
                                  className={`grid grid-cols-7 px-5 py-3 items-center ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border-2 border-border">
                                      <AvatarImage src={member.discord_avatar} />
                                      <AvatarFallback className="bg-muted text-xs">{member.name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{member.name || 'Vacant'}</span>
                                  </div>
                                  <div className="text-center text-sm text-muted-foreground">{member.rank || '-'}</div>
                                  <div className="text-center font-mono text-sm">{member.badge_number || '-'}</div>
                                  <div className="text-center text-muted-foreground">{member.strikes || '-'}</div>
                                  <div className="flex justify-center">
                                    {member.status === 'active' ? (
                                      <span className="px-2.5 py-1 rounded-full bg-green-500/15 text-green-500 text-xs font-medium">Active</span>
                                    ) : <span className="text-muted-foreground">-</span>}
                                  </div>
                                  <div className="flex justify-center">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getDivisionColor(member.division || '')}`}>
                                      {member.division || '-'}
                                    </span>
                                  </div>
                                  <div className="text-center text-muted-foreground text-sm">{member.call_sign || '-'}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    {/* Empty state when no ranks exist at all */}
                    {!dept.ranks?.length && !sorted.length && (
                      <div className="rounded-xl border border-dashed border-border p-16 text-center bg-muted/20">
                        <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No members in this department yet</p>
                      </div>
                    )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}

        {/* Add Staff Dialog */}
        {selectedDeptForAdd && (
          <AddStaffByDiscordDialog
            open={addStaffDialogOpen}
            onOpenChange={setAddStaffDialogOpen}
            departmentLabel={selectedDeptForAdd.departmentLabel}
            departmentKey={selectedDeptForAdd.departmentKey}
            ranks={selectedDeptForAdd.ranks}
            divisionOptions={divisionOptionsByDept[selectedDeptForAdd.shortName.toLowerCase()] || divisionOptions}
            unitOptions={unitOptionsByDept[selectedDeptForAdd.shortName.toLowerCase()] || []}
            onSuccess={handleAddStaffSuccess}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove <strong>{memberToDelete?.name || 'this staff member'}</strong> from the roster? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteStaff}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Roster;
