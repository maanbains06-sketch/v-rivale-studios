import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
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
import { motion } from "framer-motion";
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
  icon: React.ReactNode;
  color: string;
  members: RosterMember[];
  ranks?: string[];
}

// Example roster data for departments that might not have staff_members entries
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

  // Get staff members for a department or use example data
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

    // If no staff data, use example data
    if (staffData.length === 0 && exampleRosterData[departmentKey]) {
      return exampleRosterData[departmentKey];
    }

    return staffData;
  };

  const departments: DepartmentRoster[] = [
    {
      department: "Police Department",
      icon: <Siren className="w-5 h-5" />,
      color: "blue",
      members: getDepartmentMembers('police', ['police', 'pd', 'lspd']),
      ranks: ['Chief of Police', 'Captain', 'Lieutenant', 'Sergeant', 'Senior Officer', 'Officer', 'Cadet']
    },
    {
      department: "EMS Department",
      icon: <Ambulance className="w-5 h-5" />,
      color: "red",
      members: getDepartmentMembers('ems', ['ems', 'medical', 'hospital']),
      ranks: ['EMS Director', 'Chief Physician', 'Senior Paramedic', 'Paramedic', 'EMT', 'EMT Trainee']
    },
    {
      department: "Fire Department",
      icon: <Flame className="w-5 h-5" />,
      color: "orange",
      members: getDepartmentMembers('fire', ['fire', 'fd', 'lsfd']),
      ranks: ['Fire Chief', 'Captain', 'Lieutenant', 'Senior Firefighter', 'Firefighter', 'Probationary']
    },
    {
      department: "Mechanic Shop",
      icon: <Wrench className="w-5 h-5" />,
      color: "amber",
      members: getDepartmentMembers('mechanic', ['mechanic', 'garage', 'repair']),
      ranks: ['Head Mechanic', 'Senior Mechanic', 'Mechanic', 'Junior Mechanic', 'Apprentice']
    },
    {
      department: "Department of Justice",
      icon: <Gavel className="w-5 h-5" />,
      color: "indigo",
      members: getDepartmentMembers('doj', ['justice', 'doj', 'court', 'legal']),
      ranks: ['Chief Justice', 'Senior Judge', 'Judge', 'Attorney General', 'District Attorney', 'Public Defender']
    },
    {
      department: "Weazel News",
      icon: <Tv className="w-5 h-5" />,
      color: "pink",
      members: getDepartmentMembers('weazel', ['weazel', 'news', 'media']),
      ranks: ['News Director', 'Lead Anchor', 'Senior Reporter', 'Field Reporter', 'Cameraman', 'Intern']
    },
    {
      department: "Premium Deluxe Motorsport",
      icon: <Car className="w-5 h-5" />,
      color: "cyan",
      members: getDepartmentMembers('pdm', ['pdm', 'motorsport', 'dealership', 'deluxe']),
      ranks: ['General Manager', 'Sales Manager', 'Senior Sales', 'Sales Associate', 'Sales Trainee']
    },
    {
      department: "Server Staff",
      icon: <Shield className="w-5 h-5" />,
      color: "purple",
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
      ranks: ['Owner', 'Co-Owner', 'Head Admin', 'Admin', 'Senior Moderator', 'Moderator', 'Trial Mod']
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; border: string; text: string; header: string; row: string }> = {
      blue: { 
        bg: 'bg-blue-500/10', 
        border: 'border-blue-500/30', 
        text: 'text-blue-400',
        header: 'bg-gradient-to-r from-blue-600 to-blue-700',
        row: 'hover:bg-blue-500/10'
      },
      red: { 
        bg: 'bg-red-500/10', 
        border: 'border-red-500/30', 
        text: 'text-red-400',
        header: 'bg-gradient-to-r from-red-600 to-red-700',
        row: 'hover:bg-red-500/10'
      },
      orange: { 
        bg: 'bg-orange-500/10', 
        border: 'border-orange-500/30', 
        text: 'text-orange-400',
        header: 'bg-gradient-to-r from-orange-600 to-orange-700',
        row: 'hover:bg-orange-500/10'
      },
      amber: { 
        bg: 'bg-amber-500/10', 
        border: 'border-amber-500/30', 
        text: 'text-amber-400',
        header: 'bg-gradient-to-r from-amber-600 to-amber-700',
        row: 'hover:bg-amber-500/10'
      },
      indigo: { 
        bg: 'bg-indigo-500/10', 
        border: 'border-indigo-500/30', 
        text: 'text-indigo-400',
        header: 'bg-gradient-to-r from-indigo-600 to-indigo-700',
        row: 'hover:bg-indigo-500/10'
      },
      pink: { 
        bg: 'bg-pink-500/10', 
        border: 'border-pink-500/30', 
        text: 'text-pink-400',
        header: 'bg-gradient-to-r from-pink-600 to-pink-700',
        row: 'hover:bg-pink-500/10'
      },
      cyan: { 
        bg: 'bg-cyan-500/10', 
        border: 'border-cyan-500/30', 
        text: 'text-cyan-400',
        header: 'bg-gradient-to-r from-cyan-600 to-cyan-700',
        row: 'hover:bg-cyan-500/10'
      },
      purple: { 
        bg: 'bg-purple-500/10', 
        border: 'border-purple-500/30', 
        text: 'text-purple-400',
        header: 'bg-gradient-to-r from-purple-600 to-purple-700',
        row: 'hover:bg-purple-500/10'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Inactive</Badge>;
      case 'on_leave':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">On Leave</Badge>;
      default:
        return null;
    }
  };

  // Get rank order for sorting
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
        description="View all department members, ranks, and current status"
        badge="Official Rosters"
        backgroundImage={headerJobsBg}
      />

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="police-department" className="space-y-6">
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-auto gap-1 p-1 mb-4 bg-muted/30">
                {departments.map((dept) => {
                  const colors = getColorClasses(dept.color);
                  return (
                    <TabsTrigger 
                      key={dept.department}
                      value={dept.department.toLowerCase().replace(/\s+/g, '-')}
                      className={`flex items-center gap-2 data-[state=active]:${colors.bg} data-[state=active]:${colors.text}`}
                    >
                      {dept.icon}
                      <span className="hidden sm:inline">{dept.department.split(' ')[0]}</span>
                      <Badge variant="secondary" className="ml-1 text-xs">{dept.members.length}</Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {departments.map((dept) => {
              const colors = getColorClasses(dept.color);
              const sortedMembers = [...dept.members].sort((a, b) => 
                getRankOrder(a.rank, dept.ranks) - getRankOrder(b.rank, dept.ranks)
              );

              return (
                <TabsContent 
                  key={dept.department}
                  value={dept.department.toLowerCase().replace(/\s+/g, '-')}
                  className="space-y-4"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={`glass-effect ${colors.border} border-2 overflow-hidden`}>
                      {/* Department Header */}
                      <div className={`${colors.header} text-white px-6 py-5`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                              {dept.icon}
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold">{dept.department}</h2>
                              <p className="text-white/70 text-sm">Official Department Roster</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span className="text-2xl font-bold">{dept.members.length}</span>
                              </div>
                              <p className="text-white/70 text-xs">Active Members</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-0">
                        {sortedMembers.length > 0 ? (
                          <div className="space-y-0">
                            {/* Group members by rank */}
                            {dept.ranks?.map((rankName, rankIndex) => {
                              const membersInRank = sortedMembers.filter(m => 
                                m.rank.toLowerCase().includes(rankName.toLowerCase()) ||
                                rankName.toLowerCase().includes(m.rank.toLowerCase())
                              );
                              
                              if (membersInRank.length === 0) return null;
                              
                              return (
                                <div key={rankName} className="border-b border-border/20 last:border-b-0">
                                  {/* Rank Section Header */}
                                  <div className={`${colors.bg} px-6 py-3 flex items-center justify-between border-b border-border/20`}>
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
                                      <h3 className={`font-bold uppercase tracking-wider text-sm ${colors.text}`}>
                                        {rankName}
                                      </h3>
                                    </div>
                                    <Badge variant="outline" className={`${colors.border} ${colors.text} text-xs`}>
                                      {membersInRank.length} {membersInRank.length === 1 ? 'Member' : 'Members'}
                                    </Badge>
                                  </div>
                                  
                                  {/* Members Table for this Rank */}
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead className="sr-only">
                                        <tr>
                                          <th>Name</th>
                                          {dept.department === "Police Department" && <th>Badge #</th>}
                                          {(dept.department === "Police Department" || dept.department === "Fire Department") && <th>Division</th>}
                                          <th>Status</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-border/10">
                                        {membersInRank.map((member, index) => (
                                          <motion.tr 
                                            key={member.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: (rankIndex * 0.1) + (index * 0.03) }}
                                            className={`${colors.row} transition-colors`}
                                          >
                                            <td className="px-6 py-3">
                                              <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border-2 border-border/30">
                                                  <AvatarImage src={member.discord_avatar} />
                                                  <AvatarFallback className={`${colors.bg} ${colors.text} font-bold`}>
                                                    {member.name.charAt(0)}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                  <span className="font-medium block">{member.name}</span>
                                                  {member.call_sign && (
                                                    <span className="text-xs text-muted-foreground">{member.call_sign}</span>
                                                  )}
                                                </div>
                                              </div>
                                            </td>
                                            {dept.department === "Police Department" && (
                                              <td className="px-6 py-3 text-muted-foreground font-mono text-sm">
                                                {member.badge_number ? `#${member.badge_number}` : '-'}
                                              </td>
                                            )}
                                            {(dept.department === "Police Department" || dept.department === "Fire Department") && (
                                              <td className="px-6 py-3">
                                                {member.division && (
                                                  <Badge className={`${colors.bg} ${colors.text} ${colors.border} text-xs`}>
                                                    {member.division}
                                                  </Badge>
                                                )}
                                              </td>
                                            )}
                                            <td className="px-6 py-3">{getStatusBadge(member.status)}</td>
                                          </motion.tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {/* Catch any members that don't match defined ranks */}
                            {(() => {
                              const unmatchedMembers = sortedMembers.filter(m => 
                                !dept.ranks?.some(rankName => 
                                  m.rank.toLowerCase().includes(rankName.toLowerCase()) ||
                                  rankName.toLowerCase().includes(m.rank.toLowerCase())
                                )
                              );
                              
                              if (unmatchedMembers.length === 0) return null;
                              
                              return (
                                <div className="border-t border-border/20">
                                  <div className={`${colors.bg} px-6 py-3 flex items-center justify-between border-b border-border/20`}>
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
                                      <h3 className={`font-bold uppercase tracking-wider text-sm ${colors.text}`}>
                                        Other Positions
                                      </h3>
                                    </div>
                                    <Badge variant="outline" className={`${colors.border} ${colors.text} text-xs`}>
                                      {unmatchedMembers.length} {unmatchedMembers.length === 1 ? 'Member' : 'Members'}
                                    </Badge>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead className="sr-only">
                                        <tr>
                                          <th>Rank</th>
                                          <th>Name</th>
                                          <th>Status</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-border/10">
                                        {unmatchedMembers.map((member, index) => (
                                          <motion.tr 
                                            key={member.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className={`${colors.row} transition-colors`}
                                          >
                                            <td className={`px-6 py-3 font-semibold ${colors.text} text-sm`}>
                                              {member.rank}
                                            </td>
                                            <td className="px-6 py-3">
                                              <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border-2 border-border/30">
                                                  <AvatarImage src={member.discord_avatar} />
                                                  <AvatarFallback className={`${colors.bg} ${colors.text} font-bold`}>
                                                    {member.name.charAt(0)}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{member.name}</span>
                                              </div>
                                            </td>
                                            <td className="px-6 py-3">{getStatusBadge(member.status)}</td>
                                          </motion.tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-center py-16 text-muted-foreground">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium">No members in this department yet</p>
                            <p className="text-sm mt-2">Apply for a position to join the team!</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
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
