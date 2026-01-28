import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerImage from "@/assets/header-refund.jpg";
import { XCircle, AlertTriangle, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const RefundPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader
        title="Refund Policy"
        description="Important information about our no-refund policy"
        backgroundImage={headerImage}
        pageKey="support"
      />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Main No Refund Banner */}
          <div className="glass-effect rounded-3xl p-8 md:p-12 border-2 border-destructive/30 bg-destructive/5 mb-8">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="p-4 rounded-full bg-destructive/20 mb-4">
                <XCircle className="w-12 h-12 text-destructive" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-destructive mb-4">
                NO REFUND POLICY
              </h1>
              <p className="text-xl text-foreground font-semibold mb-2">
                All Sales Are Final
              </p>
              <p className="text-muted-foreground max-w-2xl">
                Once a purchase is completed on our store, it is considered final and non-refundable. 
                Please read this policy carefully before making any purchases.
              </p>
            </div>

            <div className="border-t border-destructive/20 pt-6">
              <p className="text-sm text-muted-foreground text-center italic">
                Last Updated: January 2025
              </p>
            </div>
          </div>

          <div className="glass-effect rounded-3xl p-8 md:p-12 space-y-8">
            {/* Policy Statement */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-destructive/10">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Policy Statement</h2>
              </div>
              
              <div className="space-y-4 ml-12 text-muted-foreground">
                <p className="text-lg font-semibold text-foreground">
                  We do not offer refunds under any circumstances once a purchase has been completed.
                </p>
                <p>
                  Due to the digital nature of our products and services, all transactions are final 
                  and non-reversible. By completing a purchase on our platform, you acknowledge and 
                  agree to this no-refund policy.
                </p>
                <p>
                  This policy applies to all items, packages, subscriptions, and services available 
                  through our Tebex store and any other payment methods we accept.
                </p>
              </div>
            </div>

            {/* What This Means */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">What This Means</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>By making a purchase, you understand that:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>No refunds will be issued for any reason</li>
                  <li>No exchanges or transfers of purchased items are permitted</li>
                  <li>Change of mind is not a valid reason for a refund request</li>
                  <li>Account bans or suspensions do not entitle you to a refund</li>
                  <li>Server issues or downtime do not qualify for refunds</li>
                  <li>Dissatisfaction with purchased items does not warrant a refund</li>
                  <li>Technical issues on your end are not grounds for refunds</li>
                  <li>Purchases made by mistake cannot be refunded</li>
                </ul>
              </div>
            </div>

            {/* Chargebacks Warning */}
            <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/30">
              <h3 className="text-xl font-bold text-destructive mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Chargeback Warning
              </h3>
              <div className="space-y-3 text-muted-foreground">
                <p className="font-semibold text-foreground">
                  Do NOT file a chargeback or payment dispute!
                </p>
                <p>
                  If you file a chargeback or dispute with your bank, payment provider, or PayPal:
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Your account will be immediately and permanently banned</li>
                  <li>All purchased items and privileges will be revoked</li>
                  <li>You will be blacklisted from all future purchases</li>
                  <li>Your whitelist status will be permanently revoked</li>
                  <li>No appeals will be accepted</li>
                  <li>Legal action may be pursued for fraudulent chargebacks</li>
                </ul>
              </div>
            </div>

            {/* Before You Purchase */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <Shield className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Before You Purchase</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>We recommend that you:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Carefully read all product descriptions before purchasing</li>
                  <li>Review server rules and guidelines</li>
                  <li>Ensure you understand what you are buying</li>
                  <li>Verify your account information is correct</li>
                  <li>Ask questions in our Discord if you're unsure about anything</li>
                  <li>Only purchase if you fully accept this no-refund policy</li>
                </ul>
              </div>
            </div>

            {/* Contact Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Questions?</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>
                  If you have any questions about our no-refund policy or need clarification 
                  before making a purchase, please contact us:
                </p>
                <ul className="space-y-2">
                  <li>• Open a ticket in our Discord server</li>
                  <li>• Use our <button onClick={() => navigate("/support")} className="text-primary hover:underline">Support System</button></li>
                </ul>
                <p className="mt-4 text-sm">
                  We are happy to answer any questions BEFORE you make a purchase, but we cannot 
                  issue refunds after a transaction is complete.
                </p>
              </div>
            </div>

            {/* Final Notice */}
            <div className="p-6 rounded-2xl bg-muted/50 border border-border/50 text-center">
              <p className="text-foreground font-semibold mb-2">
                By completing any purchase on our platform, you confirm that you have read, 
                understood, and agree to this No Refund Policy.
              </p>
              <p className="text-sm text-muted-foreground">
                This policy is final and applies to all users without exception.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-8 text-center">
            <Button
              onClick={() => navigate("/support")}
              variant="outline"
              className="glass-effect"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
