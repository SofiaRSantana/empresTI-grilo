import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { syncEquipmentInventory } from "../../../scripts/seed-equipment.mjs";
import { equipmentPhotoBucket } from "@/src/shared/catalog-settings.mjs";

const databaseUrl = process.env.EMPRESTI_TEST_DATABASE_URL;
const localSecret = process.env.EMPRESTI_TEST_SUPABASE_SECRET_KEY;
const manifest = process.env.EMPRESTI_TEST_PHOTO_MANIFEST;

describe.skipIf(!databaseUrl || !localSecret || !manifest)("003-dados-iniciais com Supabase local", () => {
  it("CA-04 repetir a carga mantém os IDs, os objetos e a situação operacional", async () => {
    const url = new URL(databaseUrl!);
    if (url.protocol !== "postgresql:" || url.hostname !== "127.0.0.1" || url.port !== "54322") {
      throw new Error("Use somente o PostgreSQL descartável em 127.0.0.1:54322.");
    }
    const db = new PrismaClient({ datasourceUrl: databaseUrl });
    const { storage } = createClient("http://127.0.0.1:54321", localSecret!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const bucket = storage.from(equipmentPhotoBucket);
    const organization = { slug: `fixture-inventory-${randomUUID()}`, name: "Inventário de teste" };
    const paths = Array.from({ length: 12 }, (_, index) =>
      `${organization.slug}/TI-${String(index + 1).padStart(4, "0")}.jpg`);
    try {
      await syncEquipmentInventory(db, storage, manifest!, organization);
      const tenant = await db.tenant.findUniqueOrThrow({ where: { slug: organization.slug } });
      const catalog = () => db.equipment.findMany({ where: { tenantId: tenant.id }, orderBy: { patrimonyCode: "asc" } });
      const first = await catalog();
      expect(first).toHaveLength(12);
      expect(first.map((item) => item.imagePath)).toEqual(paths);
      await db.equipment.update({ where: { id: first[0].id }, data: { status: "borrowed" } });
      await syncEquipmentInventory(db, storage, manifest!, organization);
      const repeated = await catalog();
      expect(repeated.map(({ id }) => id)).toEqual(first.map(({ id }) => id));
      expect(repeated.map(({ imagePath }) => imagePath)).toEqual(paths);
      expect(repeated[0].status).toBe("borrowed");
      const { data: objects, error } = await bucket.list(organization.slug);
      expect(error).toBeNull();
      expect(objects?.map(({ name }) => name).sort()).toEqual(paths.map((path) => path.split("/")[1]));
      expect(await db.loan.count({ where: { tenantId: tenant.id } })).toBe(0);
    } finally {
      await db.tenant.deleteMany({ where: { slug: organization.slug } });
      await bucket.remove(paths);
      await db.$disconnect();
    }
  });
});
