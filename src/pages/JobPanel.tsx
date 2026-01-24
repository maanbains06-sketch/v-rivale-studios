import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useJobPanelAccess, DEPARTMENT_INFO, type DepartmentKey } from "@/hooks/useJobPanelAccess";
import { sendDiscordNotification } from "@/lib/discordNotificationSender";
import { ApplicationType } from "@/components/UnifiedApplicationsTable";
import { Shield, RefreshCw, CheckCircle, XCircle, Clock, Eye, AlertTriangle, Briefcase } from "lucide-react";
import headerJobsImg from "@/assets/header-guides-new.jpg";

// Map department keys to ApplicationType for Discord notifications
const deptToApplicationType: Record<DepartmentKey, ApplicationType> = {
  pd: 'police',
  ems: 'ems',
  firefighter: 'firefighter',
  doj: 'judge', // Will be refined based on actual position
  state: 'state',
  mechanic: 'mechanic',
  pdm: 'pdm',
  weazel: 'weazel_news',
};

interface Application {
  id: string;
  discord_username?: string;
  discord_id?: string;
  character_name?: string;
  in_game_name?: string;
  real_name?: string;
  department?: string;
  position?: string;
  status: string;
  created_at: string;
  experience?: string;
  why_join?: string;
  availability?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
  admin_notes?: string;
}

const JobPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasAccess, isOwner, accessibleDepartments, loading: accessLoading, error: accessError } = useJobPanelAccess();
  
  const [applications, setApplications] = useState<Record<DepartmentKey, Application[]>>({
    pd: [], ems: [], firefighter: [], doj: [], state: [], mechanic: [], pdm: [], weazel: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DepartmentKey | ''>('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  // Set initial active tab based on accessible departments
  useEffect(() => {
    if (!accessLoading && accessibleDepartments.length > 0 && !activeTab) {
      setActiveTab(accessibleDepartments[0]);
    }
  }, [accessLoading, accessibleDepartments, activeTab]);

  const loadApplications = useCallback(async () => {
    if (!hasAccess || accessibleDepartments.length === 0) return;

    setLoading(true);
    try {
      const newApplications: Record<DepartmentKey, Application[]> = {
        pd: [], ems: [], firefighter: [], doj: [], state: [], mechanic: [], pdm: [], weazel: []
      };

      // Helper to normalize application data
      const normalizeApp = (app: any, deptName?: string): Application => ({
        id: app.id,
        discord_username: app.discord_username || app.real_name || app.discord_id || 'Unknown',
        discord_id: app.discord_id,
        character_name: app.character_name || app.in_game_name,
        in_game_name: app.in_game_name,
        real_name: app.real_name,
        department: deptName || app.department,
        position: app.position,
        status: app.status,
        created_at: app.created_at,
        experience: app.experience,
        why_join: app.why_join,
        availability: app.availability,
        reviewed_by: app.reviewed_by,
        reviewed_at: app.reviewed_at,
        notes: app.notes,
        admin_notes: app.admin_notes,
      });

      // Load applications for each accessible department
      for (const dept of accessibleDepartments) {
        const info = DEPARTMENT_INFO[dept];
        
        if (info.table === 'job_applications') {
          // Build department filter
          const deptFilters: Record<string, string[]> = {
            pd: ['Police Department'],
            ems: ['Emergency Medical Services'],
            doj: ['DOJ Attorney', 'DOJ Judge'],
            state: ['State Department'],
            mechanic: ['Mechanic'],
          };
          
          const filters = deptFilters[dept] || [];
          if (filters.length === 0) continue;

          // Fetch all job applications and filter client-side to avoid TypeScript issues
          const { data, error } = await supabase
            .from('job_applications')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data) {
            const filtered = (data as any[]).filter(app => 
              filters.includes(app.department)
            );
            newApplications[dept] = filtered.map(app => normalizeApp(app));
          }
        } else if (info.table === 'firefighter_applications') {
          const { data, error } = await supabase
            .from('firefighter_applications')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data) {
            newApplications[dept] = (data as any[]).map(app => normalizeApp(app, 'Fire Department'));
          }
        } else if (info.table === 'pdm_applications') {
          const { data, error } = await supabase
            .from('pdm_applications')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data) {
            newApplications[dept] = (data as any[]).map(app => normalizeApp(app, 'PDM'));
          }
        } else if (info.table === 'weazel_news_applications') {
          const { data, error } = await supabase
            .from('weazel_news_applications')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data) {
            newApplications[dept] = (data as any[]).map(app => normalizeApp(app, 'Weazel News'));
          }
        }
      }

      setApplications(newApplications);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [hasAccess, accessibleDepartments, toast]);

  useEffect(() => {
    if (hasAccess) {
      loadApplications();
    }
  }, [hasAccess, loadApplications]);

  const handleReview = async (appId: string, status: 'approved' | 'rejected', dept: DepartmentKey) => {
    if (!selectedApp) return;
    
    setIsReviewing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const info = DEPARTMENT_INFO[dept];
      
      const updateData = {
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        notes: reviewNotes || null,
      };

      const { data, error } = await supabase
        .from(info.table as any)
        .update(updateData)
        .eq('id', appId)
        .select();

      if (error) throw error;

      // Check if update was blocked by RLS
      if (!data || data.length === 0) {
        throw new Error('Update blocked - insufficient permissions or application not found');
      }

      // Determine the correct application type for Discord notification
      let applicationType: ApplicationType = deptToApplicationType[dept];
      
      // Refine DOJ type based on position
      if (dept === 'doj' && selectedApp.position) {
        if (selectedApp.position.toLowerCase().includes('attorney')) {
          applicationType = 'attorney';
        } else if (selectedApp.position.toLowerCase().includes('judge')) {
          applicationType = 'judge';
        }
      }

      // Send Discord notification
      const applicantName = selectedApp.discord_username || selectedApp.real_name || selectedApp.discord_id || 'Unknown';
      const notificationResult = await sendDiscordNotification({
        applicationType,
        applicantName,
        applicantDiscordId: selectedApp.discord_id,
        status,
        adminNotes: reviewNotes || undefined,
      });

      if (!notificationResult.success) {
        console.warn('Discord notification failed:', notificationResult.error);
      }

      toast({
        title: status === 'approved' ? "Application Approved" : "Application Rejected",
        description: `The application has been ${status}${notificationResult.success ? ' and notification sent' : ''}.`,
      });

      setSelectedApp(null);
      setReviewNotes('');
      loadApplications();
    } catch (error: any) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update application status",
        variant: "destructive",
      });
    } finally {
      setIsReviewing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'on_hold':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />On Hold</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  // Loading state
  if (accessLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader title="Job Panel" description="Loading..." backgroundImage={headerJobsImg} />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  // Access denied
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader title="Job Panel" description="Department Application Management" backgroundImage={headerJobsImg} />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive" className="max-w-lg mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You don't have access to the Job Panel. This panel is only available to users with specific Discord department roles.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader 
        title="Job Panel" 
        description="Review and manage department job applications" 
        backgroundImage={headerJobsImg}
      />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="glass-effect border-border/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Department Applications</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {isOwner ? 'Owner Access - All Departments' : `Access: ${accessibleDepartments.map(d => DEPARTMENT_INFO[d].name).join(', ')}`}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadApplications} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {accessibleDepartments.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>No departments accessible.</AlertDescription>
              </Alert>
            ) : (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DepartmentKey)}>
                <TabsList className="mb-4 flex-wrap h-auto gap-1">
                  {accessibleDepartments.map((dept) => {
                    const info = DEPARTMENT_INFO[dept];
                    const count = applications[dept]?.filter(a => a.status === 'pending').length || 0;
                    return (
                      <TabsTrigger key={dept} value={dept} className="relative">
                        <span className="mr-1">{info.icon}</span>
                        {info.name}
                        {count > 0 && (
                          <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary text-xs">
                            {count}
                          </Badge>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {accessibleDepartments.map((dept) => (
                  <TabsContent key={dept} value={dept}>
                    {loading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : applications[dept]?.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No applications found for {DEPARTMENT_INFO[dept].name}</p>
                      </div>
                    ) : (
                      <div className="rounded-md border border-border/50 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Applicant</TableHead>
                              <TableHead>Character</TableHead>
                              <TableHead>Position</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Submitted</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {applications[dept]?.map((app) => (
                              <TableRow key={app.id}>
                                <TableCell className="font-medium">{app.discord_username || app.discord_id || 'Unknown'}</TableCell>
                                <TableCell>{app.character_name || app.in_game_name || '-'}</TableCell>
                                <TableCell>{app.position || app.department || '-'}</TableCell>
                                <TableCell>{getStatusBadge(app.status)}</TableCell>
                                <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedApp(app);
                                      setReviewNotes(app.notes || app.admin_notes || '');
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Review Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Review</DialogTitle>
            <DialogDescription>
              Review the application details and approve or reject
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Discord Username</label>
                  <p className="font-medium">{selectedApp.discord_username || selectedApp.discord_id || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Character Name</label>
                  <p className="font-medium">{selectedApp.character_name || selectedApp.in_game_name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Department/Position</label>
                  <p className="font-medium">{selectedApp.position || selectedApp.department || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div>{getStatusBadge(selectedApp.status)}</div>
                </div>
              </div>

              {selectedApp.experience && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Experience</label>
                  <p className="mt-1 p-3 bg-muted/30 rounded-lg text-sm">{selectedApp.experience}</p>
                </div>
              )}

              {selectedApp.why_join && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Why Join</label>
                  <p className="mt-1 p-3 bg-muted/30 rounded-lg text-sm">{selectedApp.why_join}</p>
                </div>
              )}

              {selectedApp.availability && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Availability</label>
                  <p className="mt-1 p-3 bg-muted/30 rounded-lg text-sm">{selectedApp.availability}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Review Notes (Optional)</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes for this application..."
                  className="mt-1"
                />
              </div>

              {(selectedApp.status === 'pending' || selectedApp.status === 'on_hold') && (
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => handleReview(selectedApp.id, 'rejected', activeTab as DepartmentKey)}
                    disabled={isReviewing}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  {selectedApp.status !== 'on_hold' && (
                    <Button
                      variant="outline"
                      onClick={() => handleReview(selectedApp.id, 'on_hold' as any, activeTab as DepartmentKey)}
                      disabled={isReviewing}
                      className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Put On Hold
                    </Button>
                  )}
                  <Button
                    onClick={() => handleReview(selectedApp.id, 'approved', activeTab as DepartmentKey)}
                    disabled={isReviewing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobPanel;
