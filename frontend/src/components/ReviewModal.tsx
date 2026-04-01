import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useReviews } from '@/hooks/useReviews';
import { useToast } from '@/hooks/use-toast';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';

const reviewSchema = z.object({
    rating: z.number().min(1, 'Please select a rating').max(5),
    comment: z.string().min(5, 'Review must be at least 5 characters long').max(500, 'Review is too long'),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: {
        id: string;
        caterer_id: string;
        catererName: string;
    } | null;
    customerId: string;
    onSuccess: () => void;
}

export function ReviewModal({ isOpen, onClose, booking, customerId, onSuccess }: ReviewModalProps) {
    const { submitReview, isLoading } = useReviews();
    const { toast } = useToast();

    const form = useForm<ReviewFormData>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            rating: 5,
            comment: '',
        },
    });

    useEffect(() => {
        if (isOpen) {
            form.reset({
                rating: 5,
                comment: '',
            });
        }
    }, [isOpen, form]);

    if (!booking) return null;

    const onSubmit = async (data: ReviewFormData) => {
        const res = await submitReview({
            customer_id: customerId,
            caterer_id: booking.caterer_id,
            booking_id: booking.id,
            rating: data.rating,
            comment: data.comment,
        });

        if (res.success) {
            toast({
                title: 'Success',
                description: 'Thank you for your review!',
            });
            onSuccess();
            onClose();
        } else {
            toast({
                title: 'Error',
                description: res.message || 'Failed to submit review.',
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground">
                <DialogHeader>
                    <DialogTitle className="font-display">Rate Your Experience</DialogTitle>
                    <DialogDescription>
                        How was the service provided by {booking.catererName}?
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <FormField
                            control={form.control}
                            name="rating"
                            render={({ field }) => (
                                <FormItem className="flex flex-col items-center gap-2">
                                    <FormLabel>Rating</FormLabel>
                                    <FormControl>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => field.onChange(star)}
                                                    className="transition-transform hover:scale-110 focus:outline-none"
                                                >
                                                    <Star
                                                        className={`h-8 w-8 ${star <= field.value
                                                            ? 'fill-accent text-accent'
                                                            : 'text-muted'
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="comment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Your Feedback</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell us about the food, service, and overall experience..."
                                            {...field}
                                            rows={4}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Submitting...' : 'Submit Review'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
