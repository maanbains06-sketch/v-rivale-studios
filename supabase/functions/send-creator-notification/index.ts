import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreatorNotificationRequest {
  applicantName: string;
  discordUsername: string;
  email?: string;
  status: "approved" | "rejected";
  adminNotes?: string;
  channelUrl: string;
  platform: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Creator notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      applicantName, 
      discordUsername, 
      email, 
      status, 
      adminNotes,
      channelUrl,
      platform 
    }: CreatorNotificationRequest = await req.json();

    console.log(`Processing ${status} notification for ${applicantName} (${discordUsername})`);

    // If no email provided, we can't send notification
    if (!email) {
      console.log("No email provided, skipping email notification");
      return new Response(
        JSON.stringify({ success: true, message: "No email provided, notification skipped" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const isApproved = status === "approved";
    const subject = isApproved 
      ? "🎉 Welcome to the SLRP Creator Program!" 
      : "SLRP Creator Program Application Update";

    const approvedHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #8b5cf6; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #8b5cf6, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .badge { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
            h1 { color: #8b5cf6; margin-bottom: 20px; }
            p { line-height: 1.8; color: #d1d5db; }
            .perks { background: rgba(139, 92, 246, 0.1); border-radius: 12px; padding: 20px; margin: 20px 0; }
            .perks h3 { color: #a855f7; margin-bottom: 15px; }
            .perks ul { list-style: none; padding: 0; }
            .perks li { padding: 8px 0; color: #d1d5db; }
            .perks li:before { content: "⭐ "; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #374151; color: #9ca3af; font-size: 14px; }
            .btn { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #a855f7); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SLRP</div>
              <div class="badge">✅ APPROVED</div>
            </div>
            <h1>Congratulations, ${applicantName}! 🎉</h1>
            <p>We are thrilled to welcome you to the <strong>SLRP Creator Program</strong>!</p>
            <p>Your application has been reviewed and approved. Your ${platform} channel demonstrates the quality and dedication we look for in our creators.</p>
            
            <div class="perks">
              <h3>Your Creator Perks:</h3>
              <ul>
                <li>Priority queue access during peak hours</li>
                <li>Special Creator role on Discord</li>
                <li>Support for custom RP storylines and scenes</li>
                <li>Promotion on server socials and community platforms</li>
                <li>Dedicated staff support for content-related help</li>
                <li>Early previews of upcoming server updates</li>
                <li>Access to creator-only events and projects</li>
              </ul>
            </div>
            
            ${adminNotes ? `<p><strong>Note from our team:</strong> ${adminNotes}</p>` : ''}
            
            <p>Join our Discord server to claim your Creator role and connect with other content creators!</p>
            
            <div style="text-align: center;">
              <a href="https://discord.gg/slrp" class="btn">Join Discord</a>
            </div>
            
            <div class="footer">
              <p>Welcome to the SLRP Creator family!</p>
              <p>© ${new Date().getFullYear()} SLRP - All rights reserved</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const rejectedHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #6b7280; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #8b5cf6, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            h1 { color: #f59e0b; margin-bottom: 20px; }
            p { line-height: 1.8; color: #d1d5db; }
            .info-box { background: rgba(245, 158, 11, 0.1); border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #374151; color: #9ca3af; font-size: 14px; }
            .btn { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #a855f7); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SLRP</div>
            </div>
            <h1>Application Update</h1>
            <p>Dear ${applicantName},</p>
            <p>Thank you for your interest in the SLRP Creator Program. After careful review of your application, we have decided not to move forward at this time.</p>
            
            ${adminNotes ? `
            <div class="info-box">
              <strong>Feedback from our team:</strong>
              <p>${adminNotes}</p>
            </div>
            ` : ''}
            
            <p>This decision is not final! We encourage you to:</p>
            <ul style="color: #d1d5db; line-height: 2;">
              <li>Continue creating content and building your audience</li>
              <li>Engage with the SLRP community</li>
              <li>Reapply in the future when you meet our requirements</li>
            </ul>
            
            <p>We appreciate your interest in SLRP and hope to see you on our server!</p>
            
            <div class="footer">
              <p>Thank you for your interest in SLRP</p>
              <p>© ${new Date().getFullYear()} SLRP - All rights reserved</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SLRP Creator Program <onboarding@resend.dev>",
        to: [email],
        subject: subject,
        html: isApproved ? approvedHtml : rejectedHtml,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailResponse: emailData }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-creator-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
