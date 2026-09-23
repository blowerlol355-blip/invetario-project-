import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { CreateUserButton } from "@/features/users/components/create-user-button";
import { UsersTable } from "@/features/users/components/users-table";
import { listUsers, USER_SORTS } from "@/features/users/queries";
import { userFiltersSchema } from "@/features/users/schemas";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { parseListParams, resolveSort, type SearchParams } from "@/lib/query-params";

export const metadata: Metadata = {
  title: "Usuarios",
};

interface UsersPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "users:manage")) redirect("/forbidden");

  const raw = await searchParams;
  const params = parseListParams(raw);
  const filters = userFiltersSchema.parse({ role: raw.role ?? "" });
  const data = await listUsers(params, filters);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Cuentas, roles y claves de API. Los cambios de rol y las desactivaciones se aplican en el siguiente inicio de sesión."
        actions={<CreateUserButton currentUserId={session.user.id} />}
      />
      <UsersTable
        data={data}
        sortState={{ sort: resolveSort(params.sort, USER_SORTS, "name"), order: params.order }}
        currentUserId={session.user.id}
      />
    </div>
  );
}
