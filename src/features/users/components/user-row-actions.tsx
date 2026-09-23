"use client";

import {
  BanIcon,
  CircleCheckIcon,
  KeyRoundIcon,
  KeySquareIcon,
  LockKeyholeIcon,
  MoreHorizontalIcon,
  PencilIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  generateApiKeyAction,
  revokeApiKeyAction,
  setUserActiveAction,
} from "@/features/users/actions";
import { ApiKeyDialog } from "@/features/users/components/api-key-dialog";
import { PasswordDialog } from "@/features/users/components/password-dialog";
import { UserDialog } from "@/features/users/components/user-dialog";
import type { UserRow } from "@/features/users/queries";

interface UserRowActionsProps {
  user: UserRow;
  currentUserId: string;
}

export function UserRowActions({ user, currentUserId }: UserRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [activeOpen, setActiveOpen] = useState(false);
  const [keyConfirmOpen, setKeyConfirmOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const isSelf = user.id === currentUserId;
  const nextActive = !user.isActive;

  const toggleActive = async () => {
    const result = await setUserActiveAction(user.id, nextActive);
    if (!result.success) throw new Error(result.error);
    toast.success(nextActive ? "Usuario activado." : "Usuario desactivado.");
  };

  const generateKey = async () => {
    const result = await generateApiKeyAction(user.id);
    if (!result.success) throw new Error(result.error);
    setGeneratedKey(result.data.apiKey);
  };

  const revokeKey = async () => {
    const result = await revokeApiKeyAction(user.id);
    if (!result.success) throw new Error(result.error);
    toast.success("Clave de API revocada.");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${user.name}`}>
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <PencilIcon className="size-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setPasswordOpen(true)}>
            <LockKeyholeIcon className="size-4" />
            Restablecer contraseña
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setKeyConfirmOpen(true)} disabled={!user.isActive}>
            <KeyRoundIcon className="size-4" />
            {user.hasApiKey ? "Regenerar clave de API" : "Generar clave de API"}
          </DropdownMenuItem>
          {user.hasApiKey && (
            <DropdownMenuItem onSelect={() => setRevokeOpen(true)}>
              <KeySquareIcon className="size-4" />
              Revocar clave de API
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setActiveOpen(true)}
            disabled={isSelf}
            variant={nextActive ? "default" : "destructive"}
          >
            {nextActive ? <CircleCheckIcon className="size-4" /> : <BanIcon className="size-4" />}
            {nextActive ? "Activar" : "Desactivar"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={user}
        currentUserId={currentUserId}
      />
      <PasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} user={user} />

      <ConfirmDialog
        open={keyConfirmOpen}
        onOpenChange={setKeyConfirmOpen}
        title={user.hasApiKey ? "Regenerar clave de API" : "Generar clave de API"}
        description={
          user.hasApiKey
            ? `La clave actual de ${user.name} dejará de funcionar de inmediato y se mostrará una nueva una sola vez.`
            : `Se creará una clave para que ${user.name} use la API REST con los permisos de su rol. Se mostrará una sola vez.`
        }
        confirmLabel={user.hasApiKey ? "Regenerar" : "Generar"}
        onConfirm={generateKey}
      />
      <ApiKeyDialog
        open={generatedKey !== null}
        onOpenChange={(open) => !open && setGeneratedKey(null)}
        userName={user.name}
        apiKey={generatedKey ?? ""}
      />

      <ConfirmDialog
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        title="Revocar clave de API"
        description={`Las integraciones que usen la clave de ${user.name} recibirán 401 a partir de ahora.`}
        confirmLabel="Revocar"
        destructive
        onConfirm={revokeKey}
      />

      <ConfirmDialog
        open={activeOpen}
        onOpenChange={setActiveOpen}
        title={nextActive ? "Activar usuario" : "Desactivar usuario"}
        description={
          nextActive
            ? `${user.name} podrá volver a iniciar sesión y usar su clave de API.`
            : `${user.name} no podrá iniciar sesión ni usar la API. Su historial de movimientos y auditoría se conserva. Si tiene una sesión abierta, seguirá activa hasta que caduque (máximo 8 horas).`
        }
        confirmLabel={nextActive ? "Activar" : "Desactivar"}
        destructive={!nextActive}
        onConfirm={toggleActive}
      />
    </>
  );
}
