import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerGuides from "@/assets/header-guides-new.jpg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle2, BookOpen, AlertCircle, HelpCircle, Image, Shield, MessageSquare, Heart, Flag } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "react-router-dom";

const RPTerm = ({ term, definition }: { term: string; definition: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="inline-flex items-center gap-1 cursor-help border-b border-dotted border-primary/50 hover:border-primary transition-colors">
        <strong>{term}</strong>
        <HelpCircle className="w-3 h-3 text-primary/70" />
      </span>
    </TooltipTrigger>
    <TooltipContent className="max-w-xs">
      <p>{definition}</p>
    </TooltipContent>
  </Tooltip>
);

const Guides = () => {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen">
        <Navigation />
      
      <PageHeader 
        title="Player Guides"
        description="Everything you need to know to get started on SLRP"
        backgroundImage={headerGuides}
      />
      
      <main className="pb-16">
        <div className="container mx-auto px-4">

          <Tabs defaultValue="character" className="max-w-5xl mx-auto">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="character" className="gap-2">
                <UserCircle2 className="w-4 h-4" />
                Character
              </TabsTrigger>
              <TabsTrigger value="rules" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Rules
              </TabsTrigger>
              <TabsTrigger value="tips" className="gap-2">
                <AlertCircle className="w-4 h-4" />
                RP Tips
              </TabsTrigger>
              <TabsTrigger value="gallery" className="gap-2">
                <Image className="w-4 h-4" />
                Gallery Guidelines
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
                      <li><RPTerm term="Fail RP" definition="Acting unrealistically or breaking immersion. Examples: jumping off buildings without injury, ignoring injuries, or performing superhuman feats." />: All roleplay must be realistic and believable. Acting in ways that break immersion or defy reality is prohibited.</li>
                      <li><RPTerm term="Stay In Character (IC)" definition="Keeping all actions and conversations within your character's perspective. Never reference real-world events or use out-of-game knowledge." />: Keep all roleplay actions and conversations in character at all times. Use /ooc sparingly for out-of-character communication.</li>
                      <li><RPTerm term="Fear RP" definition="Showing realistic fear and compliance when your life is threatened. You must act as you would in real life when faced with danger." />: Your character must value their life. Show realistic fear when threatened with weapons or outnumbered.</li>
                      <li><RPTerm term="Value of Life" definition="Treating your character's life as irreplaceable. Avoid unnecessary risks and act with self-preservation in dangerous situations." />: Treat your character&apos;s life as precious. Avoid unnecessary risks and dangerous situations without proper RP justification.</li>
                      <li><strong>Character Development:</strong> Develop your character naturally over time. Instant wealth or dramatic personality changes must be justified through RP.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">2. Prohibited Behaviors</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><RPTerm term="Metagaming" definition="Using information your character wouldn't know (from Discord, streams, previous characters, or other sources) to gain an unfair advantage in roleplay." />: Using out-of-character information (Discord, streams, etc.) in roleplay is strictly forbidden.</li>
                      <li><RPTerm term="Powergaming" definition="Forcing roleplay outcomes on others without allowing them to react, or performing unrealistic actions that give you an unfair advantage." />: Forcing actions on other players without giving them a chance to respond or performing unrealistic actions.</li>
                      <li><RPTerm term="Random Deathmatch (RDM)" definition="Killing or attacking another player without any valid roleplay reason or proper initiation of conflict." />: Killing another player without valid roleplay reason or initiation.</li>
                      <li><RPTerm term="Vehicle Deathmatch (VDM)" definition="Using your vehicle as a weapon to hit, ram, or kill players without proper roleplay justification and escalation." />: Using vehicles as weapons without proper roleplay escalation.</li>
                      <li><RPTerm term="Combat Logging" definition="Logging out or disconnecting during active roleplay, especially during combat or to avoid arrest/consequences." />: Disconnecting during active roleplay or to avoid consequences of your actions.</li>
                      <li><strong>Exploiting/Glitching:</strong> Using game bugs or exploits for personal advantage is a bannable offense.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">3. <RPTerm term="New Life Rule (NLR)" definition="When your character dies, you forget everything about that death and cannot return to the area or seek revenge. Think of it as starting fresh after respawning." /></h3>
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
                      <li><RPTerm term="Cop Baiting" definition="Intentionally committing crimes or acting suspiciously in front of police just to provoke a chase or interaction without legitimate roleplay reason." />: Intentionally provoking police without proper RP reason is prohibited.</li>
                      <li><strong>Major Crimes:</strong> Bank robberies, prison breaks, and gang wars require 4+ LEO online and proper planning RP.</li>
                      <li><strong>Hostage RP:</strong> Must provide engaging RP for hostages. Don&apos;t use them solely as shields or bargaining chips.</li>
                      <li><strong>Territory Wars:</strong> Gang conflicts must be pre-approved by staff and follow server conflict guidelines.</li>
                      <li><strong>Crime Cooldowns:</strong> 30-minute cooldown between major crimes. 60 minutes for the same crime type.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">5. Gang Roleplay</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Gang Formation:</strong> Official gangs require 5+ active members and staff approval. Submit gang application with backstory, colors, and territory claims.</li>
                      <li><strong>Gang Colors & Identification:</strong> Gangs must wear recognizable colors/clothing. Cannot claim colors already used by established gangs.</li>
                      <li><strong>Territory Control:</strong> Territories must be claimed through RP and staff approval. Defending territory requires valid RP escalation, not <RPTerm term="KOS (Kill on Sight)" definition="A policy where anyone entering a specific area can be killed immediately without warning or roleplay. Generally prohibited as it removes roleplay opportunity." />.</li>
                      <li><strong>Rival Gang Conflicts:</strong> Must initiate proper RP before engaging in gang wars. Minimum 3v3 for gang fights. No ambushing with overwhelming numbers.</li>
                      <li><strong>Gang Recruitment:</strong> New members must go through proper initiation RP. Cannot recruit players under 1 week on the server without staff approval.</li>
                      <li><strong>Alliance & Betrayal:</strong> Gang alliances and betrayals must be roleplayed with proper reasoning and story development.</li>
                      <li><strong>Respect Boundaries:</strong> Cannot force non-gang members into gang conflicts. Civilians and businesses must be allowed to operate without constant harassment.</li>
                      <li><strong>Gang Meetings & Events:</strong> Major gang events (large meetups, wars, truces) should be coordinated with staff to ensure server stability and fair RP.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">6. Law Enforcement & Government</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><RPTerm term="LEO" definition="Law Enforcement Officer - refers to police, sheriff, or any law enforcement role on the server." /> must follow proper procedures: Miranda rights, reasonable suspicion, probable cause</li>
                      <li>Corrupt cop RP requires staff approval and must be done carefully</li>
                      <li>Cannot break character to enforce server rules - call staff instead</li>
                      <li><RPTerm term="EMS" definition="Emergency Medical Services - paramedics and medical personnel who respond to injuries and emergencies." /> cannot be taken hostage or harmed while providing medical services</li>
                      <li>Government officials must maintain professionalism and serve the community</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">7. Vehicle & Traffic Rules</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Drive realistically - obey traffic laws unless in pursuit or fleeing</li>
                      <li>No NOS/turbo in city limits (school zones, downtown)</li>
                      <li>Motorcycles cannot jump off mountains or perform extreme stunts without RP reason</li>
                      <li>Vehicle repairs must be done at mechanic shops or through mechanic RP</li>
                      <li>Stealing LEO, EMS, or government vehicles is prohibited</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">8. Communication & Voice</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Microphone required - text RP only allowed for mute characters with staff approval</li>
                      <li>No voice changers unless character-appropriate and not used to break immersion</li>
                      <li>Push-to-talk required - no open mic or background noise</li>
                      <li>Phone calls and radio require proper use of phone/radio prop and appropriate distance</li>
                      <li>No excessive yelling, ear-rape, or purposefully annoying sounds</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">9. Community Standards</h3>
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

            <TabsContent value="tips" className="space-y-6">
              <Card className="glass-effect border-border/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">Roleplay Tips & Best Practices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-foreground/90">

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

            <TabsContent value="gallery" className="space-y-6">
              <Card className="glass-effect border-border/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary flex items-center gap-3">
                    <Image className="w-7 h-7" />
                    Community Gallery Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-foreground/90">

                  <div className="p-4 border border-primary/30 rounded-lg bg-primary/5">
                    <p className="text-foreground/90">
                      Our community gallery is a place to showcase your best SLRP moments, creative screenshots, 
                      and memorable roleplay scenes. Follow these guidelines to ensure a positive experience for everyone.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Content Standards
                    </h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Quality First:</strong> Submit clear, high-quality screenshots. Blurry or low-resolution images may be rejected.</li>
                      <li><strong>Original Content:</strong> Only submit content you've captured yourself. No stolen or reposted content.</li>
                      <li><strong>Appropriate Content:</strong> No explicit, violent, or offensive imagery. Content must be suitable for all ages.</li>
                      <li><strong>No UI Clutter:</strong> Hide HUD elements when possible for cleaner screenshots.</li>
                      <li><strong>Relevant to SLRP:</strong> All submissions must be from the SLRP server. No external content.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      Titles & Descriptions
                    </h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Descriptive Titles:</strong> Give your submission a meaningful title that describes the scene or moment.</li>
                      <li><strong>Add Context:</strong> Use descriptions to share the story behind the screenshot.</li>
                      <li><strong>Appropriate Language:</strong> No profanity, slurs, or offensive language in titles/descriptions.</li>
                      <li><strong>Proper Categories:</strong> Select the appropriate category for your submission (Vehicles, Roleplay, Scenery, etc.).</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" />
                      Community Interaction
                    </h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Respectful Comments:</strong> Keep comments positive and constructive. No harassment or negativity.</li>
                      <li><strong>Credit Others:</strong> If other players are featured, consider mentioning them in the description.</li>
                      <li><strong>Support Fellow Players:</strong> Like and engage with content you enjoy!</li>
                      <li><strong>Report Issues:</strong> Use the report feature for inappropriate content instead of engaging.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center gap-2">
                      <Flag className="w-5 h-5 text-primary" />
                      Prohibited Content
                    </h3>
                    <ul className="list-disc list-inside space-y-2 ml-4 text-destructive/90">
                      <li>Explicit or sexual content of any kind</li>
                      <li>Real-world violence, gore, or disturbing imagery</li>
                      <li>Racist, sexist, homophobic, or discriminatory content</li>
                      <li>Content that reveals personal information (doxxing)</li>
                      <li>Spam, advertisements, or promotional content</li>
                      <li>Content that mocks or harasses other players</li>
                      <li>Screenshots showing exploits, cheats, or rule-breaking</li>
                    </ul>
                  </div>

                  <div className="p-4 border border-neon-cyan/30 rounded-lg bg-neon-cyan/5 mt-6">
                    <h4 className="font-semibold text-neon-cyan mb-2">📸 Pro Tips for Great Screenshots</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Use the in-game photo mode for cinematic shots</li>
                      <li>Golden hour (sunrise/sunset) provides beautiful lighting</li>
                      <li>Experiment with different camera angles</li>
                      <li>Capture action moments and candid roleplay scenes</li>
                      <li>Weather effects like rain or fog add atmosphere</li>
                    </ul>
                  </div>

                  <div className="flex justify-center mt-6">
                    <Link 
                      to="/gallery" 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-all hover:scale-105 shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                    >
                      <Image className="w-5 h-5" />
                      Visit the Gallery
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      </div>
    </TooltipProvider>
  );
};

export default Guides;
