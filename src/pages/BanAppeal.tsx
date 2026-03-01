import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2, Upload, X, ImageIcon, Video, AlertTriangle } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import ApplicationsPausedAlert from "@/components/ApplicationsPausedAlert";
import { ApplicationCooldownTimer } from "@/components/ApplicationCooldownTimer";
import { useApplicationCooldown } from "@/hooks/useApplicationCooldown";
import { useWhitelistAccess } from "@/hooks/useWhitelistAccess";
import { useApplicationOpen } from "@/hooks/useApplicationToggles";
import ApplicationClosedMessage from "@/components/ApplicationClosedMessage";
import { scanAndAlertForSuspiciousFiles } from "@/lib/fileMetadataScanner";
import headerBg from "@/assets/header-support.jpg";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];

const BanAppeal = () => {
  const { isOpen: isAppOpen, loading: toggleLoading } = useApplicationOpen('ban_appeal');
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofPreviews, setProofPreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    discordUsername: "",
    discordId: "",
    banReason: "",
    appealReason: "",
    additionalInfo: "",
  });
  
  const { settings: siteSettings, loading: settingsLoading } = useSiteSettings();
  const { discordId: userDiscordId } = useWhitelistAccess();
  const { isOnCooldown, rejectedAt, loading: cooldownLoading, handleCooldownEnd } = useApplicationCooldown('ban_appeals', 24);

  // Auto-fill Discord ID if available
  useEffect(() => {
    if (userDiscordId && !formData.discordId) {
      setFormData(prev => ({ ...prev, discordId: userDiscordId }));
    }
  }, [userDiscordId]);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      proofPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (proofFiles.length + files.length > MAX_FILES) {
      toast({
        title: "Too Many Files",
        description: `You can upload a maximum of ${MAX_FILES} files.`,
        variant: "destructive",
      });
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a supported format. Use JPG, PNG, GIF, WebP, MP4, or WebM.`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 25MB limit.`,
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setProofFiles(prev => [...prev, ...validFiles]);
    setProofPreviews(prev => [...prev, ...newPreviews]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(proofPreviews[index]);
    setProofFiles(prev => prev.filter((_, i) => i !== index));
    setProofPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadProofFiles = async (appealId: string): Promise<string[]> => {
    if (proofFiles.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const file of proofFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${appealId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('ticket-attachments')
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Discord ID
    if (!formData.discordId || !/^\d{17,19}$/.test(formData.discordId.trim())) {
      toast({
        title: "Invalid Discord ID",
        description: "Please enter a valid Discord ID (17-19 digits).",
        variant: "destructive",
      });
      return;
    }

    // Require at least one proof file
    if (proofFiles.length === 0) {
      toast({
        title: "Proof Required",
        description: "Please upload at least one image or video as proof for your ban appeal.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to submit a ban appeal.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Generate a temporary ID for file uploads
      const tempId = crypto.randomUUID();

      // Upload proof files
      setUploadingFiles(true);
      const uploadedUrls = await uploadProofFiles(tempId);
      setUploadingFiles(false);

      if (uploadedUrls.length === 0 && proofFiles.length > 0) {
        toast({
          title: "Upload Failed",
          description: "Failed to upload proof files. Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Insert ban appeal with proof URLs in additional_info
      const proofSection = uploadedUrls.length > 0 
        ? `\n\n--- PROOF ATTACHMENTS ---\n${uploadedUrls.join('\n')}`
        : '';

      const { data: appealData, error } = await supabase.from("ban_appeals").insert({
        user_id: user.id,
        discord_username: formData.discordUsername,
        discord_id: formData.discordId.trim(),
        steam_id: "N/A",
        ban_reason: formData.banReason,
        appeal_reason: formData.appealReason,
        additional_info: (formData.additionalInfo || '') + proofSection,
      }).select().single();

      if (error) throw error;

      // Scan uploaded files for manipulation
      if (uploadedUrls.length > 0 && appealData) {
        scanAndAlertForSuspiciousFiles(
          uploadedUrls,
          'ban_appeal',
          appealData.id,
          undefined,
          formData.discordId.trim(),
          formData.discordUsername,
          {
            subject: 'Ban Appeal Proof',
            messagePreview: formData.appealReason.slice(0, 200),
            textContent: `${formData.banReason}\n${formData.appealReason}\n${formData.additionalInfo || ''}`
          }
        );
      }

      toast({
        title: "Ban Appeal Submitted",
        description: "Your appeal has been submitted successfully. Our team will review it shortly.",
      });

      navigate("/");
    } catch (error) {
      console.error("Error submitting ban appeal:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your appeal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setUploadingFiles(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (toggleLoading || settingsLoading || cooldownLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAppOpen) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader title="Ban Appeal" backgroundImage={headerBg} />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <ApplicationClosedMessage title="Ban Appeal" />
        </div>
      </div>
    );
  }

  // Show cooldown timer if on cooldown
  if (isOnCooldown && rejectedAt) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader
          title="Ban Appeal"
          description="Submit an appeal if you believe your ban was unjustified"
          backgroundImage={headerBg}
          pageKey="support"
        />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <ApplicationCooldownTimer 
              rejectedAt={rejectedAt} 
              cooldownHours={24}
              onCooldownEnd={handleCooldownEnd}
            />
          </div>
        </div>
      </div>
    );
  }

  if (siteSettings.applications_paused) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader
          title="Ban Appeal"
          description="Submit an appeal if you believe your ban was unjustified"
          backgroundImage={headerBg}
          pageKey="support"
        />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <ApplicationsPausedAlert variant="card" applicationType="Ban Appeals" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader
        title="Ban Appeal"
        description="Submit an appeal if you believe your ban was unjustified"
        backgroundImage={headerBg}
        pageKey="support"
      />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <Card className="glass-effect border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-primary" />
                <CardTitle className="text-3xl">Submit Ban Appeal</CardTitle>
              </div>
              <CardDescription className="text-base">
                Please provide detailed and honest information about your ban. False information may result in permanent denial of your appeal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discordUsername">Discord Username *</Label>
                    <Input
                      id="discordUsername"
                      name="discordUsername"
                      placeholder="username#0000"
                      value={formData.discordUsername}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discordId">Discord ID *</Label>
                    <Input
                      id="discordId"
                      name="discordId"
                      placeholder="e.g., 123456789012345678"
                      value={formData.discordId}
                      onChange={handleChange}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Your 17-19 digit Discord ID (required)</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banReason">Reason for Ban (as stated by staff) *</Label>
                  <Textarea
                    id="banReason"
                    name="banReason"
                    placeholder=""
                    value={formData.banReason}
                    onChange={handleChange}
                    required
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appealReason">Why Should We Unban You? *</Label>
                  <Textarea
                    id="appealReason"
                    name="appealReason"
                    placeholder=""
                    value={formData.appealReason}
                    onChange={handleChange}
                    required
                    className="min-h-[150px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    Provide a detailed explanation of your perspective and any evidence that supports your appeal.
                  </p>
                </div>

                {/* Proof Upload Section */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Proof (Images/Videos) *
                  </Label>
                  <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="proof-upload"
                    />
                    <label htmlFor="proof-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 rounded-full bg-primary/10">
                          <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Click to upload proof</p>
                          <p className="text-sm text-muted-foreground">
                            JPG, PNG, GIF, WebP, MP4, WebM (max 25MB each)
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* File Previews */}
                  {proofFiles.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                      {proofFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border">
                            {file.type.startsWith('video/') ? (
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                <Video className="w-8 h-8 text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground truncate max-w-[100px]">
                                  {file.name}
                                </span>
                              </div>
                            ) : (
                              <img
                                src={proofPreviews[index]}
                                alt={`Proof ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {(file.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-start gap-2 text-sm text-amber-500 bg-amber-500/10 p-3 rounded-lg">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Important: Upload original, unedited files only</p>
                      <p className="text-xs text-amber-500/80 mt-1">
                        Edited or manipulated evidence will be automatically detected and may result in immediate appeal denial.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                  <Textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    placeholder=""
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Important Notes:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Appeals are typically reviewed within 48-72 hours</li>
                    <li>Being respectful and honest increases your chances</li>
                    <li>Multiple appeals for the same ban may result in longer review times</li>
                    <li>Spamming or harassing staff will result in permanent denial</li>
                    <li><strong>Submitting fake or edited proof will result in permanent ban</strong></li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={isSubmitting || uploadingFiles}
                  >
                    {uploadingFiles ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading Files...
                      </>
                    ) : isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Appeal"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={isSubmitting || uploadingFiles}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BanAppeal;
