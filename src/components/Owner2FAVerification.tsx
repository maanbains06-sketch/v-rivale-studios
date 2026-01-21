import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Owner2FAVerificationProps {
  userEmail: string;
  onVerified: () => void;
}

export const Owner2FAVerification = ({ userEmail, onVerified }: Owner2FAVerificationProps) => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const sendVerificationCode = async () => {
    setIsSendingCode(true);
    try {
      // Generate a 2FA token
      const { data, error } = await supabase.rpc('generate_owner_2fa_token');
      
      if (error) throw error;
      
      // In a real production app, you'd send this via email
      // For now, we'll show it in a toast (for demo purposes)
      setGeneratedToken(data);
      setCodeSent(true);
      toast.success('Verification code generated! Check below for your code.');
    } catch (error: any) {
      console.error('Error generating 2FA token:', error);
      toast.error('Failed to generate verification code');
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyCode = async () => {
    if (!token || token.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('verify_owner_2fa', { p_token: token });
      
      if (error) throw error;
      
      if (data) {
        // Store verified session in sessionStorage (persists until browser/tab close or logout)
        const { data: { user } } = await supabase.auth.getUser();
        sessionStorage.setItem('owner_2fa_verified', JSON.stringify({
          verified: true,
          userId: user?.id
        }));
        
        toast.success('Verification successful! Access granted.');
        onVerified();
      } else {
        toast.error('Invalid or expired code. Please try again.');
      }
    } catch (error: any) {
      console.error('Error verifying 2FA:', error);
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass-effect border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-gradient">
            Owner Verification Required
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            For security purposes, please verify your identity to access the Owner Panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!codeSent ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Sending code to:</p>
                  <p className="font-medium">{userEmail}</p>
                </div>
              </div>
              <Button 
                onClick={sendVerificationCode} 
                className="w-full"
                disabled={isSendingCode}
              >
                {isSendingCode ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating Code...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Send Verification Code
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Demo: Show generated token (in production, this would be sent via email) */}
              {generatedToken && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-2">Your verification code:</p>
                  <p className="text-3xl font-mono font-bold tracking-widest text-primary">
                    {generatedToken}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    This code expires in 10 minutes
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Enter 6-digit code</label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />
              </div>
              
              <Button 
                onClick={verifyCode} 
                className="w-full"
                disabled={isLoading || token.length !== 6}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Access Panel'
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={sendVerificationCode}
                className="w-full text-muted-foreground"
                disabled={isSendingCode}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
