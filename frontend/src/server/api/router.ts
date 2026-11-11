import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import type { createContext } from "@/src/server/api/context";
import { authenticate } from "@/src/server/services/auth";
import { listEquipment } from "@/src/server/services/equipment";
import { listOpenLoans, requestLoan } from "@/src/server/services/loans";
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

const loanErrors = {
  missing: { code: "NOT_FOUND", message: "Equipamento não encontrado." },
  unavailable: { code: "CONFLICT", message: "Este equipamento não está disponível." },
  limit: { code: "CONFLICT", message: "Você atingiu o limite de cinco empréstimos em aberto." },
  overdue: { code: "CONFLICT", message: "Você tem um empréstimo em atraso. Devolva o item antes de solicitar outro." },
  conflict: { code: "CONFLICT", message: "Houve outra solicitação ao mesmo tempo. Atualize o catálogo e tente novamente." },
} as const;

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
  loan: t.router({
    request: tenantProcedure.input(z.strictObject({ equipmentId: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
        const result = await requestLoan(ctx.db, ctx.membership, input.equipmentId);
        if (result.status !== "ok") throw new TRPCError(loanErrors[result.status]);
        return { id: result.id, dueDate: result.dueDate };
      }),
    listMine: tenantProcedure.input(z.void()).query(({ ctx }) => listOpenLoans(ctx.db, ctx.membership)),
  }),
});

export type AppRouter = typeof appRouter;
