import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings, Plus, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

export const CannedResponsesManager = () => {
  const { toast } = useToast();
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general",
  });

  useEffect(() => {
    if (dialogOpen) {
      fetchResponses();
    }
  }, [dialogOpen]);

  const fetchResponses = async () => {
    const { data, error } = await supabase
      .from("canned_responses")
      .select("*")
      .order("category", { ascending: true })
      .order("title", { ascending: true });

    if (error) {
      console.error("Error fetching canned responses:", error);
      return;
    }

    setResponses(data || []);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingResponse) {
      const { error } = await supabase
        .from("canned_responses")
        .update({
          title: formData.title,
          content: formData.content,
          category: formData.category,
        })
        .eq("id", editingResponse.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update response.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Canned response updated successfully.",
      });
    } else {
      const { error } = await supabase
        .from("canned_responses")
        .insert({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          created_by: user.id,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create response.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Canned response created successfully.",
      });
    }

    setFormData({ title: "", content: "", category: "general" });
    setEditingResponse(null);
    fetchResponses();
  };

  const handleEdit = (response: CannedResponse) => {
    setEditingResponse(response);
    setFormData({
      title: response.title,
      content: response.content,
      category: response.category,
    });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("canned_responses")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete response.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Canned response deleted successfully.",
    });
    fetchResponses();
  };

  const handleCancel = () => {
    setFormData({ title: "", content: "", category: "general" });
    setEditingResponse(null);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Manage Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Canned Response Templates</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Account Recovery"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="technical">Technical Support</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="account">Account Issues</SelectItem>
                  <SelectItem value="whitelist">Whitelist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Response Content</Label>
              <Textarea
                id="content"
                placeholder="Enter your response template..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                {editingResponse ? "Update" : "Create"} Template
              </Button>
              {editingResponse && (
                <Button onClick={handleCancel} variant="outline">
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* List */}
          <div>
            <h3 className="text-sm font-medium mb-3">Existing Templates</h3>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {responses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No templates yet. Create one to get started.
                  </p>
                ) : (
                  responses.map((response) => (
                    <Card key={response.id} className="border-border/20">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm">{response.title}</CardTitle>
                            <p className="text-xs text-muted-foreground capitalize mt-1">
                              {response.category}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(response)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(response.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {response.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
