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
  Lock
} from "lucide-react";
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

const exampleRosterData: Record<string, RosterMember[]> = {
  police: [
    { id: 'ex1', name: 'Aero Souls', rank: 'Police Supervisor', badge_number: '1-ADAM-1', status: 'active', division: 'Administration', strikes: '-' },
    { id: 'ex2', name: 'Jose Hernandez', rank: 'Police Supervisor', badge_number: '1-ADAM-2', status: 'active', division: 'Administration', strikes: '-' },
    { id: 'ex3', name: 'Jose Hernandez', rank: 'Police Commissioner', badge_number: '2-BRAVO-3', status: 'active', division: 'Administration', strikes: '-' },
    { id: 'ex4', name: '', rank: 'Police Chief', badge_number: '3-CHARLIE-4', status: 'inactive', division: 'Administration', strikes: '0/2' },
    { id: 'ex5', name: '', rank: 'Police Asst. Chief', badge_number: '3-CHARLIE-5', status: 'inactive', division: 'Administration', strikes: '0/2' },
    { id: 'ex6', name: '', rank: 'Police Deputy Chief', badge_number: '3-CHARLIE-6', status: 'inactive', division: 'Administration', strikes: '0/2' },
    { id: 'ex7', name: 'Jason Flynn', rank: 'Major', badge_number: '4-DELTA-7', status: 'inactive', division: 'Administration', strikes: '0/2' },
    { id: 'ex8', name: '', rank: 'Captain', badge_number: '5-ECHO-8', status: 'inactive', division: 'Patrol', strikes: '0/2' },
    { id: 'ex9', name: '', rank: 'Captain', badge_number: '5-ECHO-9', status: 'inactive', division: 'Patrol', strikes: '0/2' },
    { id: 'ex10', name: '', rank: 'Captain', badge_number: '5-ECHO-10', status: 'inactive', division: 'Traffic Enforcement', strikes: '0/2' },
    { id: 'ex11', name: '', rank: 'Lieutenant', badge_number: '6-FOXTROT-10', status: 'inactive', division: 'Patrol', strikes: '0/2' },
    { id: 'ex12', name: '', rank: 'Lieutenant', badge_number: '6-FOXTROT-11', status: 'inactive', division: 'Investigations', strikes: '0/2' },
    { id: 'ex13', name: '', rank: 'Sergeant', badge_number: '7-GOLF-14', status: 'inactive', division: 'Patrol', strikes: '0/3' },
    { id: 'ex14', name: '', rank: 'Sergeant', badge_number: '7-GOLF-15', status: 'inactive', division: 'Traffic Enforcement', strikes: '0/3' },
    { id: 'ex15', name: 'John Helper', rank: 'Corporal', badge_number: '8-HOTEL-20', status: 'active', division: 'Patrol', strikes: '0/3' },
    { id: 'ex16', name: '', rank: 'Senior Officer', badge_number: '9-INDIA-25', status: 'inactive', division: 'Patrol', strikes: '0/3' },
    { id: 'ex17', name: '', rank: 'Officer', badge_number: '10-JULIET-30', status: 'inactive', division: 'Patrol', strikes: '0/3' },
    { id: 'ex18', name: '', rank: 'Cadet', badge_number: '11-KILO-35', status: 'inactive', division: 'Training', strikes: '0/3' },
    { id: 'ex19', name: '', rank: 'Solo Cadet', badge_number: '12-LIMA-40', status: 'inactive', division: 'Training', strikes: '0/3' },
  ],
  ems: [
    { id: 'ems1', name: 'Sarah Hayes', rank: 'EMS Director', badge_number: 'MED-1', status: 'active', division: 'Administration', strikes: '-' },
    { id: 'ems2', name: 'Michael Foster', rank: 'Chief Physician', badge_number: 'DOC-1', status: 'active', division: 'Medical', strikes: '-' },
    { id: 'ems3', name: 'Lisa Wong', rank: 'Senior Paramedic', badge_number: 'PARA-5', status: 'active', division: 'Field Ops', strikes: '0/3' },
    { id: 'ems4', name: 'John Blake', rank: 'Paramedic', badge_number: 'PARA-10', status: 'active', division: 'Field Ops', strikes: '0/3' },
    { id: 'ems5', name: 'Rachel Green', rank: 'EMT', badge_number: 'EMT-15', status: 'active', division: 'Field Ops', strikes: '0/3' },
    { id: 'ems6', name: 'David Kim', rank: 'EMT Trainee', badge_number: 'EMT-20', status: 'on_leave', division: 'Training', strikes: '0/3' },
  ],
  fire: [
    { id: 'fire1', name: 'Marcus Brown', rank: 'Fire Chief', badge_number: 'FC-1', status: 'active', division: 'Command', strikes: '-' },
    { id: 'fire2', name: 'James Walker', rank: 'Captain', badge_number: 'FC-5', status: 'active', division: 'Engine 1', strikes: '0/2' },
    { id: 'fire3', name: 'Anna Torres', rank: 'Lieutenant', badge_number: 'FC-10', status: 'active', division: 'Ladder 1', strikes: '0/2' },
    { id: 'fire4', name: 'Mike Stone', rank: 'Senior Firefighter', badge_number: 'FF-15', status: 'active', division: 'Engine 2', strikes: '0/3' },
    { id: 'fire5', name: 'Emily Ross', rank: 'Firefighter', badge_number: 'FF-20', status: 'active', division: 'Engine 1', strikes: '0/3' },
    { id: 'fire6', name: 'Jake Hill', rank: 'Probationary', badge_number: 'FF-25', status: 'active', division: 'Training', strikes: '0/3' },
  ],
  mechanic: [
    { id: 'mech1', name: 'Tony Rizzo', rank: 'Head Mechanic', badge_number: 'M-001', status: 'active', division: 'Management', strikes: '-' },
    { id: 'mech2', name: 'Carlos Mendez', rank: 'Senior Mechanic', badge_number: 'M-002', status: 'active', division: 'Repairs', strikes: '0/3' },
    { id: 'mech3', name: 'Nina Patel', rank: 'Mechanic', badge_number: 'M-003', status: 'active', division: 'Repairs', strikes: '0/3' },
    { id: 'mech4', name: 'Chris O\'Brien', rank: 'Junior Mechanic', badge_number: 'M-004', status: 'active', division: 'Repairs', strikes: '0/3' },
    { id: 'mech5', name: 'Alex Turner', rank: 'Apprentice', badge_number: 'M-005', status: 'on_leave', division: 'Training', strikes: '0/3' },
  ],
  doj: [
    { id: 'doj1', name: 'Hon. Robert Clarke', rank: 'Chief Justice', badge_number: 'J-001', status: 'active', division: 'Judiciary', strikes: '-' },
    { id: 'doj2', name: 'Hon. Maria Santos', rank: 'Senior Judge', badge_number: 'J-002', status: 'active', division: 'Judiciary', strikes: '-' },
    { id: 'doj3', name: 'Smith', rank: 'Attorney General', badge_number: 'AG-001', status: 'active', division: 'Prosecution', strikes: '-' },
    { id: 'doj4', name: 'Jennifer White', rank: 'Asst. District Attorney', badge_number: 'ADA-001', status: 'active', division: 'Prosecution', strikes: '0/2' },
    { id: 'doj5', name: 'Mark Lee', rank: 'Public Defender', badge_number: 'PD-001', status: 'active', division: 'Defense', strikes: '0/2' },
  ],
  weazel: [
    { id: 'wz1', name: 'Victoria Sterling', rank: 'News Director', badge_number: 'WN-001', status: 'active', division: 'Management', strikes: '-' },
    { id: 'wz2', name: 'Ryan Cooper', rank: 'Lead Anchor', badge_number: 'WN-002', status: 'active', division: 'On-Air', strikes: '0/2' },
    { id: 'wz3', name: 'Jessica Lane', rank: 'Field Reporter', badge_number: 'WN-003', status: 'active', division: 'Field', strikes: '0/3' },
    { id: 'wz4', name: 'Tommy Vance', rank: 'Cameraman', badge_number: 'WN-004', status: 'active', division: 'Production', strikes: '0/3' },
    { id: 'wz5', name: 'Sophie Chen', rank: 'Intern Reporter', badge_number: 'WN-005', status: 'on_leave', division: 'Training', strikes: '0/3' },
  ],
  pdm: [
    { id: 'pdm1', name: 'Vincent Romano', rank: 'General Manager', badge_number: 'PDM-001', status: 'active', division: 'Management', strikes: '-' },
    { id: 'pdm2', name: 'Ashley Brooks', rank: 'Sales Manager', badge_number: 'PDM-002', status: 'active', division: 'Sales', strikes: '0/2' },
    { id: 'pdm3', name: 'Derek Miles', rank: 'Senior Sales', badge_number: 'PDM-003', status: 'active', division: 'Sales', strikes: '0/3' },
    { id: 'pdm4', name: 'Natalie Reed', rank: 'Sales Associate', badge_number: 'PDM-004', status: 'active', division: 'Sales', strikes: '0/3' },
    { id: 'pdm5', name: 'Kevin Hart', rank: 'Sales Trainee', badge_number: 'PDM-005', status: 'active', division: 'Training', strikes: '0/3' },
  ],
};

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

const divisionOptions = [
  { value: 'Administration', label: 'Administration' },
  { value: 'Patrol', label: 'Patrol' },
  { value: 'Traffic Enforcement', label: 'Traffic Enforcement' },
  { value: 'Investigations', label: 'Investigations' },
  { value: 'Training', label: 'Training' },
  { value: 'Field Ops', label: 'Field Ops' },
  { value: 'Command', label: 'Command' },
  { value: 'Engine 1', label: 'Engine 1' },
  { value: 'Engine 2', label: 'Engine 2' },
  { value: 'Ladder 1', label: 'Ladder 1' },
  { value: 'Management', label: 'Management' },
  { value: 'Repairs', label: 'Repairs' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Medical', label: 'Medical' },
  { value: 'Judiciary', label: 'Judiciary' },
  { value: 'Prosecution', label: 'Prosecution' },
  { value: 'Defense', label: 'Defense' },
  { value: 'On-Air', label: 'On-Air' },
  { value: 'Production', label: 'Production' },
  { value: 'Field', label: 'Field' },
  { value: 'Staff', label: 'Staff' },
];

const Roster = () => {
  const [loading, setLoading] = useState(true);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [editedData, setEditedData] = useState<Record<string, Record<string, RosterMember>>>({});
  const [saving, setSaving] = useState(false);
  const { hasAccess, canEdit, loading: accessLoading, isOwner } = useRosterAccess();

  useEffect(() => {
    const fetchStaff = async () => {
      if (!hasAccess && !accessLoading) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from('staff_members')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      setStaffMembers(data || []);
      setLoading(false);
    };
    
    if (!accessLoading) {
      fetchStaff();
    }
  }, [hasAccess, accessLoading]);

  const getDepartmentMembers = (key: string, filters: string[]): RosterMember[] => {
    const staff = staffMembers.filter(s => 
      filters.some(f => s.department?.toLowerCase().includes(f))
    ).map(s => ({
      id: s.id,
      name: s.name,
      rank: s.role,
      badge_number: s.discord_id?.slice(-6) || '-',
      status: 'active' as const,
      division: s.department || 'Staff',
      discord_avatar: s.discord_avatar,
      strikes: '0/3',
    }));
    return staff.length ? staff : exampleRosterData[key] || [];
  };

  const departments: DepartmentRoster[] = [
    {
      department: "Police Department",
      shortName: "Police",
      icon: <Siren className="w-4 h-4" />,
      accentColor: "blue",
      members: getDepartmentMembers('police', ['police', 'pd', 'lspd']),
      ranks: ['Police Supervisor', 'Police Commissioner', 'Police Chief', 'Police Asst. Chief', 'Police Deputy Chief', 'Major', 'Captain', 'Lieutenant', 'Sergeant', 'Corporal', 'Senior Officer', 'Officer', 'Solo Cadet', 'Cadet'],
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
      department: "Server Staff",
      shortName: "Staff",
      icon: <Shield className="w-4 h-4" />,
      accentColor: "violet",
      members: staffMembers.filter(s => 
        s.department?.toLowerCase().includes('staff') || 
        s.department?.toLowerCase().includes('admin') ||
        s.department?.toLowerCase().includes('management') ||
        !s.department
      ).map(s => ({
        id: s.id,
        name: s.name,
        rank: s.role,
        badge_number: s.discord_id?.slice(-6) || '-',
        status: 'active' as const,
        division: s.department || 'Staff',
        discord_avatar: s.discord_avatar,
        strikes: '-',
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
      // For now, just show a success message since this is demo data
      // In production, you would save to Supabase here
      toast.success('Roster changes saved successfully!');
      setEditMode(prev => ({ ...prev, [deptKey]: false }));
    } catch (error) {
      toast.error('Failed to save changes');
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
          <Tabs defaultValue="police-department" className="space-y-8">
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
                      
                      <div className="flex items-center gap-4">
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleEditMode(deptKey, dept.members)}
                            className="gap-2"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </Button>
                        ) : null}
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{dept.members.length}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rank Sections */}
                  {sorted.length > 0 ? (
                    <div className="space-y-6">
                      {dept.ranks?.map((rankName, rankIdx) => {
                        const members = byRank[rankName];
                        if (!members?.length) return null;

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

                            {/* Table Header */}
                            <div className="grid grid-cols-6 px-5 py-3 bg-muted/30 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <span className="w-8" />
                                <span>Officer</span>
                              </div>
                              <div className="text-center">Badge Number</div>
                              <div className="text-center">Strikes</div>
                              <div className="text-center">Status</div>
                              <div className="text-center">Division</div>
                              <div className="text-center">Unit</div>
                            </div>

                            {/* Members */}
                            <div className="divide-y divide-border/50">
                              {members.map((member, idx) => (
                                <div 
                                  key={member.id}
                                  className={`grid grid-cols-6 px-5 py-3 items-center transition-colors hover:bg-muted/30
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
                                          {divisionOptions.map(opt => (
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
                                  <div className="text-center">
                                    {isEditing ? (
                                      <Input
                                        value={getMemberValue(deptKey, member, 'call_sign')}
                                        onChange={(e) => updateMemberField(deptKey, member.id, 'call_sign', e.target.value)}
                                        placeholder="Unit"
                                        className="h-8 text-sm text-center"
                                      />
                                    ) : (
                                      <span className="text-muted-foreground text-sm">{member.call_sign || '-'}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
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
                                  className={`grid grid-cols-6 px-5 py-3 items-center ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border-2 border-border">
                                      <AvatarImage src={member.discord_avatar} />
                                      <AvatarFallback className="bg-muted text-xs">{member.name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{member.name || 'Vacant'}</span>
                                  </div>
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
                                  <div className="text-center text-muted-foreground text-sm">-</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
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
      </div>
    </div>
  );
};

export default Roster;
