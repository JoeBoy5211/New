import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { ensureVendorSetup, useVendorCaterer } from '@/hooks/supabase/useCaterers';
import { Clock, CheckCircle2, FileText, Phone, Mail, ArrowLeft, Ban, RefreshCw } from 'lucide-react';

export default function VendorPending() {
  const { user, profile, logout } = useAuth();
  const { data: caterer, isLoading, refetch, isFetching } = useVendorCaterer(user?.id);

  useEffect(() => {
    if (user?.id && !isLoading && !caterer) {
      ensureVendorSetup(user.id).then(() => refetch());
    }
  }, [user?.id, isLoading, caterer, refetch]);

  useEffect(() => {
    const t = setInterval(() => refetch(), 15000);
    return () => clearInterval(t);
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (caterer?.is_approved && !caterer?.is_pending) {
    return <Navigate to="/vendor/dashboard" replace />;
  }

  const isSuspended = caterer && !caterer.is_approved && !caterer.is_pending;

  const steps = [
    { icon: FileText, title: 'Application Submitted', description: 'Your application has been received', status: 'complete' },
    {
      icon: isSuspended ? Ban : Clock,
      title: isSuspended ? 'Suspended' : 'Under Review',
      description: isSuspended ? 'Access paused — contact admin (e.g. monthly payment)' : 'Our team is reviewing your details',
      status: 'current',
    },
    { icon: CheckCircle2, title: 'Approval', description: "You'll get access once approved", status: 'pending' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card className="border-primary/10 shadow-xl">
          <CardHeader className="text-center">
            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isSuspended ? 'bg-red-100' : 'bg-amber-100'}`}>
              {isSuspended ? <Ban className="h-10 w-10 text-red-600" /> : <Clock className="h-10 w-10 text-amber-600" />}
            </div>
            <CardTitle className="text-2xl font-serif text-primary">
              {isSuspended ? 'Account Suspended' : 'Application Pending'}
            </CardTitle>
            <CardDescription className="text-base">
              {isSuspended
                ? `Hi ${profile?.name || 'Partner'}, your store "${caterer?.name}" is currently offline. Please contact admin about your monthly access.`
                : `Thank you for applying, ${profile?.name || 'Partner'}! Your store "${caterer?.name || '...'}" is waiting for admin approval.`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <div key={step.title} className="flex-1 flex flex-col items-center text-center">
                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        step.status === 'complete'
                          ? 'bg-primary/20 text-primary'
                          : step.status === 'current'
                          ? 'bg-accent/20 text-accent animate-pulse'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <step.icon className="h-6 w-6" />
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`absolute top-6 left-12 w-full h-0.5 ${step.status === 'complete' ? 'bg-primary/50' : 'bg-muted'}`}
                        style={{ width: 'calc(100% + 2rem)' }}
                      />
                    )}
                  </div>
                  <h4 className="mt-3 font-medium text-sm">{step.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-secondary/50 rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-3">What happens next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  Our team will review your business details within 1-2 business days
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  Once approved you get full access to manage your store, images and menus
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  Monthly access is manual — if you miss payment admin can suspend you
                </li>
              </ul>
            </div>

            <div className="border-t pt-6">
              <p className="text-center text-sm text-muted-foreground mb-4">Have questions? We&apos;re here to help.</p>
              <div className="flex justify-center gap-6">
                <a href="mailto:partners@caterconnect.com" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Mail className="h-4 w-4" />
                  partners@caterconnect.com
                </a>
                <a href="tel:+15551234567" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Phone className="h-4 w-4" />
                  (555) 123-4567
                </a>
              </div>
            </div>

            <div className="flex gap-4 justify-center pt-4">
              <Button variant="outline" onClick={logout}>Sign Out</Button>
              <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                Check status
              </Button>
              <Button asChild>
                <Link to="/">Browse Caterers</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
