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
import { ArrowLeft, Download, Edit2, Save, X, Plus, FileText, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import jsPDF from "jspdf";
import SignaturePad from "@/components/SignaturePad";
import ContractTemplateManager from "@/components/ContractTemplateManager";
import ContractsList from "@/components/ContractsList";
import type { Json } from "@/integrations/supabase/types";

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
  exclusivityClause: string;
  performanceBonus: string;
}

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

  useEffect(() => {
    checkOwnerAccess();
  }, []);

  const checkOwnerAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: isOwnerResult } = await supabase.rpc("is_owner", { _user_id: user.id });
      
      if (!isOwnerResult) {
        toast({
          title: "Access Denied",
          description: "Only the owner can access this page.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsOwner(true);
    } catch (error) {
      console.error("Error checking owner access:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ContractData, value: string) => {
    setContractData(prev => ({ ...prev, [field]: value }));
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
    setOwnerSignature(null);
    setOwnerSignedAt(null);
    setCreatorSignature(null);
    setCreatorSignedAt(null);
    setIsEditing(true);
  };

  const handleSaveContract = async () => {
    if (!contractData.creatorName.trim()) {
      toast({ title: "Please enter creator name", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
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
      };

      if (selectedContractId) {
        const { error } = await supabase
          .from("creator_contracts")
          .update(contractPayload)
          .eq("id", selectedContractId);

        if (error) throw error;
        toast({ title: "Contract updated successfully" });
      } else {
        const { data, error } = await supabase
          .from("creator_contracts")
          .insert(contractPayload)
          .select()
          .single();

        if (error) throw error;
        setSelectedContractId(data.id);
        toast({ title: "Contract saved successfully" });
      }

      setIsEditing(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error saving contract:", error);
      toast({ title: "Failed to save contract", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleOwnerSign = (signature: string) => {
    setOwnerSignature(signature);
    setOwnerSignedAt(new Date().toISOString());
    toast({ title: "Owner signature recorded", description: "Remember to save the contract" });
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

    doc.rect(margin, yPos, contentWidth, 33);
    
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

    // ========== TERMINATION SECTION ==========
    yPos = drawSectionHeader('Termination Clause', yPos);

    doc.rect(margin, yPos, contentWidth, 35);
    
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
    if (contractData.specialTerms) {
      yPos = drawSectionHeader('Special Terms & Conditions', yPos);
      
      const termLines = doc.splitTextToSize(contractData.specialTerms, contentWidth - 6);
      const termHeight = Math.max(20, termLines.length * 4 + 6);
      
      doc.rect(margin, yPos, contentWidth, termHeight);
      doc.setFont('helvetica', 'normal');
      
      let termYPos = yPos + 5;
      termLines.forEach((line: string) => {
        if (termYPos < yPos + termHeight - 2) {
          doc.text(line, margin + 3, termYPos);
          termYPos += 4;
        }
      });
      yPos += termHeight + 5;
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isOwner) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2 bg-white shadow-sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant={contractStatus === 'signed' ? 'default' : 'secondary'} className="text-sm">
              {contractStatus === 'signed' && <CheckCircle className="h-3 w-3 mr-1" />}
              {contractStatus === 'pending' && <Clock className="h-3 w-3 mr-1" />}
              {contractStatus.charAt(0).toUpperCase() + contractStatus.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Templates & Contracts */}
          <div className="lg:col-span-1 space-y-6">
            <Button onClick={handleNewContract} className="w-full gap-2" size="lg">
              <Plus className="h-4 w-4" />
              New Contract
            </Button>

            <Tabs defaultValue="contracts" className="w-full">
              <TabsList className="w-full bg-white">
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
            <div className="flex items-center justify-between mb-4 bg-white rounded-lg p-3 shadow-sm">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                {selectedContractId ? 'Edit Contract' : 'New Contract'}
              </h2>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button onClick={handleSaveContract} size="sm" disabled={saving}>
                      <Save className="h-4 w-4 mr-1" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(true)} size="sm">
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button onClick={generatePDF} size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Download className="h-4 w-4 mr-1" />
                      Download PDF
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Contract Document */}
            <Card className="bg-white shadow-2xl border-0 overflow-hidden" ref={contractRef}>
              <CardContent className="p-0">
                {/* Contract Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-8 text-center">
                  <h1 className="text-3xl font-bold tracking-wide mb-2">SKYLIFE ROLEPLAY INDIA</h1>
                  <p className="text-lg italic opacity-90">Content Creator Agreement</p>
                  <div className="mt-4 flex items-center justify-center gap-4 text-sm opacity-70">
                    <span>Contract Date: {format(new Date(), 'dd MMMM yyyy')}</span>
                    {selectedContractId && <span>•</span>}
                    {selectedContractId && <span>ID: {selectedContractId.slice(0, 8)}...</span>}
                  </div>
                </div>

                <div className="p-8 space-y-8 text-slate-800">
                  {/* Parties Section */}
                  <section>
                    <h2 className="text-xl font-bold text-blue-700 border-b-2 border-blue-200 pb-2 mb-6 uppercase tracking-wide">
                      Parties to This Agreement
                    </h2>
                    <p className="text-sm italic text-slate-600 mb-4">
                      This Content Creator Agreement ("Agreement") is entered into between the following parties:
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Party A */}
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                          <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">A</span>
                          Server Representative
                        </h3>
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs font-semibold text-slate-700">Organization Name</Label>
                              <Input value={contractData.serverName} onChange={(e) => handleInputChange('serverName', e.target.value)} className="h-9 mt-1 bg-white border-slate-300 text-slate-900" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-700">Representative Name</Label>
                              <Input value={contractData.serverOwner} onChange={(e) => handleInputChange('serverOwner', e.target.value)} className="h-9 mt-1 bg-white border-slate-300 text-slate-900" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-700">Email</Label>
                              <Input value={contractData.serverEmail} onChange={(e) => handleInputChange('serverEmail', e.target.value)} className="h-9 mt-1 bg-white border-slate-300 text-slate-900" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-700">Discord Server</Label>
                              <Input value={contractData.serverDiscord} onChange={(e) => handleInputChange('serverDiscord', e.target.value)} className="h-9 mt-1 bg-white border-slate-300 text-slate-900" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-700">Website</Label>
                              <Input value={contractData.serverWebsite} onChange={(e) => handleInputChange('serverWebsite', e.target.value)} className="h-9 mt-1 bg-white border-slate-300 text-slate-900" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-700">Address</Label>
                              <Input value={contractData.serverAddress} onChange={(e) => handleInputChange('serverAddress', e.target.value)} className="h-9 mt-1 bg-white border-slate-300 text-slate-900" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-700">GSTIN (Optional)</Label>
                              <Input value={contractData.serverGSTIN} onChange={(e) => handleInputChange('serverGSTIN', e.target.value)} className="h-9 mt-1 bg-white border-slate-300 text-slate-900" placeholder="Optional" />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-sm">
                            <p><span className="font-bold text-slate-700">Organization:</span> {contractData.serverName}</p>
                            <p><span className="font-bold text-slate-700">Representative:</span> {contractData.serverOwner}</p>
                            <p><span className="font-bold text-slate-700">Email:</span> {contractData.serverEmail}</p>
                            <p><span className="font-bold text-slate-700">Discord:</span> {contractData.serverDiscord}</p>
                            <p><span className="font-bold text-slate-700">Website:</span> {contractData.serverWebsite}</p>
                            <p><span className="font-bold text-slate-700">Address:</span> {contractData.serverAddress}</p>
                            {contractData.serverGSTIN && <p><span className="font-bold text-slate-700">GSTIN:</span> {contractData.serverGSTIN}</p>}
                          </div>
                        )}
                      </div>
                      
                      {/* Party B */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                          <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">B</span>
                          Content Creator
                        </h3>
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs font-semibold text-slate-700">Full Legal Name *</Label>
                              <Input value={contractData.creatorName} onChange={(e) => handleInputChange('creatorName', e.target.value)} className="h-9 mt-1 bg-white border-slate-300 text-slate-900" placeholder="Required" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-700">Address</Label>
                              <Input value={contractData.creatorAddress} onChange={(e) => handleInputChange('creatorAddress', e.target.value)} className="h-9 mt-1 bg-white border-slate-300 text-slate-900" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-700">Email</Label>
                              <Input type="email" value={contractData.creatorEmail} onChange={(e) => handleInputChange('creatorEmail', e.target.value)} className="h-9 mt-1 bg-white border-slate-300 text-slate-900" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-700">Phone Number</Label>
                              <Input value={contractData.creatorPhone} onChange={(e) => handleInputChange('creatorPhone', e.target.value)} className="h-9 mt-1 bg-white border-slate-300 text-slate-900" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-700">Discord ID</Label>
                              <Input value={contractData.creatorDiscord} onChange={(e) => handleInputChange('creatorDiscord', e.target.value)} className="h-9 mt-1 bg-white border-slate-300 text-slate-900" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-700">PAN (Optional)</Label>
                              <Input value={contractData.creatorPAN} onChange={(e) => handleInputChange('creatorPAN', e.target.value)} className="h-9 mt-1 bg-white border-slate-300 text-slate-900" placeholder="For tax purposes" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-700">Channel Name</Label>
                              <Input value={contractData.channelName} onChange={(e) => handleInputChange('channelName', e.target.value)} className="h-9 mt-1 bg-white border-slate-300 text-slate-900" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-700">Platform Links</Label>
                              <Input value={contractData.platformLinks} onChange={(e) => handleInputChange('platformLinks', e.target.value)} className="h-9 mt-1 bg-white border-slate-300 text-slate-900" placeholder="YouTube, Twitch, etc." />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs font-semibold text-slate-700">Subscribers</Label>
                                <Input value={contractData.subscriberCount} onChange={(e) => handleInputChange('subscriberCount', e.target.value)} className="h-9 mt-1 bg-white border-slate-300 text-slate-900" />
                              </div>
                              <div>
                                <Label className="text-xs font-semibold text-slate-700">Avg. Views</Label>
                                <Input value={contractData.averageViews} onChange={(e) => handleInputChange('averageViews', e.target.value)} className="h-9 mt-1 bg-white border-slate-300 text-slate-900" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-sm">
                            <p><span className="font-bold text-slate-700">Name:</span> {contractData.creatorName || <span className="italic text-slate-400">[To be filled]</span>}</p>
                            <p><span className="font-bold text-slate-700">Address:</span> {contractData.creatorAddress || <span className="italic text-slate-400">[To be filled]</span>}</p>
                            <p><span className="font-bold text-slate-700">Email:</span> {contractData.creatorEmail || <span className="italic text-slate-400">[To be filled]</span>}</p>
                            <p><span className="font-bold text-slate-700">Phone:</span> {contractData.creatorPhone || <span className="italic text-slate-400">[To be filled]</span>}</p>
                            <p><span className="font-bold text-slate-700">Discord:</span> {contractData.creatorDiscord || <span className="italic text-slate-400">[To be filled]</span>}</p>
                            {contractData.creatorPAN && <p><span className="font-bold text-slate-700">PAN:</span> {contractData.creatorPAN}</p>}
                            <p><span className="font-bold text-slate-700">Channel:</span> {contractData.channelName || <span className="italic text-slate-400">[To be filled]</span>}</p>
                            <p><span className="font-bold text-slate-700">Links:</span> {contractData.platformLinks || <span className="italic text-slate-400">[To be filled]</span>}</p>
                            <p><span className="font-bold text-slate-700">Subscribers:</span> {contractData.subscriberCount || <span className="italic text-slate-400">[To be filled]</span>}</p>
                            <p><span className="font-bold text-slate-700">Avg. Views:</span> {contractData.averageViews || <span className="italic text-slate-400">[To be filled]</span>}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Contract Period */}
                  <section>
                    <h2 className="text-xl font-bold text-blue-700 border-b-2 border-blue-200 pb-2 mb-6 uppercase tracking-wide">
                      Contract Period
                    </h2>
                    <div className="grid md:grid-cols-4 gap-4">
                      {isEditing ? (
                        <>
                          <div>
                            <Label className="text-xs font-semibold text-slate-700">Duration</Label>
                            <Select value={contractData.contractDuration} onValueChange={(v) => handleInputChange('contractDuration', v)}>
                              <SelectTrigger className="h-9 mt-1 bg-white border-slate-300 text-slate-900"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1 month">1 Month</SelectItem>
                                <SelectItem value="3 months">3 Months</SelectItem>
                                <SelectItem value="6 months">6 Months</SelectItem>
                                <SelectItem value="12 months">12 Months</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-700">Start Date</Label>
                            <Input type="date" value={contractData.startDate} onChange={(e) => handleInputChange('startDate', e.target.value)} className="h-9 mt-1 bg-white border-slate-300 text-slate-900" />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-700">End Date</Label>
                            <Input type="date" value={contractData.endDate} onChange={(e) => handleInputChange('endDate', e.target.value)} className="h-9 mt-1 bg-white border-slate-300 text-slate-900" />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-700">Exclusivity</Label>
                            <Select value={contractData.exclusivityClause} onValueChange={(v) => handleInputChange('exclusivityClause', v)}>
                              <SelectTrigger className="h-9 mt-1 bg-white border-slate-300 text-slate-900"><SelectValue /></SelectTrigger>
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
                          <div className="bg-slate-50 p-4 rounded-lg text-center">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Duration</p>
                            <p className="font-bold text-slate-800 text-lg">{contractData.contractDuration}</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-lg text-center">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Start Date</p>
                            <p className="font-bold text-slate-800">{format(new Date(contractData.startDate), 'dd MMM yyyy')}</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-lg text-center">
                            <p className="text-xs text-slate-500 uppercase font-semibold">End Date</p>
                            <p className="font-bold text-slate-800">{format(new Date(contractData.endDate), 'dd MMM yyyy')}</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-lg text-center">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Exclusivity</p>
                            <p className="font-bold text-slate-800 italic">{contractData.exclusivityClause}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </section>

                  {/* Compensation */}
                  <section>
                    <h2 className="text-xl font-bold text-blue-700 border-b-2 border-blue-200 pb-2 mb-6 uppercase tracking-wide">
                      Compensation & Payment
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      {isEditing ? (
                        <>
                          <div>
                            <Label className="text-xs font-semibold text-slate-700">Monthly Payment (₹)</Label>
                            <Input value={contractData.monthlyPayment} onChange={(e) => handleInputChange('monthlyPayment', e.target.value)} className="h-10 mt-1 text-lg font-bold bg-white border-slate-300 text-slate-900" />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-700">Payment Method</Label>
                            <Input value={contractData.paymentMethod} onChange={(e) => handleInputChange('paymentMethod', e.target.value)} className="h-10 mt-1 bg-white border-slate-300 text-slate-900" />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs font-semibold text-slate-700">Performance Bonus</Label>
                            <Input value={contractData.performanceBonus} onChange={(e) => handleInputChange('performanceBonus', e.target.value)} className="h-10 mt-1 bg-white border-slate-300 text-slate-900" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-green-50 border border-green-200 p-5 rounded-xl">
                            <p className="text-xs text-green-700 uppercase font-semibold mb-1">Monthly Retainer</p>
                            <p className="text-3xl font-bold text-green-800">₹{contractData.monthlyPayment}</p>
                            <p className="text-sm text-green-600 mt-2">via {contractData.paymentMethod}</p>
                          </div>
                          <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl">
                            <p className="text-xs text-amber-700 uppercase font-semibold mb-1">Performance Bonus</p>
                            <p className="text-lg font-semibold text-amber-800 italic">{contractData.performanceBonus}</p>
                            <p className="text-sm text-amber-600 mt-2">Payment within 7 working days of month end</p>
                          </div>
                        </>
                      )}
                    </div>
                  </section>

                  {/* Content Requirements */}
                  <section>
                    <h2 className="text-xl font-bold text-blue-700 border-b-2 border-blue-200 pb-2 mb-6 uppercase tracking-wide">
                      Content Deliverables
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      {isEditing ? (
                        <>
                          <div>
                            <Label className="text-xs font-semibold text-slate-700">Minimum Videos per Month</Label>
                            <Input value={contractData.minimumVideos} onChange={(e) => handleInputChange('minimumVideos', e.target.value)} className="h-10 mt-1 text-lg font-bold bg-white border-slate-300 text-slate-900" />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-700">Minimum Stream Hours per Month</Label>
                            <Input value={contractData.minimumStreams} onChange={(e) => handleInputChange('minimumStreams', e.target.value)} className="h-10 mt-1 text-lg font-bold bg-white border-slate-300 text-slate-900" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-purple-50 border border-purple-200 p-5 rounded-xl text-center">
                            <p className="text-4xl font-bold text-purple-800">{contractData.minimumVideos}</p>
                            <p className="text-sm font-semibold text-purple-600 uppercase">Videos / Month</p>
                          </div>
                          <div className="bg-cyan-50 border border-cyan-200 p-5 rounded-xl text-center">
                            <p className="text-4xl font-bold text-cyan-800">{contractData.minimumStreams}</p>
                            <p className="text-sm font-semibold text-cyan-600 uppercase">Stream Hours / Month</p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="font-bold text-slate-700 mb-2">Content Guidelines:</p>
                      <ul className="text-sm space-y-1 text-slate-600 list-disc list-inside">
                        <li>All content <strong>must prominently feature</strong> Skylife Roleplay India gameplay</li>
                        <li>Server name and Discord link <strong>required</strong> in all video descriptions</li>
                        <li>Content must adhere to <em>community guidelines</em> and be family-friendly</li>
                        <li><strong>No promotion</strong> of competing GTA RP servers during contract period</li>
                      </ul>
                    </div>
                  </section>

                  {/* Obligations */}
                  <section className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h2 className="text-xl font-bold text-blue-700 border-b-2 border-blue-200 pb-2 mb-4 uppercase tracking-wide">
                        Creator Obligations
                      </h2>
                      <ul className="text-sm space-y-2 text-slate-700">
                        <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">1.</span> Maintain <strong>active presence</strong> on the server</li>
                        <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">2.</span> Engage <em>positively</em> with the community</li>
                        <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">3.</span> Report technical issues promptly</li>
                        <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">4.</span> Provide <strong>14 days notice</strong> before termination</li>
                        <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">5.</span> Maintain <em>confidentiality</em> of server information</li>
                        <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">6.</span> Follow all server rules and regulations</li>
                      </ul>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-blue-700 border-b-2 border-blue-200 pb-2 mb-4 uppercase tracking-wide">
                        Server Obligations
                      </h2>
                      <ul className="text-sm space-y-2 text-slate-700">
                        <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">1.</span> Provide <strong>priority queue access</strong></li>
                        <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">2.</span> Offer <em>dedicated support</em> for content creation</li>
                        <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">3.</span> Feature creator content on official channels</li>
                        <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">4.</span> Provide agreed-upon <strong>in-game perks</strong></li>
                        <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">5.</span> Maintain open communication</li>
                        <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">6.</span> Process payments <em>on time</em></li>
                      </ul>
                    </div>
                  </section>

                  {/* Termination */}
                  <section>
                    <h2 className="text-xl font-bold text-blue-700 border-b-2 border-blue-200 pb-2 mb-4 uppercase tracking-wide">
                      Termination Clause
                    </h2>
                    <div className="bg-red-50 border border-red-200 p-5 rounded-xl">
                      <p className="text-sm mb-3 italic text-slate-700">
                        Either party may terminate this agreement with <strong>14 days written notice</strong>.
                      </p>
                      <p className="text-sm font-bold text-red-800 mb-2">Grounds for Immediate Termination:</p>
                      <ul className="text-sm space-y-1 text-red-700 list-disc list-inside">
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
                    <h2 className="text-xl font-bold text-blue-700 border-b-2 border-blue-200 pb-2 mb-4 uppercase tracking-wide">
                      Special Terms & Conditions
                    </h2>
                    {isEditing ? (
                      <Textarea
                        value={contractData.specialTerms}
                        onChange={(e) => handleInputChange('specialTerms', e.target.value)}
                        placeholder="Add any special terms, conditions, or additional agreements here...

Example:
• Creator will receive exclusive in-game vehicle
• Creator agrees to participate in server events
• Server will provide VIP status for creator's friends
• Additional bonus of ₹500 for every sponsored video"
                        className="min-h-[150px] bg-white border-slate-300 text-slate-900"
                      />
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-lg min-h-[80px] border border-slate-200">
                        {contractData.specialTerms ? (
                          <div className="text-sm text-slate-700 whitespace-pre-wrap">
                            {contractData.specialTerms.split('\n').map((line, i) => (
                              <p key={i} className={line.startsWith('•') ? 'ml-2' : ''}>{line}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="italic text-slate-400">No special terms specified.</p>
                        )}
                      </div>
                    )}
                  </section>

                  {/* Electronic Signatures */}
                  <section className="pt-8 border-t-2 border-slate-200">
                    <h2 className="text-xl font-bold text-blue-700 mb-2 uppercase tracking-wide">
                      Electronic Signatures
                    </h2>
                    <p className="text-sm italic text-slate-500 mb-6">
                      By signing below, both parties acknowledge that they have read, understood, and agree to all terms of this agreement.
                      Electronic signatures are legally binding and include timestamp verification.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Party A Signature */}
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <SignaturePad
                          label="Party A - Server Representative"
                          onSave={handleOwnerSign}
                          existingSignature={ownerSignature || undefined}
                          disabled={!!ownerSignature}
                        />
                        {ownerSignedAt && (
                          <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                            <p className="text-xs text-green-700">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              Signed on: {format(new Date(ownerSignedAt), 'dd MMM yyyy, HH:mm:ss')}
                            </p>
                            <p className="text-xs text-green-600">By: {contractData.serverOwner}</p>
                          </div>
                        )}
                      </div>

                      {/* Party B Signature */}
                      <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                        <SignaturePad
                          label="Party B - Content Creator"
                          onSave={handleCreatorSign}
                          existingSignature={creatorSignature || undefined}
                          disabled={!!creatorSignature}
                        />
                        {creatorSignedAt && (
                          <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                            <p className="text-xs text-green-700">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              Signed on: {format(new Date(creatorSignedAt), 'dd MMM yyyy, HH:mm:ss')}
                            </p>
                            <p className="text-xs text-green-600">By: {contractData.creatorName || 'Creator'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Footer */}
                  <div className="text-center pt-8 border-t text-xs text-slate-400">
                    <p className="italic">This is a legally binding document. Both parties acknowledge having read and understood all terms and conditions stated herein.</p>
                    <p className="mt-2 font-semibold">Skylife Roleplay India | Content Creator Contract</p>
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
