import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./image.ts", () => ({
  fileToBase64: vi.fn(async () => "RAW_BASE64"),
  fileToResizedBase64: vi.fn(async () => "RESIZED_BASE64"),
}));

import { fileToAttachment } from "./attachments.ts";
import { fileToBase64, fileToResizedBase64 } from "./image.ts";

const MB = 1024 * 1024;

/** A File whose reported size we control, so tests don't allocate megabytes. */
function fakeFile(name: string, type: string, size: number): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fileToAttachment", () => {
  it("reads a PDF under the size cap as-is", async () => {
    const result = await fileToAttachment(fakeFile("analysis.pdf", "application/pdf", 3 * MB));

    expect(result).toEqual({
      mediaType: "application/pdf",
      base64: "RAW_BASE64",
      name: "analysis.pdf",
    });
    expect(fileToBase64).toHaveBeenCalledOnce();
    expect(fileToResizedBase64).not.toHaveBeenCalled();
  });

  it("rejects a PDF over 4 MB, naming the file", async () => {
    await expect(fileToAttachment(fakeFile("huge.pdf", "application/pdf", 5 * MB))).rejects.toThrow(
      "Файл «huge.pdf» больше 4 МБ",
    );
    expect(fileToBase64).not.toHaveBeenCalled();
  });

  // Regression guard for 66657a1: the 4 MB cap used to gate every file, so
  // phone photos (routinely 5-10 MB) were rejected before they could be
  // downsized. Images must not be size-checked at all.
  it("accepts an oversized photo and downsizes it instead of rejecting", async () => {
    const result = await fileToAttachment(fakeFile("IMG_0042.jpg", "image/jpeg", 8 * MB));

    expect(result).toEqual({
      mediaType: "image/jpeg",
      base64: "RESIZED_BASE64",
      name: "IMG_0042.jpg",
    });
    expect(fileToResizedBase64).toHaveBeenCalledOnce();
  });

  it("normalises any image type to JPEG, since resizing re-encodes it", async () => {
    const result = await fileToAttachment(fakeFile("photo.heic", "image/heic", 6 * MB));
    expect(result.mediaType).toBe("image/jpeg");
  });

  it("rejects an unsupported file type", async () => {
    await expect(fileToAttachment(fakeFile("notes.txt", "text/plain", 1024))).rejects.toThrow(
      "Формат файла «notes.txt» не поддерживается",
    );
  });

  it("rejects a file the browser could not type", async () => {
    await expect(fileToAttachment(fakeFile("mystery", "", 1024))).rejects.toThrow("не поддерживается");
  });
});
