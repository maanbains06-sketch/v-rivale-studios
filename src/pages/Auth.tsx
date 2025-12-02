import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { MessageCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async (session: Session | null) => {
      if (session?.user) {
        // Redirect authenticated users to whitelist
        navigate("/whitelist");
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        checkAuth(session);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkAuth(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleDiscordSignIn = async () => {
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth`,
      },
    });

    if (error) {
      toast({
        title: "Discord Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md glass-effect border-border/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-gradient mb-2">Join SLRP</CardTitle>
            <CardDescription>
              Sign in with Discord to start your roleplay journey
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <Button
              onClick={handleDiscordSignIn}
              disabled={loading || !!user}
              size="lg"
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white disabled:opacity-50"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {user ? "✓ Discord Connected - Redirecting..." : loading ? "Connecting..." : "Continue with Discord"}
            </Button>

            {user && (
              <Alert className="border-green-500/20 bg-green-500/10">
                <AlertDescription className="text-green-600 dark:text-green-400">
                  ✓ Account connected! Redirecting to whitelist...
                </AlertDescription>
              </Alert>
            )}
            
            <p className="text-sm text-muted-foreground text-center mt-4">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
