import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, MapPin, ChevronRight, User, Settings, LogOut, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { useCustomerBookings } from '@/hooks/useCustomerBookings';
import { useFavorites } from '@/hooks/useFavorites';
import { ReviewModal } from '@/components/ReviewModal';
import { BookingDetailsModal } from '@/components/BookingDetailsModal';
import { CatererCard } from '@/components/CatererCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending_review':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'accepted':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'declined':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending_review':
      return 'Pending Review';
    case 'accepted':
      return 'Accepted';
    case 'declined':
      return 'Declined';
    case 'completed':
      return 'Completed';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);

  const { toast } = useToast();
  const { bookings, isLoading, error, refresh } = useCustomerBookings();
  const { favorites, isLoading: isFavoritesLoading, refresh: refreshFavorites } = useFavorites();

  const handlePayment = async (bookingId: string) => {
    try {
      setIsProcessingPayment(bookingId);
      const appReturnUrl = window.location.origin + '/customer/payment-success';
      const response = await api.post('/payments/initiate', {
        booking_id: bookingId,
        app_return_url: appReturnUrl
      });
      
      if (response.success && response.checkout_url) {
        window.location.href = response.checkout_url;
      } else {
        throw new Error(response.message || 'Payment initiation failed');
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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <LoadingSpinner size={40} text="Loading your bookings..." />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-destructive">Error Loading Bookings</h2>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </MainLayout>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingBookings = bookings.filter(b => b.status === 'pending_review');
  const acceptedBookings = bookings.filter(b => b.status === 'accepted');
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const declinedBookings = bookings.filter(b => b.status === 'declined');

  const BookingCard = ({ booking }: { booking: any }) => {
    return (
      <Card
        className="transition-shadow hover:shadow-md cursor-pointer group"
        onClick={() => {
          setSelectedBooking(booking);
          setIsDetailsModalOpen(true);
        }}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            <img
              src={booking.cover_image || ''}
              alt={booking.catererName}
              className="h-24 w-24 rounded-lg object-cover"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    to={`/caterer/${booking.caterer_id}`}
                    className="font-display text-lg font-semibold hover:text-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {booking.catererName}
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

              {booking.total_amount && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="font-semibold text-primary">
                    ETB {Number(booking.total_amount).toLocaleString()}
                  </p>
                  
                  {(booking.status === 'accepted' || booking.status === 'payment_pending') && (
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePayment(booking.id);
                      }}
                      disabled={isProcessingPayment === booking.id}
                      className="gap-2"
                    >
                      {isProcessingPayment === booking.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
                      Pay Now
                    </Button>
                  )}
                </div>
              )}

              {booking.status === 'completed' && !booking.is_reviewed && (
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card onClick from firing
                    setSelectedBooking(booking);
                    setIsReviewModalOpen(true);
                  }}
                >
                  Rate Experience
                </Button>
              )}

              {booking.is_reviewed > 0 && (
                <Badge variant="secondary" className="mt-4">
                  Already Reviewed
                </Badge>
              )}
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
                  <h2 className="font-display text-xl font-semibold">{user?.name}</h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === 'bookings'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                      }`}
                  >
                    <Calendar className="h-4 w-4" />
                    My Bookings
                  </button>
                  <button
                    onClick={() => setActiveTab('favorites')}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === 'favorites'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                      }`}
                  >
                    <Heart className="h-4 w-4" />
                    My Favorites
                  </button>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === 'profile'
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
            {activeTab === 'favorites' && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-2xl font-bold">My Favorites</h1>
                  <p className="text-muted-foreground">
                    Your saved caterers for easy access
                  </p>
                </div>

                {favorites.length === 0 ? (
                  <Card className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <Heart className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold">No favorites yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Save caterers you like to find them easily later.
                    </p>
                    <Button className="mt-6" asChild>
                      <Link to="/caterers">Browse Caterers</Link>
                    </Button>
                  </Card>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {favorites.map((caterer: any) => (
                      <CatererCard key={caterer.id} caterer={caterer} />
                    ))}
                  </div>
                )}
              </div>
            )}

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
                        <p className="text-2xl font-bold">{upcomingBookings.length}</p>
                        <p className="text-sm text-muted-foreground">Pending Review</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                        <Users className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{acceptedBookings.length}</p>
                        <p className="text-sm text-muted-foreground">Upcoming (Pay Now)</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{completedBookings.length}</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Bookings Tabs */}
                <Tabs defaultValue="upcoming" className="w-full">
                  <TabsList className="mb-4 w-full flex-wrap h-auto justify-start">
                    <TabsTrigger value="upcoming">Pending Review ({upcomingBookings.length})</TabsTrigger>
                    <TabsTrigger value="accepted">Upcoming — Pay Now ({acceptedBookings.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({completedBookings.length})</TabsTrigger>
                    <TabsTrigger value="declined">Declined ({declinedBookings.length})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upcoming">
                    {upcomingBookings.length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                          <p className="mt-4 text-lg font-medium">No pending bookings</p>
                          <p className="text-muted-foreground">Start planning your next event!</p>
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

                  <TabsContent value="accepted">
                    {acceptedBookings.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 border rounded-lg bg-muted/20">No accepted bookings awaiting payment.</p>
                    ) : (
                      <div className="space-y-4">
                        {acceptedBookings.map((booking) => (
                          <BookingCard key={booking.id} booking={booking} />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="completed">
                    {completedBookings.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 border rounded-lg bg-muted/20">No completed bookings.</p>
                    ) : (
                      <div className="space-y-4">
                        {completedBookings.map((booking) => (
                          <BookingCard key={booking.id} booking={booking} />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="declined">
                    {declinedBookings.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 border rounded-lg bg-muted/20">No declined bookings.</p>
                    ) : (
                      <div className="space-y-4">
                        {declinedBookings.map((booking) => (
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
                        <p className="font-medium">{user?.name}</p>
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
                        <p className="font-medium">{user?.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Member Since
                        </label>
                        <p className="font-medium">
                          {user?.createdAt
                            ? format(new Date(user.createdAt), 'MMMM yyyy')
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
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        booking={selectedBooking}
        customerId={user?.id || ''}
        onSuccess={refresh}
      />
      <BookingDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        booking={selectedBooking}
        mode="customer"
      />
    </MainLayout >
  );
}
