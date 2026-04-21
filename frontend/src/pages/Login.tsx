import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ChefHat, Mail, ArrowLeft, KeyRound, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  code: z.string().length(6, 'Code must be 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const resetCodeSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;
type ResetCodeFormData = z.infer<typeof resetCodeSchema>;

type ForgotStep = 'idle' | 'email' | 'code';

export default function Login() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const defaultTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const from = (location.state as { from?: string })?.from || '/customer/dashboard';

  // ─── Forgot Password State ─────────────────────────────────────────────────
  const [forgotStep, setForgotStep] = useState<ForgotStep>('idle');
  const [forgotEmail, setForgotEmail] = useState('');

  // ─── Register State ────────────────────────────────────────────────────────
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // ─── Forms ────────────────────────────────────────────────────────────────
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', name: '', phone: '', code: '', password: '', confirmPassword: '' },
  });

  const forgotEmailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const resetCodeForm = useForm<ResetCodeFormData>({
    resolver: zodResolver(resetCodeSchema),
    defaultValues: { code: '', newPassword: '', confirmPassword: '' },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast({ title: 'Welcome back!', description: 'You have successfully signed in.' });
        navigate(from);
      } else {
        toast({ title: 'Login failed', description: result.message, variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Request signup code
  const handleSendCode = async () => {
    const email = registerForm.getValues('email');
    const result = z.string().email().safeParse(email);
    if (!result.success) {
      registerForm.setError('email', { message: 'Valid email is required' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/request-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to send code');
      setCodeSent(true);
      setCountdown(120);
      toast({ title: 'Code sent!', description: `Check your inbox at ${email}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Complete registration
  const onCompleteRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const result = await register({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: 'customer',
        code: data.code,
      });
      if (result.success) {
        toast({ title: 'Account created!', description: 'Welcome to CaterConnect.' });
        navigate('/customer/dashboard');
      } else {
        toast({ title: 'Registration failed', description: result.message, variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Step 1: Send reset code
  const onSendResetCode = async (data: EmailFormData) => {
    setIsLoading(true);
    try {
      await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });
      setForgotEmail(data.email);
      setForgotStep('code');
      toast({ title: 'Reset code sent', description: `If an account exists, a code was sent to ${data.email}` });
    } catch {
      toast({ title: 'Error', description: 'Failed to send reset code', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Step 2: Reset password with code
  const onResetPassword = async (data: ResetCodeFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, code: data.code, newPassword: data.newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to reset password');
      toast({ title: 'Password reset!', description: 'You can now log in with your new password.' });
      setForgotStep('idle');
      resetCodeForm.reset();
      forgotEmailForm.reset();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render: Forgot Password Overlay ──────────────────────────────────────

  if (forgotStep !== 'idle') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <ChefHat className="h-10 w-10 text-primary" />
            <span className="font-display text-2xl font-semibold text-primary">CaterConnect</span>
          </Link>
          <Card className="shadow-premium">
            <CardHeader>
              <button
                onClick={() => { setForgotStep('idle'); resetCodeForm.reset(); forgotEmailForm.reset(); }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back to login
              </button>
              <CardTitle className="font-display text-2xl flex items-center gap-2">
                <KeyRound className="h-6 w-6 text-primary" />
                {forgotStep === 'email' ? 'Forgot Password' : 'Enter Reset Code'}
              </CardTitle>
              <CardDescription>
                {forgotStep === 'email'
                  ? 'Enter your email and we\'ll send a 6-digit reset code.'
                  : `Enter the code sent to ${forgotEmail} and your new password.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {forgotStep === 'email' ? (
                <Form {...forgotEmailForm}>
                  <form onSubmit={forgotEmailForm.handleSubmit(onSendResetCode)} className="space-y-4">
                    <FormField
                      control={forgotEmailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Sending...' : 'Send Reset Code'}
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...resetCodeForm}>
                  <form onSubmit={resetCodeForm.handleSubmit(onResetPassword)} className="space-y-4">
                    <FormField
                      control={resetCodeForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>6-Digit Code</FormLabel>
                          <FormControl>
                            <Input placeholder="123456" maxLength={6} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={resetCodeForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={resetCodeForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setForgotStep('email')}
                      className="flex w-full items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="h-3 w-3" /> Resend code
                    </button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Render: Main Login / Register ────────────────────────────────────────

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <ChefHat className="h-10 w-10 text-primary" />
            <span className="font-display text-2xl font-semibold text-primary">
              CaterConnect
            </span>
          </Link>

          <Card className="shadow-premium">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-2xl">Welcome</CardTitle>
              <CardDescription>
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                {/* ── LOGIN TAB ── */}
                <TabsContent value="login" className="mt-6">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="you@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="••••••••"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => setForgotStep('email')}
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign In'}
                      </Button>
                    </form>
                  </Form>

                  {/* Demo credentials — dev only */}
                  {import.meta.env.DEV && (
                    <div className="mt-6 rounded-lg bg-muted p-4">
                      <p className="text-sm font-medium mb-2">Demo Credentials:</p>
                      <p className="text-xs text-muted-foreground">
                        Customer: customer@demo.com / demo123
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* ── REGISTER TAB ── */}
                <TabsContent value="register" className="mt-6">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onCompleteRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="you@example.com" disabled={codeSent} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {!codeSent ? (
                        <Button type="button" className="w-full" disabled={isLoading} onClick={handleSendCode}>
                          {isLoading ? 'Sending...' : 'Send Verification Code'}
                        </Button>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xs text-muted-foreground">
                              Code sent to {registerForm.getValues('email')}
                            </span>
                            <button
                              type="button"
                              onClick={handleSendCode}
                              disabled={countdown > 0 || isLoading}
                              className="text-xs text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                            >
                              {countdown > 0 
                                ? `Resend in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}` 
                                : 'Resend Code'}
                            </button>
                          </div>

                          <FormField
                            control={registerForm.control}
                            name="code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Verification Code</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      placeholder="6-digit code"
                                      maxLength={6}
                                      className="tracking-widest text-lg font-bold pl-10"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone (Optional)</FormLabel>
                                <FormControl>
                                  <Input type="tel" placeholder="+251 911 234 567" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="absolute right-0 top-0 h-full px-3"
                                      onClick={() => setShowPassword(!showPassword)}
                                    >
                                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                  <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Creating account...' : 'Create Account'}
                          </Button>
                        </>
                      )}
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Are you a caterer?{' '}
                  <Link to="/vendor/login" className="text-primary hover:underline">
                    Sign up as a vendor
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block lg:flex-1">
        <div className="relative h-full">
          <img
            src="https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200"
            alt="Elegant catering setup"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
        </div>
      </div>
    </div>
  );
}
