"use client";

import { CheckIcon, CopyIcon, KeyRoundIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  /** Clave en claro recién generada; solo existe en memoria del cliente. */
  apiKey: string;
}

/** Muestra una clave de API una única vez, con botón de copiar y ejemplo de uso. */
export function ApiKeyDialog({ open, onOpenChange, userName, apiKey }: ApiKeyDialogProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) setCopied(false);
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      toast.success("Clave copiada al portapapeles.");
    } catch {
      toast.error("No se pudo copiar. Selecciona la clave y cópiala manualmente.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRoundIcon className="size-5 text-primary" />
            Clave de API generada
          </DialogTitle>
          <DialogDescription>
            Clave para <strong>{userName}</strong>. Hereda los permisos de su rol y se usa en la
            cabecera <code className="rounded bg-muted px-1 py-0.5 text-xs">Authorization</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              readOnly
              value={apiKey}
              aria-label="Clave de API"
              className="font-mono text-xs"
              onFocus={(event) => event.currentTarget.select()}
            />
            <Button type="button" variant="outline" onClick={copy} aria-label="Copiar clave">
              {copied ? (
                <CheckIcon className="size-4 text-success" />
              ) : (
                <CopyIcon className="size-4" />
              )}
            </Button>
          </div>

          <Alert>
            <AlertTitle>Guárdala ahora</AlertTitle>
            <AlertDescription>
              Por seguridad solo se almacena un hash: esta clave no volverá a mostrarse. Si se
              pierde, genera una nueva (la anterior deja de funcionar).
            </AlertDescription>
          </Alert>

          <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-3 text-xs">
            {`curl -H "Authorization: Bearer ${apiKey}" \\\n  ${typeof window === "undefined" ? "" : window.location.origin}/api/v1/products?pageSize=5`}
          </pre>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
