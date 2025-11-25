import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X, CheckCircle, Image as ImageIcon, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GalleryQuickUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: 'screenshot' | 'video';
  onSuccess?: () => void;
}

interface FileWithPreview {
  file: File;
  preview: string | null;
  title: string;
  description: string;
}

const GalleryQuickUploadDialog = ({ open, onOpenChange, category, onSuccess }: GalleryQuickUploadDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const validFiles: FileWithPreview[] = [];

    for (const file of selectedFiles) {
      // Validate file size (20MB limit)
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} is larger than 20MB and was skipped.`,
          variant: "destructive",
        });
        continue;
      }

      // Validate file type based on category
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (category === 'screenshot' && !isImage) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not an image and was skipped.`,
          variant: "destructive",
        });
        continue;
      }

      if (category === 'video' && !isVideo) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a video and was skipped.`,
          variant: "destructive",
        });
        continue;
      }

      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm', 'video/quicktime'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} has an unsupported format and was skipped.`,
          variant: "destructive",
        });
        continue;
      }

      // Generate default title from filename
      const defaultTitle = file.name.replace(/\.[^/.]+$/, "").substring(0, 100);

      const fileWithPreview: FileWithPreview = {
        file,
        preview: null,
        title: defaultTitle,
        description: ''
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFiles(prev => prev.map(f => 
            f.file === file ? { ...f, preview: reader.result as string } : f
          ));
        };
        reader.readAsDataURL(file);
      }

      validFiles.push(fileWithPreview);
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFileTitle = (index: number, title: string) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, title } : f));
  };

  const updateFileDescription = (index: number, description: string) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, description } : f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload content.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Validate files
    if (files.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }

    // Validate titles
    const invalidFiles = files.filter(f => !f.title.trim());
    if (invalidFiles.length > 0) {
      toast({
        title: "Missing Titles",
        description: "Please provide a title for all files.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const fileItem of files) {
        try {
          // Generate unique file path
          const fileExt = fileItem.file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          // Upload file to storage
          const { error: uploadError } = await supabase.storage
            .from('gallery')
            .upload(fileName, fileItem.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            throw uploadError;
          }

          // Create submission record
          const { error: dbError } = await supabase
            .from('gallery_submissions')
            .insert({
              user_id: user.id,
              title: fileItem.title.trim(),
              description: fileItem.description.trim() || null,
              category,
              file_path: fileName,
              file_type: fileItem.file.type,
              file_size: fileItem.file.size,
              status: 'pending'
            });

          if (dbError) {
            // If database insert fails, try to delete the uploaded file
            await supabase.storage.from('gallery').remove([fileName]);
            throw dbError;
          }

          successCount++;
        } catch (error: any) {
          console.error(`Upload error for ${fileItem.file.name}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Upload Successful!",
          description: `${successCount} ${successCount === 1 ? 'file' : 'files'} uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}.`,
        });
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "Upload Failed",
          description: "All uploads failed. Please try again.",
          variant: "destructive",
        });
      }

      // Reset form on any success
      if (successCount > 0) {
        setFiles([]);
        onOpenChange(false);
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "There was an error uploading your content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const categoryConfig = {
    screenshot: {
      title: 'Upload Screenshots',
      icon: ImageIcon,
      accept: 'image/jpeg,image/png,image/webp,image/gif',
      description: 'Upload one or multiple screenshots'
    },
    video: {
      title: 'Upload Videos',
      icon: Video,
      accept: 'video/mp4,video/webm,video/quicktime',
      description: 'Upload one or multiple videos'
    }
  };

  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">{config.title}</DialogTitle>
              <DialogDescription>{config.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          {files.length === 0 ? (
            <div className="border-2 border-dashed border-border/40 rounded-lg p-8 text-center hover:border-primary/40 transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-foreground mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {category === 'screenshot' ? 'Images: JPEG, PNG, WEBP, GIF' : 'Videos: MP4, WEBM, MOV'} (max 20MB each)<br />
                Select multiple files for bulk upload
              </p>
              <Input
                id="files"
                type="file"
                accept={config.accept}
                onChange={handleFilesChange}
                className="hidden"
                multiple
              />
              <Label
                htmlFor="files"
                className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Choose Files
              </Label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="gap-2">
                  <CheckCircle className="w-3 h-3" />
                  {files.length} {files.length === 1 ? 'file' : 'files'} selected
                </Badge>
                <Input
                  id="add-more"
                  type="file"
                  accept={config.accept}
                  onChange={handleFilesChange}
                  className="hidden"
                  multiple
                />
                <Label
                  htmlFor="add-more"
                  className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add More
                </Label>
              </div>

              {/* Files List */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {files.map((fileItem, index) => (
                  <div key={index} className="relative border border-border/20 rounded-lg p-4 bg-background/50 space-y-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    {fileItem.preview && (
                      <div className="mb-2">
                        <img
                          src={fileItem.preview}
                          alt="Preview"
                          className="max-h-32 mx-auto rounded-lg object-contain"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div>
                        <Label htmlFor={`title-${index}`} className="text-xs">Title *</Label>
                        <Input
                          id={`title-${index}`}
                          value={fileItem.title}
                          onChange={(e) => updateFileTitle(index, e.target.value)}
                          maxLength={100}
                          className="h-9"
                          placeholder="Enter a title"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`description-${index}`} className="text-xs">Description (Optional)</Label>
                        <Textarea
                          id={`description-${index}`}
                          value={fileItem.description}
                          onChange={(e) => updateFileDescription(index, e.target.value)}
                          maxLength={500}
                          className="min-h-[60px] resize-none"
                          placeholder="Add a description..."
                        />
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {fileItem.file.name} • {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          {files.length > 0 && (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setFiles([]);
                  onOpenChange(false);
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading {files.length} {files.length === 1 ? 'file' : 'files'}...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {files.length} {files.length === 1 ? 'file' : 'files'}
                  </>
                )}
              </Button>
            </div>
          )}

          {files.length > 0 && (
            <p className="text-xs text-center text-muted-foreground">
              All submissions are reviewed by staff before appearing in the gallery.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryQuickUploadDialog;
