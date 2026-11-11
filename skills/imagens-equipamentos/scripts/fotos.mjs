import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(new URL("../../../frontend/package.json", import.meta.url));
const sharp = require("sharp");
const pixabayApi = "https://pixabay.com/api/";
const licenseUrl = "https://pixabay.com/service/license-summary/";
const downloadHosts = ["pixabay.com", "cdn.pixabay.com"];
const cacheDuration = 24 * 60 * 60 * 1000;
const patrimonios = Array.from({ length: 12 }, (_, index) =>
  `TI-${String(index + 1).padStart(4, "0")}`,
);

const digest = (value) => createHash("sha256").update(value).digest("hex");

function pixabayUrl(value, allowedHosts) {
  if (typeof value !== "string") throw new Error("URL do Pixabay ausente.");
  const url = new URL(value);
  if (url.protocol !== "https:" || !allowedHosts.includes(url.hostname) ||
      url.port || url.username || url.password) {
    throw new Error("URL fora da origem aprovada do Pixabay.");
  }
  return url;
}

function describePhoto(hit) {
  if (hit?.type !== "photo" || !Number.isSafeInteger(hit.id) || hit.id < 1 ||
      typeof hit.user !== "string" || !hit.user.trim()) {
    throw new Error("A foto precisa de ID e autor válidos no Pixabay.");
  }
  const source = pixabayUrl(hit.pageURL, ["pixabay.com", "www.pixabay.com"]);
  return { pixabayId: hit.id, author: hit.user.trim(), sourceUrl: source.href, licenseUrl };
}

async function fetchPixabay(url, redirect = "error") {
  try {
    return await fetch(url, { redirect, signal: AbortSignal.timeout(20_000) });
  } catch {
    throw new Error("A conexão com o Pixabay falhou.");
  }
}

async function downloadPhoto(value) {
  let url = pixabayUrl(value, downloadHosts);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetchPixabay(url, "manual");
    if (response.ok) return Buffer.from(await response.arrayBuffer());
    const location = response.headers.get("location");
    if (response.status < 300 || response.status >= 400 || !location) {
      throw new Error(`Download da foto retornou HTTP ${response.status}.`);
    }
    url = pixabayUrl(new URL(location, url).href, downloadHosts);
  }
  throw new Error("O download excedeu o limite de redirecionamentos.");
}

async function lookup(workspace, params) {
  const query = new URLSearchParams(params);
  const cacheDir = join(workspace, "cache-pixabay");
  const cachePath = join(cacheDir, `${digest(query.toString())}.json`);
  try {
    const cached = JSON.parse(await readFile(cachePath, "utf8"));
    if (Date.now() - cached.savedAt < cacheDuration && Array.isArray(cached.hits)) {
      return cached.hits;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const key = process.env.PIXABAY_API_KEY?.trim();
  if (!key) throw new Error("Defina PIXABAY_API_KEY na configuração local.");
  query.set("key", key);
  const response = await fetchPixabay(new URL(`?${query}`, pixabayApi));
  if (!response.ok) throw new Error(`Consulta Pixabay retornou HTTP ${response.status}.`);
  const { hits } = await response.json();
  if (!Array.isArray(hits)) throw new Error("Resposta inválida da API do Pixabay.");
  await mkdir(cacheDir, { recursive: true });
  await writeFile(cachePath, JSON.stringify({ savedAt: Date.now(), hits }));
  return hits;
}

export function validateSelection(selection) {
  if (!selection || typeof selection !== "object" || Array.isArray(selection) ||
      Object.keys(selection).length !== patrimonios.length ||
      !patrimonios.every((patrimonio) => Number.isSafeInteger(selection[patrimonio]) &&
        selection[patrimonio] > 0)) {
    throw new Error("Informe um ID Pixabay válido para cada patrimônio de TI-0001 a TI-0012.");
  }
  if (new Set(Object.values(selection)).size !== patrimonios.length) {
    throw new Error("Cada patrimônio precisa de um ID Pixabay distinto.");
  }
}

export async function validateImage(data) {
  const { width, height, format } = await sharp(data).metadata();
  if (width !== 800 || height !== 600 || format !== "jpeg") {
    throw new Error("O arquivo precisa ser JPEG de 800 × 600 pixels.");
  }
}

export async function preparePhoto(patrimonio, hit, data) {
  const source = describePhoto(hit);
  const output = await sharp(data).autoOrient()
    .resize(800, 600, { fit: "contain", background: "#ffffff" })
    .jpeg({ quality: 88 })
    .toBuffer();
  await validateImage(output);
  return {
    output,
    entry: { patrimonio, ...source, filename: `${patrimonio}.jpg`, sha256: digest(output) },
  };
}

async function prepareBatch(workspace, selectionPath) {
  const selection = JSON.parse(await readFile(selectionPath, "utf8"));
  validateSelection(selection);
  const batch = [];
  const imageHashes = new Set();
  for (const patrimonio of patrimonios) {
    const id = selection[patrimonio];
    const hits = await lookup(workspace, { id: String(id), image_type: "photo" });
    const hit = hits.find((item) => item.id === id);
    describePhoto(hit);
    const prepared = await preparePhoto(patrimonio, hit, await downloadPhoto(hit.largeImageURL));
    if (imageHashes.has(prepared.entry.sha256)) {
      throw new Error(`${patrimonio}: arquivo duplicado no lote.`);
    }
    imageHashes.add(prepared.entry.sha256);
    batch.push(prepared);
  }

  const outputDir = join(workspace, "lote");
  await mkdir(outputDir, { recursive: true });
  for (const { entry, output } of batch) {
    await writeFile(join(outputDir, entry.filename), output);
  }
  await writeFile(join(outputDir, "manifesto.json"),
    JSON.stringify(batch.map(({ entry }) => entry), null, 2) + "\n");
  console.log(`${batch.length} fotos preparadas em ${outputDir}.`);
}

async function main([action, workspacePath, argument, ...extra]) {
  if (!["buscar", "preparar"].includes(action) || !workspacePath || !argument || extra.length) {
    throw new Error("Uso: fotos.mjs <buscar|preparar> <pasta-de-trabalho> <busca|selecao.json>.");
  }
  const workspace = resolve(workspacePath);
  if (action === "preparar") {
    await prepareBatch(workspace, argument);
    return;
  }
  const hits = await lookup(workspace, {
    q: argument, image_type: "photo", safesearch: "true", per_page: "8",
    min_width: "800", min_height: "600",
  });
  console.log(JSON.stringify(hits.map(describePhoto), null, 2));
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
