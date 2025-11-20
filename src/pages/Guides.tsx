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
              Everything you need to know to get started on SLRP
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
                  <CardTitle className="text-2xl text-primary">SLRP Server Rules</CardTitle>
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
                    <h3 className="text-xl font-semibold mb-4 text-foreground">🚔 Law Enforcement & Emergency Services</h3>
                    <div className="space-y-4">
                      <div className="p-4 glass-effect rounded-lg border border-primary/20">
                        <h4 className="font-semibold text-primary mb-2">Los Santos Police Department (LSPD)</h4>
                        <p className="text-sm mb-3">Serve and protect the citizens of Los Santos. Uphold the law and maintain peace in the city.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-3">
                          <li><strong>Requirements:</strong> 21+ years old, clean criminal record, pass academy training</li>
                          <li><strong>Pay Range:</strong> $250-600/hour based on rank + bonuses for arrests</li>
                          <li><strong>Ranks:</strong> Cadet → Officer → Senior Officer → Corporal → Sergeant → Lieutenant → Captain → Chief</li>
                          <li><strong>Divisions:</strong> Patrol, SWAT, Traffic Enforcement, K-9, Detective Bureau</li>
                        </ul>
                        <p className="text-xs text-muted-foreground italic">Apply at Mission Row Police Station. Interview and background check required.</p>
                      </div>

                      <div className="p-4 glass-effect rounded-lg border border-primary/20">
                        <h4 className="font-semibold text-primary mb-2">Emergency Medical Services (EMS)</h4>
                        <p className="text-sm mb-3">Save lives and provide critical medical care to injured citizens across Los Santos.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-3">
                          <li><strong>Requirements:</strong> Medical certification, good driving record, calm under pressure</li>
                          <li><strong>Pay Range:</strong> $200-500/hour + bonuses per successful revival</li>
                          <li><strong>Ranks:</strong> EMT Trainee → EMT → Paramedic → Senior Paramedic → Doctor → Chief of Medicine</li>
                          <li><strong>Specializations:</strong> Trauma Surgery, Psychiatry, Emergency Response, Air Ambulance</li>
                        </ul>
                        <p className="text-xs text-muted-foreground italic">Apply at Pillbox Medical Center. Requires medical RP knowledge and training.</p>
                      </div>

                      <div className="p-4 glass-effect rounded-lg border border-primary/20">
                        <h4 className="font-semibold text-primary mb-2">Department of Justice (DOJ)</h4>
                        <p className="text-sm mb-3">Lawyers, judges, and legal professionals ensuring justice is served.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-3">
                          <li><strong>Positions:</strong> Public Defender, District Attorney, Judge, Court Clerk</li>
                          <li><strong>Pay Range:</strong> $300-800/hour depending on position and case complexity</li>
                          <li><strong>Requirements:</strong> Excellent RP skills, law knowledge, mature and professional</li>
                        </ul>
                        <p className="text-xs text-muted-foreground italic">Highly selective. Contact DOJ leadership for application process.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-foreground">💼 Civilian & Service Jobs</h3>
                    <div className="space-y-4">
                      <div className="p-4 glass-effect rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">Mechanic / Auto Shop</h4>
                        <p className="text-sm mb-3">Repair, customize, and maintain vehicles. Run your own shop or work for established businesses.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-3">
                          <li><strong>Pay:</strong> $150-400/hour + customer tips and custom job payments</li>
                          <li><strong>Services:</strong> Repairs, custom paint jobs, performance upgrades, body kits</li>
                          <li><strong>Progression:</strong> Apprentice → Mechanic → Master Mechanic → Shop Owner</li>
                          <li><strong>Locations:</strong> Hayes Auto, Benny&apos;s Original Motor Works, Los Santos Customs</li>
                        </ul>
                      </div>

                      <div className="p-4 glass-effect rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">Real Estate Agent</h4>
                        <p className="text-sm mb-3">Help players buy, sell, and rent properties. Earn commission on every deal.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-3">
                          <li><strong>Pay:</strong> Commission-based (5-15% of property value per sale)</li>
                          <li><strong>Skills Needed:</strong> Salesmanship, market knowledge, negotiation</li>
                          <li><strong>Properties:</strong> Houses, apartments, businesses, warehouses, garages</li>
                        </ul>
                      </div>

                      <div className="p-4 glass-effect rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">Taxi / Uber Driver</h4>
                        <p className="text-sm mb-3">Transport passengers safely around the city. Great for meeting new people.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-3">
                          <li><strong>Pay:</strong> $100-250/hour + fares and tips from passengers</li>
                          <li><strong>Requirements:</strong> Clean driving record, friendly demeanor, city knowledge</li>
                          <li><strong>Benefits:</strong> Flexible hours, meet diverse characters, explore the city</li>
                        </ul>
                      </div>

                      <div className="p-4 glass-effect rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">Restaurant / Bar Owner</h4>
                        <p className="text-sm mb-3">Open and manage restaurants, bars, nightclubs. Create unique dining experiences.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-3">
                          <li><strong>Investment:</strong> $50,000-500,000 depending on location and size</li>
                          <li><strong>Income:</strong> Revenue from sales, events, catering services</li>
                          <li><strong>Staff:</strong> Hire chefs, bartenders, servers, security, DJs</li>
                          <li><strong>Popular Spots:</strong> Vanilla Unicorn, Tequi-la-la, Bahama Mamas</li>
                        </ul>
                      </div>

                      <div className="p-4 glass-effect rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">News Reporter / Journalist</h4>
                        <p className="text-sm mb-3">Report on city events, conduct interviews, create engaging content for Weazel News.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-3">
                          <li><strong>Pay:</strong> $150-350/hour + bonuses for exclusive stories</li>
                          <li><strong>Equipment:</strong> News van, camera, microphone provided</li>
                          <li><strong>Coverage:</strong> Crime scenes, court cases, events, interviews, investigations</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-foreground">🏭 Blue Collar & Resource Jobs</h3>
                    <div className="space-y-4">
                      <div className="p-4 glass-effect rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">Mining & Ore Processing</h4>
                        <p className="text-sm mb-3">Extract valuable resources from mines. Process and sell materials.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                          <li><strong>Pay:</strong> $120-280/hour based on materials gathered</li>
                          <li><strong>Resources:</strong> Iron, copper, gold, diamonds, coal</li>
                          <li><strong>Location:</strong> Various mine sites around Blaine County</li>
                        </ul>
                      </div>

                      <div className="p-4 glass-effect rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">Fishing & Hunting</h4>
                        <p className="text-sm mb-3">Catch fish or hunt animals. Sell to restaurants or markets.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                          <li><strong>Pay:</strong> $100-300/hour depending on catch quality and rarity</li>
                          <li><strong>Equipment:</strong> Fishing rod, hunting rifle, licenses required</li>
                          <li><strong>Locations:</strong> Pacific Ocean, Alamo Sea, forests and mountains</li>
                        </ul>
                      </div>

                      <div className="p-4 glass-effect rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">Delivery Driver / Trucker</h4>
                        <p className="text-sm mb-3">Transport goods across the state. Long hauls pay more.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                          <li><strong>Pay:</strong> $150-400/delivery based on distance and cargo value</li>
                          <li><strong>Routes:</strong> Local deliveries, state-wide cargo, import/export</li>
                          <li><strong>Requirements:</strong> Commercial driver license, reliable and timely</li>
                        </ul>
                      </div>

                      <div className="p-4 glass-effect rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">Garbage Collector / Sanitation</h4>
                        <p className="text-sm mb-3">Keep Los Santos clean. Honest work with steady pay.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                          <li><strong>Pay:</strong> $100-200/hour with route bonuses</li>
                          <li><strong>Routes:</strong> Residential, commercial, industrial districts</li>
                          <li><strong>Benefits:</strong> Low stress, flexible schedule, good starter job</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-foreground">⚠️ Criminal Organizations & Activities</h3>
                    <p className="text-sm text-destructive mb-4">
                      <strong>Warning:</strong> Criminal activities are high-risk. Prison time, fines, and death are real consequences. Quality RP required.
                    </p>
                    <div className="space-y-4">
                      <div className="p-4 glass-effect rounded-lg border border-destructive/30">
                        <h4 className="font-semibold text-destructive mb-2">Gang Member</h4>
                        <p className="text-sm mb-3">Join established gangs like Ballas, Vagos, or Families. Control territory and build your reputation.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-3">
                          <li><strong>Income:</strong> Varies - drug sales, robberies, protection money</li>
                          <li><strong>Requirements:</strong> Gang initiation, prove loyalty, follow gang codes</li>
                          <li><strong>Risks:</strong> Rival gangs, police raids, prison sentences, death</li>
                          <li><strong>Activities:</strong> Territory wars, drug trafficking, vehicle theft, robberies</li>
                        </ul>
                      </div>

                      <div className="p-4 glass-effect rounded-lg border border-destructive/30">
                        <h4 className="font-semibold text-destructive mb-2">Drug Manufacturing & Distribution</h4>
                        <p className="text-sm mb-3">Produce and sell illegal substances. Requires connections and territory.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-3">
                          <li><strong>Income:</strong> $500-2,000+/hour (high risk, high reward)</li>
                          <li><strong>Process:</strong> Gather materials → Cook/grow → Package → Distribute</li>
                          <li><strong>Locations:</strong> Hidden labs, farmhouses, warehouses</li>
                          <li><strong>Risks:</strong> Raids, robberies, rival dealers, lengthy prison sentences</li>
                        </ul>
                      </div>

                      <div className="p-4 glass-effect rounded-lg border border-destructive/30">
                        <h4 className="font-semibold text-destructive mb-2">Heists & Robberies</h4>
                        <p className="text-sm mb-3">Plan and execute major heists. Requires crew coordination and planning.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-3">
                          <li><strong>Targets:</strong> Banks, jewelry stores, armored trucks, Fleeca branches, Pacific Standard</li>
                          <li><strong>Payout:</strong> $10,000-500,000 depending on target and success</li>
                          <li><strong>Requirements:</strong> 4+ LEO online, planning RP, proper gear</li>
                          <li><strong>Roles:</strong> Driver, hacker, gunman, lookout, negotiator</li>
                        </ul>
                      </div>

                      <div className="p-4 glass-effect rounded-lg border border-destructive/30">
                        <h4 className="font-semibold text-destructive mb-2">Arms Dealer / Gun Running</h4>
                        <p className="text-sm mb-3">Source and sell illegal firearms. Supply gangs and criminals.</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-3">
                          <li><strong>Income:</strong> $300-1,000+ per weapon sold</li>
                          <li><strong>Operations:</strong> Import weapons, store in warehouses, sell to buyers</li>
                          <li><strong>Risks:</strong> ATF investigations, robberies, informants, federal charges</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-primary/30 rounded-lg bg-primary/5 mt-6">
                    <h4 className="font-semibold text-primary mb-2">💡 Job Tips</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><strong>Start Legal:</strong> Build wealth and connections through legal jobs first</li>
                      <li><strong>Network:</strong> Your success often depends on relationships with other players</li>
                      <li><strong>Invest Wisely:</strong> Save money to buy businesses, properties, and equipment</li>
                      <li><strong>Stay Consistent:</strong> Regular activity in your job builds reputation and trust</li>
                      <li><strong>Create RP:</strong> Don&apos;t just grind - create interesting scenarios for others</li>
                      <li><strong>Balance Risk:</strong> Criminal jobs pay more but come with real consequences</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tips" className="space-y-6">
              <Card className="glass-effect border-border/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">Roleplay Tips & Best Practices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-foreground/90">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">🎭 Essential RP Commands</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-card/50 rounded-lg">
                        <p className="font-mono text-primary mb-1">/me [action]</p>
                        <p className="text-sm text-muted-foreground">Describe physical actions your character performs</p>
                        <p className="text-xs italic mt-1">Example: /me pulls out phone and dials a number</p>
                      </div>
                      <div className="p-3 bg-card/50 rounded-lg">
                        <p className="font-mono text-primary mb-1">/do [environment/result]</p>
                        <p className="text-sm text-muted-foreground">Describe environmental details or action outcomes</p>
                        <p className="text-xs italic mt-1">Example: /do The door is locked with a heavy deadbolt</p>
                      </div>
                      <div className="p-3 bg-card/50 rounded-lg">
                        <p className="font-mono text-primary mb-1">/ooc [message]</p>
                        <p className="text-sm text-muted-foreground">Out of character communication (use sparingly)</p>
                        <p className="text-xs italic mt-1">Example: /ooc Sorry, my game froze for a sec</p>
                      </div>
                      <div className="p-3 bg-card/50 rounded-lg">
                        <p className="font-mono text-primary mb-1">/whisper or /w [message]</p>
                        <p className="text-sm text-muted-foreground">Speak quietly to people very close to you</p>
                        <p className="text-xs italic mt-1">Example: /w Don&apos;t trust that guy...</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">✨ Creating Quality Roleplay</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Show, Don&apos;t Tell:</strong> Instead of saying &quot;I&apos;m nervous&quot;, describe fidgeting, avoiding eye contact, or stuttering</li>
                      <li><strong>Add Details:</strong> Don&apos;t just walk into a store - describe how you walk, what you&apos;re wearing, your mood</li>
                      <li><strong>React Realistically:</strong> Getting shot hurts. Losing money is upsetting. Winning feels great. Show emotions!</li>
                      <li><strong>Give Others Opportunities:</strong> Leave room in your RP for others to contribute and respond</li>
                      <li><strong>Avoid Shortcuts:</strong> Don&apos;t rush through RP to get to mechanics. The journey is the fun part</li>
                      <li><strong>Use Voice Variety:</strong> Change your tone, pace, and volume based on situations and emotions</li>
                      <li><strong>Embrace Failure:</strong> Losing, failing, or making mistakes creates great RP opportunities</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">👥 Building Relationships & Networks</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Frequent Spots:</strong> Hang out at popular locations like Legion Square, Vanilla Unicorn, or coffee shops</li>
                      <li><strong>Remember Details:</strong> Keep mental notes about characters you meet - their names, jobs, personalities</li>
                      <li><strong>Exchange Numbers:</strong> Get phone numbers to stay in touch and create recurring RP</li>
                      <li><strong>Join Organizations:</strong> Gangs, businesses, and groups provide built-in RP connections</li>
                      <li><strong>Create History:</strong> Reference past interactions to deepen relationships</li>
                      <li><strong>Be Approachable:</strong> Don&apos;t always hang with the same people. Meet new characters</li>
                      <li><strong>Start Conversations:</strong> Ask questions, comment on surroundings, offer help</li>
                      <li><strong>Follow Through:</strong> If you say you&apos;ll call or meet someone, do it!</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">🎬 Advanced RP Techniques</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Develop Unique Mannerisms:</strong> Quirks, habits, speech patterns that make your character memorable</li>
                      <li><strong>Create Consistent Backstory:</strong> Know your character&apos;s history and reference it naturally</li>
                      <li><strong>Plan Character Arcs:</strong> Have long-term goals and let your character evolve toward them</li>
                      <li><strong>Play Flawed Characters:</strong> Addictions, fears, biases, bad habits make characters interesting</li>
                      <li><strong>Internal Conflict:</strong> Struggle with moral dilemmas, tough decisions, conflicting loyalties</li>
                      <li><strong>Slow Burn Storylines:</strong> Not everything happens in one day. Let plots develop over weeks</li>
                      <li><strong>Collaborate on Stories:</strong> Work with others to create interconnected character arcs</li>
                      <li><strong>Use Props Effectively:</strong> Cigarettes, drinks, phones, documents - they add immersion</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">⚠️ Common Mistakes to Avoid</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Main Character Syndrome:</strong> Not everyone can be the toughest/richest/smartest. Be realistic</li>
                      <li><strong>Winning Every Situation:</strong> Sometimes you lose fights, get arrested, or fail. That&apos;s okay!</li>
                      <li><strong>Ignoring Others:</strong> Acknowledge people trying to RP with you, even if briefly</li>
                      <li><strong>Breaking Character:</strong> Never drop character to argue rules or criticize someone&apos;s RP</li>
                      <li><strong>Rushing Criminal RP:</strong> Don&apos;t jump into crime immediately. Build your character first</li>
                      <li><strong>One-Note Characters:</strong> Don&apos;t be ONLY angry, ONLY funny, or ONLY serious all the time</li>
                      <li><strong>Taking IC Personally:</strong> Your character&apos;s enemies aren&apos;t YOUR enemies. Separate IC from OOC</li>
                      <li><strong>Forcing Storylines:</strong> Let RP flow naturally. Don&apos;t force people into your pre-planned plot</li>
                      <li><strong>Neglecting Consequences:</strong> If you get shot, RP injuries. If you go to prison, accept it</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">💬 Specific RP Scenarios</h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-card/30 rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">Traffic Stops (As Civilian)</h4>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                          <li>Pull over safely when signaled</li>
                          <li>Keep hands visible, be respectful</li>
                          <li>RP nervousness if appropriate</li>
                          <li>Have a story ready if carrying illegal items</li>
                          <li>Accept tickets gracefully or try talking your way out</li>
                        </ul>
                      </div>

                      <div className="p-4 bg-card/30 rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">Medical RP</h4>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                          <li>Describe your injuries when EMS arrives</li>
                          <li>RP pain, confusion, or unconsciousness appropriately</li>
                          <li>Follow doctor&apos;s instructions and treatment</li>
                          <li>Don&apos;t instantly get up and run after being revived</li>
                          <li>Consider follow-up appointments for serious injuries</li>
                        </ul>
                      </div>

                      <div className="p-4 bg-card/30 rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">Robbery RP (As Victim)</h4>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                          <li>Value your life - comply if outnumbered/outgunned</li>
                          <li>RP fear - shaking voice, raised hands, cooperation</li>
                          <li>Don&apos;t be a hero unless it makes sense for your character</li>
                          <li>Remember details to report to police later</li>
                          <li>Accept the loss and move forward</li>
                        </ul>
                      </div>

                      <div className="p-4 bg-card/30 rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">Job Interviews</h4>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                          <li>Dress appropriately for the position</li>
                          <li>Research the company/organization beforehand</li>
                          <li>Prepare answers about your background and skills</li>
                          <li>Ask questions about the role and expectations</li>
                          <li>Follow up afterwards to show interest</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">🌟 Pro Tips from Veterans</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Document Your Story:</strong> Keep notes or a journal about your character&apos;s journey</li>
                      <li><strong>Watch and Learn:</strong> Observe experienced roleplayers to pick up techniques</li>
                      <li><strong>Join Community Events:</strong> Server events create amazing RP opportunities</li>
                      <li><strong>Don&apos;t Chase Mechanics:</strong> RP comes before grinding for money or items</li>
                      <li><strong>Create Content for Others:</strong> Be the lawyer who helps others, the mechanic who does house calls</li>
                      <li><strong>Stay Humble:</strong> Everyone started somewhere. Help new players learn</li>
                      <li><strong>Take Breaks:</strong> Burnout is real. Step away when you need to</li>
                      <li><strong>Have Fun!</strong> Remember this is a game. Enjoy the experience</li>
                    </ul>
                  </div>

                  <div className="p-4 border border-primary/30 rounded-lg bg-primary/5 mt-6">
                    <h4 className="font-semibold text-primary mb-3">📚 Recommended Learning Resources</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Watch RP streams and videos to see different styles</li>
                      <li>Join our Discord to discuss RP scenarios and get advice</li>
                      <li>Read character backstories shared by other players</li>
                      <li>Participate in RP workshops and training sessions</li>
                      <li>Ask mentors and staff for feedback on your roleplay</li>
                      <li>Study real-world professions you want to RP (cops, doctors, lawyers)</li>
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
