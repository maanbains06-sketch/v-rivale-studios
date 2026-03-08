import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Flame, Upload, Loader2, Image } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Memorial {
  id: string;
  character_name: string;
  date_of_birth: string | null;
  date_of_death: string | null;
  eulogy: string | null;
  image_url: string | null;
  frame_style: string;
  created_at: string;
}

const FRAME_OPTIONS = [
  { value: "classic", label: "Classic Wood", preview: "border-4 border-amber-700/80 rounded-lg" },
  { value: "golden", label: "Golden", preview: "border-4 border-yellow-500/80 rounded-none" },
  { value: "ornate", label: "Ornate Double", preview: "border-[6px] border-double border-amber-600/70 rounded-xl" },
  { value: "dark", label: "Dark Steel", preview: "border-4 border-zinc-600/80 rounded-lg" },
  { value: "royal", label: "Royal Purple", preview: "border-4 border-purple-700/60 rounded-2xl" },
];

const OwnerMemorialManager = () => {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    character_name: "",
    date_of_birth: "",
    date_of_death: "",
    eulogy: "",
    frame_style: "classic",
    image_url: "",
  });
  const { toast } = useToast();

  useEffect(() => { loadMemorials(); }, []);

  const loadMemorials = async () => {
    const { data } = await supabase.from("memorials").select("*").order("created_at", { ascending: false });
    setMemorials(data || []);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("memorial-images").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("memorial-images").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
    toast({ title: "Image uploaded" });
  };

  const handleSubmit = async () => {
    if (!form.character_name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("memorials").insert({
      character_name: form.character_name,
      date_of_birth: form.date_of_birth || null,
      date_of_death: form.date_of_death || null,
      eulogy: form.eulogy || null,
      image_url: form.image_url || null,
      frame_style: form.frame_style,
      created_by: user?.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Memorial created" });
    setForm({ character_name: "", date_of_birth: "", date_of_death: "", eulogy: "", frame_style: "classic", image_url: "" });
    setDialogOpen(false);
    loadMemorials();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("memorials").delete().eq("id", id);
    toast({ title: "Memorial removed" });
    loadMemorials();
  };

  const selectedFrame = FRAME_OPTIONS.find((f) => f.value === form.frame_style);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            Digital Memorial (Graveyard)
          </h3>
          <p className="text-sm text-muted-foreground">Manage memorial entries for perma-died characters</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Memorial</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                Create Memorial
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Character Name *</Label>
                <Input value={form.character_name} onChange={(e) => setForm((f) => ({ ...f, character_name: e.target.value }))} placeholder="e.g. Tony Montana" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date of Birth</Label>
                  <Input value={form.date_of_birth} onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))} placeholder="e.g. Jan 15, 1985" />
                </div>
                <div>
                  <Label>Date of Death</Label>
                  <Input value={form.date_of_death} onChange={(e) => setForm((f) => ({ ...f, date_of_death: e.target.value }))} placeholder="e.g. Mar 8, 2026" />
                </div>
              </div>
              <div>
                <Label>Eulogy / Quote</Label>
                <Textarea value={form.eulogy} onChange={(e) => setForm((f) => ({ ...f, eulogy: e.target.value }))} placeholder="Write a short eulogy or memorable quote..." rows={3} />
              </div>
              <div>
                <Label>Photo Frame Style</Label>
                <Select value={form.frame_style} onValueChange={(v) => setForm((f) => ({ ...f, frame_style: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FRAME_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Character Photo</Label>
                <div className="mt-1">
                  {form.image_url ? (
                    <div className="relative">
                      <div className={`w-32 h-36 mx-auto overflow-hidden ${selectedFrame?.preview || ""}`}>
                        <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
                      </div>
                      <Button variant="ghost" size="sm" className="absolute top-0 right-0 text-destructive" onClick={() => setForm((f) => ({ ...f, image_url: "" }))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/40 rounded-lg cursor-pointer hover:border-primary/40 transition-colors">
                      {uploading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : (
                        <>
                          <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Click to upload</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  )}
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full gap-2">
                <Flame className="w-4 h-4" /> Create Memorial
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing Memorials */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : memorials.length === 0 ? (
        <Card className="glass-effect border-border/20">
          <CardContent className="py-8 text-center text-muted-foreground">
            <Flame className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No memorials created yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memorials.map((m) => (
            <Card key={m.id} className="glass-effect border-border/20 overflow-hidden">
              {m.image_url && (
                <div className="h-32 overflow-hidden">
                  <img src={m.image_url} alt={m.character_name} className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{m.character_name}</h4>
                    {(m.date_of_birth || m.date_of_death) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {m.date_of_birth} {m.date_of_birth && m.date_of_death && "—"} {m.date_of_death}
                      </p>
                    )}
                    <Badge variant="outline" className="mt-1 text-[10px]">{m.frame_style}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive shrink-0" onClick={() => handleDelete(m.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {m.eulogy && <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">"{m.eulogy}"</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerMemorialManager;
