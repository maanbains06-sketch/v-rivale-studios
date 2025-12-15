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
            <TabsList className="grid w-full grid-cols-4 mb-8 glass-effect border border-primary/20 p-1.5 rounded-xl">
              <TabsTrigger value="character" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_15px_hsl(var(--primary)/0.3)] rounded-lg transition-all">
                <UserCircle2 className="w-4 h-4" />
                Character
              </TabsTrigger>
              <TabsTrigger value="rules" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_15px_hsl(var(--primary)/0.3)] rounded-lg transition-all">
                <BookOpen className="w-4 h-4" />
                Rules
              </TabsTrigger>
              <TabsTrigger value="tips" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_15px_hsl(var(--primary)/0.3)] rounded-lg transition-all">
                <AlertCircle className="w-4 h-4" />
                RP Tips
              </TabsTrigger>
              <TabsTrigger value="gallery" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_15px_hsl(var(--primary)/0.3)] rounded-lg transition-all">
                <Image className="w-4 h-4" />
                Gallery
              </TabsTrigger>
            </TabsList>

            <TabsContent value="character" className="space-y-6">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scrollRevealVariants}
              >
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20 p-8 mb-8 border border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.15)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-50"></div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl"></div>
                  <div className="relative z-10 text-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="inline-block mb-4"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
                        <UserCircle2 className="w-10 h-10 text-primary-foreground" />
                      </div>
                    </motion.div>
                    <h2 className="text-3xl md:text-4xl font-black mb-4 text-gradient">
                      Character Creation Masterclass
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      Your character is the vessel through which you experience Skylife. Create someone memorable, 
                      believable, and most importantly - someone you will enjoy playing for months to come.
                    </p>
                  </div>
                </div>

                {/* Step Cards Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* Step 1 */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="group"
                  >
                    <Card className="h-full glass-effect border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] card-hover">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform">
                            🌟
                          </div>
                          <div>
                            <span className="text-xs font-bold text-primary tracking-widest">STEP 01</span>
                            <CardTitle className="text-xl text-foreground">Creating Your Identity</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground text-sm">Your character is more than pixels - they are a living, breathing person with dreams, fears, and a past.</p>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                            <span className="text-xl">📖</span>
                            <div>
                              <strong className="text-primary">Origin Story</strong>
                              <p className="text-xs text-muted-foreground mt-1">Where were they born? What was their childhood like? What brought them to Los Santos? Every detail adds depth.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                            <span className="text-xl">💫</span>
                            <div>
                              <strong className="text-primary">Personality Matrix</strong>
                              <p className="text-xs text-muted-foreground mt-1">Are they introverted or extroverted? Trusting or suspicious? Calm or hot-headed? Define 3-5 core traits.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                            <span className="text-xl">🎯</span>
                            <div>
                              <strong className="text-primary">Goals & Dreams</strong>
                              <p className="text-xs text-muted-foreground mt-1">Short-term and long-term objectives. Maybe they want to own a business, find love, or escape their past.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                            <span className="text-xl">⚖️</span>
                            <div>
                              <strong className="text-primary">Flaws & Weaknesses</strong>
                              <p className="text-xs text-muted-foreground mt-1">Perfect characters are boring. Give them an addiction, a phobia, a temper, or a secret they are hiding.</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Step 2 */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="group"
                  >
                    <Card className="h-full glass-effect border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--secondary)/0.2)] card-hover">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-2xl shadow-lg shadow-secondary/25 group-hover:scale-110 transition-transform">
                            👔
                          </div>
                          <div>
                            <span className="text-xs font-bold text-secondary tracking-widest">STEP 02</span>
                            <CardTitle className="text-xl text-foreground">Visual Design</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground text-sm">Your appearance tells a story before you speak a word. Every scar, tattoo, and outfit choice matters.</p>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/10 border border-secondary/20 hover:bg-secondary/15 transition-colors">
                            <span className="text-xl">🎨</span>
                            <div>
                              <strong className="text-secondary">Match Your Background</strong>
                              <p className="text-xs text-muted-foreground mt-1">A wealthy businessman looks different from a street hustler. Let your appearance reflect your story.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/10 border border-secondary/20 hover:bg-secondary/15 transition-colors">
                            <span className="text-xl">👴</span>
                            <div>
                              <strong className="text-secondary">Age Appropriately</strong>
                              <p className="text-xs text-muted-foreground mt-1">If your character is 50, show it. Wrinkles, grey hair, and tired eyes tell stories of experience.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/10 border border-secondary/20 hover:bg-secondary/15 transition-colors">
                            <span className="text-xl">💀</span>
                            <div>
                              <strong className="text-secondary">Scars & History</strong>
                              <p className="text-xs text-muted-foreground mt-1">Physical marks can hint at past trauma, fights, or accidents. Each scar has a story to tell.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/10 border border-secondary/20 hover:bg-secondary/15 transition-colors">
                            <span className="text-xl">🛍️</span>
                            <div>
                              <strong className="text-secondary">Wardrobe Evolution</strong>
                              <p className="text-xs text-muted-foreground mt-1">Start humble. As your character grows wealthy, upgrade their style. Progression feels rewarding.</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Step 3 */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="group"
                  >
                    <Card className="h-full glass-effect border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--accent)/0.2)] card-hover">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center text-2xl shadow-lg shadow-accent/25 group-hover:scale-110 transition-transform">
                            🚀
                          </div>
                          <div>
                            <span className="text-xs font-bold text-accent tracking-widest">STEP 03</span>
                            <CardTitle className="text-xl text-foreground">Starting Your Journey</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground text-sm">Your first hours in Los Santos set the tone for your entire story. Make them count.</p>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/15 transition-colors">
                            <span className="text-xl">🏛️</span>
                            <div>
                              <strong className="text-accent">City Hall Registration</strong>
                              <p className="text-xs text-muted-foreground mt-1">Your first stop. Register as a citizen, get your ID, and officially exist in the city records.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/15 transition-colors">
                            <span className="text-xl">📱</span>
                            <div>
                              <strong className="text-accent">Get Connected</strong>
                              <p className="text-xs text-muted-foreground mt-1">Purchase a phone at the electronics store. Communication is essential for building connections.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/15 transition-colors">
                            <span className="text-xl">💼</span>
                            <div>
                              <strong className="text-accent">Find Employment</strong>
                              <p className="text-xs text-muted-foreground mt-1">Visit the job center. Start with honest work - delivery, taxi, fishing. Build your reputation first.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/15 transition-colors">
                            <span className="text-xl">🤝</span>
                            <div>
                              <strong className="text-accent">Make Connections</strong>
                              <p className="text-xs text-muted-foreground mt-1">Introduce yourself to people. The relationships you build early become the foundation of your story.</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Step 4 */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="group"
                  >
                    <Card className="h-full glass-effect border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] card-hover">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform">
                            🎪
                          </div>
                          <div>
                            <span className="text-xs font-bold text-primary tracking-widest">STEP 04</span>
                            <CardTitle className="text-xl text-foreground">Voice & Mannerisms</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground text-sm">How you speak and act brings your character to life. Consistency creates believability.</p>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                            <span className="text-xl">🗣️</span>
                            <div>
                              <strong className="text-primary">Develop a Voice</strong>
                              <p className="text-xs text-muted-foreground mt-1">Accent, pitch, speaking speed - these define how others perceive you. Practice your voice.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                            <span className="text-xl">🎭</span>
                            <div>
                              <strong className="text-primary">Signature Phrases</strong>
                              <p className="text-xs text-muted-foreground mt-1">Catchphrases, greetings, or verbal tics make you memorable. How does your character say goodbye?</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                            <span className="text-xl">🚶</span>
                            <div>
                              <strong className="text-primary">Physical Habits</strong>
                              <p className="text-xs text-muted-foreground mt-1">Do they smoke? Crack their knuckles? Check their phone constantly? Small details matter.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                            <span className="text-xl">😤</span>
                            <div>
                              <strong className="text-primary">Emotional Reactions</strong>
                              <p className="text-xs text-muted-foreground mt-1">How do they react to stress? Anger? Sadness? Prepare your emotional responses in advance.</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Pro Tips Section */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="glass-effect border-2 border-dashed border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.1)]">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border border-primary/30">
                          <span className="text-2xl">💡</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gradient">Pro Tips from Veteran Roleplayers</h3>
                          <p className="text-sm text-muted-foreground">Wisdom gathered from years of experience</p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 hover:border-primary/30 transition-all">
                          <span className="text-2xl mb-2 block">📓</span>
                          <strong className="text-foreground">Keep a Character Journal</strong>
                          <p className="text-xs text-muted-foreground mt-1">Document relationships, events, and character growth. It helps maintain consistency and creates amazing memories.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/20 hover:bg-secondary/10 hover:border-secondary/30 transition-all">
                          <span className="text-2xl mb-2 block">🎬</span>
                          <strong className="text-foreground">Watch RP Streams</strong>
                          <p className="text-xs text-muted-foreground mt-1">Learn from experienced roleplayers. Notice how they handle situations, develop characters, and create memorable moments.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 hover:bg-accent/10 hover:border-accent/30 transition-all">
                          <span className="text-2xl mb-2 block">🔄</span>
                          <strong className="text-foreground">Allow Character Growth</strong>
                          <p className="text-xs text-muted-foreground mt-1">Characters should evolve based on experiences. Trauma changes people. Success changes people. Let your character grow.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>

            <TabsContent value="rules" className="space-y-6">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scrollRevealVariants}
              >
                <Card className="glass-effect border-primary/20 shadow-[0_0_40px_hsl(var(--primary)/0.1)]">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                        <BookOpen className="w-7 h-7 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-gradient">Skylife Roleplay Server Rules</CardTitle>
                        <p className="text-muted-foreground mt-1">Please read all rules carefully before joining the server. Ignorance of rules is not an excuse.</p>
                      </div>
                    </div>
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

                    {/* Section 10: Police & Law Enforcement */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">👮</span> 10. Police & Law Enforcement Rules
                      </h3>
                      <p className="text-muted-foreground mb-4">Rules governing interactions with and conduct of law enforcement officers.</p>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">10.1</span>
                          <div>
                            <strong className="text-primary">Police Procedures:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Law enforcement officers must follow proper procedures including reading Miranda rights during arrests, establishing probable cause before searches, and using appropriate force escalation. Officers cannot shoot on sight unless there is an immediate threat to life. Verbal warnings must always come first when possible.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">10.2</span>
                          <div>
                            <strong className="text-primary">Corrupt Cop RP:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Corrupt police officer roleplay requires explicit staff approval before beginning. It must be subtle, story-driven, and cannot involve mass murder, terrorism, or helping criminals escape major crimes. Corruption should be discovered gradually through investigation, not obvious misconduct.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">10.3</span>
                          <div>
                            <strong className="text-primary">Arrest & Detention:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">When arrested, comply with officer instructions and roleplay accordingly. You have the right to remain silent, request a lawyer, and receive fair treatment. Maximum detention without charges is 30 minutes. If no charges are filed, you must be released. Police brutality without roleplay reason is prohibited.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">10.4</span>
                          <div>
                            <strong className="text-primary">Police Chases:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">During police pursuits, both parties must drive realistically. No driving into water to escape, no repeatedly ramming police vehicles, and no using unrealistic routes (off cliffs, through buildings). Spike strips can only be deployed with supervisor approval. Air support requires serious felony crimes.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">10.5</span>
                          <div>
                            <strong className="text-primary">Jail & Prison:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Jail sentences must be served unless reduced through roleplay (good behavior, lawyer negotiations). Maximum jail time is 60 minutes for most crimes. You can roleplay activities in jail. Prison breaks require 6+ officers online and staff approval. Logging off while in jail to avoid time is combat logging.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    {/* Section 11: Property & Business */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">🏠</span> 11. Property & Business Rules
                      </h3>
                      <p className="text-muted-foreground mb-4">Guidelines for property ownership, business operations, and real estate transactions.</p>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">11.1</span>
                          <div>
                            <strong className="text-primary">Home Invasions:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Breaking into player-owned properties requires the owner to be online and present (or recently present within 30 minutes). You cannot break into empty homes just to steal items. There must be roleplay reasoning such as ongoing conflict, debt collection, or investigation. Lock-picking takes time and makes noise.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">11.2</span>
                          <div>
                            <strong className="text-primary">Business Operations:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Business owners must operate their establishments realistically. Prices should be reasonable, employees must be paid fairly, and illegal activities from legitimate businesses require subtlety. Using a business purely as a front for crime without any legitimate operations is not allowed.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">11.3</span>
                          <div>
                            <strong className="text-primary">Property Camping:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Camping outside player properties waiting for them to exit is limited to 20 minutes. You cannot camp the same property repeatedly. If your target does not emerge, you must leave and return later. Staking out a location requires active roleplay reason, not just waiting to attack someone.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">11.4</span>
                          <div>
                            <strong className="text-primary">Storage & Stashing:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Items stored in properties and storage units are generally safe but can be seized during police raids with warrants. You cannot store unlimited illegal items - be realistic about what fits. Stash houses can be discovered through investigation roleplay. Always maintain some evidence trail for immersion.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    {/* Section 12: Streaming & Recording */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">📺</span> 12. Streaming & Recording Rules
                      </h3>
                      <p className="text-muted-foreground mb-4">Guidelines for content creators and protecting player privacy.</p>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">12.1</span>
                          <div>
                            <strong className="text-primary">Stream Sniping:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Watching a player's stream or video to gain information about their location, activities, or plans is strictly prohibited metagaming. This includes using stream information to hunt, avoid, or interfere with streamers. If caught stream sniping, you will face immediate permanent ban.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">12.2</span>
                          <div>
                            <strong className="text-primary">Streamer Protection:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Streamers are encouraged to use stream delays (minimum 3 minutes recommended). While we cannot guarantee complete protection, deliberately targeting streamers for content or harassment is punishable. Streamers should report suspected stream sniping with evidence.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">12.3</span>
                          <div>
                            <strong className="text-primary">Recording for Reports:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Players are encouraged to record their gameplay for reporting rule violations. Video evidence is the strongest form of proof in staff reports. However, you cannot reference recordings in-character or use them to threaten other players. Recordings are for out-of-character reports only.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">12.4</span>
                          <div>
                            <strong className="text-primary">Content Guidelines:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">When streaming or uploading content from the server, represent the community positively. Do not upload clips that show other players in a negative light without context. Toxic compilations, harassment montages, or content designed to shame other players will result in punishment.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    {/* Section 13: Economy & Trading */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">💰</span> 13. Economy & Trading Rules
                      </h3>
                      <p className="text-muted-foreground mb-4">Rules to maintain a balanced and fair in-game economy.</p>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">13.1</span>
                          <div>
                            <strong className="text-primary">No Real Money Trading (RMT):</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Trading in-game items, money, vehicles, or properties for real-world currency is strictly prohibited. This includes PayPal, cryptocurrency, gift cards, or any form of real payment. Both parties involved in RMT will be permanently banned. Report any RMT offers to staff immediately.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">13.2</span>
                          <div>
                            <strong className="text-primary">Money Transfers:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Large money transfers between characters must have roleplay justification. Gifting millions to new players or transferring wealth between your own characters without proper roleplay is not allowed. Business transactions, loans, and payments should be documented in-character.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">13.3</span>
                          <div>
                            <strong className="text-primary">Scamming Limits:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">In-character scamming is allowed but limited to reasonable amounts. Maximum scam value is ₹100,000 per incident. You cannot scam the same player repeatedly. New players (under 48 hours) cannot be scammed. All scams must have roleplay buildup - quick scams are considered FailRP.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">13.4</span>
                          <div>
                            <strong className="text-primary">Job Exploitation:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Using AFK methods, macros, or exploits to earn money from jobs is prohibited. You must actively roleplay your job activities. Farming jobs without any interaction or roleplay is not allowed. Job hopping (switching jobs repeatedly to maximize income) should be done realistically with time between changes.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">13.5</span>
                          <div>
                            <strong className="text-primary">Gambling:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">In-game gambling at designated locations is permitted. Private gambling games between players are allowed but must be fair with no rigged outcomes. Maximum bet per game is ₹50,000. Operating illegal gambling operations requires proper criminal roleplay setup.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    {/* Section 14: Combat & Conflict */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">⚔️</span> 14. Combat & Conflict Rules
                      </h3>
                      <p className="text-muted-foreground mb-4">Detailed guidelines for combat situations and player conflicts.</p>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">14.1</span>
                          <div>
                            <strong className="text-primary">Combat Initiation:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Before any combat, there must be clear verbal initiation giving the other party a chance to comply or respond. Simply pulling out a weapon is not enough. State your demands clearly: "Put your hands up or I will shoot" while aiming is proper initiation. The other party must have at least 3 seconds to react.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">14.2</span>
                          <div>
                            <strong className="text-primary">Third-Party Involvement:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">You can only join an active combat scenario if you have direct involvement or witness the initiation. Random players cannot join fights they stumble upon. If your friend is in a gunfight, you can only help if you were present from the beginning or if enemies shoot at you first. Maximum group size in combat is 6 players per side.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">14.3</span>
                          <div>
                            <strong className="text-primary">Weapon Restrictions:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Military-grade weapons (RPGs, miniguns, explosives) are restricted and require staff approval for use in scenarios. Automatic weapons should be rare and obtained through proper criminal roleplay. Carrying visible heavy weapons in public will attract police attention. Store weapons appropriately when not needed.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">14.4</span>
                          <div>
                            <strong className="text-primary">Combat Healing:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Using medical items during active combat must be roleplayed. You cannot instantly heal while being shot at. Find cover, roleplay bandaging or using first aid, and take appropriate time. Spamming healing items without roleplay is powergaming. Serious injuries require EMS attention, not just bandages.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">14.5</span>
                          <div>
                            <strong className="text-primary">Execution Rules:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Executing a downed player requires significant roleplay reason such as ongoing war, betrayal, or serious conflict. Random executions are not allowed. Give the downed player a chance to say final words. Execution should be meaningful story moments, not casual killings. Consider if execution truly serves the narrative.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    {/* Section 15: Looting Rules */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">🎒</span> 15. Looting Rules
                      </h3>
                      <p className="text-muted-foreground mb-4">Guidelines for looting players, NPCs, and locations to ensure fair and realistic roleplay.</p>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">15.1</span>
                          <div>
                            <strong className="text-primary">Robbery Requirements:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Before looting a player, you must have proper roleplay initiation such as holding them at gunpoint or subduing them. Simply running up and using inventory mechanics without roleplay is prohibited. Demand compliance verbally: "Empty your pockets!" or "Give me everything you have!" The victim must have time to comply before you take items.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">15.2</span>
                          <div>
                            <strong className="text-primary">Loot Limits:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">You may take a maximum of ₹75,000 cash, one weapon, and reasonable items (phone, drugs, valuables) per robbery. You cannot strip a player of all their possessions. Leave them with basic items to continue their roleplay. Taking keys to vehicles is allowed but you cannot steal more than one vehicle per robbery.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">15.3</span>
                          <div>
                            <strong className="text-primary">Body Looting (Downed Players):</strong>
                            <p className="text-sm mt-1 text-muted-foreground">You may loot downed or unconscious players only if you were directly involved in their incapacitation. Randomly looting bodies you find is not allowed unless there is ongoing conflict. You have a maximum of 2 minutes to loot before EMS may arrive. Do not loot the same player multiple times within 30 minutes.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">15.4</span>
                          <div>
                            <strong className="text-primary">Store & Business Robberies:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Robbing stores requires a minimum of 2 police officers online. You must hold the clerk at gunpoint and demand they open the register. Maximum take from convenience stores is ₹50,000. Banks and jewelry stores have higher requirements - check with staff for heist planning. Cooldown between store robberies is 30 minutes per person.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">15.5</span>
                          <div>
                            <strong className="text-primary">Vehicle Looting:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">You may search and loot vehicles only if you have legitimate access (owner permission, stolen keys, or lockpicking). Lockpicking takes 30 seconds minimum and must be roleplayed. Items found in trunks can be taken following standard loot limits. Police impound lots and mechanic garages cannot be looted under any circumstances.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">15.6</span>
                          <div>
                            <strong className="text-primary">Protected Items:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Certain items cannot be looted: government-issued IDs, police badges (from officers), EMS equipment, business keys (unless with staff approval), and whitelisted job items. Taking these items is powergaming. If you accidentally receive protected items, return them immediately and report to staff.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">15.7</span>
                          <div>
                            <strong className="text-primary">New Player Protection:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Players under 48 hours of playtime are protected from robbery. Check if someone appears new before robbing. If you accidentally rob a new player, return their items and apologize in-character. This rule exists to ensure new players have a positive first experience on the server.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">15.8</span>
                          <div>
                            <strong className="text-primary">Robbery Cooldowns:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">You cannot rob the same player more than once within 2 hours. Chain robbing (robbing multiple players in quick succession without roleplay) is prohibited. After a robbery, you should leave the area to allow the victim to recover. Targeting the same player repeatedly across days is considered harassment.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <span className="text-xl">15.9</span>
                          <div>
                            <strong className="text-blue-400">Police Department (PD) Looting - STRICTLY PROHIBITED:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Looting Police Department officers is <strong className="text-red-400">STRICTLY PROHIBITED</strong> under all circumstances. This includes but is not limited to: weapons, radios, handcuffs, tasers, badges, uniforms, vehicle keys, and any police equipment. The only exception is with explicit <strong className="text-yellow-400">Staff Approval</strong> for pre-approved specific roleplay scenarios that have been coordinated in advance.</p>
                            <p className="text-sm mt-2 text-muted-foreground"><strong className="text-green-400">Reporting Violations:</strong> If any player attempts to loot you or another PD officer, immediately report the incident to staff through the support ticket system. You must attach your body camera footage, recorded clips, or any video evidence clearly showing the violation. Include the suspect's in-game name, the time of incident, and a brief description of what occurred.</p>
                            <p className="text-sm mt-2 text-muted-foreground"><strong className="text-orange-400">Consequences:</strong> Any player caught attempting to loot PD officers without prior staff approval will face strict disciplinary action, including but not limited to: character wipes, temporary bans, or permanent removal from the server depending on the severity and frequency of violations. Repeat offenders will receive escalated punishments.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                          <span className="text-xl">15.10</span>
                          <div>
                            <strong className="text-red-400">EMS/Medical Looting - STRICTLY PROHIBITED:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Looting Emergency Medical Services (EMS) personnel is <strong className="text-red-400">STRICTLY PROHIBITED</strong> under all circumstances. This includes but is not limited to: medical supplies, radios, uniforms, ambulance keys, defibrillators, and any medical equipment. EMS are neutral parties who provide critical services to all players and must be allowed to perform their duties without interference. The only exception is with explicit <strong className="text-yellow-400">Staff Approval</strong> for pre-approved specific roleplay scenarios.</p>
                            <p className="text-sm mt-2 text-muted-foreground"><strong className="text-green-400">Reporting Violations:</strong> If any player attempts to loot you or another EMS personnel, immediately report the incident to staff through the support ticket system. Attach your body camera footage, recorded clips, or any video evidence showing the violation. Include the suspect's in-game name, time of incident, location, and a detailed description of what occurred.</p>
                            <p className="text-sm mt-2 text-muted-foreground"><strong className="text-orange-400">Consequences:</strong> Any player caught attempting to loot EMS personnel without prior staff approval will face strict disciplinary action, including character wipes, temporary bans, or permanent removal from the server. Camping hospitals or targeting EMS repeatedly is considered harassment and will result in escalated punishments.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <span className="text-xl">15.11</span>
                          <div>
                            <strong className="text-purple-400">Governor Kidnapping & Looting:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Kidnapping or looting the Governor is allowed but requires valid roleplay reasoning. The Governor is a high-profile target, so ensure your scenario has proper buildup and storyline. You may kidnap for ransom, political demands, or gang-related storylines. Looting is limited to personal belongings - government documents, official seals, and state property cannot be taken.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                          <span className="text-xl">15.12</span>
                          <div>
                            <strong className="text-indigo-400">Judge Kidnapping & Looting:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Judges may be kidnapped or looted with proper roleplay justification. Valid scenarios include witness intimidation storylines, case-related revenge, or organized crime operations. Avoid targeting judges during active court proceedings. You may loot personal items but court documents, legal files, and judicial robes are protected.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                          <span className="text-xl">15.13</span>
                          <div>
                            <strong className="text-cyan-400">DOJ (Department of Justice) Kidnapping & Looting:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">DOJ officials including prosecutors and district attorneys can be targeted with valid roleplay. Kidnapping for case-related leverage or criminal storylines is permitted. Looting is allowed for personal items and cash, but official case files, evidence, and DOJ credentials cannot be taken. Avoid disrupting ongoing trials without good reason.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <span className="text-xl">15.14</span>
                          <div>
                            <strong className="text-amber-400">Lawyer Kidnapping & Looting:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Lawyers may be kidnapped or looted during roleplay scenarios. Valid reasons include intimidating opposing counsel, obtaining information about clients, or personal vendettas. You may take personal belongings and cash. Client files and attorney-client privileged documents should not be used to metagame information.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <span className="text-xl">15.15</span>
                          <div>
                            <strong className="text-emerald-400">State Officials & Government Members:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">State officials including senators, representatives, and cabinet members may be targeted with proper roleplay. Political kidnappings, ransom demands, and looting are allowed with valid storylines. Personal items and cash can be looted, but official government property, state documents, and credentials should remain protected. Maintain realistic scenarios befitting political roleplay.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    {/* Section 16: Punishment Guidelines */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <span className="text-2xl">⚠️</span> 16. Punishment Guidelines
                      </h3>
                      <p className="text-muted-foreground mb-4">Understanding consequences for rule violations helps maintain server integrity.</p>
                      <ul className="space-y-3 ml-4">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <span className="text-xl">16.1</span>
                          <div>
                            <strong className="text-yellow-400">Verbal Warning:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">First-time minor offenses may result in a verbal warning with explanation. These are educational and give players a chance to correct behavior. Verbal warnings are logged and considered in future incidents. Examples: Minor FailRP, forgetting to stay in character, minor traffic violations.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <span className="text-xl">16.2</span>
                          <div>
                            <strong className="text-orange-400">Written Warning:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Moderate offenses or repeated minor violations result in official written warnings. Three written warnings may lead to temporary ban. Written warnings remain on your record permanently. Examples: Repeated FailRP, minor metagaming, poor roleplay quality consistently.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-orange-600/10 border border-orange-600/20">
                          <span className="text-xl">16.3</span>
                          <div>
                            <strong className="text-orange-500">Kick:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Immediate removal from the server for disruption or moderate rule breaks. You may rejoin after being kicked but must correct behavior. Multiple kicks lead to temporary bans. Examples: Mic spam, minor trolling, refusing staff instructions, causing drama.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                          <span className="text-xl">16.4</span>
                          <div>
                            <strong className="text-red-400">Temporary Ban:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Serious violations result in temporary bans ranging from 24 hours to 30 days depending on severity. Ban length increases with repeat offenses. Examples: RDM, VDM, combat logging, metagaming, powergaming, harassment. After ban expires, you are on probation for 30 days.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-red-700/10 border border-red-700/20">
                          <span className="text-xl">16.5</span>
                          <div>
                            <strong className="text-red-500">Permanent Ban:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">Reserved for the most serious offenses or repeated major violations. Permanent bans can be appealed after 30 days with a detailed appeal. Examples: Cheating/hacking, RMT, severe harassment, doxxing, threats, repeated major rule breaks, ban evasion. Some offenses are unappealable.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
                          <span className="text-xl">16.6</span>
                          <div>
                            <strong className="text-primary">Appeal Process:</strong>
                            <p className="text-sm mt-1 text-muted-foreground">All punishments can be appealed through Discord tickets. Appeals must include: what happened, why you believe the punishment was wrong, what you will do differently. Staff will review within 48-72 hours. Lying in appeals results in appeal denial and potential extended punishment. Stay respectful during appeals.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    {/* Important Notes */}
                    <div className="p-5 border-2 border-primary/40 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mt-6">
                      <h4 className="font-bold text-primary mb-3 flex items-center gap-2 text-lg">
                        <span className="text-2xl">📋</span> Important Reminders
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span>📌</span>
                          <span><strong>Rule Intent:</strong> Staff reserve the right to interpret rules based on intent and context. Finding loopholes is not acceptable and will be punished as if you broke the rule directly.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>📖</span>
                          <span><strong>Your Responsibility:</strong> Not knowing the rules is not an excuse. You agreed to follow all rules when you joined the server. Ignorance will not reduce punishments.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🔄</span>
                          <span><strong>Rule Updates:</strong> Rules may change at any time. Check Discord announcements regularly for updates. Continued play after updates implies acceptance of new rules.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>❓</span>
                          <span><strong>When In Doubt:</strong> Create a support ticket and ask staff before proceeding with questionable actions. It is better to ask and wait than to break rules accidentally.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>⚖️</span>
                          <span><strong>Fair Enforcement:</strong> All punishments are at staff discretion based on severity, context, player history, and intent. We aim to be fair and consistent.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🤝</span>
                          <span><strong>Community First:</strong> These rules exist to create a fun, immersive experience for everyone. Help us maintain this by reporting violations and being a positive community member.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🎮</span>
                          <span><strong>Have Fun:</strong> Remember, we are all here to have fun and create stories together. Be the player you would want to interact with. Respect breeds respect!</span>
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
                {/* RP Tips Hero */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20 p-8 mb-8 border border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.15)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-50"></div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl"></div>
                  <div className="relative z-10 text-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="inline-block mb-4"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
                        <AlertCircle className="w-10 h-10 text-primary-foreground" />
                      </div>
                    </motion.div>
                    <h2 className="text-3xl md:text-4xl font-black mb-4 text-gradient">
                      Roleplay Mastery Guide
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      Transform from a good roleplayer into a great one. These tips and techniques will elevate your storytelling and create unforgettable experiences.
                    </p>
                  </div>
                </div>

                {/* Main Tips Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* Quality RP Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="h-full glass-effect border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] card-hover">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl shadow-lg shadow-primary/25">
                            ✨
                          </div>
                          <CardTitle className="text-xl text-primary">Creating Quality Roleplay</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">🎭</span>
                            <div>
                              <strong className="text-primary">Show, Do Not Tell</strong>
                              <p className="text-xs text-muted-foreground mt-1">Instead of saying &quot;I am nervous&quot;, describe fidgeting with your hands, avoiding eye contact, or stuttering over your words. Actions speak louder.</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">🔍</span>
                            <div>
                              <strong className="text-primary">Add Rich Details</strong>
                              <p className="text-xs text-muted-foreground mt-1">Do not just walk into a store - describe your posture, glance at your outfit, mention the expression on your face. Small details create immersion.</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">😢</span>
                            <div>
                              <strong className="text-primary">React Realistically</strong>
                              <p className="text-xs text-muted-foreground mt-1">Getting shot hurts. Losing money is upsetting. Winning feels amazing. Show genuine emotional responses to events.</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">🤲</span>
                            <div>
                              <strong className="text-primary">Create Space for Others</strong>
                              <p className="text-xs text-muted-foreground mt-1">Leave room in your roleplay for others to contribute. Ask questions, pause for reactions, and build stories together.</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">🎯</span>
                            <div>
                              <strong className="text-primary">Embrace Failure</strong>
                              <p className="text-xs text-muted-foreground mt-1">Losing, failing, or making mistakes creates the best roleplay opportunities. Some of the best stories come from things going wrong.</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Building Networks Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="h-full glass-effect border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--secondary)/0.2)] card-hover">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-2xl shadow-lg shadow-secondary/25">
                            👥
                          </div>
                          <CardTitle className="text-xl text-secondary">Building Your Network</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 hover:bg-secondary/15 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">📍</span>
                            <div>
                              <strong className="text-secondary">Know the Hotspots</strong>
                              <p className="text-xs text-muted-foreground mt-1">Legion Square, Burger Shot, Yellow Jack, the pier - learn where people gather and spend time there. Organic meetings lead to great stories.</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 hover:bg-secondary/15 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">📝</span>
                            <div>
                              <strong className="text-secondary">Remember Everything</strong>
                              <p className="text-xs text-muted-foreground mt-1">Keep notes about characters you meet - their names, jobs, relationships. Referencing past interactions shows you care about the story.</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 hover:bg-secondary/15 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">📱</span>
                            <div>
                              <strong className="text-secondary">Stay Connected</strong>
                              <p className="text-xs text-muted-foreground mt-1">Exchange phone numbers with people you meet. Text between sessions. Build relationships that exist beyond random encounters.</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 hover:bg-secondary/15 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">🏢</span>
                            <div>
                              <strong className="text-secondary">Join Organizations</strong>
                              <p className="text-xs text-muted-foreground mt-1">Jobs, gangs, businesses - these provide built-in roleplay connections and storylines. You are never short of people to interact with.</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 hover:bg-secondary/15 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">🎉</span>
                            <div>
                              <strong className="text-secondary">Attend Events</strong>
                              <p className="text-xs text-muted-foreground mt-1">Community events, races, parties - these are goldmines for meeting new people and creating shared memories.</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Advanced Techniques Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="h-full glass-effect border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--accent)/0.2)] card-hover">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center text-2xl shadow-lg shadow-accent/25">
                            🎬
                          </div>
                          <CardTitle className="text-xl text-accent">Advanced Techniques</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/15 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">🌟</span>
                            <div>
                              <strong className="text-accent">Develop Unique Mannerisms</strong>
                              <p className="text-xs text-muted-foreground mt-1">A nervous laugh, a catchphrase, always adjusting glasses - small quirks make your character instantly recognizable and memorable.</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/15 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">📚</span>
                            <div>
                              <strong className="text-accent">Reference Your Past</strong>
                              <p className="text-xs text-muted-foreground mt-1">Naturally bring up past events, old friends, previous jobs. A character with history feels real and lived-in.</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/15 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">💔</span>
                            <div>
                              <strong className="text-accent">Play Flawed Characters</strong>
                              <p className="text-xs text-muted-foreground mt-1">Addictions, trauma, prejudices, insecurities - flaws create conflict, growth arcs, and deeply compelling stories.</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/15 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">🔥</span>
                            <div>
                              <strong className="text-accent">Slow Burn Stories</strong>
                              <p className="text-xs text-muted-foreground mt-1">Let plots develop over weeks, not hours. Romance, revenge, business empires - the best arcs take time to build.</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/15 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">🎲</span>
                            <div>
                              <strong className="text-accent">Embrace Randomness</strong>
                              <p className="text-xs text-muted-foreground mt-1">Sometimes flip a coin. Let chance decide outcomes. Unpredictability keeps roleplay fresh and surprising for everyone.</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Mistakes to Avoid Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="h-full glass-effect border-destructive/20 hover:border-destructive/40 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--destructive)/0.2)]">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-destructive to-destructive/70 flex items-center justify-center text-2xl shadow-lg shadow-destructive/25">
                            ⚠️
                          </div>
                          <CardTitle className="text-xl text-destructive">Common Mistakes</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 hover:bg-destructive/15 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">👑</span>
                            <div>
                              <strong className="text-destructive">Main Character Syndrome</strong>
                              <p className="text-xs text-muted-foreground mt-1">Not everyone can be the richest, toughest, or most connected. Be realistic about your place in the world. Supporting roles create great stories too.</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 hover:bg-destructive/15 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">🏆</span>
                            <div>
                              <strong className="text-destructive">Winning Every Situation</strong>
                              <p className="text-xs text-muted-foreground mt-1">Sometimes you lose fights. Sometimes you get arrested. Sometimes your plans fail. That is not just okay - it creates the best stories.</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 hover:bg-destructive/15 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">🙈</span>
                            <div>
                              <strong className="text-destructive">Ignoring Other Players</strong>
                              <p className="text-xs text-muted-foreground mt-1">Someone is trying to roleplay with you. Even if you are busy, acknowledge them. A quick response is better than being ignored.</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 hover:bg-destructive/15 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">💢</span>
                            <div>
                              <strong className="text-destructive">Breaking Character</strong>
                              <p className="text-xs text-muted-foreground mt-1">Staying in character through wins AND losses is the mark of a great roleplayer. OOC frustration should stay OOC.</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Pro Tips Section */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="border-2 border-dashed border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30">
                          <span className="text-3xl">🌟</span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Veteran Wisdom</h3>
                          <p className="text-sm text-muted-foreground">Insights from experienced roleplayers</p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-background/50 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors text-center">
                          <span className="text-3xl mb-3 block">📓</span>
                          <strong className="text-foreground block mb-1">Keep a Journal</strong>
                          <p className="text-xs text-muted-foreground">Document your journey. It helps with consistency and creates amazing memories to look back on.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-background/50 border border-teal-500/20 hover:border-teal-500/40 transition-colors text-center">
                          <span className="text-3xl mb-3 block">👀</span>
                          <strong className="text-foreground block mb-1">Watch and Learn</strong>
                          <p className="text-xs text-muted-foreground">Observe how veteran players handle situations. Watch RP streams. Learn from the best.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-background/50 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors text-center">
                          <span className="text-3xl mb-3 block">🎭</span>
                          <strong className="text-foreground block mb-1">Practice Voices</strong>
                          <p className="text-xs text-muted-foreground">Work on your character voice. Record yourself. A unique voice makes you instantly memorable.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-background/50 border border-green-500/20 hover:border-green-500/40 transition-colors text-center">
                          <span className="text-3xl mb-3 block">😊</span>
                          <strong className="text-foreground block mb-1">Have Fun!</strong>
                          <p className="text-xs text-muted-foreground">At the end of the day, this is a game. If you are not enjoying yourself, step back and reset.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>

            <TabsContent value="gallery" className="space-y-6">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scrollRevealVariants}
              >
                {/* Gallery Hero */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-900/40 via-pink-900/30 to-orange-900/40 p-8 mb-8 border border-rose-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-orange-500/5 opacity-50"></div>
                  <div className="relative z-10 text-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="inline-block mb-4"
                    >
                      <span className="text-7xl">📸</span>
                    </motion.div>
                    <h2 className="text-3xl md:text-4xl font-black mb-4 bg-gradient-to-r from-rose-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                      Community Gallery Guidelines
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      Our gallery is a showcase of the incredible moments, creativity, and artistry from our community. 
                      Follow these comprehensive guidelines to ensure your submissions are approved and celebrated.
                    </p>
                  </div>
                </div>

                {/* Main Guidelines Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* Content Standards Card */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="group"
                  >
                    <Card className="h-full glass-effect border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] card-hover">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform">
                            <Shield className="w-7 h-7 text-primary-foreground" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-primary tracking-widest">ESSENTIAL</span>
                            <CardTitle className="text-xl text-foreground">Content Standards</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-muted-foreground text-sm">All gallery submissions must meet these basic requirements to be considered.</p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                            <span className="text-xl">✨</span>
                            <div>
                              <strong className="text-primary">High Quality</strong>
                              <p className="text-xs text-muted-foreground mt-1">Clear, well-lit screenshots and videos. No blurry, pixelated, or poorly compressed content. Minimum 720p resolution required.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                            <span className="text-xl">🎨</span>
                            <div>
                              <strong className="text-primary">Original Content</strong>
                              <p className="text-xs text-muted-foreground mt-1">You must be the creator of all submitted content. No stolen, reposted, or AI-generated images will be accepted.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                            <span className="text-xl">🛡️</span>
                            <div>
                              <strong className="text-primary">Appropriate Content</strong>
                              <p className="text-xs text-muted-foreground mt-1">No nudity, excessive gore, hate symbols, real-world violence references, or any content that violates our community standards.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                            <span className="text-xl">🎮</span>
                            <div>
                              <strong className="text-primary">SLRP Content Only</strong>
                              <p className="text-xs text-muted-foreground mt-1">All submissions must be from Skylife Roleplay India server. Content from other servers, games, or platforms will be rejected.</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Titles & Descriptions Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="group"
                  >
                    <Card className="h-full glass-effect border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--secondary)/0.2)] card-hover">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-2xl shadow-lg shadow-secondary/25 group-hover:scale-110 transition-transform">
                            <MessageSquare className="w-7 h-7 text-primary-foreground" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-secondary tracking-widest">IMPORTANT</span>
                            <CardTitle className="text-xl text-foreground">Titles & Descriptions</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-muted-foreground text-sm">How you present your content matters as much as the content itself.</p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/10 border border-secondary/20 hover:bg-secondary/15 transition-colors">
                            <span className="text-xl">📝</span>
                            <div>
                              <strong className="text-secondary">Descriptive Titles</strong>
                              <p className="text-xs text-muted-foreground mt-1">Use clear, meaningful titles that describe the moment. Avoid generic titles like &quot;Cool pic&quot; or &quot;Screenshot 1&quot;. Example: &quot;Sunset over Legion Square&quot;</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/10 border border-secondary/20 hover:bg-secondary/15 transition-colors">
                            <span className="text-xl">📖</span>
                            <div>
                              <strong className="text-secondary">Tell the Story</strong>
                              <p className="text-xs text-muted-foreground mt-1">Add context in your description. What was happening? Who was there? What makes this moment special? Stories make images memorable.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/10 border border-secondary/20 hover:bg-secondary/15 transition-colors">
                            <span className="text-xl">🗣️</span>
                            <div>
                              <strong className="text-secondary">Respectful Language</strong>
                              <p className="text-xs text-muted-foreground mt-1">Keep titles and descriptions clean. No profanity, slurs, harassment, or offensive language. Be respectful of other players mentioned.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/10 border border-secondary/20 hover:bg-secondary/15 transition-colors">
                            <span className="text-xl">🏷️</span>
                            <div>
                              <strong className="text-secondary">Proper Categorization</strong>
                              <p className="text-xs text-muted-foreground mt-1">Select the correct category for your submission: Screenshots, Videos, Cinematic, Events, Vehicles, or Artwork.</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* What Gets Approved Card */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="group"
                  >
                    <Card className="h-full glass-effect border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--accent)/0.2)] card-hover">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center text-2xl shadow-lg shadow-accent/25 group-hover:scale-110 transition-transform">
                            <Heart className="w-7 h-7 text-primary-foreground" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-accent tracking-widest">BEST PRACTICES</span>
                            <CardTitle className="text-xl text-foreground">What Gets Approved</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-muted-foreground text-sm">These types of content are highly encouraged and will likely be featured.</p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/15 transition-colors">
                            <span className="text-xl">🌅</span>
                            <div>
                              <strong className="text-accent">Scenic & Cinematic Shots</strong>
                              <p className="text-xs text-muted-foreground mt-1">Beautiful landscapes, golden hour lighting, creative camera angles, and atmospheric moments that showcase the city.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/15 transition-colors">
                            <span className="text-xl">🎭</span>
                            <div>
                              <strong className="text-accent">Roleplay Moments</strong>
                              <p className="text-xs text-muted-foreground mt-1">Memorable RP scenes, emotional interactions, group activities, and story-driven moments that capture the essence of roleplay.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/15 transition-colors">
                            <span className="text-xl">🚗</span>
                            <div>
                              <strong className="text-accent">Vehicle Photography</strong>
                              <p className="text-xs text-muted-foreground mt-1">Well-composed car meets, custom rides, racing moments, and automotive artistry with good lighting and angles.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/15 transition-colors">
                            <span className="text-xl">🎉</span>
                            <div>
                              <strong className="text-accent">Community Events</strong>
                              <p className="text-xs text-muted-foreground mt-1">Server events, community gatherings, celebrations, and group photos that showcase our amazing community.</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* What Gets Rejected Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="group"
                  >
                    <Card className="h-full glass-effect border-destructive/20 hover:border-destructive/40 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--destructive)/0.2)] card-hover">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-destructive to-destructive/70 flex items-center justify-center text-2xl shadow-lg shadow-destructive/25 group-hover:scale-110 transition-transform">
                            <Flag className="w-7 h-7 text-destructive-foreground" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-destructive tracking-widest">AVOID</span>
                            <CardTitle className="text-xl text-foreground">What Gets Rejected</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-muted-foreground text-sm">These submissions will be automatically rejected. Repeated violations may result in gallery restrictions.</p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 hover:bg-destructive/15 transition-colors">
                            <span className="text-xl">📱</span>
                            <div>
                              <strong className="text-destructive">Phone Photos of Screens</strong>
                              <p className="text-xs text-muted-foreground mt-1">Never photograph your monitor. Use proper screenshot tools (F12, Steam overlay, OBS, or game capture software).</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 hover:bg-destructive/15 transition-colors">
                            <span className="text-xl">🐛</span>
                            <div>
                              <strong className="text-destructive">Bug Exploits & Glitches</strong>
                              <p className="text-xs text-muted-foreground mt-1">No screenshots showcasing bugs, exploits, or game-breaking glitches. Report bugs to staff instead of posting them.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 hover:bg-destructive/15 transition-colors">
                            <span className="text-xl">💀</span>
                            <div>
                              <strong className="text-destructive">Rule Violations</strong>
                              <p className="text-xs text-muted-foreground mt-1">No evidence of rulebreaking (RDM, VDM, metagaming, etc.). These should be reported, not celebrated in the gallery.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 hover:bg-destructive/15 transition-colors">
                            <span className="text-xl">🔄</span>
                            <div>
                              <strong className="text-destructive">Spam & Duplicates</strong>
                              <p className="text-xs text-muted-foreground mt-1">No mass uploads of similar shots. Select your best 2-3 from a session. Quality over quantity always wins.</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* File Requirements Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="glass-effect border-primary/20 mb-8 shadow-[0_0_30px_hsl(var(--primary)/0.1)]">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl shadow-lg shadow-primary/25">
                          📁
                        </div>
                        <CardTitle className="text-xl text-primary">File Requirements & Specifications</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center hover:bg-primary/15 transition-colors">
                          <span className="text-3xl block mb-3">🖼️</span>
                          <strong className="text-primary block mb-2">Image Files</strong>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Formats: JPG, PNG, WebP</p>
                            <p>Max Size: 10MB per file</p>
                            <p>Min Resolution: 1280x720</p>
                            <p>Recommended: 1920x1080+</p>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20 text-center hover:bg-secondary/15 transition-colors">
                          <span className="text-3xl block mb-3">🎬</span>
                          <strong className="text-secondary block mb-2">Video Files</strong>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Formats: MP4, WebM</p>
                            <p>Max Size: 50MB per file</p>
                            <p>Max Duration: 2 minutes</p>
                            <p>Recommended: 1080p 30fps+</p>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 text-center hover:bg-accent/15 transition-colors">
                          <span className="text-3xl block mb-3">⚠️</span>
                          <strong className="text-accent block mb-2">Not Accepted</strong>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>GIF files (static images only)</p>
                            <p>BMP, TIFF formats</p>
                            <p>Files over size limits</p>
                            <p>Corrupted or broken files</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Pro Tips Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                >
                  <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 mb-8 shadow-[0_0_40px_hsl(var(--primary)/0.1)]">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/30">
                          <span className="text-3xl">📸</span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gradient">Pro Screenshot Tips</h3>
                          <p className="text-sm text-muted-foreground">Master the art of in-game photography</p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-background/50 border border-primary/20 hover:border-primary/40 transition-colors text-center">
                          <span className="text-3xl mb-3 block">🎥</span>
                          <strong className="text-primary block mb-1">Use Photo Mode</strong>
                          <p className="text-xs text-muted-foreground">Pause the game and use the built-in photo mode for perfect compositions and camera control.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-background/50 border border-secondary/20 hover:border-secondary/40 transition-colors text-center">
                          <span className="text-3xl mb-3 block">🌅</span>
                          <strong className="text-secondary block mb-1">Golden Hour Magic</strong>
                          <p className="text-xs text-muted-foreground">Sunrise and sunset provide the most cinematic lighting. Plan your shots around these times.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-background/50 border border-accent/20 hover:border-accent/40 transition-colors text-center">
                          <span className="text-3xl mb-3 block">📐</span>
                          <strong className="text-accent block mb-1">Rule of Thirds</strong>
                          <p className="text-xs text-muted-foreground">Place subjects off-center for more dynamic and visually interesting compositions.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-background/50 border border-primary/20 hover:border-primary/40 transition-colors text-center">
                          <span className="text-3xl mb-3 block">🌧️</span>
                          <strong className="text-primary block mb-1">Weather Effects</strong>
                          <p className="text-xs text-muted-foreground">Rain, fog, and stormy weather add atmosphere and mood to your shots.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Review Process Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 }}
                >
                  <Card className="glass-effect border-primary/20 mb-8 shadow-[0_0_30px_hsl(var(--primary)/0.1)]">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl shadow-lg shadow-primary/25">
                          ⏱️
                        </div>
                        <CardTitle className="text-xl text-primary">Review Process & Timeline</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 text-primary font-bold">1</div>
                          <strong className="text-primary block mb-2">Submit</strong>
                          <p className="text-xs text-muted-foreground">Upload your content with a proper title and description.</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-secondary/10 border border-secondary/20 hover:bg-secondary/15 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-3 text-secondary font-bold">2</div>
                          <strong className="text-secondary block mb-2">Queue</strong>
                          <p className="text-xs text-muted-foreground">Your submission enters the moderation queue for review.</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/15 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3 text-accent font-bold">3</div>
                          <strong className="text-accent block mb-2">Review</strong>
                          <p className="text-xs text-muted-foreground">Staff reviews within 24-48 hours. You will be notified of the decision.</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 text-primary font-bold">4</div>
                          <strong className="text-primary block mb-2">Published</strong>
                          <p className="text-xs text-muted-foreground">Approved content goes live for the community to enjoy!</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* CTA Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                  className="text-center"
                >
                  <div className="inline-block p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 shadow-[0_0_40px_hsl(var(--primary)/0.15)]">
                    <span className="text-5xl block mb-4">🖼️</span>
                    <h3 className="text-2xl font-bold mb-2 text-gradient">Ready to Share Your Moments?</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">Follow these guidelines and become a featured contributor in our community gallery!</p>
                    <Link to="/gallery" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-primary/25">
                      <Image className="w-5 h-5" /> Visit the Gallery
                    </Link>
                  </div>
                </motion.div>
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
