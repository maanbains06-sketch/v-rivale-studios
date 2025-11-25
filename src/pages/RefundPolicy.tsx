import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerImage from "@/assets/header-store.jpg";
import { DollarSign, Clock, CheckCircle, XCircle, AlertCircle, CreditCard } from "lucide-react";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader
        title="Refund Policy"
        description="Our guidelines for refunds and purchase disputes"
        backgroundImage={headerImage}
      />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="glass-effect rounded-3xl p-8 md:p-12 space-y-8">
            {/* Introduction */}
            <div>
              <p className="text-muted-foreground leading-relaxed">
                Last Updated: January 2025
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                This Refund Policy outlines the conditions under which refunds may be issued for purchases made on SLRP. Please read this policy carefully before making any purchases.
              </p>
            </div>

            {/* General Policy */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">General Refund Policy</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p className="font-semibold text-foreground">All sales are generally final.</p>
                <p>
                  Due to the digital nature of our services and virtual items, we do not typically offer refunds once a purchase has been completed and the items/services have been delivered to your account.
                </p>
                <p>
                  However, we understand that exceptional circumstances may arise. This policy outlines specific situations where refunds may be considered.
                </p>
              </div>
            </div>

            {/* Eligible Refunds */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <CheckCircle className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Eligible for Refund</h2>
              </div>
              
              <div className="space-y-4 ml-12 text-muted-foreground">
                <p>Refunds may be issued in the following circumstances:</p>
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Technical Issues</h3>
                  <ul className="space-y-2">
                    <li>• Purchase was charged but items were never delivered</li>
                    <li>• Duplicate charges for the same transaction</li>
                    <li>• System error resulted in incorrect item delivery</li>
                    <li>• Payment processed but server access was not granted</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Service Unavailability</h3>
                  <ul className="space-y-2">
                    <li>• Purchased items became unavailable due to server closure</li>
                    <li>• Major service disruption preventing use of purchased items</li>
                    <li>• Whitelist access purchased but server permanently shut down</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Unauthorized Purchases</h3>
                  <ul className="space-y-2">
                    <li>• Fraudulent transactions made without account owner consent</li>
                    <li>• Purchases made by minors without parental authorization</li>
                  </ul>
                  <p className="mt-2 text-sm">
                    (Must be reported within 48 hours with supporting evidence)
                  </p>
                </div>
              </div>
            </div>

            {/* Not Eligible */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-destructive/10">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">NOT Eligible for Refund</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>Refunds will NOT be issued for:</p>
                <ul className="space-y-2">
                  <li>• Change of mind after purchase completion</li>
                  <li>• Account bans or suspensions (permanent or temporary)</li>
                  <li>• Rule violations resulting in loss of access</li>
                  <li>• In-game losses due to roleplay situations</li>
                  <li>• Items lost due to player actions or decisions</li>
                  <li>• Purchases made over 30 days ago</li>
                  <li>• Used or consumed virtual items</li>
                  <li>• Dissatisfaction with in-game balance or gameplay</li>
                  <li>• Whitelist rejection after purchase</li>
                  <li>• Server lag or minor technical issues</li>
                  <li>• Voluntary account deletion</li>
                  <li>• Disagreement with staff decisions</li>
                </ul>
                <p className="mt-4 font-semibold text-foreground">
                  Important: If you are banned for violating server rules, all purchases are forfeited and no refunds will be provided.
                </p>
              </div>
            </div>

            {/* Refund Timeframe */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Refund Request Timeframe</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>Refund requests must be submitted within specific timeframes:</p>
                <ul className="space-y-2">
                  <li>• <strong>Technical Issues:</strong> Within 7 days of purchase</li>
                  <li>• <strong>Non-delivery of Items:</strong> Within 48 hours of purchase</li>
                  <li>• <strong>Unauthorized Purchases:</strong> Within 48 hours of transaction</li>
                  <li>• <strong>Duplicate Charges:</strong> Within 14 days of transaction</li>
                </ul>
                <p className="mt-4">
                  Requests submitted after these periods will not be considered except in exceptional circumstances.
                </p>
              </div>
            </div>

            {/* How to Request */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <AlertCircle className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">How to Request a Refund</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>To request a refund:</p>
                <ol className="space-y-2 list-decimal list-inside">
                  <li>Open a support ticket through our <a href="/support" className="text-primary hover:underline">Support System</a></li>
                  <li>Select "Billing & Refunds" as the category</li>
                  <li>Provide the following information:
                    <ul className="ml-6 mt-2 space-y-1">
                      <li>- Transaction ID and receipt</li>
                      <li>- Date and time of purchase</li>
                      <li>- Items or services purchased</li>
                      <li>- Detailed explanation of the issue</li>
                      <li>- Supporting evidence (screenshots, etc.)</li>
                    </ul>
                  </li>
                  <li>Wait for our billing team to review your request</li>
                </ol>
                <p className="mt-4">
                  Response time: 2-5 business days. Complex cases may take longer.
                </p>
              </div>
            </div>

            {/* Processing */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Refund Processing</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>If your refund is approved:</p>
                <ul className="space-y-2">
                  <li>• Refund will be issued to the original payment method</li>
                  <li>• Processing time: 5-10 business days</li>
                  <li>• You will receive a confirmation email</li>
                  <li>• Purchased items will be removed from your account</li>
                  <li>• Bank processing times may vary</li>
                </ul>
                <p className="mt-4 font-semibold text-foreground">
                  Partial Refunds: In some cases, partial refunds may be offered instead of full refunds.
                </p>
              </div>
            </div>

            {/* Chargebacks */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-destructive/10">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Chargebacks and Disputes</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p className="font-semibold text-foreground">IMPORTANT: Do not file a chargeback before contacting us!</p>
                <p>If you file a chargeback with your bank or payment provider:</p>
                <ul className="space-y-2">
                  <li>• Your account will be immediately and permanently banned</li>
                  <li>• All purchased items and privileges will be removed</li>
                  <li>• You will be banned from all future purchases</li>
                  <li>• Your whitelist status will be permanently revoked</li>
                  <li>• No appeals will be accepted</li>
                </ul>
                <p className="mt-4">
                  We strongly encourage you to contact our support team first to resolve any billing issues.
                </p>
              </div>
            </div>

            {/* Store Credit */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <DollarSign className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Store Credit Alternative</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>In certain situations, we may offer store credit instead of a monetary refund:</p>
                <ul className="space-y-2">
                  <li>• Store credit can be used for any future purchases</li>
                  <li>• Does not expire unless account is closed</li>
                  <li>• May be offered as an alternative resolution</li>
                  <li>• Can be combined with other payment methods</li>
                </ul>
              </div>
            </div>

            {/* Special Circumstances */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <AlertCircle className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Special Circumstances</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>We reserve the right to:</p>
                <ul className="space-y-2">
                  <li>• Make exceptions to this policy on a case-by-case basis</li>
                  <li>• Offer alternative compensation instead of refunds</li>
                  <li>• Modify or update this policy at any time</li>
                  <li>• Refuse refund requests that don't meet our criteria</li>
                </ul>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <CreditCard className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Contact Us</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>For billing inquiries or refund requests:</p>
                <ul className="space-y-2">
                  <li>• Submit a ticket through our <a href="/support" className="text-primary hover:underline">Support System</a></li>
                  <li>• Email us at billing@slrp.com</li>
                  <li>• Contact via Discord support (Billing category)</li>
                </ul>
                <p className="mt-4 text-sm">
                  Please allow 2-5 business days for a response to refund requests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
