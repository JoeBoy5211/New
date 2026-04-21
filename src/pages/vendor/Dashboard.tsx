import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useVendorCaterer } from '@/hooks/useCaterers';
import { useCatererBookings, BookingWithCaterer } from '@/hooks/useBookings';
import { useMenuItemsByCaterer, MenuItem } from '@/hooks/useMenuItems';
import { Review } from '@/data/mockData';
import { getReviewsByCaterer } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
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
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export default function VendorDashboard() {
  const { user, profile, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: vendorCaterer, isLoading: catererLoading } = useVendorCaterer(user?.id);
  const { data: bookings = [], isLoading: bookingsLoading } = useCatererBookings(vendorCaterer?.id);
  const { data: menuItems = [] } = useMenuItemsByCaterer(vendorCaterer?.id);

  // Still use mock reviews for now since we haven't built the real reviews backend yet
  const reviews = useMemo(() => vendorCaterer ? getReviewsByCaterer(vendorCaterer.id) : [], [vendorCaterer]);

  // Stats
  const stats = useMemo(() => {
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const acceptedBookings = bookings.filter(b => b.status === 'accepted').length;
    const totalRevenue = bookings
      .filter(b => b.status === 'completed' || b.status === 'confirmed')
      .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return { pendingBookings, acceptedBookings, totalRevenue, avgRating };
  }, [bookings, reviews]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              Welcome, {profile?.name || 'Vendor'}
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!vendorCaterer && !catererLoading ? (
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold mb-2">No Caterer Profile Found</h2>
            <p className="text-muted-foreground">It looks like your application is pending or you haven't created a profile.</p>
          </div>
        ) : catererLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading dashboard...</div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-serif font-bold text-foreground">{vendorCaterer?.name}</h1>
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
                <TabsTrigger value="profile">Profile</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <OverviewTab stats={stats} bookings={bookings} reviews={reviews} />
              </TabsContent>

              {/* Bookings Tab */}
              <TabsContent value="bookings">
                <BookingsTab bookings={bookings} />
              </TabsContent>

              {/* Menu Tab */}
              <TabsContent value="menu">
                <MenuTab menuItems={menuItems} catererId={vendorCaterer.id} />
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews">
                <ReviewsTab reviews={reviews} />
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <ProfileTab caterer={vendorCaterer as any} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  stats,
  bookings,
  reviews
}: {
  stats: { pendingBookings: number; acceptedBookings: number; totalRevenue: number; avgRating: number };
  bookings: any[];
  reviews: Review[];
}) {
  const recentBookings = bookings.slice(0, 5);
  const chartData = useMemo(() => {
    const byMonth = new Map<string, { month: string; revenue: number; bookings: number }>();

    bookings.forEach((booking) => {
      const rawDate = booking.event_date || booking.eventDate || booking.created_at || booking.createdAt;
      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return;

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = byMonth.get(monthKey) ?? { month: monthKey, revenue: 0, bookings: 0 };

      if (booking.status === 'completed' || booking.status === 'confirmed') {
        current.revenue += Number(booking.total_amount) || 0;
        current.bookings += 1;
      }

      byMonth.set(monthKey, current);
    });

    return Array.from(byMonth.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map((item) => ({
        ...item,
        label: new Date(`${item.month}-01`).toLocaleDateString(undefined, {
          month: 'short',
          year: 'numeric',
        }),
      }));
  }, [bookings]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingBookings}</div>
            <p className="text-xs text-muted-foreground">Awaiting your response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.acceptedBookings}</div>
            <p className="text-xs text-muted-foreground">Confirmed events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From completed events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">From {reviews.length} reviews</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">Performance Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Revenue and booking trends for the last 6 months.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Completed and confirmed bookings</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No revenue data yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking Trend</CardTitle>
              <CardDescription>Successful bookings per month</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value: number) => [value, 'Bookings']} />
                    <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No booking trend data yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{booking.event_type || booking.eventType}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.guest_count || booking.guestCount} guests • {new Date(booking.event_date || booking.eventDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={
                      booking.status === 'pending' ? 'secondary' :
                        booking.status === 'accepted' ? 'default' :
                          booking.status === 'completed' ? 'outline' : 'destructive'
                    }>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No bookings yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'text-accent fill-accent' : 'text-muted'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No reviews yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BookingsTab({ bookings }: { bookings: any[] }) {
  const { toast } = useToast();
  const [localBookings, setLocalBookings] = useState(bookings);
  // Use a map to store fetched booking items
  const [bookingItemsData, setBookingItemsData] = useState<Record<string, any[]>>({});

  const handleAccept = (bookingId: string) => {
    setLocalBookings(prev =>
      prev.map(b => b.id === bookingId ? { ...b, status: 'accepted' as const } : b)
    );
    toast({
      title: 'Booking Accepted',
      description: 'The customer has been notified.',
    });
  };

  const handleDecline = (bookingId: string) => {
    setLocalBookings(prev =>
      prev.map(b => b.id === bookingId ? { ...b, status: 'declined' as const } : b)
    );
    toast({
      title: 'Booking Declined',
      description: 'The customer has been notified.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Requests</CardTitle>
        <CardDescription>Manage incoming booking requests from customers</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Guests</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localBookings.length > 0 ? (
              localBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    {booking.event_type}
                    {booking.service_type && <div className="text-xs text-muted-foreground border rounded px-1 inline-block ml-2">{booking.service_type}</div>}
                  </TableCell>
                  <TableCell>{new Date(booking.event_date).toLocaleDateString()}</TableCell>
                  <TableCell>{booking.guest_count}</TableCell>
                  <TableCell>{booking.venue || 'TBD'}</TableCell>
                  <TableCell>
                    <Badge variant={
                      booking.status === 'pending' ? 'secondary' :
                        booking.status === 'accepted' ? 'default' :
                          booking.status === 'completed' ? 'outline' : 'destructive'
                    }>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Booking Details</DialogTitle>
                          <DialogDescription>
                            Review the request and selected menu items
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-muted-foreground">Event Type</span>
                            <span className="font-medium">{booking.event_type} ({booking.service_type})</span>

                            <span className="text-muted-foreground">Date</span>
                            <span className="font-medium">{new Date(booking.event_date).toLocaleDateString()}</span>

                            <span className="text-muted-foreground">Guests</span>
                            <span className="font-medium">{booking.guest_count}</span>

                            <span className="text-muted-foreground">Total Price</span>
                            <span className="font-medium font-bold text-primary">${booking.total_amount?.toFixed(2) || '0.00'}</span>

                            {booking.contact_phone && (
                              <>
                                <span className="text-muted-foreground">Customer Phone</span>
                                <span className="font-medium text-primary">{booking.contact_phone}</span>
                              </>
                            )}
                          </div>

                          {booking.special_requests && (
                            <div className="text-sm border-t pt-2 mt-2">
                              <span className="text-muted-foreground block mb-1">Special Requests</span>
                              <p className="bg-muted p-2 rounded-md italic">{booking.special_requests}</p>
                            </div>
                          )}

                          <div className="border-t pt-2 mt-2">
                            <span className="text-sm text-muted-foreground font-medium mb-2 block">Menu Selection</span>
                            <p className="text-xs text-muted-foreground bg-primary/5 p-2 rounded border border-primary/20">
                              Selected menu items are fetched and managed in the details view.
                            </p>
                          </div>
                        </div>

                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No booking requests yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Menu Tab Component
function MenuTab({ menuItems, catererId }: { menuItems: MenuItem[]; catererId: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState(menuItems);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
  });

  const categories = [...new Set(items.map(item => item.category))];

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const item: MenuItem = {
      id: `menu-${Date.now()}`,
      caterer_id: catererId,
      name: newItem.name,
      description: newItem.description,
      price: parseFloat(newItem.price),
      category: newItem.category,
      image: null,
      is_popular: false,
      dietary_info: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setItems([...items, item]);
    setNewItem({ name: '', description: '', price: '', category: '' });
    setIsAddDialogOpen(false);
    toast({
      title: 'Menu item added',
      description: `${newItem.name} has been added to your menu.`,
    });
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
    toast({
      title: 'Menu item removed',
      description: 'The item has been removed from your menu.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Menu Management</h2>
          <p className="text-muted-foreground">Add, edit, or remove menu items</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Menu Item</DialogTitle>
              <DialogDescription>Add a new item to your menu</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">Name *</Label>
                <Input
                  id="item-name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Grilled Salmon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-description">Description</Label>
                <Textarea
                  id="item-description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Describe the dish..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-price">Price *</Label>
                  <Input
                    id="item-price"
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    placeholder="25.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-category">Category *</Label>
                  <Input
                    id="item-category"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    placeholder="e.g., Main Course"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem}>Add Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length > 0 ? (
        categories.map((category) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.name}</h4>
                          {item.is_popular && (
                            <Badge variant="secondary" className="text-xs">Popular</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-primary">${item.price}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No menu items yet</h3>
            <p className="text-muted-foreground mb-4">Start by adding your first menu item</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Item
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Reviews Tab Component
function ReviewsTab({ reviews }: { reviews: Review[] }) {
  const { toast } = useToast();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleReply = (reviewId: string) => {
    if (!replyText.trim()) return;

    toast({
      title: 'Reply sent',
      description: 'Your response has been posted.',
    });
    setReplyingTo(null);
    setReplyText('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Customer Reviews</h2>
        <p className="text-muted-foreground">View and respond to customer feedback</p>
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? 'text-accent fill-accent' : 'text-muted'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-foreground mb-4">{review.comment}</p>

                {review.response ? (
                  <div className="bg-muted/50 p-4 rounded-lg ml-6 border-l-2 border-primary">
                    <p className="text-sm font-medium mb-1">Your Response:</p>
                    <p className="text-sm text-muted-foreground">{review.response}</p>
                  </div>
                ) : replyingTo === review.id ? (
                  <div className="ml-6 space-y-3">
                    <Textarea
                      placeholder="Write your response..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleReply(review.id)}>
                        Post Reply
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-6"
                    onClick={() => setReplyingTo(review.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
            <p className="text-muted-foreground">Reviews from customers will appear here</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Profile Tab Component
function ProfileTab({ caterer }: { caterer: any }) {
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    name: caterer.name,
    description: caterer.description,
    location: caterer.location,
    minGuests: caterer.min_guests || caterer.minGuests,
    maxGuests: caterer.max_guests || caterer.maxGuests,
    cuisines: (caterer.cuisines || []).join(', '),
    eventTypes: (caterer.event_types || caterer.eventTypes || []).join(', '),
  });

  const handleSave = () => {
    toast({
      title: 'Profile updated',
      description: 'Your changes have been saved.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profile Settings</h2>
        <p className="text-muted-foreground">Update your business information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-guests">Min Guests</Label>
                <Input
                  id="min-guests"
                  type="number"
                  value={profile.minGuests}
                  onChange={(e) => setProfile({ ...profile, minGuests: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-guests">Max Guests</Label>
                <Input
                  id="max-guests"
                  type="number"
                  value={profile.maxGuests}
                  onChange={(e) => setProfile({ ...profile, maxGuests: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cuisines">Cuisines (comma-separated)</Label>
              <Input
                id="cuisines"
                value={profile.cuisines}
                onChange={(e) => setProfile({ ...profile, cuisines: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-types">Event Types (comma-separated)</Label>
              <Input
                id="event-types"
                value={profile.eventTypes}
                onChange={(e) => setProfile({ ...profile, eventTypes: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
