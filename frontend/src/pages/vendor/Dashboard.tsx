import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ensureVendorSetup, useUpdateCaterer, useVendorCaterer, type Caterer } from '@/hooks/supabase/useCaterers';
import { useCatererBookings, useUpdateBooking, type Booking } from '@/hooks/supabase/useBookings';
import {
  useMenuItemsByCaterer,
  useCreateMenuItem,
  useDeleteMenuItem,
  useUpdateMenuItem,
  type MenuItem,
} from '@/hooks/supabase/useMenuItems';
import { useRespondToReview, useReviewsByCaterer, type ReviewWithCustomer } from '@/hooks/supabase/useReviews';
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
  Star,
  Clock,
  Check,
  X,
  MoreVertical,
  Plus,
  Trash2,
  MessageSquare,
  Settings,
  LogOut,
  TrendingUp,
  Utensils,
  Ban,
  Users,
} from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

export default function VendorDashboard() {
  const { user, profile, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: caterer, isLoading: catererLoading, refetch: refetchCaterer } = useVendorCaterer(user?.id);
  const catererId = caterer?.id;

  const { data: bookings = [], isLoading: bookingsLoading } = useCatererBookings(catererId);
  const { data: menuItems = [], isLoading: menuLoading } = useMenuItemsByCaterer(catererId);
  const { data: reviews = [] } = useReviewsByCaterer(catererId);

  // Self-heal legacy / email-confirmation accounts with no caterer row yet
  useEffect(() => {
    if (user?.id && !catererLoading && !caterer) {
      ensureVendorSetup(user.id).then(() => refetchCaterer());
    }
  }, [user?.id, catererLoading, caterer, refetchCaterer]);

  if (catererLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // No store yet (just created) — wait for refetch
  if (!caterer) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-6">
          <CardTitle>Setting up your store…</CardTitle>
          <CardDescription className="mt-2">Creating your vendor profile. This takes a few seconds.</CardDescription>
          <Button className="mt-4" onClick={() => refetchCaterer()}>Retry</Button>
        </Card>
      </div>
    );
  }

  // Approval gate: pending or suspended vendors cannot access the platform
  if (caterer.is_pending || !caterer.is_approved) {
    if (caterer.is_pending) {
      return <Navigate to="/vendor/pending" replace />;
    }
    // Suspended (e.g. monthly payment missed — admin set is_approved=false)
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full text-center p-6">
          <Ban className="h-12 w-12 mx-auto text-destructive mb-4" />
          <CardTitle>Account suspended</CardTitle>
          <CardDescription className="mt-2">
            Your store &quot;{caterer.name}&quot; is currently offline. Please contact admin about your
            monthly access.
          </CardDescription>
          <div className="flex gap-2 justify-center mt-4">
            <Button variant="outline" onClick={() => refetchCaterer()}>Check again</Button>
            <Button variant="outline" onClick={() => { logout(); navigate('/'); }}>Sign out</Button>
          </div>
        </Card>
      </div>
    );
  }

  const typedBookings = (bookings ?? []) as Booking[];
  const typedReviews = (reviews ?? []) as ReviewWithCustomer[];

  const pendingBookings = typedBookings.filter((b) => b.status === 'pending').length;
  const acceptedBookings = typedBookings.filter((b) => b.status === 'accepted').length;
  const totalRevenue = typedBookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const avgRating =
    typedReviews.length > 0 ? typedReviews.reduce((sum, r) => sum + r.rating, 0) / typedReviews.length : 0;
  const stats = { pendingBookings, acceptedBookings, totalRevenue, avgRating };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isLoadingData = bookingsLoading || menuLoading;

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
            <Badge variant="outline" className="text-green-700 border-green-300">Live</Badge>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {profile?.name || 'Vendor'}</span>
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
          <h1 className="text-3xl font-serif font-bold text-foreground">{caterer.name}</h1>
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

          <TabsContent value="overview">
            <OverviewTab stats={stats} bookings={typedBookings} reviews={typedReviews} />
          </TabsContent>

          <TabsContent value="bookings">
            {isLoadingData ? <p className="text-muted-foreground">Loading bookings…</p> : <BookingsTab bookings={typedBookings} />}
          </TabsContent>

          <TabsContent value="menu">
            {catererId && <MenuTab menuItems={(menuItems ?? []) as MenuItem[]} catererId={catererId} />}
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsTab reviews={typedReviews} />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileTab caterer={caterer} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function OverviewTab({
  stats,
  bookings,
  reviews,
}: {
  stats: { pendingBookings: number; acceptedBookings: number; totalRevenue: number; avgRating: number };
  bookings: Booking[];
  reviews: ReviewWithCustomer[];
}) {
  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="space-y-6">
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
                      <p className="font-medium">{booking.event_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.guest_count} guests • {new Date(booking.event_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={booking.status === 'pending' ? 'secondary' : booking.status === 'accepted' ? 'default' : 'outline'}>
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
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-accent fill-accent' : 'text-muted'}`} />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
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

function BookingsTab({ bookings }: { bookings: Booking[] }) {
  const { toast } = useToast();
  const updateBooking = useUpdateBooking();

  const setStatus = async (bookingId: string, status: Booking['status']) => {
    try {
      await updateBooking.mutateAsync({ id: bookingId, updates: { status } });
      toast({ title: status === 'accepted' ? 'Booking Accepted' : 'Booking Updated', description: `Status set to ${status}.` });
    } catch (e) {
      toast({ title: 'Update failed', description: e instanceof Error ? e.message : 'Could not update booking.', variant: 'destructive' });
    }
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
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.event_type}</TableCell>
                  <TableCell>{new Date(booking.event_date).toLocaleDateString()}</TableCell>
                  <TableCell>{booking.guest_count}</TableCell>
                  <TableCell>{booking.venue || 'TBD'}</TableCell>
                  <TableCell>
                    <Badge variant={booking.status === 'pending' ? 'secondary' : booking.status === 'accepted' ? 'default' : 'outline'}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {booking.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => setStatus(booking.id, 'accepted')} disabled={updateBooking.isPending}>
                          <Check className="h-4 w-4 mr-1" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setStatus(booking.id, 'declined')} disabled={updateBooking.isPending}>
                          <X className="h-4 w-4 mr-1" /> Decline
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost">View Details</Button>
                    )}
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

function MenuTab({ menuItems, catererId }: { menuItems: MenuItem[]; catererId: string }) {
  const { toast } = useToast();
  const createItem = useCreateMenuItem();
  const deleteItem = useDeleteMenuItem();
  const updateItem = useUpdateMenuItem();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', category: '' });
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const categories = [...new Set(menuItems.map((item) => item.category || 'Uncategorized'))];

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    try {
      let imageUrl: string | null = null;
      if (itemImageFile) {
        setUploadingImage(true);
        imageUrl = await uploadToCloudinary(itemImageFile, 'catering_app/menu_items');
        setUploadingImage(false);
      }
      await createItem.mutateAsync({
        caterer_id: catererId,
        name: newItem.name,
        description: newItem.description || null,
        price: parseFloat(newItem.price),
        category: newItem.category,
        image: imageUrl,
        is_popular: false,
        dietary_info: [],
      });
      setNewItem({ name: '', description: '', price: '', category: '' });
      setItemImageFile(null);
      setIsAddDialogOpen(false);
      toast({ title: 'Menu item added', description: `${newItem.name} has been added.` });
    } catch (e) {
      toast({ title: 'Add failed', description: e instanceof Error ? e.message : 'Could not add item.', variant: 'destructive' });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem.mutateAsync(itemId);
      toast({ title: 'Menu item removed' });
    } catch (e) {
      toast({ title: 'Delete failed', description: e instanceof Error ? e.message : 'Could not delete.', variant: 'destructive' });
    }
  };

  const togglePopular = async (item: MenuItem) => {
    try {
      await updateItem.mutateAsync({ id: item.id, updates: { is_popular: !item.is_popular } });
    } catch (e) {
      toast({ title: 'Update failed', description: e instanceof Error ? e.message : 'Could not update.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Menu Management</h2>
          <p className="text-muted-foreground">Visible to customers in the mobile app once you are live</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Menu Item</DialogTitle>
              <DialogDescription>Add a new item to your menu</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">Name *</Label>
                <Input id="item-name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="e.g., Grilled Salmon" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-description">Description</Label>
                <Textarea id="item-description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="Describe the dish..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-price">Price *</Label>
                  <Input id="item-price" type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} placeholder="25.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-category">Category *</Label>
                  <Input id="item-category" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} placeholder="e.g., Main Course" />
                </div>
              </div>
              {isCloudinaryConfigured() && (
                <div className="space-y-2">
                  <Label htmlFor="item-image">Photo (Cloudinary)</Label>
                  <Input id="item-image" type="file" accept="image/*" onChange={(e) => setItemImageFile(e.target.files?.[0] || null)} />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddItem} disabled={createItem.isPending || uploadingImage}>{uploadingImage ? 'Uploading…' : 'Add Item'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length > 0 && menuItems.length > 0 ? (
        categories.map((category) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Utensils className="h-5 w-5" />{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {menuItems.filter((item) => (item.category || 'Uncategorized') === category).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{item.name}</h4>
                        {item.is_popular && <Badge variant="secondary" className="text-xs">Popular</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-primary">${item.price}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card">
                          <DropdownMenuItem onClick={() => togglePopular(item)}>
                            <Star className="mr-2 h-4 w-4" />{item.is_popular ? 'Unmark popular' : 'Mark popular'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteItem(item.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />Delete
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
            <Button onClick={() => setIsAddDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Your First Item</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReviewsTab({ reviews }: { reviews: ReviewWithCustomer[] }) {
  const { toast } = useToast();
  const respond = useRespondToReview();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      await respond.mutateAsync({ id: reviewId, response: replyText.trim() });
      toast({ title: 'Reply sent', description: 'Your response has been posted.' });
      setReplyingTo(null);
      setReplyText('');
    } catch (e) {
      toast({ title: 'Reply failed', description: e instanceof Error ? e.message : 'Could not post reply.', variant: 'destructive' });
    }
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
                      <p className="text-sm font-medium">{review.customer?.name || 'Customer'}</p>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-accent fill-accent' : 'text-muted'}`} />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
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
                    <Textarea placeholder="Write your response..." value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleReply(review.id)} disabled={respond.isPending}>Post Reply</Button>
                      <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="ml-6" onClick={() => setReplyingTo(review.id)}>
                    <MessageSquare className="h-4 w-4 mr-2" />Reply
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

function ProfileTab({ caterer }: { caterer: Caterer }) {
  const { toast } = useToast();
  const updateCaterer = useUpdateCaterer();
  const [form, setForm] = useState({
    name: caterer.name,
    description: caterer.description || '',
    long_description: caterer.long_description || '',
    location: caterer.location || '',
    contact_phone: caterer.contact_phone || '',
    contact_email: caterer.contact_email || '',
    website: caterer.website || '',
    cover_image: caterer.cover_image || '',
    images: (caterer.images || []).join('\n'),
    price_range: caterer.price_range || '',
    min_guests: caterer.min_guests ?? 1,
    max_guests: caterer.max_guests ?? 100,
    cuisines: (caterer.cuisines || []).join(', '),
    event_types: (caterer.event_types || []).join(', '),
    specialties: (caterer.specialties || []).join(', '),
    years_in_business: caterer.years_in_business ?? 0,
  });

  const handleSave = async () => {
    try {
      await updateCaterer.mutateAsync({
        id: caterer.id,
        updates: {
          name: form.name.trim() || caterer.name,
          description: form.description || null,
          long_description: form.long_description || null,
          location: form.location || null,
          contact_phone: form.contact_phone || null,
          contact_email: form.contact_email || null,
          website: form.website || null,
          cover_image: form.cover_image || null,
          images: form.images.split('\n').map((s) => s.trim()).filter(Boolean),
          price_range: (form.price_range || null) as Caterer['price_range'],
          min_guests: Number(form.min_guests) || 1,
          max_guests: Number(form.max_guests) || 100,
          cuisines: form.cuisines.split(',').map((s) => s.trim()).filter(Boolean),
          event_types: form.event_types.split(',').map((s) => s.trim()).filter(Boolean),
          specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
          years_in_business: Number(form.years_in_business) || 0,
        },
      });
      toast({ title: 'Profile updated', description: 'Your store is updated and visible to the mobile app.' });
    } catch (e) {
      toast({ title: 'Save failed', description: e instanceof Error ? e.message : 'Could not save.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Store Profile</h2>
        <p className="text-muted-foreground">This is what customers see in the mobile app</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Business Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business-name">Business Name</Label>
              <Input id="business-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Short description</Label>
              <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="long-description">Long description</Label>
              <Textarea id="long-description" rows={4} value={form.long_description} onChange={(e) => setForm({ ...form, long_description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-guests">Min Guests</Label>
                <Input id="min-guests" type="number" value={form.min_guests} onChange={(e) => setForm({ ...form, min_guests: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-guests">Max Guests</Label>
                <Input id="max-guests" type="number" value={form.max_guests} onChange={(e) => setForm({ ...form, max_guests: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price-range">Price range ($-$$$$)</Label>
                <Input id="price-range" value={form.price_range} onChange={(e) => setForm({ ...form, price_range: e.target.value })} placeholder="$" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years">Years in business</Label>
                <Input id="years" type="number" value={form.years_in_business} onChange={(e) => setForm({ ...form, years_in_business: Number(e.target.value) })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contact & Media</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Contact phone (shown in mobile app)</Label>
              <Input id="contact-phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Contact email</Label>
              <Input id="contact-email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover">Cover image (Cloudinary upload or URL)</Label>
              <Input id="cover" value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} placeholder="https://…" />
              {isCloudinaryConfigured() && (
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadToCloudinary(file, 'catering_app/covers');
                    setForm((f) => ({ ...f, cover_image: url }));
                  }}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="images">Gallery URLs (one per line, or upload below)</Label>
              <Textarea id="images" rows={4} value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder="https://…&#10;https://…" />
              {isCloudinaryConfigured() && (
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    for (const file of files.slice(0, 6)) {
                      const url = await uploadToCloudinary(file, 'catering_app/covers');
                      setForm((f) => ({ ...f, images: f.images ? `${f.images}\n${url}` : url }));
                    }
                  }}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cuisines">Cuisines (comma-separated)</Label>
              <Input id="cuisines" value={form.cuisines} onChange={(e) => setForm({ ...form, cuisines: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-types">Event Types (comma-separated)</Label>
              <Input id="event-types" value={form.event_types} onChange={(e) => setForm({ ...form, event_types: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties (comma-separated)</Label>
              <Input id="specialties" value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateCaterer.isPending}>
          {updateCaterer.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
