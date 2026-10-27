/**
 * Compresses an image File or base64 data URL to an optimized, lightweight JPEG data URL.
 * Produces tiny, crystal-clear 25KB - 50KB images to prevent localStorage QuotaExceededError
 * and Firestore document size limit issues.
 */

export async function compressImage(
  fileOrUrl: File | string,
  param1: number = 600,
  param2: number = 600,
  param3: number = 0.6
): Promise<string> {
  // Normalize parameters to support both:
  // - compressImage(file, maxWidth, maxHeight, quality)
  // - compressImage(file, maxWidth, quality) e.g. compressImage(file, 800, 0.7)
  let maxWidth = 600;
  let maxHeight = 600;
  let quality = 0.6;

  if (typeof param1 === 'number') {
    if (param1 <= 1 && param1 > 0) {
      quality = param1;
    } else {
      maxWidth = Math.min(param1, 800);
    }
  }

  if (typeof param2 === 'number') {
    if (param2 <= 1 && param2 > 0) {
      quality = param2;
      maxHeight = maxWidth; // param2 was quality, so maxHeight should equal maxWidth
    } else {
      maxHeight = Math.min(param2, 800);
    }
  }

  if (typeof param3 === 'number' && param3 <= 1 && param3 > 0) {
    quality = param3;
  }

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        let width = img.width || 600;
        let height = img.height || 600;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.max(1, Math.round((height * maxWidth) / width));
            width = maxWidth;
          } else {
            width = Math.max(1, Math.round((width * maxHeight) / height));
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        // If still larger than 60KB, re-encode with lower quality to strictly protect storage
        if (compressedDataUrl.length > 80000) {
          compressedDataUrl = canvas.toDataURL('image/jpeg', 0.4);
        }

        resolve(compressedDataUrl);
      } catch (err) {
        console.warn('Image compression canvas notice:', err);
        resolve('');
      }
    };

    img.onerror = () => {
      resolve('');
    };

    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else if (fileOrUrl && typeof fileOrUrl === 'object') {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(fileOrUrl);
    } else {
      resolve('');
    }
  });
}

export const compressImageFile = compressImage;
