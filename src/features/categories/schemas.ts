import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre no puede superar 80 caracteres"),
  description: z.string().trim().max(500, "La descripción no puede superar 500 caracteres"),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const categoryDefaults: CategoryInput = { name: "", description: "" };
