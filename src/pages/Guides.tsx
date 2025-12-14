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
                    <CardTitle className="text-2xl text-primary">📜 SLRP Server Rules</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8 text-foreground/90">
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">🎭</span> 1. General Roleplay Standards
                      </h3>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">🚫</span>
                          <span><RPTerm term="Fail RP" definition="Acting unrealistically or breaking immersion. Examples: jumping off buildings without injury, ignoring injuries, or performing superhuman feats." />: All roleplay must be realistic and believable. Acting in ways that break immersion or defy reality is prohibited.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">🎬</span>
                          <span><RPTerm term="Stay In Character (IC)" definition="Keeping all actions and conversations within your character's perspective. Never reference real-world events or use out-of-game knowledge." />: Keep all roleplay actions and conversations in character at all times.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">😨</span>
                          <span><RPTerm term="Fear RP" definition="Showing realistic fear and compliance when your life is threatened. You must act as you would in real life when faced with danger." />: Your character must value their life. Show realistic fear when threatened.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">❤️</span>
                          <span><RPTerm term="Value of Life" definition="Treating your character's life as irreplaceable. Avoid unnecessary risks and act with self-preservation in dangerous situations." />: Treat your character's life as precious. Avoid unnecessary risks.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">📈</span>
                          <span><strong>Character Development:</strong> Develop your character naturally over time. Instant wealth must be justified through RP.</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">⛔</span> 2. Prohibited Behaviors
                      </h3>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-xl">🧠</span>
                          <span><RPTerm term="Metagaming" definition="Using information your character wouldn't know (from Discord, streams, previous characters, or other sources) to gain an unfair advantage in roleplay." />: Using out-of-character information is strictly forbidden.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-xl">💪</span>
                          <span><RPTerm term="Powergaming" definition="Forcing roleplay outcomes on others without allowing them to react, or performing unrealistic actions that give you an unfair advantage." />: Forcing actions on other players is prohibited.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-xl">🔫</span>
                          <span><RPTerm term="Random Deathmatch (RDM)" definition="Killing or attacking another player without any valid roleplay reason or proper initiation of conflict." />: Killing without valid roleplay reason.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-xl">🚗</span>
                          <span><RPTerm term="Vehicle Deathmatch (VDM)" definition="Using your vehicle as a weapon to hit, ram, or kill players without proper roleplay justification and escalation." />: Using vehicles as weapons without proper RP.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-xl">🔌</span>
                          <span><RPTerm term="Combat Logging" definition="Logging out or disconnecting during active roleplay, especially during combat or to avoid arrest/consequences." />: Disconnecting during active roleplay.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-xl">🐛</span>
                          <span><strong>Exploiting/Glitching:</strong> Using game bugs or exploits is a bannable offense.</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">💀</span> 3. New Life Rule (NLR)
                      </h3>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🧹</span>
                          <span>If your character dies, you forget all events leading up to and including your death</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">⏱️</span>
                          <span>You cannot return to the location of your death for 15 minutes</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🚷</span>
                          <span>You cannot seek revenge on the people who caused your death</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🏥</span>
                          <span>Medical RP that results in revival means you retain memories but may have injuries/trauma</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">☠️</span>
                          <span>Permanent death scenarios must be approved by staff</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">🦹</span> 4. Criminal Roleplay
                      </h3>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🎭</span>
                          <span><strong>Crime Initiation:</strong> Provide high-quality roleplay before engaging in criminal activity.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🚔</span>
                          <span><RPTerm term="Cop Baiting" definition="Intentionally committing crimes or acting suspiciously in front of police just to provoke a chase or interaction without legitimate roleplay reason." />: Intentionally provoking police without proper RP reason is prohibited.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🏦</span>
                          <span><strong>Major Crimes:</strong> Bank robberies and prison breaks require 4+ LEO online and proper planning RP.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🙍</span>
                          <span><strong>Hostage RP:</strong> Must provide engaging RP for hostages. Don't use them solely as shields.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">⏰</span>
                          <span><strong>Crime Cooldowns:</strong> 30-minute cooldown between major crimes. 60 minutes for the same crime type.</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">🔥</span> 5. Gang Roleplay
                      </h3>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">👥</span>
                          <span><strong>Gang Formation:</strong> Official gangs require 5+ active members and staff approval.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🎨</span>
                          <span><strong>Gang Colors:</strong> Gangs must wear recognizable colors. Cannot claim colors already used.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🗺️</span>
                          <span><strong>Territory Control:</strong> Territories must be claimed through RP and staff approval.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">⚔️</span>
                          <span><strong>Rival Conflicts:</strong> Must initiate proper RP before engaging in gang wars. Minimum 3v3.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🤝</span>
                          <span><strong>Respect Boundaries:</strong> Cannot force non-gang members into gang conflicts.</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">👮</span> 6. Law Enforcement & Government
                      </h3>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">📋</span>
                          <span><RPTerm term="LEO" definition="Law Enforcement Officer - refers to police, sheriff, or any law enforcement role on the server." /> must follow proper procedures: Miranda rights, reasonable suspicion, probable cause</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🕵️</span>
                          <span>Corrupt cop RP requires staff approval and must be done carefully</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🚑</span>
                          <span><RPTerm term="EMS" definition="Emergency Medical Services - paramedics and medical personnel who respond to injuries and emergencies." /> cannot be taken hostage or harmed while providing medical services</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🏛️</span>
                          <span>Government officials must maintain professionalism and serve the community</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">🚙</span> 7. Vehicle & Traffic Rules
                      </h3>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🚦</span>
                          <span>Drive realistically - obey traffic laws unless in pursuit or fleeing</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🚫</span>
                          <span>No NOS/turbo in city limits (school zones, downtown)</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🏍️</span>
                          <span>Motorcycles cannot jump off mountains without RP reason</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🔧</span>
                          <span>Vehicle repairs must be done at mechanic shops</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">🎤</span> 8. Communication & Voice
                      </h3>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🎙️</span>
                          <span>Microphone required - text RP only allowed for mute characters with staff approval</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🔇</span>
                          <span>Push-to-talk required - no open mic or background noise</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">📞</span>
                          <span>Phone calls and radio require proper use of phone/radio prop</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30">
                          <span className="text-xl">🔊</span>
                          <span>No excessive yelling, ear-rape, or annoying sounds</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">💝</span> 9. Community Standards
                      </h3>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="text-xl">🤝</span>
                          <span><strong>Respect:</strong> Treat all players and staff with respect. Harassment results in immediate bans.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="text-xl">🚫</span>
                          <span><strong>Zero Tolerance:</strong> Racism, sexism, homophobia, and discrimination are not tolerated.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="text-xl">🔞</span>
                          <span><strong>Age Restriction:</strong> Must be 18+ to play. Mature themes are present.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="text-xl">📺</span>
                          <span><strong>Stream Sniping:</strong> Watching someone's stream to find them in-game is prohibited.</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="text-xl">⚖️</span>
                          <span><strong>Staff Decisions:</strong> Staff decisions are final. Appeals can be made through proper channels.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-5 border-2 border-primary/40 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mt-6">
                      <h4 className="font-bold text-primary mb-3 flex items-center gap-2 text-lg">
                        <span className="text-2xl">⚠️</span> Important Notes
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span>📌</span>
                          <span>Staff reserve the right to interpret and enforce rules based on intent and context</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>📖</span>
                          <span>Not knowing the rules is not an excuse - read them thoroughly before playing</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🔄</span>
                          <span>Rules are subject to change - check Discord announcements regularly</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>❓</span>
                          <span>When in doubt, create a ticket and ask staff before proceeding</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>⚖️</span>
                          <span>All punishments are at staff discretion based on severity and history</span>
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
