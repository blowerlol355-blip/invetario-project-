"use client";

import { BanIcon, PackageCheckIcon, PencilIcon, SendIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelPurchaseOrderAction,
  sendPurchaseOrderAction,
} from "@/features/purchase-orders/actions";
import { ReceiveDialog } from "@/features/purchase-orders/components/receive-dialog";
import { canPerform } from "@/features/purchase-orders/lib/status";
import type { PurchaseOrderDetail } from "@/features/purchase-orders/queries";

interface PurchaseOrderActionsProps {
  order: PurchaseOrderDetail;
  canManage: boolean;
  canReceive: boolean;
}

export function PurchaseOrderActions({ order, canManage, canReceive }: PurchaseOrderActionsProps) {
  const [sendOpen, setSendOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const send = async () => {
    const result = await sendPurchaseOrderAction(order.id);
    if (!result.success) throw new Error(result.error);
    toast.success(`Orden ${order.code} enviada al proveedor.`);
  };

  const cancel = async () => {
    const result = await cancelPurchaseOrderAction(order.id, cancelReason);
    if (!result.success) throw new Error(result.error);
    toast.success(`Orden ${order.code} cancelada.`);
  };

  return (
    <>
      {canManage && canPerform(order.status, "edit") && (
        <Button variant="outline" asChild>
          <Link href={`/purchase-orders/${order.id}/edit`}>
            <PencilIcon className="size-4" />
            Editar
          </Link>
        </Button>
      )}
      {canManage && canPerform(order.status, "send") && (
        <Button onClick={() => setSendOpen(true)}>
          <SendIcon className="size-4" />
          Enviar al proveedor
        </Button>
      )}
      {canReceive && canPerform(order.status, "receive") && (
        <Button onClick={() => setReceiveOpen(true)}>
          <PackageCheckIcon className="size-4" />
          Recibir mercancía
        </Button>
      )}
      {canManage && canPerform(order.status, "cancel") && (
        <Button variant="outline" className="text-destructive" onClick={() => setCancelOpen(true)}>
          <BanIcon className="size-4" />
          Cancelar orden
        </Button>
      )}

      <ConfirmDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        title="Enviar orden al proveedor"
        description={`La orden ${order.code} pasará a estado "Enviada" y ya no podrá editarse. Podrás recibirla parcial o totalmente.`}
        confirmLabel="Enviar"
        onConfirm={send}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancelar orden de compra"
        description={
          <span className="block space-y-3">
            <span className="block">
              La orden {order.code} quedará cancelada y no podrá recibirse. Esta acción no se puede
              deshacer.
            </span>
            <Textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Motivo (opcional)"
              rows={2}
              aria-label="Motivo de cancelación"
            />
          </span>
        }
        confirmLabel="Cancelar orden"
        cancelLabel="Volver"
        destructive
        onConfirm={cancel}
      />

      <ReceiveDialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        orderId={order.id}
        code={order.code}
        warehouseName={order.warehouse.name}
        items={order.items}
      />
    </>
  );
}
