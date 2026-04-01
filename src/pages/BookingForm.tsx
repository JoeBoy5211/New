import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, MapPin, ChevronRight, Check, Plus, Minus, Info } from 'lucide-react';
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
import { MainLayout } from '@/components/layout/MainLayout';
import { eventTypes } from '@/data/mockData'; // we can keep eventTypes from mock if it's just an array of strings
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useCatererById } from '@/hooks/useCaterers';
import { useMenuItemsByCaterer, MenuItem } from '@/hooks/useMenuItems';
import { useCreateBooking } from '@/hooks/useBookings';

const bookingSchema = z.object({
  eventDate: z.date({
    required_error: 'Please select an event date',
  }),
  eventType: z.string().min(1, 'Please select an event type'),
  guestCount: z.number().min(1, 'Guest count must be at least 1'),
  serviceType: z.string().min(1, 'Please select a service type'),
  venue: z.string().min(3, 'Please enter the venue address'),
  contactPhone: z.string().min(10, 'Please enter a valid phone number'),
  specialRequests: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function BookingForm() {
  const { catererId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  // Menu Selection State (menuItemId -> quantity)
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  const { data: caterer, isLoading: cateringLoading } = useCatererById(catererId);
  const { data: menuItems = [] } = useMenuItemsByCaterer(catererId);
  const createBooking = useCreateBooking();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guestCount: caterer?.min_guests || 20,
      serviceType: 'Full Service',
      venue: '',
      contactPhone: user?.phone || '',
      specialRequests: '',
    },
  });

  const guestCount = form.watch('guestCount');

  // Menu Categories
  const menuCategories = useMemo(() => {
    const cats = new Set(menuItems.map(item => item.category || 'Other'));
    return Array.from(cats).sort();
  }, [menuItems]);

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setSelectedItems(prev => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      const newItems = { ...prev };
      if (next === 0) {
        delete newItems[itemId];
      } else {
        newItems[itemId] = next;
      }
      return newItems;
    });
  };

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
      const item = menuItems.find(m => m.id === itemId);
      if (item) {
        total += item.price * qty;
      }
    });
    return total;
  };

  const totalAmount = calculateSubtotal();

  const onSubmit = async (data: BookingFormData) => {
    if (!caterer || !user) {
      toast({ title: 'Error', description: 'User or Caterer not found.', variant: 'destructive' });
      return;
    }

    try {
      const formattedDate = format(data.eventDate, 'yyyy-MM-dd');

      const itemsPayload = Object.entries(selectedItems).map(([itemId, qty]) => {
        const item = menuItems.find(m => m.id === itemId);
        return {
          menu_item_id: itemId,
          quantity: qty,
          unit_price: item?.price || 0,
        };
      });

      await createBooking.mutateAsync({
        booking: {
          customer_id: user.id,
          caterer_id: caterer.id,
          event_date: formattedDate,
          event_type: data.eventType,
          guest_count: data.guestCount,
          service_type: data.serviceType,
          venue: data.venue,
          contact_phone: data.contactPhone,
          special_requests: data.specialRequests || null,
          total_amount: totalAmount,
        },
        items: itemsPayload,
      });

      setStep(4); // Success step
    } catch (err: any) {
      toast({
        title: 'Booking failed',
        description: err.message || 'An error occurred while submitting your booking.',
        variant: 'destructive',
      });
    }
  };

  const nextStep = async () => {
    if (step === 1) {
      const isValid = await form.trigger(['eventDate', 'eventType', 'guestCount', 'serviceType']);
      if (isValid) setStep(2);
    } else if (step === 2) {
      // Validate menu selection
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

  if (cateringLoading || !caterer) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold">{cateringLoading ? 'Loading...' : 'Caterer Not Found'}</h1>
          {!cateringLoading && (
            <Button className="mt-4" asChild>
              <Link to="/caterers">Browse Caterers</Link>
            </Button>
          )}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout hideFooter>
      <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
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

          {/* Progress Steps */}
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
            {/* Form Area */}
            <div className="lg:col-span-2 xl:col-span-3">
              <Card className="shadow-premium overflow-hidden">
                <CardContent className="p-0 sm:p-6">
                  {step === 4 ? (
                    // Success State
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

                          {/* STEP 1: EVENT DETAILS */}
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
                                          {eventTypes.map((type) => (
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
                                            min={caterer.min_guests}
                                            max={caterer.max_guests}
                                            className="pl-10"
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                          />
                                        </div>
                                      </FormControl>
                                      <p className="text-xs text-muted-foreground">
                                        This caterer serves {caterer.min_guests} - {caterer.max_guests} guests
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

                          {/* STEP 2: MENU SELECTION */}
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
                                  {menuCategories.map(category => {
                                    const itemsInCategory = menuItems.filter(m => (m.category || 'Other') === category);
                                    if (itemsInCategory.length === 0) return null;

                                    return (
                                      <div key={category} className="space-y-4">
                                        <h4 className="font-display text-lg font-medium text-primary sticky top-0 bg-background/95 backdrop-blur py-2 z-10">{category}</h4>
                                        <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                                          {itemsInCategory.map(item => {
                                            const qty = selectedItems[item.id] || 0;
                                            return (
                                              <div key={item.id} className={cn(
                                                "flex flex-col p-4 rounded-xl border transition-all",
                                                qty > 0 ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 hover:bg-muted/50"
                                              )}>
                                                <div className="flex justify-between items-start gap-4 mb-3">
                                                  <div>
                                                    <h5 className="font-semibold text-base leading-tight flex items-center gap-2">
                                                      {item.name}
                                                      {item.is_popular && <span className="text-[10px] uppercase tracking-wider bg-gold/10 text-gold px-2 py-0.5 rounded-full font-bold">Popular</span>}
                                                    </h5>
                                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                                                  </div>
                                                  <div className="font-semibold text-primary whitespace-nowrap bg-primary/10 px-2.5 py-1 rounded-md">
                                                    ${item.price.toFixed(2)}
                                                  </div>
                                                </div>

                                                <div className="mt-auto flex items-center justify-between pt-3 border-t">
                                                  <div className="text-xs text-muted-foreground font-medium">
                                                    {qty > 0 ? `Subtotal: $${(item.price * qty).toFixed(2)}` : ' '}
                                                  </div>

                                                  {qty === 0 ? (
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="sm"
                                                      className="h-8 shadow-sm hover:text-primary hover:border-primary"
                                                      onClick={() => handleSetQuantity(item.id, guestCount || 1)}
                                                    >
                                                      <Plus className="h-4 w-4 mr-1" /> Add
                                                    </Button>
                                                  ) : (
                                                    <div className="flex items-center gap-3 bg-background border rounded-lg p-1 shadow-sm">
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                                                        onClick={() => handleUpdateQuantity(item.id, -1)}
                                                      >
                                                        <Minus className="h-3 w-3" />
                                                      </Button>
                                                      <span className="w-8 text-center font-medium text-sm tabular-nums">{qty}</span>
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 rounded-md hover:bg-primary/20 hover:text-primary transition-colors shrink-0"
                                                        onClick={() => handleUpdateQuantity(item.id, 1)}
                                                      >
                                                        <Plus className="h-3 w-3" />
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

                          {/* STEP 3: CONTACT INFO */}
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

                          {/* Navigation Buttons */}
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
                                disabled={createBooking.isPending}
                                className={cn("px-8", step === 1 ? 'ml-auto' : '')}
                              >
                                {step === 3
                                  ? createBooking.isPending
                                    ? 'Submitting...'
                                    : 'Confirm & Submit'
                                  : 'Continue to ' + (step === 1 ? 'Menu' : 'Details')}
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

            {/* Sidebar - Caterer & Order Summary */}
            <div className="lg:col-span-1 xl:col-span-1">
              <div className="sticky top-24 space-y-6">

                {/* Caterer Info */}
                <Card className="border-primary/10 shadow-sm bg-gradient-to-br from-background to-secondary/30">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-4 items-center sm:items-start text-center sm:text-left lg:text-center">
                      <img src={caterer.cover_image || '/placeholder.svg'} alt={caterer.name} className="h-24 w-24 sm:h-20 sm:w-20 lg:h-32 lg:w-32 rounded-full lg:rounded-xl object-cover shadow-sm bg-muted" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{caterer.name}</h3>
                        <p className="text-sm text-muted-foreground flex justify-center sm:justify-start lg:justify-center items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> {caterer.location}
                        </p>
                        <div className="mt-3 inline-flex items-center gap-2 bg-background px-3 py-1 rounded-full border shadow-sm text-sm">
                          <span className="font-medium text-primary">{caterer.price_range}</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                          <span className="flex justify-center items-center gap-1 text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            {caterer.min_guests}-{caterer.max_guests}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Event Summary */}
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

                      {/* Selected Items Breakdown (shows if any exist) */}
                      {Object.keys(selectedItems).length > 0 && (
                        <div className="pt-4 mt-4 border-t space-y-3">
                          <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Menu Selection</p>
                          {Object.entries(selectedItems).map(([id, qty]) => {
                            const item = menuItems.find(m => m.id === id);
                            if (!item) return null;
                            return (
                              <div key={id} className="flex justify-between items-start text-xs">
                                <span className="flex-1 pr-4">
                                  <span className="font-medium">{qty}x</span> {item.name}
                                </span>
                                <span className="text-muted-foreground whitespace-nowrap">
                                  ${(item.price * qty).toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                    </CardContent>

                    {/* Total */}
                    <div className="p-5 border-t bg-primary/5 rounded-b-xl flex justify-between items-center">
                      <span className="font-semibold text-primary">Estimated Total</span>
                      <span className="font-display text-xl font-bold text-primary">
                        ${totalAmount.toFixed(2)}
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
