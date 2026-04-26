import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, MapPin, ChevronRight, Check, Plus, Minus, Info, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useCatererDetail } from '@/hooks/useCaterers';
import { api } from '@/lib/api';

// Schema moved inside component for dynamic min/max validation
type BookingFormData = {
  eventDate: Date;
  eventType: string;
  guestCount: number;
  serviceType: string;
  venue: string;
  contactPhone: string;
  specialRequests?: string;
};

export default function BookingForm() {
  const { catererId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Menu Selection State (menuItemId -> quantity)
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  const { caterer, isLoading } = useCatererDetail(catererId);

  const bookingSchema = useMemo(() => z.object({
    eventDate: z.date({
      required_error: 'Please select an event date',
    }),
    eventType: z.string().min(1, 'Please select an event type'),
    guestCount: z.number()
      .min(caterer?.minGuests || 1, `Minimum guest count is ${caterer?.minGuests || 1}`)
      .max(caterer?.maxGuests || 10000, `Maximum guest count is ${caterer?.maxGuests || 10000}`),
    serviceType: z.string().min(1, 'Please select a service type'),
    venue: z.string().min(3, 'Please enter the venue address'),
    contactPhone: z.string().min(10, 'Please enter a valid phone number'),
    specialRequests: z.string().optional(),
  }), [caterer]);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guestCount: caterer?.minGuests || 20,
      serviceType: 'Full Service',
      venue: '',
      contactPhone: user?.phone || '',
      specialRequests: '',
    },
  });

  const guestCount = form.watch('guestCount');
  const menuItems = caterer?.menuItems || [];

  // Re-initialize when caterer data is loaded
  useEffect(() => {
    if (caterer) {
      const currentCount = form.getValues('guestCount');
      if (currentCount < caterer.minGuests) {
        form.setValue('guestCount', caterer.minGuests);
      } else if (currentCount > caterer.maxGuests) {
        form.setValue('guestCount', caterer.maxGuests);
      }
    }
  }, [caterer, form]);

  // Sync selected items quantity with guest count
  useEffect(() => {
    setSelectedItems(prev => {
      const newItems = { ...prev };
      let changed = false;
      Object.keys(newItems).forEach(id => {
        if (newItems[id] !== guestCount) {
          newItems[id] = guestCount;
          changed = true;
        }
      });
      return changed ? newItems : prev;
    });
  }, [guestCount]);

  // Menu Categories
  const menuCategories = useMemo(() => {
    const cats = new Set<string>(menuItems.map((item: any) => item.category || 'Other'));
    return Array.from(cats).sort();
  }, [menuItems]);

  const handleSetQuantity = (itemId: string, qty: number) => {
    setSelectedItems(prev => {
      const newItems = { ...prev };
      if (qty <= 0) {
        delete newItems[itemId];
      } else {
        newItems[itemId] = qty;
      }
      return newItems;
    });
  };

  const calculateSubtotal = () => {
    let total = 0;
    Object.entries(selectedItems).forEach(([itemId, qty]) => {
      const item = menuItems.find((m: any) => m.id === itemId);
      if (item) {
        total += item.price * qty;
      }
    });
    return total;
  };

  const subtotal = calculateSubtotal();
  const vatAmount = subtotal * 0.15;
  const totalAmount = subtotal + vatAmount;

  const onSubmit = async (data: BookingFormData) => {
    if (!caterer || !user) {
      toast({ title: 'Error', description: 'User or Caterer not found.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const itemsPayload = Object.entries(selectedItems).map(([itemId, qty]) => {
        const item = menuItems.find((m: any) => m.id === itemId);
        return {
          menu_item_id: itemId,
          quantity: qty,
          unit_price: item?.price || 0,
        };
      });

      const response = await api.post('/bookings', {
        customer_id: user.id,
        caterer_id: caterer.id,
        event_date: format(data.eventDate, 'yyyy-MM-dd'),
        event_type: data.eventType,
        guest_count: data.guestCount,
        service_type: data.serviceType,
        venue: data.venue,
        contact_phone: data.contactPhone,
        special_requests: data.specialRequests || null,
        total_amount: totalAmount,
        items: itemsPayload
      });

      if (response.success) {
        setStep(4); // Success step
      } else {
        throw new Error(response.message || 'Submission failed');
      }
    } catch (err: any) {
      toast({
        title: 'Booking failed',
        description: err.message || 'An error occurred while submitting your booking.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    if (step === 1) {
      const isValid = await form.trigger(['eventDate', 'eventType', 'guestCount', 'serviceType']);
      if (isValid) setStep(2);
    } else if (step === 2) {
      if (Object.keys(selectedItems).length === 0) {
        toast({ title: 'Select Menu Items', description: 'Please select at least one item from the menu.' });
        return;
      }
      setStep(3);
    } else if (step === 3) {
      form.handleSubmit(onSubmit)();
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const steps = [
    { number: 1, title: 'Event Details' },
    { number: 2, title: 'Menu Selection' },
    { number: 3, title: 'Contact Info' },
    { number: 4, title: 'Confirmation' },
  ];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner size={40} text="Loading booking form..." />
        </div>
      </MainLayout>
    );
  }

  if (!caterer) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold">Caterer Not Found</h1>
          <Button className="mt-4" asChild>
            <Link to="/caterers">Browse Caterers</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout hideFooter>
      <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {caterer.name}
            </Button>
            <h1 className="font-display text-2xl font-bold md:text-3xl">Request a Quote</h1>
            <p className="mt-2 text-muted-foreground">
              Fill out the form below to request a personalized quote from {caterer.name}
            </p>
          </div>

          <div className="mb-8 overflow-x-auto pb-4">
            <div className="flex items-center justify-between min-w-[600px]">
              {steps.map((s, index) => (
                <div key={s.number} className="flex items-center">
                  <div className="flex items-center">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-colors',
                        step >= s.number
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30 text-muted-foreground'
                      )}
                    >
                      {step > s.number ? <Check className="h-5 w-5" /> : s.number}
                    </div>
                    <span
                      className={cn(
                        'ml-3 hidden font-medium sm:block',
                        step >= s.number ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {s.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="mx-4 h-5 w-5 text-muted-foreground/30" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 xl:grid-cols-4">
            <div className="lg:col-span-2 xl:col-span-3">
              <Card className="shadow-premium overflow-hidden">
                <CardContent className="p-0 sm:p-6">
                  {step === 4 ? (
                    <div className="py-12 px-6 text-center">
                      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-12 w-12 text-primary" />
                      </div>
                      <h2 className="font-display text-3xl font-bold">Booking Request Submitted!</h2>
                      <p className="mt-4 text-muted-foreground text-lg max-w-md mx-auto">
                        Thank you for your request. {caterer.name} will review your details and respond within 24-48 hours.
                      </p>
                      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                        <Button size="lg" asChild>
                          <Link to="/customer/dashboard">View My Bookings</Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                          <Link to="/caterers">Browse More Caterers</Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 sm:p-0">
                      <Form {...form}>
                        <form className="space-y-6">
                          {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                              <h3 className="text-xl font-semibold border-b pb-2">Event Details</h3>
                              <div className="grid sm:grid-cols-2 gap-6">
                                <FormField
                                  control={form.control}
                                  name="eventDate"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                      <FormLabel>Event Date</FormLabel>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <FormControl>
                                            <Button
                                              variant="outline"
                                              className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}
                                            >
                                              <Calendar className="mr-2 h-4 w-4" />
                                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                            </Button>
                                          </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                          <CalendarComponent
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date < new Date()}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="eventType"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Event Type</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger><SelectValue placeholder="Select event type" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {(caterer.eventTypes || ['Wedding', 'Corporate', 'Private Party', 'Birthday']).map((type: string) => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="grid sm:grid-cols-2 gap-6">
                                <FormField
                                  control={form.control}
                                  name="guestCount"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Number of Guests</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                          <Input
                                            type="number"
                                            min={caterer.minGuests}
                                            max={caterer.maxGuests}
                                            className="pl-10"
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                          />
                                        </div>
                                      </FormControl>
                                      <p className="text-xs text-muted-foreground">
                                        This caterer serves {caterer.minGuests} - {caterer.maxGuests} guests
                                      </p>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="serviceType"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Service Required</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger><SelectValue placeholder="Select service type" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="Full Service">Full Service (Food & Staff)</SelectItem>
                                          <SelectItem value="Drop-off">Drop-off (Food only)</SelectItem>
                                          <SelectItem value="Corporate">Corporate / Recurring</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          )}

                          {step === 2 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                              <div>
                                <h3 className="text-xl font-semibold border-b pb-2">Menu Selection</h3>
                                <p className="text-sm text-muted-foreground mt-2">Adjust quantities for the items you'd like to include.</p>
                              </div>

                              {menuItems.length === 0 ? (
                                <div className="text-center p-8 bg-muted rounded-lg border border-dashed">
                                  <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                  <p className="text-muted-foreground">This caterer hasn't added any menu items yet.</p>
                                </div>
                              ) : (
                                <div className="space-y-8">
                                  {menuCategories.map((category: string) => {
                                    const itemsInCategory = menuItems.filter((m: any) => (m.category || 'Other') === category);
                                    if (itemsInCategory.length === 0) return null;

                                    return (
                                      <div key={category} className="space-y-4">
                                        <h4 className="font-display text-lg font-medium text-primary sticky top-0 bg-background/95 backdrop-blur py-2 z-10">{category}</h4>
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                          {itemsInCategory.map((item: any) => {
                                            const qty = selectedItems[item.id] || 0;
                                            return (
                                              <div key={item.id} className={cn(
                                                "input-qty-group flex flex-col p-3 rounded-lg border transition-all",
                                                qty > 0 ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 hover:bg-muted/50"
                                              )}>
                                                <div className="flex gap-3 mb-2">
                                                  {item.image && (
                                                    <div className="shrink-0 h-14 w-14 sm:h-16 sm:w-16 rounded-md overflow-hidden bg-muted border border-border/50">
                                                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                                    </div>
                                                  )}
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                      <h5 className="font-semibold text-sm leading-tight flex flex-wrap items-center gap-1.5 line-clamp-1">
                                                        {item.name}
                                                        {item.is_popular && <span className="text-[9px] uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">Pop</span>}
                                                      </h5>
                                                      <div className="font-bold text-primary whitespace-nowrap px-1.5 py-0.5 rounded text-xs shrink-0 bg-primary/10">
                                                        ETB {item.price.toLocaleString()}
                                                      </div>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>
                                                  </div>
                                                </div>
                                                <div className="mt-auto flex items-center justify-between pt-2 border-t">
                                                  <div className="text-[10px] text-muted-foreground font-medium">
                                                    {qty > 0 ? `Subtotal: ETB ${(item.price * qty).toLocaleString()}` : ' '}
                                                  </div>
                                                  {qty === 0 ? (
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="sm"
                                                      className="h-7 text-xs shadow-sm hover:text-primary hover:border-primary px-3"
                                                      onClick={() => handleSetQuantity(item.id, guestCount || 1)}
                                                    >
                                                      <Plus className="h-3 w-3 mr-1" /> Add
                                                    </Button>
                                                  ) : (
                                                    <div className="flex items-center gap-2">
                                                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-2 py-0 text-[10px]">
                                                        {guestCount} {guestCount === 1 ? 'portion' : 'portions'}
                                                      </Badge>
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() => handleSetQuantity(item.id, 0)}
                                                      >
                                                        <Trash2 className="h-3 w-3" />
                                                      </Button>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                              <h3 className="text-xl font-semibold border-b pb-2">Logistics & Contact</h3>
                              <FormField
                                control={form.control}
                                name="venue"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Event Venue / Address</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Enter venue name or full address" className="pl-10" {...field} />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="contactPhone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Contact Phone</FormLabel>
                                    <FormControl>
                                      <Input type="tel" placeholder="(555) 123-4567" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="specialRequests"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Special Requests & Dietary Notes (Optional)</FormLabel>
                                    <FormControl>
                                      <Textarea placeholder="e.g., Setup times, building access codes, food allergies..." rows={4} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}

                          <div className="flex justify-between pt-6 mt-6 border-t border-border/50">
                            {step > 1 && step < 4 && (
                              <Button type="button" variant="outline" onClick={prevStep} className="px-6">
                                Back
                              </Button>
                            )}
                            {step < 4 && (
                              <Button
                                type="button"
                                onClick={nextStep}
                                disabled={isSubmitting}
                                className={cn("px-8", step === 1 ? 'ml-auto' : '')}
                              >
                                {step === 3
                                  ? isSubmitting
                                    ? 'Submitting...'
                                    : 'Confirm & Submit'
                                  : 'Continue'}
                              </Button>
                            )}
                          </div>
                        </form>
                      </Form>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 xl:col-span-1">
              <div className="sticky top-24 space-y-6">
                <Card className="border-primary/10 shadow-sm bg-gradient-to-br from-background to-secondary/30">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-4 items-center sm:items-start text-center sm:text-left lg:text-center">
                      <img src={caterer.coverImage || '/placeholder.svg'} alt={caterer.name} className="h-24 w-24 sm:h-20 sm:w-20 lg:h-32 lg:w-32 rounded-full lg:rounded-xl object-cover shadow-sm bg-muted" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{caterer.name}</h3>
                        <p className="text-sm text-muted-foreground flex justify-center sm:justify-start lg:justify-center items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> {caterer.location}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {form.watch('eventDate') && (
                  <Card className="shadow-sm">
                    <CardHeader className="py-4 border-b bg-muted/20">
                      <CardTitle className="font-display text-base">Booking Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 text-sm space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-medium">{format(form.watch('eventDate'), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Service</span>
                        <span className="font-medium">{form.watch('serviceType')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Guests</span>
                        <span className="font-medium">{guestCount}</span>
                      </div>
                      {Object.keys(selectedItems).length > 0 && (
                        <div className="pt-4 mt-4 border-t space-y-3">
                          <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Menu Selection</p>
                          {Object.entries(selectedItems).map(([id, qty]) => {
                            const item = menuItems.find((m: any) => m.id === id);
                            if (!item) return null;
                            return (
                              <div key={id} className="flex justify-between items-start text-xs">
                                <span className="flex-1 pr-4">
                                  <span className="font-medium">{qty}x</span> {item.name}
                                </span>
                                <span className="text-muted-foreground whitespace-nowrap">
                                  ETB {(item.price * qty).toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="pt-4 mt-4 border-t space-y-2 text-sm">
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>Subtotal</span>
                          <span>ETB {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>VAT (15%)</span>
                          <span>ETB {vatAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                    <div className="p-5 border-t bg-primary/5 rounded-b-xl flex justify-between items-center">
                      <span className="font-semibold text-primary">Estimated Total</span>
                      <span className="font-display text-xl font-bold text-primary">
                        ETB {totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
