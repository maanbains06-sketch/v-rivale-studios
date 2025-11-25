import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerStaff from "@/assets/header-staff.jpg";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Code, HeadphonesIcon, Star, Trophy, Heart, Target, Clock, Award, UserCheck, Calendar, Loader2, MessageCircle, Mail, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState as useStateAlias } from "react";
import { StaffApplicationForm } from "@/components/StaffApplicationForm";
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
  display_order: number;
}

const roleColors = {
  owner: "bg-gradient-to-r from-primary to-secondary",
  admin: "bg-destructive",
  moderator: "bg-secondary",
  developer: "bg-accent",
  staff: "bg-primary",
  event_manager: "bg-gradient-to-r from-secondary to-primary",
};

const roleIcons = {
  owner: Shield,
  admin: Users,
  moderator: HeadphonesIcon,
  developer: Code,
  staff: UserCheck,
  event_manager: Calendar,
};

const Staff = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isApplicationOpen, setIsApplicationOpen] = useStateAlias(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaffMembers();
  }, []);

  const loadStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("staff_members")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;

      setStaffMembers(data || []);
    } catch (error: any) {
      console.error("Error loading staff members:", error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getStaffByDepartment = (dept: string) => 
    staffMembers.filter(m => m.department === dept);

  const handleStaffClick = (id: string) => {
    navigate(`/staff/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // If no staff in database, show all sections with placeholder message
  const leadershipStaff = getStaffByDepartment("leadership");
  const adminStaff = getStaffByDepartment("administration");
  const developerStaff = getStaffByDepartment("development");
  const moderatorStaff = getStaffByDepartment("moderation");
  const supportStaff = getStaffByDepartment("support");
  const eventStaff = getStaffByDepartment("events");

  const hasAnyStaff = staffMembers.length > 0;

  const getAchievementBadges = (member: StaffMember) => {
    const badges = [];
    
    // Based on responsibilities or role, add achievement badges
    if (member.responsibilities.some(r => r.toLowerCase().includes('lead') || r.toLowerCase().includes('manager'))) {
      badges.push({ label: 'Team Lead', color: 'bg-purple-500' });
    }
    if (member.role_type === 'owner') {
      badges.push({ label: 'Founder', color: 'bg-primary' });
    }
    if (member.responsibilities.length >= 5) {
      badges.push({ label: 'Multi-Skilled', color: 'bg-blue-500' });
    }
    if (member.role_type === 'developer') {
      badges.push({ label: 'Tech Expert', color: 'bg-green-500' });
    }
    if (member.department === 'support') {
      badges.push({ label: 'Helper', color: 'bg-orange-500' });
    }
    
    return badges.slice(0, 2); // Max 2 badges per card
  };

  const renderStaffCard = (member: StaffMember, index: number) => {
    const Icon = roleIcons[member.role_type as keyof typeof roleIcons] || UserCheck;
    const achievements = getAchievementBadges(member);
    
    return (
      <div key={index} className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <Card className="relative glass-effect border-border/20 hover:border-primary/40 transition-all duration-500 overflow-hidden group-hover:scale-[1.02]">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-primary"></div>
          
          {/* Achievement Badges */}
          {achievements.length > 0 && (
            <div className="absolute top-3 right-3 flex flex-col gap-1">
              {achievements.map((badge, idx) => (
                <Badge 
                  key={idx} 
                  className={`${badge.color} text-white text-xs px-2 py-0.5 shadow-lg border-0`}
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
          
          <CardContent className="pt-5 pb-4">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full blur-lg animate-pulse"></div>
                <div className={`relative w-20 h-20 rounded-full overflow-hidden border-3 ${roleColors[member.role_type as keyof typeof roleColors]} p-0.5 group-hover:scale-110 transition-transform duration-500`}>
                  <img 
                    src={member.discord_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} 
                    alt={member.name}
                    className="w-full h-full rounded-full bg-background"
                  />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-9 h-9 ${roleColors[member.role_type as keyof typeof roleColors]} rounded-full flex items-center justify-center border-3 border-background shadow-lg`}>
                  <Icon className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
              </div>

              <h3 className="text-lg font-bold mb-1.5">{member.name}</h3>
              <Badge variant="outline" className="mb-1.5 border-primary text-primary px-3 py-0.5 text-xs">
                {member.role}
              </Badge>
              <Badge variant="secondary" className="mb-3 text-xs">
                {member.department.replace("_", " ").toUpperCase()}
              </Badge>

              {member.bio && (
                <p className="text-xs text-muted-foreground italic mb-4 max-w-xs leading-relaxed line-clamp-2">&quot;{member.bio}&quot;</p>
              )}

              <div className="w-full space-y-3">
                {/* Contact Information */}
                <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
                  <h4 className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">Contact Information</h4>
                  
                  <div className="flex items-center justify-between text-left">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      Discord
                    </span>
                    <span className="text-xs font-mono font-semibold">{member.discord_username || "N/A"}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-left">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Discord ID
                    </span>
                    <span className="text-xs font-mono font-semibold">{member.discord_id}</span>
                  </div>
                  
                  {member.email && (
                    <div className="flex items-center justify-between text-left">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email
                      </span>
                      <span className="text-xs font-mono font-semibold truncate max-w-[180px]" title={member.email}>
                        {member.email}
                      </span>
                    </div>
                  )}
                  
                  {member.steam_id && (
                    <div className="flex items-center justify-between text-left">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        Steam ID
                      </span>
                      <span className="text-xs font-mono font-semibold">{member.steam_id}</span>
                    </div>
                  )}
                </div>

                {/* View Profile Button */}
                <Button 
                  className="w-full bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary border border-primary/20 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStaffClick(member.id);
                  }}
                >
                  <UserCircle className="w-4 h-4 mr-2" />
                  View Full Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <StaffApplicationForm open={isApplicationOpen} onOpenChange={setIsApplicationOpen} />
      
      <PageHeader 
        title="Meet Our Elite Team"
        description="Passionate professionals dedicated to creating the most immersive and professional roleplay experience"
        badge="24/7 Available"
        backgroundImage={headerStaff}
      />
      
      <main className="pb-16">
        <div className="container mx-auto px-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-20">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative glass-effect rounded-2xl p-6 hover:scale-105 transition-all duration-300 border border-primary/20">
                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-4xl font-bold text-gradient mb-1">{staffMembers.length}+</div>
                <div className="text-sm text-muted-foreground">Team Members</div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative glass-effect rounded-2xl p-6 hover:scale-105 transition-all duration-300 border border-primary/20">
                <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-4xl font-bold text-gradient mb-1">24/7</div>
                <div className="text-sm text-muted-foreground">Staff Coverage</div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative glass-effect rounded-2xl p-6 hover:scale-105 transition-all duration-300 border border-primary/20">
                <Trophy className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-4xl font-bold text-gradient mb-1">1000+</div>
                <div className="text-sm text-muted-foreground">Issues Resolved</div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative glass-effect rounded-2xl p-6 hover:scale-105 transition-all duration-300 border border-primary/20">
                <Award className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-4xl font-bold text-gradient mb-1">98%</div>
                <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
              </div>
            </div>
          </div>

          {/* Team Values */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gradient mb-4">Our Core Values</h2>
              <p className="text-lg text-muted-foreground">The principles that guide our team every day</p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Card className="relative glass-effect border-border/20 text-center hover:border-primary/40 transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  <CardContent className="pt-8 pb-6">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg"></div>
                      <Star className="relative w-14 h-14 text-primary mx-auto group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Excellence</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Striving for the highest quality in everything we do
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Card className="relative glass-effect border-border/20 text-center hover:border-primary/40 transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  <CardContent className="pt-8 pb-6">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg"></div>
                      <Heart className="relative w-14 h-14 text-primary mx-auto group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Community First</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Your experience and satisfaction is our priority
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Card className="relative glass-effect border-border/20 text-center hover:border-primary/40 transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  <CardContent className="pt-8 pb-6">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg"></div>
                      <Trophy className="relative w-14 h-14 text-primary mx-auto group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Fair Play</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Maintaining integrity and fairness for all players
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Card className="relative glass-effect border-border/20 text-center hover:border-primary/40 transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  <CardContent className="pt-8 pb-6">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg"></div>
                      <Target className="relative w-14 h-14 text-primary mx-auto group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Innovation</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Constantly improving with new features and updates
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Leadership Team */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gradient mb-4">Leadership Team</h2>
              <p className="text-lg text-muted-foreground">The visionaries guiding SLRP to excellence</p>
            </div>
            {leadershipStaff.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {leadershipStaff.map((member, index) => renderStaffCard(member, index))}
              </div>
            ) : (
              <Card className="glass-effect border-border/20 max-w-2xl mx-auto">
                <CardContent className="p-8 text-center">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No leadership team members added yet</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Administration Team */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gradient mb-4">Administration Team</h2>
              <p className="text-lg text-muted-foreground">Ensuring smooth server operations</p>
            </div>
            {adminStaff.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {adminStaff.map((member, index) => renderStaffCard(member, index))}
              </div>
            ) : (
              <Card className="glass-effect border-border/20 max-w-2xl mx-auto">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No administration team members added yet</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Development Team */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gradient mb-4">Development Team</h2>
              <p className="text-lg text-muted-foreground">Building innovative features</p>
            </div>
            {developerStaff.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {developerStaff.map((member, index) => renderStaffCard(member, index))}
              </div>
            ) : (
              <Card className="glass-effect border-border/20 max-w-2xl mx-auto">
                <CardContent className="p-8 text-center">
                  <Code className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No development team members added yet</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Moderation Team */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gradient mb-4">Moderation Team</h2>
              <p className="text-lg text-muted-foreground">Keeping the community safe and fair</p>
            </div>
            {moderatorStaff.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {moderatorStaff.map((member, index) => renderStaffCard(member, index))}
              </div>
            ) : (
              <Card className="glass-effect border-border/20 max-w-2xl mx-auto">
                <CardContent className="p-8 text-center">
                  <HeadphonesIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No moderation team members added yet</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Support Team */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gradient mb-4">Support Team</h2>
              <p className="text-lg text-muted-foreground">Always here to help</p>
            </div>
            {supportStaff.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {supportStaff.map((member, index) => renderStaffCard(member, index))}
              </div>
            ) : (
              <Card className="glass-effect border-border/20 max-w-2xl mx-auto">
                <CardContent className="p-8 text-center">
                  <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No support team members added yet</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Events Team */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gradient mb-4">Events Team</h2>
              <p className="text-lg text-muted-foreground">Creating unforgettable experiences</p>
            </div>
            {eventStaff.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {eventStaff.map((member, index) => renderStaffCard(member, index))}
              </div>
            ) : (
              <Card className="glass-effect border-border/20 max-w-2xl mx-auto">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No events team members added yet</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Join the Team CTA */}
          <div className="mt-20 text-center">
            <Card className="glass-effect border-border/20 max-w-2xl mx-auto">
              <CardContent className="p-12">
                <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-4">Want to Join Our Team?</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  We're always looking for passionate individuals to help make SLRP the best roleplay community. 
                  If you're dedicated, responsible, and love helping others, we'd love to hear from you!
                </p>
                <Button 
                  size="lg" 
                  onClick={() => setIsApplicationOpen(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Apply Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Staff;
