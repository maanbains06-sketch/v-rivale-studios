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
import { motion } from "framer-motion";

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

const scrollRevealVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const Guides = () => {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen">
        <Navigation />
      
      <PageHeader 
        title="📚 Player Guides"
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
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scrollRevealVariants}
              >
                <Card className="glass-effect border-border/20">
                  <CardHeader>
                    <CardTitle className="text-2xl text-primary">🎭 Character Creation Guide</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 text-foreground/90">
                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">🌟 1. Creating Your Identity</h3>
                      <p className="mb-3">Your character is more than just a name and appearance. Consider:</p>
                      <ul className="space-y-2 ml-4">
                        <li className="flex items-start gap-2">
                          <span className="text-lg">📖</span>
                          <span><strong>Background story:</strong> Where did they come from?</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-lg">💫</span>
                          <span><strong>Personality traits:</strong> What makes them unique?</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-lg">🎯</span>
                          <span><strong>Goals and motivations:</strong> What do they want to achieve?</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-lg">⚖️</span>
                          <span><strong>Strengths and weaknesses:</strong> Nobody's perfect</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">👔 2. Appearance Customization</h3>
                      <p className="mb-3">Take your time in character creation:</p>
                      <ul className="space-y-2 ml-4">
                        <li className="flex items-start gap-2">
                          <span className="text-lg">🎨</span>
                          <span>Choose features that match your character's background</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-lg">👴</span>
                          <span>Consider age-appropriate styling</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-lg">👕</span>
                          <span>Think about how clothing reflects personality</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-lg">🛍️</span>
                          <span>Remember: You can visit clothing stores later</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">🚀 3. Starting Your Story</h3>
                      <p className="mb-3">Once you spawn in Los Santos:</p>
                      <ul className="space-y-2 ml-4">
                        <li className="flex items-start gap-2">
                          <span className="text-lg">🏛️</span>
                          <span>Visit City Hall to register as a citizen</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-lg">📱</span>
                          <span>Get a phone at the electronics store</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-lg">💼</span>
                          <span>Apply for your first job at the job center</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-lg">🤝</span>
                          <span>Interact with others to build your network</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="rules" className="space-y-6">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scrollRevealVariants}
              >
                <Card className="glass-effect border-border/20">
                  <CardHeader>
                    <CardTitle className="text-2xl text-primary">📜 Skylife Roleplay Server Rules</CardTitle>
                    <p className="text-muted-foreground mt-2">Please read all rules carefully before joining the server. Ignorance of rules is not an excuse.</p>
                  </CardHeader>
                  <CardContent className="space-y-8 text-foreground/90">
                    
                    {/* Section 1: General Conduct */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">⚖️</span> 1. General Conduct & Behavior
                      </h3>
                      <p className="text-muted-foreground mb-4">These rules apply to all players at all times while on the server or in community spaces.</p>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">1.1</span>
                          <div>
                            <strong className="text-primary">Respect All Players:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Treat every player with dignity and respect regardless of their role, experience level, or in-game status. Personal attacks, bullying, or targeted harassment will result in immediate punishment. Remember that behind every character is a real person.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">1.2</span>
                          <div>
                            <strong className="text-primary">No Discrimination:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Racism, sexism, homophobia, transphobia, xenophobia, or any form of discrimination is strictly prohibited. This includes slurs, hate speech, discriminatory jokes, and targeted harassment based on race, gender, religion, nationality, or sexual orientation. Violations result in permanent bans.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">1.3</span>
                          <div>
                            <strong className="text-primary">Age Requirement:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">You must be 18 years or older to play on Skylife Roleplay. The server contains mature themes including violence, crime, and adult situations. Players discovered to be underage will be permanently banned until they reach the required age.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">1.4</span>
                          <div>
                            <strong className="text-primary">Staff Authority:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Staff decisions are final during active situations. If you disagree with a ruling, comply first and then submit an appeal through proper channels (Discord ticket). Arguing with staff, evading punishments, or attempting to undermine staff authority will result in additional penalties.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">1.5</span>
                          <div>
                            <strong className="text-primary">No Real-World Threats:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Threatening violence, doxxing, or any real-world harm against players, staff, or the community is grounds for immediate permanent ban and potential law enforcement involvement. Keep all conflicts within the game.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    {/* Section 2: Roleplay Standards */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">🎭</span> 2. Roleplay Standards & Quality
                      </h3>
                      <p className="text-muted-foreground mb-4">Quality roleplay is the foundation of our community. These standards ensure immersive experiences for everyone.</p>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">2.1</span>
                          <div>
                            <strong className="text-primary">Stay In Character (IC):</strong>
                            <p className="text-sm mt-1 text-muted-foreground">You must remain in character at all times while on the server. Breaking character to discuss real-life matters, game mechanics, or out-of-character issues disrupts immersion. Use /ooc sparingly and only when absolutely necessary. If you need to go AFK or handle real-life matters, find a safe place to do so in-character (e.g., going home, sitting at a bench).</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">2.2</span>
                          <div>
                            <strong className="text-primary">Realistic Roleplay:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">All actions must be realistic and believable. Your character should react to situations as a real person would. This includes showing pain when injured, fear when threatened, and appropriate emotional responses. Superhuman feats, ignoring injuries, or acting in ways that defy physics and reality constitute Fail RP.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">2.3</span>
                          <div>
                            <strong className="text-primary">Fear Roleplay (Fear RP):</strong>
                            <p className="text-sm mt-1 text-muted-foreground">When your character's life is threatened (gun pointed at you, outnumbered, etc.), you must show realistic fear and comply with demands. Running away when someone has a gun aimed at your head, fighting back against multiple armed assailants, or ignoring life-threatening situations is a violation. Value your character's life as you would your own.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">2.4</span>
                          <div>
                            <strong className="text-primary">Character Development:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Your character should grow and evolve naturally over time. Instant millionaires, overnight crime lords, or characters with unexplained skills and resources break immersion. Build your character's story through consistent roleplay, relationships, and experiences. Document your character's journey and be prepared to explain their background.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">2.5</span>
                          <div>
                            <strong className="text-primary">Scenario Completion:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Once a roleplay scenario begins, you must see it through to completion. This includes being arrested, receiving medical treatment, facing consequences, or completing negotiations. Abandoning scenarios prematurely, purposely stalling, or creating artificial endings undermines the experience for everyone involved.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    {/* Section 3: Prohibited Actions */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">🚫</span> 3. Strictly Prohibited Actions
                      </h3>
                      <p className="text-muted-foreground mb-4">The following actions are serious violations that will result in warnings, bans, or permanent removal from the server.</p>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-xl">3.1</span>
                          <div>
                            <strong className="text-red-400">Random Deathmatch (RDM):</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Killing, injuring, or attacking another player without valid roleplay reasoning is strictly prohibited. Every act of violence must be preceded by proper initiation, verbal warnings, and clear escalation. You cannot shoot someone simply because they looked at you wrong or because you feel like it. There must always be a story-driven reason.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-xl">3.2</span>
                          <div>
                            <strong className="text-red-400">Vehicle Deathmatch (VDM):</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Using your vehicle as a weapon to intentionally hit, ram, or kill other players is forbidden. This includes running people over, ramming vehicles off the road without RP reason, or using vehicle exploits. Accidental collisions should be roleplayed appropriately with apologies, insurance exchanges, or conflict resolution.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-xl">3.3</span>
                          <div>
                            <strong className="text-red-400">Metagaming:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Using information obtained outside of roleplay (Discord, streams, previous characters, or real-life knowledge) to influence your in-game actions is cheating. Your character only knows what they have personally experienced or learned in-game. Stream sniping, reading Discord channels for locations, or sharing information between your own characters (character bleed) are all forms of metagaming.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-xl">3.4</span>
                          <div>
                            <strong className="text-red-400">Powergaming:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Forcing actions or outcomes on other players without giving them a fair chance to respond is not allowed. This includes using /me commands to dictate what happens to other characters, refusing to acknowledge injuries, or performing actions that would be impossible in reality. Always give players the opportunity to react and respond to your actions.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-xl">3.5</span>
                          <div>
                            <strong className="text-red-400">Combat Logging:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Disconnecting, alt+F4'ing, or intentionally crashing your game during active roleplay scenarios (especially combat, arrests, or when being robbed) is a serious offense. If you experience a genuine crash, you must return to the server immediately and resume the scenario. Notify staff via Discord if you have connection issues.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-xl">3.6</span>
                          <div>
                            <strong className="text-red-400">Exploiting & Cheating:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Using game exploits, bugs, third-party software, mod menus, aimbots, ESP, or any cheating tools is grounds for immediate permanent ban. If you discover a bug or exploit, report it to staff immediately. Exploiting game mechanics for personal gain (duping items, glitching through walls, etc.) will not be tolerated.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-xl">3.7</span>
                          <div>
                            <strong className="text-red-400">Cop Baiting:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Intentionally committing crimes, acting suspiciously, or provoking law enforcement solely to initiate a chase or confrontation without legitimate roleplay reasoning is prohibited. All criminal activities must have proper motivation and story behind them, not just the desire for action or conflict.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    {/* Section 4: New Life Rule */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">💀</span> 4. New Life Rule (NLR)
                      </h3>
                      <p className="text-muted-foreground mb-4">The New Life Rule ensures fair gameplay and prevents revenge scenarios after character death.</p>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">4.1</span>
                          <div>
                            <strong className="text-primary">Memory Loss:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">When your character dies (respawns at hospital), you forget everything that happened in the 30 minutes leading up to your death. You cannot remember who killed you, what happened, or any details of the incident. You wake up in the hospital with no recollection of how you got there.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">4.2</span>
                          <div>
                            <strong className="text-primary">Location Restriction:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">You cannot return to the area where you died for 15 minutes after respawning. This prevents immediate revenge attempts and allows ongoing scenarios to conclude naturally. The restricted area is approximately a 500-meter radius from your death location.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">4.3</span>
                          <div>
                            <strong className="text-primary">No Revenge:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">You cannot seek revenge, gather information about your death, or attempt to identify your killers after respawning. Your character has no knowledge of the events. If someone tells you what happened, you still cannot act on that information as it would be metagaming.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">4.4</span>
                          <div>
                            <strong className="text-primary">Medical Revival Exception:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">If EMS arrives and revives you before you respawn, you retain your memories but are in critical condition. You must roleplay injuries appropriately (confusion, pain, limited mobility). You remember what happened but may have fuzzy details. Full recovery requires proper medical RP.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">4.5</span>
                          <div>
                            <strong className="text-primary">Permanent Death (Perma):</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Permanently killing your character requires staff approval and must be a meaningful story conclusion. Once perma'd, the character is gone forever. You cannot be forced to perma by other players. This is always your choice and should be discussed with involved parties beforehand.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    {/* Section 5: Criminal Activity */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">🔫</span> 5. Criminal Activity Rules
                      </h3>
                      <p className="text-muted-foreground mb-4">Criminal roleplay is welcome but must be conducted responsibly with proper escalation and story development.</p>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">5.1</span>
                          <div>
                            <strong className="text-primary">Crime Initiation:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">All criminal activities must have proper initiation and escalation. You cannot simply pull a gun and start shooting. There must be verbal communication, clear demands, and opportunities for the other party to comply. "Hands up or die" while aiming is acceptable initiation, but context matters.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">5.2</span>
                          <div>
                            <strong className="text-primary">Robbery Limits:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">You can only rob players of items they can realistically carry. Cash limit is ₹50,000 per robbery. You cannot take someone's house keys, vehicle keys, or identification. Robberies should not take longer than 10 minutes. No robbing at spawn points, hospitals, or police stations.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">5.3</span>
                          <div>
                            <strong className="text-primary">Hostage Guidelines:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Hostages must be treated with care – they are people, not props. Provide engaging roleplay for hostages, allow them bathroom breaks for long scenarios, and don't leave them tied up indefinitely. You cannot use new players (under 24 hours) as hostages. Hostage negotiations should be reasonable and realistic.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">5.4</span>
                          <div>
                            <strong className="text-primary">Major Crime Requirements:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Bank robberies require at least 4 police officers online. Jewelry stores require 3 officers. Prison breaks require 6 officers and admin approval. These crimes have 60-minute cooldowns. You must have a proper plan, getaway route, and roleplay reasoning. No back-to-back major crimes.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">5.5</span>
                          <div>
                            <strong className="text-primary">Crime Cooldowns:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">After committing a major crime, you must wait 30 minutes before engaging in another criminal activity. After being arrested, wait 60 minutes before committing crimes again. Store robberies have 20-minute cooldowns. These limits prevent crime spam and ensure quality roleplay.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    {/* Section 6: Vehicle Rules */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">🚗</span> 6. Vehicle & Driving Rules
                      </h3>
                      <p className="text-muted-foreground mb-4">Realistic driving enhances immersion and prevents frustrating gameplay experiences.</p>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">6.1</span>
                          <div>
                            <strong className="text-primary">Realistic Driving:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Drive as you would in real life during normal circumstances. Obey traffic signals, use turn signals, stay in lanes, and drive at reasonable speeds in the city. High-speed driving is acceptable during police chases or emergencies but should still be somewhat realistic.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">6.2</span>
                          <div>
                            <strong className="text-primary">Vehicle Limits:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">No driving vehicles off mountains, into buildings, or in ways that would destroy the vehicle in reality. Supercars cannot go off-road. Regular cars cannot climb vertical surfaces. Motorcycles cannot jump off rooftops. If your vehicle is damaged, you must acknowledge it and get repairs.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">6.3</span>
                          <div>
                            <strong className="text-primary">Pit Maneuvers:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Police can only perform pit maneuvers on vehicles at appropriate speeds (under 80 mph) and for serious crimes. Civilians cannot pit maneuver. Ramming vehicles head-on is considered VDM unless it's a last resort in an active combat scenario with proper escalation.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">6.4</span>
                          <div>
                            <strong className="text-primary">Parking & Storage:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Store your vehicles in garages when logging off. Vehicles left on streets may be impounded. Don't park in the middle of roads, on sidewalks, or blocking entrances. Use designated parking areas. Emergency vehicles always have right of way.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    {/* Section 7: Communication */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">🎤</span> 7. Communication Rules
                      </h3>
                      <p className="text-muted-foreground mb-4">Clear communication is essential for quality roleplay experiences.</p>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">7.1</span>
                          <div>
                            <strong className="text-primary">Microphone Required:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">A working microphone is mandatory. Text-only roleplay is not permitted except for mute characters (requires staff approval). Your microphone must be clear and free of excessive background noise. Test your audio before joining the server.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">7.2</span>
                          <div>
                            <strong className="text-primary">Push-to-Talk:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Push-to-talk is required at all times. Open mic with background noise, keyboard clicking, music, or conversations disrupts immersion for everyone. Make sure your PTT key is easily accessible and use it consistently.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">7.3</span>
                          <div>
                            <strong className="text-primary">In-Character Voice:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Maintain your character's voice consistently. Sudden voice changes, talking in third person, or using obvious voice changers (unless part of your character) breaks immersion. Your character can have an accent or speech pattern, but it should be consistent.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">7.4</span>
                          <div>
                            <strong className="text-primary">Radio & Phone Usage:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Radio and phone communications must be done with the appropriate item equipped. You cannot use radio while restrained, unconscious, or dead. Phone conversations should be roleplayed by physically using your phone. Radio channels are frequency-based and can be intercepted.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    {/* Section 8: Safe Zones */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">🏥</span> 8. Safe Zones & Protected Areas
                      </h3>
                      <p className="text-muted-foreground mb-4">Certain areas have special protections to ensure fair gameplay and prevent exploitation.</p>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="text-xl">8.1</span>
                          <div>
                            <strong className="text-primary">Hospital:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Pillbox Medical Center is a safe zone. No criminal activity, violence, or arrests inside the hospital. You may wait outside for someone to leave, but camping hospital exits for extended periods is prohibited. EMS are always protected while on hospital grounds.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="text-xl">8.2</span>
                          <div>
                            <strong className="text-primary">Police Station:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">MRPD and other police stations are protected zones. You cannot attack, shoot, or commit crimes on police station property. If you are being arrested, you cannot call for a rescue inside the station. Police station break-ins require admin approval and special circumstances.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="text-xl">8.3</span>
                          <div>
                            <strong className="text-primary">Spawn Areas:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">The area around spawn points (apartments, city hall) is protected. New players should not be robbed, harassed, or attacked within 5 minutes of spawning or within 200 meters of spawn points. Allow players time to establish themselves before engaging in conflict.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="text-xl">8.4</span>
                          <div>
                            <strong className="text-primary">Job Locations:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Active job sites (construction, fishing spots, farms) should not be camped for robberies. Allow players to complete their work activities. You can initiate roleplay, but constant harassment of working players is prohibited.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    {/* Section 9: EMS & Medical */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">🚑</span> 9. Emergency Services Rules
                      </h3>
                      <p className="text-muted-foreground mb-4">EMS and emergency personnel have special protections and responsibilities.</p>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">9.1</span>
                          <div>
                            <strong className="text-primary">EMS Protection:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Emergency Medical Services cannot be robbed, kidnapped, or killed while actively providing medical services. They are neutral parties focused on saving lives. Once they leave an active scene, normal rules apply, but targeting EMS specifically is discouraged.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">9.2</span>
                          <div>
                            <strong className="text-primary">Medical Roleplay:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">When injured, you must realistically roleplay your injuries. If you've been shot, you cannot immediately run or fight. Describe your wounds to EMS, allow them to treat you, and follow their instructions. Ignoring injuries or self-healing without proper items is powergaming.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">9.3</span>
                          <div>
                            <strong className="text-primary">Downed State:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">While downed, you cannot communicate locations, identify attackers, or give tactical information. You are in critical condition and barely conscious. Light groaning or one-word responses are acceptable. No calling out enemy positions or coordinating with allies.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    {/* Important Notes */}
                    <div className="p-5 border-2 border-primary/40 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mt-6">
                      <h4 className="font-bold text-primary mb-3 flex items-center gap-2 text-lg">
                        <span className="text-2xl">⚠️</span> Important Reminders
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span>📌</span>
                          <span><strong>Rule Intent:</strong> Staff reserve the right to interpret rules based on intent and context. Loopholes are not acceptable.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>📖</span>
                          <span><strong>Your Responsibility:</strong> Not knowing the rules is not an excuse. Read them thoroughly before playing.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🔄</span>
                          <span><strong>Rule Updates:</strong> Rules may change. Check Discord announcements regularly for updates.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>❓</span>
                          <span><strong>When In Doubt:</strong> Create a support ticket and ask staff before proceeding with questionable actions.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>⚖️</span>
                          <span><strong>Punishments:</strong> All punishments are at staff discretion based on severity, context, and history.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🎮</span>
                          <span><strong>Have Fun:</strong> Remember, we're all here to have fun and create stories together. Be the player you'd want to interact with!</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="tips" className="space-y-6">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scrollRevealVariants}
              >
                <Card className="glass-effect border-border/20">
                  <CardHeader>
                    <CardTitle className="text-2xl text-primary">💡 Roleplay Tips & Best Practices</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8 text-foreground/90">

                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">✨</span> Creating Quality Roleplay
                      </h3>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">🎭</span>
                          <span><strong>Show, Don't Tell:</strong> Instead of saying "I'm nervous", describe fidgeting, avoiding eye contact, or stuttering</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">🔍</span>
                          <span><strong>Add Details:</strong> Don't just walk into a store - describe how you walk, what you're wearing, your mood</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">😢</span>
                          <span><strong>React Realistically:</strong> Getting shot hurts. Losing money is upsetting. Show emotions!</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">🤲</span>
                          <span><strong>Give Others Opportunities:</strong> Leave room in your RP for others to contribute</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">🎯</span>
                          <span><strong>Embrace Failure:</strong> Losing, failing, or making mistakes creates great RP opportunities</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">👥</span> Building Relationships & Networks
                      </h3>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">📍</span>
                          <span><strong>Frequent Spots:</strong> Hang out at popular locations like Legion Square or coffee shops</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">📝</span>
                          <span><strong>Remember Details:</strong> Keep mental notes about characters you meet</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">📱</span>
                          <span><strong>Exchange Numbers:</strong> Get phone numbers to stay in touch</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">🏢</span>
                          <span><strong>Join Organizations:</strong> Gangs, businesses provide built-in RP connections</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">🎬</span> Advanced RP Techniques
                      </h3>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">🌟</span>
                          <span><strong>Unique Mannerisms:</strong> Quirks, habits, speech patterns that make your character memorable</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">📚</span>
                          <span><strong>Consistent Backstory:</strong> Know your character's history and reference it naturally</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">💔</span>
                          <span><strong>Play Flawed Characters:</strong> Addictions, fears, biases make characters interesting</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">🔥</span>
                          <span><strong>Slow Burn Storylines:</strong> Let plots develop over weeks, not hours</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">⚠️</span> Common Mistakes to Avoid
                      </h3>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-xl">👑</span>
                          <span><strong>Main Character Syndrome:</strong> Not everyone can be the toughest/richest. Be realistic</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-xl">🏆</span>
                          <span><strong>Winning Every Situation:</strong> Sometimes you lose fights or get arrested. That's okay!</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-xl">🙈</span>
                          <span><strong>Ignoring Others:</strong> Acknowledge people trying to RP with you, even if briefly</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-xl">💢</span>
                          <span><strong>Taking IC Personally:</strong> Your character's enemies aren't YOUR enemies. Separate IC from OOC</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-5 border-2 border-primary/40 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                      <h4 className="font-bold text-primary mb-3 flex items-center gap-2 text-lg">
                        <span className="text-2xl">🌟</span> Pro Tips from Veterans
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span>📓</span>
                          <span><strong>Document Your Story:</strong> Keep notes about your character's journey</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>👀</span>
                          <span><strong>Watch and Learn:</strong> Observe experienced roleplayers</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🎉</span>
                          <span><strong>Join Community Events:</strong> Server events create amazing RP opportunities</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>😊</span>
                          <span><strong>Have Fun!</strong> Remember this is a game. Enjoy the experience</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="gallery" className="space-y-6">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scrollRevealVariants}
              >
                <Card className="glass-effect border-border/20">
                  <CardHeader>
                    <CardTitle className="text-2xl text-primary flex items-center gap-3">
                      <span className="text-2xl">📸</span>
                      Community Gallery Guidelines
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 text-foreground/90">

                    <div className="p-4 border border-primary/30 rounded-lg bg-primary/5">
                      <p className="text-foreground/90 flex items-start gap-2">
                        <span className="text-xl">ℹ️</span>
                        <span>Our community gallery is a place to showcase your best SLRP moments, creative screenshots, and memorable roleplay scenes. Follow these guidelines to ensure a positive experience for everyone.</span>
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center gap-2">
                        <span className="text-xl">🛡️</span>
                        Content Standards
                      </h3>
                      <ul className="space-y-2 ml-4">
                        <li className="flex items-start gap-2 p-2 rounded-lg bg-card/30">
                          <span className="text-lg">📷</span>
                          <span><strong>Quality First:</strong> Submit clear, high-quality screenshots</span>
                        </li>
                        <li className="flex items-start gap-2 p-2 rounded-lg bg-card/30">
                          <span className="text-lg">✅</span>
                          <span><strong>Original Content:</strong> Only submit content you've captured yourself</span>
                        </li>
                        <li className="flex items-start gap-2 p-2 rounded-lg bg-card/30">
                          <span className="text-lg">👍</span>
                          <span><strong>Appropriate Content:</strong> No explicit, violent, or offensive imagery</span>
                        </li>
                        <li className="flex items-start gap-2 p-2 rounded-lg bg-card/30">
                          <span className="text-lg">🎮</span>
                          <span><strong>Relevant to SLRP:</strong> All submissions must be from the SLRP server</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center gap-2">
                        <span className="text-xl">💬</span>
                        Titles & Descriptions
                      </h3>
                      <ul className="space-y-2 ml-4">
                        <li className="flex items-start gap-2 p-2 rounded-lg bg-card/30">
                          <span className="text-lg">📝</span>
                          <span><strong>Descriptive Titles:</strong> Give your submission a meaningful title</span>
                        </li>
                        <li className="flex items-start gap-2 p-2 rounded-lg bg-card/30">
                          <span className="text-lg">📖</span>
                          <span><strong>Add Context:</strong> Use descriptions to share the story behind the screenshot</span>
                        </li>
                        <li className="flex items-start gap-2 p-2 rounded-lg bg-card/30">
                          <span className="text-lg">🗣️</span>
                          <span><strong>Appropriate Language:</strong> No profanity or offensive language</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center gap-2">
                        <span className="text-xl">❤️</span>
                        Community Interaction
                      </h3>
                      <ul className="space-y-2 ml-4">
                        <li className="flex items-start gap-2 p-2 rounded-lg bg-card/30">
                          <span className="text-lg">💝</span>
                          <span><strong>Respectful Comments:</strong> Keep comments positive and constructive</span>
                        </li>
                        <li className="flex items-start gap-2 p-2 rounded-lg bg-card/30">
                          <span className="text-lg">👋</span>
                          <span><strong>Credit Others:</strong> If other players are featured, mention them</span>
                        </li>
                        <li className="flex items-start gap-2 p-2 rounded-lg bg-card/30">
                          <span className="text-lg">👍</span>
                          <span><strong>Support Fellow Players:</strong> Like and engage with content you enjoy!</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center gap-2">
                        <span className="text-xl">🚫</span>
                        Prohibited Content
                      </h3>
                      <ul className="space-y-2 ml-4 text-destructive/90">
                        <li className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-lg">❌</span>
                          <span>Explicit or sexual content of any kind</span>
                        </li>
                        <li className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-lg">❌</span>
                          <span>Real-world violence, gore, or disturbing imagery</span>
                        </li>
                        <li className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-lg">❌</span>
                          <span>Racist, sexist, homophobic, or discriminatory content</span>
                        </li>
                        <li className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-lg">❌</span>
                          <span>Spam, advertisements, or promotional content</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-5 border-2 border-primary/40 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                      <h4 className="font-bold text-primary mb-3 flex items-center gap-2 text-lg">
                        <span className="text-2xl">📸</span> Pro Tips for Great Screenshots
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span>🎥</span>
                          <span>Use the in-game photo mode for cinematic shots</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🌅</span>
                          <span>Golden hour (sunrise/sunset) provides beautiful lighting</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>📐</span>
                          <span>Experiment with different camera angles</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🌧️</span>
                          <span>Weather effects like rain or fog add atmosphere</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex justify-center mt-6">
                      <Link 
                        to="/gallery" 
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-all hover:scale-105 shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                      >
                        <span className="text-lg">🖼️</span>
                        Visit the Gallery
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      </div>
    </TooltipProvider>
  );
};

export default Guides;
