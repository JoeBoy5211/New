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
import {
  mockCaterers,
  mockUsers,
  mockBookings,
  mockReviews,
  cuisineCategories,
  eventTypes,
  Caterer,
  User,
  Review,
} from '@/data/mockData';
import { AnalyticsTab } from '@/components/admin/AnalyticsTab';

export default function AdminDashboard() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Local state for managing data
  const [caterers, setCaterers] = useState(mockCaterers);
  const [users] = useState(mockUsers.filter(u => u.role === 'customer'));
  const [vendors] = useState(mockUsers.filter(u => u.role === 'vendor'));
  const [reviews, setReviews] = useState(mockReviews);
  const [cuisines, setCuisines] = useState(cuisineCategories);
  const [events, setEvents] = useState(eventTypes);

  // Dialog states
  const [deleteReviewDialog, setDeleteReviewDialog] = useState<{ open: boolean; review: Review | null }>({
    open: false,
    review: null,
  });
  const [addCategoryDialog, setAddCategoryDialog] = useState<{ open: boolean; type: 'cuisine' | 'event' }>({
    open: false,
    type: 'cuisine',
  });
  const [newCategory, setNewCategory] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Vendor approval actions
  const handleApproveVendor = (catererId: string) => {
    setCaterers(prev =>
      prev.map(c =>
        c.id === catererId ? { ...c, isApproved: true, isPending: false } : c
      )
    );
    toast({
      title: 'Vendor Approved',
      description: 'The vendor has been approved and can now accept bookings.',
    });
  };

  const handleRejectVendor = (catererId: string) => {
    setCaterers(prev => prev.filter(c => c.id !== catererId));
    toast({
      title: 'Vendor Rejected',
      description: 'The vendor application has been rejected.',
      variant: 'destructive',
    });
  };

  const handleSuspendVendor = (catererId: string) => {
    setCaterers(prev =>
      prev.map(c =>
        c.id === catererId ? { ...c, isApproved: false, isPending: false } : c
      )
    );
    toast({
      title: 'Vendor Suspended',
      description: 'The vendor has been suspended from the platform.',
      variant: 'destructive',
    });
  };

  // Review moderation
  const handleDeleteReview = () => {
    if (deleteReviewDialog.review) {
      setReviews(prev => prev.filter(r => r.id !== deleteReviewDialog.review!.id));
      toast({
        title: 'Review Deleted',
        description: 'The review has been removed from the platform.',
      });
    }
    setDeleteReviewDialog({ open: false, review: null });
  };

  // Category management
  const handleAddCategory = () => {
    if (!newCategory.trim()) return;

    if (addCategoryDialog.type === 'cuisine') {
      if (cuisines.includes(newCategory)) {
        toast({
          title: 'Already Exists',
          description: 'This cuisine category already exists.',
          variant: 'destructive',
        });
        return;
      }
      setCuisines(prev => [...prev, newCategory]);
    } else {
      if (events.includes(newCategory)) {
        toast({
          title: 'Already Exists',
          description: 'This event type already exists.',
          variant: 'destructive',
        });
        return;
      }
      setEvents(prev => [...prev, newCategory]);
    }

    toast({
      title: 'Category Added',
      description: `${newCategory} has been added to ${addCategoryDialog.type === 'cuisine' ? 'cuisines' : 'event types'}.`,
    });
    setNewCategory('');
    setAddCategoryDialog({ open: false, type: 'cuisine' });
  };

  const handleDeleteCategory = (category: string, type: 'cuisine' | 'event') => {
    if (type === 'cuisine') {
      setCuisines(prev => prev.filter(c => c !== category));
    } else {
      setEvents(prev => prev.filter(e => e !== category));
    }
    toast({
      title: 'Category Deleted',
      description: `${category} has been removed.`,
    });
  };

  // Stats
  const pendingVendors = caterers.filter(c => c.isPending);
  const activeVendors = caterers.filter(c => c.isApproved);
  const totalBookings = mockBookings.length;
  const totalRevenue = mockBookings
    .filter(b => b.status === 'completed' || b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const getCustomerName = (customerId: string) => {
    return mockUsers.find(u => u.id === customerId)?.name || 'Unknown';
  };

  const getCatererName = (catererId: string) => {
    return caterers.find(c => c.id === catererId)?.name || 'Unknown';
  };

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
              <div className="text-2xl font-bold">{users.length}</div>
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
            <TabsTrigger value="categories" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Categories</span>
            </TabsTrigger>
          </TabsList>

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
                              {caterer.cuisines.slice(0, 2).map(c => (
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
                            <span>{caterer.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell>{caterer.reviewCount}</TableCell>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(customer => {
                      const customerBookings = mockBookings.filter(
                        b => b.customerId === customer.id
                      );
                      return (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.phone || '—'}</TableCell>
                          <TableCell>{customer.createdAt}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{customerBookings.length}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
                    {mockBookings.map(booking => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-sm">
                          {booking.id.slice(0, 12)}
                        </TableCell>
                        <TableCell>{getCustomerName(booking.customerId)}</TableCell>
                        <TableCell>{getCatererName(booking.catererId)}</TableCell>
                        <TableCell>{booking.eventDate}</TableCell>
                        <TableCell>{booking.guestCount}</TableCell>
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
                          {booking.totalAmount
                            ? `$${booking.totalAmount.toLocaleString()}`
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
                        <TableCell>{getCustomerName(review.customerId)}</TableCell>
                        <TableCell>{getCatererName(review.catererId)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-primary text-primary" />
                            <span>{review.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {review.comment}
                        </TableCell>
                        <TableCell>{review.createdAt}</TableCell>
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
                    {cuisines.map(cuisine => (
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
                    {events.map(event => (
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
              <p className="text-sm italic">"{deleteReviewDialog.review.comment}"</p>
              <p className="text-xs text-muted-foreground mt-2">
                — {getCustomerName(deleteReviewDialog.review.customerId)}
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
    </div>
  );
}
