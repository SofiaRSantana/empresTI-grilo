import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { createOperationsClient } from "./operation-config.mjs";
import { catalogTenantSlug as tenantSlug, catalogTenantName as tenantName, equipmentPhotoBucket as bucketName } from "../src/shared/catalog-settings.mjs";

const location = "Balcão de Suporte TI";
const equipment = [
  ["TI-0001", "Notebook 14 polegadas", "notebook", "available"],
  ["TI-0002", "Notebook 15 polegadas", "notebook", "available"],
  ["TI-0003", "Notebook 13 polegadas", "notebook", "available"],
  ["TI-0004", "Notebook 15 polegadas", "notebook", "maintenance"],
  ["TI-0005", "Monitor 24 polegadas", "monitor", "available"],
  ["TI-0006", "Monitor 27 polegadas", "monitor", "available"],
  ["TI-0007", "Monitor 22 polegadas", "monitor", "maintenance"],
  ["TI-0008", "Cabo HDMI 2 m", "cable", "available"],
  ["TI-0009", "Cabo USB-C 1 m", "cable", "available"],
  ["TI-0010", "Cabo de rede 3 m", "cable", "available"],
  ["TI-0011", "Webcam Full HD", "camera", "available"],
  ["TI-0012", "Câmera compacta", "camera", "available"],
];

const sha256 = (data) => createHash("sha256").update(data).digest("hex");

async function readInventory(manifestPath, organizationSlug) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (!Array.isArray(manifest) || manifest.length !== equipment.length ||
      new Set(manifest.map((entry) => entry.patrimonio)).size !== equipment.length ||
      new Set(manifest.map((entry) => entry.pixabayId)).size !== equipment.length ||
      new Set(manifest.map((entry) => entry.sha256)).size !== equipment.length) {
    throw new Error("O manifesto precisa ter uma foto distinta por patrimônio.");
  }
  const entries = new Map(manifest.map((entry) => [entry.patrimonio, entry]));
  return Promise.all(equipment.map(async ([patrimonyCode, name, category, status]) => {
    const entry = entries.get(patrimonyCode);
    const filename = `${patrimonyCode}.jpg`;
    if (entry?.filename !== filename || !Number.isSafeInteger(entry.pixabayId) ||
        entry.pixabayId < 1 || !entry.author?.trim() ||
        (entry.versioned !== undefined && typeof entry.versioned !== "boolean") ||
        new URL(entry.sourceUrl).origin !== "https://pixabay.com" ||
        entry.licenseUrl !== "https://pixabay.com/service/license-summary/") {
      throw new Error(`Proveniência inválida para ${patrimonyCode}.`);
    }
    const photo = await readFile(join(dirname(manifestPath), filename));
    const { format, width, height } = await sharp(photo).metadata();
    if (format !== "jpeg" || width !== 800 || height !== 600 || sha256(photo) !== entry.sha256) {
      throw new Error(`Arquivo ou dimensões divergentes para ${patrimonyCode}.`);
    }
    const storageFilename = entry.versioned ? `${patrimonyCode}-${entry.sha256.slice(0, 16)}.jpg` : filename;
    return { patrimonyCode, name, category, status, imagePath: `${organizationSlug}/${storageFilename}`, photo, hash: entry.sha256 };
  }));
}

async function ensureBucket(storage) {
  const { data: buckets, error } = await storage.listBuckets();
  if (error) throw error;
  const existing = buckets.find((bucket) => bucket.id === bucketName);
  if (existing) {
    if (!existing.public) throw new Error(`O bucket ${bucketName} precisa ser público.`);
    return storage.from(bucketName);
  }
  const created = await storage.createBucket(bucketName, {
    public: true,
    allowedMimeTypes: ["image/jpeg"],
  });
  if (created.error) {
    const { data: bucket } = await storage.getBucket(bucketName);
    if (!bucket?.public) throw created.error;
  }
  return storage.from(bucketName);
}

async function ensurePhoto(bucket, item) {
  const { data: { publicUrl } } = bucket.getPublicUrl(item.imagePath);
  const readPublic = () => fetch(publicUrl, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  const existing = await readPublic();
  if (existing.ok) {
    if (sha256(Buffer.from(await existing.arrayBuffer())) !== item.hash) {
      throw new Error(`Já existe uma foto diferente para ${item.patrimonyCode}.`);
    }
    return;
  }
  if (existing.status !== 404 && existing.status !== 400) {
    throw new Error(`Consulta pública da foto retornou HTTP ${existing.status}.`);
  }
  const uploaded = await bucket.upload(item.imagePath, item.photo, { contentType: "image/jpeg" });
  const published = await readPublic();
  if (!published.ok || sha256(Buffer.from(await published.arrayBuffer())) !== item.hash) {
    throw uploaded.error ?? new Error(`Falha ao verificar a foto pública de ${item.patrimonyCode}.`);
  }
}

export async function syncEquipmentInventory(
  db,
  storage,
  manifestPath,
  organization = { slug: tenantSlug, name: tenantName },
) {
  const inventory = await readInventory(manifestPath, organization.slug);
  const bucket = await ensureBucket(storage);
  for (const item of inventory) await ensurePhoto(bucket, item);
  await db.$transaction(async (tx) => {
    const tenant = await tx.tenant.upsert({
      where: { slug: organization.slug },
      create: organization,
      update: {},
    });
    for (const { patrimonyCode, name, category, status, imagePath } of inventory) {
      const update = { name, category, location, imagePath };
      await tx.equipment.upsert({
        where: { tenantId_patrimonyCode: { tenantId: tenant.id, patrimonyCode } },
        create: { tenantId: tenant.id, patrimonyCode, status, ...update },
        update,
      });
    }
  }, { timeout: 15000 });
  return inventory.length;
}

async function main() {
  const [manifestPath, projectFlag, ...extra] = process.argv.slice(2);
  if (!manifestPath || extra.length || (projectFlag && !projectFlag.startsWith("--project="))) {
    throw new Error("Uso: node scripts/seed-equipment.mjs <manifesto.json> [--project=<referência>]");
  }
  const { storage } = createOperationsClient(projectFlag);
  const db = new PrismaClient();
  try {
    const count = await syncEquipmentInventory(db, storage, manifestPath);
    console.log(`${count} equipamentos e fotos verificados para ${tenantName}.`);
  } finally {
    await db.$disconnect();
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
