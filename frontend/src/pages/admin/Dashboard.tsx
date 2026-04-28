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
  ShieldAlert,
  Bell,
  UserPlus,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '@/hooks/useAdminData';
import { AnalyticsTab } from '@/components/admin/AnalyticsTab';
import { BookingDetailsModal } from '@/components/BookingDetailsModal';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch real data from API
  const {
    stats,
    caterers,
    customers,
    bookings,
    reviews,
    analytics,
    subscriptionAnalytics,
    admins,
    notifications,
    unreadNotificationsCount,
    isLoading,
    approveCaterer: approveCatererAPI,
    rejectCaterer: rejectCatererAPI,
    deleteReview: deleteReviewAPI,
    updateUserRole: updateUserRoleAPI,
    promoteToAdmin: promoteToAdminAPI,
    deleteAdmin: deleteAdminAPI,
    markNotificationRead: markNotificationReadAPI,
    markAllNotificationsRead: markAllNotificationsReadAPI,
  } = useAdminData(user?.isSuperAdmin);

  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [deleteReviewDialog, setDeleteReviewDialog] = useState<{ open: boolean; reviewId: string | null }>({ open: false, reviewId: null });
  const [deleteAdminDialog, setDeleteAdminDialog] = useState<{ open: boolean; adminId: string | null; adminName: string }>({ open: false, adminId: null, adminName: '' });
  const [viewVendorDetails, setViewVendorDetails] = useState<any>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Vendor approval actions
  const handleApproveVendor = async (catererId: string) => {
    const result = await approveCatererAPI(catererId);
    if (result.success) {
      toast({
        title: 'Vendor Approved',
        description: 'The vendor has been approved and can now accept bookings.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to approve vendor.',
        variant: 'destructive',
      });
    }
  };

  const handleRejectVendor = async (catererId: string) => {
    const result = await rejectCatererAPI(catererId);
    if (result.success) {
      toast({
        title: 'Vendor Rejected',
        description: 'The vendor application has been rejected.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to reject vendor.',
        variant: 'destructive',
      });
    }
  };

  const handleSuspendVendor = async (catererId: string) => {
    // For now, rejecting is same as suspending
    await handleRejectVendor(catererId);
  };

  // Review moderation
  const handleDeleteReview = async () => {
    if (deleteReviewDialog.reviewId) {
      const result = await deleteReviewAPI(deleteReviewDialog.reviewId);
      if (result.success) {
        toast({
          title: 'Review Deleted',
          description: 'The review has been removed from the platform.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete review.',
          variant: 'destructive',
        });
      }
    }
    setDeleteReviewDialog({ open: false, reviewId: null });
  };

  const handlePromoteAdmin = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to promote ${userName} to Admin?`)) {
      const result = await promoteToAdminAPI(userId);
      if (result.success) {
        toast({
          title: 'Admin Promoted',
          description: `${userName} is now an Admin and will have access to this dashboard.`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to promote user.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDeleteAdmin = async () => {
    if (deleteAdminDialog.adminId) {
      const result = await deleteAdminAPI(deleteAdminDialog.adminId);
      if (result.success) {
        toast({
          title: 'Admin Removed',
          description: `${deleteAdminDialog.adminName} has been completely removed from the system.`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to remove admin.',
          variant: 'destructive',
        });
      }
    }
    setDeleteAdminDialog({ open: false, adminId: null, adminName: '' });
  };


  // Stats
  const pendingVendors = caterers.filter(c => c.is_pending);
  const activeVendors = caterers.filter(c => c.is_approved);

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
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-[10px] text-white rounded-full flex items-center justify-center border-2 border-card">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadNotificationsCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-0 text-xs text-primary"
                        onClick={() => markAllNotificationsReadAPI()}
                      >
                        Mark all as read
                      </Button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No notifications
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={cn(
                            "p-4 border-b last:border-0 hover:bg-muted transition-colors cursor-pointer",
                            !notif.is_read && "bg-primary/5"
                          )}
                          onClick={() => !notif.is_read && markNotificationReadAPI(notif.id)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-xs">{notif.title}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(notif.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <span className="text-sm text-muted-foreground hidden sm:inline">{user?.name}</span>
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
              <div className="text-2xl font-bold">{stats?.totalCaterers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.pendingCaterers || 0} pending approval
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
              <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
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
              <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.pendingBookings || 0} pending · {stats?.acceptedBookings || 0} accepted · {stats?.completedBookings || 0} completed
              </p>
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
              <div className="text-2xl font-bold">ETB {(stats?.totalRevenue || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From completed bookings</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className={cn(
            "grid w-full lg:w-auto lg:inline-flex",
            user?.isSuperAdmin ? "grid-cols-6" : "grid-cols-5"
          )}>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            {user?.isSuperAdmin && (
              <TabsTrigger value="admins" className="gap-2">
                <ShieldAlert className="h-4 w-4" />
                <span className="hidden sm:inline">Admins</span>
              </TabsTrigger>
            )}
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
          </TabsList>

          {/* Analytics Dashboard */}
          <TabsContent value="analytics">
            <AnalyticsTab data={analytics} subscriptionData={subscriptionAnalytics} />
          </TabsContent>

          {/* Admin Management (Super Admin only) */}
          {user?.isSuperAdmin && (
            <TabsContent value="admins" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Administrators</CardTitle>
                      <CardDescription>
                        Manage system administrators and their permissions
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Promoted At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map(admin => (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">{admin.name}</TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>
                            <Badge variant={admin.isSuperAdmin ? "default" : "outline"}>
                              {admin.isSuperAdmin ? "Super Admin" : "Admin"}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(admin.promoted_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            {!admin.isSuperAdmin && admin.id !== user.id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteAdminDialog({ 
                                  open: true, 
                                  adminId: admin.id, 
                                  adminName: admin.name 
                                })}
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
                        <TableHead>TIN Number</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingVendors.map(caterer => (
                        <TableRow key={caterer.id}>
                          <TableCell className="font-medium">{caterer.name}</TableCell>
                          <TableCell>{caterer.location}</TableCell>
                          <TableCell>{caterer.tin_number || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setViewVendorDetails(caterer)}
                              >
                                <Eye className="h-4 w-4 mr-1" /> Documents
                              </Button>
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
                            <span>{caterer.rating ? Number(caterer.rating).toFixed(1) : '0.0'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{caterer.review_count || 0}</TableCell>
                        <TableCell>
                          {caterer.is_active === false || caterer.is_active === 0 ? (
                            <Badge variant="secondary" className="bg-red-100 text-red-700">
                              Inactive
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" asChild>
                              <Link to={`/caterer/${caterer.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleSuspendVendor(caterer.id)}
                            >
                              <X className="h-4 w-4" />
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
                <CardTitle>Registered Customers</CardTitle>
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
                      <TableHead className="text-right">Actions</TableHead>
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
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePromoteAdmin(customer.id, customer.name)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Promote to Admin
                          </Button>
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
                <CardTitle>All Bookings</CardTitle>
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
                      <TableRow
                        key={booking.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedBookingForDetails(booking);
                          setIsDetailsModalOpen(true);
                        }}
                      >
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
                                : booking.status === 'accepted'
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
                            ? `ETB ${booking.total_amount.toLocaleString()}`
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
                <CardTitle>Review Moderation</CardTitle>
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
                          {review.comment}
                        </TableCell>
                        <TableCell>{new Date(review.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() =>
                              setDeleteReviewDialog({ open: true, reviewId: review.id })
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

        </Tabs>
      </main>

      {/* Delete Review Dialog */}
      <Dialog
        open={deleteReviewDialog.open}
        onOpenChange={(open) => setDeleteReviewDialog({ open, reviewId: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteReviewDialog({ open: false, reviewId: null })}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteReview}>
              Delete Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BookingDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        booking={selectedBookingForDetails}
        mode="customer" // Just used for showing caterer name as the "target"
      />

      {/* View Vendor Documents Dialog */}
      <Dialog open={!!viewVendorDetails} onOpenChange={() => setViewVendorDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vendor Verification Documents</DialogTitle>
            <DialogDescription>
              Review business documents for <strong>{viewVendorDetails?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Business TIN Number</Label>
                <p className="font-mono text-lg">{viewVendorDetails?.tin_number || 'Not provided'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Location</Label>
                <p>{viewVendorDetails?.location || 'Not provided'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Competency Certificate</Label>
                {viewVendorDetails?.competency_certificate_url ? (
                  <div className="border rounded-lg p-4 bg-muted/50 flex flex-col items-center gap-3">
                    <FileText className="h-12 w-12 text-primary/40" />
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <a href={viewVendorDetails.competency_certificate_url} target="_blank" rel="noopener noreferrer">
                        View Document
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-lg p-8 bg-muted/20 flex items-center justify-center text-sm text-muted-foreground">
                    No document uploaded
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>Trade License</Label>
                {viewVendorDetails?.trade_license_url ? (
                  <div className="border rounded-lg p-4 bg-muted/50 flex flex-col items-center gap-3">
                    <FileText className="h-12 w-12 text-primary/40" />
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <a href={viewVendorDetails.trade_license_url} target="_blank" rel="noopener noreferrer">
                        View Document
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-lg p-8 bg-muted/20 flex items-center justify-center text-sm text-muted-foreground">
                    No document uploaded
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t flex justify-between items-center">
               <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <Link to={`/caterer/${viewVendorDetails?.id}`}>
                    <Eye className="h-4 w-4 mr-2" /> Preview Public Profile
                  </Link>
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      handleRejectVendor(viewVendorDetails.id);
                      setViewVendorDetails(null);
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleApproveVendor(viewVendorDetails.id);
                      setViewVendorDetails(null);
                    }}
                  >
                    Approve Vendor
                  </Button>
                </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Admin Confirmation */}
      <Dialog
        open={deleteAdminDialog.open}
        onOpenChange={(open) => setDeleteAdminDialog({ ...deleteAdminDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Administrator</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{deleteAdminDialog.adminName}</strong> from the system? 
              This will delete their user account completely. They will need to sign up again to use the platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteAdminDialog({ open: false, adminId: null, adminName: '' })}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAdmin}>
              Remove Admin Completely
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
