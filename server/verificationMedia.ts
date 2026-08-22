import { randomUUID } from "node:crypto";
import { storagePut } from "./storage";

const DATA_URL_PATTERN = /^data:([^;,]+);base64,([\s\S]+)$/;

export async function persistVerificationMedia(
  value: string,
  keyPrefix: string,
  allowedMimeTypes: readonly string[],
  maxBytes: number,
): Promise<string> {
  if (!value.startsWith("data:")) {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Unsupported media URL protocol");
      return url.toString();
    } catch {
      throw new Error("Verification media must be a valid URL or a supported data URL.");
    }
  }

  const match = DATA_URL_PATTERN.exec(value);
  if (!match) throw new Error("Invalid verification data URL.");
  const [, mimeType, encoded] = match;
  if (!allowedMimeTypes.includes(mimeType)) throw new Error(`Unsupported verification media type: ${mimeType}`);

  const buffer = Buffer.from(encoded, "base64");
  if (buffer.byteLength === 0 || buffer.byteLength > maxBytes) {
    throw new Error(`Verification media must be between 1 byte and ${Math.floor(maxBytes / 1024 / 1024)} MB.`);
  }

  const extension = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
  const { url } = await storagePut(`${keyPrefix}/${randomUUID()}.${extension}`, buffer, mimeType);
  return url;
}
