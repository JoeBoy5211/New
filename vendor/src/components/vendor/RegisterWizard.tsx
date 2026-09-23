import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  User,
  Phone,
  Mail,
  Lock,
  Building2,
  Utensils,
  MapPin,
  FileUp,
  FileCheck2,
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  validateLicenceFile,
  uploadLicencePdf,
  formatBytes,
  MAX_LICENCE_BYTES,
} from '@/lib/licence';
import { isCloudinaryConfigured } from '@/lib/cloudinary';
import { uploadLogoToCloudinary } from '@/lib/logo';

const wizardSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    businessName: z.string().min(2, 'Business name is required'),
    cuisineType: z.string().min(1, 'Primary cuisine is required'),
    location: z.string().min(2, 'Business location is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type WizardFormData = z.infer<typeof wizardSchema>;

const STEPS = [
  { key: 'account', label: 'Account', fields: ['name', 'email', 'phone', 'password', 'confirmPassword'] as const },
  { key: 'business', label: 'Business', fields: ['businessName', 'cuisineType', 'location'] as const },
  { key: 'licence', label: 'Licence', fields: [] as const },
  { key: 'review', label: 'Review', fields: [] as const },
] as const;

export function RegisterWizard() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [licenceFile, setLicenceFile] = useState<File | null>(null);
  const [licenceError, setLicenceError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Local preview for the optional logo; revoked on change/unmount.
  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      businessName: '',
      cuisineType: '',
      location: '',
    },
  });

  const next = async () => {
    if (step === 2) {
      const err = validateLicenceFile(licenceFile);
      setLicenceError(err);
      if (err) return;
    } else {
      const fields = STEPS[step].fields as unknown as (keyof WizardFormData)[];
      if (fields.length > 0) {
        const ok = await form.trigger(fields);
        if (!ok) return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    const err = validateLicenceFile(file);
    setLicenceError(err);
    setLicenceFile(err ? null : file);
  };

  const pickLogo = (file: File | undefined) => {
    if (!file) return;
    // Lightweight client validation — full check happens at upload time.
    if (!file.type.startsWith('image/')) {
      setLogoError('Logo must be an image file (PNG, JPG, WEBP or SVG).');
      setLogoFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Logo is too large. Maximum is 5.0 MB.');
      setLogoFile(null);
      return;
    }
    setLogoError(null);
    setLogoFile(file);
  };

  const onSubmit = async (data: WizardFormData) => {
    const licenceErr = validateLicenceFile(licenceFile);
    if (licenceErr) {
      setLicenceError(licenceErr);
      setStep(2);
      return;
    }
    setIsSubmitting(true);
    const result = await register({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      role: 'vendor',
      businessName: data.businessName,
      cuisineType: data.cuisineType,
      location: data.location,
    });
    if (!result.success) {
      toast({ title: 'Registration failed', description: result.message, variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    // Account exists — attach the licence while we have a session. When
    // email confirmation is on there is no session yet; the Pending page
    // then asks for the upload to finish the application.
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && licenceFile) {
        await uploadLicencePdf(user.id, licenceFile);
        toast({ title: 'Application submitted!', description: 'Licence received — your application is pending approval.' });
      } else {
        toast({
          title: 'Almost done!',
          description: 'Verify your email, sign in, and attach your licence to finish the application.',
        });
      }
      // Optional logo — Cloudinary upload, URL saved on caterers.logo_url.
      // Best-effort: never blocks the application when Cloudinary or the
      // logo column migration isn't ready yet.
      if (user && logoFile) {
        try {
          if (!isCloudinaryConfigured()) throw new Error('Logo upload is not configured yet — you can add it from your dashboard later.');
          const logoUrl = await uploadLogoToCloudinary(logoFile);
          const { error: logoErr } = await supabase.from('caterers').update({ logo_url: logoUrl }).eq('vendor_id', user.id);
          if (logoErr) throw new Error('Logo uploaded but could not be saved yet — you can add it from your dashboard later.');
        } catch (logoE) {
          toast({
            title: 'Logo pending',
            description: logoE instanceof Error ? logoE.message : 'Logo upload failed; you can add it from your dashboard later.',
          });
        }
      }
    } catch (e) {
      toast({
        title: 'Account created — licence pending',
        description: e instanceof Error ? e.message : 'Licence upload failed; you can attach it on the next screen.',
      });
    }
    setIsSubmitting(false);
    navigate('/vendor/pending');
  };

  const values = form.watch();
  const reviewRows: [string, string][] = [
    ['Full name', values.name || '—'],
    ['Email', values.email || '—'],
    ['Phone', values.phone?.trim() ? values.phone : '—'],
    ['Business', values.businessName || '—'],
    ['Cuisine', values.cuisineType || '—'],
    ['Location', values.location || '—'],
  ];

  return (
    <div>
      {/* Stepper */}
      <ol className="mb-6 flex items-center" aria-label="Registration steps">
        {STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={s.key} className={cn('flex items-center', i < STEPS.length - 1 && 'flex-1')}>
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold transition-colors',
                    done && 'bg-primary text-primary-foreground',
                    current && 'bg-primary text-primary-foreground ring-4 ring-primary/15',
                    !done && !current && 'bg-muted text-muted-foreground',
                  )}
                  aria-current={current ? 'step' : undefined}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className={cn('text-[11px] font-medium', current ? 'text-foreground' : 'text-muted-foreground')}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('mx-2 mb-5 h-0.5 flex-1 rounded', i < step ? 'bg-primary' : 'bg-muted')} />
              )}
            </li>
          );
        })}
      </ol>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {step === 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
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
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="(555) 000-0000" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="business@example.com" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="password" render={({ field }) => (
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
                )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
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
                )} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <FormField control={form.control} name="businessName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Your catering business" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="cuisineType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Cuisine</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Utensils className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="e.g. Italian" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="City" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Business logo <span className="font-normal text-muted-foreground">(optional)</span></p>
                <div className="flex items-center gap-3">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/40">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml,image/*"
                      aria-label="Business logo (optional)"
                      onChange={(e) => {
                        pickLogo(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {logoFile ? `${logoFile.name} — ready` : 'Square PNG/JPG/WEBP/SVG up to 5 MB. Stored in Cloudinary.'}
                    </p>
                  </div>
                  {logoFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label="Remove logo file"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoError(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {logoError && <p className="text-sm font-medium text-destructive">{logoError}</p>}
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Business licence (PDF)</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Required for verification — PDF only, up to {formatBytes(MAX_LICENCE_BYTES)}.
                </p>
              </div>
              {!licenceFile ? (
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    pickFile(e.dataTransfer.files?.[0]);
                  }}
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
                    isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/40',
                  )}
                >
                  <FileUp className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Drop your licence here, or <span className="text-primary underline">browse files</span>
                  </span>
                  <span className="text-xs text-muted-foreground">PDF up to {formatBytes(MAX_LICENCE_BYTES)}</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    aria-label="Business licence PDF"
                    onChange={(e) => {
                      pickFile(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileCheck2 className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{licenceFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(licenceFile.size)} · PDF ready</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    aria-label="Remove licence file"
                    onClick={() => {
                      setLicenceFile(null);
                      setLicenceError(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {licenceError && <p className="text-sm font-medium text-destructive">{licenceError}</p>}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <dl className="divide-y divide-border rounded-xl border border-border">
                {reviewRows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="truncate font-medium">{value}</dd>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                  <dt className="text-muted-foreground">Licence</dt>
                  <dd className="flex min-w-0 items-center gap-1.5 font-medium">
                    <FileCheck2 className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{licenceFile?.name ?? 'Missing'}</span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                  <dt className="text-muted-foreground">Logo</dt>
                  <dd className="flex min-w-0 items-center gap-2 font-medium">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="h-6 w-6 rounded-full object-cover" />
                    ) : null}
                    <span className="truncate">{logoFile?.name ?? 'Optional — skip'}</span>
                  </dd>
                </div>
              </dl>
              <p className="text-center text-xs text-muted-foreground">
                By submitting you agree to admin approval. Monthly access is manual.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {step > 0 && (
              <Button type="button" variant="outline" className="flex-1" onClick={back} disabled={isSubmitting}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
            )}
            {step < 3 && (
              <Button type="button" className="flex-1" onClick={next}>
                Continue <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
            {step === 3 && (
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
