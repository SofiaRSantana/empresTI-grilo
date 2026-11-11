import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { preparePhoto, validateImage, validateSelection } from "./fotos.mjs";

const sharp = createRequire(new URL("../../../frontend/package.json", import.meta.url))("sharp");
const hit = {
  type: "photo",
  id: 42,
  user: "autora-de-teste",
  pageURL: "https://pixabay.com/photos/equipment-42/",
};
const syntheticPhoto = () => sharp({
  create: { width: 1200, height: 450, channels: 3, background: "blue" },
}).jpeg().toBuffer();

test("003-dados-iniciais CA-02: gera JPEG de 800 × 600 com autoria, origem e licença", async () => {
  const { output, entry } = await preparePhoto("TI-0001", hit, await syntheticPhoto());
  const { width, height, format } = await sharp(output).metadata();
  assert.deepEqual([width, height, format], [800, 600, "jpeg"]);
  assert.equal(entry.author, hit.user);
  assert.equal(entry.sourceUrl, hit.pageURL);
  assert.equal(entry.licenseUrl, "https://pixabay.com/service/license-summary/");
  assert.equal(entry.pixabayId, 42);
  assert.equal(entry.filename, "TI-0001.jpg");
  assert.match(entry.sha256, /^[a-f0-9]{64}$/);
});

test("003-dados-iniciais CA-05: rejeita IDs repetidos no lote", () => {
  const selection = Object.fromEntries(Array.from({ length: 12 }, (_, index) => [
    `TI-${String(index + 1).padStart(4, "0")}`, index + 1,
  ]));
  assert.doesNotThrow(() => validateSelection(selection));
  assert.throws(() => validateSelection({ ...selection, "TI-0012": 1 }), /distinto/);
});

test("003-dados-iniciais CA-05: rejeita dimensão incorreta e proveniência incompleta", async () => {
  const input = await syntheticPhoto();
  await assert.rejects(validateImage(input), /800/);
  await assert.rejects(preparePhoto("TI-0001", { ...hit, user: "" }, input), /autor/);
  await assert.rejects(preparePhoto("TI-0001", { ...hit, pageURL: "https://example.com/42" }, input), /origem/);
});
