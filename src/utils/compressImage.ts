export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

/**
 * Reads a raw image file and returns a compressed JPEG data URL, resized so
 * its longest edge is at most `maxWidth`. Used wherever a user-uploaded photo
 * gets stored as a Postgres TEXT column (no object storage in this app), so
 * keeping output small (~30-80KB at the forum's 640px/0.6 settings) matters
 * for both row size and any request that embeds it.
 */
export function compressImage(file: File, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to read file"));
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
