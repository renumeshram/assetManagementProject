import { z } from 'zod';

export const requestSchema = z.object({
 location: z.string().nonempty("Location is required"),
  department: z.string().nonempty("Department is required"),
  section: z.string().nonempty("Section is required"),
  category: z.string().nonempty("Category is required"),
  asset: z.string().nonempty("Asset is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  requestDate: z.string().nonempty("Request date is required"),
  comments: z.string().optional(),
  // requestDate: z.date().refine(date => date <= new Date(), {
  //   message: "Request date cannot be in the future" 
  // }),
});