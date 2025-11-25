import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PromoCodeEmailRequest {
  userEmail: string;
  userName: string;
  promoCode: string;
  discountPercentage: number;
  expiresAt: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, promoCode, discountPercentage, expiresAt }: PromoCodeEmailRequest = await req.json();

    console.log("Sending promo code email to:", userEmail);

    const expiryDate = new Date(expiresAt);
    const formattedExpiry = expiryDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .promo-code { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 2px; font-family: 'Courier New', monospace; }
          .discount { font-size: 24px; color: #764ba2; margin: 10px 0; }
          .button { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 Congratulations ${userName || 'there'}!</h1>
            <p>You've been referred to SLRP and earned a special discount!</p>
          </div>
          <div class="content">
            <p>Great news! Someone thought you'd love SLRP and shared their referral link with you.</p>
            
            <div class="promo-code">
              <div class="discount">${discountPercentage}% OFF</div>
              <p style="margin: 5px 0; color: #666;">Your exclusive promo code:</p>
              <div class="code">${promoCode}</div>
              <p style="margin-top: 15px; color: #666; font-size: 14px;">
                Valid until ${formattedExpiry}
              </p>
            </div>

            <h3>How to Use Your Code:</h3>
            <ol>
              <li>Visit our store and add items to your cart</li>
              <li>Proceed to checkout</li>
              <li>Enter your promo code in the "Promo Code" field</li>
              <li>Click "Apply" and watch your discount appear!</li>
            </ol>

            <div style="text-align: center;">
              <a href="https://slrp.lovable.app/store" class="button">
                Shop Now
              </a>
            </div>

            <div class="warning">
              <strong>⏰ Important:</strong> This promo code can only be used once and expires on ${formattedExpiry}. Don't miss out!
            </div>

            <p style="margin-top: 30px;">
              Want to earn your own rewards? Share SLRP with your friends and get 20% discount for every successful referral!
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message from SLRP Roleplay Server</p>
            <p>© ${new Date().getFullYear()} SLRP. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SLRP <onboarding@resend.dev>",
        to: [userEmail],
        subject: `🎉 You've Received a ${discountPercentage}% Discount Code!`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Promo code email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, data: emailData }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending promo code email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
