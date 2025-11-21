import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BanAppealNotificationRequest {
  userId: string;
  discordUsername: string;
  status: "approved" | "rejected";
  adminNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, discordUsername, status, adminNotes }: BanAppealNotificationRequest = await req.json();

    console.log("Sending ban appeal notification:", { userId, discordUsername, status });

    // Create Supabase client with service role key to get user email
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user's email from auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !userData?.user?.email) {
      console.error("Error fetching user email:", userError);
      throw new Error("Could not retrieve user email");
    }

    const email = userData.user.email;
    const statusText = status === "approved" ? "Approved" : "Rejected";
    const statusColor = status === "approved" ? "#10b981" : "#ef4444";

    const emailResponse = await resend.emails.send({
      from: "SLRP <onboarding@resend.dev>",
      to: [email],
      subject: `Ban Appeal ${statusText} - SLRP`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { color: white; margin: 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .status-badge { display: inline-block; padding: 10px 20px; border-radius: 5px; background: ${statusColor}; color: white; font-weight: bold; margin: 20px 0; }
              .notes-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor}; }
              .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>SLRP Ban Appeal Update</h1>
              </div>
              <div class="content">
                <p>Hello <strong>${discordUsername}</strong>,</p>
                <p>Your ban appeal has been reviewed by our administration team.</p>
                <div class="status-badge">Status: ${statusText}</div>
                
                ${adminNotes ? `
                  <div class="notes-section">
                    <h3 style="margin-top: 0; color: #374151;">Admin Notes:</h3>
                    <p style="color: #4b5563; line-height: 1.6;">${adminNotes}</p>
                  </div>
                ` : ''}
                
                ${status === "approved" ? `
                  <p style="color: #059669; font-weight: 500;">
                    Great news! Your ban appeal has been approved. You should now be able to access the server.
                  </p>
                ` : `
                  <p style="color: #dc2626;">
                    Unfortunately, your ban appeal was not approved at this time. If you have additional information or would like to appeal again in the future, please contact our support team.
                  </p>
                `}
                
                <p>If you have any questions, please join our Discord or contact support.</p>
                
                <div class="footer">
                  <p>This is an automated message from SLRP.</p>
                  <p>&copy; 2024 SLRP. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-ban-appeal-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
