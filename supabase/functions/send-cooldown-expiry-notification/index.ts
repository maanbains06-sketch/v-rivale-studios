import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RejectedApplication {
  id: string;
  user_id: string;
  reviewed_at: string;
  job_type?: string;
  discord?: string;
  discord_username?: string;
  table_name: string;
}

// Verify the cron secret for scheduled function calls
function verifyCronSecret(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");
  
  if (!cronSecret) {
    console.error("CRON_SECRET not configured");
    return false;
  }
  
  if (authHeader === `Bearer ${cronSecret}` || authHeader === cronSecret) {
    return true;
  }
  
  return false;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!verifyCronSecret(req)) {
    console.error("Unauthorized: Invalid or missing cron secret");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  try {
    console.log("Starting cooldown expiry notifications check...");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Calculate the time window: applications rejected exactly 24 hours ago (within 1 hour window)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const twentyFiveHoursAgo = new Date();
    twentyFiveHoursAgo.setHours(twentyFiveHoursAgo.getHours() - 25);

    console.log("Checking for rejected applications between:", twentyFiveHoursAgo.toISOString(), "and", twentyFourHoursAgo.toISOString());

    const allRejectedApplications: RejectedApplication[] = [];

    // Check whitelist_applications
    const { data: whitelistApps } = await supabaseAdmin
      .from("whitelist_applications")
      .select("id, user_id, reviewed_at, discord")
      .eq("status", "rejected")
      .gte("reviewed_at", twentyFiveHoursAgo.toISOString())
      .lt("reviewed_at", twentyFourHoursAgo.toISOString());

    if (whitelistApps) {
      allRejectedApplications.push(...whitelistApps.map(app => ({
        ...app,
        table_name: "whitelist_applications",
        job_type: "Whitelist"
      })));
    }

    // Check job_applications
    const { data: jobApps } = await supabaseAdmin
      .from("job_applications")
      .select("id, user_id, reviewed_at, job_type")
      .eq("status", "rejected")
      .gte("reviewed_at", twentyFiveHoursAgo.toISOString())
      .lt("reviewed_at", twentyFourHoursAgo.toISOString());

    if (jobApps) {
      allRejectedApplications.push(...jobApps.map(app => ({
        ...app,
        table_name: "job_applications"
      })));
    }

    // Check ban_appeals
    const { data: banAppeals } = await supabaseAdmin
      .from("ban_appeals")
      .select("id, user_id, reviewed_at, discord_username")
      .eq("status", "rejected")
      .gte("reviewed_at", twentyFiveHoursAgo.toISOString())
      .lt("reviewed_at", twentyFourHoursAgo.toISOString());

    if (banAppeals) {
      allRejectedApplications.push(...banAppeals.map(app => ({
        ...app,
        table_name: "ban_appeals",
        job_type: "Ban Appeal"
      })));
    }

    // Check staff_applications
    const { data: staffApps } = await supabaseAdmin
      .from("staff_applications")
      .select("id, user_id, reviewed_at, discord_username")
      .eq("status", "rejected")
      .gte("reviewed_at", twentyFiveHoursAgo.toISOString())
      .lt("reviewed_at", twentyFourHoursAgo.toISOString());

    if (staffApps) {
      allRejectedApplications.push(...staffApps.map(app => ({
        ...app,
        table_name: "staff_applications",
        job_type: "Staff"
      })));
    }

    // Check creator_applications
    const { data: creatorApps } = await supabaseAdmin
      .from("creator_applications")
      .select("id, user_id, reviewed_at, discord_username")
      .eq("status", "rejected")
      .gte("reviewed_at", twentyFiveHoursAgo.toISOString())
      .lt("reviewed_at", twentyFourHoursAgo.toISOString());

    if (creatorApps) {
      allRejectedApplications.push(...creatorApps.map(app => ({
        ...app,
        table_name: "creator_applications",
        job_type: "Creator"
      })));
    }

    console.log(`Found ${allRejectedApplications.length} applications with expired cooldowns`);

    if (allRejectedApplications.length === 0) {
      return new Response(
        JSON.stringify({ message: "No applications found requiring notifications" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const application of allRejectedApplications) {
      try {
        // Check if notification already sent
        const { data: existingNotification } = await supabaseAdmin
          .from("cooldown_expiry_notifications")
          .select("id")
          .eq("application_id", application.id)
          .eq("application_type", application.table_name)
          .single();

        if (existingNotification) {
          console.log(`Notification already sent for ${application.table_name} application ${application.id}`);
          continue;
        }

        // Get user profile for email
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("discord_username")
          .eq("id", application.user_id)
          .single();

        // Get user email from auth
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(application.user_id);
        
        if (!userData?.user?.email) {
          console.log(`No email found for user ${application.user_id}`);
          continue;
        }

        const discordName = profile?.discord_username || application.discord_username || application.discord || "User";
        const applicationType = application.job_type || "Application";

        // Send email notification
        const emailResponse = await resend.emails.send({
          from: Deno.env.get("RESEND_FROM") || "SLRP <onboarding@resend.dev>",
          to: [userData.user.email],
          subject: `Your SLRP ${applicationType} Cooldown Has Expired`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #0a0a0a; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #1a1a1a; color: #e0e0e0; padding: 30px; border-radius: 0 0 10px 10px; }
                  .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
                  .info-box { background: #2a2a2a; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
                  .success-icon { font-size: 48px; margin-bottom: 15px; }
                  .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <div class="success-icon">✨</div>
                    <h1>Cooldown Expired!</h1>
                    <p>You can now reapply to SLRP</p>
                  </div>
                  <div class="content">
                    <p>Hello <strong>${discordName}</strong>,</p>
                    
                    <p>Great news! Your 24-hour cooldown period for the <strong>${applicationType}</strong> application has expired. You are now eligible to submit a new application!</p>
                    
                    <div class="info-box">
                      <h3 style="margin-top: 0; color: #667eea;">💡 Tips for Your New Application</h3>
                      <ul style="margin-bottom: 0; padding-left: 20px;">
                        <li>Take time to review any feedback provided</li>
                        <li>Ensure all required fields are filled out completely</li>
                        <li>Provide detailed and thoughtful responses</li>
                        <li>Double-check your information before submitting</li>
                      </ul>
                    </div>
                    
                    <p style="text-align: center;">
                      <a href="https://roleplay-horizon.lovable.app" class="button">Apply Now</a>
                    </p>
                    
                    <p>We look forward to reviewing your new application. Good luck!</p>
                    
                    <p style="margin-top: 30px;">Best regards,<br><strong>The SLRP Team</strong></p>
                  </div>
                  <div class="footer">
                    <p>This is an automated notification from SLRP.</p>
                    <p>If you have questions, please contact us on Discord.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });

        console.log("Email sent successfully:", emailResponse);

        // Record the notification
        await supabaseAdmin
          .from("cooldown_expiry_notifications")
          .insert({
            user_id: application.user_id,
            application_id: application.id,
            application_type: application.table_name,
          });

        emailsSent++;
      } catch (error: any) {
        console.error(`Failed to send email for application ${application.id}:`, error);
        emailsFailed++;
      }
    }

    console.log(`Notification process complete. Sent: ${emailsSent}, Failed: ${emailsFailed}`);

    return new Response(
      JSON.stringify({
        message: "Cooldown expiry notification process completed",
        emailsSent,
        emailsFailed,
        totalProcessed: allRejectedApplications.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-cooldown-expiry-notification function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
