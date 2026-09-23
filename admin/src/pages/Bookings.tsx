import { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { BookingsStatusChart } from '@/components/BookingsStatusChart';
import { VendorBookingsLeaderboard } from '@/components/VendorBookingsLeaderboard';
import { PageHeader, EmptyState, ErrorState } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Search, Download, CalendarClock, CircleCheck, Clock, CircleX } from 'lucide-react';
import { bookingStatusOf, useAllBookings, type AdminBooking } from '@/hooks/useBookings';
import { useAllCaterers } from '@/hooks/useCaterers';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'completed', label: 'Completed' },
  { key: 'declined', label: 'Declined' },
  { key: 'cancelled', label: 'Cancelled' },
] as const;

function statusBadgeVariant(s: string): 'warning' | 'success' | 'default' | 'destructive' | 'secondary' | 'outline' {
  if (s === 'pending') return 'warning';
  if (s === 'accepted') return 'success';
  if (s === 'completed') return 'default';
  if (s === 'declined') return 'destructive';
  if (s === 'cancelled') return 'secondary';
  return 'outline';
}

function errMessage(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === 'object') {
    const o = e as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof o['message'] === 'string' && o['message']) parts.push(o['message']);
    if (typeof o['details'] === 'string' && o['details']) parts.push(o['details']);
    if (typeof o['hint'] === 'string' && o['hint']) parts.push(`Hint: ${o['hint']}`);
    if (typeof o['code'] === 'string' && o['code']) parts.push(`(${o['code']})`);
    if (parts.length) return parts.join(' ');
  }
  return 'Something went wrong while retrieving bookings.';
}

export default function Bookings() {
  const { data, isLoading, error, refetch } = useAllBookings();
  const { data: caterers } = useAllCaterers();
  const [tab, setTab] = useState<string>('all');
  const [q, setQ] = useState('');

  const catererById = useMemo(() => Object.fromEntries((caterers ?? []).map((c) => [c.id, c.name])), [caterers]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: (data ?? []).length, pending: 0, accepted: 0, completed: 0, declined: 0, cancelled: 0 };
    for (const b of data ?? []) {
      const s = bookingStatusOf(b);
      if (c[s] !== undefined) c[s] += 1;
    }
    return c;
  }, [data]);

  const stats = useMemo(() => {
    const list = data ?? [];
    const pending = list.filter((b) => bookingStatusOf(b) === 'pending').length;
    const accepted = list.filter((b) => bookingStatusOf(b) === 'accepted').length;
    const completed = list.filter((b) => bookingStatusOf(b) === 'completed').length;
    const answered = list.length - pending;
    const acceptance = answered > 0 ? ((accepted + completed) / answered) * 100 : 0;
    return { total: list.length, pending, accepted, completed, acceptance };
  }, [data]);

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (tab !== 'all') list = list.filter((b) => bookingStatusOf(b) === tab);
    const qq = q.trim().toLowerCase();
    if (qq) {
      list = list.filter((b) =>
        `${b.caterer?.name ?? catererById[b.caterer_id] ?? ''} ${b.contact_name ?? ''} ${b.contact_phone ?? ''} ${b.venue ?? ''} ${b.event_type ?? ''}`
          .toLowerCase()
          .includes(qq)
      );
    }
    return list;
  }, [data, tab, q, catererById]);

  const exportCsv = () => {
    const rows = [['created_at', 'vendor', 'customer', 'phone', 'event_type', 'event_date', 'guests', 'venue', 'status', 'total']];
    for (const b of filtered) {
      rows.push([
        b.created_at,
        b.caterer?.name ?? catererById[b.caterer_id] ?? b.caterer_id,
        b.contact_name ?? '',
        b.contact_phone ?? '',
        b.event_type ?? '',
        b.event_date ?? '',
        String(b.guest_count ?? ''),
        b.venue ?? '',
        bookingStatusOf(b),
        b.total_amount != null ? String(b.total_amount) : '',
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Bookings"
        description="Platform-wide overview of every booking request — read-only."
        action={
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="p-4"><p className="flex items-center gap-1.5 text-[13px] font-medium text-foreground-secondary"><Calendar className="h-3.5 w-3.5" /> Total requests</p><p className="kpi-number mt-2">{isLoading ? '—' : stats.total}</p><p className="text-xs text-foreground-muted">across all vendors</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="flex items-center gap-1.5 text-[13px] font-medium text-foreground-secondary"><Clock className="h-3.5 w-3.5" /> Pending response</p><p className="kpi-number mt-2">{isLoading ? '—' : stats.pending}</p><p className="text-xs text-foreground-muted">waiting on vendors</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="flex items-center gap-1.5 text-[13px] font-medium text-foreground-secondary"><CircleCheck className="h-3.5 w-3.5" /> Accepted + completed</p><p className="kpi-number mt-2">{isLoading ? '—' : stats.accepted + stats.completed}</p><p className="text-xs text-foreground-muted">{isLoading ? '' : `${stats.acceptance.toFixed(1)}% acceptance rate`}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="flex items-center gap-1.5 text-[13px] font-medium text-foreground-secondary"><CalendarClock className="h-3.5 w-3.5" /> Completed events</p><p className="kpi-number mt-2">{isLoading ? '—' : stats.completed}</p><p className="text-xs text-foreground-muted">fulfilled on platform</p></CardContent></Card>
      </div>

      <BookingsStatusChart bookings={data} isLoading={isLoading} />

      <VendorBookingsLeaderboard bookings={data} caterers={caterers} isLoading={isLoading} />

      <div className="mb-3 mt-6 flex gap-2">
        <div className="relative w-full max-w-[320px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8783]" />
          <Input placeholder="Search vendor, customer, venue..." value={q} onChange={(e) => setQ(e.target.value)} className="h-10 pl-9" />
        </div>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label} ({counts[t.key] ?? 0})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Card className="mt-3 overflow-hidden">
        {error ? (
          <ErrorState
            title="Failed to load bookings"
            description={errMessage(error)}
            onRetry={() => refetch()}
          />
        ) : isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={data && data.length > 0 ? Search : Calendar}
            title={data && data.length > 0 ? 'No bookings match' : 'No bookings'}
            description={data && data.length > 0 ? 'Try changing the search or status filter.' : 'Booking requests will appear here once customers send them.'}
            action={
              q || tab !== 'all' ? (
                <Button variant="outline" size="sm" onClick={() => { setQ(''); setTab('all'); }}>Clear filters</Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead>Customer</TableHead><TableHead>Event</TableHead><TableHead>Date</TableHead><TableHead>Guests</TableHead><TableHead>Status</TableHead><TableHead>Venue</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((b: AdminBooking) => {
                  const s = bookingStatusOf(b);
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.caterer?.name ?? catererById[b.caterer_id] ?? '—'}</TableCell>
                      <TableCell>{b.contact_name ?? '—'}<div className="text-xs text-muted-foreground">{b.contact_phone ?? ''}</div></TableCell>
                      <TableCell>{b.event_type}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {b.event_date ? new Date(b.event_date).toLocaleDateString() : '—'}
                        {b.event_time ? <span className="text-xs text-muted-foreground"> {b.event_time.slice(0, 5)}</span> : null}
                        <div className="text-xs text-muted-foreground">req {new Date(b.created_at).toLocaleDateString()}</div>
                      </TableCell>
                      <TableCell>{b.guest_count}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(s)}>
                          {s === 'cancelled' ? <CircleX className="h-3 w-3" /> : null}{s.charAt(0).toUpperCase() + s.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">{b.venue ?? '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}
