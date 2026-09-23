import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El correo es obligatorio")
    .pipe(z.email("Ingresa un correo válido"))
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria")
    .max(128, "Contraseña demasiado larga"),
});

export type LoginInput = z.input<typeof loginSchema>;
export type LoginValues = z.output<typeof loginSchema>;
