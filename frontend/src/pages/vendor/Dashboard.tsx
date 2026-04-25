
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useVendorData } from '@/hooks/useVendorData';
import { useReviews } from '@/hooks/useReviews';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ReTooltip,
} from 'recharts';
import { BookingDetailsModal } from '@/components/BookingDetailsModal';
import { ImageUpload } from '@/components/ImageUpload';
import { API_URL } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChefHat,
  Calendar,
  DollarSign,
  Users,
  Star,
  Clock,
  Check,
  X,
  MoreVertical,
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  Settings,
  LogOut,
  TrendingUp,
  Utensils,
  Heart,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { VendorAnalytics } from '@/components/vendor/VendorAnalytics';

const PRICE_RANGE_OPTIONS = [
  { value: '$', label: 'Budget Friendly', subtitle: 'ETB 100–200 per guest' },
  { value: '$$', label: 'Moderate', subtitle: 'ETB 300–600 per guest' },
  { value: '$$$', label: 'Premium', subtitle: 'ETB 600–900 per guest' },
  { value: '$$$$', label: 'Luxury', subtitle: 'ETB 1,000+ per guest' },
];

const menuItemSchema = z.object({
  name: z.string().min(2, 'Item name must be at least 2 characters'),
  category: z.string().min(1, 'Category is required'),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Price must be a positive number',
  }),
  description: z.string().optional(),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

const profileSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  location: z.string().min(2, 'Location is required'),
  description: z.string().optional(),
  long_description: z.string().optional(),
  min_guests: z.number().min(1, 'Minimum guests must be at least 1'),
  max_guests: z.number().min(1, 'Maximum guests must be at least 1'),
  years_in_business: z.number().min(0, 'Years in business cannot be negative'),
  price_range: z.string().min(1, 'Price range is required'),
  cuisines: z.string().optional(),
  specialties: z.string().optional(),
  event_types: z.string().optional(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const getStatusColor = (status: string) => {
  switch (status) {
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

export default function VendorDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<any>(null);
  const [bookingSearch, setBookingSearch] = useState('');

  const {
    data,
    isLoading,
    updateBookingStatus,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    updateProfile,
    refresh
  } = useVendorData();

  useEffect(() => {
    // Only auto-refresh if not on profile settings tab (to avoid disrupting edits)
    if (activeTab === 'profile') return;

    // Poll for new bookings and updates every 30 seconds
    const intervalId = setInterval(() => {
      refresh(true); // Silent refresh
    }, 30000);
    return () => clearInterval(intervalId);
  }, [refresh, activeTab]);

  const vendorCaterer = data?.caterer;
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      location: '',
      description: '',
      long_description: '',
      min_guests: 0,
      max_guests: 0,
      years_in_business: 0,
      price_range: '$',
      cuisines: '',
      specialties: '',
      event_types: '',
      termsAccepted: false as any,
    },
  });

  useEffect(() => {
    // Only reset form if it hasn't been edited by the user yet
    // This prevents the auto-refresh from wiping out unsaved changes
    if (vendorCaterer && !profileForm.formState.isDirty) {
      profileForm.reset({
        name: vendorCaterer.name,
        location: vendorCaterer.location,
        description: vendorCaterer.description,
        long_description: vendorCaterer.long_description || '',
        min_guests: vendorCaterer.min_guests,
        max_guests: vendorCaterer.max_guests,
        years_in_business: vendorCaterer.years_in_business,
        price_range: vendorCaterer.price_range || vendorCaterer.priceRange || '$',
        cuisines: Array.isArray(vendorCaterer.cuisines) ? vendorCaterer.cuisines.join(', ') : (vendorCaterer.cuisines || ''),
        event_types: Array.isArray(vendorCaterer.eventTypes) ? vendorCaterer.eventTypes.join(', ') :
          Array.isArray(vendorCaterer.event_types) ? vendorCaterer.event_types.join(', ') : (vendorCaterer.event_types || ''),
        specialties: Array.isArray(vendorCaterer.specialties) ? vendorCaterer.specialties.join(', ') : (vendorCaterer.specialties || ''),
        termsAccepted: false as any
      });
    }
  }, [vendorCaterer, profileForm]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    const res = await updateProfile(data);
    if (res.success) {
      toast({ title: 'Success', description: 'Profile updated successfully' });
    } else {
      toast({ title: 'Error', description: res.message, variant: 'destructive' });
    }
  };
  const bookings = data?.bookings || [];
  const menuItems = data?.menuItems || [];
  const reviews = data?.reviews || [];

  const stats = useMemo(() => {
    const pendingBookings = bookings.filter((b: any) => b.status === 'pending').length;
    const acceptedBookings = bookings.filter((b: any) => b.status === 'accepted').length;
    const totalRevenue = bookings
      .filter((b: any) => ['completed', 'confirmed'].includes(b.status))
      .reduce((sum: number, b: any) => sum + (Number(b.total_amount) || 0), 0);
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0;

    return { pendingBookings, acceptedBookings, totalRevenue, avgRating };
  }, [bookings, reviews]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={40} text="Loading dashboard..." />
      </div>
    );
  }

  if (!vendorCaterer) {
    return <div className="flex items-center justify-center min-h-screen">Profile not found. Please contact support.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <ChefHat className="h-8 w-8 text-primary" />
              <span className="text-xl font-serif font-bold text-primary">CaterConnect</span>
            </Link>
            <Badge variant="secondary">Vendor Portal</Badge>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {vendorCaterer?.name || user?.businessName || user?.name || 'Vendor'}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card">
                <DropdownMenuItem onClick={() => setActiveTab('profile')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground">{vendorCaterer.name}</h1>
          <p className="text-muted-foreground">Manage your catering business</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">
              Bookings
              {stats.pendingBookings > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 justify-center">
                  {stats.pendingBookings}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Stats Cards with Icons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                        <p className="text-3xl font-bold mt-1">{stats.pendingBookings}</p>
                      </div>
                      <div className="p-3 bg-amber-100 rounded-full">
                        <Clock className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                    {bookings.length > 0 && (
                      <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${(stats.pendingBookings / bookings.length) * 100}%` }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Bookings</p>
                        <p className="text-3xl font-bold mt-1">{stats.acceptedBookings}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    {bookings.length > 0 && (
                      <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${(stats.acceptedBookings / bookings.length) * 100}%` }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                        <p className="text-3xl font-bold mt-1">ETB {stats.totalRevenue.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      From completed & confirmed bookings
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-3xl font-bold">{stats.avgRating.toFixed(1)}</p>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${star <= Math.round(stats.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-yellow-100 rounded-full">
                        <Star className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Middle Section: Bookings + Status Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Recent Bookings</CardTitle>
                    <CardDescription>Your latest booking requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bookings.slice(0, 5).length > 0 ? (
                      <div className="space-y-4">
                        {bookings.slice(0, 5).map((booking: any) => (
                          <div key={booking.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${
                                booking.status === 'pending' ? 'bg-amber-500' :
                                booking.status === 'accepted' ? 'bg-blue-500' :
                                booking.status === 'completed' ? 'bg-green-500' :
                                booking.status === 'declined' ? 'bg-red-500' :
                                'bg-gray-500'
                              }`} />
                              <div>
                                <p className="font-medium">{booking.customerName}</p>
                                <p className="text-sm text-muted-foreground">{booking.event_type} • {new Date(booking.event_date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className={getStatusColor(booking.status)}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <Calendar className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p>No recent bookings</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Booking Status</CardTitle>
                    <CardDescription>Distribution overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bookings.length > 0 ? (
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Pending', value: bookings.filter((b: any) => b.status === 'pending').length, color: '#f59e0b' },
                                { name: 'Accepted', value: bookings.filter((b: any) => b.status === 'accepted').length, color: '#3b82f6' },
                                { name: 'Completed', value: bookings.filter((b: any) => b.status === 'completed').length, color: '#22c55e' },
                                { name: 'Declined', value: bookings.filter((b: any) => b.status === 'declined').length, color: '#ef4444' },
                                { name: 'Cancelled', value: bookings.filter((b: any) => b.status === 'cancelled').length, color: '#6b7280' },
                              ].filter((item) => item.value > 0)}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {[
                                { name: 'Pending', value: bookings.filter((b: any) => b.status === 'pending').length, color: '#f59e0b' },
                                { name: 'Accepted', value: bookings.filter((b: any) => b.status === 'accepted').length, color: '#3b82f6' },
                                { name: 'Completed', value: bookings.filter((b: any) => b.status === 'completed').length, color: '#22c55e' },
                                { name: 'Declined', value: bookings.filter((b: any) => b.status === 'declined').length, color: '#ef4444' },
                                { name: 'Cancelled', value: bookings.filter((b: any) => b.status === 'cancelled').length, color: '#6b7280' },
                              ].filter((item) => item.value > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <ReTooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
                        <div className="text-center">
                          <PieChartIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                          <p>No booking data yet</p>
                        </div>
                      </div>
                    )}
                    {bookings.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {[
                          { label: 'Pending', value: bookings.filter((b: any) => b.status === 'pending').length, color: 'bg-amber-500' },
                          { label: 'Accepted', value: bookings.filter((b: any) => b.status === 'accepted').length, color: 'bg-blue-500' },
                          { label: 'Completed', value: bookings.filter((b: any) => b.status === 'completed').length, color: 'bg-green-500' },
                          { label: 'Declined', value: bookings.filter((b: any) => b.status === 'declined').length, color: 'bg-red-500' },
                        ].filter((item) => item.value > 0).map((item) => (
                          <div key={item.label} className="flex items-center gap-2 text-sm">
                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                            <span className="text-muted-foreground">{item.label}:</span>
                            <span className="font-medium">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and management</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button variant="outline" className="justify-start h-auto py-4" onClick={() => setActiveTab('menu')}>
                    <div className="p-2 bg-primary/10 rounded-lg mr-3">
                      <Utensils className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Manage Menu</p>
                      <p className="text-xs text-muted-foreground">{menuItems.length} items listed</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-4" onClick={() => setActiveTab('promotions')}>
                    <div className="p-2 bg-primary/10 rounded-lg mr-3">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Post Promotion</p>
                      <p className="text-xs text-muted-foreground">Reach more customers</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-4" onClick={() => setActiveTab('profile')}>
                    <div className="p-2 bg-primary/10 rounded-lg mr-3">
                      <Settings className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Update Profile</p>
                      <p className="text-xs text-muted-foreground">Business details & settings</p>
                    </div>
                  </Button>
                </CardContent>
              </Card>

              {/* Performance Analytics */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">Performance Analysis</h2>
                  <p className="text-sm text-muted-foreground">
                    Track profile views, conversion, revenue, and booking trends.
                  </p>
                </div>
                <VendorAnalytics />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle>Bookings</CardTitle>
                  <Input
                    placeholder="Search by customer, event type, or booking ref…"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="sm:max-w-xs"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ref</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings
                      .filter((booking: any) => {
                        if (!bookingSearch.trim()) return true;
                        const q = bookingSearch.toLowerCase();
                        return (
                          booking.customerName?.toLowerCase().includes(q) ||
                          booking.event_type?.toLowerCase().includes(q) ||
                          booking.id?.toLowerCase().includes(q)
                        );
                      })
                      .map((booking: any) => (
                      <TableRow
                        key={booking.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedBookingForDetails(booking);
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">{booking.id.slice(0, 8).toUpperCase()}</TableCell>
                        <TableCell className="font-medium">{booking.customerName}</TableCell>
                        <TableCell>{booking.event_type}</TableCell>
                        <TableCell>{new Date(booking.event_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(booking.status)}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {booking.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updateBookingStatus(booking.id, 'accepted')}>Accept</Button>
                              <Button size="sm" variant="outline" onClick={() => updateBookingStatus(booking.id, 'declined')}>Decline</Button>
                            </div>
                          )}
                          {booking.status === 'accepted' && new Date(booking.event_date) <= new Date() && (
                            <Button size="sm" onClick={() => updateBookingStatus(booking.id, 'completed')} className="bg-green-600 hover:bg-green-700 text-white">
                              <Check className="mr-2 h-4 w-4" />
                              Mark Completed
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Menu Items</h2>
                <AddMenuItemDialog onAdd={addMenuItem} onRefresh={refresh} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {menuItems.map((item: any) => (
                  <Card key={item.id} className="overflow-hidden">
                    {item.image && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform hover:scale-105"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="flex justify-between items-start gap-2">
                        <span>{item.name}</span>
                        <span className="text-primary whitespace-nowrap">ETB {item.price}</span>
                      </CardTitle>
                      <CardDescription>{item.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <div className="flex gap-2 mt-4">
                        <EditMenuItemDialog
                          item={item}
                          onUpdate={updateMenuItem}
                          onRefresh={refresh}
                        />
                        <Button variant="destructive" size="sm" onClick={() => deleteMenuItem(item.id)}>Delete</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <Card key={review.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{review.customerName}</span>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-accent text-accent' : 'text-muted'}`} />
                        ))}
                      </div>
                    </CardTitle>
                    <CardDescription>{new Date(review.created_at).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{review.comment}</p>
                    {review.response ? (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-semibold mb-1">Your Response:</p>
                        <p className="text-sm text-muted-foreground">{review.response}</p>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <ResponseDialog review={review} onResponse={refresh} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="promotions">
            <PromotionsTab vendorId={user?.id} catererId={vendorCaterer.id} />
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>Update your business information and guest capacity</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <div className="max-w-xs">
                      <ImageUpload
                        currentImage={vendorCaterer?.cover_image}
                        onUploadSuccess={(imageUrl) => {
                          toast({ title: 'Success', description: 'Cover image updated' });
                          refresh();
                        }}
                        uploadType="cover-image"
                        entityId={vendorCaterer?.id || ''}
                        label="Cover Image"
                        aspectRatio="square"
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brief Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="long_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>About Us</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={6}
                              placeholder="Tell customers more about your business, your story, and what makes you special..."
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">A detailed description of your catering business</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="min_guests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Min Guests</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="max_guests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Guests</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="years_in_business"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years in Business</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="price_range"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price Range</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select price range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PRICE_RANGE_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <span className="font-medium">{opt.label}</span>
                                  <span className="ml-2 text-xs text-muted-foreground">{opt.subtitle}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="cuisines"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cuisines (comma separated)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Italian, French, Ethiopian" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="specialties"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialties (comma separated)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Vegan Options, Gluten-Free" {...field} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">What makes your catering service unique</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="event_types"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Types (comma separated)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Wedding, Corporate" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="termsAccepted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I agree to the <Link to="/terms" className="text-primary hover:underline">Terms and Policy</Link>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="mt-4">
                      Save Changes
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <BookingDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        booking={selectedBookingForDetails}
        mode="vendor"
        onStatusUpdate={updateBookingStatus}
      />
    </div >
  );
}

const responseSchema = z.object({
  responseText: z.string().min(1, 'Response cannot be empty').max(1000, 'Response is too long'),
});

type ResponseFormData = z.infer<typeof responseSchema>;

function ResponseDialog({ review, onResponse }: { review: any; onResponse: () => void }) {
  const [open, setOpen] = useState(false);
  const { respondToReview, isLoading } = useReviews();
  const { toast } = useToast();

  const form = useForm<ResponseFormData>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      responseText: '',
    },
  });

  const onSubmit = async (data: ResponseFormData) => {
    const res = await respondToReview(review.id, data.responseText);
    if (res.success) {
      toast({ title: 'Success', description: 'Response submitted' });
      setOpen(false);
      onResponse();
      form.reset();
    } else {
      toast({ title: 'Error', description: res.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <MessageSquare className="mr-2 h-4 w-4" />
          Respond to Review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Respond to {review.customerName}'s Review</DialogTitle>
          <DialogDescription>
            Your response will be visible on your public profile.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg italic text-sm">
              "{review.comment}"
            </div>
            <FormField
              control={form.control}
              name="responseText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Response</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Thank you for your feedback..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Response'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditMenuItemDialog({ item, onUpdate, onRefresh }: { item: any; onUpdate: (itemId: string, item: any) => Promise<any>; onRefresh?: () => void }) {
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(item.image || null);
  const { toast } = useToast();

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: item.name || '',
      description: item.description || '',
      price: item.price?.toString() || '',
      category: item.category || ''
    },
  });

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: item.name || '',
        description: item.description || '',
        price: item.price?.toString() || '',
        category: item.category || ''
      });
      setPreview(item.image || null);
      setSelectedImage(null);
    }
  }, [open, item, form]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid file type', description: 'Please select an image', variant: 'destructive' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Max file size is 5MB', variant: 'destructive' });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: MenuItemFormData) => {
    const res = await onUpdate(item.id, {
      ...data,
      price: parseFloat(data.price),
    });

    if (res.success) {
      let uploadSuccess = true;

      // Upload new image if one was selected
      if (selectedImage) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', selectedImage);
        formDataUpload.append('menu_item_id', item.id);

        try {
          const token = localStorage.getItem('caterconnect_token');
          const uploadRes = await fetch(`${API_URL}/upload/menu-item-image`, {
            method: 'POST',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formDataUpload
          });

          if (!uploadRes.ok) {
            uploadSuccess = false;
            const errorText = await uploadRes.text();
            let errorMessage = `Upload failed (${uploadRes.status})`;
            if (errorText) {
              try {
                const errData = JSON.parse(errorText);
                errorMessage = errData.message || errorMessage;
              } catch {
                errorMessage = errorText;
              }
            }
            toast({ title: 'Image Upload Failed', description: errorMessage, variant: 'destructive' });
          }
        } catch (e) {
          uploadSuccess = false;
          console.error(e);
          toast({ title: 'Image Upload Failed', description: 'Network error', variant: 'destructive' });
        }
      }

      if (uploadSuccess) {
        toast({ title: 'Item updated successfully' });
        setOpen(false);
        if (onRefresh) onRefresh();
      }
    } else {
      toast({ title: 'Error updating item', description: res.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>Edit Menu Item</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="max-h-[60vh] overflow-y-auto pr-2 py-2 space-y-4">
              <div className="grid gap-2">
                <Label>Item Image</Label>
                <div className="flex flex-col gap-4">
                  <Input type="file" accept="image/*" onChange={handleFileSelect} />
                  {preview && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                      <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Starter, Main, Dessert" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (ETB)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Update Item</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddMenuItemDialog({ onAdd, onRefresh }: { onAdd: (item: any) => Promise<any>, onRefresh?: () => void }) {
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      category: '',
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid file type', description: 'Please select an image', variant: 'destructive' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Max file size is 5MB', variant: 'destructive' });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: MenuItemFormData) => {
    const res = await onAdd(data);

    if (res.success) {
      let uploadSuccess = true;

      if (selectedImage && res.data?.id) {
        const formData = new FormData();
        formData.append('image', selectedImage);
        formData.append('menu_item_id', res.data.id);

        try {
          const token = localStorage.getItem('caterconnect_token');
          const uploadRes = await fetch(`${API_URL}/upload/menu-item-image`, {
            method: 'POST',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData
          });

          if (!uploadRes.ok) {
            uploadSuccess = false;
            const errorText = await uploadRes.text();
            let errorMessage = `Upload failed (${uploadRes.status})`;
            if (errorText) {
              try {
                const errData = JSON.parse(errorText);
                errorMessage = errData.message || errorMessage;
              } catch {
                errorMessage = errorText;
              }
            }
            toast({ title: 'Image Upload Failed', description: errorMessage, variant: 'destructive' });
          }
        } catch (e) {
          uploadSuccess = false;
          console.error(e);
          toast({ title: 'Image Upload Failed', description: 'Network error', variant: 'destructive' });
        }
      }

      if (uploadSuccess) {
        toast({ title: 'Item added successfully' });
        setOpen(false);
        form.reset();
        setSelectedImage(null);
        setPreview(null);
        if (onRefresh) onRefresh();
      }
    } else {
      toast({ title: 'Error adding item', description: res.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Item</Button></DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>Add Menu Item</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="max-h-[60vh] overflow-y-auto pr-2 py-2 space-y-4">
              <div className="grid gap-2">
                <Label>Item Image</Label>
                <div className="flex flex-col gap-4">
                  <Input type="file" accept="image/*" onChange={handleFileSelect} />
                  {preview && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                      <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Starter, Main, Dessert" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (ETB)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save Item</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const promotionSchema = z.object({
  caption: z.string().min(1, 'Caption is required').max(500, 'Caption is too long'),
  tags: z.string().optional(),
});

type PromotionFormData = z.infer<typeof promotionSchema>;

function PromotionsTab({ vendorId, catererId }: { vendorId?: string; catererId: string }) {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<PromotionFormData>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      caption: '',
      tags: '',
    },
  });

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('caterconnect_token');
      const res = await fetch(`${API_URL}/promotions`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        setPromotions(data.promotions.filter((p: any) => p.caterer_id === catererId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!vendorId) return;
    try {
      const token = localStorage.getItem('caterconnect_token');
      const res = await fetch(`${API_URL}/promotions/stats/${vendorId}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPromotions();
    fetchStats();
  }, [catererId, vendorId]);

  const handleDelete = async (id: string) => {
    if (!vendorId) return;
    try {
      const token = localStorage.getItem('caterconnect_token');
      const res = await fetch(`${API_URL}/promotions/${id}/${vendorId}`, { 
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Promotion deleted' });
        fetchPromotions();
        fetchStats();
      } else {
        toast({ title: 'Failed to delete', description: data.message, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const onSubmit = async (data: PromotionFormData) => {
    if (!selectedFile || !vendorId) {
      toast({ title: 'Missing file', description: 'Please select an image or video to upload', variant: 'destructive' });
      return;
    }
    const fd = new FormData();
    fd.append('media', selectedFile);
    fd.append('caption', data.caption);
    fd.append('tags', data.tags || '');
    fd.append('vendorId', vendorId);

    setIsUploading(true);
    try {
      const token = localStorage.getItem('caterconnect_token');
      const res = await fetch(`${API_URL}/promotions`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: fd
      });
      const dataRes = await res.json();
      if (dataRes.success) {
        toast({ title: 'Promotion added successfully!' });
        setOpen(false);
        form.reset();
        setSelectedFile(null);
        fetchPromotions();
        fetchStats();
      } else {
        toast({ title: 'Upload failed', description: dataRes.message, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Followers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.followers}</div>
              <p className="text-xs text-muted-foreground">Total followers on your page</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" /> Total Likes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_likes}</div>
              <p className="text-xs text-muted-foreground">Across all promotions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" /> Total Shares
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_shares}</div>
              <p className="text-xs text-muted-foreground">Across all promotions</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Your Promotions</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Promotion</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload New Promotion</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label>Media (Image or Video)</Label>
                  <Input type="file" accept="image/*,video/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                  <p className="text-xs text-muted-foreground">Upload short vertical videos or engaging photos for maximum impact.</p>
                </div>
                <FormField
                  control={form.control}
                  name="caption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caption</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Write an engaging caption..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Wedding, Delicious, Catering" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isUploading}>{isUploading ? 'Uploading...' : 'Upload'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {promotions.map(p => {
            // Find matching stats for this promotion
            const promoStat = stats?.promotions?.find((s: any) => s.id === p.id);
            return (
              <Card key={p.id} className="overflow-hidden group relative">
                <div className="aspect-[9/16] w-full bg-black">
                  {p.media_type === 'video' ? (
                    <video src={p.media_url} className="w-full h-full object-cover" controls={false} muted />
                  ) : (
                    <img src={p.media_url} className="w-full h-full object-cover" />
                  )}
                </div>
                {/* Stats overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
                  <p className="text-xs line-clamp-1 font-medium mb-2">{p.caption}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">❤️ {promoStat?.likes_count ?? 0}</span>
                    <span className="flex items-center gap-1">🔖 {promoStat?.saves_count ?? 0}</span>
                    <span className="flex items-center gap-1">🔗 {promoStat?.shares_count ?? 0}</span>
                  </div>
                </div>
                {/* Delete overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="mr-1 h-4 w-4" /> Delete
                  </Button>
                </div>
              </Card>
            );
          })}
          {promotions.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              You haven't uploaded any promotions yet. Share videos or images to reach more customers!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
