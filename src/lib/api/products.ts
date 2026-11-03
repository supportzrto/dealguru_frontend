
import type { Product } from "@/components/shop/data";
import { apiRequest } from "@/lib/api/client";


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
  const data = await apiRequest<ApiProduct[]>("/api/products/");
  return data.map(mapProduct);
}

export async function fetchAllProductsAdmin(): Promise<Product[]> {
  const data = await apiRequest<ApiProduct[]>("/api/products/admin/all");
  return data.map(mapProduct);
}

export async function fetchProduct(id: string): Promise<Product> {
  const data = await apiRequest<ApiProduct>(
    `/api/products/${encodeURIComponent(id)}`
  );

  return mapProduct(data);
}

export async function uploadProductImage(
  productId: string,
  file: File
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiRequest<{ url: string }>(
    `/api/products/admin/${encodeURIComponent(productId)}/images`,
    {
      method: "POST",
      body: formData,
    }
  );

  return response.url;
}

export async function createProduct(product: Product): Promise<Product> {
  const data = await apiRequest<ApiProduct>("/api/products/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      description: product.description ?? null,
      image: product.image,
      images: product.images,
      color_images: product.colorImages,
      price: product.price,
      original_price: product.originalPrice,
      rating: product.rating,
      review_count: product.reviewCount,
      colors: product.colors,
      badge: product.badge ?? null,
      is_new: product.isNew,
      fabric: product.fabric,
      occasion: product.occasion,
      set_includes: product.setIncludes ?? null,
      features: product.features,
      stock: product.stock,
      sizes: product.sizes,
      status: product.status,
      show_in_popular: product.showInPopular,
      show_in_best_sellers: product.showInBestSellers,
      featured_at: product.featuredAt ?? null,
    }),
  });

  return mapProduct(data);
}

export async function updateProduct(product: Product): Promise<Product> {
  const data = await apiRequest<ApiProduct>(
    `/api/products/${encodeURIComponent(product.id)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sku: product.sku,
        name: product.name,
        category: product.category,
        description: product.description ?? null,
        image: product.image,
        images: product.images,
        color_images: product.colorImages,
        price: product.price,
        original_price: product.originalPrice,
        rating: product.rating,
        review_count: product.reviewCount,
        colors: product.colors,
        badge: product.badge ?? null,
        is_new: product.isNew,
        fabric: product.fabric,
        occasion: product.occasion,
        set_includes: product.setIncludes ?? null,
        features: product.features,
        stock: product.stock,
        sizes: product.sizes,
        status: product.status,
        show_in_popular: product.showInPopular,
        show_in_best_sellers: product.showInBestSellers,
        featured_at: product.featuredAt ?? null,
      }),
    }
  );

  return mapProduct(data);
}

export async function deleteProduct(id: string): Promise<void> {
  await apiRequest(
    `/api/products/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}