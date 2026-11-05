import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf, Mail, Lock, User, ArrowLeft, Phone, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useTx } from '@/lib/i18n';
import { lovable } from '@/integrations/lovable/index';

/** Same rule as the server: 0-prefix → 972, 00 dropped, 11–15 digits. */
export function normalizePhone(p: string) {
  let d = p.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '972' + d.slice(1);
  return d;
}

/** Only same-origin paths are allowed as post-login destinations. */
export function safeNext(raw: string | null, origin: string) {
  if (!raw) return '/';
  try {
    const u = new URL(raw, origin);
    if (u.origin !== origin) return '/';
    return u.pathname + u.search + u.hash;
  } catch { return '/'; }
}

const emailSchema = z.string().email();
const passwordSchema = z.string().min(6);

type AuthMode = 'email' | 'phone';
type PhoneStep = 'input' | 'otp';

const Auth = () => {
  const { t, dir } = useLanguage();
  const { user, signIn, signUp, signInWithOtp, verifyOtp, resetPassword, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Preserve the intended post-login destination (e.g. the OAuth consent URL).
  const next = safeNext(searchParams.get('next'), window.location.origin);
  const tx = useTx();
  const otpMsg = (code: string) => ({
    invalid_phone: tx({ ar: 'رقم الهاتف غير صالح', he: 'מספר טלפון לא תקין', en: 'Invalid phone number' }),
    invalid_input: tx({ ar: 'تحقق من البيانات', he: 'בדקו את הפרטים', en: 'Please check your input' }),
    wait: tx({ ar: 'انتظر دقيقة قبل طلب رمز جديد', he: 'המתינו דקה לפני בקשת קוד חדש', en: 'Wait a minute before requesting a new code' }),
    expired: tx({ ar: 'انتهت صلاحية الرمز، اطلب رمزًا جديدًا', he: 'הקוד פג תוקף, בקשו קוד חדש', en: 'The code expired, request a new one' }),
    too_many: tx({ ar: 'محاولات كثيرة، حاول لاحقًا', he: 'יותר מדי ניסיונות, נסו מאוחר יותר', en: 'Too many attempts, try again later' }),
    wrong_code: tx({ ar: 'الرمز غير صحيح', he: 'הקוד שגוי', en: 'Wrong code' }),
    send_failed: tx({ ar: 'تعذر إرسال الرمز عبر واتساب', he: 'שליחת הקוד בוואטסאפ נכשלה', en: 'Could not send the code on WhatsApp' }),
    whatsapp_not_connected: tx({ ar: 'تسجيل الدخول عبر واتساب غير مفعّل بعد', he: 'כניסה בוואטסאפ עדיין לא פעילה', en: 'WhatsApp sign-in is not set up yet' }),
  } as Record<string, string>)[code] ?? tx({ ar: 'حدث خطأ، حاول مجددًا', he: 'אירעה שגיאה, נסו שוב', en: 'Something went wrong, try again' });
  const goNext = () => {
    // Use a hard navigation so absolute paths like /.lovable/oauth/consent hit the router fresh.
    window.location.href = next;
  };

  const [isLogin, setIsLogin] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('phone');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('input');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      goNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

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
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast.error(error.message.includes('already registered') ? t('emailAlreadyUsed') : error.message);
        } else {
          toast.success(t('signupSuccess'));
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = normalizePhone(phoneNumber);
    if (digits.length < 11 || digits.length > 15) {
      toast.error(t('invalidPhone'));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signInWithOtp(phoneNumber);
      if (error) {
        toast.error(otpMsg(error.message));
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
      const { error } = await verifyOtp(phoneNumber, otpCode, fullName);
      if (error) {
        toast.error(error.message === 'invalid' ? t('invalidOtp') : otpMsg(error.message));
      } else {
        toast.success(t('loginSuccess'));
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

            {/* Google sign-in */}
            <button
              type="button"
              onClick={async () => {
                try { sessionStorage.setItem('auth_next', next); } catch { /* ignore */ }
                const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
                if (result.error) { toast.error(tx({ ar: 'تعذر تسجيل الدخول عبر Google', he: 'הכניסה עם Google נכשלה', en: 'Google sign-in failed' })); return; }
                if (result.redirected) return;
                goNext();
              }}
              className="w-full h-[44px] rounded-full flex items-center justify-center gap-[10px] px-[12px] border border-[#747775] bg-[#FFFFFF] text-[#1F1F1F] dark:bg-[#131314] dark:border-[#8E918F] dark:text-[#E3E3E3] text-[14px] leading-[20px] font-medium mb-[12px]"
            >
              <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
              {tx({ ar: 'المتابعة باستخدام Google', he: 'המשך עם Google', en: 'Continue with Google' })}
            </button>
            <div className="flex items-center gap-[8px] mb-[12px] text-[12px] text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              {tx({ ar: 'أو', he: 'או', en: 'or' })}
              <div className="flex-1 h-px bg-border" />
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
                  {t('whatsapp')}
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
                        className="text-[12px] text-primary hover:underline"
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
                  <p className="text-[12px] text-muted-foreground" dir="ltr">05XXXXXXXX</p>
                </div>
                <div className="space-y-[6px]">
                  <Label htmlFor="otpName" className="text-[13px] font-medium">{tx({ ar: 'الاسم (اختياري، لأول مرة)', he: 'שם (אופציונלי, בפעם הראשונה)', en: 'Name (optional, first time)' })}</Label>
                  <Input id="otpName" value={fullName} maxLength={100} autoComplete="name" onChange={(e) => setFullName(e.target.value)} className="h-[44px] text-[14px]" />
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
                  <p className="text-[12px] text-muted-foreground" dir="ltr">{phoneNumber}</p>
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
                  {tx({ ar: 'تغيير رقم الهاتف', he: 'שינוי מספר טלפון', en: 'Change phone number' })}
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
