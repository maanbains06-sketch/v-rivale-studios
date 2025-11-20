import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Code, HeadphonesIcon } from "lucide-react";

interface StaffMember {
  name: string;
  role: string;
  roleType: "owner" | "admin" | "moderator" | "developer";
  avatar: string;
  responsibilities: string[];
  discordTag: string;
}

const staffMembers: StaffMember[] = [
  {
    name: "Alex Rodriguez",
    role: "Server Owner & Lead Developer",
    roleType: "owner",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    responsibilities: ["Server Management", "Development Oversight", "Community Direction"],
    discordTag: "AlexRP#0001"
  },
  {
    name: "Sarah Chen",
    role: "Head Administrator",
    roleType: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    responsibilities: ["Staff Management", "Rule Enforcement", "Player Appeals"],
    discordTag: "SarahAdmin#0002"
  },
  {
    name: "Marcus Johnson",
    role: "Senior Developer",
    roleType: "developer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    responsibilities: ["Custom Scripts", "Bug Fixes", "Feature Implementation"],
    discordTag: "MarcusDev#0003"
  },
  {
    name: "Emma Williams",
    role: "Community Manager",
    roleType: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    responsibilities: ["Event Planning", "Discord Management", "Community Engagement"],
    discordTag: "EmmaRP#0004"
  },
  {
    name: "David Park",
    role: "Senior Moderator",
    roleType: "moderator",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    responsibilities: ["Player Reports", "In-Game Moderation", "New Player Support"],
    discordTag: "DavidMod#0005"
  },
  {
    name: "Lisa Martinez",
    role: "Moderator",
    roleType: "moderator",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
    responsibilities: ["Ticket Management", "Rule Clarification", "Player Assistance"],
    discordTag: "LisaMod#0006"
  },
  {
    name: "Ryan Taylor",
    role: "Developer",
    roleType: "developer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan",
    responsibilities: ["UI/UX Design", "Script Optimization", "Database Management"],
    discordTag: "RyanDev#0007"
  },
  {
    name: "Nina Patel",
    role: "Support Specialist",
    roleType: "moderator",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nina",
    responsibilities: ["Whitelist Applications", "Technical Support", "Documentation"],
    discordTag: "NinaSupport#0008"
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
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gradient mb-4">Meet Our Team</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Dedicated professionals ensuring the best roleplay experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {staffMembers.map((member, index) => {
              const Icon = roleIcons[member.roleType];
              return (
                <Card 
                  key={index} 
                  className="glass-effect border-border/20 hover:border-primary/40 transition-all duration-300 group"
                >
                  <CardContent className="p-6">
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
                      <Badge variant="outline" className="mb-3 border-primary/40">
                        {member.role}
                      </Badge>

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

          <div className="mt-12 text-center glass-effect rounded-xl p-8 border border-border/20">
            <h2 className="text-2xl font-bold mb-4">Want to Join Our Team?</h2>
            <p className="text-muted-foreground mb-6">
              We&apos;re always looking for dedicated individuals to help make Skylife Roleplay India better
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Badge variant="outline" className="text-sm py-2 px-4">Staff Applications Opening Soon</Badge>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Staff;
