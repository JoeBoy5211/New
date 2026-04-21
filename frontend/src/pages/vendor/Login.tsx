import { useState } from 'react';
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
import { ChefHat, Mail, Lock, User, Phone, Building2, Utensils, ArrowLeft, MapPin, Eye, EyeOff, KeyRound, RefreshCw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ── Schemas ────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const registerDetailsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  businessName: z.string().min(2, 'Business name is required'),
  cuisineType: z.string().min(1, 'Primary cuisine is required'),
  location: z.string().min(2, 'Business location is required'),
  code: z.string().length(6, 'Code must be 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
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
type EmailFormData = z.infer<typeof emailSchema>;
type RegisterDetailsFormData = z.infer<typeof registerDetailsSchema>;
type ResetCodeFormData = z.infer<typeof resetCodeSchema>;

type RegisterStep = 'email' | 'details';
type ForgotStep = 'idle' | 'email' | 'code';

export default function VendorLogin() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  // ── Register state ────────────────────────────────────────────────────
  const [registerStep, setRegisterStep] = useState<RegisterStep>('email');
  const [registerEmail, setRegisterEmail] = useState('');

  // ── Forgot password state ─────────────────────────────────────────────
  const [forgotStep, setForgotStep] = useState<ForgotStep>('idle');
  const [forgotEmail, setForgotEmail] = useState('');

  // ── Forms ─────────────────────────────────────────────────────────────
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerEmailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const registerDetailsForm = useForm<RegisterDetailsFormData>({
    resolver: zodResolver(registerDetailsSchema),
    defaultValues: {
      name: '',
      phone: '',
      businessName: '',
      cuisineType: '',
      location: '',
      code: '',
      password: '',
      confirmPassword: '',
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
  const onRequestSignupCode = async (data: EmailFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/request-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to send code');
      setRegisterEmail(data.email);
      setRegisterStep('details');
      toast({ title: 'Code sent!', description: `Check your inbox at ${data.email}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Complete registration with code + business details
  const onCompleteRegister = async (data: RegisterDetailsFormData) => {
    setIsLoading(true);
    const result = await register({
      name: data.name,
      email: registerEmail,
      password: data.password,
      phone: data.phone,
      role: 'vendor',
      code: data.code,
      businessName: data.businessName,
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
                {registerStep === 'email' ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      First, enter your business email to receive a verification code.
                    </p>
                    <Form {...registerEmailForm}>
                      <form onSubmit={registerEmailForm.handleSubmit(onRequestSignupCode)} className="space-y-4">
                        <FormField
                          control={registerEmailForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input type="email" placeholder="business@example.com" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? 'Sending code...' : 'Send Verification Code'}
                        </Button>
                      </form>
                    </Form>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <button onClick={() => setRegisterStep('email')} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <p className="text-sm text-muted-foreground">
                        Code sent to <strong>{registerEmail}</strong>
                      </p>
                    </div>
                    <Form {...registerDetailsForm}>
                      <form onSubmit={registerDetailsForm.handleSubmit(onCompleteRegister)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerDetailsForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Your name" className="pl-10" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerDetailsForm.control}
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
                          control={registerDetailsForm.control}
                          name="businessName"
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
                          control={registerDetailsForm.control}
                          name="cuisineType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primary Cuisine</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Utensils className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input placeholder="e.g., Italian, Asian Fusion" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerDetailsForm.control}
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

                        <FormField
                          control={registerDetailsForm.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Verification Code</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="6-digit code from email"
                                  maxLength={6}
                                  className="tracking-widest text-center text-lg font-bold"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerDetailsForm.control}
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
                            control={registerDetailsForm.control}
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

                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? 'Submitting...' : 'Submit Application'}
                        </Button>

                        <p className="text-center text-xs text-muted-foreground">
                          By registering, you agree to our Terms of Service and will be subject to admin approval.
                        </p>
                      </form>
                    </Form>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
