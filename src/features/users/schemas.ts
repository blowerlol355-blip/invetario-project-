import { z } from "zod";

import { USER_ROLES } from "@/lib/domain";

/** Contraseña: 8 a 128 caracteres con al menos una letra y un número. */
export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(128, "La contraseña no puede superar 128 caracteres")
  .regex(/[A-Za-z]/, "Debe incluir al menos una letra")
  .regex(/\d/, "Debe incluir al menos un número");

const userBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre no puede superar 120 caracteres"),
  email: z
    .string()
    .trim()
    .min(1, "El correo es obligatorio")
    .max(255, "El correo no puede superar 255 caracteres")
    .pipe(z.email("Ingresa un correo válido")),
  role: z.enum(USER_ROLES, { error: "Selecciona un rol" }),
});

export const userCreateSchema = userBaseSchema.extend({ password: passwordSchema });
export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = userBaseSchema;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

/** Formulario único de crear/editar: la contraseña solo se valida al crear. */
export const userFormSchema = userBaseSchema.extend({ password: z.string() });
export type UserFormInput = z.infer<typeof userFormSchema>;

export const userFormDefaults: UserFormInput = {
  name: "",
  email: "",
  role: "OPERATOR",
  password: "",
};

export const passwordResetSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

/** Filtros propios del listado de usuarios (además de los genéricos de ListParams). */
export const userFiltersSchema = z.object({
  role: z.union([z.enum(USER_ROLES), z.literal("")]).catch(""),
});
export type UserFilters = z.infer<typeof userFiltersSchema>;
