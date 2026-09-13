import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { ShippingAddress, OrderStatus, PaymentMethod } from "@/lib/types";
import type { Id } from "../convex/_generated/dataModel";
import { useToast } from "@/providers/ToastProvider";

export function useOrderActions() {
  const createOrder = useMutation(api.orders.create);
  const updateStatus = useMutation(api.orders.updateStatus);
  const { showError } = useToast();

  const placeOrder = async (
    address: ShippingAddress,
    paymentMethod: PaymentMethod = "cod"
  ): Promise<string> => {
    try {
      const orderId = await createOrder({
        shippingAddress: address,
        paymentMethod,
      });
      return orderId;
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to place order");
      throw err;
    }
  };

  const advanceOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateStatus({ id: orderId as Id<"orders">, status: newStatus });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update order status");
    }
  };

  return { placeOrder, advanceOrderStatus };
}
