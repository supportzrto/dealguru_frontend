import { z } from "zod";

const email = z.string().trim().min(1, "Email is required").email("Enter a valid email").max(255);
const phone = z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");
const password = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(100);

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(80),
    email,
    phone,
    password,
    confirm: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: "Please accept the terms" }) }),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });
export type RegisterValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({ email, password: z.string().min(1, "Password is required"), remember: z.boolean() });
export type LoginValues = z.infer<typeof loginSchema>;

export const forgotSchema = z.object({ email });

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Chandigarh",
] as const;

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the recipient's name").max(80),
  phone,
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"),
  line1: z.string().trim().min(3, "Enter house no. and street").max(120),
  line2: z.string().trim().max(120),
  landmark: z.string().trim().max(80),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z.string().min(1, "Choose a state"),
  type: z.enum(["Home", "Work"]),
  isDefault: z.boolean(),
});
export type AddressValues = z.infer<typeof addressSchema>;

export const profileSchema = z.object({ fullName: z.string().trim().min(2, "Enter your full name").max(80), phone });
export type ProfileValues = z.infer<typeof profileSchema>;

export const passwordSchema = z
  .object({ current: z.string().min(1, "Enter your current password"), next: password, confirm: z.string() })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Passwords do not match" });
export type PasswordValues = z.infer<typeof passwordSchema>;

export const cardSchema = z.object({
  number: z.string().refine((v) => /^\d{16}$/.test(v.replace(/\s/g, "")), "Enter a 16-digit card number"),
  name: z.string().trim().min(2, "Enter the name on card").max(60),
  expiry: z.string(),
  cvv: z.string().regex(/^\d{3,4}$/, "3 or 4 digits"),
  save: z.boolean(),
});
export type CardValues = z.infer<typeof cardSchema>;
