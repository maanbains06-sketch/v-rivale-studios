import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import SpinWheel from "@/components/spin/SpinWheel";
import { Shield, Gift, Headphones, Clock, AlertTriangle, Info, ExternalLink } from "lucide-react";

const REGULATIONS = [
  {
    icon: <Gift className="w-5 h-5 text-emerald-400 shrink-0" />,
    title: "Automatic Delivery",
    description: "Most prizes (Cash, Clothing, Mission Skip) are automatically credited to your in-game account. No action needed!",
  },
  {
    icon: <Headphones className="w-5 h-5 text-cyan-400 shrink-0" />,
    title: "Didn't Receive Your Prize?",
    description: (
      <>
        If your prize wasn't delivered within 24 hours, contact our staff team at{" "}
        <a
          href="https://skyliferoleplay.com/support"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline underline-offset-2 font-semibold transition-colors"
        >
          skyliferoleplay.com/support
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </>
    ),
  },
  {
    icon: <Clock className="w-5 h-5 text-amber-400 shrink-0" />,
    title: "48-Hour Cooldown",
    description: "Each player can spin once every 48 hours. The cooldown timer will show your next available spin.",
  },
  {
    icon: <Shield className="w-5 h-5 text-violet-400 shrink-0" />,
    title: "Fair Play Policy",
    description: "Using alt accounts or exploiting the spin system will result in a permanent ban. All spins are logged and monitored.",
  },
  {
    icon: <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />,
    title: "Staff-Claimed Prizes",
    description: "Vehicles, Mystery Boxes, Name Changes & Discount Coupons require manual delivery. Contact staff via support to claim.",
  },
  {
    icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
    title: "Results Are Final",
    description: "All spin outcomes are randomly generated and final. No re-spins, refunds, or exchanges will be granted.",
  },
];

const Spin = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="Spin & Win"
        description="Try your luck and win amazing rewards"
        pageKey="spin"
      />
      
      <main className="pb-16">
        <div className="container mx-auto px-4 flex flex-col items-center">
          
          {/* Regulations Banner */}
          <div className="w-full max-w-3xl mb-10">
            <div
              className="relative overflow-hidden rounded-2xl border border-cyan-500/20"
              style={{
                background: "linear-gradient(135deg, rgba(6,14,26,0.95) 0%, rgba(12,31,56,0.9) 50%, rgba(6,14,26,0.95) 100%)",
                boxShadow: "0 0 40px rgba(0,200,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              {/* Decorative top accent */}
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />

              <div className="px-6 py-5">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <Shield className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wide" style={{ textShadow: "0 0 12px rgba(0,229,255,0.3)" }}>
                      Spin & Win Regulations
                    </h3>
                    <p className="text-xs text-muted-foreground">Please read before spinning</p>
                  </div>
                </div>

                {/* Rules Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {REGULATIONS.map((reg, i) => (
                    <div
                      key={i}
                      className="flex gap-3 p-3.5 rounded-xl border border-white/5 transition-colors hover:border-cyan-500/15"
                      style={{
                        background: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(0,229,255,0.02) 100%)",
                      }}
                    >
                      <div className="mt-0.5">{reg.icon}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white/90 mb-0.5">{reg.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{reg.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom accent */}
              <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
            </div>
          </div>

          <SpinWheel />
        </div>
      </main>
    </div>
  );
};

export default Spin;
