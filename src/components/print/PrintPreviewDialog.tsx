/**
 * Componente de Preview de Impressão
 * 
 * Permite visualizar o documento antes de imprimir
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrintService, PrintData } from '@/lib/print/print-service';
import { Printer, Eye } from 'lucide-react';

interface PrintPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: PrintData;
}

export function PrintPreviewDialog({ open, onOpenChange, data }: PrintPreviewDialogProps) {
    const [selectedFormat, setSelectedFormat] = useState<'80mm' | 'a4'>('80mm');

    const handlePrint = () => {
        if (selectedFormat === '80mm') {
            PrintService.printReceipt80mm(data);
        } else {
            PrintService.printReceiptA4(data);
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Preview de Impressão
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as any)}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="80mm">Cupom 80mm</TabsTrigger>
                        <TabsTrigger value="a4">Recibo A4</TabsTrigger>
                    </TabsList>

                    <TabsContent value="80mm" className="mt-4">
                        <div className="border rounded-lg p-4 bg-gray-50 overflow-auto max-h-[500px]">
                            <div className="bg-white shadow-lg mx-auto" style={{ width: '80mm', padding: '10px' }}>
                                <PrintPreview80mm data={data} />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="a4" className="mt-4">
                        <div className="border rounded-lg p-4 bg-gray-50 overflow-auto max-h-[500px]">
                            <div className="bg-white shadow-lg mx-auto" style={{ maxWidth: '210mm', padding: '20mm' }}>
                                <PrintPreviewA4 data={data} />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Preview do cupom 80mm
function PrintPreview80mm({ data }: { data: PrintData }) {
    return (
        <div style={{ fontFamily: 'Courier New, monospace', fontSize: '12px', lineHeight: '1.4' }}>
            {/* Cabeçalho */}
            <div style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>{data.companyName}</div>
                {data.companyAddress && <div style={{ fontSize: '10px', marginBottom: '2px' }}>{data.companyAddress}</div>}
                {data.companyPhone && <div style={{ fontSize: '10px', marginBottom: '2px' }}>Tel: {data.companyPhone}</div>}
                {data.companyCNPJ && <div style={{ fontSize: '10px' }}>CNPJ: {data.companyCNPJ}</div>}
            </div>

            {/* Info da Venda */}
            <div style={{ marginBottom: '15px', fontSize: '11px' }}>
                <div><strong>Cupom:</strong> {data.saleId}</div>
                <div><strong>Data:</strong> {data.saleDate.toLocaleString('pt-BR')}</div>
                {data.clientName && <div><strong>Cliente:</strong> {data.clientName}</div>}
            </div>

            {/* Itens */}
            <div style={{ marginBottom: '15px' }}>
                {data.items.map((item, index) => (
                    <div key={index} style={{ marginBottom: '8px', borderBottom: '1px dotted #ccc', paddingBottom: '5px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{item.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                            <span>{item.quantity} x R$ {item.unitPrice.toFixed(2)}</span>
                            <span>R$ {item.total.toFixed(2)}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Totais */}
            <div style={{ borderTop: '1px dashed #000', paddingTop: '10px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Subtotal:</span>
                    <span>R$ {data.subtotal.toFixed(2)}</span>
                </div>
                {data.discount && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>Desconto:</span>
                        <span>- R$ {data.discount.toFixed(2)}</span>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginTop: '8px', borderTop: '1px solid #000', paddingTop: '8px' }}>
                    <span>TOTAL:</span>
                    <span>R$ {data.total.toFixed(2)}</span>
                </div>
            </div>

            {/* Rodapé */}
            <div style={{ textAlign: 'center', fontSize: '10px', borderTop: '1px dashed #000', paddingTop: '10px' }}>
                <div>Obrigado pela preferência!</div>
                <div>Volte sempre!</div>
            </div>
        </div>
    );
}

// Preview do recibo A4
function PrintPreviewA4({ data }: { data: PrintData }) {
    return (
        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt', lineHeight: '1.6', color: '#333' }}>
            {/* Cabeçalho */}
            <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
                <div style={{ fontSize: '24pt', fontWeight: 'bold', marginBottom: '10px' }}>{data.companyName}</div>
                {data.companyAddress && <div style={{ fontSize: '11pt', color: '#666', marginBottom: '5px' }}>{data.companyAddress}</div>}
                {data.companyPhone && <div style={{ fontSize: '11pt', color: '#666' }}>Telefone: {data.companyPhone}</div>}
            </div>

            <div style={{ fontSize: '18pt', fontWeight: 'bold', textAlign: 'center', margin: '30px 0', textTransform: 'uppercase' }}>
                Recibo de Venda
            </div>

            {/* Informações */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div style={{ padding: '10px', background: '#f9f9f9', borderLeft: '3px solid #333' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '10pt', color: '#666', marginBottom: '3px' }}>Número do Recibo</div>
                    <div style={{ fontSize: '12pt' }}>{data.saleId}</div>
                </div>
                <div style={{ padding: '10px', background: '#f9f9f9', borderLeft: '3px solid #333' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '10pt', color: '#666', marginBottom: '3px' }}>Data e Hora</div>
                    <div style={{ fontSize: '12pt' }}>{data.saleDate.toLocaleString('pt-BR')}</div>
                </div>
            </div>

            {/* Tabela de Itens */}
            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
                <thead>
                    <tr style={{ background: '#333', color: 'white' }}>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Descrição</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Qtd</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Valor Unit.</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {data.items.map((item, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '10px 12px' }}>{item.name}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>{item.quantity}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>R$ {item.unitPrice.toFixed(2)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>R$ {item.total.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totais */}
            <div style={{ marginTop: '30px', padding: '20px', background: '#f9f9f9', border: '2px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '12pt' }}>
                    <span>Subtotal:</span>
                    <span>R$ {data.subtotal.toFixed(2)}</span>
                </div>
                {data.discount && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '12pt' }}>
                        <span>Desconto:</span>
                        <span>- R$ {data.discount.toFixed(2)}</span>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0 8px', fontSize: '16pt', fontWeight: 'bold', borderTop: '2px solid #333', marginTop: '10px' }}>
                    <span>VALOR TOTAL:</span>
                    <span>R$ {data.total.toFixed(2)}</span>
                </div>
            </div>

            {/* Rodapé */}
            <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #ddd', textAlign: 'center', fontSize: '10pt', color: '#666' }}>
                <p>Este documento é um comprovante de venda.</p>
                <p>Emitido em {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
        </div>
    );
}
