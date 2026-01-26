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
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 0;

    // Header with dark background
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SKYLIFE ROLEPLAY INDIA', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'italic');
    doc.text('Content Creator Agreement', pageWidth / 2, 32, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Contract ID: ${selectedContractId || 'DRAFT'}`, pageWidth / 2, 42, { align: 'center' });

    yPos = 60;

    // Section helper with enhanced styling
    const addSection = (title: string, content: { label: string; value: string; bold?: boolean; italic?: boolean }[], twoColumn = false) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text(title.toUpperCase(), margin, yPos);
      
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 2, margin + doc.getTextWidth(title.toUpperCase()), yPos + 2);
      yPos += 10;

      doc.setTextColor(30, 30, 30);
      doc.setFontSize(10);

      if (twoColumn) {
        const halfWidth = contentWidth / 2 - 5;
        const leftCol = margin;
        const rightCol = margin + halfWidth + 10;
        const halfContent = Math.ceil(content.length / 2);
        
        content.forEach((item, index) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          const col = index < halfContent ? leftCol : rightCol;
          const adjustedY = index < halfContent ? yPos : yPos - (index - halfContent) * 6;
          
          doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
          if (item.italic) doc.setFont('helvetica', 'italic');
          doc.text(`${item.label}: ${item.value}`, col, adjustedY);
          
          if (index < halfContent) yPos += 6;
        });
        yPos += 5;
      } else {
        content.forEach(item => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
          if (item.italic) doc.setFont('helvetica', 'italic');
          
          const lines = doc.splitTextToSize(`${item.label}${item.label ? ': ' : ''}${item.value}`, contentWidth);
          lines.forEach((line: string) => {
            doc.text(line, margin, yPos);
            yPos += 5;
          });
        });
      }
      yPos += 8;
    };

    // Parties Section
    addSection('Party A - Server Representative', [
      { label: 'Organization', value: contractData.serverName, bold: true },
      { label: 'Representative', value: contractData.serverOwner },
      { label: 'Email', value: contractData.serverEmail },
      { label: 'Discord', value: contractData.serverDiscord },
      { label: 'Website', value: contractData.serverWebsite },
      { label: 'Address', value: contractData.serverAddress },
      ...(contractData.serverGSTIN ? [{ label: 'GSTIN', value: contractData.serverGSTIN }] : []),
    ]);

    addSection('Party B - Content Creator', [
      { label: 'Full Name', value: contractData.creatorName || '[To be filled]', bold: true },
      { label: 'Address', value: contractData.creatorAddress || '[To be filled]' },
      { label: 'Email', value: contractData.creatorEmail || '[To be filled]' },
      { label: 'Phone', value: contractData.creatorPhone || '[To be filled]' },
      { label: 'Discord ID', value: contractData.creatorDiscord || '[To be filled]' },
      ...(contractData.creatorPAN ? [{ label: 'PAN', value: contractData.creatorPAN }] : []),
      { label: 'Channel Name', value: contractData.channelName || '[To be filled]' },
      { label: 'Platform Links', value: contractData.platformLinks || '[To be filled]' },
      { label: 'Subscriber Count', value: contractData.subscriberCount || '[To be filled]' },
      { label: 'Avg. Views', value: contractData.averageViews || '[To be filled]' },
    ]);

    // Contract Period
    addSection('Contract Period', [
      { label: 'Duration', value: contractData.contractDuration, bold: true },
      { label: 'Commencement Date', value: format(new Date(contractData.startDate), 'dd MMMM yyyy') },
      { label: 'Expiry Date', value: format(new Date(contractData.endDate), 'dd MMMM yyyy') },
      { label: 'Exclusivity', value: contractData.exclusivityClause, italic: true },
    ]);

    // Compensation
    addSection('Compensation & Payment Terms', [
      { label: 'Monthly Retainer', value: `₹${contractData.monthlyPayment}`, bold: true },
      { label: 'Payment Method', value: contractData.paymentMethod },
      { label: 'Payment Schedule', value: 'Within 7 working days of each calendar month end' },
      { label: 'Performance Bonus', value: contractData.performanceBonus, italic: true },
    ]);

    // Content Requirements
    addSection('Content Deliverables', [
      { label: 'Minimum Videos', value: `${contractData.minimumVideos} per month`, bold: true },
      { label: 'Minimum Streams', value: `${contractData.minimumStreams} hours per month`, bold: true },
      { label: '', value: '• All content must prominently feature Skylife Roleplay India' },
      { label: '', value: '• Server name and Discord link required in video descriptions' },
      { label: '', value: '• Content must adhere to community guidelines' },
      { label: '', value: '• No promotion of competing GTA RP servers during contract period' },
    ]);

    // Obligations
    doc.addPage();
    yPos = 20;

    addSection('Creator Obligations', [
      { label: '', value: '1. Maintain active and positive presence on the server' },
      { label: '', value: '2. Engage constructively with the community' },
      { label: '', value: '3. Report technical issues and provide feedback' },
      { label: '', value: '4. Provide 14 days written notice before contract termination' },
      { label: '', value: '5. Maintain confidentiality of server-sensitive information' },
      { label: '', value: '6. Comply with all server rules and regulations' },
      { label: '', value: '7. Attend mandatory creator meetings when scheduled' },
    ]);

    addSection('Server Obligations', [
      { label: '', value: '1. Provide priority queue access to the server' },
      { label: '', value: '2. Offer dedicated support for content creation needs' },
      { label: '', value: '3. Feature creator content on official channels' },
      { label: '', value: '4. Provide agreed-upon in-game perks and benefits' },
      { label: '', value: '5. Maintain open and timely communication' },
      { label: '', value: '6. Process payments within the stipulated timeframe' },
    ]);

    addSection('Termination Clause', [
      { label: '', value: 'Either party may terminate this agreement with 14 days written notice.', italic: true },
      { label: '', value: '' },
      { label: '', value: 'Grounds for immediate termination:', bold: true },
      { label: '', value: '• Violation of server rules or community guidelines' },
      { label: '', value: '• Failure to meet deliverables for 2 consecutive months' },
      { label: '', value: '• Actions damaging to either party\'s reputation' },
      { label: '', value: '• Breach of confidentiality obligations' },
      { label: '', value: '• Engagement in fraudulent or illegal activities' },
    ]);

    // Special Terms
    if (contractData.specialTerms) {
      addSection('Special Terms & Conditions', [
        { label: '', value: contractData.specialTerms },
      ]);
    }

    // Signatures Page
    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('SIGNATURES & ACKNOWLEDGEMENT', margin, yPos);
    yPos += 15;

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('By signing below, both parties acknowledge that they have read, understood, and agree to all terms of this agreement.', margin, yPos, { maxWidth: contentWidth });
    yPos += 15;

    // Signature boxes
    const sigBoxWidth = 80;
    const sigBoxHeight = 35;

    // Party A Signature
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('For Skylife Roleplay India (Party A):', margin, yPos);
    yPos += 5;
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPos, sigBoxWidth, sigBoxHeight);
    
    if (ownerSignature) {
      try {
        doc.addImage(ownerSignature, 'PNG', margin + 2, yPos + 2, sigBoxWidth - 4, sigBoxHeight - 4);
      } catch (e) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text('[Signature on file]', margin + 5, yPos + 18);
      }
    }
    
    yPos += sigBoxHeight + 3;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Authorized Signature', margin, yPos);
    yPos += 4;
    doc.text(`Name: ${contractData.serverOwner}`, margin, yPos);
    yPos += 4;
    doc.text(`Date: ${ownerSignedAt ? format(new Date(ownerSignedAt), 'dd/MM/yyyy HH:mm') : '________________'}`, margin, yPos);

    // Party B Signature
    const rightCol = pageWidth / 2 + 10;
    let sigYPos = yPos - sigBoxHeight - 11 - 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`For ${contractData.creatorName || 'Creator'} (Party B):`, rightCol, sigYPos);
    sigYPos += 5;
    
    doc.rect(rightCol, sigYPos, sigBoxWidth, sigBoxHeight);
    
    if (creatorSignature) {
      try {
        doc.addImage(creatorSignature, 'PNG', rightCol + 2, sigYPos + 2, sigBoxWidth - 4, sigBoxHeight - 4);
      } catch (e) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text('[Signature on file]', rightCol + 5, sigYPos + 18);
      }
    }
    
    sigYPos += sigBoxHeight + 3;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Creator Signature', rightCol, sigYPos);
    sigYPos += 4;
    doc.text(`Name: ${contractData.creatorName || '________________'}`, rightCol, sigYPos);
    sigYPos += 4;
    doc.text(`Date: ${creatorSignedAt ? format(new Date(creatorSignedAt), 'dd/MM/yyyy HH:mm') : '________________'}`, rightCol, sigYPos);

    // Footer
    yPos = pageHeight - 15;
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'italic');
    doc.text('This is a legally binding document. Both parties acknowledge having read and understood all terms and conditions stated herein.', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    doc.setFont('helvetica', 'normal');
    doc.text(`Skylife Roleplay India | Content Creator Contract | Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth / 2, yPos, { align: 'center' });

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
                              <Label className="text-xs font-semibold text-slate-600">Organization Name</Label>
                              <Input value={contractData.serverName} onChange={(e) => handleInputChange('serverName', e.target.value)} className="h-9 mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-600">Representative Name</Label>
                              <Input value={contractData.serverOwner} onChange={(e) => handleInputChange('serverOwner', e.target.value)} className="h-9 mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-600">Email</Label>
                              <Input value={contractData.serverEmail} onChange={(e) => handleInputChange('serverEmail', e.target.value)} className="h-9 mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-600">Discord Server</Label>
                              <Input value={contractData.serverDiscord} onChange={(e) => handleInputChange('serverDiscord', e.target.value)} className="h-9 mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-600">Website</Label>
                              <Input value={contractData.serverWebsite} onChange={(e) => handleInputChange('serverWebsite', e.target.value)} className="h-9 mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-600">Address</Label>
                              <Input value={contractData.serverAddress} onChange={(e) => handleInputChange('serverAddress', e.target.value)} className="h-9 mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-600">GSTIN (Optional)</Label>
                              <Input value={contractData.serverGSTIN} onChange={(e) => handleInputChange('serverGSTIN', e.target.value)} className="h-9 mt-1" placeholder="Optional" />
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
                              <Label className="text-xs font-semibold text-slate-600">Full Legal Name *</Label>
                              <Input value={contractData.creatorName} onChange={(e) => handleInputChange('creatorName', e.target.value)} className="h-9 mt-1" placeholder="Required" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-600">Address</Label>
                              <Input value={contractData.creatorAddress} onChange={(e) => handleInputChange('creatorAddress', e.target.value)} className="h-9 mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-600">Email</Label>
                              <Input type="email" value={contractData.creatorEmail} onChange={(e) => handleInputChange('creatorEmail', e.target.value)} className="h-9 mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-600">Phone Number</Label>
                              <Input value={contractData.creatorPhone} onChange={(e) => handleInputChange('creatorPhone', e.target.value)} className="h-9 mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-600">Discord ID</Label>
                              <Input value={contractData.creatorDiscord} onChange={(e) => handleInputChange('creatorDiscord', e.target.value)} className="h-9 mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-600">PAN (Optional)</Label>
                              <Input value={contractData.creatorPAN} onChange={(e) => handleInputChange('creatorPAN', e.target.value)} className="h-9 mt-1" placeholder="For tax purposes" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-600">Channel Name</Label>
                              <Input value={contractData.channelName} onChange={(e) => handleInputChange('channelName', e.target.value)} className="h-9 mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-600">Platform Links</Label>
                              <Input value={contractData.platformLinks} onChange={(e) => handleInputChange('platformLinks', e.target.value)} className="h-9 mt-1" placeholder="YouTube, Twitch, etc." />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs font-semibold text-slate-600">Subscribers</Label>
                                <Input value={contractData.subscriberCount} onChange={(e) => handleInputChange('subscriberCount', e.target.value)} className="h-9 mt-1" />
                              </div>
                              <div>
                                <Label className="text-xs font-semibold text-slate-600">Avg. Views</Label>
                                <Input value={contractData.averageViews} onChange={(e) => handleInputChange('averageViews', e.target.value)} className="h-9 mt-1" />
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
                            <Label className="text-xs font-semibold text-slate-600">Duration</Label>
                            <Select value={contractData.contractDuration} onValueChange={(v) => handleInputChange('contractDuration', v)}>
                              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1 month">1 Month</SelectItem>
                                <SelectItem value="3 months">3 Months</SelectItem>
                                <SelectItem value="6 months">6 Months</SelectItem>
                                <SelectItem value="12 months">12 Months</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-600">Start Date</Label>
                            <Input type="date" value={contractData.startDate} onChange={(e) => handleInputChange('startDate', e.target.value)} className="h-9 mt-1" />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-600">End Date</Label>
                            <Input type="date" value={contractData.endDate} onChange={(e) => handleInputChange('endDate', e.target.value)} className="h-9 mt-1" />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-600">Exclusivity</Label>
                            <Select value={contractData.exclusivityClause} onValueChange={(v) => handleInputChange('exclusivityClause', v)}>
                              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
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
                            <Label className="text-xs font-semibold text-slate-600">Monthly Payment (₹)</Label>
                            <Input value={contractData.monthlyPayment} onChange={(e) => handleInputChange('monthlyPayment', e.target.value)} className="h-10 mt-1 text-lg font-bold" />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-600">Payment Method</Label>
                            <Input value={contractData.paymentMethod} onChange={(e) => handleInputChange('paymentMethod', e.target.value)} className="h-10 mt-1" />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs font-semibold text-slate-600">Performance Bonus</Label>
                            <Input value={contractData.performanceBonus} onChange={(e) => handleInputChange('performanceBonus', e.target.value)} className="h-10 mt-1" />
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
                            <Label className="text-xs font-semibold text-slate-600">Minimum Videos per Month</Label>
                            <Input value={contractData.minimumVideos} onChange={(e) => handleInputChange('minimumVideos', e.target.value)} className="h-10 mt-1 text-lg font-bold" />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-600">Minimum Stream Hours per Month</Label>
                            <Input value={contractData.minimumStreams} onChange={(e) => handleInputChange('minimumStreams', e.target.value)} className="h-10 mt-1 text-lg font-bold" />
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
                        placeholder="Add any special terms, conditions, or additional agreements here..."
                        className="min-h-[120px]"
                      />
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-lg min-h-[80px]">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {contractData.specialTerms || <span className="italic text-slate-400">No special terms specified.</span>}
                        </p>
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
