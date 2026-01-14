import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X, CheckCircle, Lock } from "lucide-react";
import { useStaffRole } from "@/hooks/useStaffRole";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { FeatureDisabledAlert } from "@/components/FeatureDisabledAlert";

interface GalleryUploadFormProps {
  onSuccess?: () => void;
}

const GalleryUploadForm = ({ onSuccess }: GalleryUploadFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { canAccessCategory, loading: staffLoading } = useStaffRole();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const categories = [
    { value: 'screenshot', label: 'Screenshot', restricted: false },
    { value: 'video', label: 'Video', restricted: false },
    { value: 'event', label: 'Event', restricted: true },
    { value: 'community', label: 'Community', restricted: false },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (200MB limit for videos, 20MB for images)
    const isVideo = selectedFile.type.startsWith('video/');
    const maxSize = isVideo ? 200 * 1024 * 1024 : 20 * 1024 * 1024;
    const maxSizeLabel = isVideo ? '200MB' : '20MB';
    
    if (selectedFile.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `Please select a file smaller than ${maxSizeLabel}.`,
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime'
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image (JPEG, PNG, WEBP, GIF) or video (MP4, WEBM, MOV).",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
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

    // Validate form
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your submission.",
        variant: "destructive",
      });
      return;
    }

    if (!category) {
      toast({
        title: "Category Required",
        description: "Please select a category.",
        variant: "destructive",
      });
      return;
    }

    if (!file) {
      toast({
        title: "File Required",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, file, {
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
          title: title.trim(),
          description: description.trim() || null,
          category,
          file_path: fileName,
          file_type: file.type,
          file_size: file.size,
          status: 'pending'
        });

      if (dbError) {
        // If database insert fails, try to delete the uploaded file
        await supabase.storage.from('gallery').remove([fileName]);
        throw dbError;
      }

      toast({
        title: "Submission Successful!",
        description: "Your content has been submitted and is pending approval.",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setCategory("");
      setFile(null);
      setPreview(null);

      if (onSuccess) {
        onSuccess();
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

  // If gallery submissions are disabled, show alert
  if (!settingsLoading && !settings.gallery_submissions_enabled) {
    return (
      <Card className="glass-effect border-border/20">
        <CardHeader>
          <CardTitle className="text-2xl text-gradient">Submit to Gallery</CardTitle>
          <CardDescription>
            Share your amazing screenshots and videos with the SLRP community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeatureDisabledAlert feature="gallery_submissions" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-border/20">
      <CardHeader>
        <CardTitle className="text-2xl text-gradient">Submit to Gallery</CardTitle>
        <CardDescription>
          Share your amazing screenshots and videos with the SLRP community
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Give your submission a title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="bg-background/50"
              required
            />
            <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Tell us about this moment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              className="min-h-[100px] bg-background/50 resize-none"
            />
            <p className="text-xs text-muted-foreground">{description.length}/500 characters</p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory} required disabled={staffLoading}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => {
                  // Community is open to all, others require staff access
                  const isAccessible = cat.value === 'community' || canAccessCategory(cat.value);
                  return (
                    <SelectItem 
                      key={cat.value} 
                      value={cat.value}
                      disabled={!isAccessible}
                    >
                      <div className="flex items-center gap-2">
                        {cat.label}
                        {!isAccessible && (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Screenshots, Videos, and Events require staff access. Community is open to all.
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">File *</Label>
            {!file ? (
              <div className="border-2 border-dashed border-border/40 rounded-lg p-8 text-center hover:border-primary/40 transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-foreground mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Images: JPEG, PNG, WEBP, GIF (max 20MB)<br />
                  Videos: MP4, WEBM, MOV (max 200MB)
                </p>
                <Input
                  id="file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Label
                  htmlFor="file"
                  className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Choose File
                </Label>
              </div>
            ) : (
              <div className="relative border border-border/20 rounded-lg p-4 bg-background/50">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={removeFile}
                >
                  <X className="h-4 w-4" />
                </Button>
                
                {preview ? (
                  <div className="mb-4">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg object-contain"
                    />
                  </div>
                ) : (
                  <div className="mb-4 flex items-center justify-center h-32 bg-muted/50 rounded-lg">
                    <CheckCircle className="w-12 h-12 text-primary" />
                  </div>
                )}
                
                <div className="text-sm">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              size="lg"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit to Gallery
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            All submissions are reviewed by staff before appearing in the gallery.
            Please ensure your content follows our community guidelines.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default GalleryUploadForm;
