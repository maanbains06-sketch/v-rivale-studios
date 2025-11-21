import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchaseConfirmationRequest {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  currency: string;
}

const formatPrice = (price: number, currency: string): string => {
  const symbols: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    AUD: "A$",
    CAD: "C$",
    SGD: "S$",
    AED: "AED",
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${price}`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customerEmail,
      customerName,
      orderNumber,
      items,
      total,
      currency,
    }: PurchaseConfirmationRequest = await req.json();

    console.log("Sending purchase confirmation to:", customerEmail);

    const itemsList = items
      .map(
        (item) =>
          `<tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.price * item.quantity, currency)}</td>
          </tr>`
      )
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${customerName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">Thank you for your purchase! Your order has been successfully confirmed.</p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Order Number</p>
              <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; font-family: 'Courier New', monospace;">${orderNumber}</p>
            </div>
            
            <h2 style="font-size: 20px; margin-top: 30px; margin-bottom: 15px; color: #111827;">Order Summary</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
                <tr>
                  <td colspan="2" style="padding: 16px; text-align: right; font-weight: bold; font-size: 16px;">Total:</td>
                  <td style="padding: 16px; text-align: right; font-weight: bold; font-size: 18px; color: #667eea;">${formatPrice(total, currency)}</td>
                </tr>
              </tbody>
            </table>
            
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px;">What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
                <li>Our team will process your order within 24-48 hours</li>
                <li>You will be contacted on Discord for verification</li>
                <li>Keep this email for your records</li>
              </ul>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              If you have any questions, please reach out to us through our support channel on Discord.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
              © 2024 SLRP. All rights reserved.<br>
              This is an automated email, please do not reply directly to this message.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "SLRP Store <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `Order Confirmation - ${orderNumber}`,
      html: emailHtml,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-purchase-confirmation function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
