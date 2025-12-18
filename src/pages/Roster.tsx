import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerRoster from "@/assets/header-staff.jpg";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Stethoscope, Flame, Scale, Wrench, Building2, Users } from "lucide-react";
import { StaffOnlineIndicator } from "@/components/StaffOnlineIndicator";
import { useStaffOnlineStatus } from "@/hooks/useStaffOnlineStatus";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  role_type: string;
  department: string;
  discord_avatar: string | null;
  discord_id: string;
  is_active: boolean;
}

const departmentConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  police: { icon: <Shield className="h-5 w-5" />, color: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "Police Department" },
  ems: { icon: <Stethoscope className="h-5 w-5" />, color: "bg-green-500/20 text-green-400 border-green-500/30", label: "Emergency Medical Services" },
  fire: { icon: <Flame className="h-5 w-5" />, color: "bg-orange-500/20 text-orange-400 border-orange-500/30", label: "Fire Department" },
  doj: { icon: <Scale className="h-5 w-5" />, color: "bg-purple-500/20 text-purple-400 border-purple-500/30", label: "Department of Justice" },
  mechanic: { icon: <Wrench className="h-5 w-5" />, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Mechanics" },
  management: { icon: <Building2 className="h-5 w-5" />, color: "bg-red-500/20 text-red-400 border-red-500/30", label: "Server Management" },
  staff: { icon: <Users className="h-5 w-5" />, color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", label: "Staff Team" },
};

const Roster = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOnline, getStatus, getLastSeen } = useStaffOnlineStatus();

  useEffect(() => {
    const fetchStaffMembers = async () => {
      const { data, error } = await supabase
        .from("staff_members")
        .select("id, name, role, role_type, department, discord_avatar, discord_id, is_active")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching staff members:", error);
      } else {
        setStaffMembers(data || []);
      }
      setLoading(false);
    };

    fetchStaffMembers();
  }, []);

  const groupedByDepartment = staffMembers.reduce((acc, member) => {
    const dept = member.department.toLowerCase();
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(member);
    return acc;
  }, {} as Record<string, StaffMember[]>);

  const departmentOrder = ["management", "staff", "police", "ems", "fire", "doj", "mechanic"];
  const sortedDepartments = Object.keys(groupedByDepartment).sort((a, b) => {
    const aIndex = departmentOrder.indexOf(a);
    const bIndex = departmentOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const getRoleTypeBadge = (roleType: string) => {
    const variants: Record<string, string> = {
      owner: "bg-gradient-to-r from-amber-500 to-yellow-500 text-black",
      "co-owner": "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
      head_admin: "bg-red-500/20 text-red-400 border-red-500/30",
      admin: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      senior_mod: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      moderator: "bg-green-500/20 text-green-400 border-green-500/30",
      trial_mod: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    };
    return variants[roleType] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <PageHeader 
          title="Server Roster"
          description="View all department rosters and team members"
          badge="ROSTER"
          backgroundImage={headerRoster}
        />
        
        <div className="container mx-auto px-4 py-12 space-y-12">
          {loading ? (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ))}
            </div>
          ) : sortedDepartments.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Staff Members Found</h3>
              <p className="text-muted-foreground">There are currently no active staff members to display.</p>
            </div>
          ) : (
            sortedDepartments.map((department) => {
              const config = departmentConfig[department] || {
                icon: <Users className="h-5 w-5" />,
                color: "bg-muted text-muted-foreground",
                label: department.charAt(0).toUpperCase() + department.slice(1),
              };
              const members = groupedByDepartment[department];

              return (
                <section key={department} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${config.color}`}>
                      {config.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{config.label}</h2>
                      <p className="text-sm text-muted-foreground">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/50">
                          <TableHead className="w-16">Status</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Rank</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => {
                          const online = isOnline(member.id);
                          const status = getStatus(member.id);
                          const lastSeen = getLastSeen(member.id);

                          return (
                            <TableRow key={member.id} className="border-border/30 hover:bg-muted/30">
                              <TableCell>
                                <StaffOnlineIndicator 
                                  isOnline={online} 
                                  status={status}
                                  lastSeen={lastSeen}
                                  size="md"
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8 border border-border/50">
                                    <AvatarImage src={member.discord_avatar || undefined} alt={member.name} />
                                    <AvatarFallback className="bg-muted text-xs">
                                      {member.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-foreground">{member.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-muted-foreground">{member.role}</span>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={`${getRoleTypeBadge(member.role_type)} border`}
                                >
                                  {member.role_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Roster;
