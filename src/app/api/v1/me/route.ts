import { apiJson, apiRoute } from "@/features/api/handler";
import { ROLE_PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** GET /api/v1/me: identidad con la que se autenticó la petición y sus permisos. */
export const GET = apiRoute({}, async ({ principal }) => {
  return apiJson({
    id: principal.userId,
    name: principal.name,
    email: principal.email,
    role: principal.role,
    authenticatedVia: principal.via,
    permissions: ROLE_PERMISSIONS[principal.role],
  });
});
