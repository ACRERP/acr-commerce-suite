import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resizes an image file to a maximum width or height, maintaining aspect ratio.
 * Returns a Promise that resolves to the base64 string.
 */
export const resizeImage = (file: File, maxWidth: number = 300): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas context is not available"));
          return;
        }

        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64
        resolve(canvas.toDataURL(file.type));
      };
      
      img.onerror = (err) => reject(err);

      if (e.target?.result && typeof e.target.result === 'string') {
        img.src = e.target.result;
      } else {
        reject(new Error("Failed to read file"));
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
