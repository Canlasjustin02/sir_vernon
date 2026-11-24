import { z } from "zod";

const passwordSchema = z
  .string()
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    "Use at least 8 characters with uppercase, lowercase, a number, and a special character"
  );

export const registrationSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().email("Enter a valid email address"),
    telephone: z
      .string()
      .trim()
      .regex(
        /^(?:(?:\+94|0)7\d{8}|(?:\+63|0)9\d{9})$/,
        "Enter 09XXXXXXXXX, +639XXXXXXXXX, 07XXXXXXXX, or +947XXXXXXXX"
      ),
    address: z.string().trim().optional(),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegistrationFormValues = z.infer<typeof registrationSchema>;
