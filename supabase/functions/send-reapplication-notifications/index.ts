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
  discord: string;
  reviewed_at: string;
  created_at: string;
  admin_notes: string | null;
}

interface UserProfile {
  discord_username: string | null;
}

// Verify the cron secret for scheduled function calls
function verifyCronSecret(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");
  
  if (!cronSecret) {
    console.error("CRON_SECRET not configured");
    return false;
  }
  
  // Accept Bearer token or direct secret in header
  if (authHeader === `Bearer ${cronSecret}` || authHeader === cronSecret) {
    return true;
  }
  
  return false;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify cron secret for security
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
    console.log("Starting reapplication notifications check...");

    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Calculate the date 7 days ago (when waiting period ends)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7));
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    eightDaysAgo.setHours(0, 0, 0, 0);

    console.log("Checking for rejected applications between:", eightDaysAgo.toISOString(), "and", sevenDaysAgo.toISOString());

    // Find rejected applications where reviewed_at was exactly 7 days ago (within a day window)
    const { data: rejectedApplications, error: appsError } = await supabaseAdmin
      .from("whitelist_applications")
      .select("id, user_id, discord, reviewed_at, created_at, admin_notes")
      .eq("status", "rejected")
      .gte("reviewed_at", eightDaysAgo.toISOString())
      .lt("reviewed_at", sevenDaysAgo.toISOString());

    if (appsError) {
      console.error("Error fetching applications:", appsError);
      throw appsError;
    }

    console.log(`Found ${rejectedApplications?.length || 0} rejected applications`);

    if (!rejectedApplications || rejectedApplications.length === 0) {
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

    for (const application of rejectedApplications as RejectedApplication[]) {
      try {
        // Check if we've already sent a notification for this application
        const { data: existingNotification } = await supabaseAdmin
          .from("whitelist_reapplication_notifications")
          .select("id")
          .eq("user_id", application.user_id)
          .eq("application_id", application.id)
          .single();

        if (existingNotification) {
          console.log(`Notification already sent for application ${application.id}`);
          continue;
        }

        // Get user profile for additional info
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("discord_username")
          .eq("id", application.user_id)
          .single();

        const discordName = (profile as UserProfile)?.discord_username || application.discord;

        // Send email notification
        const emailResponse = await resend.emails.send({
          from: "SLRP <onboarding@resend.dev>",
          to: [application.discord], // Using discord field which should contain email
          subject: "Your SLRP Reapplication Period Has Ended",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                  .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                  .info-box { background: #fff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
                  .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎮 SLRP Whitelist</h1>
                    <p>Your Reapplication Period Has Ended</p>
                  </div>
                  <div class="content">
                    <p>Hello <strong>${discordName}</strong>,</p>
                    
                    <p>We wanted to let you know that your 7-day waiting period has ended, and you can now submit a new whitelist application to join SLRP!</p>
                    
                    <div class="info-box">
                      <h3>📋 Previous Application Status</h3>
                      <p><strong>Status:</strong> Rejected</p>
                      <p><strong>Reviewed:</strong> ${new Date(application.reviewed_at).toLocaleDateString()}</p>
                      ${application.admin_notes ? `<p><strong>Feedback:</strong> ${application.admin_notes}</p>` : ""}
                    </div>
                    
                    <div class="info-box">
                      <h3>💡 Tips for Your New Application</h3>
                      <ul>
                        <li>Review the feedback provided on your previous application</li>
                        <li>Provide more detailed roleplay experience (minimum 50 characters)</li>
                        <li>Create a comprehensive character backstory (minimum 100 characters)</li>
                        <li>Ensure you meet all server requirements</li>
                        <li>Review our server rules and guidelines carefully</li>
                      </ul>
                    </div>
                    
                    <p style="text-align: center;">
                      <a href="${Deno.env.get("VITE_SUPABASE_URL")}/whitelist" class="button">Apply Now</a>
                    </p>
                    
                    <p>We're excited to see your improved application and hopefully welcome you to our community!</p>
                    
                    <p>Best regards,<br><strong>The SLRP Team</strong></p>
                  </div>
                  <div class="footer">
                    <p>This is an automated notification. Please do not reply to this email.</p>
                    <p>If you have questions, please contact us on Discord.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });

        console.log("Email sent successfully to:", application.discord, emailResponse);

        // Record the notification in the database
        const { error: notificationError } = await supabaseAdmin
          .from("whitelist_reapplication_notifications")
          .insert({
            user_id: application.user_id,
            application_id: application.id,
          });

        if (notificationError) {
          console.error("Error recording notification:", notificationError);
        } else {
          emailsSent++;
        }
      } catch (error: any) {
        console.error(`Failed to send email for application ${application.id}:`, error);
        emailsFailed++;
      }
    }

    console.log(`Notification process complete. Sent: ${emailsSent}, Failed: ${emailsFailed}`);

    return new Response(
      JSON.stringify({
        message: "Notification process completed",
        emailsSent,
        emailsFailed,
        totalProcessed: rejectedApplications.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-reapplication-notifications function:", error);
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
