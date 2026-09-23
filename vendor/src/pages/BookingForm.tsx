import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, Package as PackageIcon, Utensils } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCatererDetail } from '@/hooks/supabase/usePublicCaterers';
import { useCreateBooking } from '@/hooks/supabase/useBookings';

const FALLBACK_EVENT_TYPES = ['Wedding', 'Corporate', 'Birthday', 'Private Party', 'Anniversary', 'Other'];

function toISODatePlusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function BookingForm() {
  const { id: catererId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: detail, isLoading } = useCatererDetail(catererId);
  const createBooking = useCreateBooking();

  const packages = useMemo(() => detail?.packages ?? [], [detail]);
  const menuItems = useMemo(() => detail?.menuItems ?? [], [detail]);
  const eventTypes = useMemo(() => {
    const fromCaterer = (detail?.event_types ?? []).filter(Boolean);
    return fromCaterer.length > 0 ? fromCaterer : FALLBACK_EVENT_TYPES;
  }, [detail]);

  const [eventDate, setEventDate] = useState(toISODatePlusDays(7));
  const [eventTime, setEventTime] = useState('18:00');
  const [eventType, setEventType] = useState(eventTypes[0] ?? 'Wedding');
  const [guestCount, setGuestCount] = useState(String(detail?.min_guests ?? 20));
  const [venue, setVenue] = useState('');
  const [contactName, setContactName] = useState(profile?.name ?? '');
  const [contactPhone, setContactPhone] = useState(profile?.phone ?? '');
  const [special, setSpecial] = useState('');
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<string[]>([]);

  const [dateTouched, setDateTouched] = useState(false);
  useMemo(() => {
    if (!dateTouched && detail) setGuestCount(String(detail.min_guests ?? 20));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail]);

  const total = useMemo(() => {
    const pkgTotal = packages.filter((p) => selectedPackages.includes(p.id)).reduce((s, p) => s + Number(p.price), 0);
    const menuTotal = menuItems.filter((m) => selectedMenu.includes(m.id)).reduce((s, m) => s + Number(m.price), 0);
    return pkgTotal + menuTotal;
  }, [packages, menuItems, selectedPackages, selectedMenu]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner size={40} text="Loading booking form..." />
        </div>
      </MainLayout>
    );
  }

  if (!detail) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold">Caterer Not Found</h1>
          <Button className="mt-4" asChild>
            <Link to="/caterers">Browse All Caterers</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const toggle = (arr: string[], id: string, setter: (v: string[]) => void) => {
    setter(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      toast({ title: 'Sign in required', description: 'Please sign in as a customer to send a booking request.', variant: 'destructive' });
      navigate('/login', { state: { from: `/caterer/${catererId}/book` } });
      return;
    }
    if (!catererId) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      toast({ title: 'Invalid date', description: 'Use YYYY-MM-DD.', variant: 'destructive' });
      return;
    }
    if (eventDate < new Date().toISOString().slice(0, 10)) {
      toast({ title: 'Invalid date', description: 'Event date must be today or later.', variant: 'destructive' });
      return;
    }
    const guests = Number(guestCount);
    if (!Number.isFinite(guests) || guests < 1) {
      toast({ title: 'Invalid guests', description: 'Enter number of guests (at least 1).', variant: 'destructive' });
      return;
    }
    if (detail.min_guests && guests < detail.min_guests) {
      toast({ title: 'Too few guests', description: `This caterer serves at least ${detail.min_guests} guests.`, variant: 'destructive' });
      return;
    }
    if (detail.max_guests && guests > detail.max_guests) {
      toast({ title: 'Too many guests', description: `This caterer serves up to ${detail.max_guests} guests.`, variant: 'destructive' });
      return;
    }
    if (!venue.trim()) {
      toast({ title: 'Missing venue', description: 'Enter event location / venue.', variant: 'destructive' });
      return;
    }
    if (!contactPhone.trim()) {
      toast({ title: 'Missing phone', description: 'Enter a contact phone number.', variant: 'destructive' });
      return;
    }
    if (selectedPackages.length === 0 && selectedMenu.length === 0 && (packages.length > 0 || menuItems.length > 0)) {
      toast({ title: 'Nothing selected', description: 'Select at least one package or menu item.', variant: 'destructive' });
      return;
    }

    try {
      await createBooking.mutateAsync({
        caterer_id: catererId,
        customer_id: user.id,
        event_date: eventDate,
        event_time: eventTime || null,
        event_type: eventType,
        guest_count: guests,
        venue: venue.trim(),
        contact_phone: contactPhone.trim(),
        contact_name: contactName.trim() || profile?.name || null,
        special_requests: special.trim() || null,
        menu_selections: selectedMenu,
        package_ids: selectedPackages,
        total_amount: total > 0 ? total : null,
      });
      toast({ title: 'Request sent', description: `${detail.name} will contact you soon.` });
      navigate('/my-bookings');
    } catch (err) {
      toast({
        title: 'Booking failed',
        description: err instanceof Error ? err.message : 'Could not send request. Make sure you are signed in as a customer.',
        variant: 'destructive',
      });
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(`/caterer/${catererId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to {detail.name}
        </Button>

        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold">Request Booking</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {detail.name} · {detail.location ?? ''} · serves {detail.min_guests ?? 1}–{detail.max_guests ?? 100} guests
          </p>
        </div>

        {!isAuthenticated && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-sm text-amber-900">
              You need a customer account to book. <Link to="/login" state={{ from: `/caterer/${catererId}/book` }} className="font-semibold underline">Sign in</Link> or <Link to="/login?tab=register" className="font-semibold underline">create an account</Link>, then come back to send your request.
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarCheck className="h-4 w-4 text-primary" /> Event details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event-date">Event date *</Label>
                  <Input id="event-date" type="date" value={eventDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => { setDateTouched(true); setEventDate(e.target.value); }} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-time">Event time</Label>
                  <Input id="event-time" type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event-type">Event type *</Label>
                  <select
                    id="event-type"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {eventTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guests">Guests *</Label>
                  <Input id="guests" type="number" min={1} value={guestCount} onChange={(e) => setGuestCount(e.target.value)} required />
                  <p className="text-xs text-muted-foreground">Serves {detail.min_guests ?? 1}–{detail.max_guests ?? 100}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue / location *</Label>
                <Input id="venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Hall name or address" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Your name</Label>
                  <Input id="contact-name" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Full name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Phone *</Label>
                  <Input id="contact-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+251 ..." required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="special">Special instructions</Label>
                <Textarea id="special" value={special} onChange={(e) => setSpecial(e.target.value)} placeholder="Dietary needs, setup, timing…" rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PackageIcon className="h-4 w-4 text-primary" /> Packages — tap to select
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {packages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No packages listed — you can still book with menu items below.</p>
              ) : (
                packages.map((pkg) => {
                  const active = selectedPackages.includes(pkg.id);
                  const cover = (pkg.images ?? [])[0];
                  return (
                    <label key={pkg.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                      <Checkbox checked={active} onCheckedChange={() => toggle(selectedPackages, pkg.id, setSelectedPackages)} className="mt-1" />
                      {cover && <img src={cover} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold">{pkg.name}</span>
                          <span className="shrink-0 text-sm font-bold text-primary">${Number(pkg.price).toLocaleString()}</span>
                        </span>
                        {pkg.description && <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{pkg.description}</span>}
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {pkg.min_guests ?? 1}–{pkg.max_guests ?? 100} guests{(pkg.includes ?? []).length > 0 ? ` · ${(pkg.includes ?? []).slice(0, 3).join(' · ')}` : ''}
                        </span>
                      </span>
                    </label>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Utensils className="h-4 w-4 text-primary" /> Menu items — tap to add
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {menuItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No menu items listed.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {menuItems.slice(0, 30).map((item) => {
                    const active = selectedMenu.includes(item.id);
                    return (
                      <label key={item.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                        <Checkbox checked={active} onCheckedChange={() => toggle(selectedMenu, item.id, setSelectedMenu)} className="mt-1" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold">{item.name}</span>
                            <span className="shrink-0 text-sm font-bold text-primary">${Number(item.price).toLocaleString()}</span>
                          </span>
                          {item.description && <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{item.description}</span>}
                          {item.category && (
                            <Badge variant="secondary" className="mt-1 text-[10px]">{item.category}</Badge>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">Estimated total from selection</p>
                <p className="text-xl font-bold">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground">Final price confirmed by vendor.</p>
              </div>
              <Button type="submit" size="lg" disabled={createBooking.isPending}>
                {createBooking.isPending ? 'Sending…' : 'Send Booking Request'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </MainLayout>
  );
}
