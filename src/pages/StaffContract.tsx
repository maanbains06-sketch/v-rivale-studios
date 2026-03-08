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
  serverName: string;
  serverOwner: string;
  serverEmail: string;
  serverDiscord: string;
  staffName: string;
  staffEmail: string;
  staffDiscord: string;
  staffRole: string;
  staffDepartment: string;
  staffJoinDate: string;
  contractDuration: string;
  startDate: string;
  endDate: string;
  ndaPolicies: PolicyItem[];
  conflictPolicies: PolicyItem[];
  antiCorruptionPolicies: PolicyItem[];
  dataProtectionPolicies: PolicyItem[];
  conductPolicies: PolicyItem[];
  communicationPolicies: PolicyItem[];
  serverAssetPolicies: PolicyItem[];
  emergencyPolicies: PolicyItem[];
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
  { id: 'nda7', text: 'Staff must NOT disclose server financial details, revenue data, or donation records to unauthorized parties', enabled: true },
  { id: 'nda8', text: 'All internal communication channels (staff Discord, admin chat) content is strictly confidential', enabled: true },
];

const defaultConflictPolicies: PolicyItem[] = [
  { id: 'coi1', text: 'Staff CANNOT hold administrative or moderator positions on other GTA 5 RP servers simultaneously', enabled: true },
  { id: 'coi2', text: 'Staff must disclose any ownership or partnership in other gaming communities', enabled: true },
  { id: 'coi3', text: 'Staff must NOT recruit Skylife RP players or staff members for competing servers', enabled: true },
  { id: 'coi4', text: 'Any secondary involvement in gaming communities must be disclosed to management immediately', enabled: true },
  { id: 'coi5', text: 'Staff must NOT share server strategies, marketing plans, or growth tactics with competing servers', enabled: true },
  { id: 'coi6', text: 'Staff must NOT accept compensation or rewards from other servers for any information or services', enabled: true },
];

const defaultAntiCorruptionPolicies: PolicyItem[] = [
  { id: 'ac1', text: 'ZERO TOLERANCE for spawning in-game items, vehicles, or currency for personal use or for friends', enabled: true },
  { id: 'ac2', text: 'Staff must NOT unban players without following the proper ban appeal process', enabled: true },
  { id: 'ac3', text: 'Accepting real-world payment, gifts, or favors in exchange for in-game benefits is strictly prohibited', enabled: true },
  { id: 'ac4', text: 'Staff must NOT grant whitelist access, job roles, or special permissions outside official procedures', enabled: true },
  { id: 'ac5', text: 'Using admin tools to gain unfair advantage during roleplay is strictly forbidden', enabled: true },
  { id: 'ac6', text: 'Staff must NOT modify player records, stats, or inventories without legitimate administrative reason and proper logging', enabled: true },
  { id: 'ac7', text: 'Favoritism in handling reports, applications, or disputes based on personal relationships is prohibited', enabled: true },
  { id: 'ac8', text: 'Staff must NOT manipulate server economy, job payouts, or business profits for personal gain', enabled: true },
  { id: 'ac9', text: 'Creating or using alternate accounts to bypass staff restrictions or gain unfair advantages is strictly prohibited', enabled: true },
];

const defaultDataProtectionPolicies: PolicyItem[] = [
  { id: 'dp1', text: 'All player reports, tickets, and personal data must be handled with strict privacy and confidentiality', enabled: true },
  { id: 'dp2', text: 'Player information must NOT be used for personal purposes, harassment, or sharing outside the staff team', enabled: true },
  { id: 'dp3', text: 'Staff must access player data ONLY when required for legitimate moderation and administrative duties', enabled: true },
  { id: 'dp4', text: 'All moderation actions must be properly logged and documented in the admin system', enabled: true },
  { id: 'dp5', text: 'Staff must follow data retention policies and not store player data on personal devices', enabled: true },
  { id: 'dp6', text: 'Player ban records and appeal information must be kept confidential and not discussed publicly', enabled: true },
  { id: 'dp7', text: 'Staff must NOT share player Discord DMs, tickets, or complaint details with other players', enabled: true },
];

const defaultConductPolicies: PolicyItem[] = [
  { id: 'cd1', text: 'Staff must maintain professional conduct and represent Skylife RP positively at all times', enabled: true },
  { id: 'cd2', text: 'Staff must respond to player reports and tickets within reasonable timeframes', enabled: true },
  { id: 'cd3', text: 'Attending mandatory staff meetings and training sessions is required', enabled: true },
  { id: 'cd4', text: 'Staff must follow the chain of command and escalate issues appropriately', enabled: true },
  { id: 'cd5', text: 'Maintaining minimum activity requirements as defined by management', enabled: true },
  { id: 'cd6', text: 'Staff must NOT engage in toxic behavior, discrimination, or harassment toward players or other staff', enabled: true },
  { id: 'cd7', text: 'Staff must remain impartial when handling disputes and avoid personal bias in decisions', enabled: true },
  { id: 'cd8', text: 'Staff must NOT publicly criticize the server, its management, or other staff members', enabled: true },
];

const defaultCommunicationPolicies: PolicyItem[] = [
  { id: 'cm1', text: 'Staff must maintain professional language in all official communications with players', enabled: true },
  { id: 'cm2', text: 'All warnings, bans, and moderation actions must include clear reasons documented in writing', enabled: true },
  { id: 'cm3', text: 'Staff must NOT make public statements on behalf of the server without management approval', enabled: true },
  { id: 'cm4', text: 'Internal disputes between staff members must be resolved through proper channels, not public forums', enabled: true },
  { id: 'cm5', text: 'Staff must respond to management communications within 24 hours during active duty periods', enabled: true },
];

const defaultServerAssetPolicies: PolicyItem[] = [
  { id: 'sa1', text: 'Server assets, scripts, and custom resources are the property of Skylife RP and must NOT be copied or distributed', enabled: true },
  { id: 'sa2', text: 'Staff must NOT download, backup, or extract server files, database exports, or configuration files without authorization', enabled: true },
  { id: 'sa3', text: 'Access credentials (FTP, database, admin panels) must NOT be shared with unauthorized individuals', enabled: true },
  { id: 'sa4', text: 'Any custom tools, scripts, or modifications created for the server remain property of Skylife RP', enabled: true },
  { id: 'sa5', text: 'Staff must immediately report any unauthorized access or security breach to server management', enabled: true },
];

const defaultEmergencyPolicies: PolicyItem[] = [
  { id: 'em1', text: 'In case of server attacks (DDoS, exploits), staff must follow the emergency protocol and notify management immediately', enabled: true },
  { id: 'em2', text: 'Staff must NOT attempt to handle major security incidents independently without informing senior management', enabled: true },
  { id: 'em3', text: 'In case of mass rule violations or raids, staff must document all actions taken and players involved', enabled: true },
  { id: 'em4', text: 'Staff must be available for emergency situations during their assigned duty periods', enabled: true },
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
  communicationPolicies: defaultCommunicationPolicies,
  serverAssetPolicies: defaultServerAssetPolicies,
  emergencyPolicies: defaultEmergencyPolicies,
  customTerms: "",
  disciplinaryAction: "Violations may result in immediate suspension, demotion, permanent removal from staff, and potential ban from the server. Severe breaches involving data leaks or corruption will be handled with zero tolerance. Repeated minor violations will result in escalating consequences: 1st offense — Written Warning, 2nd offense — Temporary Suspension (7 days), 3rd offense — Permanent Removal. Major violations (data leaks, corruption, abuse of power) will result in immediate termination without prior warning.",
};

type PolicySectionKey = 'ndaPolicies' | 'conflictPolicies' | 'antiCorruptionPolicies' | 'dataProtectionPolicies' | 'conductPolicies' | 'communicationPolicies' | 'serverAssetPolicies' | 'emergencyPolicies';

const StaffContract = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const contractRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
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
  const [currentUserDiscordId, setCurrentUserDiscordId] = useState<string | null>(null);

  useEffect(() => {
    checkAccess();
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

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      
      // Store user's discord ID
      const discordId = user.user_metadata?.discord_id || user.user_metadata?.provider_id || user.user_metadata?.sub;
      setCurrentUserDiscordId(discordId || null);

      // Check if owner
      const { data: isOwnerResult } = await supabase.rpc("is_owner", { _user_id: user.id });
      if (isOwnerResult) {
        setIsOwner(true);
        setIsStaff(true);
        setLoading(false);
        return;
      }

      // Check if staff member or has panel access
      let hasAccess = false;

      // Check panel_access for staff_contract
      const { data: panelAccess } = await supabase.rpc("has_panel_access", { _user_id: user.id, _panel_type: "staff_contract" });
      if (panelAccess) hasAccess = true;

      // Check if active staff member
      if (!hasAccess && discordId) {
        const { data: staffMember } = await supabase
          .from("staff_members")
          .select("id")
          .eq("discord_id", discordId)
          .eq("is_active", true)
          .maybeSingle();
        if (staffMember) hasAccess = true;
      }

      if (!hasAccess) {
        // Fallback: check by user_id
        const { data: staffByUser } = await supabase
          .from("staff_members")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();
        if (staffByUser) hasAccess = true;
      }

      if (!hasAccess) {
        toast({ title: "Access Denied", description: "Only staff members can access this page.", variant: "destructive" });
        navigate("/");
        return;
      }

      setIsStaff(true);
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

  const togglePolicy = (section: PolicySectionKey, policyId: string) => {
    setContractData(prev => ({
      ...prev,
      [section]: (prev[section] as PolicyItem[]).map((p: PolicyItem) =>
        p.id === policyId ? { ...p, enabled: !p.enabled } : p
      )
    }));
  };

  const addCustomPolicy = (section: PolicySectionKey) => {
    const newId = `custom_${Date.now()}`;
    setContractData(prev => ({
      ...prev,
      [section]: [...(prev[section] as PolicyItem[]), { id: newId, text: '', enabled: true }]
    }));
  };

  const updatePolicyText = (section: PolicySectionKey, policyId: string, text: string) => {
    setContractData(prev => ({
      ...prev,
      [section]: (prev[section] as PolicyItem[]).map((p: PolicyItem) =>
        p.id === policyId ? { ...p, text } : p
      )
    }));
  };

  const removePolicy = (section: PolicySectionKey, policyId: string) => {
    setContractData(prev => ({
      ...prev,
      [section]: (prev[section] as PolicyItem[]).filter((p: PolicyItem) => p.id !== policyId)
    }));
  };

  const getActivePolicies = (policies: PolicyItem[]) => policies.filter(p => p.enabled && p.text.trim());

  const safeFormatDate = (dateStr: string | null | undefined, fmt: string = 'dd MMM yyyy') => {
    if (!dateStr) return '[Not set]';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '[Invalid date]';
      return format(d, fmt);
    } catch { return '[Invalid date]'; }
  };

  const handleSelectContract = (contract: any) => {
    try {
      setSelectedContractId(contract.id);
      // Safely parse contract_data - handle null, string, or object
      let data: Partial<StaffContractData> = {};
      if (contract.contract_data) {
        if (typeof contract.contract_data === 'string') {
          try { data = JSON.parse(contract.contract_data); } catch { data = {}; }
        } else {
          data = contract.contract_data as Partial<StaffContractData>;
        }
      }
      // Merge with defaults, ensuring all policy arrays exist with proper structure
      const merged: StaffContractData = {
        ...defaultContractData,
        ...data,
        ndaPolicies: Array.isArray(data.ndaPolicies) && data.ndaPolicies.length > 0 ? data.ndaPolicies : defaultContractData.ndaPolicies,
        conflictPolicies: Array.isArray(data.conflictPolicies) && data.conflictPolicies.length > 0 ? data.conflictPolicies : defaultContractData.conflictPolicies,
        antiCorruptionPolicies: Array.isArray(data.antiCorruptionPolicies) && data.antiCorruptionPolicies.length > 0 ? data.antiCorruptionPolicies : defaultContractData.antiCorruptionPolicies,
        dataProtectionPolicies: Array.isArray(data.dataProtectionPolicies) && data.dataProtectionPolicies.length > 0 ? data.dataProtectionPolicies : defaultContractData.dataProtectionPolicies,
        conductPolicies: Array.isArray(data.conductPolicies) && data.conductPolicies.length > 0 ? data.conductPolicies : defaultContractData.conductPolicies,
        communicationPolicies: Array.isArray(data.communicationPolicies) && data.communicationPolicies.length > 0 ? data.communicationPolicies : defaultContractData.communicationPolicies,
        serverAssetPolicies: Array.isArray(data.serverAssetPolicies) && data.serverAssetPolicies.length > 0 ? data.serverAssetPolicies : defaultContractData.serverAssetPolicies,
        emergencyPolicies: Array.isArray(data.emergencyPolicies) && data.emergencyPolicies.length > 0 ? data.emergencyPolicies : defaultContractData.emergencyPolicies,
      };
      setContractData(merged);
      setContractStatus(contract.status || "draft");
      setOwnerSignature(contract.owner_signature || null);
      setOwnerSignedAt(contract.owner_signed_at || null);
      setStaffSignature(contract.staff_signature || null);
      setStaffSignedAt(contract.staff_signed_at || null);
      setIsEditing(false);
    } catch (error) {
      console.error("Error loading contract:", error);
      toast({ title: "Error loading contract", description: "Could not parse contract data. Try creating a new one.", variant: "destructive" });
    }
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
    if (!isOwner) {
      toast({ title: "Permission Denied", description: "Only the owner can save contracts.", variant: "destructive" });
      return;
    }
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

  const handleStaffSign = async (signature: string) => {
    const signedAt = new Date().toISOString();
    const newStatus = ownerSignature ? "signed" : "pending";
    
    setStaffSignature(signature);
    setStaffSignedAt(signedAt);
    setContractStatus(newStatus);

    // If viewing an existing contract, persist the staff signature immediately
    if (selectedContractId) {
      try {
        const { error } = await supabase
          .from("staff_contracts")
          .update({
            staff_signature: signature,
            staff_signed_at: signedAt,
            status: newStatus,
          })
          .eq("id", selectedContractId);

        if (error) throw error;
        toast({ title: "Staff signature saved successfully" });
        setRefreshTrigger(prev => prev + 1);
      } catch (error: any) {
        console.error("Error saving staff signature:", error);
        toast({ title: "Failed to save signature", description: error?.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Staff signature recorded" });
    }
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
    drawFormField('Join Date', contractData.staffJoinDate ? safeFormatDate(contractData.staffJoinDate, 'dd/MM/yyyy') : '', margin + halfWidth + 4, yPos, halfWidth);
    yPos += 15;

    drawSectionHeader('Contract Period', '📅');
    drawFormField('Duration', contractData.contractDuration, margin, yPos, contentWidth / 3 - 2);
    drawFormField('Start Date', safeFormatDate(contractData.startDate, 'dd/MM/yyyy'), margin + contentWidth / 3 + 1, yPos, contentWidth / 3 - 2);
    drawFormField('End Date', safeFormatDate(contractData.endDate, 'dd/MM/yyyy'), margin + (contentWidth / 3 + 1) * 2, yPos, contentWidth / 3 - 2);
    yPos += 15;

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
    renderPolicies('Communication & Representation', '💬', contractData.communicationPolicies || []);
    renderPolicies('Server Assets & Intellectual Property', '🔐', contractData.serverAssetPolicies || []);
    renderPolicies('Emergency Protocols', '🚨', contractData.emergencyPolicies || []);

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

    checkPageBreak(70);
    drawSectionHeader('Signatures & Acknowledgement', '✍️');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text('By signing below, both parties acknowledge that they have read, understood, and agree to all terms of this agreement.', margin, yPos + 4);
    yPos += 12;

    const sigBoxWidth = (contentWidth - 10) / 2;
    const sigBoxHeight = 30;

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
    doc.text(`Date: ${ownerSignedAt ? safeFormatDate(ownerSignedAt, 'dd/MM/yyyy HH:mm') : '____________________'}`, margin + 3, yPos + sigBoxHeight + 13);

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
    doc.text(`Date: ${staffSignedAt ? safeFormatDate(staffSignedAt, 'dd/MM/yyyy HH:mm') : '____________________'}`, partyBX + 3, yPos + sigBoxHeight + 13);

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

  // Staff can sign if they are not the owner, they have a selected contract, and the contract's staff_discord_id matches their discord ID
  const canStaffSign = !isOwner && isStaff && selectedContractId && currentUserDiscordId && contractData.staffDiscord === currentUserDiscordId;

  if (!isStaff) return null;

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
    sectionKey: PolicySectionKey;
    policies: PolicyItem[];
  }) => (
    <section>
      <h2 className="text-lg font-bold text-foreground border-b-2 border-primary/30 pb-2 mb-4 uppercase tracking-wide flex items-center gap-2">
        <Icon className={`h-5 w-5 ${iconColor}`} />
        {title}
      </h2>
      {isEditing && isOwner ? (
        <div className="space-y-2">
          {policies.map((policy) => (
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
          <div className="flex items-center gap-2">
            {!isOwner && (
              <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400 bg-amber-500/10">
                <Eye className="h-3 w-3 mr-1" /> View Only
              </Badge>
            )}
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
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {isOwner && (
              <Button onClick={handleNewContract} className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" size="lg">
                <Plus className="h-4 w-4" /> New Staff Agreement
              </Button>
            )}

            <StaffContractsList
              onSelectContract={handleSelectContract}
              selectedContractId={selectedContractId || undefined}
              refreshTrigger={refreshTrigger}
              isOwner={isOwner}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-4 bg-card rounded-lg p-3 border border-border shadow-lg shadow-primary/5">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                {isOwner ? (selectedContractId ? 'Edit Staff Agreement' : 'New Staff Agreement') : 'Staff Agreement'}
              </h2>
              <div className="flex gap-2">
                {isOwner && isEditing ? (
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
                    {isOwner && (
                      <Button variant="outline" onClick={() => setIsEditing(true)} size="sm" className="border-border text-foreground hover:bg-muted">
                        <Edit2 className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    )}
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
                    <span>Date: {safeFormatDate(new Date().toISOString(), 'dd MMMM yyyy')}</span>
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
                        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2 text-lg">
                          <span className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/30">A</span>
                          Server Management
                        </h3>
                        {isEditing && isOwner ? (
                          <div className="space-y-3">
                            <div><Label className="text-xs font-semibold text-muted-foreground">Organization</Label><Input value={contractData.serverName} onChange={(e) => handleInputChange('serverName', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" /></div>
                            <div><Label className="text-xs font-semibold text-muted-foreground">Representative</Label><Input value={contractData.serverOwner} onChange={(e) => handleInputChange('serverOwner', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" /></div>
                            <div><Label className="text-xs font-semibold text-muted-foreground">Email</Label><Input value={contractData.serverEmail} onChange={(e) => handleInputChange('serverEmail', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" /></div>
                            <div><Label className="text-xs font-semibold text-muted-foreground">Discord</Label><Input value={contractData.serverDiscord} onChange={(e) => handleInputChange('serverDiscord', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" /></div>
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
                        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2 text-lg">
                          <span className="w-7 h-7 bg-destructive text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-destructive/30">B</span>
                          Staff Member
                        </h3>
                        {isEditing && isOwner ? (
                          <div className="space-y-3">
                            <div><Label className="text-xs font-semibold text-muted-foreground">Full Name *</Label><Input value={contractData.staffName} onChange={(e) => handleInputChange('staffName', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" placeholder="Required" /></div>
                            <div><Label className="text-xs font-semibold text-muted-foreground">Email</Label><Input value={contractData.staffEmail} onChange={(e) => handleInputChange('staffEmail', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" /></div>
                            <div><Label className="text-xs font-semibold text-muted-foreground">Discord ID</Label><Input value={contractData.staffDiscord} onChange={(e) => handleInputChange('staffDiscord', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" /></div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">Role</Label>
                              <Select value={contractData.staffRole} onValueChange={(v) => handleInputChange('staffRole', v)}>
                                <SelectTrigger className="h-9 mt-1 bg-input border-border text-foreground"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Admin">Admin</SelectItem>
                                  <SelectItem value="Moderator">Moderator</SelectItem>
                                  <SelectItem value="Developer">Developer</SelectItem>
                                  <SelectItem value="Support">Support</SelectItem>
                                  <SelectItem value="Trial Moderator">Trial Moderator</SelectItem>
                                  <SelectItem value="Event Manager">Event Manager</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div><Label className="text-xs font-semibold text-muted-foreground">Department</Label><Input value={contractData.staffDepartment} onChange={(e) => handleInputChange('staffDepartment', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" /></div>
                            <div><Label className="text-xs font-semibold text-muted-foreground">Join Date</Label><Input type="date" value={contractData.staffJoinDate} onChange={(e) => handleInputChange('staffJoinDate', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" /></div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-sm">
                            <p><span className="font-bold text-muted-foreground">Name:</span> <span className="text-foreground">{contractData.staffName || '[To be filled]'}</span></p>
                            <p><span className="font-bold text-muted-foreground">Email:</span> <span className="text-foreground">{contractData.staffEmail || '[To be filled]'}</span></p>
                            <p><span className="font-bold text-muted-foreground">Discord:</span> <span className="text-foreground">{contractData.staffDiscord || '[To be filled]'}</span></p>
                            <p><span className="font-bold text-muted-foreground">Role:</span> <span className="text-foreground">{contractData.staffRole}</span></p>
                            <p><span className="font-bold text-muted-foreground">Department:</span> <span className="text-foreground">{contractData.staffDepartment}</span></p>
                            <p><span className="font-bold text-muted-foreground">Join Date:</span> <span className="text-foreground">{contractData.staffJoinDate ? safeFormatDate(contractData.staffJoinDate) : '[To be filled]'}</span></p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Contract Period */}
                  <section>
                    <h2 className="text-lg font-bold text-foreground border-b-2 border-primary/30 pb-2 mb-4 uppercase tracking-wide flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" /> Contract Period
                    </h2>
                    {isEditing && isOwner ? (
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs font-semibold text-muted-foreground">Duration</Label>
                          <Select value={contractData.contractDuration} onValueChange={(v) => handleInputChange('contractDuration', v)}>
                            <SelectTrigger className="h-9 mt-1 bg-input border-border text-foreground"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1 month">1 Month</SelectItem>
                              <SelectItem value="3 months">3 Months</SelectItem>
                              <SelectItem value="6 months">6 Months</SelectItem>
                              <SelectItem value="1 year">1 Year</SelectItem>
                              <SelectItem value="Indefinite">Indefinite</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label className="text-xs font-semibold text-muted-foreground">Start Date</Label><Input type="date" value={contractData.startDate} onChange={(e) => handleInputChange('startDate', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" /></div>
                        <div><Label className="text-xs font-semibold text-muted-foreground">End Date</Label><Input type="date" value={contractData.endDate} onChange={(e) => handleInputChange('endDate', e.target.value)} className="h-9 mt-1 bg-input border-border text-foreground" /></div>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-muted/50 p-3 rounded-lg border border-border"><span className="font-bold text-muted-foreground block text-xs">Duration</span><span className="text-foreground">{contractData.contractDuration}</span></div>
                        <div className="bg-muted/50 p-3 rounded-lg border border-border"><span className="font-bold text-muted-foreground block text-xs">Start Date</span><span className="text-foreground">{safeFormatDate(contractData.startDate)}</span></div>
                        <div className="bg-muted/50 p-3 rounded-lg border border-border"><span className="font-bold text-muted-foreground block text-xs">End Date</span><span className="text-foreground">{safeFormatDate(contractData.endDate)}</span></div>
                      </div>
                    )}
                  </section>

                  {/* Policy Sections */}
                  <PolicySection title="1. Confidentiality & Non-Disclosure (NDA)" icon={Lock} iconColor="text-destructive" sectionKey="ndaPolicies" policies={contractData.ndaPolicies} />
                  <PolicySection title="2. Conflict of Interest" icon={Scale} iconColor="text-amber-400" sectionKey="conflictPolicies" policies={contractData.conflictPolicies} />
                  <PolicySection title="3. Anti-Corruption & Zero Tolerance" icon={AlertTriangle} iconColor="text-destructive" sectionKey="antiCorruptionPolicies" policies={contractData.antiCorruptionPolicies} />
                  <PolicySection title="4. Data Protection & Privacy" icon={Shield} iconColor="text-primary" sectionKey="dataProtectionPolicies" policies={contractData.dataProtectionPolicies} />
                  <PolicySection title="5. Code of Conduct & Responsibilities" icon={UserCheck} iconColor="text-emerald-400" sectionKey="conductPolicies" policies={contractData.conductPolicies} />
                  <PolicySection title="6. Communication & Representation" icon={Eye} iconColor="text-primary" sectionKey="communicationPolicies" policies={contractData.communicationPolicies || defaultCommunicationPolicies} />
                  <PolicySection title="7. Server Assets & Intellectual Property" icon={Lock} iconColor="text-amber-400" sectionKey="serverAssetPolicies" policies={contractData.serverAssetPolicies || defaultServerAssetPolicies} />
                  <PolicySection title="8. Emergency Protocols" icon={AlertTriangle} iconColor="text-destructive" sectionKey="emergencyPolicies" policies={contractData.emergencyPolicies || defaultEmergencyPolicies} />

                  {/* Disciplinary */}
                  <section>
                    <h2 className="text-lg font-bold text-foreground border-b-2 border-destructive/30 pb-2 mb-4 uppercase tracking-wide flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" /> 9. Disciplinary Action & Consequences
                    </h2>
                    {isEditing && isOwner ? (
                      <Textarea
                        value={contractData.disciplinaryAction}
                        onChange={(e) => handleInputChange('disciplinaryAction', e.target.value)}
                        className="bg-input border-border text-foreground min-h-[100px]"
                      />
                    ) : (
                      <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                        <p className="text-sm text-foreground whitespace-pre-line">{contractData.disciplinaryAction}</p>
                      </div>
                    )}
                  </section>

                  {/* Custom Terms */}
                  <section>
                    <h2 className="text-lg font-bold text-foreground border-b-2 border-primary/30 pb-2 mb-4 uppercase tracking-wide flex items-center gap-2">
                      <PlusCircle className="h-5 w-5 text-primary" /> 10. Additional Terms & Notes
                    </h2>
                    {isEditing && isOwner ? (
                      <Textarea
                        value={contractData.customTerms}
                        onChange={(e) => handleInputChange('customTerms', e.target.value)}
                        className="bg-input border-border text-foreground min-h-[80px]"
                        placeholder="Add any custom terms, special conditions, or additional notes..."
                      />
                    ) : (
                      contractData.customTerms ? (
                        <div className="bg-muted/50 border border-border rounded-lg p-4">
                          <p className="text-sm text-foreground whitespace-pre-line">{contractData.customTerms}</p>
                        </div>
                      ) : (
                        <p className="text-sm italic text-muted-foreground">No additional terms specified.</p>
                      )
                    )}
                  </section>

                  {/* Signatures */}
                  <section>
                    <h2 className="text-xl font-bold text-primary border-b-2 border-primary/30 pb-2 mb-6 uppercase tracking-wide flex items-center gap-2">
                      ✍️ Signatures & Acknowledgement
                    </h2>
                    <p className="text-sm italic text-muted-foreground mb-6">
                      By signing below, both parties acknowledge that they have read, understood, and agree to all terms and conditions of this Staff & Administrator Agreement.
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Owner Signature */}
                      <div className="border border-border rounded-xl p-5 bg-muted/30">
                        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                          <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">A</span>
                          Server Management
                        </h3>
                        {ownerSignature ? (
                          <div className="space-y-3">
                            <div className="border border-border rounded-lg p-4 bg-card">
                              <img src={ownerSignature} alt="Owner Signature" className="max-h-24 mx-auto" />
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p><strong>Signed by:</strong> {contractData.serverOwner}</p>
                              {ownerSignedAt && <p><strong>Date:</strong> {safeFormatDate(ownerSignedAt, 'dd MMM yyyy, HH:mm')}</p>}
                            </div>
                            {isOwner && isEditing && (
                              <Button variant="outline" size="sm" onClick={() => { setOwnerSignature(null); setOwnerSignedAt(null); }} className="w-full border-border text-xs">
                                Clear Signature
                              </Button>
                            )}
                          </div>
                        ) : isOwner ? (
                          <SignaturePad onSave={handleOwnerSign} label="Owner Signature" />
                        ) : (
                          <p className="text-sm text-muted-foreground italic text-center py-8">Awaiting owner signature</p>
                        )}
                      </div>

                      {/* Staff Signature */}
                      <div className="border border-border rounded-xl p-5 bg-muted/30">
                        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                          <span className="w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center text-xs font-bold">B</span>
                          Staff Member
                        </h3>
                        {staffSignature ? (
                          <div className="space-y-3">
                            <div className="border border-border rounded-lg p-4 bg-card">
                              <img src={staffSignature} alt="Staff Signature" className="max-h-24 mx-auto" />
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p><strong>Signed by:</strong> {contractData.staffName}</p>
                              {staffSignedAt && <p><strong>Date:</strong> {safeFormatDate(staffSignedAt, 'dd MMM yyyy, HH:mm')}</p>}
                            </div>
                            {isOwner && isEditing && (
                              <Button variant="outline" size="sm" onClick={() => { setStaffSignature(null); setStaffSignedAt(null); setContractStatus('draft'); }} className="w-full border-border text-xs">
                                Clear Signature
                              </Button>
                            )}
                          </div>
                        ) : canStaffSign ? (
                          <div className="space-y-2">
                            <SignaturePad onSave={handleStaffSign} label="Staff Signature" />
                            <p className="text-xs text-muted-foreground text-center">Sign to acknowledge and accept this agreement</p>
                          </div>
                        ) : isOwner ? (
                          <SignaturePad onSave={handleStaffSign} label="Staff Signature" />
                        ) : (
                          <p className="text-sm text-muted-foreground italic text-center py-8">
                            {selectedContractId ? "This contract is assigned to another staff member" : "Select a contract to sign"}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>
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
