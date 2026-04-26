import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChefHat,
  Users,
  Store,
  Calendar,
  Star,
  LogOut,
  Check,
  X,
  Eye,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Shield,
  Settings,
  BarChart3,
  Bell,
  UserPlus,
  Crown,
  Mail,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AnalyticsTab } from '@/components/admin/AnalyticsTab';
import {
  useAdminStats,
  useAdminCaterers,
  useAdminCustomers,
  useAdminBookings,
  useAdminReviews,
  useApproveCaterer,
  useRejectCaterer,
  useDeleteReview,
  useAdminNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useAdminUsers,
  usePromoteToAdmin,
  useDeleteAdmin,
  type Review,
} from '@/hooks/useAdmin';
import { useCategories } from '@/hooks/useCategories';

export default function AdminDashboard() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Data queries
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: caterersData, isLoading: caterersLoading } = useAdminCaterers();
  const { data: customersData, isLoading: customersLoading } = useAdminCustomers();
  const { data: bookingsData, isLoading: bookingsLoading } = useAdminBookings();
  const { data: reviewsData, isLoading: reviewsLoading } = useAdminReviews();
  const { data: notificationsData } = useAdminNotifications();
  const { data: adminsData } = useAdminUsers();
  const { data: categoriesData } = useCategories();

  // Mutations
  const approveCaterer = useApproveCaterer();
  const rejectCaterer = useRejectCaterer();
  const deleteReview = useDeleteReview();
  const markNotificationRead = useMarkNotificationRead();
  const markAllNotificationsRead = useMarkAllNotificationsRead();
  const promoteToAdmin = usePromoteToAdmin();
  const deleteAdmin = useDeleteAdmin();

  // Local state
  const [deleteReviewDialog, setDeleteReviewDialog] = useState<{ open: boolean; review: Review | null }>({
    open: false,
    review: null,
  });
  const [addCategoryDialog, setAddCategoryDialog] = useState<{ open: boolean; type: 'cuisine' | 'event' }>({
    open: false,
    type: 'cuisine',
  });
  const [newCategory, setNewCategory] = useState('');
  const [promoteUserId, setPromoteUserId] = useState('');
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [deleteAdminDialog, setDeleteAdminDialog] = useState<{ open: boolean; adminId: string; adminName: string }>({
    open: false,
    adminId: '',
    adminName: '',
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Check if current user is super admin
  const isSuperAdmin = adminsData?.some(a => a.id === user?.id && a.isSuperAdmin) ?? false;

  // Derived data
  const caterers = caterersData || [];
  const customers = customersData || [];
  const bookings = bookingsData || [];
  const reviews = reviewsData || [];
  const notifications = notificationsData?.data || [];
  const unreadCount = notificationsData?.unreadCount || 0;
  const admins = adminsData || [];

  const pendingVendors = caterers.filter(c => c.is_pending);
  const activeVendors = caterers.filter(c => c.is_approved);
  const totalBookings = stats?.totalBookings || 0;
  const totalRevenue = stats?.totalRevenue || 0;

  // Vendor approval actions
  const handleApproveVendor = async (catererId: string) => {
    try {
      await approveCaterer.mutateAsync(catererId);
      toast({
        title: 'Vendor Approved',
        description: 'The vendor has been approved and can now accept bookings.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve vendor.',
        variant: 'destructive',
      });
    }
  };

  const handleRejectVendor = async (catererId: string) => {
    try {
      await rejectCaterer.mutateAsync(catererId);
      toast({
        title: 'Vendor Rejected',
        description: 'The vendor application has been rejected.',
        variant: 'destructive',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject vendor.',
        variant: 'destructive',
      });
    }
  };

  // Review moderation
  const handleDeleteReview = async () => {
    if (deleteReviewDialog.review) {
      try {
        await deleteReview.mutateAsync(deleteReviewDialog.review.id);
        toast({
          title: 'Review Deleted',
          description: 'The review has been removed from the platform.',
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete review.',
          variant: 'destructive',
        });
      }
    }
    setDeleteReviewDialog({ open: false, review: null });
  };

  // Category management (mock for now - can be connected to API later)
  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    toast({
      title: 'Category Added',
      description: `${newCategory} has been added.`,
    });
    setNewCategory('');
    setAddCategoryDialog({ open: false, type: 'cuisine' });
  };

  const handleDeleteCategory = (category: string, type: 'cuisine' | 'event') => {
    toast({
      title: 'Category Deleted',
      description: `${category} has been removed.`,
    });
  };

  // Admin management
  const handlePromoteToAdmin = async () => {
    if (!promoteUserId.trim()) return;
    try {
      await promoteToAdmin.mutateAsync(promoteUserId);
      toast({
        title: 'User Promoted',
        description: 'User has been promoted to admin successfully.',
      });
      setPromoteUserId('');
      setPromoteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to promote user.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAdmin = async () => {
    try {
      await deleteAdmin.mutateAsync(deleteAdminDialog.adminId);
      toast({
        title: 'Admin Removed',
        description: 'Admin has been removed from the system.',
      });
      setDeleteAdminDialog({ open: false, adminId: '', adminName: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove admin.',
        variant: 'destructive',
      });
    }
  };

  // Notifications
  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markNotificationRead.mutateAsync(notification.id);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead.mutateAsync();
  };

  const isLoading = statsLoading || caterersLoading || customersLoading || bookingsLoading || reviewsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h1 className="font-display text-lg font-semibold">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">CaterConnect Management</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                        Mark all read
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`flex flex-col items-start p-3 cursor-pointer ${
                          !notification.is_read ? 'bg-muted/50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <span className="font-medium text-sm">{notification.title}</span>
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {isSuperAdmin && (
                <Badge variant="default" className="bg-amber-500">
                  <Crown className="h-3 w-3 mr-1" />
                  Super Admin
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">{profile?.name || 'Admin'}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Vendors
              </CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeVendors.length}</div>
              <p className="text-xs text-muted-foreground">
                {pendingVendors.length} pending approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Bookings
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBookings}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Platform Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From completed bookings</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-flex">
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="vendors" className="gap-2">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Vendors</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Customers</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
            {isSuperAdmin ? (
              <TabsTrigger value="admins" className="gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admins</span>
              </TabsTrigger>
            ) : (
              <TabsTrigger value="categories" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Categories</span>
              </TabsTrigger>
            )}
          </TabsList>
          {isSuperAdmin && (
            <TabsList className="grid w-full lg:w-auto lg:inline-flex mt-2">
              <TabsTrigger value="categories" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Categories</span>
              </TabsTrigger>
            </TabsList>
          )}

          {/* Analytics Dashboard */}
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>

          {/* Vendor Management */}
          <TabsContent value="vendors" className="space-y-6">
            {/* Pending Approvals */}
            {pendingVendors.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <CardTitle className="text-amber-900">Pending Approvals</CardTitle>
                  </div>
                  <CardDescription className="text-amber-700">
                    {pendingVendors.length} vendor(s) awaiting your review
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Cuisines</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingVendors.map(caterer => (
                        <TableRow key={caterer.id}>
                          <TableCell className="font-medium">{caterer.name}</TableCell>
                          <TableCell>{caterer.location}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(caterer.cuisines || []).slice(0, 2).map((c: string) => (
                                <Badge key={c} variant="secondary" className="text-xs">
                                  {c}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleApproveVendor(caterer.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRejectVendor(caterer.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Active Vendors */}
            <Card>
              <CardHeader>
                <CardTitle>Active Vendors</CardTitle>
                <CardDescription>
                  All approved vendors on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Reviews</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeVendors.map(caterer => (
                      <TableRow key={caterer.id}>
                        <TableCell className="font-medium">{caterer.name}</TableCell>
                        <TableCell>{caterer.location}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-primary text-primary" />
                            <span>{caterer.rating || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>{caterer.review_count || 0}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" asChild>
                              <Link to={`/caterer/${caterer.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer Management */}
          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Registered Customers ({customers.length})</CardTitle>
                <CardDescription>
                  All customer accounts on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Bookings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map(customer => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.phone || '—'}</TableCell>
                        <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{customer.booking_count || 0}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Booking Monitor */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings ({bookings.length})</CardTitle>
                <CardDescription>
                  Platform-wide booking overview (read-only)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Caterer</TableHead>
                      <TableHead>Event Date</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map(booking => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-sm">
                          {booking.id.slice(0, 12)}
                        </TableCell>
                        <TableCell>{booking.customer_name || 'Unknown'}</TableCell>
                        <TableCell>{booking.caterer_name || 'Unknown'}</TableCell>
                        <TableCell>{new Date(booking.event_date).toLocaleDateString()}</TableCell>
                        <TableCell>{booking.guest_count}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              booking.status === 'completed'
                                ? 'default'
                                : booking.status === 'confirmed'
                                ? 'secondary'
                                : booking.status === 'pending'
                                ? 'outline'
                                : 'destructive'
                            }
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {booking.total_amount
                            ? `$${Number(booking.total_amount).toLocaleString()}`
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Review Moderation */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Review Moderation ({reviews.length})</CardTitle>
                <CardDescription>
                  Monitor and moderate customer reviews
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reviewer</TableHead>
                      <TableHead>Caterer</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead className="max-w-xs">Comment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map(review => (
                      <TableRow key={review.id}>
                        <TableCell>{review.customer_name || 'Unknown'}</TableCell>
                        <TableCell>{review.caterer_name || 'Unknown'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-primary text-primary" />
                            <span>{review.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {review.comment || '—'}
                        </TableCell>
                        <TableCell>{new Date(review.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() =>
                              setDeleteReviewDialog({ open: true, review })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Category Management */}
          <TabsContent value="categories" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Cuisine Categories */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Cuisine Categories</CardTitle>
                      <CardDescription>Manage available cuisine types</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setAddCategoryDialog({ open: true, type: 'cuisine' })}
                    >
                      Add Cuisine
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(categoriesData?.cuisines || []).map((cuisine: string) => (
                      <Badge
                        key={cuisine}
                        variant="secondary"
                        className="px-3 py-1 gap-2"
                      >
                        {cuisine}
                        <button
                          onClick={() => handleDeleteCategory(cuisine, 'cuisine')}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Event Types */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Event Types</CardTitle>
                      <CardDescription>Manage available event types</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setAddCategoryDialog({ open: true, type: 'event' })}
                    >
                      Add Event Type
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(categoriesData?.eventTypes || []).map((event: string) => (
                      <Badge
                        key={event}
                        variant="secondary"
                        className="px-3 py-1 gap-2"
                      >
                        {event}
                        <button
                          onClick={() => handleDeleteCategory(event, 'event')}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admin Management (Super Admin Only) */}
          {isSuperAdmin && (
            <TabsContent value="admins" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Admin Users
                      </CardTitle>
                      <CardDescription>
                        Manage admin users (Super Admin only)
                      </CardDescription>
                    </div>
                    <Button onClick={() => setPromoteDialogOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Promote User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Promoted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map(admin => (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {admin.name || 'Unknown'}
                              {admin.isSuperAdmin && (
                                <Badge className="bg-amber-500">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Super
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">Admin</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(admin.promoted_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {!admin.isSuperAdmin && admin.id !== user?.id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() =>
                                  setDeleteAdminDialog({
                                    open: true,
                                    adminId: admin.id,
                                    adminName: admin.name || admin.email,
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
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
          )}
        </Tabs>
      </main>

      {/* Delete Review Dialog */}
      <Dialog
        open={deleteReviewDialog.open}
        onOpenChange={(open) => setDeleteReviewDialog({ open, review: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteReviewDialog.review && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm italic">"{deleteReviewDialog.review.comment || 'No comment'}"</p>
              <p className="text-xs text-muted-foreground mt-2">
                — {deleteReviewDialog.review.customer_name || 'Unknown'}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteReviewDialog({ open: false, review: null })}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteReview}>
              Delete Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog
        open={addCategoryDialog.open}
        onOpenChange={(open) => {
          setAddCategoryDialog({ ...addCategoryDialog, open });
          if (!open) setNewCategory('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add {addCategoryDialog.type === 'cuisine' ? 'Cuisine' : 'Event Type'}
            </DialogTitle>
            <DialogDescription>
              Enter the name of the new {addCategoryDialog.type === 'cuisine' ? 'cuisine category' : 'event type'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder={addCategoryDialog.type === 'cuisine' ? 'e.g., Thai' : 'e.g., Birthday Party'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddCategoryDialog({ open: false, type: 'cuisine' });
                setNewCategory('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={!newCategory.trim()}>
              Add {addCategoryDialog.type === 'cuisine' ? 'Cuisine' : 'Event Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promote User to Admin Dialog */}
      <Dialog
        open={promoteDialogOpen}
        onOpenChange={(open) => {
          setPromoteDialogOpen(open);
          if (!open) setPromoteUserId('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Promote User to Admin
            </DialogTitle>
            <DialogDescription>
              Enter the User ID of the user you want to promote to admin.
              This action will give them full admin privileges.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-id">User ID</Label>
              <Input
                id="user-id"
                value={promoteUserId}
                onChange={(e) => setPromoteUserId(e.target.value)}
                placeholder="Enter user ID..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPromoteDialogOpen(false);
                setPromoteUserId('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePromoteToAdmin}
              disabled={!promoteUserId.trim() || promoteToAdmin.isPending}
            >
              {promoteToAdmin.isPending ? 'Promoting...' : 'Promote to Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Admin Dialog */}
      <Dialog
        open={deleteAdminDialog.open}
        onOpenChange={(open) =>
          setDeleteAdminDialog({ ...deleteAdminDialog, open, adminId: open ? deleteAdminDialog.adminId : '', adminName: open ? deleteAdminDialog.adminName : '' })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Admin</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{deleteAdminDialog.adminName}</strong> from admin?
              This action will permanently delete their account from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteAdminDialog({ open: false, adminId: '', adminName: '' })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAdmin}
              disabled={deleteAdmin.isPending}
            >
              {deleteAdmin.isPending ? 'Removing...' : 'Remove Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
