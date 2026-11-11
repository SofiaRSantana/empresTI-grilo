import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createClient, type User } from "@supabase/supabase-js";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./router";

const databaseUrl = process.env.EMPRESTI_TEST_DATABASE_URL;
type Borrower = { tenantId: string; userId: string };

describe.skipIf(!databaseUrl)("004-solicitar-emprestimo com PostgreSQL local", () => {
  let db: PrismaClient;
  let primary: Borrower;
  let colleague: Borrower;
  let outsider: Borrower;
  const tenantIds: string[] = [];
  const userIds: string[] = [];
  const auth = createClient("http://127.0.0.1:54321", "fixture", {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  beforeAll(() => {
    const url = new URL(databaseUrl!);
    if (url.protocol !== "postgresql:" || url.hostname !== "127.0.0.1" || url.port !== "54322") {
      throw new Error("Use o PostgreSQL descartável em 127.0.0.1:54322 para testes com escrita.");
    }
    db = new PrismaClient({ datasourceUrl: databaseUrl });
  });

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-10T17:00:00.000Z"));
    const a = await db.tenant.create({ data: { slug: `test-loans-${randomUUID()}`, name: "Fixture A" } });
    tenantIds.push(a.id);
    const b = await db.tenant.create({ data: { slug: `test-loans-${randomUUID()}`, name: "Fixture B" } });
    tenantIds.push(b.id);
    for (let i = 0; i < 3; i += 1) {
      const id = randomUUID();
      await db.$executeRaw`INSERT INTO auth.users (id) VALUES (${id}::uuid)`;
      userIds.push(id);
    }
    primary = { tenantId: a.id, userId: userIds[0] };
    colleague = { tenantId: a.id, userId: userIds[1] };
    outsider = { tenantId: b.id, userId: userIds[2] };
  });

  afterEach(async () => {
    vi.useRealTimers();
    if (!db) return;
    await db.loan.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await db.tenant.deleteMany({ where: { id: { in: tenantIds } } });
    for (const id of userIds) await db.$executeRaw`DELETE FROM auth.users WHERE id = ${id}::uuid`;
    tenantIds.length = 0;
    userIds.length = 0;
  });

  afterAll(() => db?.$disconnect());

  function caller(borrower?: Borrower, hasMembership = true) {
    const user: User | null = borrower ? {
      id: borrower.userId, aud: "authenticated", created_at: "",
      app_metadata: {}, user_metadata: {},
    } : null;
    return appRouter.createCaller({
      db, auth,
      getUser: async () => user,
      getMembership: async () => borrower && hasMembership ? {
        ...borrower, name: "Fixture", organization: "Fixture", role: "member",
      } : null,
    });
  }

  function createEquipment(tenantId: string, status = "available") {
    return db.equipment.create({
      data: { tenantId, status, name: "Notebook de teste", location: "Suporte", category: "notebook",
        patrimonyCode: randomUUID() },
    });
  }

  async function openLoans(borrower: Borrower, count: number) {
    for (let index = 0; index < count; index += 1) {
      const item = await createEquipment(borrower.tenantId);
      await caller(borrower).loan.request({ equipmentId: item.id });
    }
  }

  it("CA-02 cria o empréstimo e muda o equipamento para emprestado", async () => {
    const item = await createEquipment(primary.tenantId);
    const created = await caller(primary).loan.request({ equipmentId: item.id });
    const persisted = await db.loan.findUniqueOrThrow({ where: { id: created.id } });
    expect(persisted).toMatchObject({ equipmentId: item.id, borrowerId: primary.userId, tenantId: primary.tenantId });
    expect(await db.equipment.findUnique({ where: { id: item.id } })).toMatchObject({ status: "borrowed" });
  });

  it("CA-03 impede solicitações de equipamentos em manutenção ou emprestados", async () => {
    for (const status of ["maintenance", "borrowed"]) {
      const item = await createEquipment(primary.tenantId, status);
      await expect(caller(primary).loan.request({ equipmentId: item.id })).rejects.toMatchObject({ code: "CONFLICT" });
      expect(await db.loan.count({ where: { equipmentId: item.id } })).toBe(0);
      expect(await db.equipment.findUnique({ where: { id: item.id } })).toMatchObject({ status });
    }
  });

  it("CA-04 informa o limite no sexto pedido e mantém o equipamento disponível", async () => {
    await openLoans(primary, 5);
    const item = await createEquipment(primary.tenantId);
    await expect(caller(primary).loan.request({ equipmentId: item.id })).rejects.toMatchObject({
      code: "CONFLICT", message: expect.stringContaining("limite de cinco"),
    });
    expect(await db.equipment.findUnique({ where: { id: item.id } })).toMatchObject({ status: "available" });
    expect(await db.loan.count({ where: { borrowerId: primary.userId } })).toBe(5);
  });

  it("CA-05 recusa por data vencida mesmo que o status persistido ainda seja active", async () => {
    const first = await createEquipment(primary.tenantId);
    const requestedAt = new Date(Date.now() - 10 * 86_400_000);
    const dueAt = new Date(Date.now() - 2 * 86_400_000);
    const loan = await db.loan.create({
      data: { tenantId: primary.tenantId, borrowerId: primary.userId, requestedBy: primary.userId,
        equipmentId: first.id, requestedAt, dueAt },
    });
    await db.loan.update({ where: { id: loan.id }, data: { status: "active" } });
    const candidate = await createEquipment(primary.tenantId);
    await expect(caller(primary).loan.request({ equipmentId: candidate.id })).rejects.toMatchObject({
      code: "CONFLICT", message: expect.stringContaining("atraso"),
    });
    expect(await db.equipment.findUnique({ where: { id: candidate.id } })).toMatchObject({ status: "available" });
    expect(await db.loan.count({ where: { equipmentId: candidate.id } })).toBe(0);
  });

  it("CA-06 aceita apenas uma de duas solicitações concorrentes para o mesmo item", async () => {
    const item = await createEquipment(primary.tenantId);
    const results = await Promise.allSettled([
      caller(primary).loan.request({ equipmentId: item.id }),
      caller(colleague).loan.request({ equipmentId: item.id }),
    ]);
    expect(results).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: "fulfilled" }),
      expect.objectContaining({ status: "rejected", reason: expect.objectContaining({ code: "CONFLICT" }) }),
    ]));
    expect(await db.loan.count({ where: { equipmentId: item.id } })).toBe(1);
    expect(await db.equipment.findUnique({ where: { id: item.id } })).toMatchObject({ status: "borrowed" });
  });

  it("CA-07 preserva o limite com dois pedidos concorrentes para itens distintos", async () => {
    await openLoans(primary, 4);
    const items = await Promise.all([createEquipment(primary.tenantId), createEquipment(primary.tenantId)]);
    const results = await Promise.allSettled(items.map((item) => caller(primary).loan.request({ equipmentId: item.id })));
    expect(results).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: "fulfilled" }),
      expect.objectContaining({ status: "rejected", reason: expect.objectContaining({ code: "CONFLICT" }) }),
    ]));
    expect(await db.loan.count({ where: { borrowerId: primary.userId, returnedAt: null } })).toBe(5);
    expect(await db.equipment.count({ where: { id: { in: items.map(({ id }) => id) }, status: "available" } })).toBe(1);
  });

  it("CA-09 lista apenas os próprios empréstimos em aberto com data prevista", async () => {
    const item = await createEquipment(primary.tenantId);
    const mine = await caller(primary).loan.request({ equipmentId: item.id });
    const returned = await caller(primary).loan.request({ equipmentId: (await createEquipment(primary.tenantId)).id });
    await db.loan.update({ where: { id: returned.id }, data: { returnedAt: new Date() } });
    await openLoans(colleague, 1);
    await openLoans(outsider, 1);
    const lateItem = await createEquipment(primary.tenantId);
    const late = await db.loan.create({ data: {
      tenantId: primary.tenantId, borrowerId: primary.userId, requestedBy: primary.userId,
      equipmentId: lateItem.id, requestedAt: new Date(Date.now() - 10 * 86_400_000),
      dueAt: new Date(Date.now() - 2 * 86_400_000),
    } });
    expect(await caller(primary).loan.listMine()).toEqual([{
      id: late.id, dueDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), overdue: true,
      equipment: { name: lateItem.name, patrimonyCode: lateItem.patrimonyCode },
    }, {
      ...mine, overdue: false, equipment: { name: item.name, patrimonyCode: item.patrimonyCode },
    }]);
  });

  it("CA-10 recusa sem sessão e impede consultar ou solicitar item de outra organização", async () => {
    const item = await createEquipment(outsider.tenantId);
    await expect(caller().loan.request({ equipmentId: item.id })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller().loan.listMine()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller(primary, false).loan.request({ equipmentId: item.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller(primary, false).loan.listMine()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller(primary).loan.request({ equipmentId: item.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await db.loan.count({ where: { equipmentId: item.id } })).toBe(0);
    expect(await db.equipment.findUnique({ where: { id: item.id } })).toMatchObject({ status: "available" });
  });
});
