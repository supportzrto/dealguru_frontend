import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Address } from "./AuthContext";
import { useAuth } from "./AuthContext";
import { apiRequest } from "@/lib/api/client";

export const ORDER_STEPS = [
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
] as const;

export type OrderStatus =
  (typeof ORDER_STEPS)[number] | "Pending Payment" | "Processing" | "Cancelled";

export const ALL_STATUSES: OrderStatus[] = [
  "Pending Payment",
  "Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

export const STEP_MINUTES = [0, 1, 2, 3, 5];

export type OrderItem = {
  productId: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  color?: string | undefined;
  size?: string | undefined;
};

export type PaymentStatus = "Paid" | "Pending" | "Refunded";

export type Order = {
  id: string;
  userId: string;
  customerName?: string | undefined;
  customerEmail?: string | undefined;
  items: OrderItem[];
  address: Address;
  delivery: {
    method: "standard" | "express";
    eta: string;
    giftWrap: boolean;
    notes: string;
  };
  paymentMethod: string;
  paymentStatus?: PaymentStatus | undefined;
  amounts: {
    subtotal: number;
    discount: number;
    delivery: number;
    giftWrap: number;
    cod: number;
    giftCard: number;
    total: number;
    coupon?: string | undefined;
  };
  createdAt: string;
  cancelledAt?: string | undefined;
  statusManual?: boolean | undefined;
  status?: OrderStatus | undefined;
  history?: { status: OrderStatus; at: string }[] | undefined;
  trackingNumber?: string | undefined;
  internalNote?: string | undefined;
};

type BackendOrderItem = {
  id: string;
  product_id: string | null;
  product_sku: string;
  product_name: string;
  image: string;
  unit_price: string;
  quantity: number;
  selected_color: string | null;
  selected_size: string | null;
};

type BackendOrder = {
  id: string;
  user_id: string;
  address_snapshot: {
    full_name: string;
    phone: string;
    pincode: string;
    line1: string;
    line2: string;
    landmark: string;
    city: string;
    state: string;
    address_type: string;
  };
  delivery_snapshot: {
    method: "standard" | "express";
    gift_wrap: boolean;
    notes: string;
  };
  subtotal: string;
  discount: string;
  delivery_fee: string;
  gift_wrap_fee: string;
  cod_fee: string;
  gift_card_amount: string;
  total: string;
  order_status: string;
  payment_status: string;
  payment_method: string | null;
  coupon_code: string | null;
  tracking_number: string | null;
  internal_note: string | null;
  created_at: string;
  items: BackendOrderItem[];
};

export type RazorpayOrder = {
  dealguru_order_id: string;
  razorpay_order_id: string;
  razorpay_key_id: string;
  amount: number;
  currency: string;
};

export type RazorpayVerification = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type CreateOrderInput = {
  addressId: string;
  items: {
    productId: string;
    qty: number;
    color?: string | undefined;
    size?: string | undefined;
  }[];
  deliveryMethod: "standard";
  giftWrap: boolean;
  notes: string;
  paymentMethod: "upi" | "card" | "netbanking" | "wallet" | "emi";
  couponCode?: string | undefined;
};

const money = (value: string | number) => Number(value) || 0;

function mapPaymentMethod(method: string | null): string {
  if (!method) return "Online Payment";

  const labels: Record<string, string> = {
    upi: "UPI",
    card: "Card",
    netbanking: "Net Banking",
    wallet: "Wallet",
    emi: "EMI",
  };

  return labels[method] ?? method;
}

function mapBackendOrder(order: BackendOrder): Order {
  const address = order.address_snapshot;
  const delivery = order.delivery_snapshot;

  const createdAt = order.created_at;

  const status = order.order_status as OrderStatus;

  const paymentStatus: PaymentStatus =
    order.payment_status === "paid"
      ? "Paid"
      : order.payment_status === "refunded"
        ? "Refunded"
        : "Pending";

  return {
    id: order.id,
    userId: order.user_id,

    address: {
      id: "",
      fullName: address.full_name,
      phone: address.phone,
      pincode: address.pincode,
      line1: address.line1,
      line2: address.line2,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      type: address.address_type,
      isDefault: false,
    } as Address,

    items: order.items.map((item) => ({
      productId: item.product_id ?? "",
      name: item.product_name,
      image: item.image,
      price: money(item.unit_price),
      qty: item.quantity,
      color: item.selected_color ?? undefined,
      size: item.selected_size ?? undefined,
    })),

    delivery: {
      method: delivery.method,
      eta: new Date(new Date(createdAt).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      giftWrap: delivery.gift_wrap,
      notes: delivery.notes,
    },

    paymentMethod: mapPaymentMethod(order.payment_method),
    paymentStatus,

    amounts: {
      subtotal: money(order.subtotal),
      discount: money(order.discount),
      delivery: money(order.delivery_fee),
      giftWrap: money(order.gift_wrap_fee),
      cod: money(order.cod_fee),
      giftCard: money(order.gift_card_amount),
      total: money(order.total),
      coupon: order.coupon_code ?? undefined,
    },

    createdAt,
    cancelledAt: status === "Cancelled" ? createdAt : undefined,
    status,
    statusManual: true,
    history: [{ status, at: createdAt }],
    trackingNumber: order.tracking_number ?? undefined,
    internalNote: order.internal_note ?? undefined,
  };
}

export function statusAt(
  order: Pick<Order, "createdAt" | "cancelledAt" | "statusManual" | "status">,
): OrderStatus {
  if (order.cancelledAt) return "Cancelled";
  return order.status ?? "Pending Payment";
}

export const canCancel = (status: OrderStatus) => status === "Pending Payment";

export const isCod = (order: Pick<Order, "paymentMethod">) =>
  order.paymentMethod === "Cash on Delivery";

export function paymentStatusOf(order: Order): PaymentStatus {
  return order.paymentStatus ?? "Pending";
}

export function timelineOf(order: Order) {
  return (
    order.history ?? [
      {
        status: statusAt(order),
        at: order.createdAt,
      },
    ]
  );
}

export function applyStatus(order: Order, status: OrderStatus): Order {
  return {
    ...order,
    status,
    statusManual: true,
    history: [...(order.history ?? []), { status, at: new Date().toISOString() }],
    cancelledAt: status === "Cancelled" ? new Date().toISOString() : undefined,
  };
}

type Ctx = {
  ready: boolean;
  now: number;
  orders: Order[];
  myOrders: Order[];
  getOrder: (id: string) => Order | undefined;
  createRazorpayPayment: (orderId: string) => Promise<RazorpayOrder>;
  verifyRazorpayPayment: (orderId: string, payload: RazorpayVerification) => Promise<Order>;
  refreshOrders: () => Promise<void>;
  createOrder: (input: CreateOrderInput) => Promise<Order>;
  cancelOrder: (id: string) => Promise<void>;
  setStatus: (id: string, status: OrderStatus) => Promise<void>;
  updateOrder: (id: string, patch: Partial<Pick<Order, "trackingNumber" | "internalNote">>) => void;
};

const OrdersCtx = createContext<Ctx | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin, ready: authReady } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ready, setReady] = useState(false);
  const [now] = useState(() => Date.now());
  const createRazorpayPayment = useCallback(async (orderId: string): Promise<RazorpayOrder> => {
    return apiRequest<RazorpayOrder>(`/api/orders/${orderId}/payment/create`, {
      method: "POST",
    });
  }, []);

  const verifyRazorpayPayment = useCallback(
    async (orderId: string, payload: RazorpayVerification): Promise<Order> => {
      const response = await apiRequest<BackendOrder>(`/api/orders/${orderId}/payment/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const updatedOrder = mapBackendOrder(response);

      setOrders((previous) =>
        previous.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)),
      );

      return updatedOrder;
    },
    [],
  );
  const refreshOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setReady(true);
      return;
    }

    setReady(false);

    try {
      const endpoint = isAdmin ? "/api/orders/admin/all" : "/api/orders/";

      const response = await apiRequest<BackendOrder[]>(endpoint);

      setOrders(response.map(mapBackendOrder));
    } finally {
      setReady(true);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (!authReady) return;

    refreshOrders().catch((error) => {
      console.error("Failed to load orders:", error);
      setOrders([]);
      setReady(true);
    });
  }, [authReady, refreshOrders]);

  const createOrder = useCallback(async (input: CreateOrderInput): Promise<Order> => {
    const response = await apiRequest<BackendOrder>("/api/orders/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address_id: input.addressId,
        items: input.items.map((item) => ({
          product_id: item.productId,
          quantity: item.qty,
          selected_color: item.color ?? null,
          selected_size: item.size ?? null,
        })),
        delivery_method: input.deliveryMethod,
        gift_wrap: input.giftWrap,
        delivery_notes: input.notes,
        payment_method: input.paymentMethod,
        coupon_code: input.couponCode ?? null,
      }),
    });

    const order = mapBackendOrder(response);

    setOrders((previous) => [order, ...previous.filter((item) => item.id !== order.id)]);

    return order;
  }, []);

  const cancelOrder = useCallback(
    async (id: string) => {
      await apiRequest<BackendOrder>(`/api/orders/${id}/cancel`, {
        method: "POST",
      });

      await refreshOrders();
    },
    [refreshOrders],
  );

  const setStatus = useCallback(async (id: string, status: OrderStatus) => {
    const response = await apiRequest<BackendOrder>(`/api/orders/admin/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_status: status,
      }),
    });

    const updated = mapBackendOrder(response);

    setOrders((previous) => previous.map((order) => (order.id === id ? updated : order)));
  }, []);

  const updateOrder = useCallback(
    async (id: string, patch: Partial<Pick<Order, "trackingNumber" | "internalNote">>) => {
      const payload: {
        tracking_number?: string | null;
        internal_note?: string | null;
      } = {};

      if ("trackingNumber" in patch) {
        payload.tracking_number = patch.trackingNumber ?? null;
      }

      if ("internalNote" in patch) {
        payload.internal_note = patch.internalNote ?? null;
      }

      const response = await apiRequest<BackendOrder>(`/api/orders/admin/${id}/details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const updatedOrder = mapBackendOrder(response);

      setOrders((prev) => prev.map((order) => (order.id === id ? updatedOrder : order)));
    },
    [],
  );

  const value = useMemo<Ctx>(() => {
    const sorted = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const mine = sorted.filter((order) => order.userId === user?.id);

    return {
      ready,
      now,
      orders: sorted,
      myOrders: mine,
      getOrder: (id) => (isAdmin ? sorted : mine).find((order) => order.id === id),
      refreshOrders,
      createOrder,
      cancelOrder,
      setStatus,
      updateOrder,
      createRazorpayPayment,
      verifyRazorpayPayment,
    };
  }, [
    orders,
    user?.id,
    isAdmin,
    ready,
    now,
    refreshOrders,
    createOrder,
    cancelOrder,
    setStatus,
    updateOrder,
  ]);

  return <OrdersCtx.Provider value={value}>{children}</OrdersCtx.Provider>;
}

export function useOrders() {
  const context = useContext(OrdersCtx);

  if (!context) {
    throw new Error("OrdersProvider missing");
  }

  return context;
}
