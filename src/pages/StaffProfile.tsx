import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Shield, Calendar, UserCheck, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StaffMember {
  id: string;
  name: string;
  discord_avatar?: string;
  role: string;
  role_type: string;
  department: string;
  bio?: string;
  responsibilities: string[];
  is_active: boolean;
}

const roleColors = {
  owner: "bg-gradient-to-r from-primary to-secondary text-primary-foreground border-primary/20",
  admin: "bg-red-500/10 text-red-500 border-red-500/20",
  moderator: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  developer: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  staff: "bg-green-500/10 text-green-500 border-green-500/20",
  event_manager: "bg-orange-500/10 text-orange-500 border-orange-500/20"
};

const roleIcons = {
  owner: Shield,
  admin: Shield,
  moderator: Shield,
  developer: Shield,
  staff: UserCheck,
  event_manager: Calendar
};

const StaffProfile = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaffMember();
  }, [name]);

  const loadStaffMember = async () => {
    if (!name) return;

    try {
      const { data, error } = await supabase
        .from("staff_members_public")
        .select("*")
        .eq("id", name)
        .eq("is_active", true)
        .single();

      if (error) throw error;

      setStaffMember(data as StaffMember);
    } catch (error: any) {
      console.error("Error loading staff member:", error);
      toast({
        title: "Error",
        description: "Staff member not found",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <Button
            variant="ghost"
            onClick={() => navigate("/staff")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Staff
          </Button>
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!staffMember) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <Button
            variant="ghost"
            onClick={() => navigate("/staff")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Staff
          </Button>
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold mb-2">Staff Member Not Found</h2>
              <p className="text-muted-foreground">
                The staff member you're looking for doesn't exist.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const RoleIcon = roleIcons[staffMember.role_type as keyof typeof roleIcons] || UserCheck;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <Button
          variant="ghost"
          onClick={() => navigate("/staff")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Staff
        </Button>

        <div className="max-w-2xl mx-auto">
          {/* Simple Profile Card */}
          <Card className="glass-effect border-border/20 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary via-secondary to-primary"></div>
            <CardHeader className="text-center pb-4">
              <Avatar className="w-28 h-28 mx-auto mb-4 border-4 border-primary/30 shadow-xl">
                <AvatarImage 
                  src={staffMember.discord_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staffMember.name}`} 
                  alt={staffMember.name} 
                />
                <AvatarFallback className="text-2xl font-bold">{staffMember.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-3xl mb-2">{staffMember.name}</CardTitle>
              <p className="text-lg text-muted-foreground mb-3">{staffMember.role}</p>
              <Badge className={`${roleColors[staffMember.role_type as keyof typeof roleColors]} w-fit mx-auto border text-sm px-4 py-1`}>
                <RoleIcon className="w-4 h-4 mr-2" />
                {staffMember.role_type.replace("_", " ").toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              {/* Department */}
              <div className="text-center">
                <Badge variant="outline" className="capitalize text-base px-4 py-1">
                  {staffMember.department.replace("_", " ")} Department
                </Badge>
              </div>

              {/* Bio */}
              {staffMember.bio && (
                <div className="p-4 rounded-lg bg-muted/30 text-center">
                  <p className="text-muted-foreground italic leading-relaxed">
                    "{staffMember.bio}"
                  </p>
                </div>
              )}

              {/* Responsibilities */}
              {staffMember.responsibilities && staffMember.responsibilities.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3 text-center">Responsibilities</h4>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {staffMember.responsibilities.map((responsibility, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {responsibility}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="pt-4 border-t border-border/20">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <Shield className="w-6 h-6 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Need Help?</p>
                    <p className="text-xs text-muted-foreground">
                      Contact via support ticket system for assistance
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate("/support")}>
                    Open Ticket
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;