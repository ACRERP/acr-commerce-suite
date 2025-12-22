import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
    images: string[];
    onImagesChange: (images: string[]) => void;
    maxImages?: number;
    label: string;
}

export function ImageUpload({ images, onImagesChange, maxImages = 5, label }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    const uploadImage = async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `service-orders/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            toast({
                title: 'Erro ao fazer upload',
                description: 'Não foi possível enviar a imagem.',
                variant: 'destructive',
            });
            return null;
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        if (files.length + images.length > maxImages) {
            toast({
                title: 'Limite excedido',
                description: `Você pode enviar no máximo ${maxImages} imagens.`,
                variant: 'destructive',
            });
            return;
        }

        setUploading(true);

        const uploadPromises = files.map(file => uploadImage(file));
        const uploadedUrls = await Promise.all(uploadPromises);

        const validUrls = uploadedUrls.filter((url): url is string => url !== null);

        if (validUrls.length > 0) {
            onImagesChange([...images, ...validUrls]);
            toast({
                title: 'Imagens enviadas',
                description: `${validUrls.length} imagem(ns) enviada(s) com sucesso.`,
            });
        }

        setUploading(false);
        e.target.value = ''; // Reset input
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        onImagesChange(newImages);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{label}</label>
                <span className="text-xs text-gray-500">{images.length}/{maxImages}</span>
            </div>

            {/* Image Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {images.map((url, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={url}
                                alt={`Foto ${index + 1}`}
                                className="w-full h-24 object-cover rounded-md border"
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Button */}
            {images.length < maxImages && (
                <div>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        id={`image-upload-${label}`}
                        disabled={uploading}
                    />
                    <label htmlFor={`image-upload-${label}`}>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={uploading}
                            asChild
                        >
                            <span>
                                {uploading ? (
                                    <>
                                        <Upload className="mr-2 h-4 w-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="mr-2 h-4 w-4" />
                                        Adicionar Fotos
                                    </>
                                )}
                            </span>
                        </Button>
                    </label>
                </div>
            )}
        </div>
    );
}
