import type { ChatAttachment } from "../types.ts";
import { fileToBase64, fileToResizedBase64 } from "./image.ts";

const MAX_FILE_BYTES = 4 * 1024 * 1024; // raw upload cap, before any resizing

/**
 * Converts a user-picked file into a ChatAttachment ready to send to Claude:
 * images are downsized to the same JPEG payload used for food-photo analysis,
 * PDFs are read as-is (no client-side resizing is possible for documents).
 */
export async function fileToAttachment(file: File): Promise<ChatAttachment> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`Файл «${file.name}» больше 4 МБ`);
  }
  if (file.type === "application/pdf") {
    const base64 = await fileToBase64(file);
    return { mediaType: "application/pdf", base64, name: file.name };
  }
  if (file.type.startsWith("image/")) {
    const base64 = await fileToResizedBase64(file);
    return { mediaType: "image/jpeg", base64, name: file.name };
  }
  throw new Error(`Формат файла «${file.name}» не поддерживается`);
}
