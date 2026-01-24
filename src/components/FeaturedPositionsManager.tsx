import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Flame, 
  Zap, 
  Star, 
  Plus, 
  Pencil, 
  Trash2, 
  GripVertical,
  Eye,
  EyeOff,
  Briefcase,
  Shield,
  RefreshCw,
  Save,
  Monitor,
  Heart,
  Wrench,
  Building2,
  Car,
  Newspaper,
  Gavel,
  Scale,
  UtensilsCrossed,
  PartyPopper
} from "lucide-react";
import FeaturedJobsCarousel from "@/components/FeaturedJobsCarousel";
import { cn } from "@/lib/utils";

interface FeaturedPosition {
  id: string;
  job_id: string;
  name: string;
  description: string | null;
  department: string;
  urgency: "critical" | "high" | "medium";
  spots: number;
  is_hiring: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const urgencyConfig = {
  critical: { label: "Critical", color: "bg-red-500", icon: Flame },
  high: { label: "High Priority", color: "bg-amber-500", icon: Zap },
  medium: { label: "Medium", color: "bg-green-500", icon: Star },
};

const jobOptions = [
  { id: "police", name: "Police Officer", department: "Government" },
  { id: "ems", name: "EMS Paramedic", department: "Government" },
  { id: "firefighter", name: "Firefighter", department: "Government" },
  { id: "mechanic", name: "Mechanic", department: "Government" },
  { id: "pdm", name: "PDM Salesperson", department: "Government" },
  { id: "judge", name: "DOJ - Judge", department: "Government" },
  { id: "lawyer", name: "DOJ - Attorney", department: "Government" },
  { id: "weazel-news", name: "Weazel News Reporter", department: "Media" },
  { id: "state-department", name: "State Department", department: "Government" },
  { id: "business-real-estate", name: "Real Estate Agent", department: "Business" },
  { id: "business-food-joint", name: "Food Service Worker", department: "Business" },
  { id: "business-mechanic", name: "Business Mechanic", department: "Business" },
  { id: "business-tuner", name: "Tuner Specialist", department: "Business" },
  { id: "business-entertainment", name: "Entertainment Staff", department: "Business" },
];

export function FeaturedPositionsManager() {
  const { toast } = useToast();
  const [positions, setPositions] = useState<FeaturedPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<FeaturedPosition | null>(null);
  const [businessJobsHidden, setBusinessJobsHidden] = useState(false);
  const [savingBusinessToggle, setSavingBusinessToggle] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    job_id: "",
    name: "",
    description: "",
    department: "Government",
    urgency: "medium" as "critical" | "high" | "medium",
    spots: 1,
    is_hiring: true,
  });

  useEffect(() => {
    loadPositions();
    loadBusinessJobsSetting();
  }, []);

  const loadPositions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("featured_positions")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setPositions((data as FeaturedPosition[]) || []);
    } catch (error) {
      console.error("Error loading featured positions:", error);
      toast({
        title: "Error",
        description: "Failed to load featured positions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessJobsSetting = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "business_jobs_hidden")
        .single();

      if (!error && data) {
        setBusinessJobsHidden(data.value === "true");
      }
    } catch (error) {
      console.error("Error loading business jobs setting:", error);
    }
  };

  const handleBusinessJobsToggle = async (hidden: boolean) => {
    setSavingBusinessToggle(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({
          key: "business_jobs_hidden",
          value: hidden.toString(),
          description: "Hide business jobs section from non-owner users",
        }, { onConflict: "key" });

      if (error) throw error;
      
      setBusinessJobsHidden(hidden);
      toast({
        title: "Success",
        description: `Business jobs section is now ${hidden ? "hidden" : "visible"} to users`,
      });
    } catch (error) {
      console.error("Error updating business jobs setting:", error);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    } finally {
      setSavingBusinessToggle(false);
    }
  };

  const handleJobSelect = (jobId: string) => {
    const job = jobOptions.find(j => j.id === jobId);
    if (job) {
      setFormData(prev => ({
        ...prev,
        job_id: jobId,
        name: job.name,
        department: job.department,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.job_id || !formData.name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingPosition) {
        const { error } = await supabase
          .from("featured_positions")
          .update({
            job_id: formData.job_id,
            name: formData.name,
            description: formData.description,
            department: formData.department,
            urgency: formData.urgency,
            spots: formData.spots,
            is_hiring: formData.is_hiring,
          })
          .eq("id", editingPosition.id);

        if (error) throw error;
        toast({ title: "Success", description: "Position updated successfully" });
      } else {
        const maxOrder = positions.length > 0 
          ? Math.max(...positions.map(p => p.display_order)) + 1 
          : 1;

        const { error } = await supabase
          .from("featured_positions")
          .insert({
            job_id: formData.job_id,
            name: formData.name,
            description: formData.description,
            department: formData.department,
            urgency: formData.urgency,
            spots: formData.spots,
            is_hiring: formData.is_hiring,
            display_order: maxOrder,
          });

        if (error) throw error;
        toast({ title: "Success", description: "Position added successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      loadPositions();
    } catch (error) {
      console.error("Error saving position:", error);
      toast({
        title: "Error",
        description: "Failed to save position",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (position: FeaturedPosition) => {
    setEditingPosition(position);
    setFormData({
      job_id: position.job_id,
      name: position.name,
      description: position.description || "",
      department: position.department,
      urgency: position.urgency,
      spots: position.spots,
      is_hiring: position.is_hiring,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("featured_positions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Success", description: "Position deleted successfully" });
      loadPositions();
    } catch (error) {
      console.error("Error deleting position:", error);
      toast({
        title: "Error",
        description: "Failed to delete position",
        variant: "destructive",
      });
    }
  };

  const toggleHiring = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("featured_positions")
        .update({ is_hiring: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast({ 
        title: "Success", 
        description: `Hiring ${!currentStatus ? "opened" : "closed"} for this position` 
      });
      loadPositions();
    } catch (error) {
      console.error("Error toggling hiring status:", error);
      toast({
        title: "Error",
        description: "Failed to update hiring status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingPosition(null);
    setFormData({
      job_id: "",
      name: "",
      description: "",
      department: "Government",
      urgency: "medium",
      spots: 1,
      is_hiring: true,
    });
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Map job IDs to icons for preview
  const getJobIcon = (jobId: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      police: <Shield className="w-5 h-5 text-blue-500" />,
      ems: <Heart className="w-5 h-5 text-red-500" />,
      firefighter: <Flame className="w-5 h-5 text-orange-500" />,
      mechanic: <Wrench className="w-5 h-5 text-slate-500" />,
      pdm: <Car className="w-5 h-5 text-purple-500" />,
      judge: <Gavel className="w-5 h-5 text-amber-600" />,
      lawyer: <Scale className="w-5 h-5 text-emerald-500" />,
      "weazel-news": <Newspaper className="w-5 h-5 text-cyan-500" />,
      "state-department": <Building2 className="w-5 h-5 text-indigo-500" />,
      "business-real-estate": <Building2 className="w-5 h-5 text-amber-500" />,
      "business-food-joint": <UtensilsCrossed className="w-5 h-5 text-orange-500" />,
      "business-mechanic": <Wrench className="w-5 h-5 text-slate-500" />,
      "business-tuner": <Car className="w-5 h-5 text-purple-500" />,
      "business-entertainment": <PartyPopper className="w-5 h-5 text-pink-500" />,
    };
    return iconMap[jobId] || <Briefcase className="w-5 h-5 text-primary" />;
  };

  // Map job IDs to images for preview
  const getJobImage = (jobId: string) => {
    const imageMap: Record<string, string> = {
      police: "/placeholder.svg",
      ems: "/placeholder.svg",
      firefighter: "/placeholder.svg",
      mechanic: "/placeholder.svg",
      pdm: "/placeholder.svg",
      judge: "/placeholder.svg",
      lawyer: "/placeholder.svg",
      "weazel-news": "/placeholder.svg",
      "state-department": "/placeholder.svg",
      "business-real-estate": "/placeholder.svg",
      "business-food-joint": "/placeholder.svg",
      "business-mechanic": "/placeholder.svg",
      "business-tuner": "/placeholder.svg",
      "business-entertainment": "/placeholder.svg",
    };
    return imageMap[jobId] || "/placeholder.svg";
  };

  // Generate preview jobs from positions
  const getPreviewJobs = () => {
    return positions
      .filter(p => p.is_hiring)
      .map(position => ({
        id: position.job_id,
        name: position.name,
        icon: getJobIcon(position.job_id),
        image: getJobImage(position.job_id),
        urgency: position.urgency,
        spots: position.spots,
        description: position.description || "Join our team and make a difference in the community.",
        department: position.department,
        color: position.urgency === "critical" ? "red" : position.urgency === "high" ? "amber" : "green",
      }));
  };

  if (loading) {
    return (
      <Card className="glass-effect border-border/20">
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Business Jobs Toggle */}
      <Card className="glass-effect border-border/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Briefcase className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Business Jobs Visibility</CardTitle>
                <CardDescription>Control who can see the Business Jobs section</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {businessJobsHidden ? "Hidden from users" : "Visible to all"}
              </span>
              <Switch
                checked={businessJobsHidden}
                onCheckedChange={handleBusinessJobsToggle}
                disabled={savingBusinessToggle}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            When enabled, the Business Jobs section will be hidden from all users except the owner. 
            Use this to control visibility during maintenance or preparation phases.
          </p>
        </CardContent>
      </Card>

      {/* Featured Positions Management */}
      <Card className="glass-effect border-border/20">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/30 rounded-lg blur-md animate-pulse" />
                <div className="relative p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
                  <Flame className="w-5 h-5 text-red-400" />
                </div>
              </div>
              <div>
                <CardTitle>Featured Positions</CardTitle>
                <CardDescription>Manage urgent job openings displayed in the carousel</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsPreviewOpen(true)}
                disabled={positions.filter(p => p.is_hiring).length === 0}
              >
                <Monitor className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm" onClick={loadPositions}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={openAddDialog} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Position
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Flame className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No featured positions configured</p>
              <Button onClick={openAddDialog} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Position
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Spots</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position, index) => {
                  const urgency = urgencyConfig[position.urgency];
                  const UrgencyIcon = urgency.icon;
                  
                  return (
                    <TableRow key={position.id} className={!position.is_hiring ? "opacity-60" : ""}>
                      <TableCell className="text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{position.name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {position.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{position.department}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(urgency.color, "text-white flex items-center gap-1 w-fit")}>
                          <UrgencyIcon className="w-3 h-3" />
                          {urgency.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{position.spots}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleHiring(position.id, position.is_hiring)}
                          className={cn(
                            "gap-2",
                            position.is_hiring 
                              ? "text-green-500 hover:text-green-600" 
                              : "text-red-500 hover:text-red-600"
                          )}
                        >
                          {position.is_hiring ? (
                            <>
                              <Eye className="w-4 h-4" />
                              Hiring
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Closed
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(position)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(position.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPosition ? "Edit Featured Position" : "Add Featured Position"}
            </DialogTitle>
            <DialogDescription>
              Configure a position to display in the featured jobs carousel
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Job Type</Label>
              <Select value={formData.job_id} onValueChange={handleJobSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job..." />
                </SelectTrigger>
                <SelectContent>
                  {jobOptions.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.name} ({job.department})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Police Officer"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description for the carousel card..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Urgency Level</Label>
                <Select 
                  value={formData.urgency} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, urgency: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">🔥 Critical (Urgent)</SelectItem>
                    <SelectItem value="high">⚡ High Priority</SelectItem>
                    <SelectItem value="medium">⭐ Medium (Now Hiring)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Open Spots</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.spots}
                  onChange={(e) => setFormData(prev => ({ ...prev, spots: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <Label>Currently Hiring</Label>
                <p className="text-xs text-muted-foreground">Show this position in the carousel</p>
              </div>
              <Switch
                checked={formData.is_hiring}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_hiring: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingPosition ? "Update" : "Add"} Position
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Carousel Preview
            </DialogTitle>
            <DialogDescription>
              This is how the featured positions carousel will appear to users on the Jobs page
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 px-2 bg-background/50 rounded-lg border border-border/50">
            {getPreviewJobs().length > 0 ? (
              <FeaturedJobsCarousel 
                jobs={getPreviewJobs()} 
                onSelectJob={(jobId) => {
                  toast({
                    title: "Preview Mode",
                    description: `Clicking "${jobId}" would navigate to the application form`,
                  });
                }} 
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No hiring positions to preview</p>
                <p className="text-sm">Enable hiring for at least one position to see the carousel</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}