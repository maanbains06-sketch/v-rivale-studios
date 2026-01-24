import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Loader2, 
  Building2, 
  UtensilsCrossed, 
  Wrench, 
  Car,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  User,
  Phone,
  FileText,
  DollarSign,
  Users,
  Target,
  Lightbulb,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  FolderClosed,
  ArrowLeft,
  PartyPopper
} from "lucide-react";
import { motion } from "framer-motion";
import headerAdminBg from "@/assets/header-staff.jpg";

interface BusinessApplication {
  id: string;
  user_id: string;
  business_type: string;
  business_name: string;
  owner_name: string;
  phone_number: string;
  previous_experience: string;
  business_plan: string;
  unique_selling_point: string;
  investment_amount: string;
  employee_count: string;
  operating_hours: string;
  target_customers: string;
  why_this_business: string;
  additional_info: string | null;
  discord_id: string | null;
  status: string;
  created_at: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

const businessTypeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  real_estate: { 
    icon: <Building2 className="w-5 h-5" />, 
    label: "Real Estate Agency",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30"
  },
  food_joint: { 
    icon: <UtensilsCrossed className="w-5 h-5" />, 
    label: "Food Joint / Restaurant",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30"
  },
  mechanic_shop: { 
    icon: <Wrench className="w-5 h-5" />, 
    label: "Mechanic Shop",
    color: "bg-green-500/20 text-green-400 border-green-500/30"
  },
  tuner_shop: { 
    icon: <Car className="w-5 h-5" />, 
    label: "Tuner Shop",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30"
  },
  entertainment: { 
    icon: <PartyPopper className="w-5 h-5" />, 
    label: "Entertainment Venue",
    color: "bg-pink-500/20 text-pink-400 border-pink-500/30"
  },
};

const AdminBusinessProposals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [applications, setApplications] = useState<BusinessApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<BusinessApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'on_hold'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const discordId = user.user_metadata?.discord_id;
      let hasAccess = false;

      // Check if user is owner
      const OWNER_DISCORD_ID = "833680146510381097";
      if (discordId === OWNER_DISCORD_ID) {
        hasAccess = true;
      }

      // Check if user is in staff_members table
      if (!hasAccess && discordId && /^\d{17,19}$/.test(discordId)) {
        const { data: staffMember } = await supabase
          .from("staff_members")
          .select("id, is_active")
          .eq("discord_id", discordId)
          .eq("is_active", true)
          .maybeSingle();

        if (staffMember) {
          hasAccess = true;
        }
      }

      // Fallback: check user_roles table
      if (!hasAccess) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .in("role", ["admin", "moderator"])
          .maybeSingle();

        if (roleData) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadApplications();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = useCallback(async () => {
    const { data, error } = await supabase
      .from("business_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading business applications:", error);
      toast({
        title: "Error",
        description: "Failed to load business applications.",
        variant: "destructive",
      });
      return;
    }

    setApplications(data || []);
  }, [toast]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("business_applications")
        .update({
          status: newStatus,
          admin_notes: adminNotes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

        // Send Discord notification via edge function
        if (selectedApp && (newStatus === 'approved' || newStatus === 'rejected')) {
          try {
            await supabase.functions.invoke("send-application-notification", {
              body: {
                applicationType: 'Business',
                applicantName: selectedApp.owner_name,
                applicantDiscordId: selectedApp.discord_id,
                status: newStatus,
                adminNotes: adminNotes || undefined,
              }
            });
          } catch (notifyError) {
            console.warn("Discord notification failed:", notifyError);
          }
        }

      toast({
        title: "Success",
        description: `Application ${newStatus} successfully.`,
      });

      setSelectedApp(null);
      setAdminNotes("");
      await loadApplications();
    } catch (error) {
      console.error("Error updating application:", error);
      toast({
        title: "Error",
        description: "Failed to update application status.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Filter applications
  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.discord_id?.includes(searchQuery) ||
      businessTypeConfig[app.business_type]?.label.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredApps.length / itemsPerPage);
  const paginatedApps = filteredApps.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Status counts
  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    on_hold: applications.filter(a => a.status === 'on_hold').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
            <CheckCircle className="w-3 h-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1">
            <XCircle className="w-3 h-3" />
            Rejected
          </Badge>
        );
      case "on_hold":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1">
            <Clock className="w-3 h-3" />
            On Hold
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1">
            <FolderOpen className="w-3 h-3" />
            Pending
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader
        title="Business Proposals"
        backgroundImage={headerAdminBg}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/admin")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Panel
        </Button>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total", count: statusCounts.all, color: "text-primary", bg: "bg-primary/10" },
            { label: "Pending", count: statusCounts.pending, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Approved", count: statusCounts.approved, color: "text-green-500", bg: "bg-green-500/10" },
            { label: "Rejected", count: statusCounts.rejected, color: "text-red-500", bg: "bg-red-500/10" },
            { label: "On Hold", count: statusCounts.on_hold, color: "text-amber-500", bg: "bg-amber-500/10" },
          ].map((stat) => (
            <Card key={stat.label} className={`${stat.bg} border-none`}>
              <CardContent className="p-4 text-center">
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.count}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by business name, owner, or Discord ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {(['all', 'pending', 'approved', 'rejected', 'on_hold'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setStatusFilter(status);
                      setCurrentPage(1);
                    }}
                  >
                    {status === 'all' ? 'All' : 
                     status === 'on_hold' ? 'On Hold' :
                     status.charAt(0).toUpperCase() + status.slice(1)}
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-background/20 text-xs">
                      {statusCounts[status]}
                    </span>
                  </Button>
                ))}
              </div>

              <Button variant="outline" size="sm" onClick={loadApplications} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Business Proposals
            </CardTitle>
            <CardDescription>
              Click on any proposal to view details and take action
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paginatedApps.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No business proposals found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedApps.map((app, index) => {
                  const config = businessTypeConfig[app.business_type] || {
                    icon: <Building2 className="w-5 h-5" />,
                    label: app.business_type,
                    color: "bg-gray-500/20 text-gray-400 border-gray-500/30"
                  };
                  
                  return (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setSelectedApp(app);
                        setAdminNotes(app.admin_notes || "");
                      }}
                      className="p-4 rounded-xl border border-border/50 hover:border-primary/30 
                                 bg-card/50 hover:bg-card cursor-pointer transition-all duration-200
                                 group hover:shadow-lg hover:shadow-primary/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${config.color}`}>
                          {config.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground truncate">
                              {app.business_name}
                            </h3>
                            <Badge variant="outline" className={config.color}>
                              {config.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {app.owner_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(app.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {getStatusBadge(app.status)}
                          <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredApps.length)} of {filteredApps.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm px-3">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedApp && businessTypeConfig[selectedApp.business_type]?.icon}
              <span>Business Proposal Details</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedApp && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Business Info Header */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-4 rounded-xl ${businessTypeConfig[selectedApp.business_type]?.color || 'bg-gray-500/20'}`}>
                      {businessTypeConfig[selectedApp.business_type]?.icon || <Building2 className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{selectedApp.business_name}</h3>
                      <p className="text-muted-foreground">
                        {businessTypeConfig[selectedApp.business_type]?.label || selectedApp.business_type}
                      </p>
                    </div>
                    <div className="ml-auto">
                      {getStatusBadge(selectedApp.status)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Owner:</span>
                      <span className="font-medium">{selectedApp.owner_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{selectedApp.phone_number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Applied:</span>
                      <span className="font-medium">{new Date(selectedApp.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Application Fields */}
                <div className="grid gap-4">
                  <DetailField 
                    icon={<FileText className="w-4 h-4" />}
                    label="Previous Experience" 
                    value={selectedApp.previous_experience} 
                  />
                  <DetailField 
                    icon={<Lightbulb className="w-4 h-4" />}
                    label="Business Plan" 
                    value={selectedApp.business_plan} 
                  />
                  <DetailField 
                    icon={<Target className="w-4 h-4" />}
                    label="Unique Selling Point" 
                    value={selectedApp.unique_selling_point} 
                  />
                  <DetailField 
                    icon={<Users className="w-4 h-4" />}
                    label="Target Customers" 
                    value={selectedApp.target_customers} 
                  />
                  
                  <div className="grid grid-cols-3 gap-4">
                    <DetailField 
                      icon={<DollarSign className="w-4 h-4" />}
                      label="Investment" 
                      value={selectedApp.investment_amount} 
                    />
                    <DetailField 
                      icon={<Users className="w-4 h-4" />}
                      label="Employees" 
                      value={selectedApp.employee_count} 
                    />
                    <DetailField 
                      icon={<Clock className="w-4 h-4" />}
                      label="Hours" 
                      value={selectedApp.operating_hours} 
                    />
                  </div>
                  
                  <DetailField 
                    icon={<FileText className="w-4 h-4" />}
                    label="Why This Business" 
                    value={selectedApp.why_this_business} 
                  />
                  
                  {selectedApp.additional_info && (
                    <DetailField 
                      icon={<FileText className="w-4 h-4" />}
                      label="Additional Info" 
                      value={selectedApp.additional_info} 
                    />
                  )}
                </div>

                {/* Admin Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Admin Notes</label>
                  <Textarea
                    placeholder="Add notes about this application..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                {selectedApp.status === 'pending' && (
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    <Button
                      onClick={() => handleStatusUpdate(selectedApp.id, 'approved')}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700 gap-2"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate(selectedApp.id, 'rejected')}
                      disabled={processing}
                      variant="destructive"
                      className="gap-2"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate(selectedApp.id, 'on_hold')}
                      disabled={processing}
                      variant="outline"
                      className="gap-2 border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                      Put On Hold
                    </Button>
                  </div>
                )}
                
                {selectedApp.status !== 'pending' && (
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    <Button
                      onClick={() => handleStatusUpdate(selectedApp.id, 'pending')}
                      disabled={processing}
                      variant="outline"
                      className="gap-2"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />}
                      Reopen Application
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper component for detail fields
const DetailField = ({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | null | undefined;
}) => (
  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
      {icon}
      {label}
    </div>
    <p className="text-sm text-foreground whitespace-pre-wrap">{value || 'N/A'}</p>
  </div>
);

export default AdminBusinessProposals;