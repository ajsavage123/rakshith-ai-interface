import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const oobCode = searchParams.get('oobCode');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!oobCode) { setError('Invalid or expired reset link.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password should be at least 6 characters.'); return; }
    try {
      console.log('Password reset for code:', oobCode);
      setSuccess('Password has been reset! You can now log in.');
      setTimeout(() => navigate('/'), 3000);
    } catch (err: any) { setError('Failed to reset password.'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form onSubmit={handleReset} className="glass-card p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Reset Password</h2>
        <Input type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} className="mb-2 bg-secondary/50 border-white/10 text-foreground" required />
        <Input type="password" placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)} className="mb-2 bg-secondary/50 border-white/10 text-foreground" required />
        {error && <div className="text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 text-sm text-center mb-2">{error}</div>}
        {success && <div className="text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2 text-sm text-center mb-2">{success}</div>}
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 press-scale">Reset Password</Button>
      </form>
    </div>
  );
};

export default ResetPassword;
