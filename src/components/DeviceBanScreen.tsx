import { Shield, Ban, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface DeviceBanScreenProps {
  reason: string;
}

const DeviceBanScreen = ({ reason }: DeviceBanScreenProps) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-4">
      <div className="max-w-lg text-center space-y-6">
        <div className="w-24 h-24 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <Ban className="w-12 h-12 text-destructive animate-pulse" />
        </div>
        <h1 className="text-3xl font-bold text-destructive">Access Denied</h1>
        <div className="space-y-3">
          <p className="text-lg text-muted-foreground">
            Your device has been permanently banned from accessing this website.
          </p>
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-2 justify-center mb-2">
              <Shield className="w-5 h-5 text-destructive" />
              <span className="font-semibold text-destructive">Ban Reason</span>
            </div>
            <p className="text-sm text-muted-foreground">{reason}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            If you believe this is a mistake, please submit a ban appeal through our Discord server.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            SKYLIFE ROLEPLAY INDIA • Anti-Cheat System
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeviceBanScreen;
