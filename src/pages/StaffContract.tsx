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
import { ArrowLeft, Download, Edit2, Save, X, Plus, Shield, CheckCircle, Clock, PlusCircle, Trash2, Lock, AlertTriangle, Eye, EyeOff, UserCheck, Scale } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import jsPDF from "jspdf";
import SignaturePad from "@/components/SignaturePad";
import StaffContractsList from "@/components/StaffContractsList";

interface PolicyItem {
  id: string;
  text: string;
  enabled: boolean;
}

interface StaffContractData {
  // Server Info
  serverName: string;
  serverOwner: string;
  serverEmail: string;
  serverDiscord: string;
  // Staff Info
  staffName: string;
  staffEmail: string;
  staffDiscord: string;
  staffRole: string;
  staffDepartment: string;
  staffJoinDate: string;
  // Contract Terms
  contractDuration: string;
  startDate: string;
  endDate: string;
  // Policy Agreements
  ndaPolicies: PolicyItem[];
  conflictPolicies: PolicyItem[];
  antiCorruptionPolicies: PolicyItem[];
  dataProtectionPolicies: PolicyItem[];
  conductPolicies: PolicyItem[];
  // Custom
  customTerms: string;
  disciplinaryAction: string;
}

const defaultNdaPolicies: PolicyItem[] = [
  { id: 'nda1', text: 'Staff must NOT share internal admin logs, chat logs, or moderation actions with anyone outside the team', enabled: true },
  { id: 'nda2', text: 'Player IP addresses, personal data, and security information must remain strictly confidential', enabled: true },
  { id: 'nda3', text: 'Unreleased scripts, server code, configurations, and development plans must NOT be shared externally', enabled: true },
  { id: 'nda4', text: 'Internal staff discussions, meeting notes, and decisions must remain within the staff team', enabled: true },
  { id: 'nda5', text: 'Staff must NOT screenshot or record internal admin panels, tools, or dashboards for external sharing', enabled: true },
  { id: 'nda6', text: 'Any server vulnerabilities or exploits discovered must be reported privately, never disclosed publicly', enabled: true },
];

const defaultConflictPolicies: PolicyItem[] = [
  { id: 'coi1', text: 'Staff CANNOT hold administrative or moderator positions on other GTA 5 RP servers simultaneously', enabled: true },
  { id: 'coi2', text: 'Staff must disclose any ownership or partnership in other gaming communities', enabled: true },
  { id: 'coi3', text: 'Staff must NOT recruit Skylife RP players or staff members for competing servers', enabled: true },
  { id: 'coi4', text: 'Any secondary involvement in gaming communities must be disclosed to management immediately', enabled: true },
];

const defaultAntiCorruptionPolicies: PolicyItem[] = [
  { id: 'ac1', text: 'ZERO TOLERANCE for spawning in-game items, vehicles, or currency for personal use or for friends', enabled: true },
  { id: 'ac2', text: 'Staff must NOT unban players without following the proper ban appeal process', enabled: true },
  { id: 'ac3', text: 'Accepting real-world payment, gifts, or favors in exchange for in-game benefits is strictly prohibited', enabled: true },
  { id: 'ac4', text: 'Staff must NOT grant whitelist access, job roles, or special permissions outside official procedures', enabled: true },
  { id: 'ac5', text: 'Using admin tools to gain unfair advantage during roleplay is strictly forbidden', enabled: true },
  { id: 'ac6', text: 'Staff must NOT modify player records, stats, or inventories without legitimate administrative reason and proper logging', enabled: true },
  { id: 'ac7', text: 'Favoritism in handling reports, applications, or disputes based on personal relationships is prohibited', enabled: true },
];

const defaultDataProtectionPolicies: PolicyItem[] = [
  { id: 'dp1', text: 'All player reports, tickets, and personal data must be handled with strict privacy and confidentiality', enabled: true },
  { id: 'dp2', text: 'Player information must NOT be used for personal purposes, harassment, or sharing outside the staff team', enabled: true },
  { id: 'dp3', text: 'Staff must access player data ONLY when required for legitimate moderation and administrative duties', enabled: true },
  { id: 'dp4', text: 'All moderation actions must be properly logged and documented in the admin system', enabled: true },
  { id: 'dp5', text: 'Staff must follow data retention policies and not store player data on personal devices', enabled: true },
];

const defaultConductPolicies: PolicyItem[] = [
  { id: 'cd1', text: 'Staff must maintain professional conduct and represent Skylife RP positively at all times', enabled: true },
  { id: 'cd2', text: 'Staff must respond to player reports and tickets within reasonable timeframes', enabled: true },
  { id: 'cd3', text: 'Attending mandatory staff meetings and training sessions is required', enabled: true },
  { id: 'cd4', text: 'Staff must follow the chain of command and escalate issues appropriately', enabled: true },
  { id: 'cd5', text: 'Maintaining minimum activity requirements as defined by management', enabled: true },
  { id: 'cd6', text: 'Staff must NOT engage in toxic behavior, discrimination, or harassment toward players or other staff', enabled: true },
];

const defaultContractData: StaffContractData = {
  serverName: "Skylife Roleplay India",
  serverOwner: "Skylife RP Management",
  serverEmail: "contact@skyliferoleplay.com",
  serverDiscord: "discord.gg/W2nU97maBh",
  staffName: "",
  staffEmail: "",
  staffDiscord: "",
  staffRole: "Moderator",
  staffDepartment: "General Administration",
  staffJoinDate: new Date().toISOString().split('T')[0],
  contractDuration: "6 months",
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  ndaPolicies: defaultNdaPolicies,
  conflictPolicies: defaultConflictPolicies,
  antiCorruptionPolicies: defaultAntiCorruptionPolicies,
  dataProtectionPolicies: defaultDataProtectionPolicies,
  conductPolicies: defaultConductPolicies,
  customTerms: "",
  disciplinaryAction: "Violations may result in immediate suspension, demotion, permanent removal from staff, and potential ban from the server. Severe breaches involving data leaks or corruption will be handled with zero tolerance.",
};

const StaffContract = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const contractRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [contractData, setContractData] = useState<StaffContractData>(defaultContractData);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [contractStatus, setContractStatus] = useState<string>("draft");
  const [ownerSignature, setOwnerSignature] = useState<string | null>(null);
  const [ownerSignedAt, setOwnerSignedAt] = useState<string | null>(null);
  const [staffSignature, setStaffSignature] = useState<string | null>(null);
  const [staffSignedAt, setStaffSignedAt] = useState<string | null>(null);
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
      if (data?.value) setSavedOwnerSignature(data.value);
    } catch (error) {
      console.error("Error loading saved signature:", error);
    }
  };

  const checkOwnerAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      
      // Check if user is owner
      const { data: isOwnerResult } = await supabase.rpc("is_owner", { _user_id: user.id });
      
      if (isOwnerResult) {
        setIsOwner(true);
        return;
      }

      // Check if user has staff_contract panel access
      const { data: hasPanelResult } = await supabase.rpc("has_panel_access", { 
        _user_id: user.id, 
        _panel_type: "staff_contract" 
      });

      if (hasPanelResult) {
        setIsOwner(true);
        return;
      }

      toast({ title: "Access Denied", description: "You don't have permission to access staff contracts.", variant: "destructive" });
      navigate("/");
    } catch (error) {
      console.error("Error checking access:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof StaffContractData, value: string) => {
    setContractData(prev => ({ ...prev, [field]: value }));
  };

  const togglePolicy = (section: 'ndaPolicies' | 'conflictPolicies' | 'antiCorruptionPolicies' | 'dataProtectionPolicies' | 'conductPolicies', policyId: string) => {
    setContractData(prev => ({
      ...prev,
      [section]: prev[section].map((p: PolicyItem) =>
        p.id === policyId ? { ...p, enabled: !p.enabled } : p
      )
    }));
  };

  const addCustomPolicy = (section: 'ndaPolicies' | 'conflictPolicies' | 'antiCorruptionPolicies' | 'dataProtectionPolicies' | 'conductPolicies') => {
    const newId = `custom_${Date.now()}`;
    setContractData(prev => ({
      ...prev,
      [section]: [...prev[section], { id: newId, text: '', enabled: true }]
    }));
  };

  const updatePolicyText = (section: 'ndaPolicies' | 'conflictPolicies' | 'antiCorruptionPolicies' | 'dataProtectionPolicies' | 'conductPolicies', policyId: string, text: string) => {
    setContractData(prev => ({
      ...prev,
      [section]: prev[section].map((p: PolicyItem) =>
        p.id === policyId ? { ...p, text } : p
      )
    }));
  };

  const removePolicy = (section: 'ndaPolicies' | 'conflictPolicies' | 'antiCorruptionPolicies' | 'dataProtectionPolicies' | 'conductPolicies', policyId: string) => {
    setContractData(prev => ({
      ...prev,
      [section]: prev[section].filter((p: PolicyItem) => p.id !== policyId)
    }));
  };

  const getActivePolicies = (policies: PolicyItem[]) => policies.filter(p => p.enabled && p.text.trim());

  const handleSelectContract = (contract: any) => {
    setSelectedContractId(contract.id);
    const data = contract.contract_data as StaffContractData;
    setContractData({ ...defaultContractData, ...data });
    setContractStatus(contract.status);
    setOwnerSignature(contract.owner_signature);
    setOwnerSignedAt(contract.owner_signed_at);
    setStaffSignature(contract.staff_signature);
    setStaffSignedAt(contract.staff_signed_at);
    setIsEditing(false);
  };

  const handleNewContract = () => {
    setSelectedContractId(null);
    setContractData(defaultContractData);
    setContractStatus("draft");
    if (savedOwnerSignature) {
      setOwnerSignature(savedOwnerSignature);
      setOwnerSignedAt(new Date().toISOString());
    } else {
      setOwnerSignature(null);
      setOwnerSignedAt(null);
    }
    setStaffSignature(null);
    setStaffSignedAt(null);
    setIsEditing(true);
  };

  const handleSaveContract = async () => {
    if (!contractData.staffName.trim()) {
      toast({ title: "Please enter staff member name", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast({ title: "Authentication required", variant: "destructive" }); return; }

      const payload = {
        staff_name: contractData.staffName,
        staff_email: contractData.staffEmail || null,
        staff_discord_id: contractData.staffDiscord || null,
        staff_role: contractData.staffRole || null,
        contract_data: contractData as any,
        status: contractStatus,
        valid_from: contractData.startDate,
        valid_until: contractData.endDate,
        owner_signature: ownerSignature,
        owner_signed_at: ownerSignedAt,
        staff_signature: staffSignature,
        staff_signed_at: staffSignedAt,
        created_by: user.id,
      };

      if (selectedContractId) {
        const { created_by, ...updatePayload } = payload;
        const { error } = await supabase.from("staff_contracts").update(updatePayload).eq("id", selectedContractId);
        if (error) throw error;
        toast({ title: "Staff contract updated successfully" });
      } else {
        const { data, error } = await supabase.from("staff_contracts").insert(payload).select().single();
        if (error) throw error;
        setSelectedContractId(data.id);
        toast({ title: "Staff contract saved successfully" });
      }

      setIsEditing(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error("Error saving contract:", error);
      toast({ title: "Failed to save contract", description: error?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleOwnerSign = (signature: string) => {
    setOwnerSignature(signature);
    setOwnerSignedAt(new Date().toISOString());
    toast({ title: "Owner signature recorded" });
  };

  const handleStaffSign = (signature: string) => {
    setStaffSignature(signature);
    setStaffSignedAt(new Date().toISOString());
    if (ownerSignature) setContractStatus("signed");
    else setContractStatus("pending");
    toast({ title: "Staff signature recorded" });
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 0;

    const headerBg: [number, number, number] = [20, 30, 48];
    const red: [number, number, number] = [220, 50, 50];
    const black: [number, number, number] = [0, 0, 0];
    const gray: [number, number, number] = [100, 100, 100];
    const lightGray: [number, number, number] = [230, 230, 230];
    const darkRed: [number, number, number] = [180, 30, 30];

    const checkPageBreak = (needed: number) => {
      if (yPos + needed > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
    };

    // Header
    doc.setFillColor(...headerBg);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setFillColor(...red);
    doc.rect(0, 40, pageWidth, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('SKYLIFE ROLEPLAY INDIA', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('STAFF & ADMINISTRATOR AGREEMENT', pageWidth / 2, 25, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('CONFIDENTIAL — NON-DISCLOSURE AGREEMENT', pageWidth / 2, 34, { align: 'center' });

    yPos = 52;

    // Contract info
    doc.setTextColor(...black);
    doc.setFontSize(8);
    doc.text(`Contract ID: ${selectedContractId?.slice(0, 8) || 'DRAFT'}`, margin, yPos);
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, pageWidth - margin - 30, yPos);
    yPos += 8;

    const drawSectionHeader = (title: string, icon: string) => {
      checkPageBreak(15);
      doc.setFillColor(...darkRed);
      doc.rect(margin, yPos, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${icon} ${title.toUpperCase()}`, margin + 3, yPos + 5.5);
      yPos += 10;
    };

    const drawFormField = (label: string, value: string, x: number, y: number, width: number) => {
      doc.setFillColor(...lightGray);
      doc.rect(x, y, 40, 8, 'F');
      doc.setDrawColor(...black);
      doc.setLineWidth(0.3);
      doc.rect(x, y, width, 8);
      doc.line(x + 40, y, x + 40, y + 8);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...black);
      doc.text(label, x + 2, y + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.text(value || '', x + 42, y + 5.5);
    };

    // Parties
    drawSectionHeader('Party A - Server Management', '⚡');
    const halfWidth = contentWidth / 2 - 2;
    drawFormField('Organization', contractData.serverName, margin, yPos, halfWidth);
    drawFormField('Representative', contractData.serverOwner, margin + halfWidth + 4, yPos, halfWidth);
    yPos += 10;
    drawFormField('Email', contractData.serverEmail, margin, yPos, halfWidth);
    drawFormField('Discord', contractData.serverDiscord, margin + halfWidth + 4, yPos, halfWidth);
    yPos += 15;

    drawSectionHeader('Party B - Staff Member', '👤');
    drawFormField('Full Name', contractData.staffName || '[To be filled]', margin, yPos, halfWidth);
    drawFormField('Role/Position', contractData.staffRole, margin + halfWidth + 4, yPos, halfWidth);
    yPos += 10;
    drawFormField('Department', contractData.staffDepartment, margin, yPos, halfWidth);
    drawFormField('Discord ID', contractData.staffDiscord || '[To be filled]', margin + halfWidth + 4, yPos, halfWidth);
    yPos += 10;
    drawFormField('Email', contractData.staffEmail || '[To be filled]', margin, yPos, halfWidth);
    drawFormField('Join Date', contractData.staffJoinDate ? format(new Date(contractData.staffJoinDate), 'dd/MM/yyyy') : '', margin + halfWidth + 4, yPos, halfWidth);
    yPos += 15;

    // Contract Period
    drawSectionHeader('Contract Period', '📅');
    drawFormField('Duration', contractData.contractDuration, margin, yPos, contentWidth / 3 - 2);
    drawFormField('Start Date', format(new Date(contractData.startDate), 'dd/MM/yyyy'), margin + contentWidth / 3 + 1, yPos, contentWidth / 3 - 2);
    drawFormField('End Date', format(new Date(contractData.endDate), 'dd/MM/yyyy'), margin + (contentWidth / 3 + 1) * 2, yPos, contentWidth / 3 - 2);
    yPos += 15;

    // Policy sections in PDF
    const renderPolicies = (title: string, icon: string, policies: PolicyItem[]) => {
      const active = getActivePolicies(policies);
      if (active.length === 0) return;
      drawSectionHeader(title, icon);
      doc.setTextColor(...black);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      active.forEach((p, i) => {
        checkPageBreak(8);
        const lines = doc.splitTextToSize(`${i + 1}. ${p.text}`, contentWidth - 10);
        lines.forEach((line: string) => {
          checkPageBreak(5);
          doc.text(line, margin + 3, yPos + 4);
          yPos += 4;
        });
        yPos += 2;
      });
      yPos += 5;
    };

    renderPolicies('Confidentiality & Non-Disclosure (NDA)', '🔒', contractData.ndaPolicies);
    renderPolicies('Conflict of Interest', '⚖️', contractData.conflictPolicies);
    renderPolicies('Anti-Corruption & Zero Tolerance', '🚫', contractData.antiCorruptionPolicies);
    renderPolicies('Data Protection & Privacy', '🛡️', contractData.dataProtectionPolicies);
    renderPolicies('Code of Conduct & Responsibilities', '📋', contractData.conductPolicies);

    // Disciplinary
    checkPageBreak(30);
    drawSectionHeader('Disciplinary Action & Consequences', '⚠️');
    doc.setTextColor(...black);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const discLines = doc.splitTextToSize(contractData.disciplinaryAction, contentWidth - 10);
    discLines.forEach((line: string) => {
      checkPageBreak(5);
      doc.text(line, margin + 3, yPos + 4);
      yPos += 4;
    });
    yPos += 10;

    // Signatures
    checkPageBreak(70);
    drawSectionHeader('Signatures & Acknowledgement', '✍️');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text('By signing below, both parties acknowledge that they have read, understood, and agree to all terms of this agreement.', margin, yPos + 4);
    yPos += 12;

    const sigBoxWidth = (contentWidth - 10) / 2;
    const sigBoxHeight = 30;

    // Party A
    doc.setDrawColor(...black);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPos, sigBoxWidth, sigBoxHeight + 25);
    doc.setFillColor(...lightGray);
    doc.rect(margin, yPos, sigBoxWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...black);
    doc.text('Party A - Server Management', margin + 2, yPos + 4);
    if (ownerSignature) {
      try { doc.addImage(ownerSignature, 'PNG', margin + 7, yPos + 12, sigBoxWidth - 14, sigBoxHeight - 9); } catch {}
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Name: ${contractData.serverOwner}`, margin + 3, yPos + sigBoxHeight + 8);
    doc.text(`Date: ${ownerSignedAt ? format(new Date(ownerSignedAt), 'dd/MM/yyyy HH:mm') : '____________________'}`, margin + 3, yPos + sigBoxHeight + 13);

    // Party B
    const partyBX = margin + sigBoxWidth + 10;
    doc.rect(partyBX, yPos, sigBoxWidth, sigBoxHeight + 25);
    doc.setFillColor(...lightGray);
    doc.rect(partyBX, yPos, sigBoxWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Party B - Staff Member', partyBX + 2, yPos + 4);
    if (staffSignature) {
      try { doc.addImage(staffSignature, 'PNG', partyBX + 7, yPos + 12, sigBoxWidth - 14, sigBoxHeight - 9); } catch {}
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Name: ${contractData.staffName || '____________________'}`, partyBX + 3, yPos + sigBoxHeight + 8);
    doc.text(`Date: ${staffSignedAt ? format(new Date(staffSignedAt), 'dd/MM/yyyy HH:mm') : '____________________'}`, partyBX + 3, yPos + sigBoxHeight + 13);

    // Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(...black);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      doc.setFontSize(6);
      doc.setTextColor(...gray);
      doc.setFont('helvetica', 'italic');
      doc.text('CONFIDENTIAL — Staff & Administrator Agreement | Skylife Roleplay India', pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
    }

    const safeName = contractData.staffName?.replace(/\s+/g, '-') || 'Draft';
    doc.save(`SLRP-Staff-Agreement-${safeName}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({ title: "Staff Agreement PDF Downloaded" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isOwner) return null;

  const PolicySection = ({
    title,
    icon: Icon,
    iconColor,
    sectionKey,
    policies,
  }: {
    title: string;
    icon: any;
    iconColor: string;
    sectionKey: 'ndaPolicies' | 'conflictPolicies' | 'antiCorruptionPolicies' | 'dataProtectionPolicies' | 'conductPolicies';
    policies: PolicyItem[];
  }) => (
    <section>
      <h2 className="text-lg font-bold text-foreground border-b-2 border-primary/30 pb-2 mb-4 uppercase tracking-wide flex items-center gap-2">
        <Icon className={`h-5 w-5 ${iconColor}`} />
        {title}
      </h2>
      {isEditing ? (
        <div className="space-y-2">
          {policies.map((policy, index) => (
            <div key={policy.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 transition-colors">
              <Checkbox
                checked={policy.enabled}
                onCheckedChange={() => togglePolicy(sectionKey, policy.id)}
                className="mt-0.5"
              />
              {policy.id.startsWith('custom_') ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={policy.text}
                    onChange={(e) => updatePolicyText(sectionKey, policy.id, e.target.value)}
                    placeholder="Enter custom policy..."
                    className="flex-1 h-8 bg-input border-border text-foreground text-sm"
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removePolicy(sectionKey, policy.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className={`text-sm cursor-pointer ${policy.enabled ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                  {policy.text}
                </label>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addCustomPolicy(sectionKey)} className="mt-2 gap-2 border-border text-sm">
            <PlusCircle className="h-4 w-4" /> Add Custom
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {getActivePolicies(policies).length > 0 ? (
            <ul className="space-y-2">
              {getActivePolicies(policies).map((p, i) => (
                <li key={p.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className={`font-bold flex-shrink-0 ${iconColor}`}>{i + 1}.</span>
                  <span className="text-foreground">{p.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm italic text-muted-foreground">No policies specified.</p>
          )}
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2 border-border bg-card text-foreground hover:bg-muted">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Badge
            variant={contractStatus === 'signed' ? 'default' : 'secondary'}
            className={`text-sm ${contractStatus === 'signed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : contractStatus === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-muted text-muted-foreground'}`}
          >
            {contractStatus === 'signed' && <CheckCircle className="h-3 w-3 mr-1" />}
            {contractStatus === 'pending' && <Clock className="h-3 w-3 mr-1" />}
            {contractStatus.charAt(0).toUpperCase() + contractStatus.slice(1)}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Button onClick={handleNewContract} className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" size="lg">
              <Plus className="h-4 w-4" /> New Staff Agreement
            </Button>

            <StaffContractsList
              onSelectContract={handleSelectContract}
              selectedContractId={selectedContractId || undefined}
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-4 bg-card rounded-lg p-3 border border-border shadow-lg shadow-primary/5">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                {selectedContractId ? 'Edit Staff Agreement' : 'New Staff Agreement'}
              </h2>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)} size="sm" className="border-border text-foreground hover:bg-muted">
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button onClick={handleSaveContract} size="sm" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(true)} size="sm" className="border-border text-foreground hover:bg-muted">
                      <Edit2 className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button onClick={generatePDF} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                      <Download className="h-4 w-4 mr-1" /> Download PDF
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Contract Document */}
            <Card className="bg-card shadow-2xl border border-border overflow-hidden" ref={contractRef}>
              <CardContent className="p-0">
                {/* Contract Header */}
                <div className="relative bg-gradient-to-r from-[hsl(220,20%,8%)] via-[hsl(0,70%,18%)] to-[hsl(220,20%,8%)] text-white p-8 text-center overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-destructive to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[hsl(var(--flag-saffron))] via-[hsl(var(--flag-white))] to-[hsl(var(--flag-green))]" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(0_70%_50%/0.12),transparent_70%)]" />
                  
                  <div className="relative z-10 flex items-center justify-center gap-3 mb-3">
                    <Shield className="h-8 w-8 text-destructive" style={{filter: 'drop-shadow(0 0 10px hsl(0 70% 50% / 0.5))'}} />
                    <h1 className="text-3xl font-bold tracking-widest" style={{textShadow: '0 0 30px hsl(0 70% 50% / 0.5)'}}>SKYLIFE ROLEPLAY INDIA</h1>
                    <Shield className="h-8 w-8 text-destructive" style={{filter: 'drop-shadow(0 0 10px hsl(0 70% 50% / 0.5))'}} />
                  </div>
                  <p className="text-lg font-semibold tracking-wider text-destructive/90 relative z-10">STAFF & ADMINISTRATOR AGREEMENT</p>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <Badge className="bg-destructive/20 text-destructive border border-destructive/40 text-xs">
                      <Lock className="h-3 w-3 mr-1" /> CONFIDENTIAL — NDA
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-4 text-sm text-muted-foreground relative z-10">
                    <span>Date: {format(new Date(), 'dd MMMM yyyy')}</span>
                    {selectedContractId && <span className="text-destructive">•</span>}
                    {selectedContractId && <span>ID: {selectedContractId.slice(0, 8)}...</span>}
                  </div>
                </div>

                <div className="p-8 space-y-8 text-foreground">
                  {/* Preamble */}
                  <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-destructive mb-2">IMPORTANT NOTICE</h3>
                        <p className="text-sm text-muted-foreground">
                          This Staff & Administrator Agreement ("Agreement") is a legally binding document between the Server Management and the Staff Member. 
                          By signing this agreement, the Staff Member acknowledges and accepts <strong className="text-foreground">all policies, responsibilities, and consequences</strong> outlined herein. 
                          Violations of this agreement may result in <strong className="text-destructive">immediate termination and permanent ban</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Parties */}
                  <section>
                    <h2 className="text-xl font-bold text-primary border-b-2 border-primary/30 pb-2 mb-6 uppercase tracking-wide">Parties to This Agreement</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Party A */}
                      <div className="bg-muted/50 p-5 rounded-xl border border-border relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                          <span className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/30">A</span>
                          Server Management
                        </h3>
                        {isEditing ? (
                          <div className="space-y-3">
                            {[
                              { label: 'Organization', field: 'serverName' as const },
                              { label: 'Representative', field: 'serverOwner' as const },
                              { label: 'Email', field: 'serverEmail' as const },
                              { label: 'Discord', field: 'serverDiscord' as const },
                            ].map(({ label, field }) => (
                              <div key={field}>
                                <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
                                <Input value={contractData[field]} onChange={(e) => handleInputChange(field, e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2 text-sm">
                            <p><span className="font-bold text-muted-foreground">Organization:</span> <span className="text-foreground">{contractData.serverName}</span></p>
                            <p><span className="font-bold text-muted-foreground">Representative:</span> <span className="text-foreground">{contractData.serverOwner}</span></p>
                            <p><span className="font-bold text-muted-foreground">Email:</span> <span className="text-foreground">{contractData.serverEmail}</span></p>
                            <p><span className="font-bold text-muted-foreground">Discord:</span> <span className="text-foreground">{contractData.serverDiscord}</span></p>
                          </div>
                        )}
                      </div>

                      {/* Party B */}
                      <div className="bg-muted/50 p-5 rounded-xl border border-border relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
                        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                          <span className="w-7 h-7 bg-destructive text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-destructive/30">B</span>
                          Staff Member
                        </h3>
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Full Name *</Label>
                              <Input value={contractData.staffName} onChange={(e) => handleInputChange('staffName', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" placeholder="Required" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Email</Label>
                              <Input type="email" value={contractData.staffEmail} onChange={(e) => handleInputChange('staffEmail', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Discord ID</Label>
                              <Input value={contractData.staffDiscord} onChange={(e) => handleInputChange('staffDiscord', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Role / Position</Label>
                              <Select value={contractData.staffRole} onValueChange={(v) => handleInputChange('staffRole', v)}>
                                <SelectTrigger className="h-9 mt-1 bg-input border-border text-foreground"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Trial Moderator">Trial Moderator</SelectItem>
                                  <SelectItem value="Moderator">Moderator</SelectItem>
                                  <SelectItem value="Senior Moderator">Senior Moderator</SelectItem>
                                  <SelectItem value="Administrator">Administrator</SelectItem>
                                  <SelectItem value="Senior Administrator">Senior Administrator</SelectItem>
                                  <SelectItem value="Head Administrator">Head Administrator</SelectItem>
                                  <SelectItem value="Developer">Developer</SelectItem>
                                  <SelectItem value="Management">Management</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Department</Label>
                              <Select value={contractData.staffDepartment} onValueChange={(v) => handleInputChange('staffDepartment', v)}>
                                <SelectTrigger className="h-9 mt-1 bg-input border-border text-foreground"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="General Administration">General Administration</SelectItem>
                                  <SelectItem value="Player Support">Player Support</SelectItem>
                                  <SelectItem value="Development">Development</SelectItem>
                                  <SelectItem value="Community Management">Community Management</SelectItem>
                                  <SelectItem value="Anti-Cheat">Anti-Cheat</SelectItem>
                                  <SelectItem value="Training">Training</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Join Date</Label>
                              <Input type="date" value={contractData.staffJoinDate} onChange={(e) => handleInputChange('staffJoinDate', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-sm">
                            <p><span className="font-bold text-muted-foreground">Name:</span> <span className="text-foreground">{contractData.staffName || <span className="italic text-muted-foreground/50">[To be filled]</span>}</span></p>
                            <p><span className="font-bold text-muted-foreground">Email:</span> <span className="text-foreground">{contractData.staffEmail || <span className="italic text-muted-foreground/50">[To be filled]</span>}</span></p>
                            <p><span className="font-bold text-muted-foreground">Discord:</span> <span className="text-foreground">{contractData.staffDiscord || <span className="italic text-muted-foreground/50">[To be filled]</span>}</span></p>
                            <p><span className="font-bold text-muted-foreground">Role:</span> <span className="text-foreground">{contractData.staffRole}</span></p>
                            <p><span className="font-bold text-muted-foreground">Department:</span> <span className="text-foreground">{contractData.staffDepartment}</span></p>
                            <p><span className="font-bold text-muted-foreground">Join Date:</span> <span className="text-foreground">{contractData.staffJoinDate ? format(new Date(contractData.staffJoinDate), 'dd MMM yyyy') : ''}</span></p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Contract Period */}
                  <section>
                    <h2 className="text-xl font-bold text-primary border-b-2 border-primary/30 pb-2 mb-6 uppercase tracking-wide">Contract Period</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                      {isEditing ? (
                        <>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground">Duration</Label>
                            <Select value={contractData.contractDuration} onValueChange={(v) => handleInputChange('contractDuration', v)}>
                              <SelectTrigger className="h-9 mt-1 bg-input border-border text-foreground"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="3 months">3 Months</SelectItem>
                                <SelectItem value="6 months">6 Months</SelectItem>
                                <SelectItem value="12 months">12 Months</SelectItem>
                                <SelectItem value="Indefinite">Indefinite</SelectItem>
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
                        </>
                      )}
                    </div>
                  </section>

                  {/* Policy Sections */}
                  <div className="space-y-8">
                    <div className="bg-destructive/5 border-l-4 border-destructive rounded-r-xl p-5">
                      <PolicySection
                        title="Confidentiality & Non-Disclosure (NDA)"
                        icon={Lock}
                        iconColor="text-destructive"
                        sectionKey="ndaPolicies"
                        policies={contractData.ndaPolicies}
                      />
                    </div>

                    <div className="bg-amber-500/5 border-l-4 border-amber-500 rounded-r-xl p-5">
                      <PolicySection
                        title="Conflict of Interest"
                        icon={Scale}
                        iconColor="text-amber-400"
                        sectionKey="conflictPolicies"
                        policies={contractData.conflictPolicies}
                      />
                    </div>

                    <div className="bg-primary/5 border-l-4 border-primary rounded-r-xl p-5">
                      <PolicySection
                        title="Anti-Corruption & Zero Tolerance Policy"
                        icon={AlertTriangle}
                        iconColor="text-primary"
                        sectionKey="antiCorruptionPolicies"
                        policies={contractData.antiCorruptionPolicies}
                      />
                    </div>

                    <div className="bg-emerald-500/5 border-l-4 border-emerald-500 rounded-r-xl p-5">
                      <PolicySection
                        title="Data Protection & Privacy"
                        icon={EyeOff}
                        iconColor="text-emerald-400"
                        sectionKey="dataProtectionPolicies"
                        policies={contractData.dataProtectionPolicies}
                      />
                    </div>

                    <div className="bg-neon-purple/5 border-l-4 border-neon-purple rounded-r-xl p-5">
                      <PolicySection
                        title="Code of Conduct & Responsibilities"
                        icon={UserCheck}
                        iconColor="text-neon-purple"
                        sectionKey="conductPolicies"
                        policies={contractData.conductPolicies}
                      />
                    </div>
                  </div>

                  {/* Disciplinary Section */}
                  <section>
                    <h2 className="text-xl font-bold text-destructive border-b-2 border-destructive/30 pb-2 mb-4 uppercase tracking-wide flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Disciplinary Action & Consequences
                    </h2>
                    <div className="bg-destructive/10 border border-destructive/30 p-5 rounded-xl">
                      {isEditing ? (
                        <Textarea
                          value={contractData.disciplinaryAction}
                          onChange={(e) => handleInputChange('disciplinaryAction', e.target.value)}
                          className="min-h-[100px] bg-input border-border text-foreground"
                        />
                      ) : (
                        <p className="text-sm text-foreground whitespace-pre-wrap">{contractData.disciplinaryAction}</p>
                      )}
                    </div>
                  </section>

                  {/* Custom Terms */}
                  <section>
                    <h2 className="text-xl font-bold text-primary border-b-2 border-primary/30 pb-2 mb-4 uppercase tracking-wide">
                      Additional Terms & Notes
                    </h2>
                    {isEditing ? (
                      <Textarea
                        value={contractData.customTerms}
                        onChange={(e) => handleInputChange('customTerms', e.target.value)}
                        placeholder="Add any additional terms or notes..."
                        className="min-h-[80px] bg-input border-border text-foreground"
                      />
                    ) : (
                      <div className="bg-muted/50 p-4 rounded-lg border border-border">
                        {contractData.customTerms ? (
                          <p className="text-sm text-foreground whitespace-pre-wrap italic">{contractData.customTerms}</p>
                        ) : (
                          <p className="italic text-muted-foreground">No additional terms specified.</p>
                        )}
                      </div>
                    )}
                  </section>

                  {/* Electronic Signatures */}
                  <section className="pt-8 border-t-2 border-border">
                    <h2 className="text-xl font-bold text-primary mb-2 uppercase tracking-wide">Electronic Signatures</h2>
                    <p className="text-sm italic text-muted-foreground mb-6">
                      By signing below, both parties acknowledge that they have read, understood, and agree to all terms and policies of this Staff & Administrator Agreement. 
                      Electronic signatures are legally binding and include timestamp verification.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Party A */}
                      <div className="bg-muted/50 p-5 rounded-xl border border-border">
                        {savedOwnerSignature && !ownerSignature && (
                          <div className="mb-3 p-2 bg-primary/10 rounded border border-primary/30 flex items-center justify-between">
                            <p className="text-xs text-primary">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              Saved signature will auto-apply on save
                            </p>
                          </div>
                        )}
                        <SignaturePad
                          label="Party A - Server Management"
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
                          <Button variant="outline" size="sm" className="mt-2 text-xs w-full border-border" onClick={() => { setOwnerSignature(null); setOwnerSignedAt(null); }}>
                            Re-sign
                          </Button>
                        )}
                      </div>

                      {/* Party B */}
                      <div className="bg-muted/50 p-5 rounded-xl border border-border">
                        <SignaturePad
                          label="Party B - Staff Member"
                          onSave={handleStaffSign}
                          existingSignature={staffSignature || undefined}
                          disabled={!!staffSignature}
                        />
                        {staffSignedAt && (
                          <div className="mt-3 p-2 bg-emerald-500/10 rounded border border-emerald-500/30">
                            <p className="text-xs text-emerald-400">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              Signed on: {format(new Date(staffSignedAt), 'dd MMM yyyy, HH:mm:ss')}
                            </p>
                            <p className="text-xs text-emerald-400/70">By: {contractData.staffName || 'Staff Member'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Footer */}
                  <div className="text-center pt-8 border-t border-border text-xs text-muted-foreground">
                    <div className="h-[2px] w-full bg-gradient-to-r from-[hsl(var(--flag-saffron))] via-[hsl(var(--flag-white))] to-[hsl(var(--flag-green))] mb-6 rounded-full" />
                    <p className="italic font-semibold text-destructive/80">CONFIDENTIAL — This document contains sensitive internal information</p>
                    <p className="mt-2 font-semibold text-primary">Skylife Roleplay India | Staff & Administrator Agreement</p>
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

export default StaffContract;
