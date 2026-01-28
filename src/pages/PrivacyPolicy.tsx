import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerImage from "@/assets/header-rules.jpg";
import { Shield, Eye, Lock, Database, Cookie, UserCheck } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader
        title="Privacy Policy"
        description="How we collect, use, and protect your information"
        backgroundImage={headerImage}
        pageKey="rules"
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
                SLRP ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our GTA 5 roleplay server and associated services.
              </p>
            </div>

            {/* Information We Collect */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Information We Collect</h2>
              </div>
              
              <div className="space-y-4 ml-12">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Personal Information</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Discord username and ID</li>
                    <li>• Steam ID and profile information</li>
                    <li>• Email address (if provided)</li>
                    <li>• Age verification information</li>
                    <li>• In-game character names and information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Gameplay Data</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• In-game activities and interactions</li>
                    <li>• Chat logs and voice communications</li>
                    <li>• Server session data and playtime</li>
                    <li>• Transaction history (in-game purchases)</li>
                    <li>• Screenshots and videos uploaded to our gallery</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Technical Information</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• IP address and connection data</li>
                    <li>• Device and hardware information</li>
                    <li>• Browser type and version</li>
                    <li>• Operating system information</li>
                    <li>• Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We Use Your Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <UserCheck className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">How We Use Your Information</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>We use the collected information for the following purposes:</p>
                <ul className="space-y-2">
                  <li>• To provide and maintain our roleplay server services</li>
                  <li>• To process whitelist applications and verify eligibility</li>
                  <li>• To enforce server rules and prevent rule violations</li>
                  <li>• To improve server performance and user experience</li>
                  <li>• To process store purchases and manage transactions</li>
                  <li>• To communicate important updates and announcements</li>
                  <li>• To respond to support requests and resolve issues</li>
                  <li>• To detect and prevent cheating, hacking, or exploits</li>
                  <li>• To analyze server statistics and player behavior</li>
                </ul>
              </div>
            </div>

            {/* Data Sharing */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Information Sharing and Disclosure</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
                <ul className="space-y-2">
                  <li>• <strong>With Server Staff:</strong> To manage the server and enforce rules</li>
                  <li>• <strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li>• <strong>Service Providers:</strong> With trusted third-party services (Discord, payment processors)</li>
                  <li>• <strong>With Your Consent:</strong> When you explicitly authorize information sharing</li>
                </ul>
              </div>
            </div>

            {/* Data Security */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <Lock className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Data Security</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>We implement appropriate technical and organizational measures to protect your information, including:</p>
                <ul className="space-y-2">
                  <li>• Encrypted data transmission (SSL/TLS)</li>
                  <li>• Secure server infrastructure with regular backups</li>
                  <li>• Access controls and authentication systems</li>
                  <li>• Regular security audits and vulnerability assessments</li>
                  <li>• Staff training on data protection practices</li>
                </ul>
                <p className="mt-4">
                  However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                </p>
              </div>
            </div>

            {/* Data Retention */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Data Retention</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>We retain your information for as long as necessary to:</p>
                <ul className="space-y-2">
                  <li>• Provide our services and maintain your account</li>
                  <li>• Comply with legal obligations and resolve disputes</li>
                  <li>• Enforce our Terms of Service and server rules</li>
                  <li>• Maintain server security and prevent rule violations</li>
                </ul>
                <p className="mt-4">
                  Ban records and rule violation data may be retained indefinitely for security purposes.
                </p>
              </div>
            </div>

            {/* Cookies */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <Cookie className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Cookies and Tracking</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>We use cookies and similar technologies to:</p>
                <ul className="space-y-2">
                  <li>• Remember your preferences and settings</li>
                  <li>• Authenticate your session and maintain login status</li>
                  <li>• Analyze website traffic and user behavior</li>
                  <li>• Improve website functionality and user experience</li>
                </ul>
                <p className="mt-4">
                  You can control cookie preferences through your browser settings, but this may affect website functionality.
                </p>
              </div>
            </div>

            {/* Your Rights */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Your Privacy Rights</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>You have the right to:</p>
                <ul className="space-y-2">
                  <li>• Access your personal information we hold</li>
                  <li>• Request correction of inaccurate data</li>
                  <li>• Request deletion of your data (subject to legal requirements)</li>
                  <li>• Opt-out of marketing communications</li>
                  <li>• Withdraw consent for data processing (where applicable)</li>
                  <li>• Lodge a complaint with data protection authorities</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, please contact us through our support system.
                </p>
              </div>
            </div>

            {/* Children's Privacy */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <UserCheck className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Children's Privacy</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>
                  Our services are not intended for users under 16 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                </p>
              </div>
            </div>

            {/* Changes to Policy */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Changes to This Policy</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on our website and updating the "Last Updated" date. Continued use of our services after changes constitutes acceptance of the updated policy.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <Eye className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Contact Us</h2>
              </div>
              
              <div className="space-y-3 ml-12 text-muted-foreground">
                <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
                <ul className="space-y-2">
                  <li>• Through our <a href="/support" className="text-primary hover:underline">Support System</a></li>
                  <li>• Via Discord support tickets</li>
                  <li>• By email at privacy@slrp.com</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
