import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const RESEND_FROM = Deno.env.get("RESEND_FROM");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!RESEND_API_KEY || !RESEND_FROM) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, action } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === "verify") {
      // Verify the code
      const { code } = await req.json();
      // This is handled in verify-reset-code function
      return new Response(JSON.stringify({ error: "Use verify-reset-code endpoint" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Check if user exists
    const { data: userData } = await supabase.auth.admin.listUsers();
    const userExists = userData?.users?.some(u => u.email === email);

    // Always return success for security (don't reveal if email exists)
    if (!userExists) {
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a code has been sent." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Delete old codes for this email
    await supabase
      .from("password_reset_codes")
      .delete()
      .eq("email", email);

    // Store new code (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await supabase
      .from("password_reset_codes")
      .insert({ email, code, expires_at: expiresAt });

    // Send email with code
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [email],
        subject: "Password Reset Code - SkyLife RP",
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background-color:#0f0f0f;">
            <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
              <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:16px;padding:40px;border:1px solid #333;">
                <div style="text-align:center;margin-bottom:30px;">
                  <h1 style="color:#ffffff;font-size:28px;margin:0;">SkyLife RP</h1>
                  <p style="color:#888;font-size:14px;margin-top:8px;">Password Reset Code</p>
                </div>
                <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:24px;margin-bottom:24px;">
                  <p style="color:#ffffff;font-size:16px;margin:0 0 16px 0;">Hello,</p>
                  <p style="color:#cccccc;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
                    Use the following 6-digit code to reset your password. This code expires in 10 minutes.
                  </p>
                  <div style="text-align:center;margin:20px 0;">
                    <div style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:20px 40px;border-radius:12px;letter-spacing:12px;font-size:36px;font-weight:bold;color:#ffffff;">
                      ${code}
                    </div>
                  </div>
                </div>
                <p style="color:#888888;font-size:12px;line-height:1.5;margin:0;">
                  If you didn't request this code, you can safely ignore this email.
                </p>
                <div style="border-top:1px solid #333;margin-top:30px;padding-top:20px;text-align:center;">
                  <p style="color:#666666;font-size:12px;margin:0;">© 2024 SkyLife RP. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const result = await emailResponse.json();
      console.error("Resend API error:", result);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    await emailResponse.json();

    return new Response(
      JSON.stringify({ success: true, message: "If an account exists, a code has been sent." }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
