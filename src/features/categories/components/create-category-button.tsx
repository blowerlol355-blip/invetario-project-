"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CategoryDialog } from "@/features/categories/components/category-dialog";

export function CreateCategoryButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon className="size-4" />
        Nueva categoría
      </Button>
      <CategoryDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
