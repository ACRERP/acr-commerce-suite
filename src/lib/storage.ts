import { supabase } from './supabaseClient';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

// Upload image to Supabase storage
export async function uploadImage(
  file: File,
  bucket: string = 'product-images',
  folder?: string
): Promise<UploadResult> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        url: '',
        path: '',
        error: error.message
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('Unexpected upload error:', error);
    return {
      url: '',
      path: '',
      error: 'Erro ao fazer upload da imagem'
    };
  }
}

// Upload multiple images
export async function uploadMultipleImages(
  files: File[],
  bucket: string = 'product-images',
  folder?: string
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => uploadImage(file, bucket, folder));
  return Promise.all(uploadPromises);
}

// Delete image from Supabase storage
export async function deleteImage(
  path: string,
  bucket: string = 'product-images'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected delete error:', error);
    return {
      success: false,
      error: 'Erro ao deletar imagem'
    };
  }
}

// Delete multiple images
export async function deleteMultipleImages(
  paths: string[],
  bucket: string = 'product-images'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      console.error('Delete multiple error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected delete multiple error:', error);
    return {
      success: false,
      error: 'Erro ao deletar imagens'
    };
  }
}

// Get image info (size, type, etc.)
export function getImageInfo(file: File): {
  size: number;
  type: string;
  name: string;
  isValid: boolean;
  error?: string;
} {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (file.size > maxSize) {
    return {
      size: file.size,
      type: file.type,
      name: file.name,
      isValid: false,
      error: 'O arquivo excede o tamanho máximo de 5MB'
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      size: file.size,
      type: file.type,
      name: file.name,
      isValid: false,
      error: 'Formato de arquivo não suportado. Use JPG, PNG ou WebP.'
    };
  }

  return {
    size: file.size,
    type: file.type,
    name: file.name,
    isValid: true
  };
}

// Compress image before upload (optional)
export function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}
