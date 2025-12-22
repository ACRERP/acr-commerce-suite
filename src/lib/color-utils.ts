/**
 * Extracts the dominant color from an image URL using HTML5 Canvas.
 * Returns a hex string (e.g., "#FF0000").
 */
export async function extractDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Crucial for external images
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        reject("Canvas context not available");
        return;
      }

      // Resize to 1x1 to get average color automatically
      canvas.width = 1;
      canvas.height = 1;
      
      // Draw image
      ctx.drawImage(img, 0, 0, 1, 1);
      
      // Get pixel data
      const p = ctx.getImageData(0, 0, 1, 1).data;
      
      // Convert to Hex
      const hex = "#" + [p[0], p[1], p[2]].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
      
      resolve(hex);
    };

    img.onerror = () => {
      reject("Failed to load image");
    };
  });
}

/**
 * Extracts a palette of 3 colors (Dominant, Secondary, Accent) from an image.
 * Uses a simplified quantization approach (k-means-ish via canvas resizing).
 */
export async function extractPalette(imageUrl: string, maxColors: number = 8): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // Only set crossOrigin for external URLs, not for Base64
      if (!imageUrl.startsWith('data:')) {
        img.crossOrigin = "Anonymous";
      }
      img.src = imageUrl;
  
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          
          if (!ctx) {
            reject("Canvas context not available");
            return;
          }
    
          // Use a larger grid for better color sampling
          const size = 20; // Increased size for more detail
          canvas.width = size;
          canvas.height = size;
          
          ctx.drawImage(img, 0, 0, size, size);
          
          const imageData = ctx.getImageData(0, 0, size, size).data;
          const colorCounts: Record<string, number> = {};
    
          // Helper: Calculate color brightness (0-1)
          const getBrightness = (r: number, g: number, b: number) => {
            return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
          };

          // Helper: Calculate color saturation (0-1)
          const getSaturation = (r: number, g: number, b: number) => {
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            if (max === 0) return 0;
            return (max - min) / max;
          };

          // Helper: Is this a "vibrant" color
          const isVibrant = (r: number, g: number, b: number) => {
            const brightness = getBrightness(r, g, b);
            const saturation = getSaturation(r, g, b);
            return brightness > 0.1 && brightness < 0.9 && saturation > 0.15;
          };
    
          // Count frequencies of colors
          for (let i = 0; i < imageData.length; i += 4) {
              const r = imageData[i];
              const g = imageData[i + 1];
              const b = imageData[i + 2];
              const a = imageData[i + 3];

              if (a < 200) continue; // High opacity required

              // Quantize for grouping but less aggressively than before
              const qr = Math.round(r / 15) * 15;
              const qg = Math.round(g / 15) * 15;
              const qb = Math.round(b / 15) * 15;

              const hex = "#" + [qr, qg, qb].map(x => {
                  const h = x.toString(16);
                  return h.length === 1 ? '0' + h : h;
              }).join('');

              // Weight vibrant colors more
              const weight = isVibrant(r, g, b) ? 5 : 1;
              colorCounts[hex] = (colorCounts[hex] || 0) + weight;
          }

          // Sort by frequency
          const sortedColors = Object.entries(colorCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([color]) => color);
              
          // Filter out colors that are too close to each other
          const uniquePalette: string[] = [];
          
          const getDistance = (c1: string, c2: string) => {
              const r1 = parseInt(c1.substring(1,3), 16);
              const g1 = parseInt(c1.substring(3,5), 16);
              const b1 = parseInt(c1.substring(5,7), 16);
              const r2 = parseInt(c2.substring(1,3), 16);
              const g2 = parseInt(c2.substring(3,5), 16);
              const b2 = parseInt(c2.substring(5,7), 16);
              return Math.sqrt(Math.pow(r1-r2, 2) + Math.pow(g1-g2, 2) + Math.pow(b1-b2, 2));
          };

          for (const color of sortedColors) {
              if (uniquePalette.length === 0) {
                  uniquePalette.push(color);
                  continue;
              }
              
              if (uniquePalette.length >= 8) break;

              const isTooClose = uniquePalette.some(uc => getDistance(uc, color) < 45);
              if (!isTooClose) {
                  uniquePalette.push(color);
              }
          }
          
          const defaultColors = ['#006CFF', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#454ade'];
          while (uniquePalette.length < 4) {
              uniquePalette.push(defaultColors[uniquePalette.length]);
          }

          console.log('✅ Extended Palette extracted:', uniquePalette);
          resolve(uniquePalette);
        } catch (error) {
          console.error('❌ Palette extraction failed:', error);
          reject(error);
        }
      };
  
      img.onerror = (error) => {
        console.error('❌ Image load failed:', error);
        reject("Failed to load image");
      };
    });
  }

/**
 * Basic hex validation
 */
export function isValidHex(hex: string): boolean {
  return /^#([0-9A-F]{3}){1,2}$/i.test(hex);
}
