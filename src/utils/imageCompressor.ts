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
  let maxWidth = 600;
  let maxHeight = 600;
  let quality = 0.6;

  if (typeof param1 === 'number') {
    if (param1 <= 1 && param1 > 0) {
      quality = param1;
    } else {
      maxWidth = Math.min(param1, 700);
    }
  }

  if (typeof param2 === 'number') {
    if (param2 <= 1 && param2 > 0) {
      quality = param2;
      maxHeight = maxWidth;
    } else {
      maxHeight = Math.min(param2, 700);
    }
  }

  if (typeof param3 === 'number' && param3 <= 1 && param3 > 0) {
    quality = param3;
  }

  return new Promise((resolve) => {
    let rawDataUrlFallback = '';

    const compressFromDataUrl = (sourceUrl: string) => {
      if (!sourceUrl) {
        resolve('');
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width || 600;
          let height = img.naturalHeight || img.height || 600;

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
            resolve(sourceUrl.length < 650000 ? sourceUrl : '');
            return;
          }

          // Fill white background for transparent PNGs converted to JPEG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          // Step down quality if still larger than ~55KB to keep Firestore docs fast & small
          if (compressedDataUrl.length > 75000) {
            compressedDataUrl = canvas.toDataURL('image/jpeg', 0.45);
          }
          if (compressedDataUrl.length > 75000) {
            const smallCanvas = document.createElement('canvas');
            smallCanvas.width = Math.max(1, Math.round(canvas.width * 0.7));
            smallCanvas.height = Math.max(1, Math.round(canvas.height * 0.7));
            const sCtx = smallCanvas.getContext('2d');
            if (sCtx) {
              sCtx.fillStyle = '#ffffff';
              sCtx.fillRect(0, 0, smallCanvas.width, smallCanvas.height);
              sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
              compressedDataUrl = smallCanvas.toDataURL('image/jpeg', 0.45);
            }
          }

          resolve(compressedDataUrl || (sourceUrl.length < 650000 ? sourceUrl : ''));
        } catch (err) {
          console.warn('Image compression canvas notice:', err);
          resolve(sourceUrl.length < 650000 ? sourceUrl : '');
        }
      };

      img.onerror = () => {
        resolve(rawDataUrlFallback && rawDataUrlFallback.length < 650000 ? rawDataUrlFallback : '');
      };

      img.src = sourceUrl;
    };

    if (typeof fileOrUrl === 'string') {
      rawDataUrlFallback = fileOrUrl;
      compressFromDataUrl(fileOrUrl);
    } else if (fileOrUrl && typeof fileOrUrl === 'object') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const res = (e.target?.result as string) || '';
        rawDataUrlFallback = res;
        compressFromDataUrl(res);
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

