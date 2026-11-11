import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import type { createContext } from "@/src/server/api/context";
import { authenticate } from "@/src/server/services/auth";
import { listEquipment } from "@/src/server/services/equipment";
import { loginInput } from "@/src/shared/login-input";

const t = initTRPC.context<Awaited<ReturnType<typeof createContext>>>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) =>
    error.code === "INTERNAL_SERVER_ERROR"
      ? { ...shape, message: "Serviço indisponível. Tente novamente.", data: { ...shape.data, stack: undefined } }
      : { ...shape, data: { ...shape.data, stack: undefined } },
});

const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const user = await ctx.getUser();
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { user } });
});

const tenantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const membership = await ctx.getMembership(ctx.user);
  if (!membership) throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx: { membership } });
});

export const appRouter = t.router({
  auth: t.router({
    login: t.procedure.input(loginInput).mutation(async ({ input, ctx }) => {
      const result = await authenticate(ctx.db, ctx.auth, input);
      if (result.status === "denied") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Não foi possível entrar com essas credenciais." });
      }
      if (result.status === "rate-limited") {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Muitas tentativas. Aguarde e tente novamente." });
      }
      return { ok: true };
    }),
    session: tenantProcedure.input(z.void()).query(({ ctx }) => ({
      name: ctx.membership.name,
      organization: ctx.membership.organization,
      role: ctx.membership.role,
    })),
    logout: t.procedure.input(z.void()).mutation(async ({ ctx }) => {
      const { error } = await ctx.auth.auth.signOut({ scope: "local" });
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return { ok: true };
    }),
  }),
  equipment: t.router({
    list: tenantProcedure.input(z.void()).query(({ ctx }) => listEquipment(ctx.db, ctx.membership.tenantId)),
  }),
});

export type AppRouter = typeof appRouter;
