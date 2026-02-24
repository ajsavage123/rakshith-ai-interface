import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock, Mail, Loader2 } from 'lucide-react';
import rakshithShield from "@/assets/rakshith360-shield.svg";
import { useToast } from '@/hooks/use-toast';

const LoginForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const { login, register, loading, resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err: unknown) {
      let errorMsg = '';
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const code = (err as { code: string }).code;
        if (code === 'auth/user-not-found') errorMsg = 'No user found with this email. Please register.';
        else if (code === 'auth/wrong-password') errorMsg = 'Incorrect password. Please try again.';
        else if (code === 'auth/email-already-in-use') errorMsg = 'This email is already in use.';
        else if (code === 'auth/invalid-email') errorMsg = 'Invalid email address format.';
        else if (code === 'auth/weak-password') errorMsg = 'Password should be at least 6 characters.';
        else errorMsg = 'An error occurred. Please try again.';
      } else if (err instanceof Error) {
        errorMsg = err.message;
      } else {
        errorMsg = 'An error occurred. Please try again.';
      }
      setError(errorMsg);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage('');
    setResetError('');
    try {
      await resetPassword(resetEmail);
      setResetMessage('Password reset email sent! Please check your inbox.');
    } catch (err: unknown) {
      setResetError('Failed to send password reset email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Subtle ambient background glows */}
      <div className="ambient-glow w-80 h-80 bg-primary/30 -top-40 -left-32" />
      <div className="ambient-glow w-72 h-72 bg-primary/20 -bottom-32 -right-36" />

      <Card className="w-full max-w-sm glass-card border-white/10 relative z-10 shadow-2xl shadow-primary/5">
        <CardHeader className="text-center pt-8">
          <div className="mx-auto mb-6 w-20 h-20 rounded-2xl flex items-center justify-center border border-primary/30 bg-gradient-to-br from-primary/25 to-primary/10">
            <img src={rakshithShield} alt="Rakshith360 Shield" className="w-12 h-12" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">
            Rakshith AI
          </CardTitle>
          <CardDescription className="text-muted-foreground/80 mt-2">
            Medical Guidance Assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <Tabs value={isLogin ? "login" : "register"} onValueChange={(value) => setIsLogin(value === "login")}>
            <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/8 rounded-lg p-1">
              <TabsTrigger value="login" className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-primary/15 data-[state=active]:border data-[state=active]:border-primary/30 rounded-md transition-all duration-200">Login</TabsTrigger>
              <TabsTrigger value="register" className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-primary/15 data-[state=active]:border data-[state=active]:border-primary/30 rounded-md transition-all duration-200">Register</TabsTrigger>
            </TabsList>

            {!showReset ? (
              <form onSubmit={handleSubmit} className="space-y-5 mt-8">
                {!isLogin && (
                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-muted-foreground/80">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground/60" />
                      <Input type="text" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} className="pl-12 bg-white/5 border border-white/8 text-foreground placeholder-muted-foreground/60 rounded-lg py-3 focus:border-primary/30 focus:outline-none transition-all duration-200" required={!isLogin} />
                    </div>
                  </div>
                )}
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-muted-foreground/80">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground/60" />
                    <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-12 bg-white/5 border border-white/8 text-foreground placeholder-muted-foreground/60 rounded-lg py-3 focus:border-primary/30 focus:outline-none transition-all duration-200" required />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-muted-foreground/80">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground/60" />
                    <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-12 bg-white/5 border border-white/8 text-foreground placeholder-muted-foreground/60 rounded-lg py-3 focus:border-primary/30 focus:outline-none transition-all duration-200" required />
                  </div>
                </div>
                {isLogin && (
                  <div className="text-right pt-2">
                    <button type="button" className="text-xs text-primary/80 hover:text-primary font-medium transition-colors" onClick={() => setShowReset(true)}>Forgot password?</button>
                  </div>
                )}
                {error && (
                  <div className="text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-center">{error}</div>
                )}
                <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 text-primary-foreground press-scale rounded-lg font-semibold py-3 shadow-lg shadow-primary/20 transition-all duration-200">
                  {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isLogin ? 'Signing in...' : 'Creating account...'}</>) : (isLogin ? 'Sign In' : 'Create Account')}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5 mt-8">
                <p className="text-sm text-muted-foreground/80">Enter your email address and we'll send you a password reset link.</p>
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-muted-foreground/80">Email Address</label>
                  <Input type="email" placeholder="your@email.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="bg-white/5 border border-white/8 text-foreground placeholder-muted-foreground/60 rounded-lg py-3 px-4 focus:border-primary/30 focus:outline-none transition-all duration-200" required />
                </div>
                {resetMessage && <div className="text-success bg-success/10 border border-success/20 rounded-lg px-4 py-3 text-sm text-center font-medium">{resetMessage}</div>}
                {resetError && <div className="text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-center font-medium">{resetError}</div>}
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground rounded-lg font-semibold py-3 press-scale transition-all duration-200" disabled={loading}>Send Reset Link</Button>
                  <Button type="button" variant="outline" className="flex-1 border border-white/10 text-foreground hover:bg-white/5 rounded-lg font-semibold py-3 press-scale transition-all duration-200" onClick={() => { setShowReset(false); setResetEmail(''); setResetMessage(''); setResetError(''); }}>Back</Button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-white/8 text-center">
              <p className="text-xs text-muted-foreground/70 leading-relaxed">
                Rakshith AI is an educational tool. Always consult qualified healthcare professionals for medical advice.
              </p>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
