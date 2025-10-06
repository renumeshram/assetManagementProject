// passwordSchemas.js
import { z } from 'zod';

// Base password validation rules
const passwordRules = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password must not exceed 100 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

// SAP ID validation rules
// SAP ID validation rules (must be exactly 8-digit numeric starting from 10000000)
export const sapIdRules = z
  .string({
    required_error: "SAP ID is required",
    invalid_type_error: "SAP ID must be a number",
  })
  .regex(/^\d+$/, "SAP ID must contain only numbers") // only digits
  .refine((val) => {
    const num = Number(val);
    return num >= 10000000 && num <= 99999999;
  }, {
    message: "SAP ID must be 8 digits",
  })
  .transform((val) => Number(val)); // convert to number for downstream use




// 1. User Change Password Schema
export const changePasswordSchema = z.object({
  sapId: sapIdRules,
  oldPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: passwordRules,
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your new password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"]
}).refine((data) => data.oldPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"]
});

// 2. Admin Single User Reset Schema
export const adminSingleResetSchema = z.object({
  sapId: sapIdRules,
  password: passwordRules
});

// 3. Admin Bulk Reset Schema
export const adminBulkResetSchema = z.object({
  password: passwordRules,
  confirmPassword: z
    .string()
    .min(1, 'Please confirm the password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// 4. Backend validation schemas (for API endpoints)

// Change password API schema
export const changePasswordApiSchema = z.object({
  sapId: sapIdRules,
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: passwordRules
});

// Reset password API schema
export const resetPasswordApiSchema = z.object({
  sapId: sapIdRules,
  password: passwordRules
});

// Reset all passwords API schema
export const resetAllPasswordsApiSchema = z.object({
  password: passwordRules
});

// 5. Helper functions for validation

export const validateChangePasswordForm = (formData) => {
  try {
    const result = changePasswordSchema.parse(formData);
    return { success: true, data: result, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        formattedErrors[path] = err.message;
      });
      return { success: false, data: null, errors: formattedErrors };
    }
    return { success: false, data: null, errors: { general: 'Validation failed' } };
  }
};

export const validateAdminSingleResetForm = (formData) => {
  try {
    const result = adminSingleResetSchema.parse(formData);
    return { success: true, data: result, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = {};
      error.errors?.forEach((err) => {
        const path = err.path.join('.');
        formattedErrors[path] = err.message;
      });
      return { success: false, data: null, errors: formattedErrors };
    }
    console.error("Unexpected validation error:", error); // 👈 helpful for debugging
    return { success: false, data: null, errors: { general: 'Validation failed' } };
  }
};

export const validateAdminBulkResetForm = (formData) => {
  try {
    const result = adminBulkResetSchema.parse(formData);
    return { success: true, data: result, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        formattedErrors[path] = err.message;
      });
      return { success: false, data: null, errors: formattedErrors };
    }
    return { success: false, data: null, errors: { general: 'Validation failed' } };
  }
};

// 6. Real-time field validation helpers

export const validateSapId = (value) => {
  try {
    sapIdRules.parse(value);
    return { success: true, error: null };
  } catch (error) {
    if (error && Array.isArray(error.errors)) {
      // proper ZodError
      return { success: false, error: error.errors[0].message };
    }
    console.error("Unexpected SAP ID validation error:", error);
    return { success: false, error: "Invalid SAP ID" };
  }
};


export const validatePassword = (password) => {
  const result = passwordRules.safeParse(password);

  if (result.success) {
    return { valid: true, error: null };
  }

  // Grab the first error message safely
  const firstError = result.error.errors?.[0]?.message || 'Invalid password';

  return { valid: false, error: firstError };
};


export const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return { valid: false, error: "Passwords don't match" };
  }
  return { valid: true, error: null };
};

// 7. Password strength checker
export const getPasswordStrength = (password) => {
  let score = 0;
  const checks = [
    { regex: /.{8,}/, message: 'At least 8 characters' },
    { regex: /[a-z]/, message: 'Lowercase letter' },
    { regex: /[A-Z]/, message: 'Uppercase letter' },
    { regex: /[0-9]/, message: 'Number' },
    { regex: /[^a-zA-Z0-9]/, message: 'Special character' },
    { regex: /.{12,}/, message: 'Extra length (12+ chars)' },
  ];

  const results = checks.map(check => ({
    ...check,
    passed: check.regex.test(password)
  }));

  results.forEach(result => {
    if (result.passed) score++;
  });

  let strength = 'Very Weak';
  let color = 'red';

  if (score >= 5) {
    strength = 'Very Strong';
    color = 'green';
  } else if (score >= 4) {
    strength = 'Strong';
    color = 'blue';
  } else if (score >= 3) {
    strength = 'Medium';
    color = 'yellow';
  } else if (score >= 2) {
    strength = 'Weak';
    color = 'orange';
  }

  return {
    score,
    strength,
    color,
    checks: results,
    percentage: (score / checks.length) * 100
  };
};

// 8. Custom error messages for different contexts
export const getContextualErrorMessage = (error, context = 'general') => {
  const contextMessages = {
    user: {
      'String must contain at least 8 characters': 'Your password must be at least 8 characters long',
      'Password must contain at least one lowercase letter': 'Please include a lowercase letter in your password',
      'Password must contain at least one uppercase letter': 'Please include an uppercase letter in your password',
      'Password must contain at least one number': 'Please include a number in your password',
      'Password must contain at least one special character': 'Please include a special character in your password',
    },
    admin: {
      'String must contain at least 8 characters': 'Password must be at least 8 characters long',
      'Password must contain at least one lowercase letter': 'Password requires a lowercase letter',
      'Password must contain at least one uppercase letter': 'Password requires an uppercase letter',
      'Password must contain at least one number': 'Password requires a number',
      'Password must contain at least one special character': 'Password requires a special character (!@#$%^&*)',
    }
  };

  return contextMessages[context]?.[error] || error;
};

// Complete forgot password schema with all steps
export const forgotPasswordSchema = {
  sapId: sapIdRules,
  password: passwordRules,
  confirmPassword: z.string(),
  
  // You can also create combined schemas for validation
  resetPassword: z.object({
    newPassword: passwordRules,
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),
};


