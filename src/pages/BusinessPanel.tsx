import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDiscordNames } from "@/hooks/useDiscordNames";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Building2, Search, Filter, Download, Eye, CheckCircle, XCircle, 
  Clock, AlertCircle, Briefcase, Store, Wrench, Car, Music
} from "lucide-react";
import { format } from "date-fns";
import headerImage from "@/assets/header-business.jpg";

interface BusinessApplication {
  id: string;
  user_id: string;
  discord_id: string;
  business_type: string;
  business_name: string;
  owner_name: string;
  phone_number: string;
  investment_amount: string;
  target_customers: string;
  business_plan: string;
  previous_experience: string;
  why_this_business: string;
  employee_count: string;
  operating_hours: string;
  unique_selling_point: string;
  additional_info: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const BUSINESS_TYPES = [
  { id: "real-estate", label: "Real Estate", icon: Building2, color: "bg-blue-500" },
  { id: "food-joint", label: "Food Joint", icon: Store, color: "bg-orange-500" },
  { id: "mechanic-shop", label: "Mechanic Shop", icon: Wrench, color: "bg-gray-500" },
  { id: "tuner-shop", label: "Tuner Shop", icon: Car, color: "bg-purple-500" },
  { id: "entertainment", label: "Entertainment", icon: Music, color: "bg-pink-500" },
];

const BusinessPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [applications, setApplications] = useState<BusinessApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<BusinessApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get Discord names for all applications
  const discordIds = applications.map(app => app.discord_id).filter(Boolean);
  const { getDisplayName: getDiscordDisplayName } = useDiscordNames(discordIds);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.rpc("has_panel_access", {
        _user_id: user.id,
        _panel_type: "business"
      });

      if (error) {
        console.error("Error checking access:", error);
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(data === true);
      if (data === true) {
        loadApplications();
      }
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("business_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error loading applications:", error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    }
  };

  const handleReview = async (status: "approved" | "rejected") => {
    if (!selectedApplication) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("business_applications")
        .update({
          status,
          admin_notes: reviewNotes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedApplication.id);

      if (error) throw error;

      await supabase.functions.invoke("send-application-notification", {
        body: {
          applicationType: "business",
          applicationId: selectedApplication.id,
          discordId: selectedApplication.discord_id,
          status,
          notes: reviewNotes,
        },
      });

      toast({
        title: "Success",
        description: `Application ${status}`,
      });

      setSelectedApplication(null);
      setReviewNotes("");
      loadApplications();
    } catch (error) {
      console.error("Error updating application:", error);
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getBusinessIcon = (type: string) => {
    const business = BUSINESS_TYPES.find(b => b.id === type);
    if (!business) return <Briefcase className="h-4 w-4" />;
    const Icon = business.icon;
    return <Icon className="h-4 w-4" />;
  };

  const getDisplayName = (discordId: string) => {
    return getDiscordDisplayName(discordId);
  };

  const filteredApplications = applications.filter(app => {
    const displayName = getDisplayName(app.discord_id);
    const matchesSearch = 
      displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.owner_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesType = activeTab === "all" || app.business_type === activeTab;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  const exportToCSV = () => {
    const headers = ["Discord", "Business Type", "Business Name", "Owner Name", "Status", "Created At"];
    const rows = filteredApplications.map(app => [
      getDisplayName(app.discord_id),
      app.business_type,
      app.business_name,
      app.owner_name,
      app.status,
      format(new Date(app.created_at), "yyyy-MM-dd HH:mm"),
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `business-applications-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
              <p className="text-muted-foreground text-center">
                You don't have permission to access the Business Panel.
              </p>
              <Button onClick={() => navigate("/")} className="mt-4">
                Return Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader 
        title="Business Panel" 
        description="Manage business job applications"
        backgroundImage={headerImage}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or business..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              All
            </TabsTrigger>
            {BUSINESS_TYPES.map(type => (
              <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-2">
                <type.icon className="h-4 w-4" />
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab}>
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Applications ({filteredApplications.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paginatedApplications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No applications found</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Applicant</TableHead>
                          <TableHead>Business</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedApplications.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{getDisplayName(app.discord_id)}</p>
                                <p className="text-sm text-muted-foreground">{app.owner_name}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{app.business_name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getBusinessIcon(app.business_type)}
                                <span className="capitalize">{app.business_type?.replace("-", " ")}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(app.status)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(app.created_at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setReviewNotes(app.admin_notes || "");
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {totalPages > 1 && (
                      <div className="flex justify-center gap-2 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="flex items-center px-4 text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedApplication && getBusinessIcon(selectedApplication.business_type)}
              Business Application Review
            </DialogTitle>
            <DialogDescription>
              {selectedApplication?.business_name} - {selectedApplication && getDisplayName(selectedApplication.discord_id)}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Discord</label>
                  <p className="font-medium">{getDisplayName(selectedApplication.discord_id)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Owner Name</label>
                  <p className="font-medium">{selectedApplication.owner_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Business Type</label>
                  <p className="font-medium capitalize">{selectedApplication.business_type?.replace("-", " ")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                  <p className="font-medium">{selectedApplication.business_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                  <p className="font-medium">{selectedApplication.phone_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Investment Amount</label>
                  <p className="font-medium">{selectedApplication.investment_amount}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Target Customers</label>
                <p className="mt-1 text-sm bg-muted/30 p-3 rounded-md">{selectedApplication.target_customers}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Business Plan</label>
                <p className="mt-1 text-sm bg-muted/30 p-3 rounded-md">{selectedApplication.business_plan}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Previous Experience</label>
                <p className="mt-1 text-sm bg-muted/30 p-3 rounded-md">{selectedApplication.previous_experience}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Employee Count</label>
                  <p className="font-medium">{selectedApplication.employee_count}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Operating Hours</label>
                  <p className="font-medium">{selectedApplication.operating_hours}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Why This Business?</label>
                <p className="mt-1 text-sm bg-muted/30 p-3 rounded-md">{selectedApplication.why_this_business}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Unique Selling Point</label>
                <p className="mt-1 text-sm bg-muted/30 p-3 rounded-md">{selectedApplication.unique_selling_point}</p>
              </div>

              {selectedApplication.additional_info && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Additional Info</label>
                  <p className="mt-1 text-sm bg-muted/30 p-3 rounded-md">{selectedApplication.additional_info}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Review Notes</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes for this application..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedApplication(null)}>
              Close
            </Button>
            {selectedApplication?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleReview("rejected")}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleReview("approved")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessPanel;
