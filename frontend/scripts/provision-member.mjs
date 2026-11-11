import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { createOperationsClient } from "./operation-config.mjs";
import { catalogTenantSlug } from "../src/shared/catalog-settings.mjs";

const accountInput = z.object({
  email: z.email().toLowerCase(),
  name: z.string().trim().min(1),
  password: z.string().min(6),
});

async function findAuthUser(admin, email) {
  const perPage = 100;
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.listUsers({ page, perPage });
    if (error) throw error;
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user || data.users.length < perPage) return user;
  }
}

async function main() {
  const [projectFlag, ...extra] = process.argv.slice(2);
  if (extra.length || (projectFlag && !projectFlag.startsWith("--project="))) {
    throw new Error("Uso: node scripts/provision-member.mjs [--project=<referência>]");
  }
  const input = accountInput.safeParse({
    email: process.env.EMPRESTI_ACCOUNT_EMAIL?.trim(),
    name: process.env.EMPRESTI_ACCOUNT_NAME,
    password: process.env.EMPRESTI_ACCOUNT_PASSWORD,
  });
  if (!input.success) throw new Error("Configure e-mail, nome e senha da conta em variáveis protegidas.");
  const { email, name, password } = input.data;
  const { auth: { admin } } = createOperationsClient(projectFlag);
  const db = new PrismaClient();

  try {
    const tenant = await db.tenant.findUniqueOrThrow({
      where: { slug: catalogTenantSlug },
      select: { id: true },
    });
    let user = await findAuthUser(admin, email);
    if (!user) {
      const { data, error } = await admin.createUser({ email, password, email_confirm: true });
      user = data.user ?? await findAuthUser(admin, email);
      if (!user) throw error ?? new Error("Não foi possível provisionar a conta.");
    }
    if (!user.email_confirmed_at) throw new Error("A conta existente precisa confirmar o e-mail.");

    const userId = user.id;
    const loans = await db.$transaction(async (tx) => {
      const membership = await tx.membership.upsert({
        where: { tenantId_userId: { tenantId: tenant.id, userId } },
        create: { tenantId: tenant.id, userId, role: "member" },
        update: {},
      });
      if (membership.role !== "member") throw new Error("A conta existente tem um papel diferente de colaborador.");
      await tx.profile.upsert({
        where: { id: userId },
        create: { id: userId, tenantId: tenant.id, fullName: name, email, role: "member" },
        update: {},
      });
      return tx.loan.count({ where: { borrowerId: userId, tenantId: tenant.id } });
    });
    console.log(`Vínculo de colaborador verificado. Empréstimos na organização: ${loans}.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
