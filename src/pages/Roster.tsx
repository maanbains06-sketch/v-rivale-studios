import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
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
  Users
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
  call_sign?: string;
  strikes?: string;
  unit?: string;
}

interface DepartmentRoster {
  department: string;
  shortName: string;
  icon: React.ReactNode;
  headerColor: string;
  borderColor: string;
  members: RosterMember[];
  ranks?: string[];
}

const exampleRosterData: Record<string, RosterMember[]> = {
  police: [
    { id: 'ex1', name: 'Aero Souls', rank: 'Police Supervisor', badge_number: '1-ADAM-1', status: 'active', division: 'Administration', strikes: '-', unit: 'Command' },
    { id: 'ex2', name: 'Jose Hernandez', rank: 'Police Supervisor', badge_number: '1-ADAM-2', status: 'active', division: 'Administration', strikes: '-', unit: 'Command' },
    { id: 'ex3', name: 'Jose Hernandez', rank: 'Police Commissioner', badge_number: '2-BRAVO-3', status: 'active', division: 'Administration', strikes: '-', unit: 'Command' },
    { id: 'ex4', name: '', rank: 'Police Chief', badge_number: '3-CHARLIE-4', status: 'inactive', division: 'Administration', strikes: '0/2' },
    { id: 'ex5', name: '', rank: 'Police Asst. Chief', badge_number: '3-CHARLIE-5', status: 'inactive', division: 'Administration', strikes: '0/2' },
    { id: 'ex6', name: '', rank: 'Police Deputy Chief', badge_number: '3-CHARLIE-6', status: 'inactive', division: 'Administration', strikes: '0/2' },
    { id: 'ex7', name: 'Jason Flynn', rank: 'Major', badge_number: '4-DELTA-7', status: 'inactive', division: 'Administration', strikes: '0/2' },
    { id: 'ex8', name: '', rank: 'Captain', badge_number: '5-ECHO-8', status: 'inactive', division: 'Patrol', strikes: '0/2' },
    { id: 'ex9', name: '', rank: 'Captain', badge_number: '5-ECHO-9', status: 'inactive', division: 'Patrol', strikes: '0/2' },
    { id: 'ex10', name: '', rank: 'Captain', badge_number: '5-ECHO-10', status: 'inactive', division: 'Traffic Enforcement Services', strikes: '0/2' },
    { id: 'ex11', name: '', rank: 'Lieutenant', badge_number: '6-FOXTROT-10', status: 'inactive', division: 'Patrol', strikes: '0/2' },
    { id: 'ex12', name: '', rank: 'Lieutenant', badge_number: '6-FOXTROT-11', status: 'inactive', division: 'Patrol', strikes: '0/2' },
    { id: 'ex13', name: '', rank: 'Lieutenant', badge_number: '6-FOXTROT-12', status: 'inactive', division: 'Traffic Enforcement Services', strikes: '0/2' },
    { id: 'ex14', name: '', rank: 'Sergeant', badge_number: '7-GOLF-14', status: 'inactive', division: 'Patrol', strikes: '0/3' },
    { id: 'ex15', name: '', rank: 'Sergeant', badge_number: '7-GOLF-15', status: 'inactive', division: 'Patrol', strikes: '0/3' },
    { id: 'ex16', name: '', rank: 'Sergeant', badge_number: '7-GOLF-16', status: 'inactive', division: 'Traffic Enforcement Services', strikes: '0/3' },
    { id: 'ex17', name: 'John Helper', rank: 'Corporal', badge_number: '8-HOTEL-20', status: 'inactive', division: 'Patrol', strikes: '0/3' },
    { id: 'ex18', name: '', rank: 'Senior Officer', badge_number: '9-INDIA-25', status: 'inactive', division: 'Patrol', strikes: '0/3' },
    { id: 'ex19', name: '', rank: 'Officer', badge_number: '10-JULIET-30', status: 'inactive', division: 'Patrol', strikes: '0/3' },
    { id: 'ex20', name: '', rank: 'Cadet', badge_number: '11-KILO-35', status: 'inactive', division: 'Training', strikes: '0/3' },
    { id: 'ex21', name: '', rank: 'Solo Cadet', badge_number: '12-LIMA-40', status: 'inactive', division: 'Training', strikes: '0/3' },
  ],
  ems: [
    { id: 'ems1', name: 'Sarah Hayes', rank: 'EMS Director', badge_number: 'MED-1', status: 'active', division: 'Administration', strikes: '-' },
    { id: 'ems2', name: 'Michael Foster', rank: 'Chief Physician', badge_number: 'DOC-1', status: 'active', division: 'Medical', strikes: '-' },
    { id: 'ems3', name: 'Lisa Wong', rank: 'Senior Paramedic', badge_number: 'PARA-5', status: 'active', division: 'Field Operations', strikes: '0/3' },
    { id: 'ems4', name: 'John Blake', rank: 'Paramedic', badge_number: 'PARA-10', status: 'active', division: 'Field Operations', strikes: '0/3' },
    { id: 'ems5', name: 'Rachel Green', rank: 'EMT', badge_number: 'EMT-15', status: 'active', division: 'Field Operations', strikes: '0/3' },
    { id: 'ems6', name: 'David Kim', rank: 'EMT Trainee', badge_number: 'EMT-20', status: 'on_leave', division: 'Training', strikes: '0/3' },
  ],
  fire: [
    { id: 'fire1', name: 'Marcus Brown', rank: 'Fire Chief', badge_number: 'FC-1', status: 'active', division: 'Administration', strikes: '-' },
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

const getDivisionStyle = (division: string): string => {
  const d = division.toLowerCase();
  if (d.includes('administration') || d.includes('management') || d.includes('command')) 
    return 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20';
  if (d.includes('patrol')) 
    return 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20';
  if (d.includes('traffic')) 
    return 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/20';
  if (d.includes('criminal') || d.includes('investigation')) 
    return 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/20';
  if (d.includes('training')) 
    return 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/20';
  if (d.includes('field')) 
    return 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20';
  if (d.includes('sales')) 
    return 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20';
  if (d.includes('medical')) 
    return 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-500/20';
  if (d.includes('production') || d.includes('on-air')) 
    return 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20';
  if (d.includes('judiciary') || d.includes('prosecution') || d.includes('defense')) 
    return 'bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/20';
  if (d.includes('engine') || d.includes('ladder')) 
    return 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/20';
  if (d.includes('repairs')) 
    return 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-black shadow-lg shadow-yellow-500/20';
  return 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-lg shadow-gray-500/20';
};

const getStatusStyle = (status: string): { bg: string; text: string } => {
  switch (status) {
    case 'active': return { bg: 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30', text: 'Active' };
    case 'inactive': return { bg: 'bg-gradient-to-r from-gray-500 to-gray-400 shadow-lg shadow-gray-500/20', text: '-' };
    case 'on_leave': return { bg: 'bg-gradient-to-r from-amber-500 to-yellow-500 shadow-lg shadow-amber-500/30', text: 'On Leave' };
    default: return { bg: 'bg-gradient-to-r from-gray-500 to-gray-400', text: '-' };
  }
};

const Roster = () => {
  const [loading, setLoading] = useState(true);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('staff_members')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      setStaffMembers(data || []);
      setLoading(false);
    };
    fetchStaff();
  }, []);

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
      headerColor: "from-blue-700 via-blue-600 to-indigo-700",
      borderColor: "border-blue-500/50",
      members: getDepartmentMembers('police', ['police', 'pd', 'lspd']),
      ranks: ['Police Supervisor', 'Police Commissioner', 'Police Chief', 'Police Asst. Chief', 'Police Deputy Chief', 'Major', 'Captain', 'Lieutenant', 'Sergeant', 'Corporal', 'Senior Officer', 'Officer', 'Cadet', 'Solo Cadet'],
    },
    {
      department: "EMS Department",
      shortName: "EMS",
      icon: <Ambulance className="w-4 h-4" />,
      headerColor: "from-red-700 via-red-600 to-rose-700",
      borderColor: "border-red-500/50",
      members: getDepartmentMembers('ems', ['ems', 'medical', 'hospital']),
      ranks: ['EMS Director', 'Chief Physician', 'Senior Paramedic', 'Paramedic', 'EMT', 'EMT Trainee'],
    },
    {
      department: "Fire Department",
      shortName: "Fire",
      icon: <Flame className="w-4 h-4" />,
      headerColor: "from-orange-700 via-orange-600 to-amber-700",
      borderColor: "border-orange-500/50",
      members: getDepartmentMembers('fire', ['fire', 'fd', 'lsfd']),
      ranks: ['Fire Chief', 'Captain', 'Lieutenant', 'Senior Firefighter', 'Firefighter', 'Probationary'],
    },
    {
      department: "Mechanic Shop",
      shortName: "Mechanic",
      icon: <Wrench className="w-4 h-4" />,
      headerColor: "from-amber-700 via-yellow-600 to-orange-600",
      borderColor: "border-amber-500/50",
      members: getDepartmentMembers('mechanic', ['mechanic', 'garage', 'repair']),
      ranks: ['Head Mechanic', 'Senior Mechanic', 'Mechanic', 'Junior Mechanic', 'Apprentice'],
    },
    {
      department: "Department of Justice",
      shortName: "DOJ",
      icon: <Gavel className="w-4 h-4" />,
      headerColor: "from-purple-700 via-violet-600 to-indigo-700",
      borderColor: "border-purple-500/50",
      members: getDepartmentMembers('doj', ['justice', 'doj', 'court', 'legal']),
      ranks: ['Chief Justice', 'Senior Judge', 'Judge', 'Attorney General', 'Asst. District Attorney', 'Public Defender'],
    },
    {
      department: "Weazel News",
      shortName: "Weazel",
      icon: <Tv className="w-4 h-4" />,
      headerColor: "from-pink-700 via-fuchsia-600 to-purple-700",
      borderColor: "border-pink-500/50",
      members: getDepartmentMembers('weazel', ['weazel', 'news', 'media']),
      ranks: ['News Director', 'Lead Anchor', 'Senior Reporter', 'Field Reporter', 'Cameraman', 'Intern Reporter'],
    },
    {
      department: "Premium Deluxe Motorsport",
      shortName: "PDM",
      icon: <Car className="w-4 h-4" />,
      headerColor: "from-cyan-700 via-teal-600 to-emerald-700",
      borderColor: "border-cyan-500/50",
      members: getDepartmentMembers('pdm', ['pdm', 'motorsport', 'dealership', 'deluxe']),
      ranks: ['General Manager', 'Sales Manager', 'Senior Sales', 'Sales Associate', 'Sales Trainee'],
    },
    {
      department: "Server Staff",
      shortName: "Staff",
      icon: <Shield className="w-4 h-4" />,
      headerColor: "from-violet-700 via-purple-600 to-fuchsia-700",
      borderColor: "border-violet-500/50",
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
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="police-department" className="space-y-6">
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-auto gap-1 p-1.5 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl">
                {departments.map((dept) => (
                  <TabsTrigger 
                    key={dept.department}
                    value={dept.department.toLowerCase().replace(/\s+/g, '-')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                      data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 
                      data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25
                      hover:bg-white/5"
                  >
                    {dept.icon}
                    <span className="hidden sm:inline">{dept.shortName}</span>
                    <span className="text-xs opacity-70 ml-1">({dept.members.length})</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {departments.map((dept) => {
              const sorted = [...dept.members].sort((a, b) => 
                getRankOrder(a.rank, dept.ranks) - getRankOrder(b.rank, dept.ranks)
              );

              const byRank: Record<string, RosterMember[]> = {};
              sorted.forEach(m => {
                const match = dept.ranks?.find(r => 
                  m.rank.toLowerCase() === r.toLowerCase() ||
                  m.rank.toLowerCase().includes(r.toLowerCase())
                ) || m.rank;
                if (!byRank[match]) byRank[match] = [];
                byRank[match].push(m);
              });

              return (
                <TabsContent 
                  key={dept.department}
                  value={dept.department.toLowerCase().replace(/\s+/g, '-')}
                  className="space-y-0"
                >
                  {/* 3D Department Header */}
                  <div className={`relative overflow-hidden bg-gradient-to-r ${dept.headerColor} text-white text-center py-5 
                    rounded-t-2xl border-2 ${dept.borderColor} shadow-2xl`}
                    style={{
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.2)'
                    }}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent h-1/2" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15),transparent_70%)]" />
                    
                    <div className="relative flex items-center justify-center gap-3">
                      <span className="p-2 bg-white/20 rounded-lg backdrop-blur-sm shadow-inner">{dept.icon}</span>
                      <h2 className="text-2xl font-bold tracking-wide drop-shadow-lg">{dept.department}</h2>
                    </div>
                  </div>

                  {/* 3D Table Container */}
                  <div className="relative rounded-b-2xl overflow-hidden border-2 border-t-0 border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl"
                    style={{
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}
                  >
                    {/* Table Header */}
                    <div className="grid grid-cols-7 bg-gradient-to-r from-gray-900/90 via-gray-800/90 to-gray-900/90 text-xs font-bold uppercase tracking-wider text-gray-300 border-b border-white/10"
                      style={{
                        boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1)'
                      }}
                    >
                      <div className="py-3 px-4 text-center border-r border-white/5">Avatar</div>
                      <div className="py-3 px-4 text-center border-r border-white/5">Rank</div>
                      <div className="py-3 px-4 text-center border-r border-white/5">Name</div>
                      <div className="py-3 px-4 text-center border-r border-white/5">Badge Number</div>
                      <div className="py-3 px-4 text-center border-r border-white/5">Strikes</div>
                      <div className="py-3 px-4 text-center border-r border-white/5">Status</div>
                      <div className="py-3 px-4 text-center">Division</div>
                    </div>

                    {/* Members by Rank */}
                    {sorted.length > 0 ? (
                      <div>
                        {dept.ranks?.map((rankName, rankIdx) => {
                          const members = byRank[rankName];
                          if (!members?.length) return null;

                          return (
                            <div key={rankName}>
                              {/* Rank Separator */}
                              {rankIdx > 0 && (
                                <div className="h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                              )}
                              
                              {/* Members */}
                              {members.map((member, idx) => {
                                const statusStyle = getStatusStyle(member.status);
                                return (
                                  <div 
                                    key={member.id}
                                    className={`grid grid-cols-7 text-sm transition-all duration-200 hover:bg-white/5
                                      ${idx % 2 === 0 ? 'bg-white/[0.02]' : 'bg-black/20'}
                                      border-b border-white/5 last:border-b-0`}
                                  >
                                    {/* Avatar */}
                                    <div className="py-3 px-4 flex justify-center items-center border-r border-white/5">
                                      <Avatar className="h-9 w-9 ring-2 ring-white/20 shadow-lg">
                                        <AvatarImage src={member.discord_avatar} />
                                        <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-800 text-white text-xs font-bold">
                                          {member.name?.charAt(0) || '?'}
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                    
                                    {/* Rank */}
                                    <div className="py-3 px-4 flex justify-center items-center border-r border-white/5">
                                      <span className="font-semibold text-white/90">{member.rank}</span>
                                    </div>
                                    
                                    {/* Name */}
                                    <div className="py-3 px-4 flex justify-center items-center border-r border-white/5">
                                      <span className={member.name ? 'text-white' : 'text-white/40'}>
                                        {member.name || '-'}
                                      </span>
                                    </div>
                                    
                                    {/* Badge */}
                                    <div className="py-3 px-4 flex justify-center items-center border-r border-white/5">
                                      <span className="font-mono text-cyan-400/90 text-xs bg-cyan-500/10 px-2 py-1 rounded">
                                        {member.badge_number || '-'}
                                      </span>
                                    </div>
                                    
                                    {/* Strikes */}
                                    <div className="py-3 px-4 flex justify-center items-center border-r border-white/5">
                                      <span className="text-white/70">{member.strikes || '-'}</span>
                                    </div>
                                    
                                    {/* Status */}
                                    <div className="py-3 px-4 flex justify-center items-center border-r border-white/5">
                                      <span className={`px-3 py-1 rounded-md text-xs font-semibold text-white ${statusStyle.bg}`}>
                                        {statusStyle.text}
                                      </span>
                                    </div>
                                    
                                    {/* Division */}
                                    <div className="py-3 px-4 flex justify-center items-center">
                                      <span className={`px-3 py-1 rounded-md text-xs font-semibold ${getDivisionStyle(member.division || '')}`}>
                                        {member.division || '-'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}

                        {/* Unmatched ranks */}
                        {Object.entries(byRank)
                          .filter(([rank]) => !dept.ranks?.includes(rank))
                          .map(([, members]) => (
                            members.map((member, idx) => {
                              const statusStyle = getStatusStyle(member.status);
                              return (
                                <div 
                                  key={member.id}
                                  className={`grid grid-cols-7 text-sm transition-all duration-200 hover:bg-white/5
                                    ${idx % 2 === 0 ? 'bg-white/[0.02]' : 'bg-black/20'}
                                    border-b border-white/5`}
                                >
                                  <div className="py-3 px-4 flex justify-center items-center border-r border-white/5">
                                    <Avatar className="h-9 w-9 ring-2 ring-white/20 shadow-lg">
                                      <AvatarImage src={member.discord_avatar} />
                                      <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-800 text-white text-xs font-bold">
                                        {member.name?.charAt(0) || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                  <div className="py-3 px-4 flex justify-center items-center border-r border-white/5 font-semibold text-white/90">{member.rank}</div>
                                  <div className="py-3 px-4 flex justify-center items-center border-r border-white/5 text-white">{member.name || '-'}</div>
                                  <div className="py-3 px-4 flex justify-center items-center border-r border-white/5">
                                    <span className="font-mono text-cyan-400/90 text-xs bg-cyan-500/10 px-2 py-1 rounded">{member.badge_number || '-'}</span>
                                  </div>
                                  <div className="py-3 px-4 flex justify-center items-center border-r border-white/5 text-white/70">{member.strikes || '-'}</div>
                                  <div className="py-3 px-4 flex justify-center items-center border-r border-white/5">
                                    <span className={`px-3 py-1 rounded-md text-xs font-semibold text-white ${statusStyle.bg}`}>{statusStyle.text}</span>
                                  </div>
                                  <div className="py-3 px-4 flex justify-center items-center">
                                    <span className={`px-3 py-1 rounded-md text-xs font-semibold ${getDivisionStyle(member.division || '')}`}>{member.division || '-'}</span>
                                  </div>
                                </div>
                              );
                            })
                          ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center">
                        <Users className="w-12 h-12 mx-auto mb-4 text-white/30" />
                        <p className="text-white/50">No members in this department yet</p>
                      </div>
                    )}
                  </div>

                  {/* Stats Footer */}
                  <div className="flex items-center justify-center gap-8 py-5 mt-4 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10">
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{dept.members.length}</span>
                      <span>Total</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                      <span className="font-medium text-green-400">{dept.members.filter(m => m.status === 'active').length}</span>
                      <span className="text-white/70">Active</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50" />
                      <span className="font-medium text-amber-400">{dept.members.filter(m => m.status === 'on_leave').length}</span>
                      <span className="text-white/70">On Leave</span>
                    </div>
                  </div>
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
