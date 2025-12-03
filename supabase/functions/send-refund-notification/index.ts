import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RefundNotificationRequest {
  chatId: string;
  subject: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT and get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { chatId, subject, userId }: RefundNotificationRequest = await req.json();

    // Verify the userId matches the authenticated user
    if (userId !== user.id) {
      console.error("User attempting to create refund notification for different user");
      return new Response(
        JSON.stringify({ error: "Unauthorized - cannot create notification for another user" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify the chat belongs to the authenticated user
    const { data: chatData, error: chatError } = await supabaseAdmin
      .from("support_chats")
      .select("user_id, subject")
      .eq("id", chatId)
      .single();

    if (chatError || !chatData) {
      console.error("Chat not found:", chatError);
      return new Response(
        JSON.stringify({ error: "Chat not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (chatData.user_id !== user.id) {
      console.error("User attempting to access chat they don't own");
      return new Response(
        JSON.stringify({ error: "Unauthorized - chat does not belong to you" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Processing refund notification for chat:", chatId);

    // Get user profile info
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("discord_username, steam_id")
      .eq("id", userId)
      .single();

    // Get staff emails (billing team and admins)
    const { data: staffMembers } = await supabaseAdmin
      .from("staff_members")
      .select("email, name, department")
      .eq("is_active", true)
      .in("department", ["Administration", "Leadership"])
      .not("email", "is", null);

    // Send email notifications to staff
    if (staffMembers && staffMembers.length > 0) {
      const staffEmails = staffMembers.map(staff => staff.email).filter(Boolean);
      
      if (staffEmails.length > 0) {
        await resend.emails.send({
          from: "SLRP Support <support@slrp.com>",
          to: staffEmails,
          subject: "🔔 New Refund Request - Priority",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">New Refund Request</h1>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
                  <h2 style="margin-top: 0; color: #333;">Request Details</h2>
                  <p><strong>Subject:</strong> ${subject}</p>
                  <p><strong>Chat ID:</strong> ${chatId}</p>
                  <p><strong>Priority:</strong> <span style="color: #e74c3c; font-weight: bold;">HIGH</span></p>
                  <p><strong>Discord:</strong> ${profile?.discord_username || "Not provided"}</p>
                  <p><strong>Steam ID:</strong> ${profile?.steam_id || "Not provided"}</p>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                  <p style="margin: 0; color: #856404;"><strong>⏰ Action Required:</strong> This is a billing-related request and requires prompt attention. Target response time: 2-4 hours.</p>
                </div>
                
                <div style="text-align: center; margin-top: 25px;">
                  <a href="${Deno.env.get("SUPABASE_URL")?.replace("/rest/v1", "")}/admin/support-chat" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                    View Chat Now
                  </a>
                </div>
                
                <p style="color: #666; font-size: 12px; text-align: center; margin-top: 25px;">
                  SLRP Support System - Automated Notification
                </p>
              </div>
            </div>
          `,
        });

        console.log("Email sent to staff:", staffEmails);
      }
    }

    // Send auto-response message to user
    const autoResponseMessage = `Thank you for contacting SLRP Billing Support! 🎫

**Your Refund Request Details:**
━━━━━━━━━━━━━━━━━━━━━━━━━
📋 **Status:** Under Review
⏱️ **Estimated Response Time:** 2-4 hours
📅 **Target Resolution:** 2-5 business days

**What Happens Next:**
━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ Our billing team will review your request within 2-4 hours
2️⃣ We'll verify your transaction details and eligibility
3️⃣ You'll receive a response with our decision and next steps

**To Help Us Process Your Request Faster, Please Provide:**
━━━━━━━━━━━━━━━━━━━━━━━━━
• 🧾 **Transaction ID or Receipt**
• 📅 **Date and time of purchase**
• 💳 **Payment method used**
• 📝 **Detailed reason for refund request**
• 📸 **Screenshots or proof of issue (if applicable)**

**Important Reminders:**
━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Refund requests must meet our [Refund Policy](${Deno.env.get("SUPABASE_URL")?.replace("/rest/v1", "")}/refund-policy) criteria
⚠️ Purchases over 30 days old are not eligible
⚠️ Account bans void all refund eligibility
⚠️ Do NOT file a chargeback before contacting us (results in permanent ban)

**Need Help?**
━━━━━━━━━━━━━━━━━━━━━━━━━
Reply to this chat with any additional information or questions. Our billing team is here to help!

Thank you for your patience,
**SLRP Billing Team** 💙`;

    const { error: messageError } = await supabaseAdmin
      .from("support_messages")
      .insert({
        chat_id: chatId,
        user_id: userId,
        message: autoResponseMessage,
        is_staff: true,
      });

    if (messageError) {
      console.error("Error creating auto-response:", messageError);
    } else {
      console.log("Auto-response message created successfully");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Refund notification sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-refund-notification:", error);
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
