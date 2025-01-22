"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = decrypt;
exports.encrypt = encrypt;
var crypto_1 = __importDefault(require("crypto"));
function encrypt(config, password) {
    if (typeof config === "string") {
        return encryptString(config, password);
    }
    return Object.entries(config).reduce(function (acc, _a) {
        var key = _a[0], value = _a[1];
        acc[key] = encrypt(value, password);
        return acc;
    }, {});
}
function decrypt(config, password) {
    if (typeof config === "string") {
        return decryptString(config, password);
    }
    return Object.entries(config).reduce(function (acc, _a) {
        var key = _a[0], value = _a[1];
        acc[key] = decrypt(value, password);
        return acc;
    }, {});
}
function encryptString(value, password) {
    var iv = crypto_1.default.randomBytes(16); // generate a random iv
    var cipher = crypto_1.default.createCipheriv("aes-256-cbc", Buffer.from(password, "hex"), iv);
    var encrypted = cipher.update(value);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
}
function decryptString(value, password) {
    var textParts = value.split(":");
    var firstPart = textParts.shift();
    if (!firstPart) {
        throw new Error("Invalid encrypted text");
    }
    var iv = Buffer.from(firstPart, "hex");
    var encryptedText = Buffer.from(textParts.join(":"), "hex");
    var decipher = crypto_1.default.createDecipheriv("aes-256-cbc", Buffer.from(password, "hex"), iv);
    var decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
//# sourceMappingURL=index.js.map