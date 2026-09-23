"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { UserDialog } from "@/features/users/components/user-dialog";

export function CreateUserButton({ currentUserId }: { currentUserId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon className="size-4" />
        Nuevo usuario
      </Button>
      <UserDialog open={open} onOpenChange={setOpen} currentUserId={currentUserId} />
    </>
  );
}
