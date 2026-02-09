import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X, CheckCircle, Image as ImageIcon, Video, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { scanAndAlertForSuspiciousFiles } from "@/lib/fileMetadataScanner";

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
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
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
      // Validate file size (200MB for videos, 20MB for images)
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 200 * 1024 * 1024 : 20 * 1024 * 1024;
      const maxSizeLabel = isVideo ? '200MB' : '20MB';
      
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} is larger than ${maxSizeLabel} and was skipped.`,
          variant: "destructive",
        });
        continue;
      }

      // Validate file type based on category
      const isImage = file.type.startsWith('image/');
      
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
        description: '',
        progress: 0,
        status: 'pending'
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

  const retryFailedUploads = () => {
    setFiles(prev => prev.map(f => 
      f.status === 'error' ? { ...f, status: 'pending', progress: 0, error: undefined } : f
    ));
  };

  const retryFile = (index: number) => {
    setFiles(prev => prev.map((f, i) => 
      i === index && f.status === 'error' ? { ...f, status: 'pending', progress: 0, error: undefined } : f
    ));
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

      for (let i = 0; i < files.length; i++) {
        const fileItem = files[i];
        
        // Skip already completed files
        if (fileItem.status === 'complete') {
          successCount++;
          continue;
        }

        // Skip files that are not pending (shouldn't happen, but safety check)
        if (fileItem.status !== 'pending') {
          continue;
        }
        
        try {
          // Update status to uploading
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, status: 'uploading', progress: 10 } : f
          ));

          // Generate unique file path
          const fileExt = fileItem.file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          // Simulate upload progress
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, progress: 40 } : f
          ));

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

          // Update to processing
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, status: 'processing', progress: 70 } : f
          ));

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

          // Scan the uploaded file for manipulation
          try {
            const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(fileName);
            const discordId = user.user_metadata?.discord_id || user.user_metadata?.provider_id || '';
            const discordUsername = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Anonymous';
            
            await scanAndAlertForSuspiciousFiles(
              [urlData.publicUrl],
              'gallery_submission',
              user.id,
              undefined,
              discordId,
              discordUsername,
              {
                subject: `Gallery Quick Upload: ${fileItem.title}`
              }
            );
          } catch (scanError) {
            console.error("Failed to scan file for manipulation:", scanError);
          }

          // Mark as complete
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, status: 'complete', progress: 100 } : f
          ));

          successCount++;
        } catch (error: any) {
          console.error(`Upload error for ${fileItem.file.name}:`, error);
          
          // Mark as error
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, status: 'error', error: error.message } : f
          ));
          
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

      // Only close and reset if ALL files completed successfully
      if (successCount > 0 && errorCount === 0) {
        toast({
          title: "All Uploads Complete!",
          description: `${successCount} ${successCount === 1 ? 'file' : 'files'} uploaded successfully.`,
        });
        
        setFiles([]);
        onOpenChange(false);
        
        if (onSuccess) {
          onSuccess();
        }
      }
      
      // If there are errors but also successes, just notify but keep dialog open
      if (errorCount > 0 && successCount > 0) {
        // The toast was already shown above with both success and error counts
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
                {category === 'screenshot' ? 'Images: JPEG, PNG, WEBP, GIF (max 20MB each)' : 'Videos: MP4, WEBM, MOV (max 200MB each)'}<br />
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
                  disabled={uploading}
                />
                <Label
                  htmlFor="add-more"
                  className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3 ${
                    uploading 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'cursor-pointer hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add More
                </Label>
              </div>

              {/* Files List */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {files.map((fileItem, index) => (
                  <div key={index} className="relative border border-border/20 rounded-lg p-4 bg-background/50 space-y-3">
                    {fileItem.status === 'pending' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                        onClick={() => removeFile(index)}
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        {fileItem.status === 'uploading' && (
                          <Badge variant="secondary" className="gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Uploading...
                          </Badge>
                        )}
                        {fileItem.status === 'processing' && (
                          <Badge variant="secondary" className="gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Processing...
                          </Badge>
                        )}
                        {fileItem.status === 'complete' && (
                          <Badge className="gap-2 bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
                            <CheckCircle className="w-3 h-3" />
                            Complete
                          </Badge>
                        )}
                        {fileItem.status === 'error' && (
                          <Badge variant="destructive" className="gap-2">
                            <AlertCircle className="w-3 h-3" />
                            Failed
                          </Badge>
                        )}
                        {fileItem.status === 'pending' && <div />}
                      </div>

                      {fileItem.status === 'error' && !uploading && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => retryFile(index)}
                          className="h-7 text-xs"
                        >
                          Retry
                        </Button>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {(fileItem.status === 'uploading' || fileItem.status === 'processing' || fileItem.status === 'complete') && (
                      <div className="space-y-1">
                        <Progress value={fileItem.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">{fileItem.progress}%</p>
                      </div>
                    )}

                    {/* Error Message */}
                    {fileItem.status === 'error' && fileItem.error && (
                      <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                        {fileItem.error}
                      </div>
                    )}

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
                          disabled={uploading}
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
                          disabled={uploading}
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
            <div className="space-y-3">
              {/* Retry All Failed Button */}
              {files.some(f => f.status === 'error') && !uploading && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-destructive/40 hover:bg-destructive/10 text-destructive hover:text-destructive"
                  onClick={retryFailedUploads}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Retry All Failed Uploads ({files.filter(f => f.status === 'error').length})
                </Button>
              )}

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
                  {files.every(f => f.status === 'complete') ? 'Close' : 'Cancel'}
                </Button>
                
                {/* Only show upload button if there are pending files */}
                {files.some(f => f.status === 'pending') && (
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading ({files.filter(f => f.status === 'complete').length}/{files.length})...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {files.some(f => f.status === 'complete') 
                          ? `Upload ${files.filter(f => f.status === 'pending').length} Remaining` 
                          : `Upload ${files.length} ${files.length === 1 ? 'file' : 'files'}`
                        }
                      </>
                    )}
                  </Button>
                )}
              </div>
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
