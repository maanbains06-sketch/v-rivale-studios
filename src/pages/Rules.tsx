import { CheckCircle2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerRules from "@/assets/header-rules.jpg";

const rulesSections = [
  {
    title: "General",
    color: "from-neon-cyan to-neon-purple",
    rules: [
      "Respect all players and staff members at all times",
      "No cheating, hacking, or exploiting bugs",
      "Use proper roleplay names and characters",
      "Stay in character at all times during gameplay",
      "Follow server admin instructions immediately",
    ],
  },
  {
    title: "Roleplay",
    color: "from-neon-purple to-neon-pink",
    rules: [
      "Value your character's life (No RDM/VDM)",
      "Follow realistic roleplay standards",
      "No power gaming or meta gaming",
      "Use in-game communication systems properly",
      "Communicate using voice chat only in roleplay",
    ],
  },
  {
    title: "Combat",
    color: "from-neon-pink to-neon-cyan",
    rules: [
      "Initiate proper RP before combat",
      "No combat logging during situations",
      "Respect NLR (New Life Rule) after respawn",
      "Wait for admin approval in major conflicts",
      "Use appropriate weapons for your character role",
    ],
  },
  {
    title: "Economy",
    color: "from-neon-cyan to-secondary",
    rules: [
      "No money glitching or exploits",
      "Follow realistic business practices",
      "Report suspicious transactions",
      "Maintain proper documentation for large deals",
      "Respect property ownership and boundaries",
    ],
  },
  {
    title: "Vehicles",
    color: "from-secondary to-neon-purple",
    rules: [
      "Drive realistically according to traffic laws",
      "No vehicle ramming without RP reason",
      "Use appropriate vehicles for your role",
      "Repair vehicles at designated locations",
      "Report stolen vehicles to authorities",
    ],
  },
  {
    title: "Community",
    color: "from-neon-purple to-neon-cyan",
    rules: [
      "Be helpful to new players",
      "Report rule violations to staff",
      "Participate in community events",
      "Provide constructive feedback",
      "Maintain a positive gaming environment",
    ],
  },
];

const Rules = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="Server Rules"
        description="Follow these rules to ensure a fair and enjoyable experience for everyone"
        backgroundImage={headerRules}
        pageKey="rules"
      />
      
      <main className="pb-16">
        <div className="container mx-auto px-4">
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {rulesSections.map((section, index) => (
              <div
                key={section.title}
                className="glass-effect rounded-xl p-6 hover:scale-105 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`inline-block bg-gradient-to-r ${section.color} px-4 py-1 rounded-full mb-4`}>
                  <h2 className="text-xl font-bold text-background">{section.title}</h2>
                </div>
                <ul className="space-y-3">
                  {section.rules.map((rule) => (
                    <li key={rule} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground text-sm">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="glass-effect rounded-xl p-8 text-center animate-fade-in">
            <p className="text-lg text-foreground">
              Breaking these rules may result in warnings, kicks, or permanent bans.
            </p>
            <p className="text-muted-foreground mt-2">
              Staff decisions are final. Appeal bans through our Discord server.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Rules;
