"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { readKioskFlowState } from "@/app/kiosk/flow-state";
import { Checkout } from "@/components/signature-ritual/atelier/Checkout";
import { useBespokeOrder } from "@/components/signature-ritual/BespokeOrderContext";
import {
  ritualPath,
  ritualWarenkorbPath,
} from "@/components/signature-ritual/routes";

function resolveCustomerId(
  orderRefId: string | number | undefined,
): string | null {
  const fromOrder =
    orderRefId !== undefined && orderRefId !== null && String(orderRefId).trim()
      ? String(orderRefId).trim()
      : "";
  if (fromOrder) return fromOrder;
  const pid = readKioskFlowState().profile?.id;
  return pid !== undefined && pid !== null && String(pid).trim()
    ? String(pid).trim()
    : null;
}

export function CheckoutStep() {
  const router = useRouter();
  const { order, update } = useBespokeOrder();

  const customerId = useMemo(
    () => resolveCustomerId(order.referenceCustomerId),
    [order.referenceCustomerId],
  );

  const recipientName = useMemo(() => {
    const flow = readKioskFlowState();
    const fn = flow.profile?.firstName?.trim() || order.customer.firstName?.trim();
    const ln = flow.profile?.lastName?.trim() || order.customer.lastName?.trim();
    const combined = [fn, ln].filter(Boolean).join(" ");
    return combined || order.customer.name?.trim() || "";
  }, [order.customer.firstName, order.customer.lastName, order.customer.name]);

  const recipientEmail = useMemo(() => {
    const fromFlow = readKioskFlowState().profile?.email?.trim();
    return fromFlow || order.customer.email?.trim() || "";
  }, [order.customer.email]);

  return (
    <Checkout
      customerId={customerId}
      recipientName={recipientName}
      recipientEmail={recipientEmail}
      onBack={() => router.push(ritualWarenkorbPath)}
      onComplete={address => {
        update({
          deliveryAddress: address,
          customer: {
            ...order.customer,
            address: address.address,
          },
        });
        router.push(ritualPath("confirm"));
      }}
    />
  );
}
