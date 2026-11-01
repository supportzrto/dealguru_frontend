import { z } from "zod";

export const CATEGORY_OPTIONS = [
  ["home-kitchen", "Home & Kitchen"], ["gadgets", "Gadgets"], ["daily-essentials", "Daily Essentials"],
] as const;
export const MAX_IMAGES = 8;

const num = (label: string) => z.number({ invalid_type_error: `Enter ${label}`, required_error: `Enter ${label}` });

export const productSchema = z.object({
  name: z.string().trim().min(2, "Product name is required").max(120, "Keep it under 120 characters"),
  category: z.enum(["home-kitchen", "gadgets", "daily-essentials"], { errorMap: () => ({ message: "Choose a category" }) }),
  description: z.string().trim().max(2000, "Keep it under 2000 characters"),
  /** One highlight per line. */
  features: z.string().max(1000, "Keep it under 1000 characters"),
  setIncludes: z.string().trim().max(200, "Keep it under 200 characters"),
  price: num("a price").positive("Price must be more than 0").max(1000000),
  originalPrice: num("the original price").positive("Original price must be more than 0").max(1000000),
  stock: num("the stock quantity").int("Use a whole number").min(0, "Stock can’t be negative").max(100000),
  sku: z.string().trim().min(1, "SKU is required").max(40).regex(/^[A-Za-z0-9-]+$/, "Letters, numbers and dashes only"),
  images: z.array(z.string().min(1)).min(1, "Add at least one image").max(MAX_IMAGES),
  colors: z.array(z.string()).min(1, "Pick at least one colour"),
  sizes: z.array(z.string()),
  fabric: z.enum(["Cotton", "Rayon", "Silk", "Velvet", "Linen", "Other"]),
  occasion: z.enum(["Casual", "Festive", "Wedding", "Office"]),
  badge: z.enum(["None", "New", "Bestseller", "Sale"]),
  showInPopular: z.boolean(),
  showInBestSellers: z.boolean(),
  isNew: z.boolean(),
  status: z.enum(["active", "draft"]),
}).superRefine((v, ctx) => {
  if (v.originalPrice < v.price) ctx.addIssue({ code: "custom", path: ["originalPrice"], message: "Original price must be at least the price" });
});
export type ProductValues = z.infer<typeof productSchema>;

export const discountOf = (price: number, original: number) => (original > price && price > 0 ? Math.round((1 - price / original) * 100) : 0);
export const makeSku = (name: string, category: string) =>
  `DG-${category.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase()}-${(name.replace(/[^a-z0-9]/gi, "").slice(0, 4) || "ITEM").toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
