import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
}

interface DepartmentRoster {
  department: string;
  shortName: string;
  icon: React.ReactNode;
  members: RosterMember[];
  ranks?: string[];
}

const exampleRosterData: Record<string, RosterMember[]> = {
  police: [
    { id: 'ex1', name: 'Chief Williams', rank: 'Chief of Police', badge_number: '001', status: 'active', division: 'Command', call_sign: 'ALPHA-1' },
    { id: 'ex2', name: 'Captain Rodriguez', rank: 'Captain', badge_number: '015', status: 'active', division: 'Patrol', call_sign: 'BRAVO-2' },
    { id: 'ex3', name: 'Lieutenant Chen', rank: 'Lieutenant', badge_number: '032', status: 'active', division: 'Investigations', call_sign: 'DELTA-1' },
    { id: 'ex4', name: 'Sergeant Mitchell', rank: 'Sergeant', badge_number: '045', status: 'active', division: 'Patrol', call_sign: 'ECHO-3' },
    { id: 'ex5', name: 'Officer Johnson', rank: 'Senior Officer', badge_number: '067', status: 'active', division: 'Patrol' },
    { id: 'ex6', name: 'Officer Davis', rank: 'Officer', badge_number: '089', status: 'on_leave', division: 'Traffic' },
    { id: 'ex7', name: 'Officer Martinez', rank: 'Officer', badge_number: '102', status: 'active', division: 'K9 Unit' },
    { id: 'ex8', name: 'Cadet Thompson', rank: 'Cadet', badge_number: '201', status: 'active', division: 'Training' },
  ],
  ems: [
    { id: 'ems1', name: 'Director Sarah Hayes', rank: 'EMS Director', status: 'active', call_sign: 'MED-1' },
    { id: 'ems2', name: 'Dr. Michael Foster', rank: 'Chief Physician', status: 'active', call_sign: 'DOC-1' },
    { id: 'ems3', name: 'Paramedic Lisa Wong', rank: 'Senior Paramedic', status: 'active', call_sign: 'PARA-5' },
    { id: 'ems4', name: 'Paramedic John Blake', rank: 'Paramedic', status: 'active' },
    { id: 'ems5', name: 'EMT Rachel Green', rank: 'EMT', status: 'active' },
    { id: 'ems6', name: 'EMT David Kim', rank: 'EMT Trainee', status: 'on_leave' },
  ],
  fire: [
    { id: 'fire1', name: 'Chief Marcus Brown', rank: 'Fire Chief', status: 'active', call_sign: 'FIRE-1' },
    { id: 'fire2', name: 'Captain James Walker', rank: 'Captain', status: 'active', division: 'Engine 1' },
    { id: 'fire3', name: 'Lieutenant Anna Torres', rank: 'Lieutenant', status: 'active', division: 'Ladder 1' },
    { id: 'fire4', name: 'Firefighter Mike Stone', rank: 'Senior Firefighter', status: 'active', division: 'Engine 2' },
    { id: 'fire5', name: 'Firefighter Emily Ross', rank: 'Firefighter', status: 'active', division: 'Engine 1' },
    { id: 'fire6', name: 'Probationary FF Jake Hill', rank: 'Probationary', status: 'active', division: 'Training' },
  ],
  mechanic: [
    { id: 'mech1', name: 'Tony Rizzo', rank: 'Head Mechanic', status: 'active' },
    { id: 'mech2', name: 'Carlos Mendez', rank: 'Senior Mechanic', status: 'active' },
    { id: 'mech3', name: 'Nina Patel', rank: 'Mechanic', status: 'active' },
    { id: 'mech4', name: 'Chris O\'Brien', rank: 'Junior Mechanic', status: 'active' },
    { id: 'mech5', name: 'Alex Turner', rank: 'Apprentice', status: 'on_leave' },
  ],
  doj: [
    { id: 'doj1', name: 'Hon. Judge Robert Clarke', rank: 'Chief Justice', status: 'active' },
    { id: 'doj2', name: 'Hon. Judge Maria Santos', rank: 'Senior Judge', status: 'active' },
    { id: 'doj3', name: 'Attorney General Smith', rank: 'Attorney General', status: 'active' },
    { id: 'doj4', name: 'ADA Jennifer White', rank: 'Asst. District Attorney', status: 'active' },
    { id: 'doj5', name: 'Public Defender Mark Lee', rank: 'Public Defender', status: 'active' },
  ],
  weazel: [
    { id: 'wz1', name: 'Victoria Sterling', rank: 'News Director', status: 'active' },
    { id: 'wz2', name: 'Ryan Cooper', rank: 'Lead Anchor', status: 'active' },
    { id: 'wz3', name: 'Jessica Lane', rank: 'Field Reporter', status: 'active' },
    { id: 'wz4', name: 'Tommy Vance', rank: 'Cameraman', status: 'active' },
    { id: 'wz5', name: 'Sophie Chen', rank: 'Intern Reporter', status: 'on_leave' },
  ],
  pdm: [
    { id: 'pdm1', name: 'Vincent Romano', rank: 'General Manager', status: 'active' },
    { id: 'pdm2', name: 'Ashley Brooks', rank: 'Sales Manager', status: 'active' },
    { id: 'pdm3', name: 'Derek Miles', rank: 'Senior Sales', status: 'active' },
    { id: 'pdm4', name: 'Natalie Reed', rank: 'Sales Associate', status: 'active' },
    { id: 'pdm5', name: 'Kevin Hart', rank: 'Sales Trainee', status: 'active' },
  ],
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
      members: getDepartmentMembers('police', ['police', 'pd', 'lspd']),
      ranks: ['Chief of Police', 'Captain', 'Lieutenant', 'Sergeant', 'Senior Officer', 'Officer', 'Cadet'],
    },
    {
      department: "EMS Department",
      shortName: "EMS",
      icon: <Ambulance className="w-4 h-4" />,
      members: getDepartmentMembers('ems', ['ems', 'medical', 'hospital']),
      ranks: ['EMS Director', 'Chief Physician', 'Senior Paramedic', 'Paramedic', 'EMT', 'EMT Trainee'],
    },
    {
      department: "Fire Department",
      shortName: "Fire",
      icon: <Flame className="w-4 h-4" />,
      members: getDepartmentMembers('fire', ['fire', 'fd', 'lsfd']),
      ranks: ['Fire Chief', 'Captain', 'Lieutenant', 'Senior Firefighter', 'Firefighter', 'Probationary'],
    },
    {
      department: "Mechanic Shop",
      shortName: "Mechanic",
      icon: <Wrench className="w-4 h-4" />,
      members: getDepartmentMembers('mechanic', ['mechanic', 'garage', 'repair']),
      ranks: ['Head Mechanic', 'Senior Mechanic', 'Mechanic', 'Junior Mechanic', 'Apprentice'],
    },
    {
      department: "Department of Justice",
      shortName: "DOJ",
      icon: <Gavel className="w-4 h-4" />,
      members: getDepartmentMembers('doj', ['justice', 'doj', 'court', 'legal']),
      ranks: ['Chief Justice', 'Senior Judge', 'Judge', 'Attorney General', 'District Attorney', 'Public Defender'],
    },
    {
      department: "Weazel News",
      shortName: "Weazel",
      icon: <Tv className="w-4 h-4" />,
      members: getDepartmentMembers('weazel', ['weazel', 'news', 'media']),
      ranks: ['News Director', 'Lead Anchor', 'Senior Reporter', 'Field Reporter', 'Cameraman', 'Intern'],
    },
    {
      department: "Premium Deluxe Motorsport",
      shortName: "PDM",
      icon: <Car className="w-4 h-4" />,
      members: getDepartmentMembers('pdm', ['pdm', 'motorsport', 'dealership', 'deluxe']),
      ranks: ['General Manager', 'Sales Manager', 'Senior Sales', 'Sales Associate', 'Sales Trainee'],
    },
    {
      department: "Server Staff",
      shortName: "Staff",
      icon: <Shield className="w-4 h-4" />,
      members: staffMembers.filter(s => 
        s.department?.toLowerCase().includes('staff') || 
        s.department?.toLowerCase().includes('admin') ||
        s.department?.toLowerCase().includes('management') ||
        !s.department
      ).map(s => ({
        id: s.id,
        name: s.name,
        rank: s.role,
        status: 'active' as const,
        discord_avatar: s.discord_avatar
      })),
      ranks: ['Owner', 'Co-Owner', 'Head Admin', 'Admin', 'Senior Moderator', 'Moderator', 'Trial Mod'],
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-muted-foreground';
      case 'on_leave':
        return 'bg-amber-500';
      default:
        return 'bg-muted-foreground';
    }
  };

  const getRankOrder = (rank: string, ranks?: string[]): number => {
    if (!ranks) return 999;
    const index = ranks.findIndex(r => rank.toLowerCase().includes(r.toLowerCase()));
    return index === -1 ? 999 : index;
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
                  member.rank.toLowerCase().includes(r.toLowerCase()) ||
                  r.toLowerCase().includes(member.rank.toLowerCase())
                ) || 'Other';
                
                if (!membersByRank[matchedRank]) {
                  membersByRank[matchedRank] = [];
                }
                membersByRank[matchedRank].push(member);
              });

              return (
                <TabsContent 
                  key={dept.department}
                  value={dept.department.toLowerCase().replace(/\s+/g, '-')}
                  className="space-y-6"
                >
                  {/* Department Header */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            {dept.icon}
                          </div>
                          <CardTitle className="text-xl">{dept.department}</CardTitle>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{dept.members.length} Members</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <span>{dept.members.filter(m => m.status === 'active').length} Active</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Members by Rank */}
                  {sortedMembers.length > 0 ? (
                    <div className="space-y-4">
                      {dept.ranks?.map((rankName) => {
                        const membersInRank = membersByRank[rankName];
                        if (!membersInRank || membersInRank.length === 0) return null;

                        return (
                          <Card key={rankName}>
                            <CardHeader className="py-3 px-4 bg-muted/30">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                  {rankName}
                                </h3>
                                <Badge variant="secondary" className="text-xs">
                                  {membersInRank.length}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {membersInRank.map((member) => (
                                  <div 
                                    key={member.id}
                                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                  >
                                    <div className="relative">
                                      <Avatar className="h-10 w-10">
                                        <AvatarImage src={member.discord_avatar} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                          {member.name.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span 
                                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{member.name}</p>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {member.call_sign && (
                                          <span className="font-mono">{member.call_sign}</span>
                                        )}
                                        {member.badge_number && (
                                          <span>#{member.badge_number}</span>
                                        )}
                                        {member.division && !member.call_sign && !member.badge_number && (
                                          <span>{member.division}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}

                      {/* Other positions not matching defined ranks */}
                      {membersByRank['Other'] && membersByRank['Other'].length > 0 && (
                        <Card>
                          <CardHeader className="py-3 px-4 bg-muted/30">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                Other Positions
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                {membersByRank['Other'].length}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {membersByRank['Other'].map((member) => (
                                <div 
                                  key={member.id}
                                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                >
                                  <div className="relative">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={member.discord_avatar} />
                                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                        {member.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span 
                                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{member.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{member.rank}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No members in this department yet</p>
                      </CardContent>
                    </Card>
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
