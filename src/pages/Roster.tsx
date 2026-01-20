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
  Users,
  Star,
  Crown,
  Medal,
  Award,
  ChevronRight
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
  gradient: string;
  accentColor: string;
  members: RosterMember[];
  ranks?: string[];
  motto?: string;
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
      gradient: "from-blue-600 via-blue-700 to-indigo-800",
      accentColor: "blue-500",
      members: getDepartmentMembers('police', ['police', 'pd', 'lspd']),
      ranks: ['Chief of Police', 'Captain', 'Lieutenant', 'Sergeant', 'Senior Officer', 'Officer', 'Cadet'],
      motto: "To Protect and Serve"
    },
    {
      department: "EMS Department",
      icon: <Ambulance className="w-5 h-5" />,
      color: "red",
      gradient: "from-red-600 via-rose-600 to-pink-700",
      accentColor: "red-500",
      members: getDepartmentMembers('ems', ['ems', 'medical', 'hospital']),
      ranks: ['EMS Director', 'Chief Physician', 'Senior Paramedic', 'Paramedic', 'EMT', 'EMT Trainee'],
      motto: "Saving Lives, One Call at a Time"
    },
    {
      department: "Fire Department",
      icon: <Flame className="w-5 h-5" />,
      color: "orange",
      gradient: "from-orange-500 via-red-600 to-amber-600",
      accentColor: "orange-500",
      members: getDepartmentMembers('fire', ['fire', 'fd', 'lsfd']),
      ranks: ['Fire Chief', 'Captain', 'Lieutenant', 'Senior Firefighter', 'Firefighter', 'Probationary'],
      motto: "Courage Under Fire"
    },
    {
      department: "Mechanic Shop",
      icon: <Wrench className="w-5 h-5" />,
      color: "amber",
      gradient: "from-amber-500 via-yellow-600 to-orange-600",
      accentColor: "amber-500",
      members: getDepartmentMembers('mechanic', ['mechanic', 'garage', 'repair']),
      ranks: ['Head Mechanic', 'Senior Mechanic', 'Mechanic', 'Junior Mechanic', 'Apprentice'],
      motto: "Keeping You on the Road"
    },
    {
      department: "Department of Justice",
      icon: <Gavel className="w-5 h-5" />,
      color: "indigo",
      gradient: "from-indigo-600 via-purple-700 to-violet-800",
      accentColor: "indigo-500",
      members: getDepartmentMembers('doj', ['justice', 'doj', 'court', 'legal']),
      ranks: ['Chief Justice', 'Senior Judge', 'Judge', 'Attorney General', 'District Attorney', 'Public Defender'],
      motto: "Justice for All"
    },
    {
      department: "Weazel News",
      icon: <Tv className="w-5 h-5" />,
      color: "pink",
      gradient: "from-pink-500 via-fuchsia-600 to-purple-600",
      accentColor: "pink-500",
      members: getDepartmentMembers('weazel', ['weazel', 'news', 'media']),
      ranks: ['News Director', 'Lead Anchor', 'Senior Reporter', 'Field Reporter', 'Cameraman', 'Intern'],
      motto: "Your Source for Truth"
    },
    {
      department: "Premium Deluxe Motorsport",
      icon: <Car className="w-5 h-5" />,
      color: "cyan",
      gradient: "from-cyan-500 via-teal-600 to-emerald-600",
      accentColor: "cyan-500",
      members: getDepartmentMembers('pdm', ['pdm', 'motorsport', 'dealership', 'deluxe']),
      ranks: ['General Manager', 'Sales Manager', 'Senior Sales', 'Sales Associate', 'Sales Trainee'],
      motto: "Drive Your Dreams"
    },
    {
      department: "Server Staff",
      icon: <Shield className="w-5 h-5" />,
      color: "purple",
      gradient: "from-purple-600 via-violet-700 to-fuchsia-700",
      accentColor: "purple-500",
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
      motto: "Building Community Together"
    }
  ];

  const getRankIcon = (rank: string, index: number) => {
    if (index === 0) return <Crown className="w-4 h-4 text-yellow-400" />;
    if (index === 1) return <Star className="w-4 h-4 text-gray-300" />;
    if (index === 2) return <Medal className="w-4 h-4 text-amber-600" />;
    return <Award className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string, accentColor: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/40 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse mr-1.5" />
            Active
          </Badge>
        );
      case 'inactive':
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/40">
            Inactive
          </Badge>
        );
      case 'on_leave':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40">
            On Leave
          </Badge>
        );
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
          <Tabs defaultValue="police-department" className="space-y-8">
            <ScrollArea className="w-full pb-4">
              <TabsList className="inline-flex w-auto gap-2 p-2 mb-4 bg-muted/20 backdrop-blur-sm border border-border/50 rounded-xl">
                {departments.map((dept) => (
                  <TabsTrigger 
                    key={dept.department}
                    value={dept.department.toLowerCase().replace(/\s+/g, '-')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 
                      data-[state=active]:bg-gradient-to-r data-[state=active]:${dept.gradient} 
                      data-[state=active]:text-white data-[state=active]:shadow-lg
                      hover:bg-muted/50`}
                  >
                    <span className="p-1 rounded-md bg-background/20">{dept.icon}</span>
                    <span className="hidden sm:inline font-medium">{dept.department.split(' ')[0]}</span>
                    <Badge variant="secondary" className="ml-1 text-xs bg-background/30 border-0">
                      {dept.members.length}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {departments.map((dept) => {
              const sortedMembers = [...dept.members].sort((a, b) => 
                getRankOrder(a.rank, dept.ranks) - getRankOrder(b.rank, dept.ranks)
              );

              return (
                <TabsContent 
                  key={dept.department}
                  value={dept.department.toLowerCase().replace(/\s+/g, '-')}
                  className="space-y-6"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Department Header Card */}
                    <Card className="overflow-hidden border-0 shadow-2xl mb-8">
                      <div className={`relative bg-gradient-to-r ${dept.gradient} p-8`}>
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute inset-0" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                          }} />
                        </div>
                        
                        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                              <div className="text-white scale-150">{dept.icon}</div>
                            </div>
                            <div>
                              <h2 className="text-3xl font-bold text-white drop-shadow-lg">{dept.department}</h2>
                              <p className="text-white/80 text-sm mt-1 italic">"{dept.motto}"</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3">
                              <div className="flex items-center gap-2 justify-center">
                                <Users className="w-5 h-5 text-white/80" />
                                <span className="text-3xl font-bold text-white">{dept.members.length}</span>
                              </div>
                              <p className="text-white/70 text-xs uppercase tracking-wider mt-1">Total Members</p>
                            </div>
                            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3">
                              <div className="flex items-center gap-2 justify-center">
                                <Star className="w-5 h-5 text-white/80" />
                                <span className="text-3xl font-bold text-white">
                                  {dept.members.filter(m => m.status === 'active').length}
                                </span>
                              </div>
                              <p className="text-white/70 text-xs uppercase tracking-wider mt-1">Active</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Rank Sections */}
                    {sortedMembers.length > 0 ? (
                      <div className="grid gap-6">
                        {dept.ranks?.map((rankName, rankIndex) => {
                          const membersInRank = sortedMembers.filter(m => 
                            m.rank.toLowerCase().includes(rankName.toLowerCase()) ||
                            rankName.toLowerCase().includes(m.rank.toLowerCase())
                          );
                          
                          if (membersInRank.length === 0) return null;
                          
                          return (
                            <motion.div 
                              key={rankName}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: rankIndex * 0.1 }}
                            >
                              <Card className={`overflow-hidden border-l-4 border-l-${dept.accentColor} bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300`}>
                                {/* Rank Header */}
                                <div className={`px-6 py-4 bg-gradient-to-r from-${dept.color}-500/10 to-transparent border-b border-border/50`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {getRankIcon(rankName, rankIndex)}
                                      <h3 className="font-bold text-lg uppercase tracking-wider">
                                        {rankName}
                                      </h3>
                                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className={`border-${dept.accentColor}/50 text-${dept.color}-400`}
                                    >
                                      {membersInRank.length} {membersInRank.length === 1 ? 'Member' : 'Members'}
                                    </Badge>
                                  </div>
                                </div>
                                
                                {/* Members Grid */}
                                <CardContent className="p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {membersInRank.map((member, index) => (
                                      <motion.div 
                                        key={member.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: (rankIndex * 0.1) + (index * 0.05) }}
                                        className={`group relative p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 
                                          border border-border/50 hover:border-${dept.accentColor}/50 
                                          hover:shadow-lg hover:shadow-${dept.color}-500/10 transition-all duration-300`}
                                      >
                                        <div className="flex items-center gap-4">
                                          <div className="relative">
                                            <Avatar className={`h-14 w-14 border-2 border-${dept.accentColor}/30 ring-2 ring-offset-2 ring-offset-background ring-${dept.color}-500/20`}>
                                              <AvatarImage src={member.discord_avatar} />
                                              <AvatarFallback className={`bg-gradient-to-br from-${dept.color}-500/20 to-${dept.color}-600/20 text-${dept.color}-400 font-bold text-lg`}>
                                                {member.name.charAt(0)}
                                              </AvatarFallback>
                                            </Avatar>
                                            {member.status === 'active' && (
                                              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                                            )}
                                          </div>
                                          
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                              {member.name}
                                            </h4>
                                            {member.call_sign && (
                                              <p className="text-xs text-muted-foreground font-mono">
                                                {member.call_sign}
                                              </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                              {member.badge_number && (
                                                <Badge variant="outline" className="text-xs font-mono">
                                                  #{member.badge_number}
                                                </Badge>
                                              )}
                                              {member.division && (
                                                <Badge variant="secondary" className="text-xs">
                                                  {member.division}
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                          
                                          <div className="flex-shrink-0">
                                            {getStatusBadge(member.status, dept.accentColor)}
                                          </div>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
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
                            <motion.div 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 }}
                            >
                              <Card className="overflow-hidden border-l-4 border-l-gray-500 bg-card/50 backdrop-blur-sm">
                                <div className="px-6 py-4 bg-gradient-to-r from-gray-500/10 to-transparent border-b border-border/50">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Award className="w-4 h-4 text-gray-400" />
                                      <h3 className="font-bold text-lg uppercase tracking-wider">
                                        Other Positions
                                      </h3>
                                    </div>
                                    <Badge variant="outline" className="border-gray-500/50 text-gray-400">
                                      {unmatchedMembers.length} {unmatchedMembers.length === 1 ? 'Member' : 'Members'}
                                    </Badge>
                                  </div>
                                </div>
                                <CardContent className="p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {unmatchedMembers.map((member, index) => (
                                      <motion.div 
                                        key={member.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group relative p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50 hover:border-gray-500/50 hover:shadow-lg transition-all duration-300"
                                      >
                                        <div className="flex items-center gap-4">
                                          <Avatar className="h-14 w-14 border-2 border-gray-500/30">
                                            <AvatarImage src={member.discord_avatar} />
                                            <AvatarFallback className="bg-gradient-to-br from-gray-500/20 to-gray-600/20 text-gray-400 font-bold text-lg">
                                              {member.name.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-foreground truncate">
                                              {member.name}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                              {member.rank}
                                            </p>
                                          </div>
                                          
                                          <div className="flex-shrink-0">
                                            {getStatusBadge(member.status, 'gray-500')}
                                          </div>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })()}
                      </div>
                    ) : (
                      <Card className="border-dashed border-2">
                        <CardContent className="text-center py-16 text-muted-foreground">
                          <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-${dept.color}-500/20 to-${dept.color}-600/10 flex items-center justify-center`}>
                            <Users className="w-10 h-10 opacity-50" />
                          </div>
                          <p className="text-xl font-medium mb-2">No members in this department yet</p>
                          <p className="text-sm text-muted-foreground">Apply for a position to join the team!</p>
                        </CardContent>
                      </Card>
                    )}
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