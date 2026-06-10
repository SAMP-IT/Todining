import { z } from 'zod';

export const reservationSchema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  mobile: z
    .string()
    .min(7, 'Enter a valid mobile number')
    .regex(/^[0-9+\-\s()]+$/, 'Enter a valid mobile number'),
  email: z.string().email('Enter a valid email'),
  date: z.string().min(1, 'Pick a date'),
  time: z.string().min(1, 'Pick a time'),
  guests: z.coerce.number().int().min(1, 'At least 1 guest').max(50, 'Max 50 guests'),
  notes: z.string().max(300, 'Keep notes under 300 characters').optional(),
});

export type ReservationFormValues = z.infer<typeof reservationSchema>;
