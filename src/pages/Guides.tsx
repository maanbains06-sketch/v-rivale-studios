import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle2, BookOpen, Briefcase, AlertCircle } from "lucide-react";

const Guides = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gradient mb-4">Player Guides</h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to know to get started on APEX RP
            </p>
          </div>

          <Tabs defaultValue="character" className="max-w-5xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8">
              <TabsTrigger value="character" className="gap-2">
                <UserCircle2 className="w-4 h-4" />
                Character
              </TabsTrigger>
              <TabsTrigger value="rules" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Rules
              </TabsTrigger>
              <TabsTrigger value="jobs" className="gap-2">
                <Briefcase className="w-4 h-4" />
                Jobs
              </TabsTrigger>
              <TabsTrigger value="tips" className="gap-2">
                <AlertCircle className="w-4 h-4" />
                RP Tips
              </TabsTrigger>
            </TabsList>

            <TabsContent value="character" className="space-y-6">
              <Card className="glass-effect border-border/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">Character Creation Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-foreground/90">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">1. Creating Your Identity</h3>
                    <p className="mb-2">Your character is more than just a name and appearance. Consider:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Background story: Where did they come from?</li>
                      <li>Personality traits: What makes them unique?</li>
                      <li>Goals and motivations: What do they want to achieve?</li>
                      <li>Strengths and weaknesses: Nobody's perfect</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">2. Appearance Customization</h3>
                    <p className="mb-2">Take your time in character creation:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Choose features that match your character's background</li>
                      <li>Consider age-appropriate styling</li>
                      <li>Think about how clothing reflects personality</li>
                      <li>Remember: You can visit clothing stores later</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">3. Starting Your Story</h3>
                    <p className="mb-2">Once you spawn in Los Santos:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Visit City Hall to register as a citizen</li>
                      <li>Get a phone at the electronics store</li>
                      <li>Apply for your first job at the job center</li>
                      <li>Interact with others to build your network</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rules" className="space-y-6">
              <Card className="glass-effect border-border/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">Essential Server Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-foreground/90">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Roleplay Standards</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Stay In Character (IC):</strong> Keep all roleplay actions in character. Use /ooc for out of character chat.</li>
                      <li><strong>Value Your Life:</strong> Act as if your character's life matters. Don't take unnecessary risks.</li>
                      <li><strong>New Life Rule:</strong> If your character dies, you forget the events leading to your death.</li>
                      <li><strong>Powergaming:</strong> Don't force actions on others or perform unrealistic feats.</li>
                      <li><strong>Metagaming:</strong> Don't use out-of-character information in roleplay.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Combat & Criminal RP</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>High-quality roleplay required before criminal activity</li>
                      <li>No Random Deathmatch (RDM) - don't kill without reason</li>
                      <li>Robberies require 4+ police officers online</li>
                      <li>Give proper warnings before initiating combat</li>
                      <li>Respect cooldown periods between major crimes</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Community Standards</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Respect all players and staff members</li>
                      <li>No discrimination, harassment, or toxic behavior</li>
                      <li>Keep chat appropriate and family-friendly</li>
                      <li>Report rule breakers instead of retaliating</li>
                      <li>Follow staff instructions without argument</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="jobs" className="space-y-6">
              <Card className="glass-effect border-border/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">Job Guides & Career Paths</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-foreground/90">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">Legal Jobs</h3>
                    <div className="space-y-3">
                      <div className="p-4 glass-effect rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">Police Officer</h4>
                        <p className="text-sm mb-2">Uphold the law and maintain order in Los Santos.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                          <li>Requirements: Clean record, 21+, academy training</li>
                          <li>Pay: $250-500 per hour + bonuses</li>
                          <li>Progression: Officer → Sergeant → Lieutenant → Captain</li>
                        </ul>
                      </div>

                      <div className="p-4 glass-effect rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">EMS / Paramedic</h4>
                        <p className="text-sm mb-2">Save lives and provide medical assistance.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                          <li>Requirements: Medical training certification</li>
                          <li>Pay: $200-400 per hour</li>
                          <li>Progression: EMT → Paramedic → Doctor → Chief of Medicine</li>
                        </ul>
                      </div>

                      <div className="p-4 glass-effect rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">Mechanic</h4>
                        <p className="text-sm mb-2">Repair and customize vehicles across the city.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                          <li>Requirements: Basic mechanical knowledge</li>
                          <li>Pay: $150-300 per hour + tips</li>
                          <li>Progression: Apprentice → Mechanic → Master → Shop Owner</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">Criminal Activities</h3>
                    <div className="space-y-3">
                      <div className="p-4 glass-effect rounded-lg border border-destructive/20">
                        <h4 className="font-semibold text-destructive mb-2">Gang Member</h4>
                        <p className="text-sm mb-2">Join established gangs and control territory.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                          <li>High-risk, high-reward lifestyle</li>
                          <li>Territory control and gang wars</li>
                          <li>Must follow gang-specific rules</li>
                        </ul>
                      </div>

                      <div className="p-4 glass-effect rounded-lg border border-destructive/20">
                        <h4 className="font-semibold text-destructive mb-2">Drug Dealer</h4>
                        <p className="text-sm mb-2">Manufacture and distribute illegal substances.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                          <li>Requires connections and territory</li>
                          <li>Constant risk of police raids</li>
                          <li>Lucrative but dangerous</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tips" className="space-y-6">
              <Card className="glass-effect border-border/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">Roleplay Tips & Best Practices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-foreground/90">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Quality Roleplay</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Use /me and /do:</strong> Describe actions and environment details</li>
                      <li><strong>Realistic Reactions:</strong> Respond appropriately to situations</li>
                      <li><strong>Character Development:</strong> Let your character grow and change</li>
                      <li><strong>Active Listening:</strong> Pay attention to what others say and do</li>
                      <li><strong>Improvisation:</strong> Be flexible and adapt to unexpected scenarios</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Building Relationships</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Start conversations naturally in public spaces</li>
                      <li>Remember details about characters you interact with</li>
                      <li>Create meaningful connections and rivalries</li>
                      <li>Join groups or create your own organization</li>
                      <li>Participate in community events</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Common Mistakes to Avoid</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Don't rush into criminal activity immediately</li>
                      <li>Avoid one-dimensional characters</li>
                      <li>Don't ignore other players trying to roleplay with you</li>
                      <li>Never break character to argue about rules</li>
                      <li>Don't take in-character conflicts personally</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Advanced Techniques</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Create detailed character backstories</li>
                      <li>Develop character-specific speech patterns</li>
                      <li>Plan long-term character arcs</li>
                      <li>Collaborate with others on shared storylines</li>
                      <li>Document your character's journey</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Guides;
