import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (file: File, bucket: string = 'products') => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      toast({
        title: 'Erro no Upload',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading };
}
