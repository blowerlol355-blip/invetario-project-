import { redirect } from "next/navigation";

/** La raíz siempre lleva al dashboard; el middleware redirige al login si no hay sesión. */
export default function RootPage() {
  redirect("/dashboard");
}
