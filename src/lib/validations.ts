import { z } from "zod";

export const registrationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s.'-]+$/, "Name can only contain English letters, spaces, dots, hyphens, and apostrophes"),
  
  studentId: z
    .string()
    .trim()
    .min(1, "Student ID is required")
    .max(20, "Student ID must be less than 20 characters"),
  
  rollNumber: z
    .string()
    .trim()
    .min(1, "Roll number is required")
    .max(20, "Roll number must be less than 20 characters"),
  
  section: z
    .string()
    .trim()
    .min(1, "Section is required")
    .max(10, "Section must be less than 10 characters"),
  
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
      required_error: "Blood group is required",
    }),
  
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(/^\+8801[0-9]{9}$/, "Phone number must be in format +8801XXXXXXXXX"),
  
  presentAddress: z
    .string()
    .trim()
    .min(1, "Present address is required")
    .max(500, "Address must be less than 500 characters"),
  
  permanentAddress: z
    .string()
    .trim()
    .min(1, "Permanent address is required")
    .max(500, "Address must be less than 500 characters"),
  
  feePaid: z
    .enum(["yes", "no"], {
      required_error: "Please select whether you have paid the fee",
    }),
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

export const adminLoginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username is required")
    .max(50, "Username must be less than 50 characters"),
  
  password: z
    .string()
    .trim()
    .min(1, "Password is required")
    .max(100, "Password must be less than 100 characters"),
});

export type AdminLoginFormData = z.infer<typeof adminLoginSchema>;
