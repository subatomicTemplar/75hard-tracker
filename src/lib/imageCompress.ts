const MAX_DIMENSION = 800;
const MAX_BYTES = 500 * 1024; // 500 KB
const INITIAL_QUALITY = 0.85;

export function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let width = img.width;
      let height = img.height;

      // Scale down so neither dimension exceeds MAX_DIMENSION
      const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Iteratively reduce quality to fit under 500KB
      function tryCompress(quality: number) {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            if (blob.size > MAX_BYTES && quality > 0.3) {
              tryCompress(quality - 0.1);
            } else {
              resolve(blob);
            }
          },
          'image/jpeg',
          quality
        );
      }

      tryCompress(INITIAL_QUALITY);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
