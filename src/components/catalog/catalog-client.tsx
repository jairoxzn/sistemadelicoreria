"use client";

import * as React from "react";
import {
  Search,
  MessageCircle,
  MapPin,
  Phone,
  Wine,
  Beer,
  Martini,
  GlassWater,
  CupSoda,
  PackageSearch,
  ShoppingCart,
  Plus,
  Minus,
  Trash,
  Menu,
  Heart,
  Flame,
  SlidersHorizontal,
  Truck,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  Grid2x2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/format";
import { cn } from "cn";

type Product = {
  id: string;
  name: string;
  brandName: string | null;
  categoryId: string;
  categoryName: string;
  presentation: string | null;
  content: string | null;
  salePrice: number;
  originalPrice: number | null;
  imageUrl: string | null;
  soldCount: number;
  isTopSeller: boolean;
  isNew: boolean;
};

type Category = { id: string; name: string };
type FacetOption = { name: string; count: number };

type Business = {
  tradeName: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
};

type SortOption = "vendidos" | "nombre" | "precio-asc" | "precio-desc";

const CART_STORAGE_KEY = "catalogo:cart";
const FAVORITES_STORAGE_KEY = "catalogo:favoritos";

function whatsappLink(whatsapp: string, message: string) {
  const digits = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

const CATEGORY_ICONS: { keywords: string[]; icon: typeof Wine }[] = [
  { keywords: ["whisky", "whiskey", "bourbon", "escoces"], icon: GlassWater },
  { keywords: ["brandy", "cognac", "coñac"], icon: Martini },
  { keywords: ["vodka", "gin", "ginebra", "tequila", "ron", "aguardiente"], icon: Wine },
  { keywords: ["cerveza", "beer"], icon: Beer },
  { keywords: ["vino", "wine", "espumante", "champ"], icon: Wine },
  { keywords: ["gaseosa", "soda", "refresco", "jugo", "bebida"], icon: CupSoda },
];

function iconForCategory(name: string) {
  const lower = name.toLowerCase();
  for (const entry of CATEGORY_ICONS) {
    if (entry.keywords.some((k) => lower.includes(k))) return entry.icon;
  }
  return Wine;
}

function toggleInArray(arr: string[], value: string) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function badgeForProduct(product: Product): { label: string; className: string } | null {
  if (product.originalPrice) {
    return { label: "Oferta", className: "bg-destructive text-white" };
  }
  if (product.isNew) {
    return { label: "Nuevo", className: "bg-emerald-500 text-white" };
  }
  if (product.isTopSeller) {
    return { label: "Más vendido", className: "bg-primary text-primary-foreground" };
  }
  return null;
}

export function CatalogClient({
  business,
  categories,
  products,
  brands,
  presentations,
  priceBounds,
}: {
  business: Business;
  categories: Category[];
  products: Product[];
  brands: FacetOption[];
  presentations: FacetOption[];
  priceBounds: { min: number; max: number };
}) {
  const sliderMax = Math.max(priceBounds.max, priceBounds.min + 1);

  const [search, setSearch] = React.useState("");
  const [categoryFilters, setCategoryFilters] = React.useState<string[]>([]);
  const [brandFilters, setBrandFilters] = React.useState<string[]>([]);
  const [presentationFilters, setPresentationFilters] = React.useState<string[]>([]);
  const [priceRange, setPriceRange] = React.useState<[number, number]>([
    priceBounds.min,
    sliderMax,
  ]);
  const [sortBy, setSortBy] = React.useState<SortOption>("vendidos");
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  const [cart, setCart] = React.useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = React.useState(false);
  const [favorites, setFavorites] = React.useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = React.useState(false);

  const productsSectionRef = React.useRef<HTMLDivElement>(null);
  const footerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);
      if (rawCart) {
        const parsed = JSON.parse(rawCart);
        const validEntries = Object.entries(parsed ?? {}).filter(
          (entry): entry is [string, number] => typeof entry[1] === "number"
        );
        setCart(Object.fromEntries(validEntries));
      }
      const rawFavorites = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (rawFavorites) {
        const parsed = JSON.parse(rawFavorites);
        if (Array.isArray(parsed)) setFavorites(new Set(parsed));
      }
    } catch {
      // ignore corrupted/unavailable storage
    } finally {
      setHydrated(true);
    }
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore write failures (private mode, quota, etc.)
    }
  }, [cart, hydrated]);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favorites]));
    } catch {
      // ignore write failures
    }
  }, [favorites, hydrated]);

  function setQty(productId: string, qty: number) {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[productId];
      } else {
        next[productId] = qty;
      }
      return next;
    });
  }

  function addOne(productId: string) {
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }));
  }

  function toggleFavorite(productId: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  function scrollToRef(ref: React.RefObject<HTMLDivElement | null>) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearFilters() {
    setCategoryFilters([]);
    setBrandFilters([]);
    setPresentationFilters([]);
    setPriceRange([priceBounds.min, sliderMax]);
  }

  const hasActiveFilters =
    categoryFilters.length > 0 ||
    brandFilters.length > 0 ||
    presentationFilters.length > 0 ||
    priceRange[0] !== priceBounds.min ||
    priceRange[1] !== sliderMax;

  const q = search.trim().toLowerCase();
  const filtered = products.filter((p) => {
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.brandName?.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q);
    const matchesCategory = categoryFilters.length === 0 || categoryFilters.includes(p.categoryId);
    const matchesBrand =
      brandFilters.length === 0 || (!!p.brandName && brandFilters.includes(p.brandName));
    const matchesPresentation =
      presentationFilters.length === 0 ||
      (!!p.presentation && presentationFilters.includes(p.presentation));
    const matchesPrice = p.salePrice >= priceRange[0] && p.salePrice <= priceRange[1];
    return (
      matchesSearch && matchesCategory && matchesBrand && matchesPresentation && matchesPrice
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "precio-asc":
        return a.salePrice - b.salePrice;
      case "precio-desc":
        return b.salePrice - a.salePrice;
      case "nombre":
        return a.name.localeCompare(b.name);
      case "vendidos":
      default:
        return b.soldCount - a.soldCount;
    }
  });

  const productById = React.useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const cartLines = Object.entries(cart)
    .map(([id, qty]) => {
      const product = productById.get(id);
      return product ? { product, qty } : null;
    })
    .filter((line): line is { product: Product; qty: number } => line !== null);

  const cartCount = cartLines.reduce((sum, l) => sum + l.qty, 0);
  const cartTotal = cartLines.reduce((sum, l) => sum + l.qty * l.product.salePrice, 0);

  function buildOrderMessage() {
    const lines = cartLines.map(
      (l, i) =>
        `${i + 1}. ${l.product.name} x${l.qty} - ${formatCurrency(l.qty * l.product.salePrice)}`
    );
    return [
      `Hola, quiero hacer este pedido en ${business.tradeName}:`,
      "",
      ...lines,
      "",
      `Total estimado: ${formatCurrency(cartTotal)}`,
      "",
      "¿Está disponible?",
    ].join("\n");
  }

  function renderFilters() {
    return (
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Precio</p>
          <Slider
            min={priceBounds.min}
            max={sliderMax}
            step={1}
            value={priceRange}
            onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
          />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(priceRange[0])}</span>
            <span>{formatCurrency(priceRange[1])}</span>
          </div>
        </div>

        {brands.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Marca</p>
            <div className="space-y-1.5">
              {brands.map((b) => (
                <label
                  key={b.name}
                  className="flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground"
                >
                  <Checkbox
                    checked={brandFilters.includes(b.name)}
                    onCheckedChange={() => setBrandFilters((prev) => toggleInArray(prev, b.name))}
                  />
                  {b.name}
                  <span className="ml-auto text-xs text-muted-foreground">{b.count}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {presentations.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Presentación</p>
            <div className="space-y-1.5">
              {presentations.map((p) => (
                <label
                  key={p.name}
                  className="flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground"
                >
                  <Checkbox
                    checked={presentationFilters.includes(p.name)}
                    onCheckedChange={() =>
                      setPresentationFilters((prev) => toggleInArray(prev, p.name))
                    }
                  />
                  {p.name}
                  <span className="ml-auto text-xs text-muted-foreground">{p.count}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {categories.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Tipo</p>
            <div className="space-y-1.5">
              {categories.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground"
                >
                  <Checkbox
                    checked={categoryFilters.includes(c.id)}
                    onCheckedChange={() => setCategoryFilters((prev) => toggleInArray(prev, c.id))}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="bg-[#111318] px-4 py-3 text-white sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/20 text-primary">
              {business.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.logoUrl}
                  alt={business.tradeName}
                  className="size-full object-cover"
                />
              ) : (
                <Wine className="size-5" />
              )}
            </div>
            <div className="leading-tight">
              <p className="text-base font-bold tracking-tight">{business.tradeName}</p>
              <p className="text-[11px] text-white/50">Tu licorería, en un clic</p>
            </div>
          </div>

          <div className="order-3 w-full sm:order-2 sm:flex-1">
            <div className="flex items-center overflow-hidden rounded-full bg-white">
              <Search className="ml-3.5 size-4 shrink-0 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar productos, marcas o categorías..."
                className="w-full bg-transparent px-2.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={() => scrollToRef(productsSectionRef)}
                className="m-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                aria-label="Buscar"
              >
                <Search className="size-4" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setCartOpen(true)}
            className="order-2 ml-auto flex shrink-0 items-center gap-2 sm:order-3 sm:ml-0"
          >
            <span className="relative flex size-9 items-center justify-center rounded-full bg-white/10">
              <ShoppingCart className="size-4.5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </span>
            <span className="hidden text-sm font-medium sm:inline">Carrito</span>
          </button>
        </div>
      </header>

      {/* Nav */}
      <div className="bg-[#1b1e26] px-4 py-2.5 text-sm text-white/80 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-6">
          <button
            onClick={() => scrollToRef(productsSectionRef)}
            className="flex items-center gap-1.5 font-medium text-white"
          >
            <Menu className="size-4" />
            Categorías
          </button>
          <div className="ml-auto flex items-center gap-6">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="border-b-2 border-primary pb-0.5 font-medium text-primary"
            >
              Inicio
            </button>
            <button
              onClick={() => {
                setSortBy("vendidos");
                scrollToRef(productsSectionRef);
              }}
              className="hidden hover:text-white sm:inline"
            >
              Más vendidos
            </button>
            <button
              onClick={() => scrollToRef(footerRef)}
              className="hidden hover:text-white sm:inline"
            >
              Contacto
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#111318] text-white">
        {business.bannerUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={business.bannerUrl}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#111318] via-[#111318]/80 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,theme(colors.primary/25%),transparent_45%),radial-gradient(circle_at_80%_60%,theme(colors.primary/15%),transparent_50%)]" />
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Disfruta los mejores momentos
          </p>
          <h1 className="mt-2 max-w-lg text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Las mejores bebidas, en <span className="text-primary">un solo lugar</span>
          </h1>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/80">
            <span className="flex items-center gap-2">
              <Truck className="size-4 text-primary" />
              Delivery rápido y seguro
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              Productos 100% originales
            </span>
            <span className="flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              Pagos seguros
            </span>
          </div>
          <button
            onClick={() => scrollToRef(productsSectionRef)}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Ver productos
            <ArrowRight className="size-4" />
          </button>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Categorías</h2>
            {categoryFilters.length > 0 && (
              <button
                onClick={() => setCategoryFilters([])}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Ver todas
                <ArrowRight className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setCategoryFilters([])}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  "flex size-14 items-center justify-center rounded-full border transition-colors",
                  categoryFilters.length === 0
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                )}
              >
                <Grid2x2 className="size-6" />
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  categoryFilters.length === 0 ? "text-primary" : "text-muted-foreground"
                )}
              >
                Todas
              </span>
            </button>
            {categories.map((c) => {
              const Icon = iconForCategory(c.name);
              const active = categoryFilters.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilters((prev) => toggleInArray(prev, c.id))}
                  className="flex shrink-0 flex-col items-center gap-1.5"
                >
                  <span
                    className={cn(
                      "flex size-14 items-center justify-center rounded-full border transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-card text-foreground hover:border-primary/50"
                    )}
                  >
                    <Icon className="size-6" />
                  </span>
                  <span
                    className={cn(
                      "max-w-16 truncate text-xs font-medium",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Main: filters + grid */}
      <div
        ref={productsSectionRef}
        className="mx-auto max-w-7xl scroll-mt-4 gap-8 px-4 pb-16 sm:px-6 lg:grid lg:grid-cols-[240px_1fr]"
      >
        <aside className="hidden lg:block">
          <div className="sticky top-4 rounded-2xl border border-border bg-card p-4">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <SlidersHorizontal className="size-4 text-primary" />
              Filtrar productos
            </p>
            {renderFilters()}
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-1.5 text-lg font-bold text-foreground">
              <Flame className="size-5 text-primary" />
              Productos populares
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <SlidersHorizontal className="size-3.5" />
                Filtros
              </Button>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendidos">Más vendidos</SelectItem>
                  <SelectItem value="nombre">Nombre A-Z</SelectItem>
                  <SelectItem value="precio-asc">Precio: menor a mayor</SelectItem>
                  <SelectItem value="precio-desc">Precio: mayor a menor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <PackageSearch className="size-6" />
              </div>
              <p className="text-sm font-medium text-foreground">No se encontraron productos</p>
              <p className="text-sm text-muted-foreground">
                Prueba con otra búsqueda o ajusta los filtros.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {sorted.map((product) => {
                const qty = cart[product.id] ?? 0;
                const badge = badgeForProduct(product);
                const isFavorite = favorites.has(product.id);
                return (
                  <div
                    key={product.id}
                    className="flex flex-col rounded-2xl border border-border bg-card p-3 shadow-sm"
                  >
                    <div className="relative mb-3 flex aspect-square items-center justify-center rounded-xl bg-muted">
                      {badge && (
                        <span
                          className={cn(
                            "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm",
                            badge.className
                          )}
                        >
                          {badge.label}
                        </span>
                      )}
                      <button
                        onClick={() => toggleFavorite(product.id)}
                        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm transition-colors hover:text-destructive"
                        aria-label={
                          isFavorite ? `Quitar ${product.name} de favoritos` : `Guardar ${product.name} en favoritos`
                        }
                      >
                        <Heart className={cn("size-3.5", isFavorite && "fill-destructive text-destructive")} />
                      </button>
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="size-full rounded-xl object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Wine className="size-10 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <p className="line-clamp-1 text-sm font-semibold text-foreground">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[product.categoryName, product.content].filter(Boolean).join(" · ")}
                      </p>
                      <div className="mt-1.5 flex items-baseline gap-2">
                        <span className="text-base font-bold text-foreground">
                          {formatCurrency(product.salePrice)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatCurrency(product.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      {qty === 0 ? (
                        <button
                          onClick={() => addOne(product.id)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                        >
                          <ShoppingCart className="size-3.5" />
                          Agregar al carrito
                        </button>
                      ) : (
                        <div className="flex items-center justify-between gap-1 rounded-lg bg-primary px-2 py-1.5 text-primary-foreground">
                          <button
                            onClick={() => setQty(product.id, qty - 1)}
                            className="flex size-6 items-center justify-center rounded-md hover:bg-primary-foreground/20"
                            aria-label={`Quitar una unidad de ${product.name}`}
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="text-sm font-semibold">{qty}</span>
                          <button
                            onClick={() => addOne(product.id)}
                            className="flex size-6 items-center justify-center rounded-md hover:bg-primary-foreground/20"
                            aria-label={`Agregar una unidad de ${product.name}`}
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer ref={footerRef} className="scroll-mt-4 bg-[#111318] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center overflow-hidden rounded-lg bg-primary/20 text-primary">
              {business.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.logoUrl}
                  alt={business.tradeName}
                  className="size-full object-cover"
                />
              ) : (
                <Wine className="size-4.5" />
              )}
            </div>
            <p className="text-base font-bold">{business.tradeName}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm text-white/70">
            {business.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5 text-primary" />
                {business.phone}
              </span>
            )}
            {business.address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" />
                {business.address}
              </span>
            )}
            {business.whatsapp && (
              <a
                href={whatsappLink(
                  business.whatsapp,
                  `Hola, quiero hacer una consulta sobre su catálogo de ${business.tradeName}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-white"
              >
                <MessageCircle className="size-3.5 text-primary" />
                Escríbenos por WhatsApp
              </a>
            )}
          </div>
          <p className="mt-2 text-xs text-white/40">
            © {new Date().getFullYear()} {business.tradeName}. Todos los derechos reservados.
            Precios sujetos a cambio sin previo aviso. Venta prohibida a menores de edad.
          </p>
        </div>
      </footer>

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:px-6">
          <button
            onClick={() => setCartOpen(true)}
            className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingCart className="size-4" />
              {cartCount} producto{cartCount === 1 ? "" : "s"}
            </span>
            <span className="flex items-center gap-2 text-sm font-semibold">
              {formatCurrency(cartTotal)}
              <span className="underline underline-offset-2">Ver carrito</span>
            </span>
          </button>
        </div>
      )}

      {/* Mobile filters sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-xs">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-primary" />
              Filtrar productos
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">{renderFilters()}</div>
        </SheetContent>
      </Sheet>

      {/* Cart sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="size-4 text-primary" />
              Mi pedido
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4">
            {cartLines.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <ShoppingCart className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Tu carrito está vacío.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pb-2">
                {cartLines.map(({ product, qty }) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <Wine className="size-6 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(product.salePrice)} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border border-border px-1 py-1">
                      <button
                        onClick={() => setQty(product.id, qty - 1)}
                        className="flex size-6 items-center justify-center rounded-full text-foreground hover:bg-muted"
                        aria-label={`Quitar una unidad de ${product.name}`}
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="min-w-4 text-center text-xs font-semibold">{qty}</span>
                      <button
                        onClick={() => addOne(product.id)}
                        className="flex size-6 items-center justify-center rounded-full text-foreground hover:bg-muted"
                        aria-label={`Agregar una unidad de ${product.name}`}
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => setQty(product.id, 0)}
                      className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Quitar ${product.name} del carrito`}
                    >
                      <Trash className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cartLines.length > 0 && (
            <SheetFooter className="gap-3 border-t border-border pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total estimado</span>
                <span className="text-lg font-semibold text-primary">
                  {formatCurrency(cartTotal)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                El total es referencial. Confirmaremos disponibilidad y monto final por WhatsApp.
              </p>
              {business.whatsapp ? (
                <Button size="lg" className="w-full" asChild>
                  <a
                    href={whatsappLink(business.whatsapp, buildOrderMessage())}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="size-4" />
                    Enviar pedido por WhatsApp
                  </a>
                </Button>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  Este negocio aún no configuró su WhatsApp de contacto.
                </p>
              )}
              <button
                onClick={() => setCart({})}
                className="text-center text-xs font-medium text-muted-foreground hover:text-destructive"
              >
                Vaciar carrito
              </button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
