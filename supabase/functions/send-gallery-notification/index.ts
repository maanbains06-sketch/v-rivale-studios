import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  submissionId: string;
  status: "approved" | "rejected";
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { submissionId, status, rejectionReason }: NotificationRequest = await req.json();

    // Fetch submission details
    const { data: submission, error: submissionError } = await supabase
      .from("gallery_submissions")
      .select(`
        id,
        title,
        user_id,
        category
      `)
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      throw new Error("Submission not found");
    }

    // Fetch user email
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(
      submission.user_id
    );

    if (userError || !user?.email) {
      throw new Error("User not found or no email available");
    }

    // Send email based on status
    let emailHtml = "";
    let subject = "";

    if (status === "approved") {
      subject = "🎉 Your Gallery Submission Has Been Approved!";
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Submission Approved! 🎉</h1>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Great news! Your gallery submission has been approved and is now live in the SLRP community gallery.
            </p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #667eea; margin-top: 0; font-size: 18px;">Submission Details</h2>
              <p style="margin: 5px 0;"><strong>Title:</strong> ${submission.title}</p>
              <p style="margin: 5px 0;"><strong>Category:</strong> ${submission.category}</p>
            </div>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Thank you for contributing to our community! Your content helps make SLRP an even better place.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${supabaseUrl.replace('https://', 'https://').split('.')[0].replace('https://', '')}.lovable.app/gallery" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View in Gallery
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #999; text-align: center; margin: 0;">
              SLRP - Los Santos Life Roleplay
            </p>
          </div>
        </div>
      `;
    } else {
      subject = "Update on Your Gallery Submission";
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Submission Update</h1>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Thank you for your gallery submission. Unfortunately, we're unable to approve it at this time.
            </p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #f5576c; margin-top: 0; font-size: 18px;">Submission Details</h2>
              <p style="margin: 5px 0;"><strong>Title:</strong> ${submission.title}</p>
              <p style="margin: 5px 0;"><strong>Category:</strong> ${submission.category}</p>
            </div>
            
            ${rejectionReason ? `
              <div style="background-color: #fff5f5; border-left: 4px solid #f5576c; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #333;"><strong>Reason:</strong></p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">${rejectionReason}</p>
              </div>
            ` : ''}
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              You're welcome to submit new content that follows our community guidelines. We appreciate your understanding and look forward to your future contributions!
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${supabaseUrl.replace('https://', 'https://').split('.')[0].replace('https://', '')}.lovable.app/gallery" 
                 style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Submit New Content
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #999; text-align: center; margin: 0;">
              SLRP - Los Santos Life Roleplay
            </p>
          </div>
        </div>
      `;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SLRP Gallery <onboarding@resend.dev>",
        to: [user.email],
        subject: subject,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-gallery-notification function:", error);
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
