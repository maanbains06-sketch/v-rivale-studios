import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
}

interface DepartmentRoster {
  department: string;
  shortName: string;
  icon: React.ReactNode;
  headerColor: string;
  members: RosterMember[];
  ranks?: string[];
}

const exampleRosterData: Record<string, RosterMember[]> = {
  police: [
    { id: 'ex1', name: 'Aero Souls', rank: 'Police Supervisor', badge_number: '1-ADAM-1', status: 'active', division: 'Administration' },
    { id: 'ex2', name: 'Jose Hernandez', rank: 'Police Supervisor', badge_number: '1-ADAM-2', status: 'active', division: 'Administration' },
    { id: 'ex3', name: 'Jose Hernandez', rank: 'Police Commissioner', badge_number: '2-BRAVO-3', status: 'active', division: 'Administration' },
    { id: 'ex4', name: '', rank: 'Police Chief', badge_number: '3-CHARLIE-4', status: 'inactive', division: 'Administration' },
    { id: 'ex5', name: '', rank: 'Police Asst. Chief', badge_number: '3-CHARLIE-5', status: 'inactive', division: 'Administration' },
    { id: 'ex6', name: '', rank: 'Police Deputy Chief', badge_number: '3-CHARLIE-6', status: 'inactive', division: 'Administration' },
    { id: 'ex7', name: 'Jason Flynn', rank: 'Major', badge_number: '4-DELTA-7', status: 'inactive', division: 'Administration' },
    { id: 'ex8', name: '', rank: 'Captain', badge_number: '5-ECHO-8', status: 'inactive', division: 'Patrol' },
    { id: 'ex9', name: '', rank: 'Captain', badge_number: '5-ECHO-9', status: 'inactive', division: 'Patrol' },
    { id: 'ex10', name: '', rank: 'Captain', badge_number: '5-ECHO-10', status: 'inactive', division: 'Traffic Enforcement Services' },
    { id: 'ex11', name: '', rank: 'Lieutenant', badge_number: '6-FOXTROT-10', status: 'inactive', division: 'Patrol' },
    { id: 'ex12', name: '', rank: 'Lieutenant', badge_number: '6-FOXTROT-11', status: 'inactive', division: 'Patrol' },
    { id: 'ex13', name: '', rank: 'Sergeant', badge_number: '7-GOLF-14', status: 'inactive', division: 'Patrol' },
    { id: 'ex14', name: '', rank: 'Sergeant', badge_number: '7-GOLF-15', status: 'inactive', division: 'Patrol' },
    { id: 'ex15', name: 'John Helper', rank: 'Corporal', badge_number: '8-HOTEL-20', status: 'inactive', division: 'Patrol' },
    { id: 'ex16', name: '', rank: 'Senior Officer', badge_number: '9-INDIA-25', status: 'inactive', division: 'Patrol' },
    { id: 'ex17', name: '', rank: 'Officer', badge_number: '10-JULIET-30', status: 'inactive', division: 'Patrol' },
    { id: 'ex18', name: '', rank: 'Cadet', badge_number: '11-KILO-35', status: 'inactive', division: 'Training' },
    { id: 'ex19', name: '', rank: 'Solo Cadet', badge_number: '12-LIMA-40', status: 'inactive', division: 'Training' },
  ],
  ems: [
    { id: 'ems1', name: 'Sarah Hayes', rank: 'EMS Director', badge_number: 'MED-1', status: 'active', division: 'Administration' },
    { id: 'ems2', name: 'Michael Foster', rank: 'Chief Physician', badge_number: 'DOC-1', status: 'active', division: 'Medical' },
    { id: 'ems3', name: 'Lisa Wong', rank: 'Senior Paramedic', badge_number: 'PARA-5', status: 'active', division: 'Field Operations' },
    { id: 'ems4', name: 'John Blake', rank: 'Paramedic', badge_number: 'PARA-10', status: 'active', division: 'Field Operations' },
    { id: 'ems5', name: 'Rachel Green', rank: 'EMT', badge_number: 'EMT-15', status: 'active', division: 'Field Operations' },
    { id: 'ems6', name: 'David Kim', rank: 'EMT Trainee', badge_number: 'EMT-20', status: 'on_leave', division: 'Training' },
  ],
  fire: [
    { id: 'fire1', name: 'Marcus Brown', rank: 'Fire Chief', badge_number: 'FC-1', status: 'active', division: 'Administration' },
    { id: 'fire2', name: 'James Walker', rank: 'Captain', badge_number: 'FC-5', status: 'active', division: 'Engine 1' },
    { id: 'fire3', name: 'Anna Torres', rank: 'Lieutenant', badge_number: 'FC-10', status: 'active', division: 'Ladder 1' },
    { id: 'fire4', name: 'Mike Stone', rank: 'Senior Firefighter', badge_number: 'FF-15', status: 'active', division: 'Engine 2' },
    { id: 'fire5', name: 'Emily Ross', rank: 'Firefighter', badge_number: 'FF-20', status: 'active', division: 'Engine 1' },
    { id: 'fire6', name: 'Jake Hill', rank: 'Probationary', badge_number: 'FF-25', status: 'active', division: 'Training' },
  ],
  mechanic: [
    { id: 'mech1', name: 'Tony Rizzo', rank: 'Head Mechanic', badge_number: 'M-001', status: 'active', division: 'Management' },
    { id: 'mech2', name: 'Carlos Mendez', rank: 'Senior Mechanic', badge_number: 'M-002', status: 'active', division: 'Repairs' },
    { id: 'mech3', name: 'Nina Patel', rank: 'Mechanic', badge_number: 'M-003', status: 'active', division: 'Repairs' },
    { id: 'mech4', name: 'Chris O\'Brien', rank: 'Junior Mechanic', badge_number: 'M-004', status: 'active', division: 'Repairs' },
    { id: 'mech5', name: 'Alex Turner', rank: 'Apprentice', badge_number: 'M-005', status: 'on_leave', division: 'Training' },
  ],
  doj: [
    { id: 'doj1', name: 'Hon. Robert Clarke', rank: 'Chief Justice', badge_number: 'J-001', status: 'active', division: 'Judiciary' },
    { id: 'doj2', name: 'Hon. Maria Santos', rank: 'Senior Judge', badge_number: 'J-002', status: 'active', division: 'Judiciary' },
    { id: 'doj3', name: 'Smith', rank: 'Attorney General', badge_number: 'AG-001', status: 'active', division: 'Prosecution' },
    { id: 'doj4', name: 'Jennifer White', rank: 'Asst. District Attorney', badge_number: 'ADA-001', status: 'active', division: 'Prosecution' },
    { id: 'doj5', name: 'Mark Lee', rank: 'Public Defender', badge_number: 'PD-001', status: 'active', division: 'Defense' },
  ],
  weazel: [
    { id: 'wz1', name: 'Victoria Sterling', rank: 'News Director', badge_number: 'WN-001', status: 'active', division: 'Management' },
    { id: 'wz2', name: 'Ryan Cooper', rank: 'Lead Anchor', badge_number: 'WN-002', status: 'active', division: 'On-Air' },
    { id: 'wz3', name: 'Jessica Lane', rank: 'Field Reporter', badge_number: 'WN-003', status: 'active', division: 'Field' },
    { id: 'wz4', name: 'Tommy Vance', rank: 'Cameraman', badge_number: 'WN-004', status: 'active', division: 'Production' },
    { id: 'wz5', name: 'Sophie Chen', rank: 'Intern Reporter', badge_number: 'WN-005', status: 'on_leave', division: 'Training' },
  ],
  pdm: [
    { id: 'pdm1', name: 'Vincent Romano', rank: 'General Manager', badge_number: 'PDM-001', status: 'active', division: 'Management' },
    { id: 'pdm2', name: 'Ashley Brooks', rank: 'Sales Manager', badge_number: 'PDM-002', status: 'active', division: 'Sales' },
    { id: 'pdm3', name: 'Derek Miles', rank: 'Senior Sales', badge_number: 'PDM-003', status: 'active', division: 'Sales' },
    { id: 'pdm4', name: 'Natalie Reed', rank: 'Sales Associate', badge_number: 'PDM-004', status: 'active', division: 'Sales' },
    { id: 'pdm5', name: 'Kevin Hart', rank: 'Sales Trainee', badge_number: 'PDM-005', status: 'active', division: 'Training' },
  ],
};

const getDivisionColor = (division: string): string => {
  const divisionLower = division.toLowerCase();
  if (divisionLower.includes('administration') || divisionLower.includes('management')) return 'bg-red-500';
  if (divisionLower.includes('patrol')) return 'bg-blue-500';
  if (divisionLower.includes('traffic')) return 'bg-green-500';
  if (divisionLower.includes('criminal') || divisionLower.includes('investigation')) return 'bg-purple-500';
  if (divisionLower.includes('training')) return 'bg-orange-500';
  if (divisionLower.includes('field')) return 'bg-cyan-500';
  if (divisionLower.includes('sales')) return 'bg-emerald-500';
  if (divisionLower.includes('medical')) return 'bg-pink-500';
  if (divisionLower.includes('production')) return 'bg-indigo-500';
  return 'bg-gray-500';
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return 'bg-green-500 text-white';
    case 'inactive': return 'bg-gray-400 text-white';
    case 'on_leave': return 'bg-amber-500 text-white';
    default: return 'bg-gray-400 text-white';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'active': return 'Active';
    case 'inactive': return '-';
    case 'on_leave': return 'On Leave';
    default: return '-';
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

  const getDepartmentMembers = (departmentKey: string, departmentFilter: string[]): RosterMember[] => {
    const staffData = staffMembers.filter(s => 
      departmentFilter.some(filter => s.department?.toLowerCase().includes(filter))
    ).map(s => ({
      id: s.id,
      name: s.name,
      rank: s.role,
      badge_number: s.discord_id?.slice(-4),
      status: 'active' as const,
      division: s.department,
      discord_avatar: s.discord_avatar
    }));

    if (staffData.length === 0 && exampleRosterData[departmentKey]) {
      return exampleRosterData[departmentKey];
    }

    return staffData;
  };

  const departments: DepartmentRoster[] = [
    {
      department: "Police Department",
      shortName: "Police",
      icon: <Siren className="w-4 h-4" />,
      headerColor: "bg-blue-600",
      members: getDepartmentMembers('police', ['police', 'pd', 'lspd']),
      ranks: ['Police Supervisor', 'Police Commissioner', 'Police Chief', 'Police Asst. Chief', 'Police Deputy Chief', 'Major', 'Captain', 'Lieutenant', 'Sergeant', 'Corporal', 'Senior Officer', 'Officer', 'Cadet', 'Solo Cadet'],
    },
    {
      department: "EMS Department",
      shortName: "EMS",
      icon: <Ambulance className="w-4 h-4" />,
      headerColor: "bg-red-600",
      members: getDepartmentMembers('ems', ['ems', 'medical', 'hospital']),
      ranks: ['EMS Director', 'Chief Physician', 'Senior Paramedic', 'Paramedic', 'EMT', 'EMT Trainee'],
    },
    {
      department: "Fire Department",
      shortName: "Fire",
      icon: <Flame className="w-4 h-4" />,
      headerColor: "bg-orange-600",
      members: getDepartmentMembers('fire', ['fire', 'fd', 'lsfd']),
      ranks: ['Fire Chief', 'Captain', 'Lieutenant', 'Senior Firefighter', 'Firefighter', 'Probationary'],
    },
    {
      department: "Mechanic Shop",
      shortName: "Mechanic",
      icon: <Wrench className="w-4 h-4" />,
      headerColor: "bg-amber-600",
      members: getDepartmentMembers('mechanic', ['mechanic', 'garage', 'repair']),
      ranks: ['Head Mechanic', 'Senior Mechanic', 'Mechanic', 'Junior Mechanic', 'Apprentice'],
    },
    {
      department: "Department of Justice",
      shortName: "DOJ",
      icon: <Gavel className="w-4 h-4" />,
      headerColor: "bg-purple-600",
      members: getDepartmentMembers('doj', ['justice', 'doj', 'court', 'legal']),
      ranks: ['Chief Justice', 'Senior Judge', 'Judge', 'Attorney General', 'Asst. District Attorney', 'Public Defender'],
    },
    {
      department: "Weazel News",
      shortName: "Weazel",
      icon: <Tv className="w-4 h-4" />,
      headerColor: "bg-pink-600",
      members: getDepartmentMembers('weazel', ['weazel', 'news', 'media']),
      ranks: ['News Director', 'Lead Anchor', 'Senior Reporter', 'Field Reporter', 'Cameraman', 'Intern Reporter'],
    },
    {
      department: "Premium Deluxe Motorsport",
      shortName: "PDM",
      icon: <Car className="w-4 h-4" />,
      headerColor: "bg-cyan-600",
      members: getDepartmentMembers('pdm', ['pdm', 'motorsport', 'dealership', 'deluxe']),
      ranks: ['General Manager', 'Sales Manager', 'Senior Sales', 'Sales Associate', 'Sales Trainee'],
    },
    {
      department: "Server Staff",
      shortName: "Staff",
      icon: <Shield className="w-4 h-4" />,
      headerColor: "bg-violet-600",
      members: staffMembers.filter(s => 
        s.department?.toLowerCase().includes('staff') || 
        s.department?.toLowerCase().includes('admin') ||
        s.department?.toLowerCase().includes('management') ||
        !s.department
      ).map(s => ({
        id: s.id,
        name: s.name,
        rank: s.role,
        badge_number: s.discord_id?.slice(-4) || '-',
        status: 'active' as const,
        division: s.department || 'Staff',
        discord_avatar: s.discord_avatar
      })),
      ranks: ['Owner', 'Co-Owner', 'Head Admin', 'Admin', 'Senior Moderator', 'Moderator', 'Trial Mod'],
    }
  ];

  const getRankOrder = (rank: string, ranks?: string[]): number => {
    if (!ranks) return 999;
    const index = ranks.findIndex(r => rank.toLowerCase() === r.toLowerCase());
    if (index !== -1) return index;
    const partialIndex = ranks.findIndex(r => rank.toLowerCase().includes(r.toLowerCase()));
    return partialIndex === -1 ? 999 : partialIndex;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader 
        title="Department Rosters"
        description="View all department members and their ranks"
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
              <TabsList className="inline-flex w-auto gap-1 p-1 bg-muted/50 rounded-lg">
                {departments.map((dept) => (
                  <TabsTrigger 
                    key={dept.department}
                    value={dept.department.toLowerCase().replace(/\s+/g, '-')}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {dept.icon}
                    <span className="hidden sm:inline">{dept.shortName}</span>
                    <span className="text-xs opacity-70">({dept.members.length})</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {departments.map((dept) => {
              const sortedMembers = [...dept.members].sort((a, b) => 
                getRankOrder(a.rank, dept.ranks) - getRankOrder(b.rank, dept.ranks)
              );

              // Group members by rank
              const membersByRank: Record<string, RosterMember[]> = {};
              sortedMembers.forEach(member => {
                const matchedRank = dept.ranks?.find(r => 
                  member.rank.toLowerCase() === r.toLowerCase() ||
                  member.rank.toLowerCase().includes(r.toLowerCase())
                ) || member.rank;
                
                if (!membersByRank[matchedRank]) {
                  membersByRank[matchedRank] = [];
                }
                membersByRank[matchedRank].push(member);
              });

              return (
                <TabsContent 
                  key={dept.department}
                  value={dept.department.toLowerCase().replace(/\s+/g, '-')}
                  className="space-y-0"
                >
                  {/* Department Title */}
                  <div className={`${dept.headerColor} text-white text-center py-3 text-xl font-bold border-2 border-black`}>
                    {dept.department}
                  </div>

                  {/* Table Header */}
                  <div className="grid grid-cols-5 bg-muted border-x-2 border-black text-sm font-bold">
                    <div className="py-2 px-3 border-r border-black text-center">Rank</div>
                    <div className="py-2 px-3 border-r border-black text-center">Name</div>
                    <div className="py-2 px-3 border-r border-black text-center">Badge Number</div>
                    <div className="py-2 px-3 border-r border-black text-center">Status</div>
                    <div className="py-2 px-3 text-center">Division</div>
                  </div>

                  {/* Members by Rank */}
                  {sortedMembers.length > 0 ? (
                    <div className="border-2 border-t-0 border-black">
                      {dept.ranks?.map((rankName, rankIndex) => {
                        const membersInRank = membersByRank[rankName];
                        if (!membersInRank || membersInRank.length === 0) return null;

                        return (
                          <div key={rankName}>
                            {/* Rank separator line */}
                            {rankIndex > 0 && (
                              <div className="h-1 bg-black" />
                            )}
                            
                            {/* Members in this rank */}
                            {membersInRank.map((member, idx) => (
                              <div 
                                key={member.id}
                                className={`grid grid-cols-5 text-sm ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'} border-b border-border last:border-b-0`}
                              >
                                <div className="py-2 px-3 border-r border-border text-center font-medium">
                                  {member.rank}
                                </div>
                                <div className="py-2 px-3 border-r border-border text-center">
                                  {member.name || '-'}
                                </div>
                                <div className="py-2 px-3 border-r border-border text-center font-mono">
                                  {member.badge_number || '-'}
                                </div>
                                <div className="py-2 px-3 border-r border-border text-center">
                                  <span className={`inline-block px-3 py-0.5 rounded text-xs font-medium ${getStatusColor(member.status)}`}>
                                    {getStatusText(member.status)}
                                  </span>
                                </div>
                                <div className="py-2 px-3 text-center">
                                  <span className={`inline-block px-3 py-0.5 rounded text-xs font-medium text-white ${getDivisionColor(member.division || '')}`}>
                                    {member.division || '-'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}

                      {/* Unmatched ranks */}
                      {Object.entries(membersByRank)
                        .filter(([rank]) => !dept.ranks?.includes(rank))
                        .map(([rank, members]) => (
                          <div key={rank}>
                            <div className="h-1 bg-black" />
                            {members.map((member, idx) => (
                              <div 
                                key={member.id}
                                className={`grid grid-cols-5 text-sm ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'} border-b border-border last:border-b-0`}
                              >
                                <div className="py-2 px-3 border-r border-border text-center font-medium">
                                  {member.rank}
                                </div>
                                <div className="py-2 px-3 border-r border-border text-center">
                                  {member.name || '-'}
                                </div>
                                <div className="py-2 px-3 border-r border-border text-center font-mono">
                                  {member.badge_number || '-'}
                                </div>
                                <div className="py-2 px-3 border-r border-border text-center">
                                  <span className={`inline-block px-3 py-0.5 rounded text-xs font-medium ${getStatusColor(member.status)}`}>
                                    {getStatusText(member.status)}
                                  </span>
                                </div>
                                <div className="py-2 px-3 text-center">
                                  <span className={`inline-block px-3 py-0.5 rounded text-xs font-medium text-white ${getDivisionColor(member.division || '')}`}>
                                    {member.division || '-'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="border-2 border-t-0 border-black py-12 text-center">
                      <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No members in this department yet</p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-center gap-6 py-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{dept.members.length} Total Members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span>{dept.members.filter(m => m.status === 'active').length} Active</span>
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
