import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Heart, Shield, BookOpen, Sparkles, Users, Trophy, Zap, Calendar } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="Our Story"
        description="Building India's most immersive and professional GTA 5 roleplay community"
        badge="About Skylife Roleplay India"
      />
      
      <main className="pb-16">
        <div className="container mx-auto px-4">

          {/* Story Section */}
          <div className="mb-20">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-2xl opacity-50"></div>
              <Card className="relative glass-effect border-border/20 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
                <CardContent className="p-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-4xl font-bold text-gradient">Our Story</h2>
                  </div>
                  <div className="space-y-6 text-muted-foreground leading-relaxed">
                    <p className="text-lg">
                      Skylife Roleplay India was founded in 2023 with a simple yet powerful vision: to create a roleplay server that combines professionalism, authenticity, and the rich cultural diversity of India. What started as a dream shared by a small group of passionate GTA 5 enthusiasts has grown into one of India&apos;s premier roleplay communities.
                    </p>
                    <p className="text-lg">
                      Our journey began when our founder, recognizing the lack of quality Indian roleplay servers, decided to build something different. We wanted to create a space where players could experience realistic roleplay scenarios while celebrating Indian culture, from the bustling streets of Mumbai to the tech hubs of Bangalore.
                    </p>
                    <p className="text-lg">
                      Today, Skylife Roleplay India stands as a testament to what a dedicated community can achieve. With over 750 active players, a professional staff team, and continuous development, we&apos;ve created an ecosystem where every player can find their place, whether they&apos;re a business owner, law enforcement officer, criminal mastermind, or everyday citizen.
                    </p>
                    <p className="text-lg">
                      Our server features custom-developed scripts tailored specifically for the Indian roleplay experience, including local businesses, authentic Indian vehicles, cultural events, and a dynamic economy that mirrors real-world scenarios. We&apos;re not just a server – we&apos;re a community that celebrates roleplay excellence.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Vision & Mission Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {/* Vision */}
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Card className="relative glass-effect border-border/20 h-full hover:border-primary/40 transition-all duration-500">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50"></div>
                <CardContent className="p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg"></div>
                      <div className="relative w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                        <Target className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gradient">Our Vision</h2>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    To become the gold standard for roleplay servers in India, setting benchmarks for quality, professionalism, and community engagement. We envision a thriving ecosystem where players from all backgrounds can come together to create unforgettable stories and experiences.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <p className="text-muted-foreground">Lead the Indian roleplay community with innovation and excellence</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <p className="text-muted-foreground">Foster a welcoming, diverse, and inclusive gaming environment</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <p className="text-muted-foreground">Continuously evolve with cutting-edge features and updates</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mission */}
            <div className="relative group">
              <div className="absolute inset-0 bg-secondary/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Card className="relative glass-effect border-border/20 h-full hover:border-secondary/40 transition-all duration-500">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-secondary/50"></div>
                <CardContent className="p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-secondary/20 rounded-full blur-lg"></div>
                      <div className="relative w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
                        <Zap className="w-8 h-8 text-secondary" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gradient">Our Mission</h2>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    To deliver an unparalleled roleplay experience through professional management, innovative features, and a passionate community. We strive to create a platform where creativity thrives, friendships are formed, and memorable stories are written every day.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-secondary mt-2"></div>
                      <p className="text-muted-foreground">Provide 24/7 professional support and moderation</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-secondary mt-2"></div>
                      <p className="text-muted-foreground">Develop custom features that enhance immersion and gameplay</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-secondary mt-2"></div>
                      <p className="text-muted-foreground">Build a respectful and engaging community culture</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Core Values */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gradient mb-4">Our Core Values</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                The principles that guide every decision we make and every action we take
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Card className="relative glass-effect border-border/20 text-center hover:border-primary/40 transition-all duration-300 h-full">
                  <CardContent className="pt-8 pb-6">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg"></div>
                      <Heart className="relative w-14 h-14 text-primary mx-auto group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Respect</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Treating every member with dignity, fostering a welcoming environment for all players regardless of background
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Card className="relative glass-effect border-border/20 text-center hover:border-primary/40 transition-all duration-300 h-full">
                  <CardContent className="pt-8 pb-6">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg"></div>
                      <Trophy className="relative w-14 h-14 text-primary mx-auto group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Excellence</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Striving for the highest quality in server performance, features, and community management
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Card className="relative glass-effect border-border/20 text-center hover:border-primary/40 transition-all duration-300 h-full">
                  <CardContent className="pt-8 pb-6">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg"></div>
                      <Shield className="relative w-14 h-14 text-primary mx-auto group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Integrity</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Maintaining fairness, transparency, and accountability in all our operations and decisions
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Card className="relative glass-effect border-border/20 text-center hover:border-primary/40 transition-all duration-300 h-full">
                  <CardContent className="pt-8 pb-6">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg"></div>
                      <Users className="relative w-14 h-14 text-primary mx-auto group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Community</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Building strong relationships and fostering collaboration among players, creating lasting friendships
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Commitment Section */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-3xl blur-3xl"></div>
            <div className="relative glass-effect rounded-3xl p-12 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 mb-6">
                  <Calendar className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-4xl font-bold text-gradient mb-4">Our Commitment to You</h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  We pledge to continuously improve and maintain the highest standards for our community
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                <div className="p-6 rounded-2xl bg-card/50 border border-border/20 hover:border-primary/40 transition-all duration-300">
                  <h3 className="font-bold text-lg mb-3 text-primary">Active Development</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Regular updates, new features, and continuous improvements to ensure the best gaming experience
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-card/50 border border-border/20 hover:border-primary/40 transition-all duration-300">
                  <h3 className="font-bold text-lg mb-3 text-primary">24/7 Support</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Round-the-clock staff availability to assist with issues, answer questions, and ensure fair gameplay
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-card/50 border border-border/20 hover:border-primary/40 transition-all duration-300">
                  <h3 className="font-bold text-lg mb-3 text-primary">Fair Management</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Transparent rules enforcement and unbiased decision-making in all administrative matters
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-card/50 border border-border/20 hover:border-primary/40 transition-all duration-300">
                  <h3 className="font-bold text-lg mb-3 text-primary">Community Voice</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Listening to player feedback and implementing suggestions that enhance the server experience
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-card/50 border border-border/20 hover:border-primary/40 transition-all duration-300">
                  <h3 className="font-bold text-lg mb-3 text-primary">Quality Roleplay</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Maintaining high standards for roleplay quality through clear guidelines and helpful staff guidance
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-card/50 border border-border/20 hover:border-primary/40 transition-all duration-300">
                  <h3 className="font-bold text-lg mb-3 text-primary">Safe Environment</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Zero tolerance for toxicity, harassment, or discrimination – creating a safe space for all players
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
