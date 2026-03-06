import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link, Plus, FileVideo, Image, FileText, Loader2 } from "lucide-react";

interface EvidenceUploaderProps {
  onEvidenceAdded: (evidence: {
    type: string;
    url: string;
    description: string;
    fileName?: string;
    fileSize?: number;
  }) => void;
  label?: string;
  allowedTypes?: string[];
}

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_PHOTO_SIZE = 100 * 1024 * 1024; // 100MB

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const EvidenceUploader = ({ onEvidenceAdded, label = "Add Evidence", allowedTypes }: EvidenceUploaderProps) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<"link" | "upload">("link");
  const [evidenceType, setEvidenceType] = useState("screenshot");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const types = allowedTypes || ["screenshot", "video", "document", "log", "audio"];

  const getAcceptStr = () => {
    switch (evidenceType) {
      case "screenshot": return "image/*";
      case "video": return "video/*";
      case "audio": return "audio/*";
      case "document": return ".pdf,.txt,.doc,.docx,.xls,.xlsx";
      default: return "*/*";
    }
  };

  const getMaxSize = () => {
    return ["video", "audio"].includes(evidenceType) ? MAX_VIDEO_SIZE : MAX_PHOTO_SIZE;
  };

  const handleFileUpload = async (file: File) => {
    const maxSize = getMaxSize();
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `Maximum size for ${evidenceType} is ${formatFileSize(maxSize)}. Your file is ${formatFileSize(file.size)}.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Simulate progress for UX (Supabase doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + Math.random() * 15, 90));
      }, 500);

      const { data, error } = await supabase.storage
        .from('case-evidence')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      clearInterval(progressInterval);

      if (error) {
        console.error("Upload error:", error);
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        return;
      }

      setUploadProgress(100);

      const { data: urlData } = supabase.storage.from('case-evidence').getPublicUrl(data.path);

      onEvidenceAdded({
        type: evidenceType,
        url: urlData.publicUrl,
        description: description || file.name,
        fileName: file.name,
        fileSize: file.size,
      });

      setDescription("");
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast({ title: "File uploaded successfully" });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleLinkAdd = () => {
    if (!url.trim()) return;
    onEvidenceAdded({
      type: evidenceType,
      url: url.trim(),
      description: description || "",
    });
    setUrl("");
    setDescription("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-semibold">{label}</Label>
      </div>

      <Tabs value={mode} onValueChange={v => setMode(v as "link" | "upload")} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-[300px]">
          <TabsTrigger value="link" className="gap-1.5 text-xs">
            <Link className="w-3 h-3" /> Paste Link
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-1.5 text-xs">
            <Upload className="w-3 h-3" /> Upload File
          </TabsTrigger>
        </TabsList>

        <div className="mt-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select value={evidenceType} onValueChange={setEvidenceType}>
              <SelectTrigger className="bg-muted/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.includes("screenshot") && <SelectItem value="screenshot">📸 Screenshot</SelectItem>}
                {types.includes("video") && <SelectItem value="video">🎥 Video</SelectItem>}
                {types.includes("document") && <SelectItem value="document">📄 Document</SelectItem>}
                {types.includes("log") && <SelectItem value="log">📋 Server Log</SelectItem>}
                {types.includes("audio") && <SelectItem value="audio">🔊 Audio</SelectItem>}
                {types.includes("chat_log") && <SelectItem value="chat_log">💬 Chat Log</SelectItem>}
                {types.includes("confession") && <SelectItem value="confession">📝 Confession</SelectItem>}
              </SelectContent>
            </Select>

            <TabsContent value="link" className="md:col-span-2 m-0 p-0">
              <Input
                placeholder="URL (YouTube, Imgur, Drive, etc.)"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="bg-muted/30"
              />
            </TabsContent>

            <TabsContent value="upload" className="md:col-span-2 m-0 p-0">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={getAcceptStr()}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2 bg-muted/30"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : evidenceType === "video" ? (
                    <FileVideo className="w-4 h-4" />
                  ) : evidenceType === "screenshot" ? (
                    <Image className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  {uploading ? "Uploading..." : `Choose ${evidenceType} (max ${formatFileSize(getMaxSize())})`}
                </Button>
              </div>
            </TabsContent>

            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="bg-muted/30"
            />
          </div>

          {uploading && uploadProgress > 0 && (
            <div className="mt-2 space-y-1">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">{Math.round(uploadProgress)}%</p>
            </div>
          )}

          {mode === "link" && (
            <Button
              size="sm"
              onClick={handleLinkAdd}
              disabled={!url.trim()}
              className="mt-2 gap-1"
            >
              <Plus className="w-4 h-4" /> Add Evidence
            </Button>
          )}
        </div>
      </Tabs>
    </div>
  );
};
