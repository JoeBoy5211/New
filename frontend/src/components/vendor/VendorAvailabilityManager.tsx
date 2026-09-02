import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { CalendarX, CalendarDays, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const DAYS_OF_WEEK = [
  { day: 0, label: 'Sunday' },
  { day: 1, label: 'Monday' },
  { day: 2, label: 'Tuesday' },
  { day: 3, label: 'Wednesday' },
  { day: 4, label: 'Thursday' },
  { day: 5, label: 'Friday' },
  { day: 6, label: 'Saturday' },
];

interface VendorAvailabilityManagerProps {
  unavailabilityList: any[];
  onAddUnavailability: (payload: { type: 'temporary' | 'permanent_recurring'; unavailable_date?: string; day_of_week?: number; reason?: string }) => Promise<any>;
  onDeleteUnavailability: (id: number | string) => Promise<any>;
}

export default function VendorAvailabilityManager({
  unavailabilityList = [],
  onAddUnavailability,
  onDeleteUnavailability,
}: VendorAvailabilityManagerProps) {
  const { toast } = useToast();
  const [tempDate, setTempDate] = useState('');
  const [tempReason, setTempReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Temporary blackout dates
  const temporaryBlackouts = unavailabilityList.filter(u => u.type === 'temporary');

  // Set of day numbers that are permanently recurring closed days
  const permanentClosedDays = new Set(
    unavailabilityList
      .filter(u => u.type === 'permanent_recurring' && u.day_of_week !== null && u.day_of_week !== undefined)
      .map(u => Number(u.day_of_week))
  );

  const handleAddTemporaryDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempDate) {
      toast({ title: 'Error', description: 'Please select a blackout date.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const res = await onAddUnavailability({
      type: 'temporary',
      unavailable_date: tempDate,
      reason: tempReason.trim() || undefined,
    });

    if (res.success) {
      toast({ title: 'Success', description: `Marked ${tempDate} as unavailable.` });
      setTempDate('');
      setTempReason('');
    } else {
      toast({ title: 'Error', description: res.message || 'Failed to add blackout date.', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleTogglePermanentDay = async (dayNum: number, label: string) => {
    const isCurrentlyClosed = permanentClosedDays.has(dayNum);

    if (isCurrentlyClosed) {
      // Find entry and remove
      const entry = unavailabilityList.find(u => u.type === 'permanent_recurring' && Number(u.day_of_week) === dayNum);
      if (entry) {
        const res = await onDeleteUnavailability(entry.id);
        if (res.success) {
          toast({ title: 'Success', description: `Opened bookings for ${label}s.` });
        } else {
          toast({ title: 'Error', description: res.message, variant: 'destructive' });
        }
      }
    } else {
      // Add permanent closed day
      const res = await onAddUnavailability({
        type: 'permanent_recurring',
        day_of_week: dayNum,
        reason: `Closed every ${label}`,
      });
      if (res.success) {
        toast({ title: 'Success', description: `Set ${label}s as permanently closed.` });
      } else {
        toast({ title: 'Error', description: res.message, variant: 'destructive' });
      }
    }
  };

  const handleDeleteEntry = async (id: number | string, dateOrDayLabel: string) => {
    const res = await onDeleteUnavailability(id);
    if (res.success) {
      toast({ title: 'Success', description: `Removed blackout for ${dateOrDayLabel}.` });
    } else {
      toast({ title: 'Error', description: res.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Permanent Unavailability (Weekly Closed Days) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <CalendarX className="h-5 w-5 text-primary" />
            Permanent Unavailability (Weekly Closed Days)
          </CardTitle>
          <CardDescription>
            Select regular days of the week when your business is closed. You will automatically be hidden from searches on these days for all future dates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {DAYS_OF_WEEK.map(({ day, label }) => {
              const isClosed = permanentClosedDays.has(day);
              return (
                <label
                  key={day}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                    isClosed
                      ? 'border-red-500 bg-red-50 text-red-900 shadow-sm font-semibold'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <Checkbox
                    checked={isClosed}
                    onCheckedChange={() => handleTogglePermanentDay(day, label)}
                    className="mb-2"
                  />
                  <span className="text-xs">{label}</span>
                  {isClosed && (
                    <Badge variant="destructive" className="mt-1 text-[9px] px-1 py-0 h-4">
                      Closed
                    </Badge>
                  )}
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Temporary Unavailability (Blackout Dates) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="h-5 w-5 text-primary" />
            Temporary Blackout Dates
          </CardTitle>
          <CardDescription>
            Mark specific dates as unavailable (e.g. holidays, maintenance, private events).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Date Form */}
          <form onSubmit={handleAddTemporaryDate} className="flex flex-col sm:flex-row gap-3 items-end bg-muted/30 p-4 rounded-lg border">
            <div className="flex-1 space-y-1.5 w-full">
              <label className="text-xs font-medium text-muted-foreground">Select Date</label>
              <Input
                type="date"
                min={todayStr}
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                className="cursor-pointer bg-background"
                required
              />
            </div>
            <div className="flex-[2] space-y-1.5 w-full">
              <label className="text-xs font-medium text-muted-foreground">Reason / Note (Optional)</label>
              <Input
                type="text"
                placeholder="e.g., Kitchen Maintenance, Personal Day, Private Party"
                value={tempReason}
                onChange={(e) => setTempReason(e.target.value)}
                className="bg-background"
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto shrink-0">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Blackout Date
            </Button>
          </form>

          {/* List of Temporary Blackout Dates */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Active Blackout Dates ({temporaryBlackouts.length})</h4>
            {temporaryBlackouts.length === 0 ? (
              <div className="p-6 text-center border border-dashed rounded-lg bg-muted/10 text-muted-foreground text-sm">
                No specific blackout dates set. You are available on all open calendar days.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {temporaryBlackouts.map((entry) => {
                  const formattedDate = entry.unavailable_date
                    ? format(parseISO(entry.unavailable_date.split('T')[0]), 'EEE, MMM d, yyyy')
                    : 'Unknown Date';

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card shadow-sm hover:border-destructive/30 transition-all"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-sm leading-tight text-foreground">{formattedDate}</p>
                        {entry.reason && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.reason}</p>
                        )}
                        <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                          Temporary Blackout
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEntry(entry.id, formattedDate)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
