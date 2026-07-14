import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wrench, Mail, Lock, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email();
const passwordSchema = z.string().min(6);

const Auth = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, signIn, signUp, loading: authLoading } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!emailSchema.safeParse(email).success) {
      newErrors.email = t('invalidEmail');
    }
    if (!passwordSchema.safeParse(password).success) {
      newErrors.password = t('passwordMin');
    }
    if (isSignUp && password !== confirmPassword) {
      newErrors.confirm = t('passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error(t('emailInUse'));
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success(t('accountCreated'));
          navigate('/workspaces');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error(t('invalidCredentials'));
          } else {
            toast.error(error.message);
          }
        } else {
          navigate('/');
        }
      }
    } catch {
      toast.error(t('genericError'));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" role="status">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#0a0c0f] flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-blue-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      {/* Back to landing */}
      <div className="relative px-4 pt-4 pt-[env(safe-area-inset-top)]">
        <button
          onClick={() => navigate('/landing')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors py-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t('home')}
        </button>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10 fade-in">
          <div className="w-20 h-20 rounded-3xl glass-card flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10">
            <Wrench className="w-10 h-10 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">ACP Tech Repair</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('appTagline')}</p>
        </div>

        {/* Form */}
        <div className="w-full max-w-sm scale-in">
          <div className="glass-dialog p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-medium text-foreground">
                {isSignUp ? t('createAccount') : t('loginTitle')}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 glass-input"
                    disabled={loading}
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1" role="alert">
                    <AlertCircle className="w-3 h-3" aria-hidden="true" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('password')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 glass-input"
                    disabled={loading}
                    aria-invalid={!!errors.password}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1" role="alert">
                    <AlertCircle className="w-3 h-3" aria-hidden="true" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm password (sign-up only) */}
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('confirmPassword')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="confirm"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-12 glass-input"
                      disabled={loading}
                      aria-invalid={!!errors.confirm}
                    />
                  </div>
                  {errors.confirm && (
                    <p className="text-xs text-destructive flex items-center gap-1" role="alert">
                      <AlertCircle className="w-3 h-3" aria-hidden="true" />
                      {errors.confirm}
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-sm font-medium"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-label={t('loading')} />
                ) : isSignUp ? (
                  t('signUp')
                ) : (
                  t('signIn')
                )}
              </Button>
            </form>

            {/* Toggle sign-in / sign-up */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={loading}
              >
                {isSignUp ? (
                  <>{t('alreadyAccount')} <span className="text-primary font-medium">{t('signIn')}</span></>
                ) : (
                  <>{t('noAccount')} <span className="text-primary font-medium">{t('signUp')}</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative py-6 text-center pb-[env(safe-area-inset-bottom)] space-y-1">
        <p className="text-xs text-muted-foreground">{t('authFooter')}</p>
        <p className="text-xs text-muted-foreground/60">
          <button
            onClick={() => navigate('/privacy')}
            className="underline hover:text-muted-foreground transition-colors"
          >
            {t('privacyPolicy')}
          </button>
          {' · '}© {new Date().getFullYear()} Animal Coat Production
        </p>
      </footer>
    </div>
  );
};

export default Auth;
