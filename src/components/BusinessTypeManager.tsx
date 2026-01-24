import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Store, Plus, Pencil, Trash2, GripVertical, RefreshCw,
  Building2, Wrench, Car, Music, Briefcase, Coffee, ShoppingBag
} from "lucide-react";

interface BusinessType {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const ICON_OPTIONS = [
  { value: "Building2", label: "Building", icon: Building2 },
  { value: "Store", label: "Store", icon: Store },
  { value: "Wrench", label: "Wrench", icon: Wrench },
  { value: "Car", label: "Car", icon: Car },
  { value: "Music", label: "Music", icon: Music },
  { value: "Briefcase", label: "Briefcase", icon: Briefcase },
  { value: "Coffee", label: "Coffee", icon: Coffee },
  { value: "ShoppingBag", label: "Shopping", icon: ShoppingBag },
];

const COLOR_OPTIONS = [
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-green-500", label: "Green" },
  { value: "bg-red-500", label: "Red" },
  { value: "bg-yellow-500", label: "Yellow" },
  { value: "bg-purple-500", label: "Purple" },
  { value: "bg-pink-500", label: "Pink" },
  { value: "bg-orange-500", label: "Orange" },
  { value: "bg-gray-500", label: "Gray" },
  { value: "bg-teal-500", label: "Teal" },
  { value: "bg-indigo-500", label: "Indigo" },
];

const BusinessTypeManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingType, setEditingType] = useState<BusinessType | null>(null);
  
  // Form state
  const [formName, setFormName] = useState("");
  const [formIcon, setFormIcon] = useState("Briefcase");
  const [formColor, setFormColor] = useState("bg-gray-500");

  useEffect(() => {
    loadBusinessTypes();
  }, []);

  const loadBusinessTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("business_types")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setBusinessTypes(data || []);
    } catch (error) {
      console.error("Error loading business types:", error);
      toast({
        title: "Error",
        description: "Failed to load business types",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a business type name",
        variant: "destructive",
      });
      return;
    }

    try {
      const slug = generateSlug(formName);
      
      if (editingType) {
        // Update existing
        const { error } = await supabase
          .from("business_types")
          .update({
            name: formName,
            slug,
            icon: formIcon,
            color: formColor,
          })
          .eq("id", editingType.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Business type updated",
        });
      } else {
        // Create new
        const maxOrder = Math.max(...businessTypes.map(t => t.display_order), 0);
        
        const { error } = await supabase
          .from("business_types")
          .insert({
            name: formName,
            slug,
            icon: formIcon,
            color: formColor,
            display_order: maxOrder + 1,
          });

        if (error) {
          if (error.code === "23505") {
            toast({
              title: "Error",
              description: "A business type with this name already exists",
              variant: "destructive",
            });
            return;
          }
          throw error;
        }

        toast({
          title: "Success",
          description: "Business type created",
        });
      }

      setShowDialog(false);
      resetForm();
      loadBusinessTypes();
    } catch (error) {
      console.error("Error saving business type:", error);
      toast({
        title: "Error",
        description: "Failed to save business type",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (type: BusinessType) => {
    try {
      const { error } = await supabase
        .from("business_types")
        .update({ is_active: !type.is_active })
        .eq("id", type.id);

      if (error) throw error;

      toast({
        title: type.is_active ? "Disabled" : "Enabled",
        description: `${type.name} has been ${type.is_active ? "disabled" : "enabled"}`,
      });

      loadBusinessTypes();
    } catch (error) {
      console.error("Error toggling business type:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("business_types")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Business type has been deleted",
      });

      loadBusinessTypes();
    } catch (error) {
      console.error("Error deleting business type:", error);
      toast({
        title: "Error",
        description: "Failed to delete business type",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormIcon("Briefcase");
    setFormColor("bg-gray-500");
    setEditingType(null);
  };

  const openEditDialog = (type: BusinessType) => {
    setEditingType(type);
    setFormName(type.name);
    setFormIcon(type.icon);
    setFormColor(type.color);
    setShowDialog(true);
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(i => i.value === iconName);
    if (!iconOption) return <Briefcase className="h-4 w-4" />;
    const Icon = iconOption.icon;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Business Types
            </CardTitle>
            <CardDescription>
              Create and manage business categories for applications
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={loadBusinessTypes}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => {
              resetForm();
              setShowDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Business Type
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : businessTypes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No business types created yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businessTypes.map((type, index) => (
                <TableRow key={type.id}>
                  <TableCell className="text-muted-foreground">
                    <GripVertical className="h-4 w-4 cursor-move" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${type.color}`}>
                        {getIconComponent(type.icon)}
                      </div>
                      <span className="font-medium">{type.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {type.slug}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{type.icon}</Badge>
                  </TableCell>
                  <TableCell>
                    {type.is_active ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={type.is_active}
                        onCheckedChange={() => handleToggleActive(type)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(type)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Business Type?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{type.name}". Existing applications with this type will not be affected.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(type.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              {editingType ? "Edit Business Type" : "Add Business Type"}
            </DialogTitle>
            <DialogDescription>
              {editingType ? "Update the business type details." : "Create a new business category for applications."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Business Type Name</Label>
              <Input
                id="name"
                placeholder="e.g., Restaurant, Car Dealership"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
              {formName && (
                <p className="text-xs text-muted-foreground">
                  Slug: <code className="bg-muted px-1 rounded">{generateSlug(formName)}</code>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={formIcon} onValueChange={setFormIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <Select value={formColor} onValueChange={setFormColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded ${option.value}`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded ${formColor}`}>
                  {getIconComponent(formIcon)}
                </div>
                <span className="font-medium">{formName || "Business Type"}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingType ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BusinessTypeManager;
