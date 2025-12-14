import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Shield, 
  Calendar, 
  UserCheck, 
  Loader2, 
  MessageCircle, 
  Mail, 
  Clock, 
  Award,
  CheckCircle2,
  Users,
  Code,
  HeadphonesIcon,
  Briefcase,
  Star,
  Target
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStaffOnlineStatus } from "@/hooks/useStaffOnlineStatus";
import { StaffOnlineIndicator } from "@/components/StaffOnlineIndicator";

interface StaffMember {
  id: string;
  name: string;
  discord_id?: string;
  discord_username?: string;
  discord_avatar?: string;
  role: string;
  role_type: string;
  department: string;
  bio?: string;
  responsibilities: string[];
  is_active: boolean;
}

const roleIcons = {
  owner: Shield,
  admin: Users,
  moderator: HeadphonesIcon,
  developer: Code,
  staff: UserCheck,
  event_manager: Calendar
};

// Detailed responsibility descriptions based on common roles
const getResponsibilityDetails = (responsibility: string) => {
  const details: { [key: string]: { icon: any; description: string } } = {
    "Server Management": { 
      icon: Shield, 
      description: "Oversees server infrastructure, ensures stability, and manages server-wide settings and configurations." 
    },
    "Community Relations": { 
      icon: Users, 
      description: "Builds positive relationships with community members, addresses concerns, and fosters engagement." 
    },
    "Player Support": { 
      icon: HeadphonesIcon, 
      description: "Provides assistance to players with in-game issues, questions, and technical problems." 
    },
    "Event Planning": { 
      icon: Calendar, 
      description: "Organizes and coordinates community events, roleplay scenarios, and special activities." 
    },
    "Staff Training": { 
      icon: Award, 
      description: "Trains new staff members, creates training materials, and ensures team competency." 
    },
    "Rule Enforcement": { 
      icon: Shield, 
      description: "Monitors player behavior, enforces server rules, and handles rule violations fairly." 
    },
    "Development": { 
      icon: Code, 
      description: "Creates and maintains server scripts, custom features, and technical improvements." 
    },
    "Bug Fixes": { 
      icon: Target, 
      description: "Identifies, troubleshoots, and resolves technical issues and bugs in the server." 
    },
    "Content Creation": { 
      icon: Star, 
      description: "Develops new content, features, and experiences to enhance the roleplay environment." 
    },
    "Moderation": { 
      icon: Shield, 
      description: "Monitors chat, resolves disputes, and maintains a positive community atmosphere." 
    },
  };
  
  // Return matching detail or a generic one
  return details[responsibility] || { 
    icon: CheckCircle2, 
    description: `Responsible for ${responsibility.toLowerCase()} activities and related duties.` 
  };
};

const StaffProfile = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const { isOnline, getLastSeen } = useStaffOnlineStatus();

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

  const handleOpenSupport = () => {
    // Navigate to support chat with staff tag for notification
    navigate(`/support-chat?tagStaff=${staffMember?.id}&staffName=${encodeURIComponent(staffMember?.name || '')}`);
  };

  const handleContactStaff = () => {
    // Navigate to support chat for direct message to this staff member
    navigate(`/support-chat?dmStaff=${staffMember?.id}&staffName=${encodeURIComponent(staffMember?.name || '')}`);
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
  const staffIsOnline = isOnline(staffMember.id);
  const lastSeenTime = getLastSeen(staffMember.id);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/staff")}
            className="mb-6 group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Staff
          </Button>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Profile Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-border/40 overflow-hidden mb-6">
              {/* Top gradient bar */}
              <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
              
              {/* Header background */}
              <div className="relative bg-gradient-to-b from-primary/10 via-primary/5 to-transparent p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.15),transparent_70%)]" />
                
                <div className="relative flex flex-col md:flex-row items-center gap-6">
                  {/* Avatar Section */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-b from-primary via-primary/70 to-primary/40 shadow-xl shadow-primary/20">
                      <Avatar className="w-full h-full border-4 border-background">
                        <AvatarImage 
                          src={staffMember.discord_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staffMember.name}`} 
                          alt={staffMember.name} 
                        />
                        <AvatarFallback className="text-3xl font-bold bg-muted">
                          {staffMember.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {/* Role Icon Badge */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-b from-primary to-primary/80 rounded-xl flex items-center justify-center border-2 border-background shadow-lg">
                      <RoleIcon className="w-5 h-5 text-primary-foreground" />
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-foreground">{staffMember.name}</h1>
                      <StaffOnlineIndicator isOnline={staffIsOnline} lastSeen={lastSeenTime} size="lg" showLabel />
                    </div>
                    <p className="text-xl text-primary font-semibold mb-3">
                      {staffMember.role}{staffMember.department === "leadership" && " / Founder"}
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 px-3 py-1">
                        <RoleIcon className="w-3 h-3 mr-1.5" />
                        {staffMember.role_type.replace("_", " ").toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border/50 px-3 py-1 capitalize">
                        {staffMember.department.replace("_", " ")} Department
                      </Badge>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-col gap-2">
                    <Button onClick={handleOpenSupport} className="gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Open Support
                    </Button>
                    <Button variant="outline" onClick={handleContactStaff} className="gap-2">
                      <Mail className="w-4 h-4" />
                      Send Message
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Left Column - About & Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="md:col-span-1 space-y-6"
            >
              {/* About Card */}
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {staffMember.bio ? (
                    <p className="text-muted-foreground leading-relaxed">
                      "{staffMember.bio}"
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      This staff member hasn't added a bio yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Quick Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {staffMember.discord_username && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/20">
                      <div className="w-10 h-10 rounded-lg bg-[#5865F2]/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#5865F2]">Discord</p>
                        <p className="text-xs text-muted-foreground truncate">{staffMember.discord_username}</p>
                      </div>
                    </div>
                  )}
                  {staffMember.discord_id && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Code className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Discord ID</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{staffMember.discord_id}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Department</p>
                      <p className="text-xs text-muted-foreground capitalize">{staffMember.department.replace("_", " ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Role Level</p>
                      <p className="text-xs text-muted-foreground capitalize">{staffMember.role_type.replace("_", " ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-xs text-muted-foreground">
                        {staffIsOnline ? "Currently Online" : "Currently Offline"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Column - Responsibilities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="md:col-span-2"
            >
              <Card className="border-border/40 h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Responsibilities & Duties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {staffMember.responsibilities && staffMember.responsibilities.length > 0 ? (
                    <div className="space-y-4">
                      {staffMember.responsibilities.map((responsibility, index) => {
                        const details = getResponsibilityDetails(responsibility);
                        const IconComponent = details.icon;
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="group p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/30 hover:border-primary/30 transition-all duration-300"
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                <IconComponent className="w-6 h-6 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                                  {responsibility}
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {details.description}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        No specific responsibilities listed for this staff member.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-6"
          >
            <Card className="border-border/40 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <HeadphonesIcon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold text-foreground mb-1">Need Assistance?</h3>
                    <p className="text-muted-foreground">
                      Have questions or need help? Reach out through our support system and {staffMember.name} or another team member will assist you.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button size="lg" onClick={handleOpenSupport} className="gap-2">
                      <MessageCircle className="w-5 h-5" />
                      Open Support Ticket
                    </Button>
                    <Button size="lg" variant="outline" onClick={handleContactStaff} className="gap-2">
                      <Mail className="w-5 h-5" />
                      Direct Message
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;