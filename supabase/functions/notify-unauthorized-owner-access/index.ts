import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UnauthorizedAccessRequest {
  attempted_user_id: string;
  attempted_user_email: string;
  attempted_discord_username?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { attempted_user_id, attempted_user_email, attempted_discord_username }: UnauthorizedAccessRequest = await req.json();

    console.log("Unauthorized access attempt:", { attempted_user_id, attempted_user_email, attempted_discord_username });

    // Get owner email from site_settings and staff_members
    const { data: ownerDiscordId } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "owner_discord_id")
      .single();

    if (!ownerDiscordId?.value) {
      console.log("Owner discord ID not configured");
      return new Response(JSON.stringify({ error: "Owner not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get owner's email from staff_members
    const { data: ownerStaff } = await supabase
      .from("staff_members")
      .select("email")
      .eq("discord_id", ownerDiscordId.value)
      .single();

    if (!ownerStaff?.email) {
      console.log("Owner email not found in staff_members");
      return new Response(JSON.stringify({ error: "Owner email not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "UTC",
      dateStyle: "full",
      timeStyle: "long",
    });

    const emailResponse = await resend.emails.send({
      from: "SLRP Security <onboarding@resend.dev>",
      to: [ownerStaff.email],
      subject: "⚠️ Unauthorized Owner Panel Access Attempt",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔒 Security Alert</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Unauthorized Access Attempt Detected</p>
          </div>
          
          <div style="background: #1a1a1a; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #333;">
            <p style="color: #e5e5e5; font-size: 16px; line-height: 1.6;">
              Someone attempted to access the <strong style="color: #f59e0b;">Owner Panel</strong> without proper authorization.
            </p>
            
            <div style="background: #262626; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3 style="color: #f59e0b; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Attempt Details</h3>
              <table style="width: 100%; color: #e5e5e5;">
                <tr>
                  <td style="padding: 8px 0; color: #9ca3af;">User ID:</td>
                  <td style="padding: 8px 0; font-family: monospace; color: #f87171;">${attempted_user_id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #9ca3af;">Email:</td>
                  <td style="padding: 8px 0; color: #fbbf24;">${attempted_user_email || "Not available"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #9ca3af;">Discord:</td>
                  <td style="padding: 8px 0; color: #60a5fa;">${attempted_discord_username || "Not available"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #9ca3af;">Timestamp:</td>
                  <td style="padding: 8px 0; color: #a3e635;">${timestamp} UTC</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; line-height: 1.6;">
              This user was automatically redirected away from the Owner Panel. No data was exposed.
            </p>
            
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #333;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                This is an automated security notification from SLRP Server.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Security notification sent to owner:", emailResponse);

    // Log the attempt in owner_audit_log using service role
    await supabase.from("owner_audit_log").insert({
      owner_user_id: attempted_user_id,
      action_type: "unauthorized_access",
      action_description: `Unauthorized Owner Panel access attempt by ${attempted_user_email || attempted_user_id}`,
      old_value: null,
      new_value: { attempted_user_email, attempted_discord_username, timestamp },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in notify-unauthorized-owner-access:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
