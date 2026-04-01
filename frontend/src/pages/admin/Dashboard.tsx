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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '@/hooks/useAdminData';
import { AnalyticsTab } from '@/components/admin/AnalyticsTab';
import { BookingDetailsModal } from '@/components/BookingDetailsModal';

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
    isLoading,
    approveCaterer: approveCatererAPI,
    rejectCaterer: rejectCatererAPI,
    deleteReview: deleteReviewAPI,
    updateUserRole: updateUserRoleAPI,
  } = useAdminData();

  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [deleteReviewDialog, setDeleteReviewDialog] = useState<{ open: boolean; reviewId: string | null }>({ open: false, reviewId: null });

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

  const handleMakeAdmin = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to make ${userName} an Admin?`)) {
      const result = await updateUserRoleAPI(userId, 'admin');
      if (result.success) {
        toast({
          title: 'Role Updated',
          description: `${userName} is now an Admin.`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update user role.',
          variant: 'destructive',
        });
      }
    }
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
              <span className="text-sm text-muted-foreground">{user?.name}</span>
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
              <div className="text-2xl font-bold">ETB {(stats?.totalRevenue || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From completed bookings</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
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
          </TabsList>

          {/* Analytics Dashboard */}
          <TabsContent value="analytics">
            <AnalyticsTab data={analytics} />
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
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingVendors.map(caterer => (
                        <TableRow key={caterer.id}>
                          <TableCell className="font-medium">{caterer.name}</TableCell>
                          <TableCell>{caterer.location}</TableCell>
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
                            <span>{caterer.rating ? Number(caterer.rating).toFixed(1) : '0.0'}</span>
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
                            onClick={() => handleMakeAdmin(customer.id, customer.name)}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Make Admin
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
    </div>
  );
}
