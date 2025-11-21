import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, MessageCircle, Shield, Calendar, UserCheck } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StaffMember {
  name: string;
  role: string;
  roleType: "admin" | "moderator" | "staff" | "event_manager";
  avatar: string;
  responsibilities: string[];
  discordTag: string;
  bio: string;
}

const staffMembers: StaffMember[] = [
  {
    name: "Sarah Johnson",
    role: "Server Owner",
    roleType: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    responsibilities: ["Server Management", "Community Direction", "Staff Leadership"],
    discordTag: "SarahJ#0001",
    bio: "Founder and owner of SLRP. Passionate about creating an immersive roleplay experience for all players."
  },
  {
    name: "Alex Martinez",
    role: "Head Administrator",
    roleType: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    responsibilities: ["Staff Management", "Policy Creation", "Conflict Resolution"],
    discordTag: "AlexM#0002",
    bio: "Managing day-to-day operations and ensuring fair gameplay for everyone."
  },
  {
    name: "Emma Davis",
    role: "Lead Developer",
    roleType: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    responsibilities: ["Server Development", "Script Management", "Technical Support"],
    discordTag: "EmmaDev#0003",
    bio: "Building and maintaining server features to enhance the roleplay experience."
  },
  {
    name: "Chris Thompson",
    role: "Community Moderator",
    roleType: "moderator",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Chris",
    responsibilities: ["Community Management", "Ticket Support", "Rule Enforcement"],
    discordTag: "ChrisMod#0005",
    bio: "Keeping the community safe and welcoming for all members"
  },
  {
    name: "Sophie Anderson",
    role: "Senior Moderator",
    roleType: "moderator",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",
    responsibilities: ["Player Reports", "Ban Appeals", "Staff Training"],
    discordTag: "SophieMod#0007",
    bio: "Optimizing performance and designing user interfaces"
  },
  {
    name: "James Wilson",
    role: "Staff Coordinator",
    roleType: "staff",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
    responsibilities: ["Staff Scheduling", "Team Communication", "Training Programs"],
    discordTag: "JamesStaff#0009",
    bio: "Coordinating staff activities and ensuring smooth operations"
  },
  {
    name: "Rachel Kim",
    role: "Community Staff",
    roleType: "staff",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rachel",
    responsibilities: ["Player Assistance", "Community Events", "New Player Orientation"],
    discordTag: "RachelStaff#0010",
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
    responsibilities: ["Event Planning", "Community Activities", "Special Projects"],
    discordTag: "MichaelEvents#0011",
    bio: "Creating memorable experiences for the community"
  },
  {
    name: "Olivia Brown",
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
  admin: "bg-red-500/10 text-red-500 border-red-500/20",
  moderator: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  staff: "bg-green-500/10 text-green-500 border-green-500/20",
  event_manager: "bg-purple-500/10 text-purple-500 border-purple-500/20"
};

const roleIcons = {
  admin: Shield,
  moderator: Shield,
  staff: UserCheck,
  event_manager: Calendar
};

const StaffProfile = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  
  const staffMember = staffMembers.find(
    (member) => member.name.toLowerCase().replace(/\s+/g, "-") === name
  );

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

  const RoleIcon = roleIcons[staffMember.roleType];

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
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <Avatar className="w-32 h-32 mx-auto mb-4">
                <AvatarImage src={staffMember.avatar} alt={staffMember.name} />
                <AvatarFallback>{staffMember.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{staffMember.name}</CardTitle>
              <CardDescription className="text-lg">{staffMember.role}</CardDescription>
              <Badge className={`${roleColors[staffMember.roleType]} w-fit mx-auto mt-2`}>
                <RoleIcon className="w-3 h-3 mr-1" />
                {staffMember.roleType.replace("_", " ").toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <MessageCircle className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Discord</p>
                  <p className="text-sm text-muted-foreground">{staffMember.discordTag}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Cards */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {staffMember.bio}
                </p>
              </CardContent>
            </Card>

            <Card>
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

            <Card>
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
                    <p className="text-sm font-mono bg-background px-2 py-1 rounded w-fit">
                      {staffMember.discordTag}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium mb-1">In-Game</p>
                    <p className="text-sm text-muted-foreground">
                      Available for support tickets and general inquiries within the server
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
