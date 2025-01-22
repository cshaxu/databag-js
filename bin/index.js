#!/usr/bin/env node

const lib = require("../lib");
const fs = require("fs");
const path = require("path");

const PROJECT_PATH = process.cwd();

function processJson(json, password, isEncrypt) {
  return Object.entries(json).reduce((acc, [key, value]) => {
    if (typeof value === "string") {
      try {
        acc[key] = isEncrypt
          ? lib.encrypt(value, password)
          : lib.decrypt(value, password);
      } catch {
        acc[key] = value;
      }
    } else {
      acc[key] = processJson(value, password, isEncrypt);
    }
    return acc;
  }, {});
}

// Usage

async function main(args) {
  const jsonFile = args
    .filter((arg) => arg.startsWith("--file="))
    .map((arg) => arg.replace("--file=", ""))
    .at(0);
  if (!jsonFile?.length) {
    throw new Error('[DATABAG/ERROR] missing "--file" argument');
  }

  const jsonFilePath = path.join(PROJECT_PATH, jsonFile);
  if (!fs.existsSync(jsonFilePath)) {
    throw new Error(`[DATABAG/ERROR] missing "${jsonFilePath}"`);
  }

  const password = args
    .filter((arg) => arg.startsWith("--password="))
    .map((arg) => arg.replace("--password=", ""))
    .at(0);
  if (!password?.length) {
    throw new Error('[DATABAG/ERROR] missing "--password" argument');
  }

  const json = await fs.promises
    .readFile(jsonFilePath, "utf8")
    .then(JSON.parse);

  const isEncrypt = args.includes("--encrypt");
  const isDecrypt = args.includes("--decrypt");
  const output = args
    .filter((arg) => arg.startsWith("--output="))
    .map((arg) => arg.replace("--output=", ""))
    .at(0);
  const outputPath = output?.length
    ? path.join(PROJECT_PATH, output)
    : jsonFilePath;
  if (isEncrypt || isDecrypt) {
    const processedJson = processJson(json, password, isEncrypt);
    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(processedJson, null, 2)
    );
    console.log(
      `[DATABAG] successfully ${isEncrypt ? "encrypted" : "decrypted"}`
    );
    return;
  }

  const keyPath = args
    .filter((arg) => arg.startsWith("--key="))
    .map((arg) => arg.replace("--key=", ""))
    .at(0);
  if (!keyPath?.length) {
    throw new Error('[DATABAG/ERROR] missing "--key" argument');
  }
  const keyPathParts = keyPath.split(/[./]/);

  const valueFile = args
    .filter((arg) => arg.startsWith("--value-file="))
    .map((arg) => arg.replace("--value-file=", ""))
    .at(0);
  const fileValue = valueFile?.length
    ? await fs.promises.readFile(valueFile, "utf8")
    : undefined;
  const value =
    fileValue ??
    args
      .filter((arg) => arg.startsWith("--value="))
      .map((arg) => arg.replace("--value=", ""))
      .at(0);
  if (value?.length) {
    let entry = json;

    for (let i = 0; i < keyPathParts.length - 1; i++) {
      const keyPathPart = keyPathParts[i];
      entry[keyPathPart] = entry[keyPathPart] ?? {};
      entry = entry[keyPathPart];
    }

    entry[keyPathParts.at(-1)] = lib.encrypt(value, password);
    await fs.promises.writeFile(outputPath, JSON.stringify(json, null, 2));

    console.log(
      `[DATABAG] "${keyPath}" updated to "${lib.decrypt(
        entry[keyPathParts.at(-1)],
        password
      )}"`
    );
  } else {
    let entry = json;
    for (const keyPathPart of keyPathParts) {
      entry = entry[keyPathPart];
      if (!entry) {
        throw new Error(`[DATABAG/ERROR] missing "${keyPathPart}"`);
      }
    }

    console.log(lib.decrypt(entry, password));
  }
}

main(process.argv.slice(2)).catch(console.error);
