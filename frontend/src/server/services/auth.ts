import type { PrismaClient } from "@prisma/client";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { z } from "zod";
import type { LoginInput } from "@/src/shared/login-input";
import { getSupabaseConfiguration } from "@/src/server/env";
import { catalogTenantSlug } from "@/src/shared/catalog-settings.mjs";

const membershipRole = z.enum(["member", "operator", "admin"]);

export function createServerAuth(cookies: CookieMethodsServer) {
  const { url, key } = getSupabaseConfiguration();
  return createServerClient(url, key, {
    cookies,
    cookieOptions: {
      name: "empresti-auth",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  });
}

export async function getCatalogMembership(db: PrismaClient, user: User) {
  const membership = await db.membership.findFirst({
    where: { userId: user.id, tenant: { slug: catalogTenantSlug } },
    select: { tenantId: true, role: true, tenant: { select: { name: true } } },
  });
  const role = membershipRole.safeParse(membership?.role);
  if (!membership || !role.success) return null;

  const profile = await db.profile.findFirst({
    where: { id: user.id, tenantId: membership.tenantId },
    select: { fullName: true },
  });
  return {
    userId: user.id,
    name: profile?.fullName ?? user.email ?? "Colaborador",
    tenantId: membership.tenantId,
    organization: membership.tenant.name,
    role: role.data,
  };
}

export async function verifyUser(auth: SupabaseClient) {
  const result = await auth.auth.getUser();
  if (result.error && (!result.error.status || result.error.status >= 500)) {
    throw new Error("Não foi possível verificar a sessão.");
  }
  return result.data.user;
}

export async function authenticate(db: PrismaClient, auth: SupabaseClient, input: LoginInput) {
  const { url, key } = getSupabaseConfiguration();
  const isolated = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const result = await isolated.auth.signInWithPassword(input);
  if (result.error?.status === 429) return { status: "rate-limited" } as const;
  if (result.error && (!result.error.status || result.error.status >= 500)) {
    throw new Error("O serviço de autenticação está indisponível.");
  }
  if (!result.data.user || !result.data.session) return { status: "denied" } as const;

  const membership = await getCatalogMembership(db, result.data.user);
  if (!membership) {
    await isolated.auth.signOut({ scope: "local" });
    return { status: "denied" } as const;
  }
  const saved = await auth.auth.setSession({
    access_token: result.data.session.access_token,
    refresh_token: result.data.session.refresh_token,
  });
  if (saved.error || !saved.data.session) throw new Error("Não foi possível iniciar a sessão.");
  return { status: "ok" } as const;
}
