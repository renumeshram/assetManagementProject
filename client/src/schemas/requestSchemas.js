import { z } from 'zod';

export const requestSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  assetId: z.string().min(1, "Asset is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  comments: z.string().optional()
});