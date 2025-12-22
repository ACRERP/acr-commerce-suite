/**
 * Extrai paleta de cores dominantes de uma imagem
 * Usado para gerar tema automático baseado na logo da empresa
 */

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
}

/**
 * Converte RGB para HEX
 */
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

/**
 * Calcula luminância de uma cor (para determinar se é clara ou escura)
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Extrai cores dominantes de uma imagem
 */
export async function extractColorsFromImage(imageUrl: string): Promise<ColorPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Redimensionar para performance
      const maxSize = 100;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      // Coletar cores (ignorar pixels muito claros ou muito escuros)
      const colors: { r: number; g: number; b: number; count: number }[] = [];
      const colorMap = new Map<string, number>();
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        
        // Ignorar pixels transparentes
        if (a < 128) continue;
        
        // Ignorar pixels muito claros ou muito escuros
        const luminance = getLuminance(r, g, b);
        if (luminance > 0.9 || luminance < 0.1) continue;
        
        // Agrupar cores similares (reduzir para 32 níveis por canal)
        const key = `${Math.floor(r / 8)}-${Math.floor(g / 8)}-${Math.floor(b / 8)}`;
        colorMap.set(key, (colorMap.get(key) || 0) + 1);
      }
      
      // Converter mapa para array e ordenar por frequência
      const sortedColors = Array.from(colorMap.entries())
        .map(([key, count]) => {
          const [r, g, b] = key.split('-').map(n => parseInt(n) * 8);
          return { r, g, b, count };
        })
        .sort((a, b) => b.count - a.count);
      
      if (sortedColors.length === 0) {
        // Fallback para cores padrão
        resolve({
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#06b6d4',
          neutral: '#64748b'
        });
        return;
      }
      
      // Selecionar cores dominantes
      const primary = sortedColors[0];
      const secondary = sortedColors[Math.min(1, sortedColors.length - 1)];
      const accent = sortedColors[Math.min(2, sortedColors.length - 1)];
      const neutral = sortedColors[Math.min(3, sortedColors.length - 1)];
      
      resolve({
        primary: rgbToHex(primary.r, primary.g, primary.b),
        secondary: rgbToHex(secondary.r, secondary.g, secondary.b),
        accent: rgbToHex(accent.r, accent.g, accent.b),
        neutral: rgbToHex(neutral.r, neutral.g, neutral.b)
      });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Aplica tema no documento
 */
export function applyTheme(palette: ColorPalette) {
  const root = document.documentElement;
  
  // Aplicar cores primárias
  root.style.setProperty('--color-primary', palette.primary);
  root.style.setProperty('--color-secondary', palette.secondary);
  root.style.setProperty('--color-accent', palette.accent);
  root.style.setProperty('--color-neutral', palette.neutral);
  
  // Salvar no localStorage
  localStorage.setItem('theme-palette', JSON.stringify(palette));
}

/**
 * Carrega tema salvo
 */
export function loadSavedTheme(): ColorPalette | null {
  const saved = localStorage.getItem('theme-palette');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Reseta para tema padrão
 */
export function resetToDefaultTheme() {
  const defaultPalette: ColorPalette = {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    neutral: '#64748b'
  };
  
  applyTheme(defaultPalette);
  return defaultPalette;
}
