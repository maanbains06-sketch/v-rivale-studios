import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerStaff from "@/assets/header-staff.jpg";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Code, HeadphonesIcon, Star, Trophy, Heart, Target, Sparkles, Zap, Clock, Award, MessageCircle, UserCheck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { StaffApplicationForm } from "@/components/StaffApplicationForm";

interface StaffMember {
  name: string;
  role: string;
  roleType: "owner" | "admin" | "moderator" | "developer" | "staff" | "event_manager";
  avatar: string;
  responsibilities: string[];
  discordTag: string;
  bio?: string;
}

const staffMembers: StaffMember[] = [
  {
    name: "Alex Rodriguez",
    role: "Server Owner & Lead Developer",
    roleType: "owner",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    responsibilities: ["Server Management", "Development Oversight", "Community Direction"],
    discordTag: "AlexRP#0001",
    bio: "Founded SLRP with a vision to create the best Indian RP community"
  },
  {
    name: "Sarah Chen",
    role: "Head Administrator",
    roleType: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    responsibilities: ["Staff Management", "Rule Enforcement", "Player Appeals"],
    discordTag: "SarahAdmin#0002",
    bio: "Ensuring fair gameplay and maintaining community standards"
  },
  {
    name: "Marcus Johnson",
    role: "Senior Developer",
    roleType: "developer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    responsibilities: ["Custom Scripts", "Bug Fixes", "Feature Implementation"],
    discordTag: "MarcusDev#0003",
    bio: "Building innovative features for enhanced roleplay experience"
  },
  {
    name: "Emma Williams",
    role: "Community Manager",
    roleType: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    responsibilities: ["Event Planning", "Discord Management", "Community Engagement"],
    discordTag: "EmmaRP#0004",
    bio: "Creating engaging events and fostering community spirit"
  },
  {
    name: "David Park",
    role: "Senior Moderator",
    roleType: "moderator",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    responsibilities: ["Player Reports", "In-Game Moderation", "New Player Support"],
    discordTag: "DavidMod#0005",
    bio: "Keeping the server safe and helping new players get started"
  },
  {
    name: "Lisa Martinez",
    role: "Moderator",
    roleType: "moderator",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
    responsibilities: ["Ticket Management", "Rule Clarification", "Player Assistance"],
    discordTag: "LisaMod#0006",
    bio: "Providing quick support and clarifying server rules"
  },
  {
    name: "Ryan Taylor",
    role: "Developer",
    roleType: "developer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan",
    responsibilities: ["UI/UX Design", "Script Optimization", "Database Management"],
    discordTag: "RyanDev#0007",
    bio: "Optimizing performance and designing user interfaces"
  },
  {
    name: "James Wilson",
    role: "Staff Coordinator",
    roleType: "staff",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
    responsibilities: ["Staff Training", "Team Coordination", "Performance Reviews"],
    discordTag: "JamesStaff#0009",
    bio: "Managing staff operations and ensuring team excellence"
  },
  {
    name: "Sophia Kumar",
    role: "Senior Staff Member",
    roleType: "staff",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
    responsibilities: ["Player Support", "Ticket Resolution", "Staff Mentoring"],
    discordTag: "SophiaStaff#0010",
    bio: "Supporting players and mentoring new staff members"
  },
  {
    name: "Priya Sharma",
    role: "Staff Member",
    roleType: "staff",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
    responsibilities: ["Community Outreach", "Player Engagement", "Feedback Management"],
    discordTag: "PriyaStaff#0013",
    bio: "Connecting with the community and gathering valuable feedback"
  },
  {
    name: "Michael Chen",
    role: "Event Director",
    roleType: "event_manager",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    responsibilities: ["Event Planning", "Community Events", "Special Activities"],
    discordTag: "MichaelEvents#0011",
    bio: "Creating unforgettable events for the community"
  },
  {
    name: "Olivia Thompson",
    role: "Event Coordinator",
    roleType: "event_manager",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia",
    responsibilities: ["Event Execution", "Prize Distribution", "Event Promotions"],
    discordTag: "OliviaEvents#0012",
    bio: "Bringing exciting events to life"
  },
  {
    name: "Arjun Verma",
    role: "Event Manager",
    roleType: "event_manager",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun",
    responsibilities: ["Event Logistics", "Community Engagement", "Event Content"],
    discordTag: "ArjunEvents#0014",
    bio: "Managing event logistics and community participation"
  },
];

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
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  
  const ownerStaff = staffMembers.filter(m => m.roleType === "owner");
  const adminStaff = staffMembers.filter(m => m.roleType === "admin");
  const developerStaff = staffMembers.filter(m => m.roleType === "developer");
  const moderatorStaff = staffMembers.filter(m => m.roleType === "moderator");
  const staffTeam = staffMembers.filter(m => m.roleType === "staff");
  const eventTeam = staffMembers.filter(m => m.roleType === "event_manager");

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
                <Zap className="w-8 h-8 text-primary mx-auto mb-3" />
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

          {/* Team Values with Enhanced Design */}
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

          {/* Leadership Team with Enhanced Design */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gradient mb-4">Leadership Team</h2>
              <p className="text-lg text-muted-foreground">The visionaries guiding SLRP to excellence</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {ownerStaff.map((member, index) => {
                const Icon = roleIcons[member.roleType];
                return (
                  <div key={index} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <Card className="relative glass-effect border-border/20 hover:border-primary/40 transition-all duration-500 overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary"></div>
                      <CardContent className="pt-8 pb-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="relative mb-6">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full blur-xl animate-pulse"></div>
                            <div className={`relative w-32 h-32 rounded-full overflow-hidden border-4 ${roleColors[member.roleType]} p-1 group-hover:scale-110 transition-transform duration-500`}>
                              <img 
                                src={member.avatar} 
                                alt={member.name}
                                className="w-full h-full rounded-full bg-background"
                              />
                            </div>
                            <div className={`absolute -bottom-2 -right-2 w-14 h-14 ${roleColors[member.roleType]} rounded-full flex items-center justify-center border-4 border-background shadow-lg`}>
                              <Icon className="w-7 h-7 text-primary-foreground" />
                            </div>
                            <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
                          </div>

                          <h3 className="text-2xl font-bold mb-2">{member.name}</h3>
                          <Badge variant="outline" className="mb-4 border-primary text-primary px-4 py-1">
                            {member.role}
                          </Badge>

                          {member.bio && (
                            <p className="text-sm text-muted-foreground italic mb-6 max-w-md leading-relaxed">&quot;{member.bio}&quot;</p>
                          )}

                          <div className="w-full mb-5">
                            <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Key Responsibilities</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {member.responsibilities.map((resp, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs px-3 py-1 hover:bg-primary/20 transition-colors">
                                  {resp}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm bg-card/50 px-4 py-2 rounded-full">
                            <MessageCircle className="w-4 h-4 text-primary" />
                            <span className="text-primary font-semibold">Discord:</span>
                            <span className="text-muted-foreground">{member.discordTag}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Administration Team */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gradient mb-4">Administration Team</h2>
              <p className="text-lg text-muted-foreground">Ensuring smooth operations and fair gameplay</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {adminStaff.map((member, index) => {
                const Icon = roleIcons[member.roleType];
                return (
                  <div key={index} className="relative group">
                    <div className="absolute inset-0 bg-destructive/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <Card className="relative glass-effect border-border/20 hover:border-destructive/40 transition-all duration-500 hover:shadow-xl hover:shadow-destructive/10">
                      <CardContent className="pt-6 pb-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="relative mb-5">
                            <div className={`w-28 h-28 rounded-full overflow-hidden border-4 ${roleColors[member.roleType]} p-1 group-hover:scale-110 transition-transform duration-500`}>
                              <img 
                                src={member.avatar} 
                                alt={member.name}
                                className="w-full h-full rounded-full bg-background"
                              />
                            </div>
                            <div className={`absolute -bottom-2 -right-2 w-12 h-12 ${roleColors[member.roleType]} rounded-full flex items-center justify-center border-3 border-background shadow-lg`}>
                              <Icon className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <div className="absolute -top-1 -left-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
                          </div>

                          <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                          <Badge variant="outline" className="mb-4 border-destructive/40 px-3 py-1">
                            {member.role}
                          </Badge>

                          {member.bio && (
                            <p className="text-xs text-muted-foreground italic mb-4 leading-relaxed">&quot;{member.bio}&quot;</p>
                          )}

                          <div className="w-full mb-4">
                            <p className="text-xs text-muted-foreground mb-2 font-semibold">Responsibilities</p>
                            <div className="flex flex-wrap gap-1.5 justify-center">
                              {member.responsibilities.map((resp, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs hover:bg-primary/20 transition-colors">
                                  {resp}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5 text-primary" />
                            <span className="text-primary font-medium">Discord:</span> {member.discordTag}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Development Team */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gradient mb-4">Development Team</h2>
              <p className="text-lg text-muted-foreground">Building innovative features for the best RP experience</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {developerStaff.map((member, index) => {
                const Icon = roleIcons[member.roleType];
                return (
                  <div key={index} className="relative group">
                    <div className="absolute inset-0 bg-accent/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <Card className="relative glass-effect border-border/20 hover:border-accent/40 transition-all duration-500 hover:shadow-xl hover:shadow-accent/10">
                      <CardContent className="pt-6 pb-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="relative mb-5">
                            <div className={`w-28 h-28 rounded-full overflow-hidden border-4 ${roleColors[member.roleType]} p-1 group-hover:scale-110 transition-transform duration-500`}>
                              <img 
                                src={member.avatar} 
                                alt={member.name}
                                className="w-full h-full rounded-full bg-background"
                              />
                            </div>
                            <div className={`absolute -bottom-2 -right-2 w-12 h-12 ${roleColors[member.roleType]} rounded-full flex items-center justify-center border-3 border-background shadow-lg`}>
                              <Icon className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <div className="absolute -top-1 -left-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
                          </div>

                          <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                          <Badge variant="outline" className="mb-4 border-accent/40 px-3 py-1">
                            {member.role}
                          </Badge>

                          {member.bio && (
                            <p className="text-xs text-muted-foreground italic mb-4 leading-relaxed">&quot;{member.bio}&quot;</p>
                          )}

                          <div className="w-full mb-4">
                            <p className="text-xs text-muted-foreground mb-2 font-semibold">Responsibilities</p>
                            <div className="flex flex-wrap gap-1.5 justify-center">
                              {member.responsibilities.map((resp, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs hover:bg-primary/20 transition-colors">
                                  {resp}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5 text-primary" />
                            <span className="text-primary font-medium">Discord:</span> {member.discordTag}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Moderation Team */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gradient mb-4">Moderation Team</h2>
              <p className="text-lg text-muted-foreground">Keeping the community safe and welcoming</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {moderatorStaff.map((member, index) => {
                const Icon = roleIcons[member.roleType];
                return (
                  <div key={index} className="relative group">
                    <div className="absolute inset-0 bg-secondary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <Card className="relative glass-effect border-border/20 hover:border-secondary/40 transition-all duration-500 hover:shadow-xl hover:shadow-secondary/10">
                      <CardContent className="pt-6 pb-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="relative mb-5">
                            <div className={`w-28 h-28 rounded-full overflow-hidden border-4 ${roleColors[member.roleType]} p-1 group-hover:scale-110 transition-transform duration-500`}>
                              <img 
                                src={member.avatar} 
                                alt={member.name}
                                className="w-full h-full rounded-full bg-background"
                              />
                            </div>
                            <div className={`absolute -bottom-2 -right-2 w-12 h-12 ${roleColors[member.roleType]} rounded-full flex items-center justify-center border-3 border-background shadow-lg`}>
                              <Icon className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <div className="absolute -top-1 -left-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
                          </div>

                          <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                          <Badge variant="outline" className="mb-4 border-secondary/40 px-3 py-1">
                            {member.role}
                          </Badge>

                          {member.bio && (
                            <p className="text-xs text-muted-foreground italic mb-4 leading-relaxed">&quot;{member.bio}&quot;</p>
                          )}

                          <div className="w-full mb-4">
                            <p className="text-xs text-muted-foreground mb-2 font-semibold">Responsibilities</p>
                            <div className="flex flex-wrap gap-1.5 justify-center">
                              {member.responsibilities.map((resp, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs hover:bg-primary/20 transition-colors">
                                  {resp}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5 text-primary" />
                            <span className="text-primary font-medium">Discord:</span> {member.discordTag}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Staff Team */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gradient mb-4">Staff Team</h2>
              <p className="text-lg text-muted-foreground">Dedicated professionals ensuring quality service</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {staffTeam.map((member, index) => {
                const Icon = roleIcons[member.roleType];
                return (
                  <div key={index} className="relative group">
                    <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <Card className="relative glass-effect border-border/20 hover:border-primary/40 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10">
                      <CardContent className="pt-6 pb-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="relative mb-5">
                            <div className={`w-28 h-28 rounded-full overflow-hidden border-4 ${roleColors[member.roleType]} p-1 group-hover:scale-110 transition-transform duration-500`}>
                              <img 
                                src={member.avatar} 
                                alt={member.name}
                                className="w-full h-full rounded-full bg-background"
                              />
                            </div>
                            <div className={`absolute -bottom-2 -right-2 w-12 h-12 ${roleColors[member.roleType]} rounded-full flex items-center justify-center border-3 border-background shadow-lg`}>
                              <Icon className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <div className="absolute -top-1 -left-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
                          </div>

                          <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                          <Badge variant="outline" className="mb-4 border-primary/40 px-3 py-1">
                            {member.role}
                          </Badge>

                          {member.bio && (
                            <p className="text-xs text-muted-foreground italic mb-4 leading-relaxed">&quot;{member.bio}&quot;</p>
                          )}

                          <div className="w-full mb-4">
                            <p className="text-xs text-muted-foreground mb-2 font-semibold">Responsibilities</p>
                            <div className="flex flex-wrap gap-1.5 justify-center">
                              {member.responsibilities.map((resp, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs hover:bg-primary/20 transition-colors">
                                  {resp}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5 text-primary" />
                            <span className="text-primary font-medium">Discord:</span> {member.discordTag}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event Management Team */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gradient mb-4">Event Management Team</h2>
              <p className="text-lg text-muted-foreground">Creating memorable experiences for the community</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {eventTeam.map((member, index) => {
                const Icon = roleIcons[member.roleType];
                return (
                  <div key={index} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <Card className="relative glass-effect border-border/20 hover:border-primary/40 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10">
                      <CardContent className="pt-6 pb-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="relative mb-5">
                            <div className={`w-28 h-28 rounded-full overflow-hidden border-4 ${roleColors[member.roleType]} p-1 group-hover:scale-110 transition-transform duration-500`}>
                              <img 
                                src={member.avatar} 
                                alt={member.name}
                                className="w-full h-full rounded-full bg-background"
                              />
                            </div>
                            <div className={`absolute -bottom-2 -right-2 w-12 h-12 ${roleColors[member.roleType]} rounded-full flex items-center justify-center border-3 border-background shadow-lg`}>
                              <Icon className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <div className="absolute -top-1 -left-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
                          </div>

                          <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                          <Badge variant="outline" className="mb-4 border-primary/40 px-3 py-1">
                            {member.role}
                          </Badge>

                          {member.bio && (
                            <p className="text-xs text-muted-foreground italic mb-4 leading-relaxed">&quot;{member.bio}&quot;</p>
                          )}

                          <div className="w-full mb-4">
                            <p className="text-xs text-muted-foreground mb-2 font-semibold">Responsibilities</p>
                            <div className="flex flex-wrap gap-1.5 justify-center">
                              {member.responsibilities.map((resp, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs hover:bg-primary/20 transition-colors">
                                  {resp}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5 text-primary" />
                            <span className="text-primary font-medium">Discord:</span> {member.discordTag}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Join Team Section - Enhanced */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-3xl blur-3xl"></div>
            <div className="relative text-center glass-effect rounded-3xl p-16 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 mb-6">
                  <Shield className="w-10 h-10 text-primary" />
                </div>
                
                <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-6">Join Our Elite Team</h2>
                <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                  We&apos;re always looking for passionate, dedicated individuals who want to make a real difference in the SLRP community and shape the future of roleplay
                </p>
                
                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-6 rounded-2xl bg-card/50 border border-border/20 hover:border-primary/40 transition-all duration-300">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-bold text-lg mb-3 text-primary">Requirements</h3>
                      <ul className="text-sm text-muted-foreground space-y-2 text-left">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          18+ years old
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          Active player
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          Clean record
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          Strong RP knowledge
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute inset-0 bg-secondary/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-6 rounded-2xl bg-card/50 border border-border/20 hover:border-secondary/40 transition-all duration-300">
                      <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                        <Target className="w-6 h-6 text-secondary" />
                      </div>
                      <h3 className="font-bold text-lg mb-3 text-secondary">Open Positions</h3>
                      <ul className="text-sm text-muted-foreground space-y-2 text-left">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                          Moderators
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                          Developers
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                          Event Coordinators
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                          Content Creators
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-6 rounded-2xl bg-card/50 border border-border/20 hover:border-primary/40 transition-all duration-300">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                        <Award className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-bold text-lg mb-3 text-primary">Benefits</h3>
                      <ul className="text-sm text-muted-foreground space-y-2 text-left">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          Exclusive perks
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          Professional training
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          Community impact
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          Recognition & rewards
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 group"
                  onClick={() => setIsApplicationOpen(true)}
                >
                  <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  Apply for Staff Position
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Staff;
