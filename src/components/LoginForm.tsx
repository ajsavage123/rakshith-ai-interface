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
      {/* Ambient background glows */}
      <div className="ambient-glow w-96 h-96 bg-primary -top-48 -left-48" />
      <div className="ambient-glow w-80 h-80 bg-primary -bottom-40 -right-40" />

      <Card className="w-full max-w-md glass-card border-white/10 relative z-10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(217 91% 60% / 0.2), hsl(217 91% 60% / 0.05))' }}>
            <img src={rakshithShield} alt="Rakshith360 Shield" className="w-10 h-10" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Rakshith AI
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Your Medical Assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "register"} onValueChange={(value) => setIsLogin(value === "login")}>
            <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
              <TabsTrigger value="login" className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-white/10">Login</TabsTrigger>
              <TabsTrigger value="register" className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-white/10">Register</TabsTrigger>
            </TabsList>

            {!showReset ? (
              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                {!isLogin && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="text" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 bg-secondary/50 border-white/10 text-foreground placeholder-muted-foreground" required={!isLogin} />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-secondary/50 border-white/10 text-foreground placeholder-muted-foreground" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-secondary/50 border-white/10 text-foreground placeholder-muted-foreground" required />
                  </div>
                </div>
                {isLogin && (
                  <div className="text-right">
                    <button type="button" className="text-xs text-primary hover:underline" onClick={() => setShowReset(true)}>Forgot Password?</button>
                  </div>
                )}
                {error && (
                  <div className="text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 text-sm text-center">{error}</div>
                )}
                <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground press-scale">
                  {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isLogin ? 'Signing in...' : 'Creating account...'}</>) : (isLogin ? 'Sign In' : 'Create Account')}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4 mt-6">
                <label className="text-sm font-medium text-muted-foreground block">Enter your email to reset password</label>
                <Input type="email" placeholder="Enter your email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="bg-secondary/50 border-white/10 text-foreground placeholder-muted-foreground" required />
                {resetMessage && <div className="text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2 text-xs text-center">{resetMessage}</div>}
                {resetError && <div className="text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 text-xs text-center">{resetError}</div>}
                <div className="flex gap-2">
                  <Button type="submit" className="w-full press-scale" disabled={loading}>Send Reset Email</Button>
                  <Button type="button" variant="outline" className="w-full border-white/10 text-foreground press-scale" onClick={() => { setShowReset(false); setResetEmail(''); setResetMessage(''); setResetError(''); }}>Cancel</Button>
                </div>
              </form>
            )}

            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Rakshith AI may provide inaccurate information if you don't provide precise details.
              </p>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
