import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ProductImageUploadProps {
    productId?: number;
    currentImage?: string | null;
    onUploadSuccess: (imageUrl: string) => void;
}

export function ProductImageUpload({
    productId,
    currentImage,
    onUploadSuccess
}: ProductImageUploadProps) {
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImage || null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Erro!',
                description: 'Por favor, selecione uma imagem válida.',
                variant: 'destructive'
            });
            return;
        }

        // Validar tamanho (máx 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: 'Erro!',
                description: 'A imagem deve ter no máximo 5MB.',
                variant: 'destructive'
            });
            return;
        }

        // Mostrar preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        await handleUpload(file);
    };

    const handleUpload = async (file: File) => {
        setUploading(true);

        try {
            // Gerar nome único para o arquivo
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `products/${fileName}`;

            // Upload para Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw uploadError;
            }

            // Pegar URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            // Atualizar produto se tiver ID
            if (productId) {
                const { error: updateError } = await supabase
                    .from('products')
                    .update({ image_url: publicUrl })
                    .eq('id', productId);

                if (updateError) {
                    throw updateError;
                }
            }

            // Callback de sucesso
            onUploadSuccess(publicUrl);

            toast({
                title: 'Sucesso!',
                description: 'Imagem enviada com sucesso.'
            });

        } catch (error: any) {
            console.error('Erro ao fazer upload:', error);
            toast({
                title: 'Erro!',
                description: error.message || 'Falha ao fazer upload da imagem.',
                variant: 'destructive'
            });
            setPreview(currentImage || null);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onUploadSuccess('');
    };

    return (
        <div className="space-y-4">
            <Label>Imagem do Produto</Label>

            {preview ? (
                <div className="relative">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemove}
                        disabled={uploading}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 mb-4">
                        Clique para selecionar uma imagem
                    </p>
                    <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={uploading}
                        className="hidden"
                        id="product-image-upload"
                    />
                    <Label htmlFor="product-image-upload">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={uploading}
                            asChild
                        >
                            <span>
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Selecionar Imagem
                                    </>
                                )}
                            </span>
                        </Button>
                    </Label>
                </div>
            )}

            <p className="text-xs text-gray-500">
                Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
            </p>
        </div>
    );
}
