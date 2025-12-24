import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT = 5; // requests per minute per IP
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  
  if (!entry || (now - entry.windowStart) > RATE_WINDOW_MS) {
    rateLimitMap.set(identifier, { count: 1, windowStart: now });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Email validation
function isValidEmail(email: string): boolean {
  return typeof email === 'string' && 
         /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && 
         email.length <= 254;
}

// Sanitize text for HTML
function sanitizeForHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface PurchaseItem {
  name: string;
  price: number;
  quantity: number;
}

interface PurchaseConfirmationRequest {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  items: PurchaseItem[];
  total: number;
  currency: string;
}

function validateItem(item: unknown): item is PurchaseItem {
  if (typeof item !== 'object' || item === null) return false;
  const i = item as Record<string, unknown>;
  return (
    typeof i.name === 'string' && i.name.length > 0 && i.name.length <= 200 &&
    typeof i.price === 'number' && i.price >= 0 && i.price <= 1000000 &&
    typeof i.quantity === 'number' && i.quantity > 0 && i.quantity <= 100
  );
}

function validateRequest(body: unknown): { valid: boolean; error?: string; data?: PurchaseConfirmationRequest } {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Invalid request' };
  }

  const b = body as Record<string, unknown>;

  // Validate email
  if (!isValidEmail(b.customerEmail as string)) {
    return { valid: false, error: 'Invalid email address' };
  }

  // Validate customer name
  if (typeof b.customerName !== 'string' || b.customerName.length === 0 || b.customerName.length > 100) {
    return { valid: false, error: 'Invalid customer name' };
  }

  // Validate order number
  if (typeof b.orderNumber !== 'string' || b.orderNumber.length === 0 || b.orderNumber.length > 50) {
    return { valid: false, error: 'Invalid order number' };
  }

  // Validate items
  if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > 50) {
    return { valid: false, error: 'Invalid items' };
  }

  for (const item of b.items) {
    if (!validateItem(item)) {
      return { valid: false, error: 'Invalid item data' };
    }
  }

  // Validate total
  if (typeof b.total !== 'number' || b.total < 0 || b.total > 10000000) {
    return { valid: false, error: 'Invalid total' };
  }

  // Validate currency
  const validCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED'];
  if (typeof b.currency !== 'string' || !validCurrencies.includes(b.currency)) {
    return { valid: false, error: 'Invalid currency' };
  }

  return {
    valid: true,
    data: {
      customerEmail: b.customerEmail as string,
      customerName: b.customerName as string,
      orderNumber: b.orderNumber as string,
      items: b.items as PurchaseItem[],
      total: b.total as number,
      currency: b.currency as string,
    }
  };
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
  return `${symbol}${price.toFixed(2)}`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client identifier for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    
    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      console.warn(`Rate limit exceeded for purchase confirmation from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse and validate request
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const validation = validateRequest(body);
    if (!validation.valid || !validation.data) {
      console.warn("Validation failed:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error || "Invalid request" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { customerEmail, customerName, orderNumber, items, total, currency } = validation.data;

    console.log("Sending purchase confirmation to:", customerEmail);

    // Sanitize all user inputs for HTML
    const safeCustomerName = sanitizeForHtml(customerName);
    const safeOrderNumber = sanitizeForHtml(orderNumber);

    const itemsList = items
      .map(
        (item) =>
          `<tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${sanitizeForHtml(item.name)}</td>
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
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${safeCustomerName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">Thank you for your purchase! Your order has been successfully confirmed.</p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Order Number</p>
              <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; font-family: 'Courier New', monospace;">${safeOrderNumber}</p>
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
      subject: `Order Confirmation - ${safeOrderNumber}`,
      html: emailHtml,
    });

    console.log("Confirmation email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error in send-purchase-confirmation function:", error);
    return new Response(JSON.stringify({ error: "Unable to send confirmation" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
