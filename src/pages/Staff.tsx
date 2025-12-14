import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerStaff from "@/assets/header-staff.jpg";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  X,
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
  discord_id?: string;
  discord_username?: string;
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

const roleBanners = {
  owner: "bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500",
  admin: "bg-gradient-to-r from-red-500 via-rose-500 to-pink-500",
  moderator: "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500",
  developer: "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500",
  staff: "bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500",
  event_manager: "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500",
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
    title: "Administration Team",
    subtitle: "Keeping the community safe and fair"
  },
  management: {
    gradient: "from-violet-950/50 via-purple-900/40 to-fuchsia-900/30",
    border: "border-violet-500/20 hover:border-violet-400/40",
    glow: "hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]",
    accent: "from-violet-500 to-purple-600",
    textAccent: "text-violet-400",
    icon: "📋",
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
    title: "Moderation Team",
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
  const [selectedAvatar, setSelectedAvatar] = useState<{ url: string; name: string } | null>(null);
  const { isOnline, getLastSeen, getStatus, onlineStatus, onlineCount } = useStaffOnlineStatus();
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
  const adminStaff = getStaffByDepartment("management");
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
    const bannerClass = roleBanners[member.role_type as keyof typeof roleBanners] || "bg-gradient-to-r from-primary to-primary/70";
    const achievements = getAchievementBadges(member);
    const staffIsOnline = isOnline(member.id);
    const lastSeenTime = getLastSeen(member.id);
    const staffStatus = getStatus(member.id);

    return (
      <motion.div
        key={member.id}
        className="relative group cursor-pointer h-full"
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        custom={index}
        whileHover={{ y: -8, rotateY: 2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleStaffClick(member.id)}
        style={{ perspective: 1000 }}
      >
        {/* Outer glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-b from-primary/20 via-transparent to-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
        
        {/* Card Container */}
        <div className="relative h-full bg-gradient-to-b from-card via-card/95 to-card/90 backdrop-blur-xl border border-border/40 rounded-2xl overflow-hidden group-hover:border-primary/40 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-primary/10">
          
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.15),transparent_50%)]" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/5 to-transparent" />
          </div>
          
          {/* Top decorative banner - neutral */}
          <div className="relative h-20 bg-muted/50 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:200%_200%] group-hover:animate-shimmer" />
            {/* Decorative pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,hsl(var(--foreground)/0.1),transparent_40%)]" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,hsl(var(--foreground)/0.05),transparent_60%)]" />
            </div>
            {/* Role label */}
            <div className="absolute bottom-2 left-3 px-2 py-0.5 bg-background/40 backdrop-blur-sm rounded text-[10px] font-bold text-muted-foreground uppercase tracking-wider border border-border/30">
              {member.role_type.replace("_", " ")}
            </div>
          </div>
          
          {/* Online Status Badge - Top Right */}
          <div className="absolute top-3 right-3 z-20">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 + 0.2 }}
            >
              <StaffOnlineIndicator isOnline={staffIsOnline} lastSeen={lastSeenTime} status={staffStatus} size="lg" showLabel />
            </motion.div>
          </div>
          
          {/* Favorite Button - Top Left */}
          <div className="absolute top-3 left-3 z-20" onClick={(e) => e.stopPropagation()}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 + 0.1 }}
            >
              <FavoriteStaffButton isFavorite={isFavorite(member.id)} onToggle={() => toggleFavorite(member.id)} />
            </motion.div>
          </div>

          <div className="relative px-5 pb-5 -mt-8">
            <div className="flex flex-col items-center text-center">
              {/* Avatar with enhanced design */}
              <motion.div 
                className="relative mb-4 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedAvatar({
                    url: member.discord_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`,
                    name: member.name
                  });
                }}
              >
                {/* Outer ring with animation */}
                <div className="absolute -inset-2 bg-gradient-to-b from-primary/30 to-primary/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Avatar ring */}
                <div className="relative w-20 h-20 rounded-full p-1 bg-gradient-to-b from-primary via-primary/70 to-primary/40 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow duration-300">
                  <div className="w-full h-full rounded-full overflow-hidden bg-background ring-2 ring-background">
                    <img
                      src={member.discord_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </div>
                
                {/* Role Icon Badge */}
                <motion.div 
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-b from-primary to-primary/80 rounded-lg flex items-center justify-center border-2 border-background shadow-lg"
                  whileHover={{ scale: 1.15, rotate: 5 }}
                >
                  <Icon className="w-4 h-4 text-primary-foreground" />
                </motion.div>
              </motion.div>

              {/* Name */}
              <h3 className="text-lg font-bold text-foreground mb-0.5 group-hover:text-primary transition-colors duration-300 tracking-tight">
                {member.name}
              </h3>
              
              {/* Role */}
              <span className="text-sm font-semibold text-primary/90 mb-2 group-hover:text-primary transition-colors duration-300">
                {member.role}{member.department === "leadership" && " / Founder"}
              </span>

              {/* Discord Username */}
              {member.discord_username && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#5865F2] mb-1.5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span className="truncate max-w-[120px]">{member.discord_username}</span>
                </div>
              )}

              {/* Department Badge */}
              <Badge variant="outline" className="bg-muted/30 text-muted-foreground text-[10px] px-2.5 py-0.5 border-border/50 mb-3 uppercase tracking-wider">
                {member.department.replace("_", " ")}
              </Badge>
              
              {/* Achievement Badges */}
              {achievements.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                  {achievements.map((badge, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 + 0.3 }}
                    >
                      <Badge 
                        variant="outline"
                        className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 border-primary/30 font-medium"
                      >
                        {badge.label}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Bio */}
              {member.bio && (
                <p className="text-xs text-muted-foreground italic mb-3 max-w-[200px] leading-relaxed line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                  &quot;{member.bio}&quot;
                </p>
              )}

              {/* Responsibilities */}
              {member.responsibilities && member.responsibilities.length > 0 && (
                <div className="w-full mb-3">
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {member.responsibilities.slice(0, 4).map((resp, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-3 py-1 bg-background/50 text-muted-foreground rounded-full border border-border/30 font-medium"
                      >
                        {resp}
                      </span>
                    ))}
                    {member.responsibilities.length > 4 && (
                      <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20 font-medium">
                        +{member.responsibilities.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* View Profile Button */}
              <motion.div 
                className="mt-auto pt-3 w-full border-t border-border/30"
                initial={{ opacity: 0.7 }}
                whileHover={{ opacity: 1 }}
              >
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground group-hover:text-primary transition-all duration-300">
                  <UserCircle className="w-4 h-4" />
                  <span>View Full Profile</span>
                  <motion.span
                    className="text-primary"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    →
                  </motion.span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
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
          {/* Stats Section */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scrollRevealVariants}
            className="mb-16"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {/* Team Members */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                className="group cursor-pointer"
              >
                <div className="relative bg-gradient-to-b from-card to-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-5 text-center group-hover:border-primary/40 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-colors duration-300 border border-primary/20">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-0.5">{staffMembers.length}+</div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Team Members</div>
                  </div>
                </div>
              </motion.div>

              {/* Staff Online */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                className="group cursor-pointer"
              >
                <div className="relative bg-gradient-to-b from-card to-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-5 text-center group-hover:border-primary/40 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-colors duration-300 border border-primary/20 relative">
                      <UserCheck className="w-6 h-6 text-primary" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-card" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-0.5">{onlineCount}</div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Online Now</div>
                  </div>
                </div>
              </motion.div>

              {/* 24/7 Coverage */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                className="group cursor-pointer"
              >
                <div className="relative bg-gradient-to-b from-card to-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-5 text-center group-hover:border-primary/40 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-colors duration-300 border border-primary/20">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-0.5">24/7</div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Staff Coverage</div>
                  </div>
                </div>
              </motion.div>

              {/* Open Positions */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                className="group cursor-pointer"
                onClick={() => setIsApplicationOpen(true)}
              >
                <div className="relative bg-gradient-to-b from-card to-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-5 text-center group-hover:border-primary/40 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-colors duration-300 border border-primary/20">
                      <Briefcase className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-0.5">{openPositions}</div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Open Positions</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Core Values */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scrollRevealVariants}
            className="mb-20"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground mb-2">Our Core Values</h2>
              <p className="text-muted-foreground">The principles that guide our team every day</p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { icon: Star, title: "Excellence", desc: "Striving for the highest quality" },
                { icon: Heart, title: "Community First", desc: "Your experience is our priority" },
                { icon: Trophy, title: "Fair Play", desc: "Maintaining integrity for all" },
                { icon: Target, title: "Innovation", desc: "Constantly improving" },
              ].map((value, idx) => (
                <motion.div
                  key={value.title}
                  whileHover={{ y: -4 }}
                  className="group cursor-pointer"
                >
                  <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 text-center group-hover:border-primary/30 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/5">
                    <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                      <value.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{value.title}</h3>
                    <p className="text-xs text-muted-foreground">{value.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Department Sections - Clean unified design */}
          {[
            { key: "leadership", title: "Leadership Team", subtitle: "The visionaries guiding SLRP to excellence", icon: Shield, staff: leadershipStaff, centerSingle: true },
            { key: "management", title: "Management Team", subtitle: "Ensuring smooth server operations", icon: Users, staff: adminStaff, centerSingle: false },
            { key: "development", title: "Development Team", subtitle: "Building innovative features", icon: Code, staff: developerStaff, centerSingle: true },
            { key: "moderation", title: "Administration Team", subtitle: "Keeping the community safe and fair", icon: HeadphonesIcon, staff: moderatorStaff, centerSingle: false },
            { key: "staff", title: "Staff Team", subtitle: "Core team members providing essential services", icon: UserCheck, staff: generalStaff, centerSingle: false },
            { key: "support", title: "Support Team", subtitle: "Always here to help you succeed", icon: HeadphonesIcon, staff: supportStaff, centerSingle: false },
            { key: "events", title: "Events Team", subtitle: "Creating unforgettable experiences", icon: Calendar, staff: eventStaff, centerSingle: false },
          ].map((dept, deptIdx) => (
            <motion.div
              key={dept.key}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scrollRevealVariants}
              className="mb-12"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-xl mb-4">
                  <dept.icon className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{dept.title}</h2>
                <p className="text-muted-foreground">{dept.subtitle}</p>
              </div>
              
              {dept.staff.length > 0 ? (
                <div className={`${dept.centerSingle && dept.staff.length === 1 ? 'flex justify-center' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'}`}>
                  {dept.staff.map((member, index) => (
                    <div key={member.id} className={dept.centerSingle && dept.staff.length === 1 ? 'w-full max-w-sm' : ''}>
                      {renderStaffCard(member, index)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card/40 border border-border/50 rounded-xl p-8 text-center max-w-md mx-auto">
                  <dept.icon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No {dept.title.toLowerCase()} members added yet</p>
                </div>
              )}
            </motion.div>
          ))}

          {/* Join the Team CTA */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scrollRevealVariants}
            className="mt-16"
          >
            <div 
              className="relative bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-8 md:p-12 text-center cursor-pointer group hover:border-primary/30 transition-all duration-300"
              onClick={() => setIsApplicationOpen(true)}
            >
              <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Want to Join Our Team?</h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                We're always looking for passionate individuals to help make SLRP the best roleplay community.
              </p>
              <Button size="lg" className="group-hover:scale-105 transition-transform duration-300">
                <Award className="w-5 h-5 mr-2" />
                Apply Now
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Profile Picture Lightbox Modal */}
      <Dialog open={!!selectedAvatar} onOpenChange={() => setSelectedAvatar(null)}>
        <DialogContent className="max-w-md p-0 bg-transparent border-none shadow-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative"
          >
            <button
              onClick={() => setSelectedAvatar(null)}
              className="absolute -top-10 right-0 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
            <div className="rounded-2xl overflow-hidden border-4 border-primary/30 shadow-2xl shadow-primary/20">
              <img
                src={selectedAvatar?.url}
                alt={selectedAvatar?.name || "Staff member"}
                className="w-full h-auto max-h-[80vh] object-contain bg-background"
              />
            </div>
            {selectedAvatar?.name && (
              <p className="text-center mt-4 text-lg font-semibold text-foreground bg-background/80 backdrop-blur-sm py-2 px-4 rounded-lg mx-auto w-fit">
                {selectedAvatar.name}
              </p>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Staff;
