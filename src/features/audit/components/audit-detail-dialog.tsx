"use client";

import { useMemo } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuditActionBadge } from "@/features/audit/components/audit-action-badge";
import { diffSnapshots, formatSnapshotValue, parseSnapshot } from "@/features/audit/lib/diff";
import type { AuditRow } from "@/features/audit/queries";
import { AUDIT_ENTITY_LABELS, type AuditEntity } from "@/lib/domain";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AuditDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: AuditRow;
}

function entityLabel(entity: string): string {
  return AUDIT_ENTITY_LABELS[entity as AuditEntity] ?? entity;
}

/** Detalle de una entrada de la bitácora: metadatos y comparación campo a campo. */
export function AuditDetailDialog({ open, onOpenChange, log }: AuditDetailDialogProps) {
  const { before, after, entries } = useMemo(() => {
    const parsedBefore = parseSnapshot(log.before);
    const parsedAfter = parseSnapshot(log.after);
    return {
      before: parsedBefore,
      after: parsedAfter,
      entries: diffSnapshots(parsedBefore, parsedAfter),
    };
  }, [log.before, log.after]);

  const showBefore = before !== null;
  const showAfter = after !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <AuditActionBadge action={log.action} />
            <span>
              {entityLabel(log.entity)}
              {log.entityLabel && (
                <span className="font-normal text-muted-foreground"> · {log.entityLabel}</span>
              )}
            </span>
          </DialogTitle>
          <DialogDescription>
            {formatDateTime(log.createdAt)} · {log.userName ?? "Sistema"}
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Id de entidad</dt>
          <dd className="font-mono text-xs break-all">{log.entityId}</dd>
          <dt className="text-muted-foreground">Id de registro</dt>
          <dd className="font-mono text-xs break-all">{log.id}</dd>
        </dl>

        {entries.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Sin cambios de campos registrados.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Campo</TableHead>
                  {showBefore && <TableHead>Antes</TableHead>}
                  {showAfter && <TableHead>Después</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.key}>
                    <TableCell className="font-mono text-xs">{entry.key}</TableCell>
                    {showBefore && (
                      <TableCell
                        className={cn(
                          "text-xs break-all",
                          showAfter && "text-destructive line-through decoration-destructive/40",
                        )}
                      >
                        {formatSnapshotValue(entry.before)}
                      </TableCell>
                    )}
                    {showAfter && (
                      <TableCell className="text-xs break-all text-success">
                        {formatSnapshotValue(entry.after)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground select-none">
            Ver JSON completo
          </summary>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {showBefore && (
              <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-3">
                {JSON.stringify(before, null, 2)}
              </pre>
            )}
            {showAfter && (
              <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-3">
                {JSON.stringify(after, null, 2)}
              </pre>
            )}
          </div>
        </details>
      </DialogContent>
    </Dialog>
  );
}
