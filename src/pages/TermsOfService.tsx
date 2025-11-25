import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerImage from "@/assets/header-rules.jpg";
import { FileText, Scale, Ban, AlertTriangle, Shield, Users } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader
        title="Terms of Service"
        description="Rules and conditions for using SLRP services"
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
                Welcome to SLRP. By accessing or using our GTA 5 roleplay server and related services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </div>

            {/* Acceptance of Terms */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Acceptance of Terms</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>By using SLRP services, you acknowledge that:</p>
                <ul className="space-y-2">
                  <li>• You are at least 16 years of age</li>
                  <li>• You have read and understood these Terms of Service</li>
                  <li>• You agree to comply with all server rules and guidelines</li>
                  <li>• You have a legitimate copy of GTA 5 and FiveM</li>
                  <li>• You will not engage in activities that violate laws or regulations</li>
                </ul>
              </div>
            </div>

            {/* Account and Registration */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Account and Registration</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>To access our server, you must:</p>
                <ul className="space-y-2">
                  <li>• Complete the whitelist application process</li>
                  <li>• Provide accurate and truthful information</li>
                  <li>• Maintain the security of your account credentials</li>
                  <li>• Not share your account with others</li>
                  <li>• Not create multiple accounts without permission</li>
                </ul>
                <p className="mt-4">
                  You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized access.
                </p>
              </div>
            </div>

            {/* User Conduct */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">User Conduct</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>You agree NOT to:</p>
                <ul className="space-y-2">
                  <li>• Use cheats, hacks, exploits, or unauthorized third-party software</li>
                  <li>• Engage in harassment, bullying, or hate speech</li>
                  <li>• Break roleplay (FailRP) or ruin others' experience</li>
                  <li>• Share offensive, illegal, or inappropriate content</li>
                  <li>• Attempt to gain unauthorized access to server systems</li>
                  <li>• Engage in real-money trading (RMT) outside official channels</li>
                  <li>• Impersonate staff members or other players</li>
                  <li>• Use the server for commercial purposes without permission</li>
                  <li>• Exploit bugs or glitches without reporting them</li>
                  <li>• Stream snipe or metagame</li>
                </ul>
              </div>
            </div>

            {/* Server Rules */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <Scale className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Server Rules and Guidelines</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>All players must follow our detailed <a href="/rules" className="text-primary hover:underline">Server Rules</a>, which include:</p>
                <ul className="space-y-2">
                  <li>• Roleplay quality standards</li>
                  <li>• Character creation and development guidelines</li>
                  <li>• Combat and vehicle operation rules</li>
                  <li>• Property and economy regulations</li>
                  <li>• Communication and language requirements</li>
                </ul>
                <p className="mt-4">
                  Server rules may be updated at any time. It is your responsibility to stay informed of rule changes.
                </p>
              </div>
            </div>

            {/* Content and Intellectual Property */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Content and Intellectual Property</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <h3 className="text-lg font-semibold text-foreground">Your Content</h3>
                <p>By uploading content (screenshots, videos, etc.) to our services:</p>
                <ul className="space-y-2">
                  <li>• You grant us a non-exclusive license to use, display, and distribute your content</li>
                  <li>• You represent that you own or have rights to the content</li>
                  <li>• You agree your content does not violate third-party rights</li>
                  <li>• We may remove content that violates these terms</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground mt-4">Our Content</h3>
                <p>All server assets, custom scripts, designs, and logos are our intellectual property. You may not:</p>
                <ul className="space-y-2">
                  <li>• Copy, modify, or redistribute our custom content</li>
                  <li>• Reverse engineer our server scripts or systems</li>
                  <li>• Use our branding without written permission</li>
                </ul>
              </div>
            </div>

            {/* Purchases and Payments */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <Scale className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Purchases and Payments</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>When making purchases in our store:</p>
                <ul className="space-y-2">
                  <li>• All sales are final unless stated otherwise</li>
                  <li>• Prices are subject to change without notice</li>
                  <li>• Virtual items have no real-world monetary value</li>
                  <li>• Refunds are provided only according to our <a href="/refund-policy" className="text-primary hover:underline">Refund Policy</a></li>
                  <li>• Chargebacks will result in immediate ban</li>
                  <li>• You are responsible for all payment information accuracy</li>
                </ul>
                <p className="mt-4 font-semibold text-foreground">
                  SLRP is not affiliated with Rockstar Games or Take-Two Interactive. Purchases do not provide any official Rockstar content.
                </p>
              </div>
            </div>

            {/* Enforcement and Penalties */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Ban className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Enforcement and Penalties</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>Violations of these terms may result in:</p>
                <ul className="space-y-2">
                  <li>• Warnings and verbal/written notices</li>
                  <li>• Temporary kicks from the server</li>
                  <li>• Time-limited bans (hours to days)</li>
                  <li>• Permanent bans from all services</li>
                  <li>• Whitelist removal without refund</li>
                  <li>• Loss of purchased items or privileges</li>
                </ul>
                <p className="mt-4">
                  Staff decisions are final but may be appealed through our <a href="/ban-appeal" className="text-primary hover:underline">Ban Appeal</a> system.
                </p>
              </div>
            </div>

            {/* Disclaimers */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <AlertTriangle className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Disclaimers and Limitations</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>Our services are provided "AS IS" and "AS AVAILABLE":</p>
                <ul className="space-y-2">
                  <li>• We do not guarantee uninterrupted or error-free service</li>
                  <li>• Server downtime may occur for maintenance or technical issues</li>
                  <li>• We are not responsible for loss of in-game progress or items</li>
                  <li>• We reserve the right to modify or discontinue services</li>
                  <li>• We are not liable for actions of other players</li>
                  <li>• Technical issues may result in data loss</li>
                </ul>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Scale className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Limitation of Liability</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>
                  To the maximum extent permitted by law, SLRP and its staff shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use our services. Our total liability is limited to the amount you paid for services in the last 30 days.
                </p>
              </div>
            </div>

            {/* Termination */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <Ban className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Termination</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>We reserve the right to:</p>
                <ul className="space-y-2">
                  <li>• Terminate or suspend your access at any time</li>
                  <li>• Remove your account for violations of these terms</li>
                  <li>• Refuse service to anyone for any reason</li>
                  <li>• Close the server or discontinue operations</li>
                </ul>
                <p className="mt-4">
                  Upon termination, your right to use our services immediately ceases.
                </p>
              </div>
            </div>

            {/* Changes to Terms */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Changes to Terms</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>
                  We may modify these Terms of Service at any time. Changes will be posted on this page with an updated "Last Updated" date. Continued use of our services after changes constitutes acceptance of the modified terms.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Contact Us</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>For questions about these Terms of Service, contact us:</p>
                <ul className="space-y-2">
                  <li>• Through our <a href="/support" className="text-primary hover:underline">Support System</a></li>
                  <li>• Via Discord support tickets</li>
                  <li>• By email at legal@slrp.com</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
