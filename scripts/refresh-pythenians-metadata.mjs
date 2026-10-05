import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const METADATA_BASE_URL = "https://ipfs.pythenians.xyz/metadata";

const args = parseArgs(process.argv.slice(2));
const dataFile = args.data || "data/pythenians.json";
const outDir = path.dirname(dataFile);
const concurrency = Math.max(1, Number(args.concurrency || 8));
const imageSize = Number(args.imageSize || process.env.PYTHENIANS_IMAGE_SIZE || 560);
const imageQuality = Number(args.imageQuality || process.env.PYTHENIANS_IMAGE_QUALITY || 82);

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const records = await readJson(dataFile);
  const numbers = Object.keys(records)
    .map(Number)
    .filter(Number.isInteger)
    .sort((a, b) => a - b);
  let changed = 0;
  let failed = 0;

  console.log(`Refreshing metadata for ${numbers.length} Pythenians`);

  await runPool(numbers, concurrency, async (number, index) => {
    const key = String(number);
    const record = records[key];

    try {
      const metadata = await fetchOfficialMetadata(number);
      assertOfficialMetadata(number, metadata);
      const level = extractLevel(metadata);
      const imageChanged = record.image !== metadata.image;
      const levelChanged = record.level !== level;

      record.image = metadata.image;
      record.level = level;

      if (imageChanged || !record.localImage) {
        record.localImage = await mirrorImage(number, metadata.image);
      }

      if (imageChanged || levelChanged) {
        changed += 1;
        console.log(`#${number}: level ${level}${imageChanged ? " image refreshed" : ""}`);
      } else if ((index + 1) % 250 === 0) {
        console.log(`Checked ${index + 1}/${numbers.length}`);
      }
    } catch (error) {
      failed += 1;
      record.level = normalizeLevel(record.level);
      console.warn(`#${number}: ${String(error?.message || error).slice(0, 180)}`);
    }
  });

  await writeJson(dataFile, sortObjectByNumericKeys(records));
  console.log(`Done. Changed: ${changed}; failed: ${failed}`);
}

async function fetchOfficialMetadata(number) {
  const response = await fetch(`${METADATA_BASE_URL}/${number}.json`);

  if (!response.ok) {
    throw new Error(`metadata returned ${response.status}`);
  }

  return response.json();
}

async function mirrorImage(number, imageUrl) {
  const relativePath = `pythenians-images/${number}.webp`;
  const outputPath = path.join(outDir, relativePath);
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`image returned ${response.status}`);
  }

  const sourceBuffer = Buffer.from(await response.arrayBuffer());
  const optimizedImage = await sharp(sourceBuffer)
    .resize(imageSize, imageSize, {
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality: imageQuality })
    .toBuffer();

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, optimizedImage);

  return relativePath;
}

function assertOfficialMetadata(number, metadata) {
  if (metadata.name !== `Pythenians #${number}`) {
    throw new Error(`metadata name mismatch: ${metadata.name}`);
  }

  if (!metadata.image?.startsWith("https://ipfs.pythenians.xyz/nft/")) {
    throw new Error(`unexpected image URL: ${metadata.image}`);
  }
}

function extractLevel(metadata) {
  const levelTrait = metadata.attributes?.find((attribute) => {
    return String(attribute.trait_type).toLowerCase() === "level";
  });

  return normalizeLevel(levelTrait?.value);
}

function normalizeLevel(value) {
  const level = Number(value);
  return [1, 2, 3].includes(level) ? level : 1;
}

function parseArgs(rawArgs) {
  return rawArgs.reduce((parsed, arg) => {
    const [key, ...valueParts] = arg.replace(/^--/, "").split("=");
    parsed[key] = valueParts.length ? valueParts.join("=") : true;
    return parsed;
  }, {});
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function writeJson(file, value) {
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function sortObjectByNumericKeys(value) {
  return Object.fromEntries(
    Object.entries(value).sort(([a], [b]) => Number(a) - Number(b))
  );
}

async function runPool(items, limit, worker) {
  let cursor = 0;

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        await worker(items[index], index);
      }
    })
  );
}
