"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SupplierDialog } from "@/features/suppliers/components/supplier-dialog";

export function CreateSupplierButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon className="size-4" />
        Nuevo proveedor
      </Button>
      <SupplierDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
