"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { generateApiKey } from "@/features/users/lib/api-key";
import { assertCanChangeRole, assertCanSetActive } from "@/features/users/lib/rules";
import {
  type PasswordResetInput,
  passwordResetSchema,
  type UserCreateInput,
  userCreateSchema,
  type UserUpdateInput,
  userUpdateSchema,
} from "@/features/users/schemas";
import { type ActionResult, ok, toActionError } from "@/lib/action-result";
import { type DbClient, recordAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/lib/domain";
import { NotFoundError } from "@/lib/errors";

const ENTITY = "User";
const UNIQUE_MESSAGES = { email: "Ya existe un usuario con ese correo." };
const BCRYPT_ROUNDS = 10;

function revalidate() {
  revalidatePath("/users");
  revalidatePath("/audit");
}

async function countActiveAdmins(db: DbClient): Promise<number> {
  return db.user.count({ where: { role: "ADMIN", isActive: true } });
}

async function findTarget(db: DbClient, id: string) {
  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("El usuario no existe.");
  return { ...user, role: user.role as UserRole };
}

export async function createUserAction(
  input: UserCreateInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("users:manage");
    const values = userCreateSchema.parse(input);
    const passwordHash = await bcrypt.hash(values.password, BCRYPT_ROUNDS);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: values.name,
          email: values.email.toLowerCase(),
          role: values.role,
          passwordHash,
        },
      });
      await recordAudit(tx, {
        userId: session.user.id,
        action: "CREATE",
        entity: ENTITY,
        entityId: created.id,
        after: created,
      });
      return created;
    });

    revalidate();
    return ok({ id: user.id });
  } catch (error) {
    return toActionError(error, { unique: UNIQUE_MESSAGES });
  }
}

export async function updateUserAction(
  id: string,
  input: UserUpdateInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("users:manage");
    const values = userUpdateSchema.parse(input);

    await prisma.$transaction(async (tx) => {
      const before = await findTarget(tx, id);
      assertCanChangeRole(
        { actorId: session.user.id, target: before, activeAdminCount: await countActiveAdmins(tx) },
        values.role,
      );
      const after = await tx.user.update({
        where: { id },
        data: { name: values.name, email: values.email.toLowerCase(), role: values.role },
      });
      await recordAudit(tx, {
        userId: session.user.id,
        action: "UPDATE",
        entity: ENTITY,
        entityId: id,
        before,
        after,
      });
    });

    revalidate();
    return ok({ id });
  } catch (error) {
    return toActionError(error, { unique: UNIQUE_MESSAGES });
  }
}

/** Activa o desactiva una cuenta. La desactivación se aplica en el siguiente inicio de sesión. */
export async function setUserActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("users:manage");

    await prisma.$transaction(async (tx) => {
      const before = await findTarget(tx, id);
      assertCanSetActive(
        { actorId: session.user.id, target: before, activeAdminCount: await countActiveAdmins(tx) },
        isActive,
      );
      const after = await tx.user.update({ where: { id }, data: { isActive } });
      await recordAudit(tx, {
        userId: session.user.id,
        action: isActive ? "UPDATE" : "DELETE",
        entity: ENTITY,
        entityId: id,
        before: { isActive: before.isActive },
        after: { isActive: after.isActive },
      });
    });

    revalidate();
    return ok({ id });
  } catch (error) {
    return toActionError(error);
  }
}

export async function resetPasswordAction(
  id: string,
  input: PasswordResetInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("users:manage");
    const values = passwordResetSchema.parse(input);
    const passwordHash = await bcrypt.hash(values.password, BCRYPT_ROUNDS);

    await prisma.$transaction(async (tx) => {
      await findTarget(tx, id);
      await tx.user.update({ where: { id }, data: { passwordHash } });
      await recordAudit(tx, {
        userId: session.user.id,
        action: "UPDATE",
        entity: ENTITY,
        entityId: id,
        after: { passwordReset: true },
      });
    });

    revalidate();
    return ok({ id });
  } catch (error) {
    return toActionError(error);
  }
}

/**
 * Genera (o reemplaza) la clave de API del usuario. La clave en claro se devuelve
 * una única vez; en la base solo queda su hash.
 */
export async function generateApiKeyAction(id: string): Promise<ActionResult<{ apiKey: string }>> {
  try {
    const session = await requirePermission("users:manage");
    const generated = generateApiKey();

    await prisma.$transaction(async (tx) => {
      const before = await findTarget(tx, id);
      const after = await tx.user.update({
        where: { id },
        data: { apiKeyHash: generated.hash, apiKeyCreatedAt: new Date() },
      });
      await recordAudit(tx, {
        userId: session.user.id,
        action: "UPDATE",
        entity: ENTITY,
        entityId: id,
        before: { apiKeyCreatedAt: before.apiKeyCreatedAt },
        after: { apiKeyCreatedAt: after.apiKeyCreatedAt },
      });
    });

    revalidate();
    return ok({ apiKey: generated.key });
  } catch (error) {
    return toActionError(error);
  }
}

export async function revokeApiKeyAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("users:manage");

    await prisma.$transaction(async (tx) => {
      const before = await findTarget(tx, id);
      await tx.user.update({
        where: { id },
        data: { apiKeyHash: null, apiKeyCreatedAt: null },
      });
      await recordAudit(tx, {
        userId: session.user.id,
        action: "UPDATE",
        entity: ENTITY,
        entityId: id,
        before: { apiKeyCreatedAt: before.apiKeyCreatedAt },
        after: { apiKeyCreatedAt: null },
      });
    });

    revalidate();
    return ok({ id });
  } catch (error) {
    return toActionError(error);
  }
}
