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

  const getRoleGradient = (roleType: string) => {
    const gradients: Record<string, string> = {
      owner: "from-amber-500 via-orange-500 to-yellow-500",
      admin: "from-red-500 via-rose-500 to-pink-500",
      moderator: "from-blue-500 via-indigo-500 to-violet-500",
      developer: "from-emerald-500 via-green-500 to-teal-500",
      staff: "from-purple-500 via-violet-500 to-fuchsia-500",
      event_manager: "from-pink-500 via-rose-500 to-orange-500",
    };
    return gradients[roleType] || "from-primary via-secondary to-primary";
  };

  const getRoleBgGradient = (roleType: string) => {
    const gradients: Record<string, string> = {
      owner: "from-amber-950/80 via-orange-950/60 to-yellow-950/40",
      admin: "from-red-950/80 via-rose-950/60 to-pink-950/40",
      moderator: "from-blue-950/80 via-indigo-950/60 to-violet-950/40",
      developer: "from-emerald-950/80 via-green-950/60 to-teal-950/40",
      staff: "from-purple-950/80 via-violet-950/60 to-fuchsia-950/40",
      event_manager: "from-pink-950/80 via-rose-950/60 to-orange-950/40",
    };
    return gradients[roleType] || "from-slate-950 via-slate-900 to-slate-950";
  };

  const renderStaffCard = (member: StaffMember, index: number) => {
    const Icon = roleIcons[member.role_type as keyof typeof roleIcons] || UserCheck;
    const achievements = getAchievementBadges(member);
    const staffIsOnline = false;
    const lastSeenTime = null;
    const roleGradient = getRoleGradient(member.role_type);
    const roleBgGradient = getRoleBgGradient(member.role_type);

    return (
      <motion.div
        key={member.id}
        className="relative group"
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        custom={index}
        whileHover={{ y: -8, scale: 1.02 }}
      >
        {/* Outer glow effect */}
        <div className={`absolute -inset-1 bg-gradient-to-r ${roleGradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-40 transition-all duration-500`} />
        
        {/* Card Border Gradient */}
        <div className={`relative p-[2px] rounded-2xl bg-gradient-to-br ${roleGradient} shadow-xl group-hover:shadow-2xl transition-shadow duration-300`}>
          <div className={`bg-gradient-to-br ${roleBgGradient} rounded-[14px] overflow-hidden relative`}>
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)`,
                backgroundSize: '20px 20px'
              }} />
            </div>
            
            {/* Shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            {/* Achievement Badges - Floating style */}
            {achievements.length > 0 && (
              <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
                {achievements.map((badge, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 + 0.3 }}
                  >
                    <Badge 
                      className={`${badge.color} text-white text-[10px] px-2 py-1 shadow-lg border-0 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}
                    >
                      ✨ {badge.label}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Favorite Button with glow */}
            <div className="absolute top-3 left-3 z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <FavoriteStaffButton isFavorite={isFavorite(member.id)} onToggle={() => toggleFavorite(member.id)} />
              </div>
            </div>

            <div className="pt-8 pb-6 px-4">
              <div className="flex flex-col items-center text-center">
                {/* Avatar with animated ring */}
                <div className="relative mb-5">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className={`absolute -inset-2 bg-gradient-to-r ${roleGradient} rounded-full opacity-50 blur-sm`}
                  />
                  <div className={`relative w-24 h-24 rounded-full p-1 bg-gradient-to-br ${roleGradient}`}>
                    <div className="w-full h-full rounded-full overflow-hidden bg-background">
                      <img
                        src={member.discord_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  </div>
                  
                  {/* Role Icon Badge */}
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 15 }}
                    className={`absolute -bottom-1 -right-1 w-10 h-10 bg-gradient-to-br ${roleGradient} rounded-xl flex items-center justify-center border-2 border-background shadow-lg`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </motion.div>
                  
                  {/* Online Indicator */}
                  <div className="absolute -top-1 -left-1">
                    <StaffOnlineIndicator isOnline={staffIsOnline} lastSeen={lastSeenTime} size="lg" />
                  </div>
                </div>

                {/* Name with gradient */}
                <h3 className={`text-xl font-black mb-2 bg-gradient-to-r ${roleGradient} bg-clip-text text-transparent`}>
                  {member.name}
                </h3>
                
                {/* Role Badge */}
                <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r ${roleGradient} bg-opacity-20 border border-white/10 mb-3`}>
                  <span className="text-xs font-bold text-white/90">{member.role}</span>
                </div>
                
                {/* Department Tag */}
                <Badge variant="secondary" className="text-[10px] tracking-wider uppercase mb-4 bg-white/5 border-white/10 text-white/70">
                  {member.department.replace("_", " ")}
                </Badge>

                {member.bio && (
                  <p className="text-xs text-white/50 italic mb-5 max-w-xs leading-relaxed line-clamp-2 group-hover:text-white/70 transition-colors duration-300">
                    &quot;{member.bio}&quot;
                  </p>
                )}

                {/* View Profile Button */}
                <motion.div className="w-full" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    className={`w-full bg-gradient-to-r ${roleGradient} hover:opacity-90 text-white font-bold shadow-lg border-0 transition-all duration-300`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStaffClick(member.id);
                    }}
                  >
                    <UserCircle className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Floating Orbs */}
        <motion.div
          animate={{ 
            y: [0, -30, 0],
            x: [0, 15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-10 w-72 h-72 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [0, 40, 0],
            x: [0, -20, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/2 right-20 w-96 h-96 bg-gradient-to-br from-amber-500/15 to-orange-600/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [0, 25, 0],
            x: [0, 10, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-cyan-500/15 to-blue-600/10 rounded-full blur-3xl"
        />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
        
        {/* Diagonal Lines */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 100px, rgba(255,255,255,0.05) 100px, rgba(255,255,255,0.05) 101px)`
        }} />
      </div>

      <Navigation />
      <StaffApplicationForm open={isApplicationOpen} onOpenChange={setIsApplicationOpen} />

      <PageHeader
        title="Meet Our Elite Team"
        description="Passionate professionals dedicated to creating the most immersive and professional roleplay experience"
        badge="24/7 Available"
        backgroundImage={headerStaff}
      />

      <main className="pb-16 relative z-10">
        <div className="container mx-auto px-4">
          {/* Hero Stats Section - Unique Hexagonal Design */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scrollRevealVariants}
            className="mb-20"
          >
            <div className="relative">
              {/* Decorative Corner Elements */}
              <div className="absolute -top-4 -left-4 w-20 h-20 border-l-4 border-t-4 border-violet-500/30 rounded-tl-3xl" />
              <div className="absolute -top-4 -right-4 w-20 h-20 border-r-4 border-t-4 border-fuchsia-500/30 rounded-tr-3xl" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 border-l-4 border-b-4 border-amber-500/30 rounded-bl-3xl" />
              <div className="absolute -bottom-4 -right-4 w-20 h-20 border-r-4 border-b-4 border-cyan-500/30 rounded-br-3xl" />
              
              <div className="relative overflow-hidden rounded-3xl p-1 bg-gradient-to-r from-violet-500/50 via-fuchsia-500/50 to-amber-500/50">
                <div className="bg-gradient-to-br from-slate-950/98 via-violet-950/95 to-slate-950/98 rounded-[22px] p-8 md:p-12">
                  {/* Animated Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                      backgroundSize: '32px 32px'
                    }} />
                  </div>
                  
                  {/* Glowing Orbs */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
                  >
                    <div className="absolute top-0 left-1/2 w-32 h-32 bg-violet-500/20 rounded-full blur-2xl" />
                    <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-fuchsia-500/20 rounded-full blur-2xl" />
                    <div className="absolute top-1/2 left-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl" />
                    <div className="absolute top-1/2 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl" />
                  </motion.div>
                  
                  <div className="relative z-10">
                    <div className="text-center mb-12">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", duration: 1, bounce: 0.5 }}
                        className="inline-block mb-6"
                      >
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-500 rounded-3xl blur-xl opacity-60 animate-pulse" />
                          <div className="relative w-24 h-24 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-amber-600 rounded-3xl flex items-center justify-center shadow-2xl border border-white/20">
                            <span className="text-5xl">👥</span>
                          </div>
                        </div>
                      </motion.div>
                      
                      <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl md:text-5xl font-black mb-4"
                      >
                        <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-400 bg-clip-text text-transparent">
                          The Team Behind SLRP
                        </span>
                      </motion.h2>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-lg text-muted-foreground max-w-2xl mx-auto"
                      >
                        Meet our dedicated team of professionals working around the clock to bring you the best roleplay experience
                      </motion.p>
                    </div>

                    {/* Stats with Unique Hexagonal Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                      {/* Team Members Stat */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
                        whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, type: "spring" }}
                        whileHover={{ scale: 1.05, rotateY: 5 }}
                        className="group perspective-1000"
                      >
                        <div className="relative p-1 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 shadow-lg shadow-amber-500/25 group-hover:shadow-amber-500/40 transition-shadow duration-300">
                          <div className="bg-gradient-to-br from-amber-950 via-orange-950 to-amber-950 rounded-xl p-6 text-center relative overflow-hidden">
                            {/* Animated shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/20 rounded-full blur-2xl" />
                            
                            <div className="relative">
                              <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-300/30"
                              >
                                <Users className="w-8 h-8 text-white" />
                              </motion.div>
                              <div className="text-5xl font-black bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent mb-2">{staffMembers.length}+</div>
                              <div className="text-sm font-semibold text-amber-300/90 tracking-wider uppercase">Team Members</div>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* 24/7 Coverage Stat */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotateY: 0 }}
                        whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, type: "spring" }}
                        whileHover={{ scale: 1.05, rotateY: -5 }}
                        className="group perspective-1000"
                      >
                        <div className="relative p-1 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow duration-300">
                          <div className="bg-gradient-to-br from-emerald-950 via-green-950 to-emerald-950 rounded-xl p-6 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <div className="absolute top-0 left-0 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl" />
                            
                            <div className="relative">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-emerald-300/30"
                              >
                                <Clock className="w-8 h-8 text-white" />
                              </motion.div>
                              <div className="text-5xl font-black bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent mb-2">24/7</div>
                              <div className="text-sm font-semibold text-emerald-300/90 tracking-wider uppercase">Staff Coverage</div>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Open Positions Stat */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotateY: 30 }}
                        whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4, type: "spring" }}
                        whileHover={{ scale: 1.05, rotateY: 5 }}
                        className="group perspective-1000"
                      >
                        <div className="relative p-1 rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-500 shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-500/40 transition-shadow duration-300">
                          <div className="bg-gradient-to-br from-cyan-950 via-sky-950 to-cyan-950 rounded-xl p-6 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <div className="absolute bottom-0 right-0 w-20 h-20 bg-cyan-500/20 rounded-full blur-2xl" />
                            
                            <div className="relative">
                              <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-400 to-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 border border-cyan-300/30"
                              >
                                <Briefcase className="w-8 h-8 text-white" />
                              </motion.div>
                              <div className="text-5xl font-black bg-gradient-to-r from-cyan-300 to-sky-300 bg-clip-text text-transparent mb-2">{openPositions}</div>
                              <div className="text-sm font-semibold text-cyan-300/90 tracking-wider uppercase">Open Positions</div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Team Values - Unique Floating Cards */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scrollRevealVariants}
            className="mb-24"
          >
            <div className="text-center mb-16">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="inline-block mb-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-pink-500 to-violet-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-amber-500 via-pink-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-2xl border border-white/20">
                    <span className="text-4xl">✨</span>
                  </div>
                </div>
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-400 via-pink-400 to-violet-400 bg-clip-text text-transparent mb-4">Our Core Values</h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">The principles that guide our team every day</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Excellence */}
              <motion.div
                initial={{ opacity: 0, y: 50, rotateX: -20 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, type: "spring" }}
                whileHover={{ y: -10, scale: 1.03 }}
                className="group"
              >
                <div className="relative p-[2px] rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 shadow-xl shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all duration-500">
                  <div className="bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 rounded-[22px] p-8 text-center relative overflow-hidden h-full">
                    {/* Animated particles */}
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            y: [100, -20],
                            x: [Math.random() * 100, Math.random() * 100],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                          }}
                          className="absolute w-1 h-1 bg-amber-400 rounded-full"
                          style={{ left: `${Math.random() * 100}%` }}
                        />
                      ))}
                    </div>
                    
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="relative w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/40 border border-amber-300/30"
                    >
                      <Star className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-black text-amber-300 mb-3">Excellence</h3>
                    <p className="text-sm text-amber-200/60 leading-relaxed">
                      Striving for the highest quality in everything we do
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Community First */}
              <motion.div
                initial={{ opacity: 0, y: 50, rotateX: -20 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring" }}
                whileHover={{ y: -10, scale: 1.03 }}
                className="group"
              >
                <div className="relative p-[2px] rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 shadow-xl shadow-pink-500/20 group-hover:shadow-pink-500/40 transition-all duration-500">
                  <div className="bg-gradient-to-br from-pink-950 via-rose-950 to-slate-950 rounded-[22px] p-8 text-center relative overflow-hidden h-full">
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            y: [100, -20],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                          }}
                          className="absolute w-1 h-1 bg-pink-400 rounded-full"
                          style={{ left: `${Math.random() * 100}%` }}
                        />
                      ))}
                    </div>
                    
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="relative w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/40 border border-pink-300/30"
                    >
                      <Heart className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-black text-pink-300 mb-3">Community First</h3>
                    <p className="text-sm text-pink-200/60 leading-relaxed">
                      Your experience and satisfaction is our priority
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Fair Play */}
              <motion.div
                initial={{ opacity: 0, y: 50, rotateX: -20 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, type: "spring" }}
                whileHover={{ y: -10, scale: 1.03 }}
                className="group"
              >
                <div className="relative p-[2px] rounded-3xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 shadow-xl shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-500">
                  <div className="bg-gradient-to-br from-emerald-950 via-green-950 to-slate-950 rounded-[22px] p-8 text-center relative overflow-hidden h-full">
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            y: [100, -20],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                          }}
                          className="absolute w-1 h-1 bg-emerald-400 rounded-full"
                          style={{ left: `${Math.random() * 100}%` }}
                        />
                      ))}
                    </div>
                    
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="relative w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/40 border border-emerald-300/30"
                    >
                      <Trophy className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-black text-emerald-300 mb-3">Fair Play</h3>
                    <p className="text-sm text-emerald-200/60 leading-relaxed">
                      Maintaining integrity and fairness for all players
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Innovation */}
              <motion.div
                initial={{ opacity: 0, y: 50, rotateX: -20 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, type: "spring" }}
                whileHover={{ y: -10, scale: 1.03 }}
                className="group"
              >
                <div className="relative p-[2px] rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-xl shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all duration-500">
                  <div className="bg-gradient-to-br from-violet-950 via-purple-950 to-slate-950 rounded-[22px] p-8 text-center relative overflow-hidden h-full">
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            y: [100, -20],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                          }}
                          className="absolute w-1 h-1 bg-violet-400 rounded-full"
                          style={{ left: `${Math.random() * 100}%` }}
                        />
                      ))}
                    </div>
                    
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="relative w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-violet-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/40 border border-violet-300/30"
                    >
                      <Target className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-black text-violet-300 mb-3">Innovation</h3>
                    <p className="text-sm text-violet-200/60 leading-relaxed">
                      Constantly improving with new features and updates
                    </p>
                  </div>
                </div>
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
