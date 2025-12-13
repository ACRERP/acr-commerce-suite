
import { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';

interface ImportProductsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ImportProductsDialog({ open, onOpenChange }: ImportProductsDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = (file: File) => {
        setIsLoading(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                if (jsonData.length === 0) {
                    toast({ title: "Arquivo vazio", description: "A planilha não contém dados.", variant: "destructive" });
                    setFile(null);
                    return;
                }

                setData(jsonData);
                setPreview(jsonData.slice(0, 5)); // Show first 5 rows
            } catch (error) {
                console.error('Erro ao ler arquivo:', error);
                toast({
                    title: "Erro na leitura",
                    description: "Não foi possível ler o arquivo. Verifique o formato.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        reader.readAsBinaryString(file);
    };

    const handleImport = async () => {
        if (!data.length) return;
        setIsLoading(true);

        try {
            // Map data to database schema
            const productsToInsert = data.map((row: any) => ({
                name: row['Nome'] || row['name'] || row['Produto'],
                code: row['Código'] || row['code'] || row['SKU'] || String(Math.floor(Math.random() * 1000000)), // Fallback generic code
                description: row['Descrição'] || row['description'],
                sale_price: Number(row['Preço Venda'] || row['sale_price'] || row['price'] || 0),
                stock_quantity: Number(row['Estoque'] || row['stock_quantity'] || row['quantity'] || 0),
                minimum_stock_level: Number(row['Estoque Mínimo'] || row['minimum_stock_level'] || row['min_stock'] || 5),
                category: row['Categoria'] || row['category'] || 'Geral',
                unit: row['Unidade'] || row['unit'] || 'un',
                cost_price: Number(row['Custo'] || row['cost_price'] || 0)
            }));

            const { error } = await supabase.from('products').insert(productsToInsert);

            if (error) throw error;

            toast({
                title: "Importação concluída!",
                description: `${productsToInsert.length} produtos importados com sucesso.`,
                className: "bg-green-500 text-white"
            });

            queryClient.invalidateQueries({ queryKey: ['products'] });
            onOpenChange(false);
            setFile(null);
            setData([]);

        } catch (error: any) {
            console.error('Erro na importação:', error);
            toast({
                title: "Erro ao importar",
                description: error.message || "Falha ao salvar produtos no banco.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        Importar Produtos
                    </DialogTitle>
                    <DialogDescription>
                        Carregue uma planilha (.xlsx ou .csv) para importar produtos em massa.
                        <br />
                        <span className="text-xs text-neutral-500">Colunas esperadas: Nome, Código, Preço Venda, Estoque, Categoria.</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!file ? (
                        <div
                            className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors bg-neutral-50 dark:bg-neutral-800/50"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-10 h-10 text-neutral-400 mb-2" />
                            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Clique para selecionar arquivo</p>
                            <p className="text-xs text-neutral-400">suporta .xlsx, .xls, .csv</p>
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                                        <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-green-900 dark:text-green-300">{file.name}</p>
                                        <p className="text-xs text-green-700 dark:text-green-400">{data.length} registros encontrados</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Trocar</Button>
                            </div>

                            {preview.length > 0 && (
                                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3 border border-neutral-200 dark:border-neutral-800">
                                    <p className="text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wide">Pré-visualização (5 primeiros)</p>
                                    <div className="space-y-2">
                                        {preview.map((row, i) => (
                                            <div key={i} className="text-xs grid grid-cols-4 gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-1 last:border-0 last:pb-0">
                                                <span className="truncate font-medium">{row['Nome'] || row['name'] || '-'}</span>
                                                <span className="truncate text-neutral-500">{row['Código'] || row['code'] || '-'}</span>
                                                <span className="truncate text-right">{row['Estoque'] || row['stock_quantity'] || 0} un</span>
                                                <span className="truncate text-right">R$ {row['Preço Venda'] || row['sale_price'] || 0}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleImport} disabled={!file || isLoading || data.length === 0} className="btn-primary">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Importar {data.length > 0 ? `(${data.length})` : ''}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
