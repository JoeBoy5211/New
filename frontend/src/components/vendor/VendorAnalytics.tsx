import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useVendorAnalytics } from '@/hooks/useVendorData';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

interface RevenueItem {
  period: string;
  revenue: number;
  bookings: number;
}

interface AnalyticsData {
  pageViews: number;
  totalBookings: number;
  conversionRate: number;
  revenueOverTime: RevenueItem[];
}

export function VendorAnalytics() {
  const { analytics, isLoading, error } = useVendorAnalytics();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size={32} text="Loading analytics..." />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <p>Failed to load analytics data.</p>
      </div>
    );
  }

  const { pageViews, totalBookings, conversionRate, revenueOverTime } = analytics as AnalyticsData;

  // Format revenue data for charts
  const chartData = revenueOverTime.map((item: RevenueItem) => ({
    name: new Date(item.period + '-01').toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
    Revenue: item.revenue,
    Bookings: item.bookings
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time profile views
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed & confirmed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Page views to bookings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ETB {chartData.reduce((sum: number, item: { Revenue: number }) => sum + item.Revenue, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Growth Chart */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Growth</CardTitle>
            <CardDescription>Monthly revenue from completed bookings</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${value}`} />
                  <Tooltip formatter={(value) => [`ETB ${value}`, 'Revenue']} />
                  <Legend />
                  <Line type="monotone" dataKey="Revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No revenue data available yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bookings Chart */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Bookings Over Time</CardTitle>
            <CardDescription>Number of successful bookings per month</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => [value, 'Bookings']} />
                  <Legend />
                  <Bar dataKey="Bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No booking data available yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
