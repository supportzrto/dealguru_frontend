
import type { Product } from "@/components/shop/data";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type ApiProduct = {
  id: string;
  sku: string;
  name: string;
  category: Product["category"];
  description: string | null;
  image: string;
  images: string[] | null;
  color_images: Record<string, string> | null;
  price: number;
  original_price: number;
  rating: number;
  review_count: number;
  colors: string[];
  badge: Product["badge"] | null;
  is_new: boolean;
  fabric: Product["fabric"];
  occasion: Product["occasion"];
  set_includes: string | null;
  features: string[] | null;
  stock: number;
  sizes: string[];
  status: Product["status"];
  show_in_popular: boolean;
  show_in_best_sellers: boolean;
  featured_at: string | null;
  created_at: string;
};

function mapProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    description: p.description ?? undefined,
    image: p.image,
    images: p.images ?? [],
    colorImages: p.color_images ?? {},
    price: Number(p.price),
    originalPrice: Number(p.original_price),
    rating: p.rating,
    reviewCount: p.review_count,
    colors: p.colors ?? [],
    badge: p.badge ?? undefined,
    isNew: p.is_new,
    createdAt: p.created_at,
    fabric: p.fabric,
    occasion: p.occasion,
    setIncludes: p.set_includes ?? undefined,
    features: p.features ?? [],
    stock: p.stock,
    sizes: p.sizes ?? [],
    status: p.status,
    showInPopular: p.show_in_popular,
    showInBestSellers: p.show_in_best_sellers,
    featuredAt: p.featured_at ?? undefined,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE_URL}/api/products/`);

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  const data: ApiProduct[] = await response.json();

  return data.map(mapProduct);
}

export async function fetchProduct(id: string): Promise<Product> {
  const response = await fetch(
    `${API_BASE_URL}/api/products/${encodeURIComponent(id)}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.status}`);
  }

  const data: ApiProduct = await response.json();

  return mapProduct(data);
}
