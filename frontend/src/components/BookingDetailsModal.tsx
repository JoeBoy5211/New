
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, MapPin, Phone, MessageSquare, DollarSign, Tag, CreditCard, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface BookingDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: any;
    mode: 'customer' | 'vendor';
    onPay?: () => void;
    isPaying?: boolean;
    onStatusUpdate?: (bookingId: string, status: string) => Promise<any>;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
        case 'declined': return 'bg-red-100 text-red-800 border-red-200';
        case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

export function BookingDetailsModal({ isOpen, onClose, booking, mode, onPay, isPaying = false, onStatusUpdate }: BookingDetailsModalProps) {
    if (!booking) return null;

    const items = booking.items || [];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl bg-card text-card-foreground p-0 overflow-hidden">
                <div className="p-6 space-y-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex justify-between items-center pr-6">
                            <DialogTitle className="font-display text-2xl font-bold">Booking Details</DialogTitle>
                            <Badge className={getStatusColor(booking.status)} variant="outline">
                                {booking.status.toUpperCase()}
                            </Badge>
                        </div>
                    </DialogHeader>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Tag className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {mode === 'customer' ? 'Caterer' : 'Customer'}
                                    </p>
                                    <p className="font-semibold text-lg">
                                        {mode === 'customer'
                                            ? (booking.catererName || booking.caterer_name)
                                            : (booking.customerName || booking.customer_name)}
                                    </p>
                                    {mode === 'vendor' && booking.contact_phone && (
                                        <p className="text-sm font-medium text-primary flex items-center gap-1 mt-0.5">
                                            <Phone className="h-3 w-3" /> {booking.contact_phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Calendar className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Event Date</p>
                                    <p className="font-semibold">{format(new Date(booking.event_date), 'PPPP')}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Tag className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Service & Event Type</p>
                                    <p className="font-semibold">{booking.service_type || 'Standard'} - {booking.event_type || booking.eventType}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <MapPin className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Venue Location</p>
                                    <p className="font-semibold">{booking.venue || 'Not specified'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Guest Count</p>
                                    <p className="font-semibold">{booking.guest_count} guests</p>
                                </div>
                            </div>

                            {booking.total_amount && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <DollarSign className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Estimated Total</p>
                                        <p className="font-bold text-xl text-primary">ETB {Number(booking.total_amount).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Itemized Menu */}
                    {items.length > 0 && (
                        <div className="border-t pt-6">
                            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Selected Menu Items
                            </h3>
                            <div className="bg-muted/30 rounded-xl overflow-hidden border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50 border-b">
                                            <th className="text-left py-3 px-4 font-semibold">Item</th>
                                            <th className="text-center py-3 px-4 font-semibold">Qty</th>
                                            <th className="text-right py-3 px-4 font-semibold">Price</th>
                                            <th className="text-right py-3 px-4 font-semibold">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {items.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                                <td className="py-3 px-4 font-medium">{item.name || item.item_name}</td>
                                                <td className="py-3 px-4 text-center">{item.quantity}</td>
                                                <td className="py-3 px-4 text-right">ETB {Number(item.unit_price).toLocaleString()}</td>
                                                <td className="py-3 px-4 text-right font-medium">
                                                    ETB {(item.quantity * item.unit_price).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t text-muted-foreground">
                                            <td colSpan={3} className="py-2 px-4 text-right">Subtotal:</td>
                                            <td className="py-2 px-4 text-right">
                                                ETB {items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0).toLocaleString()}
                                            </td>
                                        </tr>
                                        <tr className="text-muted-foreground">
                                            <td colSpan={3} className="py-2 px-4 text-right">VAT (15%):</td>
                                            <td className="py-2 px-4 text-right">
                                                ETB {(items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0) * 0.15).toLocaleString()}
                                            </td>
                                        </tr>
                                        <tr className="bg-primary/5 font-bold border-t text-lg">
                                            <td colSpan={3} className="py-3 px-4 text-right">Total Amount:</td>
                                            <td className="py-3 px-4 text-right text-primary">
                                                ETB {Number(booking.total_amount).toLocaleString()}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="border-t pt-6">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 border border-orange-100">
                            <MessageSquare className="h-5 w-5 text-orange-600 mt-1" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-orange-900 mb-1">Special Requests & Notes</p>
                                <p className="text-sm text-orange-800 leading-relaxed italic">
                                    "{booking.special_requests || 'No special requests provided.'}"
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={onClose} disabled={isPaying}>Close</Button>
                        
                        {mode === 'vendor' && booking.status === 'pending' && onStatusUpdate && (
                            <div className="flex gap-2">
                                <Button 
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={async () => {
                                        await onStatusUpdate(booking.id, 'accepted');
                                        onClose();
                                    }}
                                >
                                    Accept Booking
                                </Button>
                                <Button 
                                    variant="destructive"
                                    onClick={async () => {
                                        await onStatusUpdate(booking.id, 'declined');
                                        onClose();
                                    }}
                                >
                                    Decline Booking
                                </Button>
                            </div>
                        )}
                        
                        {mode === 'customer' && (booking.status === 'accepted' || booking.status === 'payment_pending') && onPay && (
                            <Button
                                onClick={onPay}
                                disabled={isPaying}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                            >
                                {isPaying ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CreditCard className="h-4 w-4" />
                                )}
                                Pay Now
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
