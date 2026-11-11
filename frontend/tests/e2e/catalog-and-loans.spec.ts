import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { calculateLoanDueDate } from "../../src/server/services/loan-calendar";

const testDatabaseUrl = process.env.EMPRESTI_TEST_DATABASE_URL;
const testSecret = process.env.EMPRESTI_TEST_SUPABASE_SECRET_KEY;
const photoManifest = process.env.EMPRESTI_TEST_PHOTO_MANIFEST;
const localSupabase = "http://127.0.0.1:54321";
const email = `e2e-${randomUUID()}@example.org`;
const password = randomUUID();
const fixtureEquipmentIds: string[] = [];
let db: PrismaClient;
let userId: string;
let tenantId: string;

test.skip(!testDatabaseUrl || !testSecret || !photoManifest, "Requer Supabase descartável local e manifesto das fotos.");

function provision() {
  const env = {
    ...process.env,
    DATABASE_URL: testDatabaseUrl,
    DIRECT_URL: testDatabaseUrl,
    SUPABASE_URL: localSupabase,
    SUPABASE_SECRET_KEY: testSecret,
    EMPRESTI_ACCOUNT_EMAIL: email,
    EMPRESTI_ACCOUNT_NAME: "Colaborador de teste",
    EMPRESTI_ACCOUNT_PASSWORD: password,
  };
  return spawnSync(process.execPath, ["scripts/provision-member.mjs"], { env, encoding: "utf8" });
}

test.beforeAll(async () => {
  const url = new URL(testDatabaseUrl!);
  if (url.protocol !== "postgresql:" || url.hostname !== "127.0.0.1" || url.port !== "54322") {
    throw new Error("Use somente o PostgreSQL descartável em 127.0.0.1:54322.");
  }
  db = new PrismaClient({ datasourceUrl: testDatabaseUrl });
  const first = provision();
  expect(first.status, first.stderr).toBe(0);
  const profile = await db.profile.findFirstOrThrow({ where: { email } });
  userId = profile.id;
  tenantId = profile.tenantId;
});

test.afterAll(async () => {
  if (!db) return;
  try {
    if (userId) {
      await db.loan.deleteMany({ where: { tenantId, borrowerId: userId } });
      await db.equipment.deleteMany({ where: { tenantId, id: { in: fixtureEquipmentIds } } });
      const admin = createClient(localSupabase, testSecret!, {
        auth: { persistSession: false, autoRefreshToken: false },
      }).auth.admin;
      const { error } = await admin.deleteUser(userId);
      if (error) throw error;
    }
  } finally {
    await db.$disconnect();
  }
});

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/catalogo$/, { timeout: 45_000 });
}

test("003-dados-iniciais CA-01 CA-02 CA-03 e 004-solicitar-emprestimo CA-01: colaborador entra e vê o catálogo com fotos", async ({ page, context }) => {
  const membership = await db.membership.findFirstOrThrow({ where: { tenantId, userId } });
  expect(membership.role).toBe("member");
  expect(await db.loan.count({ where: { tenantId, borrowerId: userId } })).toBe(0);
  await page.goto("/catalogo");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
  await expect(page.getByText("Informe sua senha.")).toBeVisible();
  await login(page);
  expect((await context.cookies()).some(({ name, httpOnly }) => name.startsWith("empresti-auth") && httpOnly)).toBe(true);
  expect(await page.evaluate(() => Object.keys(localStorage).some((key) => key.includes("empresti")))).toBe(false);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Catálogo" })).toBeVisible();
  const cards = page.getByRole("article");
  await expect(cards).toHaveCount(12);
  await expect(page.getByText("12 equipamentos · 10 disponíveis agora")).toBeVisible();
  await expect(page.getByRole("link", { name: "Pixabay" })).toHaveAttribute("href", "https://pixabay.com/");
  const inventory = [
    ["Notebook 14 polegadas", "Notebook"], ["Notebook 15 polegadas", "Notebook"],
    ["Notebook 13 polegadas", "Notebook"], ["Notebook 15 polegadas", "Notebook"],
    ["Monitor 24 polegadas", "Monitor"], ["Monitor 27 polegadas", "Monitor"], ["Monitor 22 polegadas", "Monitor"],
    ["Cabo HDMI 2 m", "Cabo"], ["Cabo USB-C 1 m", "Cabo"], ["Cabo de rede 3 m", "Cabo"],
    ["Webcam Full HD", "Câmera"], ["Câmera compacta", "Câmera"],
  ];
  const photos = JSON.parse(await readFile(photoManifest!, "utf8"));
  expect(photos).toHaveLength(12);
  expect(new Set(photos.map((photo: { pixabayId: number }) => photo.pixabayId)).size).toBe(12);
  for (let index = 0; index < 12; index += 1) {
    const card = cards.nth(index);
    const patrimony = `TI-${String(index + 1).padStart(4, "0")}`;
    const [name, category] = inventory[index];
    const status = index === 3 || index === 6 ? "Manutenção" : "Disponível";
    await expect(card.getByText(`Patrimônio: ${patrimony}`)).toBeVisible();
    await expect(card.getByText(name, { exact: true })).toBeVisible();
    await expect(card.getByText(`Categoria: ${category}`)).toBeVisible();
    await expect(card.getByText(status, { exact: true })).toBeVisible();
    await expect(card.getByText("Balcão de Suporte TI")).toBeVisible();
    const image = card.getByRole("img", { name });
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight])).toEqual([800, 600]);
    const photoUrl = new URL((await image.getAttribute("src"))!);
    expect(photoUrl.origin).toBe(localSupabase);
    const response = await fetch(photoUrl);
    expect(response.ok).toBe(true);
    const photo = photos.find((entry: { patrimonio: string }) => entry.patrimonio === patrimony);
    expect(photo.author).toBeTruthy();
    expect(new URL(photo.sourceUrl).origin).toBe("https://pixabay.com");
    expect(photo.licenseUrl).toBe("https://pixabay.com/service/license-summary/");
    expect(createHash("sha256").update(Buffer.from(await response.arrayBuffer())).digest("hex")).toBe(photo.sha256);
  }
  for (const patrimony of ["TI-0004", "TI-0007"]) {
    const card = cards.filter({ hasText: `Patrimônio: ${patrimony}` });
    await expect(card.getByText("Manutenção")).toBeVisible();
    await expect(card.getByRole("button", { name: "Indisponível" })).toBeDisabled();
  }
  await page.getByRole("button", { name: "Meus empréstimos" }).click();
  await expect(page.getByText("Você não tem empréstimos em aberto.")).toBeVisible();
});

test("003-dados-iniciais CA-04: repetir o provisionamento preserva a conta e o vínculo", async () => {
  const admin = createClient(localSupabase, testSecret!, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).auth.admin;
  const matchingAccounts = async () => {
    const perPage = 100;
    const ids: string[] = [];
    for (let page = 1; ; page += 1) {
      const { data, error } = await admin.listUsers({ page, perPage });
      if (error) throw error;
      ids.push(...data.users.filter((account) => account.email === email).map((account) => account.id));
      if (data.users.length < perPage) return ids;
    }
  };
  const membership = await db.membership.findFirstOrThrow({ where: { tenantId, userId } });
  expect(await matchingAccounts()).toEqual([userId]);

  const repeated = provision();
  expect(repeated.status, repeated.stderr).toBe(0);
  expect(await matchingAccounts()).toEqual([userId]);
  expect(await db.membership.findMany({ where: { tenantId, userId } })).toEqual([membership]);
  expect(await db.loan.count({ where: { tenantId, borrowerId: userId } })).toBe(0);
});

test("004-solicitar-emprestimo CA-02 CA-03 CA-04 CA-05 CA-08 CA-09: solicita, consulta e vê os motivos de recusa", async ({ page }) => {
  const identifiers: string[] = [];
  for (let index = 0; index < 6; index += 1) {
    const code = `E2E-${randomUUID()}`;
    const item = await db.equipment.create({
      data: { tenantId, name: `Equipamento de teste ${index + 1}`, category: "notebook",
        location: "Balcão de Suporte TI", patrimonyCode: code },
    });
    fixtureEquipmentIds.push(item.id);
    identifiers.push(code);
  }
  await login(page);
  const button = (index: number) => page.getByRole("button", { name: new RegExp(`Solicitar .* ${identifiers[index]}`) });
  for (let index = 0; index < 5; index += 1) {
    await button(index).click();
    const card = page.getByRole("article").filter({ hasText: identifiers[index] });
    await expect(card.getByText("Emprestado")).toBeVisible();
    await expect(card.getByRole("button", { name: "Indisponível" })).toBeDisabled();
  }
  const lastLoan = await db.loan.findFirstOrThrow({
    where: { tenantId, borrowerId: userId, equipmentId: fixtureEquipmentIds[4] },
  });
  const dueDate = calculateLoanDueDate(lastLoan.requestedAt);
  const formattedDate = dueDate.split("-").reverse().join("/");
  await expect(page.getByRole("status").filter({ hasText: "Empréstimo confirmado" })).toContainText(formattedDate);
  await button(5).click();
  await expect(page.getByRole("alert").filter({ hasText: "limite de cinco" })).toBeVisible();
  await page.getByRole("button", { name: "Meus empréstimos" }).click();
  await expect(page.getByRole("heading", { name: "Meus empréstimos" })).toBeVisible();
  await expect(page.locator("time")).toHaveCount(5);
  await expect(page.locator(`time[datetime="${dueDate}"]`).first()).toHaveText(formattedDate);
  const open = await db.loan.findMany({ where: { tenantId, borrowerId: userId, returnedAt: null } });
  await db.loan.update({ where: { id: open[0].id }, data: { returnedAt: new Date() } });
  await db.loan.update({ where: { id: open[1].id }, data: { dueAt: new Date(Date.now() - 2 * 86_400_000) } });
  await page.getByRole("button", { name: "Catálogo", exact: true }).click();
  await button(5).click();
  await expect(page.getByRole("alert").filter({ hasText: "empréstimo em atraso" })).toBeVisible();
});
