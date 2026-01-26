import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Trash2, Star, Edit2 } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface ContractTemplate {
  id: string;
  name: string;
  description: string | null;
  content: Json;
  is_default: boolean | null;
  created_at: string;
}

interface ContractTemplateManagerProps {
  onSelectTemplate: (template: ContractTemplate) => void;
  selectedTemplateId?: string;
}

const ContractTemplateManager = ({ onSelectTemplate, selectedTemplateId }: ContractTemplateManagerProps) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Please enter a template name", variant: "destructive" });
      return;
    }

    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from("contract_templates")
          .update({
            name: formData.name,
            description: formData.description,
          })
          .eq("id", editingTemplate.id);

        if (error) throw error;
        toast({ title: "Template updated successfully" });
      } else {
        const { error } = await supabase
          .from("contract_templates")
          .insert({
            name: formData.name,
            description: formData.description,
            content: {},
            is_default: templates.length === 0,
          });

        if (error) throw error;
        toast({ title: "Template created successfully" });
      }

      setIsDialogOpen(false);
      setEditingTemplate(null);
      setFormData({ name: "", description: "" });
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast({ title: "Failed to save template", variant: "destructive" });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const { error } = await supabase
        .from("contract_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Template deleted" });
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({ title: "Failed to delete template", variant: "destructive" });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Remove default from all templates
      await supabase
        .from("contract_templates")
        .update({ is_default: false })
        .neq("id", "");

      // Set new default
      const { error } = await supabase
        .from("contract_templates")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Default template updated" });
      fetchTemplates();
    } catch (error) {
      console.error("Error setting default:", error);
    }
  };

  const openEditDialog = (template: ContractTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-slate-100 rounded-lg" />;
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Contract Templates
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => { setEditingTemplate(null); setFormData({ name: "", description: "" }); }}>
                <Plus className="h-4 w-4 mr-1" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle className="text-slate-800">
                  {editingTemplate ? "Edit Template" : "Create New Template"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label className="text-slate-700">Template Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Standard Creator Contract"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-700">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this template..."
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleSaveTemplate} className="w-full">
                  {editingTemplate ? "Update Template" : "Create Template"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No templates yet. Create your first template to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedTemplateId === template.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                }`}
                onClick={() => onSelectTemplate(template)}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-800 text-sm flex items-center gap-2">
                      {template.name}
                      {template.is_default && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </p>
                    {template.description && (
                      <p className="text-xs text-slate-500">{template.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); handleSetDefault(template.id); }}
                    title="Set as default"
                  >
                    <Star className={`h-3.5 w-3.5 ${template.is_default ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400'}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); openEditDialog(template); }}
                  >
                    <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContractTemplateManager;
