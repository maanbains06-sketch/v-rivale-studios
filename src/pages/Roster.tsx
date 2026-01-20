import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Loader2
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
}

interface DepartmentRoster {
  department: string;
  icon: React.ReactNode;
  color: string;
  members: RosterMember[];
}

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

  // Mock roster data structure - in real app, this would come from database
  const departments: DepartmentRoster[] = [
    {
      department: "Police Department",
      icon: <Siren className="w-5 h-5" />,
      color: "blue",
      members: staffMembers.filter(s => s.department?.toLowerCase().includes('police')).map(s => ({
        id: s.id,
        name: s.name,
        rank: s.role,
        badge_number: s.discord_id?.slice(-4),
        status: 'active' as const,
        division: 'Patrol',
        discord_avatar: s.discord_avatar
      }))
    },
    {
      department: "EMS Department",
      icon: <Ambulance className="w-5 h-5" />,
      color: "red",
      members: staffMembers.filter(s => s.department?.toLowerCase().includes('ems')).map(s => ({
        id: s.id,
        name: s.name,
        rank: s.role,
        status: 'active' as const,
        discord_avatar: s.discord_avatar
      }))
    },
    {
      department: "Fire Department",
      icon: <Flame className="w-5 h-5" />,
      color: "orange",
      members: staffMembers.filter(s => s.department?.toLowerCase().includes('fire')).map(s => ({
        id: s.id,
        name: s.name,
        rank: s.role,
        status: 'active' as const,
        discord_avatar: s.discord_avatar
      }))
    },
    {
      department: "Mechanic Shop",
      icon: <Wrench className="w-5 h-5" />,
      color: "amber",
      members: staffMembers.filter(s => s.department?.toLowerCase().includes('mechanic')).map(s => ({
        id: s.id,
        name: s.name,
        rank: s.role,
        status: 'active' as const,
        discord_avatar: s.discord_avatar
      }))
    },
    {
      department: "Department of Justice",
      icon: <Gavel className="w-5 h-5" />,
      color: "indigo",
      members: staffMembers.filter(s => s.department?.toLowerCase().includes('justice') || s.department?.toLowerCase().includes('doj')).map(s => ({
        id: s.id,
        name: s.name,
        rank: s.role,
        status: 'active' as const,
        discord_avatar: s.discord_avatar
      }))
    },
    {
      department: "Weazel News",
      icon: <Tv className="w-5 h-5" />,
      color: "pink",
      members: staffMembers.filter(s => s.department?.toLowerCase().includes('weazel') || s.department?.toLowerCase().includes('news')).map(s => ({
        id: s.id,
        name: s.name,
        rank: s.role,
        status: 'active' as const,
        discord_avatar: s.discord_avatar
      }))
    },
    {
      department: "Premium Deluxe Motorsport",
      icon: <Car className="w-5 h-5" />,
      color: "cyan",
      members: staffMembers.filter(s => s.department?.toLowerCase().includes('pdm') || s.department?.toLowerCase().includes('motorsport')).map(s => ({
        id: s.id,
        name: s.name,
        rank: s.role,
        status: 'active' as const,
        discord_avatar: s.discord_avatar
      }))
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
      }))
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; border: string; text: string; header: string }> = {
      blue: { 
        bg: 'bg-blue-500/10', 
        border: 'border-blue-500/30', 
        text: 'text-blue-400',
        header: 'bg-blue-600'
      },
      red: { 
        bg: 'bg-red-500/10', 
        border: 'border-red-500/30', 
        text: 'text-red-400',
        header: 'bg-red-600'
      },
      orange: { 
        bg: 'bg-orange-500/10', 
        border: 'border-orange-500/30', 
        text: 'text-orange-400',
        header: 'bg-orange-600'
      },
      amber: { 
        bg: 'bg-amber-500/10', 
        border: 'border-amber-500/30', 
        text: 'text-amber-400',
        header: 'bg-amber-600'
      },
      indigo: { 
        bg: 'bg-indigo-500/10', 
        border: 'border-indigo-500/30', 
        text: 'text-indigo-400',
        header: 'bg-indigo-600'
      },
      pink: { 
        bg: 'bg-pink-500/10', 
        border: 'border-pink-500/30', 
        text: 'text-pink-400',
        header: 'bg-pink-600'
      },
      cyan: { 
        bg: 'bg-cyan-500/10', 
        border: 'border-cyan-500/30', 
        text: 'text-cyan-400',
        header: 'bg-cyan-600'
      },
      purple: { 
        bg: 'bg-purple-500/10', 
        border: 'border-purple-500/30', 
        text: 'text-purple-400',
        header: 'bg-purple-600'
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader 
        title="Department Rosters"
        description="View all department members and their ranks"
        badge="Job Departments"
        backgroundImage={headerJobsBg}
      />

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="police" className="space-y-6">
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-auto gap-1 p-1 mb-4">
                {departments.map((dept) => {
                  const colors = getColorClasses(dept.color);
                  return (
                    <TabsTrigger 
                      key={dept.department}
                      value={dept.department.toLowerCase().replace(/\s+/g, '-')}
                      className={`flex items-center gap-2 data-[state=active]:${colors.text}`}
                    >
                      {dept.icon}
                      <span className="hidden sm:inline">{dept.department}</span>
                      <Badge variant="secondary" className="ml-1">{dept.members.length}</Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {departments.map((dept) => {
              const colors = getColorClasses(dept.color);
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
                    <Card className={`glass-effect ${colors.border} border-2`}>
                      {/* Department Header */}
                      <div className={`${colors.header} text-white px-6 py-4 rounded-t-lg`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {dept.icon}
                            <h2 className="text-xl font-bold">{dept.department}</h2>
                          </div>
                          <Badge variant="secondary" className="bg-white/20 text-white">
                            {dept.members.length} Members
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-0">
                        {dept.members.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className={`${colors.bg}`}>
                                <tr className="text-left text-sm">
                                  <th className={`px-6 py-3 font-semibold ${colors.text}`}>Rank</th>
                                  <th className={`px-6 py-3 font-semibold ${colors.text}`}>Officer's Name</th>
                                  {dept.department === "Police Department" && (
                                    <th className={`px-6 py-3 font-semibold ${colors.text}`}>Badge Number</th>
                                  )}
                                  <th className={`px-6 py-3 font-semibold ${colors.text}`}>Status</th>
                                  {dept.department === "Police Department" && (
                                    <th className={`px-6 py-3 font-semibold ${colors.text}`}>Division</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/30">
                                {dept.members.map((member, index) => (
                                  <tr 
                                    key={member.id} 
                                    className={`hover:${colors.bg} transition-colors`}
                                  >
                                    <td className="px-6 py-4 text-muted-foreground">{member.rank}</td>
                                    <td className="px-6 py-4 font-medium">{member.name}</td>
                                    {dept.department === "Police Department" && (
                                      <td className="px-6 py-4 text-muted-foreground font-mono">
                                        {member.badge_number ? `#${member.badge_number}` : '-'}
                                      </td>
                                    )}
                                    <td className="px-6 py-4">{getStatusBadge(member.status)}</td>
                                    {dept.department === "Police Department" && (
                                      <td className="px-6 py-4">
                                        <Badge className={`${colors.bg} ${colors.text} ${colors.border}`}>
                                          {member.division || 'Patrol'}
                                        </Badge>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-muted-foreground">
                            <p>No members in this department yet.</p>
                            <p className="text-sm mt-2">Apply for a job to join!</p>
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
