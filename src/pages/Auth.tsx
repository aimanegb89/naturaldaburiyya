import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf, Mail, Lock, User, ArrowLeft, Phone, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email();
const passwordSchema = z.string().min(6);

type AuthMode = 'email' | 'phone';
type PhoneStep = 'input' | 'otp';

const Auth = () => {
  const { t, dir } = useLanguage();
  const { user, signIn, signUp, signInWithOtp, verifyOtp, resetPassword, loading } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('email');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('input');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error(t('invalidEmail'));
      return;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast.error(t('passwordTooShort'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message.includes('Invalid login credentials') ? t('invalidCredentials') : error.message);
        } else {
          toast.success(t('loginSuccess'));
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast.error(error.message.includes('already registered') ? t('emailAlreadyUsed') : error.message);
        } else {
          toast.success(t('signupSuccess'));
          navigate('/');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) {
      toast.error(t('invalidPhone'));
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const { error } = await signInWithOtp(formattedPhone);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t('otpSent'));
        setPhoneStep('otp');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      toast.error(t('invalidOtp'));
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const { error } = await verifyOtp(formattedPhone, otpCode);
      if (error) {
        toast.error(t('invalidOtp'));
      } else {
        toast.success(t('loginSuccess'));
        navigate('/');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin w-[32px] h-[32px] border-[3px] border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col" dir={dir}>
      <div className="p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="gap-[6px] text-xs"
        >
          <ArrowLeft className="w-[16px] h-[16px]" />
          {t('backToHome')}
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-4">
        <div className="w-full max-w-sm">
          <div className="bg-surface-container-low rounded-2xl p-6 shadow-elevation-2">
            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-[48px] h-[48px] bg-primary rounded-xl flex items-center justify-center shadow-elevation-1 mb-[12px]">
                <Leaf className="w-[24px] h-[24px] text-primary-foreground" />
              </div>
              <h1 className="text-lg font-semibold text-primary">Natural</h1>
              <p className="text-xs text-muted-foreground mt-[4px]">
                {isLogin ? t('welcomeBack') : t('createAccount')}
              </p>
            </div>

            {/* Auth mode toggle (login only) */}
            {isLogin && (
              <div className="flex gap-[4px] mb-[16px] p-[3px] bg-surface-container-high rounded-full">
                <button
                  type="button"
                  onClick={() => { setAuthMode('email'); setPhoneStep('input'); }}
                  className={`flex-1 py-[6px] px-[10px] rounded-full text-xs font-medium transition-all duration-200 flex items-center justify-center gap-[4px] ${
                    authMode === 'email'
                      ? 'bg-primary text-primary-foreground shadow-elevation-1'
                      : 'text-foreground'
                  }`}
                >
                  <Mail className="w-[14px] h-[14px]" />
                  {t('email')}
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('phone'); setPhoneStep('input'); }}
                  className={`flex-1 py-[6px] px-[10px] rounded-full text-xs font-medium transition-all duration-200 flex items-center justify-center gap-[4px] ${
                    authMode === 'phone'
                      ? 'bg-primary text-primary-foreground shadow-elevation-1'
                      : 'text-foreground'
                  }`}
                >
                  <Phone className="w-[14px] h-[14px]" />
                  {t('phone')}
                </button>
              </div>
            )}

            {/* Email form */}
            {authMode === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-[6px]">
                    <Label htmlFor="fullName" className="text-xs font-medium">{t('fullName')}</Label>
                    <div className="relative">
                      <User className="absolute start-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder={t('enterFullName')}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="ps-[36px] h-[40px] text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-[6px]">
                  <Label htmlFor="email" className="text-xs font-medium">{t('email')}</Label>
                  <div className="relative">
                    <Mail className="absolute start-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('enterEmail')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="ps-[36px] h-[40px] text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-[6px]">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-medium">{t('password')}</Label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!email) { toast.error(t('invalidEmail')); return; }
                          const { error } = await resetPassword(email);
                          if (error) toast.error(error.message);
                          else toast.success(t('resetPassword') + ' — ' + email);
                        }}
                        className="text-[10px] text-primary hover:underline"
                      >
                        {t('resetPassword')}?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute start-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder={t('enterPassword')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="ps-[36px] h-[40px] text-sm"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" size="default" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="animate-spin w-[16px] h-[16px] border-2 border-primary-foreground border-t-transparent rounded-full" />
                  ) : (
                    isLogin ? t('login') : t('signup')
                  )}
                </Button>
              </form>
            )}

            {/* Phone form */}
            {authMode === 'phone' && phoneStep === 'input' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-[6px]">
                  <Label htmlFor="phone" className="text-xs font-medium">{t('phone')}</Label>
                  <div className="relative">
                    <Phone className="absolute start-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={t('enterPhone')}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="ps-[36px] h-[40px] text-sm"
                      dir="ltr"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">+972XXXXXXXXX</p>
                </div>

                <Button type="submit" className="w-full" size="default" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="animate-spin w-[16px] h-[16px] border-2 border-primary-foreground border-t-transparent rounded-full" />
                  ) : (
                    t('sendOtp')
                  )}
                </Button>
              </form>
            )}

            {/* OTP verification */}
            {authMode === 'phone' && phoneStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-[6px]">
                  <Label htmlFor="otp" className="text-xs font-medium">{t('otpCode')}</Label>
                  <div className="relative">
                    <Hash className="absolute start-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      placeholder={t('enterOtp')}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="ps-[36px] h-[40px] text-sm tracking-[0.3em]"
                      dir="ltr"
                      maxLength={6}
                      required
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground" dir="ltr">{phoneNumber}</p>
                </div>

                <Button type="submit" className="w-full" size="default" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="animate-spin w-[16px] h-[16px] border-2 border-primary-foreground border-t-transparent rounded-full" />
                  ) : (
                    t('verifyOtp')
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => { setPhoneStep('input'); setOtpCode(''); }}
                  className="w-full text-xs font-medium text-primary hover:underline transition-all"
                >
                  {t('changePassword')}
                </button>
              </form>
            )}

            {/* Toggle login / signup */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setAuthMode('email'); setPhoneStep('input'); }}
                className="text-xs font-medium text-primary hover:underline transition-all"
              >
                {isLogin ? t('noAccountSignup') : t('hasAccountLogin')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
