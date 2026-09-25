import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import bs58 from "bs58";
import sharp from "sharp";
import { Connection, PublicKey } from "@solana/web3.js";

const DEFAULT_RPC_URL = "https://api.mainnet-beta.solana.com";
const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const PYTHENIANS_UPDATE_AUTHORITY = "PyTHY3DyjVQe9EQVU7jYriVKd7dJ6xiyyyPvVWxpiMN";
const PYTHENIANS_COLLECTION_MINT = "pyTh2UtBKfuDW6KCdT3swospYeoLmmKaGujWA91Moru";
const METADATA_BASE_URL = "https://ipfs.pythenians.xyz/metadata";
const COLLECTION_SIZE = 4668;
const DAY_MS = 24 * 60 * 60 * 1000;

const args = parseArgs(process.argv.slice(2));
const rpcUrl = process.env.SOLANA_RPC_URL || DEFAULT_RPC_URL;
const outFile = args.out || "data/pythenians.json";
const outDir = path.dirname(outFile);
const stateFile = args.state || ".cache/pythenians-state.json";
const throttleMs = Number(args.throttleMs || process.env.RPC_THROTTLE_MS || 250);
const historyPageLimit = Number(args.historyPageLimit || process.env.HISTORY_PAGE_LIMIT || 12);
const transactionBatchSize = Number(args.transactionBatchSize || process.env.TRANSACTION_BATCH_SIZE || 100);
const transferFallback = args.transferFallback === true || process.env.TRANSFER_FALLBACK === "true";
const imageSize = Number(args.imageSize || process.env.PYTHENIANS_IMAGE_SIZE || 560);
const imageQuality = Number(args.imageQuality || process.env.PYTHENIANS_IMAGE_QUALITY || 82);
const requestedNumbers = parseNumbers(args.numbers, args.limit);

const connection = new Connection(rpcUrl, "confirmed");

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  console.log(`Using RPC: ${redactRpcUrl(rpcUrl)}`);

  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(path.dirname(stateFile), { recursive: true });

  const previousPublic = await readJsonIfExists(outFile, {});
  const previousState = await readJsonIfExists(stateFile, {});
  const mintMap = await discoverMintMap();
  const numbers =
    requestedNumbers ||
    Object.keys(mintMap)
      .map(Number)
      .sort((a, b) => a - b);

  console.log(`Building ${numbers.length} Pythenians into ${outFile}`);

  const records = {};
  const state = {};
  const asOf = new Date();

  for (const number of numbers) {
    const key = String(number);
    console.log(`\n#${number}`);

    const previousRecord = previousPublic[key];
    const previousPrivate = previousState[key];
    let officialMetadata = null;
    let localImage = null;
    let mint = mintMap[key]?.mint || previousRecord?.mint || null;

    try {
      officialMetadata = await fetchOfficialMetadata(number);
      assertOfficialMetadata(number, officialMetadata);
      localImage = await mirrorImage(number, officialMetadata.image);

      if (!mint) {
        throw new Error(`Missing mint for Pythenians #${number}`);
      }

      await sleep(throttleMs);
      const currentTokenAccount = await getCurrentTokenAccount(mint);
      await sleep(throttleMs);
      const currentOwner = await getTokenAccountOwner(currentTokenAccount);

      let heldSince = null;
      let heldSinceSource = "marketplace_sale";
      let verification = "verified";

      if (
        previousRecord?.heldSince &&
        previousPrivate?.owner === currentOwner &&
        previousPrivate?.tokenAccount === currentTokenAccount
      ) {
        heldSince = previousRecord.heldSince;
        console.log(`  heldSince unchanged: ${heldSince}`);
      } else {
        const sale = await findLatestMarketplaceSale(mint);

        if (sale?.buyer === currentOwner) {
          heldSince = new Date(sale.blockTime * 1000).toISOString();
          console.log(`  heldSince from latest verified sale: ${heldSince}`);
        } else if (transferFallback) {
          heldSinceSource = "token_transfer_history";
          heldSince = await findHeldSince({
            mint,
            tokenAccount: currentTokenAccount,
            owner: currentOwner,
            pageLimit: historyPageLimit
          });
          console.log(`  heldSince from transfer history: ${heldSince || "not found"}`);
        } else {
          verification = "needs_transfer_history";
          heldSinceSource = "unresolved";
          console.log("  latest sale buyer does not match current owner; transfer fallback disabled");
        }
      }

      if (!heldSince) {
        verification = "unresolved";
        heldSinceSource = "unresolved";

        records[key] = {
          number,
          mint,
          image: officialMetadata.image,
          localImage,
          heldSince: null,
          daysHeldAtBuild: null,
          heldSinceSource,
          verification,
          updatedAt: asOf.toISOString()
        };

        state[key] = {
          owner: currentOwner,
          tokenAccount: currentTokenAccount,
          checkedAt: asOf.toISOString()
        };

        continue;
      }

      records[key] = {
        number,
        mint,
        image: officialMetadata.image,
        localImage,
        heldSince,
        daysHeldAtBuild: daysBetween(new Date(heldSince), asOf),
        heldSinceSource,
        verification,
        updatedAt: asOf.toISOString()
      };

      state[key] = {
        owner: currentOwner,
        tokenAccount: currentTokenAccount,
        checkedAt: asOf.toISOString()
      };
    } catch (error) {
      console.warn(`  unresolved: ${String(error?.message || error).slice(0, 220)}`);

      if (previousRecord?.heldSince) {
        records[key] = {
          ...previousRecord,
          updatedAt: asOf.toISOString(),
          carriedForward: true
        };
        if (previousPrivate) {
          state[key] = {
            ...previousPrivate,
            checkedAt: asOf.toISOString()
          };
        }
        console.warn("  carried forward previous verified record");
        continue;
      }

      records[key] = {
        number,
        mint,
        image: officialMetadata?.image || previousRecord?.image || null,
        localImage: localImage || previousRecord?.localImage || null,
        heldSince: null,
        daysHeldAtBuild: null,
        heldSinceSource: "unresolved",
        verification: "unresolved",
        error: String(error?.message || error).slice(0, 220),
        updatedAt: asOf.toISOString()
      };
    }
  }

  await writeJson(outFile, sortObjectByNumericKeys(records));
  await writeJson(stateFile, sortObjectByNumericKeys(state));
  const values = Object.values(records);
  const verifiedCount = values.filter((record) => record.verification === "verified").length;
  const unresolvedCount = values.length - verifiedCount;
  console.log(`\nWrote ${Object.keys(records).length} public records to ${outFile}`);
  console.log(`Verified: ${verifiedCount}; unresolved: ${unresolvedCount}`);
  console.log(`Wrote private action cache to ${stateFile}`);
}

function parseArgs(rawArgs) {
  return rawArgs.reduce((parsed, arg) => {
    const [key, ...valueParts] = arg.replace(/^--/, "").split("=");
    parsed[key] = valueParts.length ? valueParts.join("=") : true;
    return parsed;
  }, {});
}

function parseNumbers(numbersArg, limitArg) {
  if (numbersArg) {
    return String(numbersArg)
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= COLLECTION_SIZE);
  }

  if (limitArg) {
    const limit = Math.min(Number(limitArg), COLLECTION_SIZE);
    return Array.from({ length: limit }, (_, index) => index + 1);
  }

  return null;
}

async function discoverMintMap() {
  console.log("Discovering Pythenians mint map from Metaplex metadata accounts...");

  const accounts = await withRetry(() =>
    connection.getProgramAccounts(METADATA_PROGRAM_ID, {
      filters: [
        {
          memcmp: {
            offset: 1,
            bytes: PYTHENIANS_UPDATE_AUTHORITY
          }
        }
      ]
    })
  );

  const map = {};

  for (const account of accounts) {
    const metadata = parseMetaplexMetadata(account.account.data);
    const number = parsePythenianNumber(metadata.name);
    const isOfficialCollection =
      metadata.collection?.key === PYTHENIANS_COLLECTION_MINT && metadata.collection.verified;
    const isOfficialUri = metadata.uri.startsWith(`${METADATA_BASE_URL}/`);

    if (!number || (!isOfficialCollection && !isOfficialUri)) {
      continue;
    }

    map[String(number)] = {
      mint: metadata.mint,
      metadataAccount: account.pubkey.toBase58(),
      uri: metadata.uri
    };
  }

  console.log(`  discovered ${Object.keys(map).length} collection mints`);

  if (Object.keys(map).length < 3000) {
    throw new Error("Mint discovery returned too few accounts. Use a real SOLANA_RPC_URL.");
  }

  return map;
}

function parseMetaplexMetadata(data) {
  let offset = 0;
  const key = data.readUInt8(offset);
  offset += 1;

  const updateAuthority = readPublicKey(data, offset);
  offset += 32;

  const mint = readPublicKey(data, offset);
  offset += 32;

  const name = readRustString(data, offset);
  offset = name.nextOffset;

  const symbol = readRustString(data, offset);
  offset = symbol.nextOffset;

  const uri = readRustString(data, offset);
  offset = uri.nextOffset;

  const sellerFeeBasisPoints = data.readUInt16LE(offset);
  offset += 2;

  const hasCreators = data.readUInt8(offset);
  offset += 1;

  if (hasCreators) {
    const creatorCount = data.readUInt32LE(offset);
    offset += 4 + creatorCount * 34;
  }

  offset += 1; // primarySaleHappened
  offset += 1; // isMutable

  if (offset >= data.length) {
    return { key, updateAuthority, mint, name: name.value, symbol: symbol.value, uri: uri.value, sellerFeeBasisPoints };
  }

  const editionNonceOption = data.readUInt8(offset);
  offset += 1;
  if (editionNonceOption) offset += 1;

  if (offset < data.length) {
    const tokenStandardOption = data.readUInt8(offset);
    offset += 1;
    if (tokenStandardOption) offset += 1;
  }

  let collection = null;
  if (offset < data.length) {
    const collectionOption = data.readUInt8(offset);
    offset += 1;
    if (collectionOption && offset + 33 <= data.length) {
      collection = {
        verified: Boolean(data.readUInt8(offset)),
        key: readPublicKey(data, offset + 1)
      };
      offset += 33;
    }
  }

  return {
    key,
    updateAuthority,
    mint,
    name: name.value,
    symbol: symbol.value,
    uri: uri.value,
    sellerFeeBasisPoints,
    collection
  };
}

function readRustString(data, offset) {
  const length = data.readUInt32LE(offset);
  const start = offset + 4;
  const end = start + length;
  return {
    value: data.slice(start, end).toString("utf8").replace(/\0/g, "").trim(),
    nextOffset: end
  };
}

function readPublicKey(data, offset) {
  return bs58.encode(data.slice(offset, offset + 32));
}

function parsePythenianNumber(name) {
  const match = /^Pythenians #(\d+)$/.exec(name);
  return match ? Number(match[1]) : null;
}

async function fetchOfficialMetadata(number) {
  const url = `${METADATA_BASE_URL}/${number}.json`;
  const response = await withRetry(() => fetch(url));

  if (!response.ok) {
    throw new Error(`Metadata ${url} returned ${response.status}`);
  }

  return response.json();
}

async function mirrorImage(number, imageUrl) {
  const relativePath = `pythenians-images/${number}.webp`;
  const outputPath = path.join(outDir, relativePath);

  try {
    await fs.access(outputPath);
    return relativePath;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const response = await withRetry(() => fetch(imageUrl));
  if (!response.ok) {
    throw new Error(`Image ${imageUrl} returned ${response.status}`);
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
    throw new Error(`Metadata name mismatch for #${number}: ${metadata.name}`);
  }

  if (!metadata.image?.startsWith("https://ipfs.pythenians.xyz/nft/")) {
    throw new Error(`Unexpected image URL for #${number}: ${metadata.image}`);
  }
}

async function getCurrentTokenAccount(mint) {
  const result = await withRetry(() => connection.getTokenLargestAccounts(new PublicKey(mint)));
  const current = result.value.find((account) => account.amount === "1");

  if (!current) {
    throw new Error(`No token account with amount=1 for mint ${mint}`);
  }

  return current.address.toBase58();
}

async function getTokenAccountOwner(tokenAccount) {
  const accountInfo = await withRetry(() => connection.getParsedAccountInfo(new PublicKey(tokenAccount)));
  const parsed = accountInfo.value?.data?.parsed;
  const owner = parsed?.info?.owner;

  if (!owner) {
    throw new Error(`Could not read owner for token account ${tokenAccount}`);
  }

  return owner;
}

async function findLatestMarketplaceSale(mint) {
  for (let offset = 0; offset <= 500; offset += 100) {
    const url = `https://api-mainnet.magiceden.dev/v2/tokens/${mint}/activities?offset=${offset}&limit=100`;
    const response = await withRetry(() => fetch(url));
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Magic Eden activities returned ${response.status}: ${text.slice(0, 160)}`);
    }

    if (text.startsWith("You have exceeded")) {
      throw new Error(`Magic Eden rate limit: ${text.slice(0, 160)}`);
    }

    const activities = JSON.parse(text);
    const sale = activities.find((activity) => {
      return (
        activity.tokenMint === mint &&
        activity.buyer &&
        activity.blockTime &&
        !["list", "delist", "bid", "poolUpdate"].includes(activity.type)
      );
    });

    if (sale) {
      return {
        type: sale.type,
        source: sale.source,
        signature: sale.signature,
        buyer: sale.buyer,
        seller: sale.seller,
        blockTime: sale.blockTime
      };
    }

    if (activities.length < 100) {
      break;
    }

    await sleep(1000);
  }

  return null;
}

async function findHeldSince({ mint, tokenAccount, owner, pageLimit }) {
  let before;

  for (let page = 0; page < pageLimit; page += 1) {
    await sleep(throttleMs);
    const signatures = await withRetry(() =>
      connection.getSignaturesForAddress(new PublicKey(tokenAccount), {
        before,
        limit: 1000
      })
    );

    if (!signatures.length) {
      break;
    }

    const successfulSignatures = signatures.filter((signatureInfo) => !signatureInfo.err);

    for (let index = 0; index < successfulSignatures.length; index += transactionBatchSize) {
      const batch = successfulSignatures.slice(index, index + transactionBatchSize);

      await sleep(throttleMs);
      const transactions = await withRetry(() =>
        connection.getParsedTransactions(
          batch.map((signatureInfo) => signatureInfo.signature),
          {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0
          }
        )
      );

      for (let batchIndex = 0; batchIndex < transactions.length; batchIndex += 1) {
        const transaction = transactions[batchIndex];
        const signatureInfo = batch[batchIndex];

        if (!transaction?.meta) continue;

        if (isAcquisitionTransaction(transaction, { mint, tokenAccount, owner })) {
          const blockTime = transaction.blockTime || signatureInfo.blockTime;
          if (!blockTime) {
            throw new Error(`Acquisition transaction has no blockTime: ${signatureInfo.signature}`);
          }
          return new Date(blockTime * 1000).toISOString();
        }
      }
    }

    before = signatures.at(-1).signature;
  }

  return null;
}

function isAcquisitionTransaction(transaction, { mint, tokenAccount, owner }) {
  const accountKeys = transaction.transaction.message.accountKeys.map((key) => key.pubkey.toBase58());
  const tokenAccountIndex = accountKeys.indexOf(tokenAccount);

  if (tokenAccountIndex === -1) {
    return false;
  }

  const pre = findTokenBalance(transaction.meta.preTokenBalances || [], {
    accountIndex: tokenAccountIndex,
    mint,
    owner
  });
  const post = findTokenBalance(transaction.meta.postTokenBalances || [], {
    accountIndex: tokenAccountIndex,
    mint,
    owner
  });

  const preAmount = BigInt(pre?.uiTokenAmount?.amount || "0");
  const postAmount = BigInt(post?.uiTokenAmount?.amount || "0");

  return preAmount === 0n && postAmount === 1n;
}

function findTokenBalance(balances, { accountIndex, mint, owner }) {
  return balances.find(
    (balance) =>
      balance.accountIndex === accountIndex &&
      balance.mint === mint &&
      (!balance.owner || balance.owner === owner)
  );
}

async function withRetry(operation, retries = 5) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const message = String(error?.message || error);
      const retryable = /429|rate|timeout|fetch failed|ECONNRESET|ETIMEDOUT|503|502/i.test(message);

      if (!retryable || attempt === retries) {
        throw error;
      }

      const waitMs = 1000 * 2 ** attempt;
      console.warn(`  retrying after ${waitMs}ms: ${message.slice(0, 160)}`);
      await sleep(waitMs);
    }
  }

  throw lastError;
}

async function readJsonIfExists(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(file, value) {
  const tempFile = `${file}.tmp`;
  await fs.writeFile(tempFile, `${JSON.stringify(value, null, 2)}\n`);
  await fs.rename(tempFile, file);
}

function sortObjectByNumericKeys(value) {
  return Object.fromEntries(
    Object.entries(value).sort(([a], [b]) => Number(a) - Number(b))
  );
}

function daysBetween(start, end) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / DAY_MS));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function redactRpcUrl(url) {
  return url.replace(/([?&](?:api-key|apikey|key)=)[^&]+/i, "$1***");
}
