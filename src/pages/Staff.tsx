import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerStaff from "@/assets/header-staff.jpg";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Users,
  Code,
  HeadphonesIcon,
  Star,
  Trophy,
  Heart,
  Target,
  Clock,
  Award,
  UserCheck,
  Calendar,
  MessageCircle,
  Mail,
  UserCircle,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState as useStateAlias } from "react";
import { StaffApplicationForm } from "@/components/StaffApplicationForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStaffOnlineStatus } from "@/hooks/useStaffOnlineStatus";
import { StaffOnlineIndicator } from "@/components/StaffOnlineIndicator";
import { useFavoriteStaff } from "@/hooks/useFavoriteStaff";
import { useFavoriteStaffNotifications } from "@/hooks/useFavoriteStaffNotifications";
import { FavoriteStaffButton } from "@/components/FavoriteStaffButton";
import { StaffCardsSkeletonGrid } from "@/components/StaffCardSkeleton";

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
  display_order: number;
  // Note: user_id not available from public view - online status won't work
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

const scrollRevealVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const departmentThemes = {
  leadership: {
    gradient: "from-amber-950/50 via-orange-900/40 to-yellow-900/30",
    border: "border-amber-500/20 hover:border-amber-400/40",
    glow: "hover:shadow-[0_0_40px_rgba(251,191,36,0.15)]",
    accent: "from-amber-500 to-orange-600",
    textAccent: "text-amber-400",
    icon: "👑",
    title: "Leadership Team",
    subtitle: "The visionaries guiding SLRP to excellence"
  },
  administration: {
    gradient: "from-red-950/50 via-rose-900/40 to-pink-900/30",
    border: "border-red-500/20 hover:border-red-400/40",
    glow: "hover:shadow-[0_0_40px_rgba(239,68,68,0.15)]",
    accent: "from-red-500 to-rose-600",
    textAccent: "text-red-400",
    icon: "🛡️",
    title: "Management Team",
    subtitle: "Ensuring smooth server operations"
  },
  development: {
    gradient: "from-emerald-950/50 via-green-900/40 to-teal-900/30",
    border: "border-emerald-500/20 hover:border-emerald-400/40",
    glow: "hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]",
    accent: "from-emerald-500 to-green-600",
    textAccent: "text-emerald-400",
    icon: "💻",
    title: "Development Team",
    subtitle: "Building innovative features and experiences"
  },
  moderation: {
    gradient: "from-blue-950/50 via-indigo-900/40 to-violet-900/30",
    border: "border-blue-500/20 hover:border-blue-400/40",
    glow: "hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]",
    accent: "from-blue-500 to-indigo-600",
    textAccent: "text-blue-400",
    icon: "⚖️",
    title: "Administration Team",
    subtitle: "Keeping the community safe and fair"
  },
  staff: {
    gradient: "from-purple-950/50 via-violet-900/40 to-fuchsia-900/30",
    border: "border-purple-500/20 hover:border-purple-400/40",
    glow: "hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]",
    accent: "from-purple-500 to-violet-600",
    textAccent: "text-purple-400",
    icon: "⭐",
    title: "Staff Team",
    subtitle: "Core team members providing essential services"
  },
  support: {
    gradient: "from-cyan-950/50 via-sky-900/40 to-blue-900/30",
    border: "border-cyan-500/20 hover:border-cyan-400/40",
    glow: "hover:shadow-[0_0_40px_rgba(6,182,212,0.15)]",
    accent: "from-cyan-500 to-sky-600",
    textAccent: "text-cyan-400",
    icon: "🎧",
    title: "Support Team",
    subtitle: "Always here to help you succeed"
  },
  events: {
    gradient: "from-pink-950/50 via-rose-900/40 to-orange-900/30",
    border: "border-pink-500/20 hover:border-pink-400/40",
    glow: "hover:shadow-[0_0_40px_rgba(236,72,153,0.15)]",
    accent: "from-pink-500 to-rose-600",
    textAccent: "text-pink-400",
    icon: "🎉",
    title: "Events Team",
    subtitle: "Creating unforgettable experiences"
  }
};

const Staff = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isApplicationOpen, setIsApplicationOpen] = useStateAlias(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPositions, setOpenPositions] = useState("7");
  const { isOnline, getLastSeen, onlineStatus } = useStaffOnlineStatus();
  const { favorites, toggleFavorite, isFavorite } = useFavoriteStaff();

  // Enable notifications for favorite staff
  useFavoriteStaffNotifications(favorites, onlineStatus);

  useEffect(() => {
    loadStaffMembers();
    loadOpenPositions();
  }, []);

  const loadOpenPositions = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "open_positions")
        .single();
      
      if (data) {
        setOpenPositions(data.value);
      }
    } catch (error) {
      console.error("Error loading open positions:", error);
    }
  };

  const loadStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("staff_members_public")
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

  const getStaffByDepartment = (dept: string) => staffMembers.filter((m) => m.department === dept);

  const handleStaffClick = (id: string) => {
    navigate(`/staff/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader
          title="Meet Our Elite Team"
          description="Passionate professionals dedicated to creating the most immersive and professional roleplay experience"
          badge="24/7 Available"
          backgroundImage={headerStaff}
        />
        <main className="pb-16">
          <div className="container mx-auto px-4">
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gradient mb-8 text-center">Loading Team Members...</h2>
              <StaffCardsSkeletonGrid count={6} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // If no staff in database, show all sections with placeholder message
  const leadershipStaff = getStaffByDepartment("leadership");
  const adminStaff = getStaffByDepartment("administration");
  const developerStaff = getStaffByDepartment("development");
  const moderatorStaff = getStaffByDepartment("moderation");

  // General staff team (display_order 36-38)
  const generalStaff = staffMembers.filter(
    (m) => m.display_order >= 36 && m.display_order <= 38 && m.role_type === "staff",
  );

  // Support team (display_order 40-42)
  const supportStaff = staffMembers.filter((m) => m.display_order >= 40 && m.display_order <= 42);

  const eventStaff = getStaffByDepartment("events");

  const hasAnyStaff = staffMembers.length > 0;

  const getAchievementBadges = (member: StaffMember) => {
    const badges = [];

    // Based on responsibilities or role, add achievement badges
    if (member.responsibilities.some((r) => r.toLowerCase().includes("lead") || r.toLowerCase().includes("manager"))) {
      badges.push({ label: "Team Lead", color: "bg-purple-500" });
    }
    if (member.role_type === "owner") {
      badges.push({ label: "Founder", color: "bg-primary" });
    }
    if (member.responsibilities.length >= 5) {
      badges.push({ label: "Multi-Skilled", color: "bg-blue-500" });
    }
    if (member.role_type === "developer") {
      badges.push({ label: "Tech Expert", color: "bg-green-500" });
    }
    if (member.department === "support") {
      badges.push({ label: "Helper", color: "bg-orange-500" });
    }

    return badges.slice(0, 2); // Max 2 badges per card
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
        delay: index * 0.1,
      },
    }),
  };

  const renderStaffCard = (member: StaffMember, index: number) => {
    const Icon = roleIcons[member.role_type as keyof typeof roleIcons] || UserCheck;
    const achievements = getAchievementBadges(member);
    // Online status not available from public view for privacy
    const staffIsOnline = false;
    const lastSeenTime = null;

    return (
      <motion.div
        key={member.id}
        className="relative group"
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        custom={index}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"></div>
        <Card className="relative glass-effect border-border/20 hover:border-primary/50 transition-all duration-300 overflow-hidden group-hover:scale-[1.03] group-hover:shadow-xl group-hover:shadow-primary/20 group-hover:-translate-y-2 cursor-pointer">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-primary group-hover:h-2 transition-all duration-300"></div>

          {/* Achievement Badges */}
          {achievements.length > 0 && (
            <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
              {achievements.map((badge, idx) => (
                <Badge 
                  key={idx} 
                  className={`${badge.color} text-white text-xs px-2 py-0.5 shadow-lg border-0 group-hover:scale-110 transition-transform duration-300`}
                  style={{ transitionDelay: `${idx * 50}ms` }}
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}

          {/* Favorite Button */}
          <div className="absolute top-3 left-3 z-10">
            <FavoriteStaffButton isFavorite={isFavorite(member.id)} onToggle={() => toggleFavorite(member.id)} />
          </div>

          <CardContent className="pt-5 pb-4">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full blur-lg animate-pulse group-hover:blur-xl group-hover:scale-110 transition-all duration-500"></div>
                <div
                  className={`relative w-20 h-20 rounded-full overflow-hidden border-3 ${roleColors[member.role_type as keyof typeof roleColors]} p-0.5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
                >
                  <img
                    src={member.discord_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                    alt={member.name}
                    className="w-full h-full rounded-full bg-background group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-9 h-9 ${roleColors[member.role_type as keyof typeof roleColors]} rounded-full flex items-center justify-center border-3 border-background shadow-lg group-hover:scale-125 group-hover:rotate-12 transition-all duration-300`}
                >
                  <Icon className="w-4 h-4 text-primary-foreground" />
                </div>
                {/* Online Status Indicator */}
                <div className="absolute -top-1 -left-1">
                  <StaffOnlineIndicator isOnline={staffIsOnline} lastSeen={lastSeenTime} size="lg" />
                </div>
              </div>

              <h3 className="text-lg font-bold mb-1.5 group-hover:text-primary transition-colors duration-300">{member.name}</h3>
              <Badge variant="outline" className="mb-1.5 border-primary text-primary px-3 py-0.5 text-xs group-hover:bg-primary/10 group-hover:scale-105 transition-all duration-300">
                {member.role}
              </Badge>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-xs group-hover:bg-secondary/80 transition-colors duration-300">
                  {member.department.replace("_", " ").toUpperCase()}
                </Badge>
                <StaffOnlineIndicator isOnline={staffIsOnline} lastSeen={lastSeenTime} showLabel size="sm" />
              </div>

              {member.bio && (
                <p className="text-xs text-muted-foreground italic mb-4 max-w-xs leading-relaxed line-clamp-2 group-hover:text-foreground/70 transition-colors duration-300">
                  &quot;{member.bio}&quot;
                </p>
              )}

              <div className="w-full space-y-3">
                {/* View Profile Button */}
                <Button
                  className="w-full bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary border border-primary/20 transition-all duration-300 group-hover:bg-primary/20 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStaffClick(member.id);
                  }}
                >
                  <UserCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="group-hover:tracking-wide transition-all duration-300">View Full Profile</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
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
          {/* Hero Stats Section */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scrollRevealVariants}
            className="mb-16"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950/60 via-purple-900/50 to-fuchsia-900/40 p-8 md:p-12 border border-violet-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 opacity-50"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-10">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-block mb-4"
                  >
                    <span className="text-7xl">👥</span>
                  </motion.div>
                  <h2 className="text-3xl md:text-4xl font-black mb-4 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-400 bg-clip-text text-transparent">
                    The Team Behind SLRP
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Meet our dedicated team of professionals working around the clock to bring you the best roleplay experience
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="group"
                  >
                    <div className="relative bg-gradient-to-br from-amber-950/60 to-orange-900/40 rounded-2xl p-6 border border-amber-500/30 hover:border-amber-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(251,191,36,0.2)] hover:scale-105">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/25 mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Users className="w-7 h-7 text-white" />
                        </div>
                        <div className="text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-1">{staffMembers.length}+</div>
                        <div className="text-sm text-amber-300/80">Team Members</div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="group"
                  >
                    <div className="relative bg-gradient-to-br from-emerald-950/60 to-green-900/40 rounded-2xl p-6 border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:scale-105">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/25 mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Clock className="w-7 h-7 text-white" />
                        </div>
                        <div className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-1">24/7</div>
                        <div className="text-sm text-emerald-300/80">Staff Coverage</div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="group"
                  >
                    <div className="relative bg-gradient-to-br from-cyan-950/60 to-sky-900/40 rounded-2xl p-6 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:scale-105">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/25 mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Briefcase className="w-7 h-7 text-white" />
                        </div>
                        <div className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-sky-400 bg-clip-text text-transparent mb-1">{openPositions}</div>
                        <div className="text-sm text-cyan-300/80">Open Positions</div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Team Values */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scrollRevealVariants}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <span className="text-5xl mb-4 block">✨</span>
              <h2 className="text-4xl font-black bg-gradient-to-r from-amber-400 via-pink-400 to-violet-400 bg-clip-text text-transparent mb-4">Our Core Values</h2>
              <p className="text-lg text-muted-foreground">The principles that guide our team every day</p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="group"
              >
                <Card className="h-full bg-gradient-to-br from-amber-950/50 to-orange-900/30 border-amber-500/20 hover:border-amber-400/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(251,191,36,0.15)] overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  <CardContent className="pt-8 pb-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/25 mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-amber-300">Excellence</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Striving for the highest quality in everything we do
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="group"
              >
                <Card className="h-full bg-gradient-to-br from-pink-950/50 to-rose-900/30 border-pink-500/20 hover:border-pink-400/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-rose-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  <CardContent className="pt-8 pb-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-2xl shadow-lg shadow-pink-500/25 mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-pink-300">Community First</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Your experience and satisfaction is our priority
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="group"
              >
                <Card className="h-full bg-gradient-to-br from-emerald-950/50 to-green-900/30 border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  <CardContent className="pt-8 pb-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/25 mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-emerald-300">Fair Play</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Maintaining integrity and fairness for all players
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="group"
              >
                <Card className="h-full bg-gradient-to-br from-violet-950/50 to-purple-900/30 border-violet-500/20 hover:border-violet-400/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  <CardContent className="pt-8 pb-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/25 mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-violet-300">Innovation</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Constantly improving with new features and updates
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
          {/* Leadership Team */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scrollRevealVariants}
            className="mb-16"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-950/40 via-orange-900/30 to-yellow-900/20 p-8 border border-amber-500/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-3xl"></div>
              <div className="text-center mb-10">
                <span className="text-5xl mb-4 block">👑</span>
                <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-3">Leadership Team</h2>
                <p className="text-lg text-amber-200/70">The visionaries guiding SLRP to excellence</p>
              </div>
              {leadershipStaff.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {leadershipStaff.map((member, index) => renderStaffCard(member, index))}
                </div>
              ) : (
                <Card className="bg-amber-950/30 border-amber-500/20 max-w-2xl mx-auto">
                  <CardContent className="p-8 text-center">
                    <Shield className="w-12 h-12 text-amber-400/50 mx-auto mb-4" />
                    <p className="text-amber-300/60">No leadership team members added yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>

          {/* Management Team */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scrollRevealVariants}
            className="mb-16"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-950/40 via-rose-900/30 to-pink-900/20 p-8 border border-red-500/20">
              <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-3xl"></div>
              <div className="text-center mb-10">
                <span className="text-5xl mb-4 block">🛡️</span>
                <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-red-400 via-rose-400 to-pink-400 bg-clip-text text-transparent mb-3">Management Team</h2>
                <p className="text-lg text-red-200/70">Ensuring smooth server operations</p>
              </div>
              {adminStaff.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {adminStaff.map((member, index) => renderStaffCard(member, index))}
                </div>
              ) : (
                <Card className="bg-red-950/30 border-red-500/20 max-w-2xl mx-auto">
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 text-red-400/50 mx-auto mb-4" />
                    <p className="text-red-300/60">No management team members added yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>

          {/* Development Team */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scrollRevealVariants}
            className="mb-16"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/40 via-green-900/30 to-teal-900/20 p-8 border border-emerald-500/20">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-emerald-500/10 to-transparent rounded-full blur-3xl"></div>
              <div className="text-center mb-10">
                <span className="text-5xl mb-4 block">💻</span>
                <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent mb-3">Development Team</h2>
                <p className="text-lg text-emerald-200/70">Building innovative features and experiences</p>
              </div>
              {developerStaff.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {developerStaff.map((member, index) => renderStaffCard(member, index))}
                </div>
              ) : (
                <Card className="bg-emerald-950/30 border-emerald-500/20 max-w-2xl mx-auto">
                  <CardContent className="p-8 text-center">
                    <Code className="w-12 h-12 text-emerald-400/50 mx-auto mb-4" />
                    <p className="text-emerald-300/60">No development team members added yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>

          {/* Administration Team */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scrollRevealVariants}
            className="mb-16"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950/40 via-indigo-900/30 to-violet-900/20 p-8 border border-blue-500/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl"></div>
              <div className="text-center mb-10">
                <span className="text-5xl mb-4 block">⚖️</span>
                <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent mb-3">Administration Team</h2>
                <p className="text-lg text-blue-200/70">Keeping the community safe and fair</p>
              </div>
              {moderatorStaff.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {moderatorStaff.map((member, index) => renderStaffCard(member, index))}
                </div>
              ) : (
                <Card className="bg-blue-950/30 border-blue-500/20 max-w-2xl mx-auto">
                  <CardContent className="p-8 text-center">
                    <HeadphonesIcon className="w-12 h-12 text-blue-400/50 mx-auto mb-4" />
                    <p className="text-blue-300/60">No administration team members added yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>

          {/* Staff Team */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scrollRevealVariants}
            className="mb-16"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-950/40 via-violet-900/30 to-fuchsia-900/20 p-8 border border-purple-500/20">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
              <div className="text-center mb-10">
                <span className="text-5xl mb-4 block">⭐</span>
                <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-3">Staff Team</h2>
                <p className="text-lg text-purple-200/70">Core team members providing essential services</p>
              </div>
              {generalStaff.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {generalStaff.map((member, index) => renderStaffCard(member, index))}
                </div>
              ) : (
                <Card className="bg-purple-950/30 border-purple-500/20 max-w-2xl mx-auto">
                  <CardContent className="p-8 text-center">
                    <UserCheck className="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
                    <p className="text-purple-300/60">No staff team members added yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>

          {/* Support Team */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scrollRevealVariants}
            className="mb-16"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-950/40 via-sky-900/30 to-blue-900/20 p-8 border border-cyan-500/20">
              <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl"></div>
              <div className="text-center mb-10">
                <span className="text-5xl mb-4 block">🎧</span>
                <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400 bg-clip-text text-transparent mb-3">Support Team</h2>
                <p className="text-lg text-cyan-200/70">Always here to help you succeed</p>
              </div>
              {supportStaff.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {supportStaff.map((member, index) => renderStaffCard(member, index))}
                </div>
              ) : (
                <Card className="bg-cyan-950/30 border-cyan-500/20 max-w-2xl mx-auto">
                  <CardContent className="p-8 text-center">
                    <HeadphonesIcon className="w-12 h-12 text-cyan-400/50 mx-auto mb-4" />
                    <p className="text-cyan-300/60">No support team members added yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>

          {/* Events Team */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scrollRevealVariants}
            className="mb-16"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-950/40 via-rose-900/30 to-orange-900/20 p-8 border border-pink-500/20">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-pink-500/10 to-transparent rounded-full blur-3xl"></div>
              <div className="text-center mb-10">
                <span className="text-5xl mb-4 block">🎉</span>
                <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 bg-clip-text text-transparent mb-3">Events Team</h2>
                <p className="text-lg text-pink-200/70">Creating unforgettable experiences</p>
              </div>
              {eventStaff.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {eventStaff.map((member, index) => renderStaffCard(member, index))}
                </div>
              ) : (
                <Card className="bg-pink-950/30 border-pink-500/20 max-w-2xl mx-auto">
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-12 h-12 text-pink-400/50 mx-auto mb-4" />
                    <p className="text-pink-300/60">No events team members added yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>

          {/* Join the Team CTA */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scrollRevealVariants}
            className="mt-20"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950/60 via-fuchsia-900/50 to-amber-900/40 p-8 md:p-12 border border-violet-500/30">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-amber-500/5 opacity-50"></div>
              <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-tl from-violet-500/10 to-transparent rounded-full blur-3xl"></div>
              
              <div className="relative z-10 text-center max-w-2xl mx-auto">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="inline-block mb-6"
                >
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-4xl shadow-lg shadow-violet-500/30 mx-auto group-hover:scale-110 transition-transform">
                    🚀
                  </div>
                </motion.div>
                <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-400 bg-clip-text text-transparent mb-4">Want to Join Our Team?</h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  We're always looking for passionate individuals to help make SLRP the best roleplay community. If
                  you're dedicated, responsible, and love helping others, we'd love to hear from you!
                </p>
                <Button 
                  size="lg" 
                  onClick={() => setIsApplicationOpen(true)} 
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-105 px-8"
                >
                  <Award className="w-5 h-5 mr-2" />
                  Apply Now
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Staff;
