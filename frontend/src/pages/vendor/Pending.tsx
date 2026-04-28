import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Clock, CheckCircle2, FileText, Phone, Mail, ArrowLeft, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function VendorPending() {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState<'loading' | 'pending' | 'rejected'>('loading');

  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.id) return;
      try {
        const response = await api.get(`/vendor/dashboard/${user.id}`);
        // If we get a successful response, the caterer profile still exists → pending
        if (response.success) {
          setStatus('pending');
        } else {
          // Profile no longer exists → rejected
          setStatus('rejected');
        }
      } catch {
        setStatus('rejected');
      }
    };
    checkStatus();
  }, [user?.id]);

  const steps = [
    {
      icon: FileText,
      title: 'Application Submitted',
      description: 'Your application has been received',
      status: 'complete',
    },
    {
      icon: Clock,
      title: 'Under Review',
      description: 'Our team is reviewing your details',
      status: 'current',
    },
    {
      icon: CheckCircle2,
      title: 'Approval',
      description: "You'll be notified once approved",
      status: 'pending',
    },
  ];

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Checking application status...</p>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <Card className="border-red-200 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-serif text-red-600">
                Application Not Approved
              </CardTitle>
              <CardDescription className="text-base">
                Unfortunately, your vendor application was not approved at this time.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-red-50 border border-red-100 rounded-lg p-6">
                <h3 className="font-semibold text-red-900 mb-3">What this means</h3>
                <ul className="space-y-2 text-sm text-red-700">
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    Your vendor application was reviewed and did not meet our current requirements.
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    You may re-apply after addressing any issues with your submitted documents.
                  </li>
                </ul>
              </div>

              <div className="border-t pt-6">
                <p className="text-center text-sm text-muted-foreground mb-4">
                  Have questions? Contact our partner support team.
                </p>
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

              <div className="flex gap-4 justify-center pt-2">
                <Button variant="outline" onClick={logout}>Sign Out</Button>
                <Button asChild>
                  <Link to="/vendor/login">Re-apply</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card className="border-primary/10 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-10 w-10 text-amber-600" />
            </div>
            <CardTitle className="text-2xl font-serif text-primary">
              Application Pending
            </CardTitle>
            <CardDescription className="text-base">
              Thank you for applying to become a CaterConnect partner, {user?.businessName || user?.name || 'Partner'}!
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Progress Steps */}
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
                        className={`absolute top-6 left-12 w-full h-0.5 ${
                          step.status === 'complete' ? 'bg-primary/50' : 'bg-muted'
                        }`}
                        style={{ width: 'calc(100% + 2rem)' }}
                      />
                    )}
                  </div>
                  <h4 className="mt-3 font-medium text-sm">{step.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                </div>
              ))}
            </div>

            {/* Info Box */}
            <div className="bg-secondary/50 rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-3">What happens next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  Our team will review your business details within 1-2 business days
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  We may contact you for additional information if needed
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  Once approved, you'll receive an email with next steps
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  You can then set up your profile and start receiving bookings
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="border-t pt-6">
              <p className="text-center text-sm text-muted-foreground mb-4">
                Have questions? We're here to help.
              </p>
              <div className="flex justify-center gap-6">
                <a
                  href="mailto:partners@caterconnect.com"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  partners@caterconnect.com
                </a>
                <a
                  href="tel:+15551234567"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  (555) 123-4567
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center pt-4">
              <Button variant="outline" onClick={logout}>
                Sign Out
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
