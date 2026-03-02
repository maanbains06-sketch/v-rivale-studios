import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Download, Edit2, Save, X, Plus, FileText, CheckCircle, Clock, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import jsPDF from "jspdf";
import SignaturePad from "@/components/SignaturePad";
import ContractTemplateManager from "@/components/ContractTemplateManager";
import ContractsList from "@/components/ContractsList";
import type { Json } from "@/integrations/supabase/types";

interface SpecialTermItem {
  id: string;
  text: string;
  enabled: boolean;
}

interface ContractData {
  // Party A Details
  serverName: string;
  serverOwner: string;
  serverEmail: string;
  serverDiscord: string;
  serverWebsite: string;
  serverAddress: string;
  serverGSTIN: string;
  // Party B Details
  creatorName: string;
  creatorAddress: string;
  creatorEmail: string;
  creatorPhone: string;
  creatorDiscord: string;
  creatorPAN: string;
  channelName: string;
  platformLinks: string;
  subscriberCount: string;
  averageViews: string;
  // Contract Terms
  monthlyPayment: string;
  paymentMethod: string;
  minimumVideos: string;
  minimumStreams: string;
  contractDuration: string;
  startDate: string;
  endDate: string;
  specialTerms: string;
  specialTermsList: SpecialTermItem[];
  customTerms: string;
  exclusivityClause: string;
  performanceBonus: string;
}

const defaultSpecialTerms: SpecialTermItem[] = [
  { id: '1', text: 'Creator will receive exclusive in-game vehicle upon signing', enabled: false },
  { id: '2', text: 'Creator agrees to participate in all major server events', enabled: false },
  { id: '3', text: 'Server will provide VIP status for up to 3 of creator\'s friends', enabled: false },
  { id: '4', text: 'Creator will receive priority support from development team', enabled: false },
  { id: '5', text: 'Additional bonus of ₹500 for every sponsored video crossing 5k views', enabled: false },
  { id: '6', text: 'Creator will be featured on server\'s official social media monthly', enabled: false },
  { id: '7', text: 'Creator will receive early access to new server updates and features', enabled: false },
  { id: '8', text: 'Server will provide custom roleplay scenarios for content creation', enabled: false },
];

const defaultContractData: ContractData = {
  serverName: "Skylife Roleplay India",
  serverOwner: "Skylife RP Management",
  serverEmail: "contact@skyliferoleplay.com",
  serverDiscord: "discord.gg/W2nU97maBh",
  serverWebsite: "https://skyliferoleplay.com",
  serverAddress: "India",
  serverGSTIN: "",
  creatorName: "",
  creatorAddress: "",
  creatorEmail: "",
  creatorPhone: "",
  creatorDiscord: "",
  creatorPAN: "",
  channelName: "",
  platformLinks: "",
  subscriberCount: "",
  averageViews: "",
  monthlyPayment: "5000",
  paymentMethod: "UPI / Bank Transfer",
  minimumVideos: "4",
  minimumStreams: "8",
  contractDuration: "3 months",
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  specialTerms: "",
  specialTermsList: defaultSpecialTerms,
  customTerms: "",
  exclusivityClause: "Non-exclusive",
  performanceBonus: "₹1000 per video exceeding 10,000 views",
};

const CreatorContract = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const contractRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [contractData, setContractData] = useState<ContractData>(defaultContractData);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
  const [contractStatus, setContractStatus] = useState<string>("draft");
  const [ownerSignature, setOwnerSignature] = useState<string | null>(null);
  const [ownerSignedAt, setOwnerSignedAt] = useState<string | null>(null);
  const [creatorSignature, setCreatorSignature] = useState<string | null>(null);
  const [creatorSignedAt, setCreatorSignedAt] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [savedOwnerSignature, setSavedOwnerSignature] = useState<string | null>(null);

  useEffect(() => {
    checkOwnerAccess();
    loadSavedOwnerSignature();
  }, []);

  const loadSavedOwnerSignature = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "owner_contract_signature_url")
        .maybeSingle();
      if (data?.value) {
        setSavedOwnerSignature(data.value);
      }
    } catch (error) {
      console.error("Error loading saved signature:", error);
    }
  };

  const saveOwnerSignatureToSettings = async (signatureDataUrl: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Convert base64 data URL to blob and upload to storage
      const response = await fetch(signatureDataUrl);
      const blob = await response.blob();
      const fileName = `owner-signature-${user.id}.png`;

      const { error: uploadError } = await supabase.storage
        .from("assets")
        .upload(fileName, blob, { 
          contentType: "image/png", 
          upsert: true 
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("assets")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Save only the URL in site_settings
      const { error: settingsError } = await supabase.from("site_settings").upsert(
        {
          key: "owner_contract_signature_url",
          value: publicUrl,
          description: "Saved owner signature URL for contracts (Party A)",
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

      if (settingsError) {
        console.error("Settings save error:", settingsError);
        return;
      }

      setSavedOwnerSignature(publicUrl);
      toast({ title: "Signature saved permanently", description: "It will auto-apply to all new contracts." });
    } catch (error) {
      console.error("Error saving signature:", error);
    }
  };

  const clearSavedOwnerSignature = async () => {
    try {
      await supabase.from("site_settings").delete().eq("key", "owner_contract_signature_url");
      setSavedOwnerSignature(null);
      toast({ title: "Saved signature cleared" });
    } catch (error) {
      console.error("Error clearing signature:", error);
    }
  };

  const checkOwnerAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is owner
      const { data: isOwnerResult } = await supabase.rpc("is_owner", { _user_id: user.id });
      
      if (isOwnerResult) {
        setIsOwner(true);
        return;
      }

      // Check if user has creator_contract panel access
      const { data: hasPanelResult } = await supabase.rpc("has_panel_access", { 
        _user_id: user.id, 
        _panel_type: "creator_contract" 
      });

      if (hasPanelResult) {
        setIsOwner(true);
        return;
      }

      toast({
        title: "Access Denied",
        description: "You don't have permission to access creator contracts.",
        variant: "destructive",
      });
      navigate("/");
    } catch (error) {
      console.error("Error checking access:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ContractData, value: string) => {
    setContractData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleSpecialTerm = (termId: string) => {
    setContractData(prev => ({
      ...prev,
      specialTermsList: prev.specialTermsList.map(term =>
        term.id === termId ? { ...term, enabled: !term.enabled } : term
      )
    }));
  };

  const handleAddCustomTerm = () => {
    const newId = Date.now().toString();
    setContractData(prev => ({
      ...prev,
      specialTermsList: [
        ...prev.specialTermsList,
        { id: newId, text: '', enabled: true }
      ]
    }));
  };

  const handleUpdateCustomTerm = (termId: string, text: string) => {
    setContractData(prev => ({
      ...prev,
      specialTermsList: prev.specialTermsList.map(term =>
        term.id === termId ? { ...term, text } : term
      )
    }));
  };

  const handleRemoveCustomTerm = (termId: string) => {
    setContractData(prev => ({
      ...prev,
      specialTermsList: prev.specialTermsList.filter(term => term.id !== termId)
    }));
  };

  const getActiveSpecialTerms = () => {
    return contractData.specialTermsList.filter(term => term.enabled && term.text.trim());
  };

  const handleSelectContract = (contract: any) => {
    setSelectedContractId(contract.id);
    const data = contract.contract_data as ContractData;
    setContractData({ ...defaultContractData, ...data });
    setContractStatus(contract.status);
    setOwnerSignature(contract.owner_signature);
    setOwnerSignedAt(contract.owner_signed_at);
    setCreatorSignature(contract.creator_signature);
    setCreatorSignedAt(contract.creator_signed_at);
    setIsEditing(false);
  };

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplateId(template.id);
    if (template.content && Object.keys(template.content).length > 0) {
      setContractData({ ...defaultContractData, ...(template.content as ContractData) });
    }
  };

  const handleNewContract = () => {
    setSelectedContractId(null);
    setContractData(defaultContractData);
    setContractStatus("draft");
    // Auto-apply saved owner signature
    if (savedOwnerSignature) {
      setOwnerSignature(savedOwnerSignature);
      setOwnerSignedAt(new Date().toISOString());
    } else {
      setOwnerSignature(null);
      setOwnerSignedAt(null);
    }
    setCreatorSignature(null);
    setCreatorSignedAt(null);
    setIsEditing(true);
  };

  const handleSaveContract = async () => {
    if (!contractData.creatorName.trim()) {
      toast({ title: "Please enter creator name", variant: "destructive" });
      return;
    }

    // Verify owner permission before saving
    if (!isOwner) {
      toast({ 
        title: "Permission Denied", 
        description: "Only the owner can save contracts.",
        variant: "destructive" 
      });
      return;
    }

    setSaving(true);
    try {
      // Get current user for created_by field
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Authentication required", variant: "destructive" });
        return;
      }

      // Double-check owner permission via RPC
      const { data: ownerCheck } = await supabase.rpc("is_owner", { _user_id: user.id });
      if (!ownerCheck) {
        toast({ 
          title: "Permission Denied", 
          description: "Only the owner can save contracts.",
          variant: "destructive" 
        });
        setSaving(false);
        return;
      }

      const contractPayload = {
        creator_name: contractData.creatorName,
        creator_email: contractData.creatorEmail || null,
        creator_discord_id: contractData.creatorDiscord || null,
        contract_data: contractData as unknown as Json,
        status: contractStatus,
        valid_from: contractData.startDate,
        valid_until: contractData.endDate,
        owner_signature: ownerSignature,
        owner_signed_at: ownerSignedAt,
        creator_signature: creatorSignature,
        creator_signed_at: creatorSignedAt,
        template_id: selectedTemplateId || null,
        created_by: user.id,
      };

      if (selectedContractId) {
        // Don't update created_by on update, only on insert
        const { created_by, ...updatePayload } = contractPayload;
        const { error } = await supabase
          .from("creator_contracts")
          .update(updatePayload)
          .eq("id", selectedContractId);

        if (error) {
          console.error("Update error details:", error);
          throw error;
        }
        toast({ title: "Contract updated successfully" });
      } else {
        const { data, error } = await supabase
          .from("creator_contracts")
          .insert(contractPayload)
          .select()
          .single();

        if (error) {
          console.error("Insert error details:", error);
          throw error;
        }
        setSelectedContractId(data.id);
        toast({ title: "Contract saved successfully" });
      }

      setIsEditing(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error("Error saving contract:", error);
      toast({ 
        title: "Failed to save contract", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOwnerSign = (signature: string) => {
    setOwnerSignature(signature);
    setOwnerSignedAt(new Date().toISOString());
    // Also save permanently so it auto-applies to future contracts
    saveOwnerSignatureToSettings(signature);
    toast({ title: "Owner signature recorded & saved", description: "It will auto-apply to all future contracts." });
  };

  const handleCreatorSign = (signature: string) => {
    setCreatorSignature(signature);
    setCreatorSignedAt(new Date().toISOString());
    if (ownerSignature) {
      setContractStatus("signed");
    } else {
      setContractStatus("pending");
    }
    toast({ title: "Creator signature recorded", description: "Remember to save the contract" });
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 0;

    // Colors
    const headerBg: [number, number, number] = [30, 41, 59];
    const black: [number, number, number] = [0, 0, 0];
    const gray: [number, number, number] = [100, 100, 100];
    const lightGray: [number, number, number] = [230, 230, 230];

    // ========== PAGE 1 - Header and Party Details ==========
    
    // Header Box
    doc.setFillColor(...headerBg);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SKYLIFE ROLEPLAY INDIA', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('CONTENT CREATOR AGREEMENT', pageWidth / 2, 25, { align: 'center' });

    yPos = 45;

    // Contract Info Row
    doc.setTextColor(...black);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Contract ID:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(selectedContractId?.slice(0, 8) || 'DRAFT', margin + 25, yPos);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', pageWidth - 60, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(), 'dd/MM/yyyy'), pageWidth - 45, yPos);

    yPos += 10;

    // Helper: Draw a form field with label and value in a box
    const drawFormField = (label: string, value: string, x: number, y: number, width: number, height: number = 8) => {
      // Label background
      doc.setFillColor(...lightGray);
      doc.rect(x, y, 45, height, 'F');
      
      // Full border
      doc.setDrawColor(...black);
      doc.setLineWidth(0.3);
      doc.rect(x, y, width, height);
      
      // Divider line
      doc.line(x + 45, y, x + 45, y + height);
      
      // Label text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...black);
      doc.text(label, x + 2, y + 5.5);
      
      // Value text
      doc.setFont('helvetica', 'normal');
      doc.text(value || '', x + 47, y + 5.5);
    };

    // Helper: Draw section header
    const drawSectionHeader = (title: string, y: number) => {
      doc.setFillColor(...headerBg);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(title.toUpperCase(), margin + 3, y + 5.5);
      return y + 10;
    };

    // ========== PARTY A SECTION ==========
    yPos = drawSectionHeader('Party A - Server Representative', yPos);

    const halfWidth = contentWidth / 2 - 2;
    
    drawFormField('Organization', contractData.serverName, margin, yPos, halfWidth);
    drawFormField('Representative', contractData.serverOwner, margin + halfWidth + 4, yPos, halfWidth);
    yPos += 10;
    
    drawFormField('Email', contractData.serverEmail, margin, yPos, halfWidth);
    drawFormField('Discord', contractData.serverDiscord, margin + halfWidth + 4, yPos, halfWidth);
    yPos += 10;
    
    drawFormField('Website', contractData.serverWebsite, margin, yPos, halfWidth);
    drawFormField('Address', contractData.serverAddress, margin + halfWidth + 4, yPos, halfWidth);
    yPos += 10;

    if (contractData.serverGSTIN) {
      drawFormField('GSTIN', contractData.serverGSTIN, margin, yPos, contentWidth);
      yPos += 10;
    }

    yPos += 5;

    // ========== PARTY B SECTION ==========
    yPos = drawSectionHeader('Party B - Content Creator', yPos);

    drawFormField('Full Name', contractData.creatorName || '[To be filled]', margin, yPos, halfWidth);
    drawFormField('Email', contractData.creatorEmail || '[To be filled]', margin + halfWidth + 4, yPos, halfWidth);
    yPos += 10;
    
    drawFormField('Phone', contractData.creatorPhone || '[To be filled]', margin, yPos, halfWidth);
    drawFormField('Discord ID', contractData.creatorDiscord || '[To be filled]', margin + halfWidth + 4, yPos, halfWidth);
    yPos += 10;
    
    drawFormField('Address', contractData.creatorAddress || '[To be filled]', margin, yPos, contentWidth);
    yPos += 10;
    
    if (contractData.creatorPAN) {
      drawFormField('PAN', contractData.creatorPAN, margin, yPos, halfWidth);
      yPos += 10;
    }
    
    drawFormField('Channel Name', contractData.channelName || '[To be filled]', margin, yPos, halfWidth);
    drawFormField('Platform Links', contractData.platformLinks || '[To be filled]', margin + halfWidth + 4, yPos, halfWidth);
    yPos += 10;
    
    drawFormField('Subscribers', contractData.subscriberCount || '[To be filled]', margin, yPos, halfWidth);
    drawFormField('Avg. Views', contractData.averageViews || '[To be filled]', margin + halfWidth + 4, yPos, halfWidth);
    yPos += 15;

    // ========== CONTRACT PERIOD SECTION ==========
    yPos = drawSectionHeader('Contract Period', yPos);

    const quarterWidth = contentWidth / 4 - 3;
    
    drawFormField('Duration', contractData.contractDuration, margin, yPos, quarterWidth + 15);
    drawFormField('Start Date', format(new Date(contractData.startDate), 'dd/MM/yyyy'), margin + quarterWidth + 18, yPos, quarterWidth + 15);
    drawFormField('End Date', format(new Date(contractData.endDate), 'dd/MM/yyyy'), margin + (quarterWidth + 18) * 2, yPos, quarterWidth + 14);
    yPos += 10;
    
    drawFormField('Exclusivity', contractData.exclusivityClause, margin, yPos, contentWidth);
    yPos += 15;

    // ========== COMPENSATION SECTION ==========
    yPos = drawSectionHeader('Compensation & Payment Terms', yPos);

    drawFormField('Monthly Payment', `₹${contractData.monthlyPayment}`, margin, yPos, halfWidth);
    drawFormField('Payment Method', contractData.paymentMethod, margin + halfWidth + 4, yPos, halfWidth);
    yPos += 10;
    
    drawFormField('Performance Bonus', contractData.performanceBonus, margin, yPos, contentWidth);
    yPos += 10;
    
    drawFormField('Payment Schedule', 'Within 7 working days of each calendar month end', margin, yPos, contentWidth);
    yPos += 15;

    // ========== CONTENT DELIVERABLES SECTION ==========
    yPos = drawSectionHeader('Content Deliverables', yPos);

    drawFormField('Min. Videos/Month', contractData.minimumVideos, margin, yPos, halfWidth);
    drawFormField('Min. Stream Hours', contractData.minimumStreams, margin + halfWidth + 4, yPos, halfWidth);
    yPos += 12;

    // Content Guidelines Box
    doc.setDrawColor(...black);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPos, contentWidth, 28);
    
    doc.setFillColor(...lightGray);
    doc.rect(margin, yPos, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...black);
    doc.text('Content Guidelines:', margin + 2, yPos + 4);
    
    doc.setFont('helvetica', 'normal');
    const guidelines = [
      '• All content must prominently feature Skylife Roleplay India gameplay',
      '• Server name and Discord link required in all video descriptions',
      '• Content must adhere to community guidelines and be family-friendly',
      '• No promotion of competing GTA RP servers during contract period'
    ];
    
    let guideY = yPos + 10;
    guidelines.forEach(g => {
      doc.text(g, margin + 3, guideY);
      guideY += 5;
    });

    // ========== PAGE 2 ==========
    doc.addPage();
    yPos = 20;

    // ========== OBLIGATIONS SECTION ==========
    yPos = drawSectionHeader('Creator Obligations', yPos);

    doc.setDrawColor(...black);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPos, contentWidth, 38);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...black);
    
    const creatorObligations = [
      '1. Maintain active and positive presence on the server',
      '2. Engage constructively with the community',
      '3. Report technical issues and provide feedback',
      '4. Provide 14 days written notice before contract termination',
      '5. Maintain confidentiality of server-sensitive information',
      '6. Comply with all server rules and regulations',
      '7. Attend mandatory creator meetings when scheduled'
    ];
    
    let obligY = yPos + 5;
    creatorObligations.forEach(o => {
      doc.text(o, margin + 3, obligY);
      obligY += 5;
    });
    yPos += 43;

    yPos = drawSectionHeader('Server Obligations', yPos);

    doc.setTextColor(...black);  // Reset text color after header
    doc.setDrawColor(...black);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPos, contentWidth, 33);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    const serverObligations = [
      '1. Provide priority queue access to the server',
      '2. Offer dedicated support for content creation needs',
      '3. Feature creator content on official channels',
      '4. Provide agreed-upon in-game perks and benefits',
      '5. Maintain open and timely communication',
      '6. Process payments within the stipulated timeframe'
    ];
    
    obligY = yPos + 5;
    serverObligations.forEach(o => {
      doc.text(o, margin + 3, obligY);
      obligY += 5;
    });
    yPos += 38;

    yPos = drawSectionHeader('Termination Clause', yPos);

    doc.setTextColor(...black);  // Reset text color after header
    doc.setDrawColor(...black);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPos, contentWidth, 35);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Either party may terminate this agreement with 14 days written notice.', margin + 3, yPos + 5);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Grounds for Immediate Termination:', margin + 3, yPos + 12);
    
    doc.setFont('helvetica', 'normal');
    const terminationGrounds = [
      '• Violation of server rules or community guidelines',
      '• Failure to meet deliverables for 2 consecutive months',
      '• Actions damaging to either party\'s reputation',
      '• Breach of confidentiality obligations'
    ];
    
    let termY = yPos + 17;
    terminationGrounds.forEach(t => {
      doc.text(t, margin + 5, termY);
      termY += 4.5;
    });
    yPos += 40;

    // ========== SPECIAL TERMS SECTION ==========
    const activeTerms = getActiveSpecialTerms();
    if (activeTerms.length > 0 || contractData.customTerms) {
      yPos = drawSectionHeader('Special Terms & Conditions', yPos);
      
      doc.setTextColor(...black);  // Reset text color after header
      doc.setDrawColor(...black);
      doc.setLineWidth(0.3);
      
      // Calculate height needed
      const termCount = activeTerms.length;
      const customTermLines = contractData.customTerms ? doc.splitTextToSize(contractData.customTerms, contentWidth - 10) : [];
      const totalHeight = Math.max(20, (termCount * 5) + (customTermLines.length * 4) + 15);
      
      doc.rect(margin, yPos, contentWidth, totalHeight);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      let termYPos = yPos + 5;
      
      // Render active special terms
      activeTerms.forEach((term, index) => {
        if (termYPos < yPos + totalHeight - 5) {
          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}.`, margin + 3, termYPos);
          doc.setFont('helvetica', 'normal');
          doc.text(term.text, margin + 10, termYPos);
          termYPos += 5;
        }
      });
      
      // Render custom terms/notes
      if (contractData.customTerms && termYPos < yPos + totalHeight - 5) {
        termYPos += 3;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.text('Additional Notes:', margin + 3, termYPos);
        termYPos += 4;
        doc.setFont('helvetica', 'normal');
        customTermLines.forEach((line: string) => {
          if (termYPos < yPos + totalHeight - 2) {
            doc.text(line, margin + 5, termYPos);
            termYPos += 4;
          }
        });
      }
      
      yPos += totalHeight + 5;
    }

    // ========== SIGNATURES SECTION ==========
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    yPos = drawSectionHeader('Signatures & Acknowledgement', yPos);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text('By signing below, both parties acknowledge that they have read, understood, and agree to all terms of this agreement.', margin, yPos + 4);
    yPos += 12;

    // Signature boxes
    const sigBoxWidth = (contentWidth - 10) / 2;
    const sigBoxHeight = 30;

    // Party A Signature Box
    doc.setDrawColor(...black);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPos, sigBoxWidth, sigBoxHeight + 25);
    
    doc.setFillColor(...lightGray);
    doc.rect(margin, yPos, sigBoxWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...black);
    doc.text('Party A - Server Representative', margin + 2, yPos + 4);
    
    // Signature area
    doc.setDrawColor(...gray);
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(margin + 5, yPos + 10, sigBoxWidth - 10, sigBoxHeight - 5);
    doc.setLineDashPattern([], 0);
    
    if (ownerSignature) {
      try {
        doc.addImage(ownerSignature, 'PNG', margin + 7, yPos + 12, sigBoxWidth - 14, sigBoxHeight - 9);
      } catch (e) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.text('[Signature on file]', margin + sigBoxWidth / 2 - 15, yPos + 25);
      }
    }
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Name: ${contractData.serverOwner}`, margin + 3, yPos + sigBoxHeight + 8);
    doc.text(`Date: ${ownerSignedAt ? format(new Date(ownerSignedAt), 'dd/MM/yyyy HH:mm') : '____________________'}`, margin + 3, yPos + sigBoxHeight + 13);
    doc.text('Authorized Signature', margin + 3, yPos + sigBoxHeight + 18);

    // Party B Signature Box
    const partyBX = margin + sigBoxWidth + 10;
    doc.setDrawColor(...black);
    doc.rect(partyBX, yPos, sigBoxWidth, sigBoxHeight + 25);
    
    doc.setFillColor(...lightGray);
    doc.rect(partyBX, yPos, sigBoxWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Party B - Content Creator', partyBX + 2, yPos + 4);
    
    // Signature area
    doc.setDrawColor(...gray);
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(partyBX + 5, yPos + 10, sigBoxWidth - 10, sigBoxHeight - 5);
    doc.setLineDashPattern([], 0);
    
    if (creatorSignature) {
      try {
        doc.addImage(creatorSignature, 'PNG', partyBX + 7, yPos + 12, sigBoxWidth - 14, sigBoxHeight - 9);
      } catch (e) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.text('[Signature on file]', partyBX + sigBoxWidth / 2 - 15, yPos + 25);
      }
    }
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Name: ${contractData.creatorName || '____________________'}`, partyBX + 3, yPos + sigBoxHeight + 8);
    doc.text(`Date: ${creatorSignedAt ? format(new Date(creatorSignedAt), 'dd/MM/yyyy HH:mm') : '____________________'}`, partyBX + 3, yPos + sigBoxHeight + 13);
    doc.text('Creator Signature', partyBX + 3, yPos + sigBoxHeight + 18);

    // Footer
    yPos = pageHeight - 12;
    doc.setDrawColor(...black);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos - 3, pageWidth - margin, yPos - 3);
    
    doc.setFontSize(6);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'italic');
    doc.text('This is a legally binding electronic document. Both parties acknowledge having read and understood all terms and conditions stated herein.', pageWidth / 2, yPos, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Skylife Roleplay India | Content Creator Contract | Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')} | Page ${doc.getNumberOfPages()}`, pageWidth / 2, yPos + 4, { align: 'center' });

    // Add page numbers to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(...gray);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
    }

    // Save
    const fileName = `SLRP-Contract-${contractData.creatorName?.replace(/\s+/g, '-') || 'Draft'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);

    toast({
      title: "Contract Downloaded",
      description: "The contract PDF has been saved.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isOwner) return null;

  return (
    <div className="min-h-screen bg-background py-6 px-4 cursor-default [&_*]:cursor-auto [&_input]:cursor-text [&_textarea]:cursor-text [&_button]:cursor-pointer [&_a]:cursor-pointer">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2 border-border bg-card text-foreground hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Badge 
              variant={contractStatus === 'signed' ? 'default' : 'secondary'} 
              className={`text-sm ${contractStatus === 'signed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : contractStatus === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-muted text-muted-foreground'}`}
            >
              {contractStatus === 'signed' && <CheckCircle className="h-3 w-3 mr-1" />}
              {contractStatus === 'pending' && <Clock className="h-3 w-3 mr-1" />}
              {contractStatus.charAt(0).toUpperCase() + contractStatus.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Templates & Contracts */}
          <div className="lg:col-span-1 space-y-6">
            <Button onClick={handleNewContract} className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" size="lg">
              <Plus className="h-4 w-4" />
              New Contract
            </Button>

            <Tabs defaultValue="contracts" className="w-full">
              <TabsList className="w-full bg-card border border-border">
                <TabsTrigger value="contracts" className="flex-1">Contracts</TabsTrigger>
                <TabsTrigger value="templates" className="flex-1">Templates</TabsTrigger>
              </TabsList>
              <TabsContent value="contracts" className="mt-4">
                <ContractsList 
                  onSelectContract={handleSelectContract}
                  selectedContractId={selectedContractId || undefined}
                  refreshTrigger={refreshTrigger}
                />
              </TabsContent>
              <TabsContent value="templates" className="mt-4">
                <ContractTemplateManager 
                  onSelectTemplate={handleSelectTemplate}
                  selectedTemplateId={selectedTemplateId}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Main Content - Contract Preview/Editor */}
          <div className="lg:col-span-2">
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-4 bg-card rounded-lg p-3 border border-border shadow-lg shadow-primary/5">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {selectedContractId ? 'Edit Contract' : 'New Contract'}
              </h2>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)} size="sm" className="border-border text-foreground hover:bg-muted">
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button onClick={handleSaveContract} size="sm" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Save className="h-4 w-4 mr-1" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(true)} size="sm" className="border-border text-foreground hover:bg-muted">
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button onClick={generatePDF} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                      <Download className="h-4 w-4 mr-1" />
                      Download PDF
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Contract Document */}
            <Card className="bg-card shadow-2xl border border-border overflow-hidden" ref={contractRef}>
              <CardContent className="p-0">
                {/* Contract Header */}
                <div className="relative bg-gradient-to-r from-[hsl(220,20%,8%)] via-[hsl(199,89%,15%)] to-[hsl(220,20%,8%)] text-white p-8 text-center overflow-hidden">
                  {/* Decorative border lines */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[hsl(var(--flag-saffron))] via-[hsl(var(--flag-white))] to-[hsl(var(--flag-green))]" />
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(199_89%_48%/0.15),transparent_70%)]" />
                  <h1 className="text-3xl font-bold tracking-widest mb-2 text-gradient relative z-10" style={{textShadow: '0 0 30px hsl(199 89% 48% / 0.5)'}}>SKYLIFE ROLEPLAY INDIA</h1>
                  <p className="text-lg italic text-primary/80 relative z-10">Content Creator Agreement</p>
                  <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground relative z-10">
                    <span>Contract Date: {format(new Date(), 'dd MMMM yyyy')}</span>
                    {selectedContractId && <span className="text-primary">•</span>}
                    {selectedContractId && <span>ID: {selectedContractId.slice(0, 8)}...</span>}
                  </div>
                </div>

                <div className="p-8 space-y-8 text-foreground">
                  {/* Parties Section */}
                  <section>
                    <h2 className="text-xl font-bold text-primary border-b-2 border-primary/30 pb-2 mb-6 uppercase tracking-wide">
                      Parties to This Agreement
                    </h2>
                    <p className="text-sm italic text-muted-foreground mb-4">
                      This Content Creator Agreement ("Agreement") is entered into between the following parties:
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Party A */}
                      <div className="bg-muted/50 p-5 rounded-xl border border-border relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2 text-lg">
                          <span className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/30">A</span>
                          Server Representative
                        </h3>
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Organization Name</Label>
                              <Input value={contractData.serverName} onChange={(e) => handleInputChange('serverName', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Representative Name</Label>
                              <Input value={contractData.serverOwner} onChange={(e) => handleInputChange('serverOwner', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Email</Label>
                              <Input value={contractData.serverEmail} onChange={(e) => handleInputChange('serverEmail', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Discord Server</Label>
                              <Input value={contractData.serverDiscord} onChange={(e) => handleInputChange('serverDiscord', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Website</Label>
                              <Input value={contractData.serverWebsite} onChange={(e) => handleInputChange('serverWebsite', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Address</Label>
                              <Input value={contractData.serverAddress} onChange={(e) => handleInputChange('serverAddress', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">GSTIN (Optional)</Label>
                              <Input value={contractData.serverGSTIN} onChange={(e) => handleInputChange('serverGSTIN', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" placeholder="Optional" />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-sm">
                            <p><span className="font-bold text-muted-foreground">Organization:</span> <span className="text-foreground">{contractData.serverName}</span></p>
                            <p><span className="font-bold text-muted-foreground">Representative:</span> <span className="text-foreground">{contractData.serverOwner}</span></p>
                            <p><span className="font-bold text-muted-foreground">Email:</span> <span className="text-foreground">{contractData.serverEmail}</span></p>
                            <p><span className="font-bold text-muted-foreground">Discord:</span> <span className="text-foreground">{contractData.serverDiscord}</span></p>
                            <p><span className="font-bold text-muted-foreground">Website:</span> <span className="text-foreground">{contractData.serverWebsite}</span></p>
                            <p><span className="font-bold text-muted-foreground">Address:</span> <span className="text-foreground">{contractData.serverAddress}</span></p>
                            {contractData.serverGSTIN && <p><span className="font-bold text-muted-foreground">GSTIN:</span> <span className="text-foreground">{contractData.serverGSTIN}</span></p>}
                          </div>
                        )}
                      </div>
                      
                      {/* Party B */}
                      <div className="bg-muted/50 p-5 rounded-xl border border-border relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-neon-purple" />
                        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2 text-lg">
                          <span className="w-7 h-7 bg-neon-purple text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-neon-purple/30">B</span>
                          Content Creator
                        </h3>
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Full Legal Name *</Label>
                              <Input value={contractData.creatorName} onChange={(e) => handleInputChange('creatorName', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" placeholder="Required" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Address</Label>
                              <Input value={contractData.creatorAddress} onChange={(e) => handleInputChange('creatorAddress', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Email</Label>
                              <Input type="email" value={contractData.creatorEmail} onChange={(e) => handleInputChange('creatorEmail', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Phone Number</Label>
                              <Input value={contractData.creatorPhone} onChange={(e) => handleInputChange('creatorPhone', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Discord ID</Label>
                              <Input value={contractData.creatorDiscord} onChange={(e) => handleInputChange('creatorDiscord', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">PAN (Optional)</Label>
                              <Input value={contractData.creatorPAN} onChange={(e) => handleInputChange('creatorPAN', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" placeholder="For tax purposes" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Channel Name</Label>
                              <Input value={contractData.channelName} onChange={(e) => handleInputChange('channelName', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Platform Links</Label>
                              <Input value={contractData.platformLinks} onChange={(e) => handleInputChange('platformLinks', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" placeholder="YouTube, Twitch, etc." />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs font-semibold text-muted-foreground">Subscribers</Label>
                                <Input value={contractData.subscriberCount} onChange={(e) => handleInputChange('subscriberCount', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" />
                              </div>
                              <div>
                                <Label className="text-xs font-semibold text-muted-foreground">Avg. Views</Label>
                                <Input value={contractData.averageViews} onChange={(e) => handleInputChange('averageViews', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-sm">
                            <p><span className="font-bold text-muted-foreground">Name:</span> <span className="text-foreground">{contractData.creatorName || <span className="italic text-muted-foreground/50">[To be filled]</span>}</span></p>
                            <p><span className="font-bold text-muted-foreground">Address:</span> <span className="text-foreground">{contractData.creatorAddress || <span className="italic text-muted-foreground/50">[To be filled]</span>}</span></p>
                            <p><span className="font-bold text-muted-foreground">Email:</span> <span className="text-foreground">{contractData.creatorEmail || <span className="italic text-muted-foreground/50">[To be filled]</span>}</span></p>
                            <p><span className="font-bold text-muted-foreground">Phone:</span> <span className="text-foreground">{contractData.creatorPhone || <span className="italic text-muted-foreground/50">[To be filled]</span>}</span></p>
                            <p><span className="font-bold text-muted-foreground">Discord:</span> <span className="text-foreground">{contractData.creatorDiscord || <span className="italic text-muted-foreground/50">[To be filled]</span>}</span></p>
                            {contractData.creatorPAN && <p><span className="font-bold text-muted-foreground">PAN:</span> <span className="text-foreground">{contractData.creatorPAN}</span></p>}
                            <p><span className="font-bold text-muted-foreground">Channel:</span> <span className="text-foreground">{contractData.channelName || <span className="italic text-muted-foreground/50">[To be filled]</span>}</span></p>
                            <p><span className="font-bold text-muted-foreground">Links:</span> <span className="text-foreground">{contractData.platformLinks || <span className="italic text-muted-foreground/50">[To be filled]</span>}</span></p>
                            <p><span className="font-bold text-muted-foreground">Subscribers:</span> <span className="text-foreground">{contractData.subscriberCount || <span className="italic text-muted-foreground/50">[To be filled]</span>}</span></p>
                            <p><span className="font-bold text-muted-foreground">Avg. Views:</span> <span className="text-foreground">{contractData.averageViews || <span className="italic text-muted-foreground/50">[To be filled]</span>}</span></p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Contract Period */}
                  <section>
                    <h2 className="text-xl font-bold text-primary border-b-2 border-primary/30 pb-2 mb-6 uppercase tracking-wide">
                      Contract Period
                    </h2>
                    <div className="grid md:grid-cols-4 gap-4">
                      {isEditing ? (
                        <>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground">Duration</Label>
                            <Select value={contractData.contractDuration} onValueChange={(v) => handleInputChange('contractDuration', v)}>
                              <SelectTrigger className="h-9 mt-1 bg-input border-border text-foreground"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1 month">1 Month</SelectItem>
                                <SelectItem value="3 months">3 Months</SelectItem>
                                <SelectItem value="6 months">6 Months</SelectItem>
                                <SelectItem value="12 months">12 Months</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground">Start Date</Label>
                            <Input type="date" value={contractData.startDate} onChange={(e) => handleInputChange('startDate', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground">End Date</Label>
                            <Input type="date" value={contractData.endDate} onChange={(e) => handleInputChange('endDate', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground">Exclusivity</Label>
                            <Select value={contractData.exclusivityClause} onValueChange={(v) => handleInputChange('exclusivityClause', v)}>
                              <SelectTrigger className="h-9 mt-1 bg-input border-border text-foreground"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Non-exclusive">Non-exclusive</SelectItem>
                                <SelectItem value="Exclusive">Exclusive</SelectItem>
                                <SelectItem value="Semi-exclusive">Semi-exclusive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-muted/50 p-4 rounded-lg text-center border border-border">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Duration</p>
                            <p className="font-bold text-foreground text-lg">{contractData.contractDuration}</p>
                          </div>
                          <div className="bg-muted/50 p-4 rounded-lg text-center border border-border">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Start Date</p>
                            <p className="font-bold text-foreground">{format(new Date(contractData.startDate), 'dd MMM yyyy')}</p>
                          </div>
                          <div className="bg-muted/50 p-4 rounded-lg text-center border border-border">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">End Date</p>
                            <p className="font-bold text-foreground">{format(new Date(contractData.endDate), 'dd MMM yyyy')}</p>
                          </div>
                          <div className="bg-muted/50 p-4 rounded-lg text-center border border-border">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Exclusivity</p>
                            <p className="font-bold text-foreground italic">{contractData.exclusivityClause}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </section>

                  {/* Compensation */}
                  <section>
                    <h2 className="text-xl font-bold text-primary border-b-2 border-primary/30 pb-2 mb-6 uppercase tracking-wide">
                      Compensation & Payment
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      {isEditing ? (
                        <>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground">Monthly Payment (₹)</Label>
                            <Input value={contractData.monthlyPayment} onChange={(e) => handleInputChange('monthlyPayment', e.target.value)} className="h-10 mt-1 text-lg font-bold bg-input border-border text-foreground" />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground">Payment Method</Label>
                            <Input value={contractData.paymentMethod} onChange={(e) => handleInputChange('paymentMethod', e.target.value)} className="h-10 mt-1 bg-input border-border text-foreground" />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs font-semibold text-muted-foreground">Performance Bonus</Label>
                            <Input value={contractData.performanceBonus} onChange={(e) => handleInputChange('performanceBonus', e.target.value)} className="h-10 mt-1 bg-input border-border text-foreground" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
                            <p className="text-xs text-emerald-400 uppercase font-semibold mb-1">Monthly Retainer</p>
                            <p className="text-3xl font-bold text-emerald-300">₹{contractData.monthlyPayment}</p>
                            <p className="text-sm text-emerald-400/70 mt-2">via {contractData.paymentMethod}</p>
                          </div>
                          <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                            <p className="text-xs text-amber-400 uppercase font-semibold mb-1">Performance Bonus</p>
                            <p className="text-lg font-semibold text-amber-300 italic">{contractData.performanceBonus}</p>
                            <p className="text-sm text-amber-400/70 mt-2">Payment within 7 working days of month end</p>
                          </div>
                        </>
                      )}
                    </div>
                  </section>

                  {/* Content Requirements */}
                  <section>
                    <h2 className="text-xl font-bold text-primary border-b-2 border-primary/30 pb-2 mb-6 uppercase tracking-wide">
                      Content Deliverables
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      {isEditing ? (
                        <>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground">Minimum Videos per Month</Label>
                            <Input value={contractData.minimumVideos} onChange={(e) => handleInputChange('minimumVideos', e.target.value)} className="h-10 mt-1 text-lg font-bold bg-input border-border text-foreground" />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground">Minimum Stream Hours per Month</Label>
                            <Input value={contractData.minimumStreams} onChange={(e) => handleInputChange('minimumStreams', e.target.value)} className="h-10 mt-1 text-lg font-bold bg-input border-border text-foreground" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-neon-purple/10 border border-neon-purple/30 p-5 rounded-xl text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-neon-purple to-transparent" />
                            <p className="text-4xl font-bold text-neon-purple">{contractData.minimumVideos}</p>
                            <p className="text-sm font-semibold text-neon-purple/70 uppercase">Videos / Month</p>
                          </div>
                          <div className="bg-neon-cyan/10 border border-neon-cyan/30 p-5 rounded-xl text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent" />
                            <p className="text-4xl font-bold text-neon-cyan">{contractData.minimumStreams}</p>
                            <p className="text-sm font-semibold text-neon-cyan/70 uppercase">Stream Hours / Month</p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg border border-border">
                      <p className="font-bold text-foreground mb-2">Content Guidelines:</p>
                      <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                        <li>All content <strong className="text-foreground">must prominently feature</strong> Skylife Roleplay India gameplay</li>
                        <li>Server name and Discord link <strong className="text-foreground">required</strong> in all video descriptions</li>
                        <li>Content must adhere to <em>community guidelines</em> and be family-friendly</li>
                        <li><strong className="text-foreground">No promotion</strong> of competing GTA RP servers during contract period</li>
                      </ul>
                    </div>
                  </section>

                  {/* Obligations */}
                  <section className="grid md:grid-cols-2 gap-6">
                    <div className="bg-muted/30 p-5 rounded-xl border border-border">
                      <h2 className="text-xl font-bold text-primary border-b-2 border-primary/30 pb-2 mb-4 uppercase tracking-wide">
                        Creator Obligations
                      </h2>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2"><span className="text-primary font-bold">1.</span> Maintain <strong className="text-foreground">active presence</strong> on the server</li>
                        <li className="flex items-start gap-2"><span className="text-primary font-bold">2.</span> Engage <em>positively</em> with the community</li>
                        <li className="flex items-start gap-2"><span className="text-primary font-bold">3.</span> Report technical issues promptly</li>
                        <li className="flex items-start gap-2"><span className="text-primary font-bold">4.</span> Provide <strong className="text-foreground">14 days notice</strong> before termination</li>
                        <li className="flex items-start gap-2"><span className="text-primary font-bold">5.</span> Maintain <em>confidentiality</em> of server information</li>
                        <li className="flex items-start gap-2"><span className="text-primary font-bold">6.</span> Follow all server rules and regulations</li>
                      </ul>
                    </div>
                    <div className="bg-muted/30 p-5 rounded-xl border border-border">
                      <h2 className="text-xl font-bold text-primary border-b-2 border-primary/30 pb-2 mb-4 uppercase tracking-wide">
                        Server Obligations
                      </h2>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2"><span className="text-primary font-bold">1.</span> Provide <strong className="text-foreground">priority queue access</strong></li>
                        <li className="flex items-start gap-2"><span className="text-primary font-bold">2.</span> Offer <em>dedicated support</em> for content creation</li>
                        <li className="flex items-start gap-2"><span className="text-primary font-bold">3.</span> Feature creator content on official channels</li>
                        <li className="flex items-start gap-2"><span className="text-primary font-bold">4.</span> Provide agreed-upon <strong className="text-foreground">in-game perks</strong></li>
                        <li className="flex items-start gap-2"><span className="text-primary font-bold">5.</span> Maintain open communication</li>
                        <li className="flex items-start gap-2"><span className="text-primary font-bold">6.</span> Process payments <em>on time</em></li>
                      </ul>
                    </div>
                  </section>

                  {/* Termination */}
                  <section>
                    <h2 className="text-xl font-bold text-primary border-b-2 border-primary/30 pb-2 mb-4 uppercase tracking-wide">
                      Termination Clause
                    </h2>
                    <div className="bg-destructive/10 border border-destructive/30 p-5 rounded-xl">
                      <p className="text-sm mb-3 italic text-muted-foreground">
                        Either party may terminate this agreement with <strong className="text-foreground">14 days written notice</strong>.
                      </p>
                      <p className="text-sm font-bold text-destructive mb-2">Grounds for Immediate Termination:</p>
                      <ul className="text-sm space-y-1 text-destructive/80 list-disc list-inside">
                        <li>Violation of server rules or community guidelines</li>
                        <li>Failure to meet deliverables for <strong>2 consecutive months</strong></li>
                        <li>Actions damaging to either party's reputation</li>
                        <li>Breach of confidentiality obligations</li>
                        <li>Engagement in fraudulent or illegal activities</li>
                      </ul>
                    </div>
                  </section>

                  {/* Special Terms */}
                  <section>
                    <h2 className="text-xl font-bold text-primary border-b-2 border-primary/30 pb-2 mb-4 uppercase tracking-wide">
                      Special Terms & Conditions
                    </h2>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="bg-muted/50 p-4 rounded-lg border border-border">
                          <p className="text-sm font-semibold text-foreground mb-3">Select applicable terms:</p>
                          <div className="space-y-3">
                            {contractData.specialTermsList.map((term, index) => (
                              <div key={term.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted transition-colors">
                                <Checkbox
                                  id={`term-${term.id}`}
                                  checked={term.enabled}
                                  onCheckedChange={() => handleToggleSpecialTerm(term.id)}
                                  className="mt-0.5"
                                />
                                {index < 8 ? (
                                  <label
                                    htmlFor={`term-${term.id}`}
                                    className={`text-sm cursor-pointer ${term.enabled ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                                  >
                                    {term.text}
                                  </label>
                                ) : (
                                  <div className="flex-1 flex items-center gap-2">
                                    <Input
                                      value={term.text}
                                      onChange={(e) => handleUpdateCustomTerm(term.id, e.target.value)}
                                      placeholder="Enter custom term..."
                                      className="flex-1 h-8 bg-input border-border text-foreground text-sm"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => handleRemoveCustomTerm(term.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddCustomTerm}
                            className="mt-4 gap-2 border-border"
                          >
                            <PlusCircle className="h-4 w-4" />
                            Add Custom Term
                          </Button>
                        </div>

                        <div>
                          <Label className="text-xs font-semibold text-muted-foreground">Additional Notes / Custom Terms</Label>
                          <Textarea
                            value={contractData.customTerms}
                            onChange={(e) => handleInputChange('customTerms', e.target.value)}
                            placeholder="Add any additional custom terms or notes that aren't covered above..."
                            className="min-h-[80px] mt-1 bg-input border-border text-foreground"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/50 p-4 rounded-lg border border-border">
                        {getActiveSpecialTerms().length > 0 || contractData.customTerms ? (
                          <div className="space-y-3">
                            {getActiveSpecialTerms().length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Agreed Terms:</p>
                                <ul className="space-y-2">
                                  {getActiveSpecialTerms().map((term, index) => (
                                    <li key={term.id} className="flex items-start gap-2 text-sm text-foreground">
                                      <span className="text-emerald-400 font-bold flex-shrink-0">{index + 1}.</span>
                                      <span>{term.text}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {contractData.customTerms && (
                              <div className="pt-3 border-t border-border">
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Additional Notes:</p>
                                <p className="text-sm text-foreground whitespace-pre-wrap italic">
                                  {contractData.customTerms}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="italic text-muted-foreground">No special terms specified.</p>
                        )}
                      </div>
                    )}
                  </section>

                  {/* Electronic Signatures */}
                  <section className="pt-8 border-t-2 border-border">
                    <h2 className="text-xl font-bold text-primary mb-2 uppercase tracking-wide">
                      Electronic Signatures
                    </h2>
                    <p className="text-sm italic text-muted-foreground mb-6">
                      By signing below, both parties acknowledge that they have read, understood, and agree to all terms of this agreement.
                      Electronic signatures are legally binding and include timestamp verification.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Party A Signature */}
                      <div className="bg-muted/50 p-5 rounded-xl border border-border">
                        {savedOwnerSignature && !ownerSignature && (
                          <div className="mb-3 p-2 bg-primary/10 rounded border border-primary/30 flex items-center justify-between">
                            <p className="text-xs text-primary">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              Saved signature available — will auto-apply on save
                            </p>
                            <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={() => { clearSavedOwnerSignature(); setOwnerSignature(null); setOwnerSignedAt(null); }}>
                              Clear Saved
                            </Button>
                          </div>
                        )}
                        <SignaturePad
                          label="Party A - Server Representative"
                          onSave={handleOwnerSign}
                          existingSignature={ownerSignature || undefined}
                          disabled={!!ownerSignature}
                        />
                        {ownerSignedAt && (
                          <div className="mt-3 p-2 bg-emerald-500/10 rounded border border-emerald-500/30">
                            <p className="text-xs text-emerald-400">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              Signed on: {format(new Date(ownerSignedAt), 'dd MMM yyyy, HH:mm:ss')}
                            </p>
                            <p className="text-xs text-emerald-400/70">By: {contractData.serverOwner}</p>
                          </div>
                        )}
                        {ownerSignature && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 text-xs w-full border-border"
                            onClick={() => { setOwnerSignature(null); setOwnerSignedAt(null); }}
                          >
                            Re-sign
                          </Button>
                        )}
                      </div>

                      {/* Party B Signature */}
                      <div className="bg-muted/50 p-5 rounded-xl border border-border">
                        <SignaturePad
                          label="Party B - Content Creator"
                          onSave={handleCreatorSign}
                          existingSignature={creatorSignature || undefined}
                          disabled={!!creatorSignature}
                        />
                        {creatorSignedAt && (
                          <div className="mt-3 p-2 bg-emerald-500/10 rounded border border-emerald-500/30">
                            <p className="text-xs text-emerald-400">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              Signed on: {format(new Date(creatorSignedAt), 'dd MMM yyyy, HH:mm:ss')}
                            </p>
                            <p className="text-xs text-emerald-400/70">By: {contractData.creatorName || 'Creator'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Footer */}
                  <div className="text-center pt-8 border-t border-border text-xs text-muted-foreground">
                    <div className="h-[2px] w-full bg-gradient-to-r from-[hsl(var(--flag-saffron))] via-[hsl(var(--flag-white))] to-[hsl(var(--flag-green))] mb-6 rounded-full" />
                    <p className="italic">This is a legally binding document. Both parties acknowledge having read and understood all terms and conditions stated herein.</p>
                    <p className="mt-2 font-semibold text-primary">Skylife Roleplay India | Content Creator Contract</p>
                    <p className="mt-1">Generated: {format(new Date(), 'dd MMMM yyyy, HH:mm')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorContract;
