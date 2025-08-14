import { z } from 'zod';

export const loginSchema = z.object({
  sapId: z.string().min(1, "SAP ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const userRegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  sapId: z.string().min(1, "SAP ID is required"),
  departmentId: z.string().min(1, "Department is required"),
  sectionId: z.string().min(1, "Section is required"),
  password: z.string().min(6, "Password must be at least 6 characters")
});