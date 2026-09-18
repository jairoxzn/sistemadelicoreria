"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Search,
  Barcode,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/format";
import { cn } from "cn";
import { CustomerCombobox } from "@/components/pos/customer-combobox";
import { PaymentDialog, type PaymentLine } from "@/components/pos/payment-dialog";
import { ReceiptDialog } from "@/components/pos/receipt-dialog";
import { createSale, type SaleReceipt } from "@/app/(app)/pos/actions";

type Product = {
  id: string;
  name: string;
  internalCode: string;
  barcode: string | null;
  salePrice: number;
  promoPrice: number | null;
  categoryId: string;
  categoryName: string;
  stock: number;
  imageUrl: string | null;
};

type Combo = { id: string; name: string; price: number; stock: number };
type Category = { id: string; name: string };
type Customer = { id: string; name: string; documentNumber: string | null };

type CartItem = {
  key: string;
  kind: "product" | "combo";
  refId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  stock: number;
};

export function PosClient({
  cashRegisterId,
  products,
  combos,
  categories,
  customers,
  canDiscount,
  business,
}: {
  cashRegisterId: string;
  products: Product[];
  combos: Combo[];
  categories: Category[];
  customers: Customer[];
  canDiscount: boolean;
  business: {
    tradeName: string;
    address: string | null;
    phone: string | null;
    ticketFooter: string | null;
    logoUrl: string | null;
  };
}) {
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string | null>(null);
  const [showCombos, setShowCombos] = React.useState(false);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [customerId, setCustomerId] = React.useState<string | null>(null);
  const [discount, setDiscount] = React.useState(0);
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [receipt, setReceipt] = React.useState<SaleReceipt | null>(null);
  const [receiptOpen, setReceiptOpen] = React.useState(false);

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  const q = search.trim().toLowerCase();

  const filteredProducts = showCombos
    ? []
    : products.filter((p) => {
        const matchesSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.internalCode.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase() === q;
        const matchesCategory = !categoryFilter || p.categoryId === categoryFilter;
        return matchesSearch && matchesCategory;
      });

  const filteredCombos = !showCombos
    ? []
    : combos.filter((c) => !q || c.name.toLowerCase().includes(q));

  function addProductToCart(product: Product) {
    if (product.stock <= 0) {
      toast.error(`"${product.name}" no tiene stock disponible.`);
      return;
    }
    const key = `product:${product.id}`;
    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        if (existing.quantity + 1 > product.stock) {
          toast.error(`No hay más stock disponible de "${product.name}".`);
          return prev;
        }
        return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          key,
          kind: "product",
          refId: product.id,
          name: product.name,
          unitPrice: product.promoPrice ?? product.salePrice,
          quantity: 1,
          stock: product.stock,
        },
      ];
    });
  }

  function addComboToCart(combo: Combo) {
    if (combo.stock <= 0) {
      toast.error(`"${combo.name}" no tiene stock disponible.`);
      return;
    }
    const key = `combo:${combo.id}`;
    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        if (existing.quantity + 1 > combo.stock) {
          toast.error(`No hay más stock disponible de "${combo.name}".`);
          return prev;
        }
        return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          key,
          kind: "combo",
          refId: combo.id,
          name: combo.name,
          unitPrice: combo.price,
          quantity: 1,
          stock: combo.stock,
        },
      ];
    });
  }

  function updateQuantity(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.key !== key) return item;
          const newQty = item.quantity + delta;
          if (newQty > item.stock) {
            toast.error("No hay suficiente stock.");
            return item;
          }
          return { ...item, quantity: newQty };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(key: string) {
    setCart((prev) => prev.filter((i) => i.key !== key));
  }

  function handleBarcodeEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const value = search.trim();
    if (!value) return;
    const match = products.find((p) => p.barcode === value || p.internalCode === value);
    if (match) {
      addProductToCart(match);
      setSearch("");
    }
  }

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        if (cart.length > 0 && !paymentOpen) setPaymentOpen(true);
      } else if (e.key === "Escape") {
        setPaymentOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart.length, paymentOpen]);

  async function handleConfirmPayment(payments: PaymentLine[]) {
    setIsSubmitting(true);
    const result = await createSale({
      customerId,
      cashRegisterId,
      discount,
      items: cart.map((item) => ({
        productId: item.kind === "product" ? item.refId : undefined,
        comboId: item.kind === "combo" ? item.refId : undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: 0,
      })),
      payments,
    });
    setIsSubmitting(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    setPaymentOpen(false);
    setReceipt(result.receipt);
    setReceiptOpen(true);
    setCart([]);
    setCustomerId(null);
    setDiscount(0);
  }

  return (
    <div className="grid h-[calc(100svh-4rem)] grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[1fr_380px]">
      {/* Left: search + products */}
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Barcode className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Buscar producto o escanear código de barras... (F2)"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleBarcodeEnter}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={!showCombos && categoryFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowCombos(false);
              setCategoryFilter(null);
            }}
          >
            Todas
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              variant={!showCombos && categoryFilter === c.id ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowCombos(false);
                setCategoryFilter(c.id);
              }}
            >
              {c.name}
            </Button>
          ))}
          {combos.length > 0 && (
            <Button
              variant={showCombos ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCombos(true)}
            >
              <Gift className="size-3.5" />
              Combos
            </Button>
          )}
        </div>

        <ScrollArea className="min-h-0 flex-1 rounded-xl border border-border bg-card">
          {showCombos ? (
            filteredCombos.length === 0 ? (
              <EmptyState icon={Gift} title="No hay combos disponibles" />
            ) : (
              <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 xl:grid-cols-4">
                {filteredCombos.map((combo) => (
                  <button
                    key={combo.id}
                    type="button"
                    onClick={() => addComboToCart(combo)}
                    disabled={combo.stock <= 0}
                    className="flex flex-col items-start gap-1 rounded-lg border border-primary/30 bg-primary/5 p-3 text-left transition-colors hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium">{combo.name}</p>
                    <p className="text-xs text-muted-foreground">Combo</p>
                    <div className="mt-1 flex w-full items-center justify-between">
                      <span className="font-semibold text-primary">
                        {formatCurrency(combo.price)}
                      </span>
                      <Badge variant={combo.stock <= 0 ? "destructive" : "secondary"} className="text-xs">
                        {combo.stock <= 0 ? "Agotado" : `${combo.stock}`}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : filteredProducts.length === 0 ? (
            <EmptyState icon={Search} title="No se encontraron productos" />
          ) : (
            <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProductToCart(product)}
                  disabled={product.stock <= 0}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
                  )}
                >
                  <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.internalCode}</p>
                  <div className="mt-1 flex w-full items-center justify-between">
                    <span className="font-semibold text-primary">
                      {formatCurrency(product.promoPrice ?? product.salePrice)}
                    </span>
                    <Badge variant={product.stock <= 0 ? "destructive" : "secondary"} className="text-xs">
                      {product.stock <= 0 ? "Agotado" : `${product.stock}`}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right: cart */}
      <div className="flex min-h-0 flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <CustomerCombobox customers={customers} value={customerId} onChange={setCustomerId} />

        <ScrollArea className="min-h-0 flex-1">
          {cart.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="El carrito está vacío" />
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-2 rounded-lg border border-border p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.kind === "combo" && (
                        <Gift className="mr-1 inline size-3.5 text-primary" />
                      )}
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.unitPrice)} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-xs"
                      onClick={() => updateQuantity(item.key, -1)}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      onClick={() => updateQuantity(item.key, 1)}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                  <p className="w-16 shrink-0 text-right text-sm font-semibold">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </p>
                  <Button variant="ghost" size="icon-xs" onClick={() => removeFromCart(item.key)}>
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="space-y-1.5 border-t border-border pt-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          {canDiscount && (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Descuento</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="h-7 w-24 text-right"
                value={discount || ""}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
          )}
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full"
          disabled={cart.length === 0}
          onClick={() => setPaymentOpen(true)}
        >
          <CreditCard className="size-4" />
          Cobrar (F4)
        </Button>
      </div>

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={total}
        onConfirm={handleConfirmPayment}
        isSubmitting={isSubmitting}
      />
      <ReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        receipt={receipt}
        business={business}
      />
    </div>
  );
}
