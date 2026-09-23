import { z } from "zod";

const optionalEmail = z.union([
  z.literal(""),
  z.email("Ingresa un correo válido").max(255, "El correo no puede superar 255 caracteres"),
]);

export const supplierSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(150, "El nombre no puede superar 150 caracteres"),
  contactName: z.string().trim().max(120, "Máximo 120 caracteres"),
  email: z.string().trim().pipe(optionalEmail),
  phone: z
    .string()
    .trim()
    .max(30, "Máximo 30 caracteres")
    .regex(/^[0-9+()\-\s.]*$/, "Solo dígitos, espacios y los símbolos + ( ) - ."),
  address: z.string().trim().max(255, "Máximo 255 caracteres"),
  taxId: z
    .string()
    .trim()
    .max(30, "Máximo 30 caracteres")
    .regex(/^[A-Za-z0-9.\-]*$/, "Solo letras, números, puntos y guiones"),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

export const supplierDefaults: SupplierInput = {
  name: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
  taxId: "",
};
