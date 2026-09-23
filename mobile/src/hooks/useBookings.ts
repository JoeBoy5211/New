import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import {
  createBooking,
  fetchCustomerBookings,
} from '@/services/bookings';
import type { CreateBookingPayload } from '@/types/domain';

export type {
  Booking,
  BookingWithCaterer,
  CreateBookingPayload,
  RequestStatus,
} from '@/types/domain';

export function useCustomerBookings(customerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customerBookings(customerId),
    queryFn: () => fetchCustomerBookings(customerId),
    enabled: !!customerId,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => createBooking(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customerBookings(variables.customer_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookingsAll });
    },
  });
}
