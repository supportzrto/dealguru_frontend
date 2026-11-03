// Demo only. Replace with Supabase auth, DB and storage later.
import { useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { ALL_SIZES, allColors, swatch, type Product } from "@/components/shop/data";
import { ProductCard } from "@/components/shop/ProductCard";
import { Field, TextInput } from "@/components/shop/forms";
import { compressImage } from "@/lib/shop/image";
import { createProduct, updateProduct, uploadProductImage } from "@/lib/api/products";
import {
  CATEGORY_OPTIONS,
  discountOf,
  makeSku,
  MAX_IMAGES,
  productSchema,
  type ProductValues,
} from "@/lib/shop/productSchema";
import { btnOutline, btnPrimary, Panel } from "../ui";
import { newId } from "./Products";
import { useProducts } from "@/context/ProductsContext";
function toValues(p?: Product): ProductValues {
  if (!p)
    return {
      name: "",
      category: "home-kitchen",
      description: "",
      features: "",
      setIncludes: "",
      price: NaN,
      originalPrice: NaN,
      stock: NaN,
      sku: "",
      images: [],
      colors: [],
      sizes: [],
      fabric: "Other",
      occasion: "Casual",
      badge: "None",
      showInPopular: false,
      showInBestSellers: false,
      isNew: true,
      status: "active",
    };
  return {
    name: p.name,
    category: p.category,
    description: p.description ?? "",
    features: (p.features ?? []).join("\n"),
    setIncludes: p.setIncludes ?? "",
    price: p.price,
    originalPrice: p.originalPrice,
    stock: p.stock,
    sku: p.sku,
    images: p.images?.length ? p.images : [p.image],
    colors: p.colors,
    sizes: p.sizes,
    fabric: p.fabric,
    occasion: p.occasion,
    badge: p.badge ?? "None",
    showInPopular: p.showInPopular,
    showInBestSellers: p.showInBestSellers,
    isNew: p.isNew,
    status: p.status,
  };
}

export function ProductForm({ product }: { product?: Product | undefined }) {
  const { refreshProducts } = useProducts();
  const [productId] = useState(() => product?.id ?? newId());
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [custom, setCustom] = useState("#f06a1c");
  const [uploading, setUploading] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: toValues(product),
  });
  const v = watch();
  const pct = discountOf(v.price, v.originalPrice);
  const images = v.images ?? [];

  const setImages = (next: string[]) =>
    setValue("images", next, { shouldValidate: true, shouldDirty: true });
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    const room = MAX_IMAGES - images.length;

    if (room <= 0) {
      toast.error(`Up to ${MAX_IMAGES} images`);
      return;
    }

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of [...files].slice(0, room)) {
        const compressed = await compressImage(file);

        const blob = await fetch(compressed).then((response) => response.blob());

        const uploadFile = new File([blob], file.name, { type: blob.type || file.type });

        const url = await uploadProductImage(productId, uploadFile);

        uploadedUrls.push(url);
      }

      setImages([...images, ...uploadedUrls]);

      if (files.length > room) {
        toast.message(`Only ${MAX_IMAGES} images are allowed — extra files skipped`);
      }

      toast.success("Images uploaded successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setUploading(false);

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  };
  const addUrl = () => {
    const u = url.trim();
    if (!/^https?:\/\/\S+$/i.test(u)) {
      toast.error("Enter a valid image URL starting with http(s)://");
      return;
    }
    if (images.length >= MAX_IMAGES) {
      toast.error(`Up to ${MAX_IMAGES} images`);
      return;
    }
    setImages([...images, u]);
    setUrl("");
  };
  const move = (i: number, d: number) => {
    const n = [...images];
    const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j]!, n[i]!];
    setImages(n);
  };
  const toggleIn = (key: "colors" | "sizes", val: string) => {
    const cur = getValues(key);
    setValue(key, cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val], {
      shouldValidate: true,
    });
  };

  const build = (d: ProductValues, id: string): Product => {
    const now = new Date().toISOString();
    return {
      ...(product ?? { rating: 4.5, reviewCount: 0, createdAt: now, featuredAt: now }),
      id,
      name: d.name.trim(),
      category: d.category,
      description: d.description.trim() || undefined,
      features: d.features
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
      setIncludes: d.setIncludes.trim() || undefined,
      price: d.price,
      originalPrice: d.originalPrice,
      stock: d.stock,
      sku: d.sku.trim().toUpperCase(),
      image: d.images[0]!,
      images: d.images,
      colors: d.colors,
      sizes: d.sizes,
      fabric: d.fabric,
      occasion: d.occasion,
      badge: d.badge === "None" ? undefined : d.badge,
      showInPopular: d.showInPopular,
      showInBestSellers: d.showInBestSellers,
      isNew: d.isNew,
      status: d.status,
      // Newly flagged for a home section → show it first there.
      featuredAt:
        product &&
        (product.showInPopular !== d.showInPopular ||
          product.showInBestSellers !== d.showInBestSellers)
          ? now
          : (product?.featuredAt ?? now),
    } as Product;
  };

  const onSubmit = async (d: ProductValues) => {
    try {
      const payload = build(d, productId);

      if (product) {
        await updateProduct(payload);
      } else {
        await createProduct(payload);
      }

      await refreshProducts();

      toast.success(product ? "Product updated successfully" : "Product added successfully");

      navigate({ to: "/admin/products" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save product");
    }
  };

  const preview: Product = build(
    {
      ...v,
      images: images.length ? images : [""],
      name: v.name || "Product name",
      price: v.price || 0,
      originalPrice: v.originalPrice || v.price || 0,
      stock: Number.isFinite(v.stock) ? v.stock : 1,
    } as ProductValues,
    "preview",
  );
  const isAcc = false;
  const box = "rounded-md border border-border bg-card";
  const chip = (on: boolean) =>
    `h-9 min-w-11 rounded-md border px-3 text-[13px] font-medium transition ${on ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:border-foreground"}`;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="space-y-6">
        <Panel title="Basic details">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Product Name *" htmlFor="name" error={errors.name?.message}>
                <TextInput id="name" invalid={!!errors.name} {...register("name")} />
              </Field>
            </div>
            <Field label="Category *" htmlFor="category" error={errors.category?.message}>
              <select id="category" className="input-field" {...register("category")}>
                {CATEGORY_OPTIONS.map(([val, l]) => (
                  <option key={val} value={val}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="SKU"
              htmlFor="sku"
              error={errors.sku?.message}
              hint="Auto-generated, editable"
            >
              <div className="flex gap-2">
                <TextInput id="sku" invalid={!!errors.sku} {...register("sku")} />
                <button
                  type="button"
                  className={btnOutline}
                  onClick={() =>
                    setValue("sku", makeSku(getValues("name"), getValues("category")), {
                      shouldValidate: true,
                    })
                  }
                >
                  Generate
                </button>
              </div>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description" htmlFor="description" error={errors.description?.message}>
                <textarea
                  id="description"
                  rows={4}
                  className="input-field h-auto py-2"
                  {...register("description")}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Key features"
                htmlFor="features"
                error={errors.features?.message}
                hint="One per line — shown as ticks on the product page"
              >
                <textarea
                  id="features"
                  rows={4}
                  className="input-field h-auto py-2"
                  {...register("features")}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field
                label="What’s in the box"
                htmlFor="setIncludes"
                error={errors.setIncludes?.message}
              >
                <TextInput
                  id="setIncludes"
                  invalid={!!errors.setIncludes}
                  placeholder="e.g. 1 Lighter + USB charging cable"
                  {...register("setIncludes")}
                />
              </Field>
            </div>
          </div>
        </Panel>

        <Panel title="Pricing & stock">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Price (₹) *" htmlFor="price" error={errors.price?.message}>
              <TextInput
                id="price"
                type="number"
                min={0}
                invalid={!!errors.price}
                {...register("price", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Original Price (₹)"
              htmlFor="originalPrice"
              error={errors.originalPrice?.message}
              hint={pct ? `${pct}% discount` : "Same as price = no discount"}
            >
              <TextInput
                id="originalPrice"
                type="number"
                min={0}
                invalid={!!errors.originalPrice}
                {...register("originalPrice", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Stock quantity *" htmlFor="stock" error={errors.stock?.message}>
              <TextInput
                id="stock"
                type="number"
                min={0}
                invalid={!!errors.stock}
                {...register("stock", { valueAsNumber: true })}
              />
            </Field>
          </div>
        </Panel>

        <Panel title={`Images (${images.length}/${MAX_IMAGES})`}>
          <div className="flex flex-wrap gap-3">
            {images.map((src, i) => (
              <div key={i} className="relative w-24">
                <img
                  src={src}
                  alt={`Product image ${i + 1}`}
                  className="aspect-[3/4] w-full rounded-md border border-border object-cover"
                />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-foreground px-1.5 text-[10px] font-semibold text-background">
                    Main
                  </span>
                )}
                <div className="mt-1 flex justify-between">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="grid h-6 w-6 place-items-center rounded hover:bg-muted disabled:opacity-30"
                    aria-label="Move image left"
                  >
                    <ArrowUp className="h-3.5 w-3.5 -rotate-90" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, k) => k !== i))}
                    className="grid h-6 w-6 place-items-center rounded text-destructive hover:bg-destructive/10"
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === images.length - 1}
                    className="grid h-6 w-6 place-items-center rounded hover:bg-muted disabled:opacity-30"
                    aria-label="Move image right"
                  >
                    <ArrowDown className="h-3.5 w-3.5 -rotate-90" />
                  </button>
                </div>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="grid aspect-[3/4] w-24 place-items-center rounded-md border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
                aria-label="Upload images"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="text-center text-[11px]">
                    <ImagePlus className="mx-auto mb-1 h-5 w-5" />
                    Upload
                  </span>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => onFiles(e.target.files)}
          />
          <div className="mt-3 flex gap-2">
            <TextInput
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="or paste image URL"
              aria-label="Image URL"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addUrl();
                }
              }}
            />
            <button type="button" className={btnOutline} onClick={addUrl}>
              Add
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            The first image is the main one. Uploads are resized to 800px wide.
          </p>
          {errors.images && (
            <p role="alert" className="mt-1 text-[12px] text-destructive">
              {errors.images.message}
            </p>
          )}
        </Panel>

        <Panel title="Variants">
          <p className="mb-2 text-[13px] font-medium">Colours *</p>
          <div className="flex flex-wrap items-center gap-2">
            {[...allColors, ...v.colors.filter((c) => c.startsWith("#"))].map((c) => {
              const on = v.colors.includes(c);
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => toggleIn("colors", c)}
                  aria-label={`Colour ${c}`}
                  aria-pressed={on}
                  title={c}
                  style={{ background: swatch(c) }}
                  className={`h-7 w-7 rounded-full border border-border transition ${on ? "ring-2 ring-primary ring-offset-2" : ""}`}
                />
              );
            })}
            <span className="ml-2 flex items-center gap-1.5">
              <input
                type="color"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                aria-label="Custom colour"
                className="h-8 w-10 cursor-pointer rounded border border-border bg-card"
              />
              <button
                type="button"
                className={btnOutline}
                onClick={() => {
                  if (!v.colors.includes(custom)) toggleIn("colors", custom);
                }}
              >
                Add custom
              </button>
            </span>
          </div>
          {errors.colors && (
            <p role="alert" className="mt-1 text-[12px] text-destructive">
              {errors.colors.message}
            </p>
          )}
          {!isAcc && (
            <>
              <p className="mb-2 mt-5 text-[13px] font-medium">
                Sizes{" "}
                <span className="font-normal text-muted-foreground">
                  (optional — leave empty if the product has no sizes)
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_SIZES.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleIn("sizes", s)}
                    aria-pressed={v.sizes.includes(s)}
                    className={chip(v.sizes.includes(s))}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {errors.sizes && (
                <p role="alert" className="mt-1 text-[12px] text-destructive">
                  {errors.sizes.message}
                </p>
              )}
            </>
          )}
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Field label="Badge" htmlFor="badge">
              <select id="badge" className="input-field" {...register("badge")}>
                {["None", "New", "Bestseller", "Sale"].map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </Field>
          </div>
        </Panel>

        <Panel title="Show on Home page">
          <div className="space-y-2.5 text-[13px]">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                {...register("showInPopular")}
              />{" "}
              Popular Picks (Home carousel)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                {...register("showInBestSellers")}
              />{" "}
              Best Sellers (Loved by Our Customers)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-primary" {...register("isNew")} />{" "}
              Mark as New Arrival
            </label>
            <label className="flex items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={pct > 0}
                readOnly
                disabled
              />{" "}
              Include in Sale{" "}
              <span className="text-[11px]">
                (automatic when the original price is higher than the price)
              </span>
            </label>
          </div>
          <div className="mt-5">
            <p className="mb-2 text-[13px] font-medium">Status</p>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <div className="flex gap-2">
                  {(["active", "draft"] as const).map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => field.onChange(s)}
                      aria-pressed={field.value === s}
                      className={chip(field.value === s)}
                    >
                      {s === "active" ? "Active" : "Draft"}
                    </button>
                  ))}
                </div>
              )}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Draft products are hidden from the store.
            </p>
          </div>
        </Panel>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSubmitting || uploading}
            className={`${btnPrimary} px-6 py-2.5`}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {product ? "Save changes" : "Add Product"}
          </button>
          <Link to="/admin/products" className={btnOutline}>
            Cancel
          </Link>
        </div>
      </div>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <div className={`${box} p-4`}>
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            Live preview
          </p>
          <div className="pointer-events-none mx-auto max-w-[240px]" aria-hidden>
            {images.length ? (
              <ProductCard p={preview} showDiscount={pct > 0} />
            ) : (
              <div className="grid aspect-[3/4] place-items-center rounded-lg border border-dashed border-border text-[12px] text-muted-foreground">
                Add an image to preview
              </div>
            )}
          </div>
        </div>
      </aside>
    </form>
  );
}
