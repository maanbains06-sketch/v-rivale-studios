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
                  <CardTitle className="text-2xl text-primary">APEX RP Server Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-foreground/90">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">1. General Roleplay Standards</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Fail RP:</strong> All roleplay must be realistic and believable. Acting in ways that break immersion or defy reality is prohibited.</li>
                      <li><strong>Stay In Character (IC):</strong> Keep all roleplay actions and conversations in character at all times. Use /ooc sparingly for out-of-character communication.</li>
                      <li><strong>Fear RP:</strong> Your character must value their life. Show realistic fear when threatened with weapons or outnumbered.</li>
                      <li><strong>Value of Life:</strong> Treat your character&apos;s life as precious. Avoid unnecessary risks and dangerous situations without proper RP justification.</li>
                      <li><strong>Character Development:</strong> Develop your character naturally over time. Instant wealth or dramatic personality changes must be justified through RP.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">2. Prohibited Behaviors</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Metagaming:</strong> Using out-of-character information (Discord, streams, etc.) in roleplay is strictly forbidden.</li>
                      <li><strong>Powergaming:</strong> Forcing actions on other players without giving them a chance to respond or performing unrealistic actions.</li>
                      <li><strong>Random Deathmatch (RDM):</strong> Killing another player without valid roleplay reason or initiation.</li>
                      <li><strong>Vehicle Deathmatch (VDM):</strong> Using vehicles as weapons without proper roleplay escalation.</li>
                      <li><strong>Combat Logging:</strong> Disconnecting during active roleplay or to avoid consequences of your actions.</li>
                      <li><strong>Exploiting/Glitching:</strong> Using game bugs or exploits for personal advantage is a bannable offense.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">3. New Life Rule (NLR)</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>If your character dies, you forget all events leading up to and including your death</li>
                      <li>You cannot return to the location of your death for 15 minutes</li>
                      <li>You cannot seek revenge on the people who caused your death</li>
                      <li>Medical RP that results in revival means you retain memories but may have injuries/trauma</li>
                      <li>Permanent death scenarios must be approved by staff</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">4. Criminal Roleplay</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Crime Initiation:</strong> Provide high-quality roleplay before engaging in criminal activity. Quality over quantity.</li>
                      <li><strong>Cop Baiting:</strong> Intentionally provoking police without proper RP reason is prohibited.</li>
                      <li><strong>Major Crimes:</strong> Bank robberies, prison breaks, and gang wars require 4+ LEO online and proper planning RP.</li>
                      <li><strong>Hostage RP:</strong> Must provide engaging RP for hostages. Don&apos;t use them solely as shields or bargaining chips.</li>
                      <li><strong>Territory Wars:</strong> Gang conflicts must be pre-approved by staff and follow server conflict guidelines.</li>
                      <li><strong>Crime Cooldowns:</strong> 30-minute cooldown between major crimes. 60 minutes for the same crime type.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">5. Law Enforcement & Government</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>LEO must follow proper procedures: Miranda rights, reasonable suspicion, probable cause</li>
                      <li>Corrupt cop RP requires staff approval and must be done carefully</li>
                      <li>Cannot break character to enforce server rules - call staff instead</li>
                      <li>EMS cannot be taken hostage or harmed while providing medical services</li>
                      <li>Government officials must maintain professionalism and serve the community</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">6. Vehicle & Traffic Rules</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Drive realistically - obey traffic laws unless in pursuit or fleeing</li>
                      <li>No NOS/turbo in city limits (school zones, downtown)</li>
                      <li>Motorcycles cannot jump off mountains or perform extreme stunts without RP reason</li>
                      <li>Vehicle repairs must be done at mechanic shops or through mechanic RP</li>
                      <li>Stealing LEO, EMS, or government vehicles is prohibited</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">7. Communication & Voice</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Microphone required - text RP only allowed for mute characters with staff approval</li>
                      <li>No voice changers unless character-appropriate and not used to break immersion</li>
                      <li>Push-to-talk required - no open mic or background noise</li>
                      <li>Phone calls and radio require proper use of phone/radio prop and appropriate distance</li>
                      <li>No excessive yelling, ear-rape, or purposefully annoying sounds</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">8. Community Standards</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Respect:</strong> Treat all players and staff with respect. Harassment and toxicity result in immediate bans.</li>
                      <li><strong>Zero Tolerance:</strong> Racism, sexism, homophobia, transphobia, and discrimination of any kind are not tolerated.</li>
                      <li><strong>Age Restriction:</strong> Must be 18+ to play. Mature themes and language are present.</li>
                      <li><strong>Stream Sniping:</strong> Watching someone&apos;s stream to gain info or find them in-game is prohibited.</li>
                      <li><strong>Advertisement:</strong> Promoting other servers or communities will result in a permanent ban.</li>
                      <li><strong>Staff Decisions:</strong> Staff decisions are final. Appeals can be made through proper channels.</li>
                    </ul>
                  </div>

                  <div className="p-4 border border-primary/30 rounded-lg bg-primary/5 mt-6">
                    <h4 className="font-semibold text-primary mb-2">⚠️ Important Notes</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Staff reserve the right to interpret and enforce rules based on intent and context</li>
                      <li>Not knowing the rules is not an excuse - read them thoroughly before playing</li>
                      <li>Rules are subject to change - check Discord announcements regularly</li>
                      <li>When in doubt, create a ticket and ask staff before proceeding</li>
                      <li>All punishments are at staff discretion based on severity and history</li>
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
