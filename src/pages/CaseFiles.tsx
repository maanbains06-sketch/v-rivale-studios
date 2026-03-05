import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useStaffAccess } from "@/hooks/useStaffAccess";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { CaseFilesList } from "@/components/case-files/CaseFilesList";
import { CaseFileDetail } from "@/components/case-files/CaseFileDetail";
import { CreateCaseDialog } from "@/components/case-files/CreateCaseDialog";
import { PlayerStatusSection } from "@/components/case-files/PlayerStatusSection";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FolderOpen, Users, Shield } from "lucide-react";

const CaseFiles = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOwner, isStaff, loading, userDiscordId, userId, discordUsername, discordAvatar, staffRoleType, voteWeight } = useStaffAccess();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("cases");

  useEffect(() => {
    if (!loading && !isStaff) {
      toast({ title: "Access Denied", description: "Only staff members can access Case Files.", variant: "destructive" });
      navigate("/");
    }
  }, [loading, isStaff, navigate, toast]);

  const handleCaseCreated = useCallback(() => {
    setShowCreate(false);
    setRefreshTrigger(p => p + 1);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isStaff) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Case Files</h1>
              <p className="text-muted-foreground text-sm">Internal Investigation & Case Management</p>
            </div>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New Case
          </Button>
        </div>

        {selectedCaseId ? (
          <CaseFileDetail
            caseId={selectedCaseId}
            onBack={() => setSelectedCaseId(null)}
            userDiscordId={userDiscordId}
            userId={userId}
            discordUsername={discordUsername}
            discordAvatar={discordAvatar}
            isOwner={isOwner}
            staffRoleType={staffRoleType}
            voteWeight={voteWeight}
            onRefresh={() => setRefreshTrigger(p => p + 1)}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="cases" className="gap-2">
                <Shield className="w-4 h-4" /> Case Files
              </TabsTrigger>
              <TabsTrigger value="players" className="gap-2">
                <Users className="w-4 h-4" /> Player Status
              </TabsTrigger>
            </TabsList>
            <TabsContent value="cases">
              <CaseFilesList
                onSelectCase={setSelectedCaseId}
                refreshTrigger={refreshTrigger}
              />
            </TabsContent>
            <TabsContent value="players">
              <PlayerStatusSection />
            </TabsContent>
          </Tabs>
        )}

        <CreateCaseDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          userDiscordId={userDiscordId}
          userId={userId}
          discordUsername={discordUsername}
          onCreated={handleCaseCreated}
        />
      </div>
    </div>
  );
};

export default CaseFiles;
