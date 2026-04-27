import { AnalyticsData, SubscriptionAnalyticsData } from '@/hooks/useAdminData';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
  'hsl(346, 77%, 50%)',
  'hsl(43, 74%, 60%)',
];

export function AnalyticsTab({ data, subscriptionData }: { data: AnalyticsData | null, subscriptionData?: SubscriptionAnalyticsData | null }) {
  if (!data) return <div className="p-8 text-center text-muted-foreground">Loading analyzed data...</div>;

  const { bookingTrends, revenueData, vendorPerformance, bookingStatusData, cuisinePopularity, avgPlatformRating, totalPlatformReviews } = data;

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  // Total bookings across all statuses from the status distribution chart (all-time)
  const totalBookingsAllTime = bookingStatusData.reduce((sum, d) => sum + d.value, 0);

  // Status-specific colors for the pie chart
  const STATUS_COLORS: Record<string, string> = {
    'Pending Review':   '#f59e0b',
    'Accepted':         '#10b981',
    'Completed':        '#3b82f6',
    'Declined':         '#ef4444',
    'Payment Pending':  '#8b5cf6',
    'Cancelled':        '#6b7280',
  };

  const getStatusColor = (name: string, index: number) =>
    STATUS_COLORS[name] ?? COLORS[index % COLORS.length];

  return (
    <div className="space-y-6">
      {/* Subscription Stats */}
      {subscriptionData && (
        <>
          <h3 className="text-lg font-medium">Subscriptions & Revenue</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Subscription Revenue</CardDescription>
                <CardTitle className="text-2xl">ETB {subscriptionData.totalRevenue.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">All time completed</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Total Subscriptions</CardDescription>
                <CardTitle className="text-2xl">{subscriptionData.totalSubscriptions}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Active & Completed</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Trial Conversions</CardDescription>
                <CardTitle className="text-2xl">{subscriptionData.trialConversions}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Vendors upgraded</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Conversion Rate</CardDescription>
                <CardTitle className="text-2xl">{subscriptionData.conversionRate}%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Trial to Premium</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Summary Stats */}
      <h3 className="text-lg font-medium mt-8">Platform Overview</h3>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue (6mo)</CardDescription>
            <CardTitle className="text-2xl">ETB {totalRevenue.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Last 6 months (completed)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Bookings</CardDescription>
            <CardTitle className="text-2xl">{totalBookingsAllTime}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All time, all statuses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Vendor Rating</CardDescription>
            <CardTitle className="text-2xl">{avgPlatformRating} ⭐</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Across all active vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Reviews</CardDescription>
            <CardTitle className="text-2xl">{totalPlatformReviews}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Platform-wide</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Booking Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Trends</CardTitle>
            <CardDescription>Monthly booking volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bookingTrends}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorBookings)"
                    strokeWidth={2}
                    name="Total Bookings"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="hsl(142, 76%, 36%)"
                    fill="hsl(142, 76%, 36%)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                    name="Completed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Monthly revenue and platform fees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `ETB ${value / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`ETB ${value.toLocaleString()}`, '']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                    name="Total Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="platformFee"
                    stroke="hsl(var(--secondary-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: 'hsl(var(--secondary-foreground))', strokeWidth: 2 }}
                    name="Platform Fee"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Vendor Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top Vendor Performance</CardTitle>
            <CardDescription>Bookings and revenue by vendor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" tickFormatter={(value) => `ETB ${value / 1000}k`} />
                  <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? `ETB ${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenue' : 'Bookings',
                    ]}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Booking Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Status</CardTitle>
            <CardDescription>Current distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookingStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {bookingStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry.name, index)} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cuisine Popularity */}
      <Card>
        <CardHeader>
          <CardTitle>Cuisine Popularity</CardTitle>
          <CardDescription>Based on vendor reviews and engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cuisinePopularity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="popularity" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Popularity Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
