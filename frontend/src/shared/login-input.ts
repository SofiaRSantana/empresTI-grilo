import { z } from "zod";

export const loginInput = z.strictObject({
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  password: z.string().min(1, "Informe sua senha.").max(1024),
});

export type LoginInput = z.infer<typeof loginInput>;
