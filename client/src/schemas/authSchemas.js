import { z } from 'zod';

export const loginSchema = z.object({
  sapId: z.string().min(1, "SAP ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const userRegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
  .string()
  .email("Invalid email address")
  .regex(
    /^[a-zA-Z0-9._%+-]+@nmdc\.co\.in$/,
    "Email ID must be a valid NMDC mail Id."),
  
  // SAP ID: 8-digit number between 10000000 and 99999999
  sapId: z
    .number({
      required_error: "SAP ID is required",
      invalid_type_error: "SAP ID must be a number",
    })
    .min(10000000, "SAP ID must be 8 digits")
    .max(99999999, "SAP ID must be 8 digits"),

  location: z.string().nonempty("Location is required"),
  department: z.string().min(1, "Department is required"),
  section: z.string().min(1, "Section is required"),

  // Password: at least 1 uppercase, 1 lowercase, 1 digit, 1 special char, min length 8
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      "Password must contain uppercase, lowercase, number, and special character"
    ),

  confirmPassword: z.string().min(8, "Confirm Password must be at least 8 characters")
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});