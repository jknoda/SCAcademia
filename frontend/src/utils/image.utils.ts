/**
 * Compresses an image file using Canvas API.
 * - Resizes to fit within maxDimension × maxDimension (preserving aspect ratio).
 * - Encodes as JPEG at the given quality (0–1).
 * Returns a base64 data-URL string.
 */
export function compressImage(
  file: File,
  maxDimension = 800,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error('Não foi possível decodificar a imagem selecionada.'));

      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height / width) * maxDimension);
            width = maxDimension;
          } else {
            width = Math.round((width / height) * maxDimension);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Canvas unavailable — fall back to original data.
          resolve(String(reader.result || ''));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      img.src = String(reader.result || '');
    };

    reader.readAsDataURL(file);
  });
}
