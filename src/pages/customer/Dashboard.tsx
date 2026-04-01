import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, MapPin, ChevronRight, User, Settings, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { useCustomerBookings, BookingWithCaterer } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Loader2 } from 'lucide-react';

const getStatusColor = (status: BookingWithCaterer['status'] | string) => {
  switch (status) {
    case 'pending_vendor_review':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'accepted':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'declined':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusText = (status: BookingWithCaterer['status'] | string) => {
  switch (status) {
    case 'pending_vendor_review':
      return 'Pending Review';
    case 'pending':
      return 'Pending Review';
    case 'accepted':
      return 'Confirmed';
    case 'declined':
      return 'Declined';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};

export default function CustomerDashboard() {
  const { user, profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: bookings = [], isLoading } = useCustomerBookings(user?.id);

  const upcomingBookings = bookings.filter(
    (b) => ['pending', 'pending_vendor_review', 'accepted', 'payment_pending', 'confirmed'].includes(b.status) && new Date(b.event_date) >= new Date(new Date().setHours(0,0,0,0))
  );
  const pastBookings = bookings.filter(
    (b) => ['completed', 'cancelled', 'declined'].includes(b.status) || new Date(b.event_date) < new Date(new Date().setHours(0,0,0,0))
  );

  const handlePayment = async (bookingId: string) => {
    try {
      setIsProcessingPayment(bookingId);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_URL}/payments/chapa/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          app_return_url: window.location.href
        })
      });
      const data = await response.json();
      if (data.success && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        throw new Error(data.message || 'Payment initiation failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Could not launch checkout window.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(null);
    }
  };

  const BookingCard = ({ booking }: { booking: BookingWithCaterer }) => {
    const caterer = booking.caterer;
    if (!caterer) return null;

    return (
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <img
              src={caterer.cover_image || 'https://images.unsplash.com/photo-1555244162-803834f70033?w=200'}
              alt={caterer.name}
              className="h-24 w-24 rounded-lg object-cover"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    to={`/caterer/${caterer.id}`}
                    className="font-display text-lg font-semibold hover:text-primary"
                  >
                    {caterer.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{booking.event_type}</p>
                </div>
                <Badge className={getStatusColor(booking.status)} variant="outline">
                  {getStatusText(booking.status)}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(booking.event_date), 'PPP')}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {booking.guest_count} guests
                </span>
                {booking.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {booking.venue}
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                {booking.total_amount && (
                  <p className="font-semibold text-primary">
                    ${Number(booking.total_amount).toLocaleString()}
                  </p>
                )}
                
                {(booking.status === 'accepted' || (booking.status as any) === 'payment_pending') && (
                  <Button 
                    size="sm" 
                    onClick={() => handlePayment(booking.id)}
                    disabled={isProcessingPayment === booking.id}
                  >
                    {isProcessingPayment === booking.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-4 w-4" />
                    )}
                    Pay Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                {/* User Info */}
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="font-display text-xl font-semibold">{profile?.name || 'User'}</h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                      activeTab === 'bookings'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    My Bookings
                  </button>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                      activeTab === 'profile'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    Profile Settings
                  </button>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {activeTab === 'bookings' && (
              <>
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h1 className="font-display text-2xl font-bold">My Bookings</h1>
                    <p className="text-muted-foreground">
                      Manage your catering requests and reservations
                    </p>
                  </div>
                  <Button asChild>
                    <Link to="/caterers">
                      Browse Caterers
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {/* Stats */}
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                  <Card>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {bookings.filter((b) => b.status === 'pending').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Pending</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <Calendar className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{upcomingBookings.length}</p>
                        <p className="text-sm text-muted-foreground">Upcoming</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{pastBookings.length}</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Bookings Tabs */}
                <Tabs defaultValue="upcoming" className="w-full">
                  <TabsList>
                    <TabsTrigger value="upcoming">
                      Upcoming ({upcomingBookings.length})
                    </TabsTrigger>
                    <TabsTrigger value="past">
                      Past ({pastBookings.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upcoming" className="mt-6">
                    {isLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : upcomingBookings.length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                          <p className="mt-4 text-lg font-medium">No upcoming bookings</p>
                          <p className="text-muted-foreground">
                            Start planning your next event!
                          </p>
                          <Button className="mt-4" asChild>
                            <Link to="/caterers">Find a Caterer</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {upcomingBookings.map((booking) => (
                          <BookingCard key={booking.id} booking={booking} />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="past" className="mt-6">
                    {isLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : pastBookings.length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
                          <p className="mt-4 text-lg font-medium">No past bookings</p>
                          <p className="text-muted-foreground">
                            Your completed events will appear here
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {pastBookings.map((booking) => (
                          <BookingCard key={booking.id} booking={booking} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}

            {activeTab === 'profile' && (
              <>
                <div className="mb-6">
                  <h1 className="font-display text-2xl font-bold">Profile Settings</h1>
                  <p className="text-muted-foreground">Manage your account information</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Full Name
                        </label>
                        <p className="font-medium">{profile?.name || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Email
                        </label>
                        <p className="font-medium">{user?.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Phone
                        </label>
                        <p className="font-medium">{profile?.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Member Since
                        </label>
                        <p className="font-medium">
                          {profile?.created_at
                            ? format(new Date(profile.created_at), 'MMMM yyyy')
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <Button className="mt-4">Edit Profile</Button>
                  </CardContent>
                </Card>
              </>
            )}
          </main>
        </div>
      </div>
    </MainLayout>
  );
}
