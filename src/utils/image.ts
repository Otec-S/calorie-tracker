/** Reads a file as base64 (without the data URL prefix), no resizing. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  });
}

/**
 * Scales a width/height pair down so neither side exceeds maxDim, preserving
 * aspect ratio. Images that already fit are returned untouched.
 */
export function fitWithin(
  width: number,
  height: number,
  maxDim: number,
): { width: number; height: number } {
  if (width > height && width > maxDim) {
    return { width: maxDim, height: Math.round((height * maxDim) / width) };
  }
  if (height > maxDim) {
    return { width: Math.round((width * maxDim) / height), height: maxDim };
  }
  return { width, height };
}

/**
 * Reads an image file, downsizes it to fit within maxDim on its longest
 * side, and returns the base64-encoded JPEG payload (without the data URL
 * prefix) ready to send to the Claude API.
 */
export function fileToResizedBase64(file: File, maxDim = 900, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Не удалось загрузить изображение"));
      img.onload = () => {
        const { width, height } = fitWithin(img.width, img.height, maxDim);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl.split(",")[1]);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
