import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ChefHat, Mail, Lock, User, Phone, Building2, Utensils, ArrowLeft, MapPin, Eye, EyeOff, KeyRound, RefreshCw, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ── Schemas ────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  businessName: z.string().min(2, 'Business name is required'),
  cuisineType: z.string().min(1, 'Primary cuisine is required'),
  location: z.string().min(2, 'Business location is required'),
  code: z.string().length(6, 'Code must be 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const forgotEmailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
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
type EmailFormData = z.infer<typeof forgotEmailSchema>;
type ResetCodeFormData = z.infer<typeof resetCodeSchema>;

type ForgotStep = 'idle' | 'email' | 'code';

export default function VendorLogin() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  // ── Register state ────────────────────────────────────────────────────
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // ── Forgot password state ─────────────────────────────────────────────
  const [forgotStep, setForgotStep] = useState<ForgotStep>('idle');
  const [forgotEmail, setForgotEmail] = useState('');

  // ── Forms ─────────────────────────────────────────────────────────────
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      name: '',
      phone: '',
      cuisineType: '',
      location: '',
      code: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false as any,
    },
  });

  const forgotEmailForm = useForm<EmailFormData>({
    resolver: zodResolver(forgotEmailSchema),
    defaultValues: { email: '' },
  });

  const resetCodeForm = useForm<ResetCodeFormData>({
    resolver: zodResolver(resetCodeSchema),
    defaultValues: { code: '', newPassword: '', confirmPassword: '' },
  });

  // ── Handlers ──────────────────────────────────────────────────────────

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const result = await login(data.email, data.password);

    if (result.success) {
      toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
      if (result.user?.role === 'vendor' && !result.user?.is_approved) {
        navigate('/vendor/pending');
      } else {
        navigate('/vendor/dashboard');
      }
    } else {
      toast({ title: 'Login failed', description: result.message, variant: 'destructive' });
    }
    setIsLoading(false);
  };

  // Step 1: Request signup verification code
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

  // Step 2: Complete registration with code + business details
  const onCompleteRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    const result = await register({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      role: 'vendor',
      code: data.code,
      businessName: data.name,
      location: data.location,
      cuisineType: data.cuisineType,
    });

    if (result.success) {
      toast({ title: 'Registration successful!', description: 'Your application is now pending approval.' });
      navigate('/vendor/pending');
    } else {
      toast({ title: 'Registration failed', description: result.message, variant: 'destructive' });
    }
    setIsLoading(false);
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

  // Forgot Step 2: Reset password
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

  // ── Render: Forgot Password Overlay ───────────────────────────────────

  if (forgotStep !== 'idle') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <Card className="border-primary/10 shadow-xl">
            <CardHeader>
              <button
                onClick={() => { setForgotStep('idle'); resetCodeForm.reset(); forgotEmailForm.reset(); }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back to login
              </button>
              <CardTitle className="text-2xl font-serif text-primary flex items-center gap-2">
                <KeyRound className="h-6 w-6 text-primary" />
                {forgotStep === 'email' ? 'Forgot Password' : 'Enter Reset Code'}
              </CardTitle>
              <CardDescription>
                {forgotStep === 'email'
                  ? "Enter your email and we'll send a 6-digit reset code."
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
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input type="email" placeholder="you@example.com" className="pl-10" {...field} />
                            </div>
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
                          <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
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
                          <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
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

  // ── Render: Main Login / Register ─────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card className="border-primary/10 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <ChefHat className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-serif text-primary">Vendor Portal</CardTitle>
            <CardDescription>
              Join CaterConnect as a catering partner
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Become a Partner</TabsTrigger>
              </TabsList>

              {/* ── LOGIN TAB ── */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="vendor@example.com" className="pl-10" {...field} />
                            </div>
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
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="pl-10"
                                {...field}
                              />
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

                    {import.meta.env.DEV && (
                      <p className="text-center text-sm text-muted-foreground">
                        Demo: vendor@demo.com / demo123
                      </p>
                    )}
                  </form>
                </Form>
              </TabsContent>

              {/* ── REGISTER TAB ── */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onCompleteRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input type="email" placeholder="business@example.com" className="pl-10" disabled={codeSent} {...field} />
                            </div>
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

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Business Name</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Your catering business name" className="pl-10" {...field} />
                                  </div>
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
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input type="tel" placeholder="+251 911..." className="pl-10" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>



                        <FormField
                          control={registerForm.control}
                          name="cuisineType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primary Cuisine</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Utensils className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input placeholder="e.g., Italian" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Location</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input placeholder="e.g., Addis Ababa, Bole" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
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
                                <FormLabel>Confirm</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={registerForm.control}
                          name="termsAccepted"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/30">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4 mt-1 cursor-pointer"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm cursor-pointer">
                                  I agree to the{' '}
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <button type="button" className="text-primary hover:underline font-medium inline">
                                        Terms and Policy
                                      </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                          <FileText className="h-5 w-5" />
                                          Terms and Policies
                                        </DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4 text-sm text-muted-foreground">
                                        <section>
                                          <h3 className="font-semibold text-foreground mb-2">1. Vendor Agreement</h3>
                                          <p>By registering as a vendor on CaterConnect, you agree to provide accurate business information and maintain the quality of services advertised on your profile.</p>
                                        </section>
                                        <section>
                                          <h3 className="font-semibold text-foreground mb-2">2. Service Standards</h3>
                                          <p>Vendors must respond to booking requests within 24 hours. Failure to maintain reasonable response times may result in account suspension.</p>
                                        </section>
                                        <section>
                                          <h3 className="font-semibold text-foreground mb-2">3. Content Guidelines</h3>
                                          <p>All menu items, images, and promotional content must accurately represent your services. Misleading content will be removed and may result in account termination.</p>
                                        </section>
                                        <section>
                                          <h3 className="font-semibold text-foreground mb-2">4. Payment & Fees</h3>
                                          <p>CaterConnect charges a commission on completed bookings. Payment terms and rates will be provided upon account approval.</p>
                                        </section>
                                        <section>
                                          <h3 className="font-semibold text-foreground mb-2">5. Data Privacy</h3>
                                          <p>Customer data obtained through bookings must be handled in accordance with applicable privacy laws and used solely for fulfilling catering services.</p>
                                        </section>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? 'Submitting...' : 'Submit Application'}
                        </Button>
                      </>
                    )}
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
