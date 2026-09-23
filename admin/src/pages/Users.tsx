import { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users as UsersIcon, UserPlus, CalendarClock, Phone, ShoppingBag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAllProfiles } from '@/hooks/useProfiles';
import { supabase } from '@/lib/supabase';
import { StatCard } from '@/components/StatCard';

function isCustomerOnly(roles: { role: string }[] | undefined): boolean {
  const list = (roles ?? []).map((r) => r.role);
  if (list.includes('vendor') || list.includes('admin')) return false;
  return true;
}

export default function Users() {
  const { data: profiles, isLoading, error, refetch } = useAllProfiles();
  // Lightweight engagement signal: customer_id list only, high limit so the
  // "Engaged" stat stays accurate well beyond the 100-row admin bookings table.
  const { data: bookingCustomerIds } = useQuery({
    queryKey: ['bookings', 'customer-ids'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bookings').select('customer_id').limit(5000);
      if (error) throw error;
      return (data ?? []).map((b) => b.customer_id as string);
    },
    staleTime: 60_000,
  });
  const [search, setSearch] = useState('');

  const customers = useMemo(() => (profiles ?? []).filter((p) => isCustomerOnly(p.roles)), [profiles]);

  const stats = useMemo(() => {
    const now = Date.now();
    const d30 = now - 30 * 86400000;
    const d7 = now - 7 * 86400000;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartMs = monthStart.getTime();
    // previous month window for growth comparison
    const prevMonthStart = new Date(monthStart);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
    const new30 = customers.filter((c) => c.created_at && new Date(c.created_at).getTime() >= d30).length;
    const new7 = customers.filter((c) => c.created_at && new Date(c.created_at).getTime() >= d7).length;
    const newMonth = customers.filter((c) => c.created_at && new Date(c.created_at).getTime() >= monthStartMs).length;
    const prevMonth = customers.filter((c) => {
      if (!c.created_at) return false;
      const t = new Date(c.created_at).getTime();
      return t >= prevMonthStart.getTime() && t < monthStartMs;
    }).length;
    const withPhone = customers.filter((c) => !!c.phone).length;
    const bookingSet = new Set(bookingCustomerIds ?? []);
    const withBookings = customers.filter((c) => bookingSet.has(c.user_id)).length;
    const growth = prevMonth === 0 ? (newMonth > 0 ? 100 : 0) : Math.round(((newMonth - prevMonth) / prevMonth) * 100);
    return { total: customers.length, new30, new7, newMonth, prevMonth, withPhone, withBookings, growth };
  }, [customers, bookingCustomerIds]);

  const bookingsByCustomer = useMemo(() => {
    const map = new Map<string, number>();
    for (const id of bookingCustomerIds ?? []) map.set(id, (map.get(id) ?? 0) + 1);
    return map;
  }, [bookingCustomerIds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((p) =>
      `${p.name} ${p.email ?? ''} ${p.phone ?? ''}`.toLowerCase().includes(q)
    );
  }, [customers, search]);

  return (
    <AdminLayout>
      <PageHeader
        title="Customers"
        description="App customers only. Vendor and admin accounts are managed on their own pages."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={UsersIcon}
          tint="bg-primary-subtle text-primary"
          label="Total Customers"
          value={stats.total}
          hint={stats.total ? `${stats.withBookings} with bookings · ${stats.withPhone} with phone` : 'No customers yet'}
          delta={
            stats.growth !== 0
              ? { text: `${stats.growth > 0 ? '+' : ''}${stats.growth}% MoM`, tone: stats.growth >= 0 ? 'up' : 'down' }
              : undefined
          }
          loading={isLoading}
        />
        <StatCard
          icon={UserPlus}
          tint="bg-[#EEF3F8] text-[#4D6B8A]"
          label="New · Last 30 Days"
          value={stats.new30}
          hint={`${stats.newMonth} joined this calendar month`}
          delta={stats.new30 > 0 ? { text: `${stats.new7} this week`, tone: 'neutral' } : undefined}
          loading={isLoading}
        />
        <StatCard
          icon={CalendarClock}
          tint="bg-[#E9F6F0] text-[#16845B]"
          label="New · Last 7 Days"
          value={stats.new7}
          hint={stats.new7 ? 'Signed up this week' : 'No signups this week'}
          loading={isLoading}
        />
        <StatCard
          icon={ShoppingBag}
          tint="bg-[#FFF5DF] text-[#B7791F]"
          label="Engaged Customers"
          value={stats.withBookings}
          hint={stats.total ? `${stats.total ? Math.round((stats.withBookings / Math.max(stats.total, 1)) * 100) : 0}% placed a booking` : 'Bookings will appear here'}
          loading={isLoading}
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[320px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8783]" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
            aria-label="Search customers"
          />
        </div>
        <p className="text-xs text-[#8A8783]">
          {filtered.length} of {customers.length} customer{customers.length === 1 ? '' : 's'}
        </p>
      </div>

      <Card className="overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <p className="text-sm font-semibold">Unable to load customers</p>
            <p className="mt-1 text-[13px] text-[#5F5C59]">Something went wrong while retrieving your customer list.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="space-y-1.5"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-28" /></div></div></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={UsersIcon}
                      title={search ? 'No customers match your search' : 'No customers yet'}
                      description={
                        search
                          ? 'Try changing your search.'
                          : 'Registered app customers will appear here. Vendors and admins are listed separately.'
                      }
                      action={
                        search ? (
                          <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                            Clear search
                          </Button>
                        ) : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((profile) => {
                  const initials = (profile.name || '?').slice(0, 2).toUpperCase();
                  const bookingCount = bookingsByCustomer.get(profile.user_id) ?? 0;
                  return (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFECE8] text-xs font-semibold text-[#5F5C59]">
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[13.5px] font-medium">{profile.name}</p>
                            <p className="truncate text-xs text-[#8A8783]">{profile.email ?? 'No email'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px]">
                        {profile.phone ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-[#8A8783]" /> {profile.phone}
                          </span>
                        ) : (
                          <span className="text-[#8A8783]">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#EFECE8] px-2 text-xs font-semibold tabular-nums text-[#5F5C59]">
                          {bookingCount}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-[13px] text-[#5F5C59]">
                        {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-transparent bg-[#EFF4FF] text-[#3556C4]">
                          customer
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </AdminLayout>
  );
}
