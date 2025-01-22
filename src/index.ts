import crypto from "crypto";

type Config = { [key: string]: string | Config };

function encrypt<T extends string | Config>(config: T, password: string): T {
  if (typeof config === "string") {
    return encryptString(config, password) as T;
  }
  return Object.entries(config).reduce((acc, [key, value]) => {
    (acc as any)[key] = encrypt(value, password);
    return acc;
  }, {} as T);
}

function decrypt<T extends string | Config>(config: T, password: string): T {
  if (typeof config === "string") {
    return decryptString(config, password) as T;
  }
  return Object.entries(config).reduce((acc, [key, value]) => {
    (acc as any)[key] = decrypt(value, password);
    return acc;
  }, {} as T);
}

function encryptString(value: string, password: string) {
  const iv = crypto.randomBytes(16); // generate a random iv
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(password, "hex"),
    iv
  );
  let encrypted = cipher.update(value);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decryptString(value: string, password: string) {
  const textParts = value.split(":");
  const firstPart = textParts.shift();
  if (!firstPart) {
    throw new Error("Invalid encrypted text");
  }
  const iv = Buffer.from(firstPart, "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(password, "hex"),
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export { Config, decrypt, encrypt };
