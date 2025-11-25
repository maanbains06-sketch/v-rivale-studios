import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Mail, MessageCircle, Shield, Calendar, UserCheck, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StaffMember {
  id: string;
  name: string;
  discord_id: string;
  discord_username?: string;
  discord_avatar?: string;
  email?: string;
  steam_id?: string;
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
        .from("staff_members")
        .select("*")
        .eq("id", name)
        .eq("is_active", true)
        .single();

      if (error) throw error;

      setStaffMember(data);
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

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1 glass-effect border-border/20">
            <CardHeader className="text-center">
              <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-primary/20">
                <AvatarImage 
                  src={staffMember.discord_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staffMember.name}`} 
                  alt={staffMember.name} 
                />
                <AvatarFallback>{staffMember.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{staffMember.name}</CardTitle>
              <CardDescription className="text-lg">{staffMember.role}</CardDescription>
              <Badge className={`${roleColors[staffMember.role_type as keyof typeof roleColors]} w-fit mx-auto mt-2 border`}>
                <RoleIcon className="w-3 h-3 mr-1" />
                {staffMember.role_type.replace("_", " ").toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">Contact Details</h4>
                
                <div className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                  <MessageCircle className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">Discord</p>
                    <p className="text-sm font-semibold truncate">{staffMember.discord_username || "N/A"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                  <Shield className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">Discord ID</p>
                    <p className="text-xs font-mono font-semibold">{staffMember.discord_id}</p>
                  </div>
                </div>
                
                {staffMember.email && (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">Email</p>
                      <p className="text-sm font-semibold truncate" title={staffMember.email}>{staffMember.email}</p>
                    </div>
                  </div>
                )}
                
                {staffMember.steam_id && (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                    <UserCheck className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">Steam ID</p>
                      <p className="text-xs font-mono font-semibold">{staffMember.steam_id}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 rounded-lg bg-muted/30">
                <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Department</h4>
                <Badge variant="outline" className="w-full justify-center capitalize">
                  {staffMember.department.replace("_", " ")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Details Cards */}
          <div className="md:col-span-2 space-y-6">
            {staffMember.bio && (
              <Card className="glass-effect border-border/20">
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {staffMember.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="glass-effect border-border/20">
              <CardHeader>
                <CardTitle>Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {staffMember.responsibilities.map((responsibility, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {responsibility}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/20">
              <CardHeader>
                <CardTitle>Complete Profile Information</CardTitle>
                <CardDescription>
                  All details about {staffMember.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary" />
                    Personal Information
                  </h4>
                  <div className="grid gap-3">
                    <div className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">Full Name</span>
                      <span className="text-sm font-semibold text-right">{staffMember.name}</span>
                    </div>
                    <div className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">Role</span>
                      <Badge className={`${roleColors[staffMember.role_type as keyof typeof roleColors]} border shrink-0`}>
                        {staffMember.role}
                      </Badge>
                    </div>
                    <div className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">Department</span>
                      <span className="text-sm font-semibold capitalize">{staffMember.department.replace("_", " ")}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    Contact Details
                  </h4>
                  <div className="grid gap-3">
                    <div className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">Discord Username</span>
                      <span className="text-sm font-mono font-semibold">{staffMember.discord_username || "N/A"}</span>
                    </div>
                    <div className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">Discord ID</span>
                      <span className="text-xs font-mono font-semibold">{staffMember.discord_id}</span>
                    </div>
                    {staffMember.email && (
                      <div className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm text-muted-foreground">Email Address</span>
                        <span className="text-sm font-mono font-semibold break-all text-right max-w-[60%]">{staffMember.email}</span>
                      </div>
                    )}
                    {staffMember.steam_id && (
                      <div className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm text-muted-foreground">Steam ID</span>
                        <span className="text-sm font-mono font-semibold">{staffMember.steam_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/20">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Reach out to {staffMember.name.split(" ")[0]} through the following channels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <MessageCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium mb-1">Discord</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Best way to reach me for quick responses
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm font-mono bg-background px-2 py-1 rounded w-fit">
                        {staffMember.discord_username || staffMember.discord_id}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        ID: {staffMember.discord_id}
                      </p>
                    </div>
                  </div>
                </div>

                {staffMember.email && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Mail className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium mb-1">Email</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        For formal inquiries and support
                      </p>
                      <p className="text-sm font-mono bg-background px-2 py-1 rounded w-fit">
                        {staffMember.email}
                      </p>
                    </div>
                  </div>
                )}

                {staffMember.steam_id && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Shield className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium mb-1">Steam ID</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        In-game identification
                      </p>
                      <p className="text-sm font-mono bg-background px-2 py-1 rounded w-fit">
                        {staffMember.steam_id}
                      </p>
                    </div>
                  </div>
                )}

                {!staffMember.email && !staffMember.steam_id && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <MessageCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium mb-1">In-Game</p>
                      <p className="text-sm text-muted-foreground">
                        Available for support tickets and general inquiries within the server
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
