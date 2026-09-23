"use client";

import { PackageIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { type DemoUser, DemoUsers } from "@/features/auth/components/demo-users";
import { LoginForm } from "@/features/auth/components/login-form";

interface LoginCardProps {
  callbackUrl?: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function LoginCard({ callbackUrl }: LoginCardProps) {
  const [selected, setSelected] = useState<DemoUser | null>(null);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.08 }}
      className="w-full max-w-md rounded-2xl border bg-card/80 p-6 shadow-xl backdrop-blur sm:p-8"
    >
      <motion.div variants={fadeUp} className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-lg shadow-primary/30">
            <PackageIcon className="size-6" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">StockPilot</h1>
            <p className="text-sm text-muted-foreground">Gestión de inventario</p>
          </div>
        </div>
        <ThemeToggle />
      </motion.div>

      <motion.div variants={fadeUp} className="mb-6">
        <h2 className="text-lg font-semibold">Iniciar sesión</h2>
        <p className="text-sm text-muted-foreground">
          Ingresa con tu cuenta o elige un usuario de demostración.
        </p>
      </motion.div>

      <motion.div variants={fadeUp}>
        <LoginForm
          callbackUrl={callbackUrl}
          prefill={selected ? { email: selected.email, password: selected.password } : null}
        />
      </motion.div>

      <motion.div variants={fadeUp} className="mt-6 border-t pt-6">
        <DemoUsers selectedEmail={selected?.email} onSelect={setSelected} />
      </motion.div>
    </motion.div>
  );
}
