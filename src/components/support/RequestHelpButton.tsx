import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStaffAccess } from "@/hooks/useStaffAccess";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LifeBuoy, Loader2, CheckCircle } from "lucide-react";

interface RequestHelpButtonProps {
  chatId: string;
  chatSubject: string;
}

export const RequestHelpButton = ({ chatId, chatSubject }: RequestHelpButtonProps) => {
  const { toast } = useToast();
  const { userDiscordId, discordUsername } = useStaffAccess();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendHelpRequest = async () => {
    if (!reason.trim()) {
      toast({ title: "Please provide a reason", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-staff-help", {
        body: {
          staffDiscordId: userDiscordId || undefined,
          staffUsername: discordUsername || "Staff Member",
          chatSubject: chatSubject,
          chatId: chatId,
          reason: reason.trim(),
          ticketType: "live_chat",
        },
      });

      if (error) {
        console.error("Help request error:", error);
        toast({ title: "Failed to send help request", description: error.message, variant: "destructive" });
      } else {
        setSent(true);
        toast({ title: "Help request sent!", description: "Admins have been notified on Discord." });
        setTimeout(() => {
          setOpen(false);
          setSent(false);
          setReason("");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Help request error:", err);
      toast({ title: "Failed to send", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
      >
        <LifeBuoy className="w-4 h-4" />
        Request Help
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-orange-400" />
              Request Staff Assistance
            </DialogTitle>
            <DialogDescription>
              This will send a notification to the Discord help channel tagging all admins. Use this when you need backup handling a chat or ticket.
            </DialogDescription>
          </DialogHeader>

          {sent ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <CheckCircle className="w-16 h-16 text-green-500 animate-in zoom-in duration-300" />
              <p className="text-lg font-semibold text-green-400">Help Request Sent!</p>
              <p className="text-sm text-muted-foreground">Admins have been notified on Discord</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Chat Subject</Label>
                  <p className="text-sm font-medium">{chatSubject}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Requesting As</Label>
                  <p className="text-sm font-medium">{discordUsername || "Staff Member"}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Why do you need help? *</Label>
                  <Textarea
                    id="reason"
                    placeholder="Describe the situation and what help you need..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleSendHelpRequest}
                  disabled={sending || !reason.trim()}
                  className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LifeBuoy className="w-4 h-4" />}
                  {sending ? "Sending..." : "Send Help Request"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
