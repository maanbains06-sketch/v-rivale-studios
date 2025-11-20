import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Code, HeadphonesIcon, Star, Trophy, Heart, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StaffMember {
  name: string;
  role: string;
  roleType: "owner" | "admin" | "moderator" | "developer";
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
    name: "Nina Patel",
    role: "Support Specialist",
    roleType: "moderator",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nina",
    responsibilities: ["Whitelist Applications", "Technical Support", "Documentation"],
    discordTag: "NinaSupport#0008",
    bio: "Helping players with technical issues and whitelist process"
  },
];

const roleColors = {
  owner: "bg-gradient-to-r from-primary to-secondary",
  admin: "bg-destructive",
  moderator: "bg-secondary",
  developer: "bg-accent",
};

const roleIcons = {
  owner: Shield,
  admin: Users,
  moderator: HeadphonesIcon,
  developer: Code,
};

const Staff = () => {
  const ownerStaff = staffMembers.filter(m => m.roleType === "owner");
  const adminStaff = staffMembers.filter(m => m.roleType === "admin");
  const developerStaff = staffMembers.filter(m => m.roleType === "developer");
  const moderatorStaff = staffMembers.filter(m => m.roleType === "moderator");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-4">Meet Our Team</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Passionate professionals dedicated to creating the best roleplay experience in India
            </p>
            <div className="flex flex-wrap gap-8 justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-1">{staffMembers.length}+</div>
                <div className="text-sm text-muted-foreground">Team Members</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-1">24/7</div>
                <div className="text-sm text-muted-foreground">Staff Coverage</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-1">1000+</div>
                <div className="text-sm text-muted-foreground">Issues Resolved</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-1">98%</div>
                <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
              </div>
            </div>
          </div>

          {/* Team Values */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            <Card className="glass-effect border-border/20 text-center">
              <CardContent className="pt-6">
                <Star className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-2">Excellence</h3>
                <p className="text-sm text-muted-foreground">
                  Striving for the highest quality in everything we do
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/20 text-center">
              <CardContent className="pt-6">
                <Heart className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-2">Community First</h3>
                <p className="text-sm text-muted-foreground">
                  Your experience and satisfaction is our priority
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/20 text-center">
              <CardContent className="pt-6">
                <Trophy className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-2">Fair Play</h3>
                <p className="text-sm text-muted-foreground">
                  Maintaining integrity and fairness for all players
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/20 text-center">
              <CardContent className="pt-6">
                <Target className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-2">Innovation</h3>
                <p className="text-sm text-muted-foreground">
                  Constantly improving with new features and updates
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Leadership Team */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Leadership Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {ownerStaff.map((member, index) => {
                const Icon = roleIcons[member.roleType];
                return (
                  <Card 
                    key={index} 
                    className="glass-effect border-border/20 hover:border-primary/40 transition-all duration-300 group hover:scale-105"
                  >
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4">
                          <div className={`w-28 h-28 rounded-full overflow-hidden border-4 ${roleColors[member.roleType]} p-1 group-hover:scale-110 transition-transform duration-300`}>
                            <img 
                              src={member.avatar} 
                              alt={member.name}
                              className="w-full h-full rounded-full bg-background"
                            />
                          </div>
                          <div className={`absolute -bottom-2 -right-2 w-12 h-12 ${roleColors[member.roleType]} rounded-full flex items-center justify-center border-2 border-background`}>
                            <Icon className="w-6 h-6 text-primary-foreground" />
                          </div>
                        </div>

                        <h3 className="text-2xl font-bold mb-1">{member.name}</h3>
                        <Badge variant="outline" className="mb-3 border-primary text-primary">
                          {member.role}
                        </Badge>

                        {member.bio && (
                          <p className="text-sm text-muted-foreground italic mb-4">&quot;{member.bio}&quot;</p>
                        )}

                        <div className="w-full mb-4">
                          <p className="text-xs text-muted-foreground mb-2 font-semibold">Responsibilities:</p>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {member.responsibilities.map((resp, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {resp}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="text-sm">
                          <span className="text-primary font-semibold">Discord:</span>
                          <span className="ml-1 text-muted-foreground">{member.discordTag}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Administration Team */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Administration Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminStaff.map((member, index) => {
                const Icon = roleIcons[member.roleType];
                return (
                  <Card 
                    key={index} 
                    className="glass-effect border-border/20 hover:border-destructive/40 transition-all duration-300 group hover:scale-105"
                  >
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4">
                          <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${roleColors[member.roleType]} p-1 group-hover:scale-110 transition-transform duration-300`}>
                            <img 
                              src={member.avatar} 
                              alt={member.name}
                              className="w-full h-full rounded-full bg-background"
                            />
                          </div>
                          <div className={`absolute -bottom-2 -right-2 w-10 h-10 ${roleColors[member.roleType]} rounded-full flex items-center justify-center border-2 border-background`}>
                            <Icon className="w-5 h-5 text-primary-foreground" />
                          </div>
                        </div>

                        <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                        <Badge variant="outline" className="mb-3 border-destructive/40">
                          {member.role}
                        </Badge>

                        {member.bio && (
                          <p className="text-xs text-muted-foreground italic mb-3">&quot;{member.bio}&quot;</p>
                        )}

                        <div className="w-full mb-4">
                          <p className="text-xs text-muted-foreground mb-2">Responsibilities:</p>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {member.responsibilities.map((resp, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {resp}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          <span className="text-primary">Discord:</span> {member.discordTag}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Development Team */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Development Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {developerStaff.map((member, index) => {
                const Icon = roleIcons[member.roleType];
                return (
                  <Card 
                    key={index} 
                    className="glass-effect border-border/20 hover:border-accent/40 transition-all duration-300 group hover:scale-105"
                  >
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4">
                          <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${roleColors[member.roleType]} p-1 group-hover:scale-110 transition-transform duration-300`}>
                            <img 
                              src={member.avatar} 
                              alt={member.name}
                              className="w-full h-full rounded-full bg-background"
                            />
                          </div>
                          <div className={`absolute -bottom-2 -right-2 w-10 h-10 ${roleColors[member.roleType]} rounded-full flex items-center justify-center border-2 border-background`}>
                            <Icon className="w-5 h-5 text-primary-foreground" />
                          </div>
                        </div>

                        <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                        <Badge variant="outline" className="mb-3 border-accent/40">
                          {member.role}
                        </Badge>

                        {member.bio && (
                          <p className="text-xs text-muted-foreground italic mb-3">&quot;{member.bio}&quot;</p>
                        )}

                        <div className="w-full mb-4">
                          <p className="text-xs text-muted-foreground mb-2">Responsibilities:</p>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {member.responsibilities.map((resp, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {resp}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          <span className="text-primary">Discord:</span> {member.discordTag}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Moderation Team */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Moderation Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {moderatorStaff.map((member, index) => {
                const Icon = roleIcons[member.roleType];
                return (
                  <Card 
                    key={index} 
                    className="glass-effect border-border/20 hover:border-secondary/40 transition-all duration-300 group hover:scale-105"
                  >
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4">
                          <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${roleColors[member.roleType]} p-1 group-hover:scale-110 transition-transform duration-300`}>
                            <img 
                              src={member.avatar} 
                              alt={member.name}
                              className="w-full h-full rounded-full bg-background"
                            />
                          </div>
                          <div className={`absolute -bottom-2 -right-2 w-10 h-10 ${roleColors[member.roleType]} rounded-full flex items-center justify-center border-2 border-background`}>
                            <Icon className="w-5 h-5 text-primary-foreground" />
                          </div>
                        </div>

                        <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                        <Badge variant="outline" className="mb-3 border-secondary/40">
                          {member.role}
                        </Badge>

                        {member.bio && (
                          <p className="text-xs text-muted-foreground italic mb-3">&quot;{member.bio}&quot;</p>
                        )}

                        <div className="w-full mb-4">
                          <p className="text-xs text-muted-foreground mb-2">Responsibilities:</p>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {member.responsibilities.map((resp, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {resp}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          <span className="text-primary">Discord:</span> {member.discordTag}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Join Team Section */}
          <div className="text-center glass-effect rounded-2xl p-12 border border-border/20 bg-gradient-to-br from-primary/5 to-background">
            <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Want to Join Our Team?</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              We&apos;re always looking for passionate, dedicated individuals who want to make a difference in the SLRP community
            </p>
            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
              <div className="p-4 rounded-lg bg-card/50">
                <h3 className="font-semibold mb-2 text-primary">Requirements</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 18+ years old</li>
                  <li>• Active player</li>
                  <li>• Clean record</li>
                  <li>• Strong RP knowledge</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-card/50">
                <h3 className="font-semibold mb-2 text-primary">Open Positions</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Moderators</li>
                  <li>• Developers</li>
                  <li>• Event Coordinators</li>
                  <li>• Content Creators</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-card/50">
                <h3 className="font-semibold mb-2 text-primary">Benefits</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Exclusive perks</li>
                  <li>• Staff training</li>
                  <li>• Community impact</li>
                  <li>• Recognition</li>
                </ul>
              </div>
            </div>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Apply for Staff Position
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Staff;
