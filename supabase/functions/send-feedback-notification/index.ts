import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FeedbackNotificationRequest {
  player_name: string;
  player_role?: string;
  testimonial: string;
  rating: number;
}

// HTML escape function to prevent XSS/injection attacks
const escapeHtml = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Feedback notification function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT - the function now requires authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Invalid token:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { player_name, player_role, testimonial, rating }: FeedbackNotificationRequest = await req.json();
    
    // Validate and sanitize inputs
    const safeName = escapeHtml(player_name?.substring(0, 50) || 'Anonymous');
    const safeRole = player_role ? escapeHtml(player_role.substring(0, 50)) : '';
    const safeTestimonial = escapeHtml(testimonial?.substring(0, 500) || '');
    const safeRating = Math.min(5, Math.max(1, Number(rating) || 5));
    
    console.log("Received feedback from:", safeName);

    // Get owner email from staff_members
    const { data: ownerSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "owner_discord_id")
      .single();

    if (!ownerSetting?.value) {
      console.log("Owner Discord ID not configured");
      return new Response(
        JSON.stringify({ success: true, message: "No owner configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get owner's email from staff_members
    const { data: ownerStaff } = await supabase
      .from("staff_members")
      .select("email")
      .eq("discord_id", ownerSetting.value)
      .single();

    if (!ownerStaff?.email) {
      console.log("Owner email not found");
      return new Response(
        JSON.stringify({ success: true, message: "No owner email found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending notification to owner:", ownerStaff.email);

    // Generate star rating HTML
    const starsHtml = Array(5).fill(0).map((_, i) => 
      `<span style="color: ${i < safeRating ? '#FFD700' : '#ccc'}; font-size: 24px;">★</span>`
    ).join('');

    // Send email notification with sanitized content
    const emailResponse = await resend.emails.send({
      from: "SLRP Feedback <onboarding@resend.dev>",
      to: [ownerStaff.email],
      subject: `New Community Feedback from ${safeName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #1a1a2e; color: #ffffff; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 30px; border: 1px solid #ff6b35; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #ff6b35; margin: 0; font-size: 28px; }
            .content { background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; margin: 20px 0; }
            .label { color: #888; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
            .value { color: #fff; font-size: 16px; margin-bottom: 15px; }
            .rating { text-align: center; margin: 20px 0; }
            .testimonial { font-style: italic; color: #ddd; font-size: 16px; line-height: 1.6; border-left: 3px solid #ff6b35; padding-left: 15px; }
            .cta { text-align: center; margin-top: 30px; }
            .button { display: inline-block; background: linear-gradient(135deg, #ff6b35 0%, #e84393 100%); color: #fff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎮 New Community Feedback</h1>
              <p style="color: #888;">Requires your review</p>
            </div>
            
            <div class="content">
              <div class="label">Player Name</div>
              <div class="value">${safeName}</div>
              
              ${safeRole ? `
              <div class="label">Role</div>
              <div class="value">${safeRole}</div>
              ` : ''}
              
              <div class="label">Rating</div>
              <div class="rating">${starsHtml}</div>
              
              <div class="label">Feedback</div>
              <div class="testimonial">"${safeTestimonial}"</div>
            </div>
            
            <div class="cta">
              <p style="color: #888; margin-bottom: 15px;">Review and approve this feedback in your Owner Panel</p>
              <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/owner" class="button">Review Feedback</a>
            </div>
            
            <div class="footer">
              <p>Skylife Roleplay India • Community Feedback System</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-feedback-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
