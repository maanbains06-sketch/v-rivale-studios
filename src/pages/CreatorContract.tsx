import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface ContractData {
  creatorName: string;
  creatorAddress: string;
  creatorEmail: string;
  creatorDiscord: string;
  channelName: string;
  platformLinks: string;
  subscriberCount: string;
  monthlyPayment: string;
  paymentMethod: string;
  minimumVideos: string;
  minimumStreams: string;
  contractDuration: string;
  startDate: string;
  endDate: string;
  specialTerms: string;
}

const defaultContractData: ContractData = {
  creatorName: "",
  creatorAddress: "",
  creatorEmail: "",
  creatorDiscord: "",
  channelName: "",
  platformLinks: "",
  subscriberCount: "",
  monthlyPayment: "5000",
  paymentMethod: "UPI / Bank Transfer",
  minimumVideos: "4",
  minimumStreams: "8",
  contractDuration: "3 months",
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  specialTerms: "",
};

const CreatorContract = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [contractData, setContractData] = useState<ContractData>(defaultContractData);

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

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 20;

    // Header
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('SKYLIFE ROLEPLAY INDIA', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Content Creator Agreement', pageWidth / 2, 32, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Contract Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, 40, { align: 'center' });

    yPos = 55;
    doc.setTextColor(30, 30, 30);

    // Section helper
    const addSection = (title: string, content: string[]) => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text(title, margin, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      
      content.forEach(line => {
        const lines = doc.splitTextToSize(line, contentWidth);
        lines.forEach((l: string) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(l, margin, yPos);
          yPos += 6;
        });
      });
      yPos += 5;
    };

    // Parties Section
    addSection('PARTIES TO THIS AGREEMENT', [
      'This Content Creator Agreement ("Agreement") is entered into between:',
      '',
      'Party A (Server): Skylife Roleplay India',
      'Discord Server: https://discord.gg/W2nU97maBh',
      'Website: https://skyliferoleplay.com',
      '',
      `Party B (Creator): ${contractData.creatorName || '[Creator Name]'}`,
      `Address: ${contractData.creatorAddress || '[Address]'}`,
      `Email: ${contractData.creatorEmail || '[Email]'}`,
      `Discord: ${contractData.creatorDiscord || '[Discord ID]'}`,
      `Channel: ${contractData.channelName || '[Channel Name]'}`,
      `Platform Links: ${contractData.platformLinks || '[Platform Links]'}`,
      `Subscriber Count: ${contractData.subscriberCount || '[Subscriber Count]'}`,
    ]);

    // Contract Period
    addSection('CONTRACT PERIOD', [
      `Duration: ${contractData.contractDuration}`,
      `Start Date: ${new Date(contractData.startDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      `End Date: ${new Date(contractData.endDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    ]);

    // Compensation
    addSection('COMPENSATION', [
      `Monthly Payment: ₹${contractData.monthlyPayment}`,
      `Payment Method: ${contractData.paymentMethod}`,
      'Payment Schedule: Within 7 days of each calendar month end',
      'Bonus Structure: Additional compensation may be provided for exceptional performance',
    ]);

    // Content Requirements
    addSection('CONTENT REQUIREMENTS', [
      `Minimum Videos per Month: ${contractData.minimumVideos}`,
      `Minimum Stream Hours per Month: ${contractData.minimumStreams} hours`,
      'Content must feature Skylife Roleplay India gameplay',
      'Server name and Discord link must be included in video description',
      'Content must be family-friendly and follow community guidelines',
      'No promotion of competing servers during contract period',
    ]);

    // Creator Obligations
    addSection('CREATOR OBLIGATIONS', [
      '• Maintain active presence on Skylife Roleplay India server',
      '• Engage positively with the community',
      '• Report any technical issues or bugs encountered',
      '• Provide 2 weeks notice before ending the contract',
      '• Not share any confidential server information',
      '• Follow all server rules and regulations',
    ]);

    // Server Obligations
    addSection('SERVER OBLIGATIONS', [
      '• Provide priority queue access',
      '• Offer dedicated support for content creation',
      '• Feature creator content on official channels when appropriate',
      '• Provide in-game perks as agreed upon',
      '• Maintain open communication with the creator',
    ]);

    // Termination
    addSection('TERMINATION', [
      'Either party may terminate this agreement with 14 days written notice.',
      'Immediate termination may occur for:',
      '• Violation of server rules or community guidelines',
      '• Failure to meet content requirements for 2 consecutive months',
      '• Actions that damage the reputation of either party',
      '• Breach of confidentiality obligations',
    ]);

    // Special Terms
    if (contractData.specialTerms) {
      addSection('SPECIAL TERMS & CONDITIONS', [contractData.specialTerms]);
    }

    // Signatures
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('SIGNATURES', margin, yPos);
    yPos += 15;

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Party A Signature
    doc.text('For Skylife Roleplay India:', margin, yPos);
    yPos += 20;
    doc.line(margin, yPos, margin + 70, yPos);
    yPos += 5;
    doc.text('Authorized Signature', margin, yPos);
    doc.text('Date: ________________', margin, yPos + 8);

    // Party B Signature
    const rightCol = pageWidth / 2 + 10;
    doc.text(`For ${contractData.creatorName || 'Creator'}:`, rightCol, yPos - 25);
    doc.line(rightCol, yPos, rightCol + 70, yPos);
    doc.text('Creator Signature', rightCol, yPos + 5);
    doc.text('Date: ________________', rightCol, yPos + 13);

    // Footer
    yPos = 280;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('This is a legally binding document. Both parties acknowledge having read and understood all terms.', pageWidth / 2, yPos, { align: 'center' });
    doc.text('Skylife Roleplay India - Content Creator Contract', pageWidth / 2, yPos + 5, { align: 'center' });

    // Save
    const fileName = `SLRP-Creator-Contract-${contractData.creatorName?.replace(/\s+/g, '-') || 'Draft'}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    toast({
      title: "Contract Downloaded",
      description: "The contract has been saved as a PDF.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={() => { setIsEditing(false); toast({ title: "Changes Saved" }); }} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
                <Button onClick={generatePDF} className="gap-2 bg-primary">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Contract Preview/Editor */}
        <Card className="bg-white shadow-xl border-0">
          <CardContent className="p-0">
            {/* Contract Header */}
            <div className="bg-slate-800 text-white p-8 text-center">
              <h1 className="text-3xl font-bold mb-2">SKYLIFE ROLEPLAY INDIA</h1>
              <p className="text-lg opacity-90">Content Creator Agreement</p>
              <p className="text-sm opacity-70 mt-2">
                Contract Date: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="p-8 space-y-8 text-slate-800">
              {/* Parties Section */}
              <section>
                <h2 className="text-lg font-bold text-blue-600 border-b border-blue-200 pb-2 mb-4">
                  PARTIES TO THIS AGREEMENT
                </h2>
                <p className="mb-4 text-sm">
                  This Content Creator Agreement ("Agreement") is entered into between:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Party A (Server)</h3>
                    <p className="text-sm"><strong>Name:</strong> Skylife Roleplay India</p>
                    <p className="text-sm"><strong>Discord:</strong> discord.gg/W2nU97maBh</p>
                    <p className="text-sm"><strong>Website:</strong> skyliferoleplay.com</p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold mb-3">Party B (Creator)</h3>
                    {isEditing ? (
                      <>
                        <div>
                          <Label className="text-xs">Full Name</Label>
                          <Input
                            value={contractData.creatorName}
                            onChange={(e) => handleInputChange('creatorName', e.target.value)}
                            placeholder="Creator's Full Name"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Address</Label>
                          <Input
                            value={contractData.creatorAddress}
                            onChange={(e) => handleInputChange('creatorAddress', e.target.value)}
                            placeholder="Address"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Email</Label>
                          <Input
                            value={contractData.creatorEmail}
                            onChange={(e) => handleInputChange('creatorEmail', e.target.value)}
                            placeholder="Email"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Discord ID</Label>
                          <Input
                            value={contractData.creatorDiscord}
                            onChange={(e) => handleInputChange('creatorDiscord', e.target.value)}
                            placeholder="Discord ID"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Channel Name</Label>
                          <Input
                            value={contractData.channelName}
                            onChange={(e) => handleInputChange('channelName', e.target.value)}
                            placeholder="YouTube/Twitch Channel"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Platform Links</Label>
                          <Input
                            value={contractData.platformLinks}
                            onChange={(e) => handleInputChange('platformLinks', e.target.value)}
                            placeholder="Channel URLs"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Subscriber Count</Label>
                          <Input
                            value={contractData.subscriberCount}
                            onChange={(e) => handleInputChange('subscriberCount', e.target.value)}
                            placeholder="Total Subscribers"
                            className="h-8 text-sm"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm"><strong>Name:</strong> {contractData.creatorName || '[To be filled]'}</p>
                        <p className="text-sm"><strong>Address:</strong> {contractData.creatorAddress || '[To be filled]'}</p>
                        <p className="text-sm"><strong>Email:</strong> {contractData.creatorEmail || '[To be filled]'}</p>
                        <p className="text-sm"><strong>Discord:</strong> {contractData.creatorDiscord || '[To be filled]'}</p>
                        <p className="text-sm"><strong>Channel:</strong> {contractData.channelName || '[To be filled]'}</p>
                        <p className="text-sm"><strong>Links:</strong> {contractData.platformLinks || '[To be filled]'}</p>
                        <p className="text-sm"><strong>Subscribers:</strong> {contractData.subscriberCount || '[To be filled]'}</p>
                      </>
                    )}
                  </div>
                </div>
              </section>

              {/* Contract Period */}
              <section>
                <h2 className="text-lg font-bold text-blue-600 border-b border-blue-200 pb-2 mb-4">
                  CONTRACT PERIOD
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {isEditing ? (
                    <>
                      <div>
                        <Label className="text-xs">Duration</Label>
                        <Input
                          value={contractData.contractDuration}
                          onChange={(e) => handleInputChange('contractDuration', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Start Date</Label>
                        <Input
                          type="date"
                          value={contractData.startDate}
                          onChange={(e) => handleInputChange('startDate', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">End Date</Label>
                        <Input
                          type="date"
                          value={contractData.endDate}
                          onChange={(e) => handleInputChange('endDate', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm"><strong>Duration:</strong> {contractData.contractDuration}</p>
                      <p className="text-sm"><strong>Start:</strong> {new Date(contractData.startDate).toLocaleDateString('en-IN')}</p>
                      <p className="text-sm"><strong>End:</strong> {new Date(contractData.endDate).toLocaleDateString('en-IN')}</p>
                    </>
                  )}
                </div>
              </section>

              {/* Compensation */}
              <section>
                <h2 className="text-lg font-bold text-blue-600 border-b border-blue-200 pb-2 mb-4">
                  COMPENSATION
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {isEditing ? (
                    <>
                      <div>
                        <Label className="text-xs">Monthly Payment (₹)</Label>
                        <Input
                          value={contractData.monthlyPayment}
                          onChange={(e) => handleInputChange('monthlyPayment', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Payment Method</Label>
                        <Input
                          value={contractData.paymentMethod}
                          onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm"><strong>Monthly Payment:</strong> ₹{contractData.monthlyPayment}</p>
                      <p className="text-sm"><strong>Payment Method:</strong> {contractData.paymentMethod}</p>
                    </>
                  )}
                </div>
                <p className="text-sm mt-2 text-slate-600">Payment Schedule: Within 7 days of each calendar month end</p>
              </section>

              {/* Content Requirements */}
              <section>
                <h2 className="text-lg font-bold text-blue-600 border-b border-blue-200 pb-2 mb-4">
                  CONTENT REQUIREMENTS
                </h2>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {isEditing ? (
                    <>
                      <div>
                        <Label className="text-xs">Minimum Videos per Month</Label>
                        <Input
                          value={contractData.minimumVideos}
                          onChange={(e) => handleInputChange('minimumVideos', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Minimum Stream Hours per Month</Label>
                        <Input
                          value={contractData.minimumStreams}
                          onChange={(e) => handleInputChange('minimumStreams', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm"><strong>Minimum Videos:</strong> {contractData.minimumVideos} per month</p>
                      <p className="text-sm"><strong>Minimum Streams:</strong> {contractData.minimumStreams} hours per month</p>
                    </>
                  )}
                </div>
                <ul className="text-sm space-y-1 text-slate-600 list-disc list-inside">
                  <li>Content must feature Skylife Roleplay India gameplay</li>
                  <li>Server name and Discord link must be included in video description</li>
                  <li>Content must be family-friendly and follow community guidelines</li>
                  <li>No promotion of competing servers during contract period</li>
                </ul>
              </section>

              {/* Creator Obligations */}
              <section>
                <h2 className="text-lg font-bold text-blue-600 border-b border-blue-200 pb-2 mb-4">
                  CREATOR OBLIGATIONS
                </h2>
                <ul className="text-sm space-y-1 text-slate-600 list-disc list-inside">
                  <li>Maintain active presence on Skylife Roleplay India server</li>
                  <li>Engage positively with the community</li>
                  <li>Report any technical issues or bugs encountered</li>
                  <li>Provide 2 weeks notice before ending the contract</li>
                  <li>Not share any confidential server information</li>
                  <li>Follow all server rules and regulations</li>
                </ul>
              </section>

              {/* Server Obligations */}
              <section>
                <h2 className="text-lg font-bold text-blue-600 border-b border-blue-200 pb-2 mb-4">
                  SERVER OBLIGATIONS
                </h2>
                <ul className="text-sm space-y-1 text-slate-600 list-disc list-inside">
                  <li>Provide priority queue access</li>
                  <li>Offer dedicated support for content creation</li>
                  <li>Feature creator content on official channels when appropriate</li>
                  <li>Provide in-game perks as agreed upon</li>
                  <li>Maintain open communication with the creator</li>
                </ul>
              </section>

              {/* Termination */}
              <section>
                <h2 className="text-lg font-bold text-blue-600 border-b border-blue-200 pb-2 mb-4">
                  TERMINATION
                </h2>
                <p className="text-sm mb-2">Either party may terminate this agreement with 14 days written notice.</p>
                <p className="text-sm mb-2">Immediate termination may occur for:</p>
                <ul className="text-sm space-y-1 text-slate-600 list-disc list-inside">
                  <li>Violation of server rules or community guidelines</li>
                  <li>Failure to meet content requirements for 2 consecutive months</li>
                  <li>Actions that damage the reputation of either party</li>
                  <li>Breach of confidentiality obligations</li>
                </ul>
              </section>

              {/* Special Terms */}
              <section>
                <h2 className="text-lg font-bold text-blue-600 border-b border-blue-200 pb-2 mb-4">
                  SPECIAL TERMS & CONDITIONS
                </h2>
                {isEditing ? (
                  <Textarea
                    value={contractData.specialTerms}
                    onChange={(e) => handleInputChange('specialTerms', e.target.value)}
                    placeholder="Add any special terms or conditions here..."
                    className="min-h-[100px] text-sm"
                  />
                ) : (
                  <p className="text-sm text-slate-600">
                    {contractData.specialTerms || 'No special terms specified.'}
                  </p>
                )}
              </section>

              {/* Signatures */}
              <section className="pt-8 border-t">
                <h2 className="text-lg font-bold text-blue-600 mb-6">SIGNATURES</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm font-semibold mb-8">For Skylife Roleplay India:</p>
                    <div className="border-b border-slate-400 w-48 mb-2"></div>
                    <p className="text-xs text-slate-500">Authorized Signature</p>
                    <p className="text-xs text-slate-500 mt-2">Date: ________________</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-8">For {contractData.creatorName || 'Creator'}:</p>
                    <div className="border-b border-slate-400 w-48 mb-2"></div>
                    <p className="text-xs text-slate-500">Creator Signature</p>
                    <p className="text-xs text-slate-500 mt-2">Date: ________________</p>
                  </div>
                </div>
              </section>

              {/* Footer */}
              <div className="text-center pt-8 border-t text-xs text-slate-400">
                <p>This is a legally binding document. Both parties acknowledge having read and understood all terms.</p>
                <p className="mt-1">Skylife Roleplay India - Content Creator Contract</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatorContract;
