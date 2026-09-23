"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { WarehouseDialog } from "@/features/warehouses/components/warehouse-dialog";

export function CreateWarehouseButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon className="size-4" />
        Nuevo almacén
      </Button>
      <WarehouseDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
