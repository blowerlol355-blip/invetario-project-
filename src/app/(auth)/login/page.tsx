import type { Metadata } from "next";

import { LoginCard } from "@/features/auth/components/login-card";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;
  return <LoginCard callbackUrl={callbackUrl} />;
}
