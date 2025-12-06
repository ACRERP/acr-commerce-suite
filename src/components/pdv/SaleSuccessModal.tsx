import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    ReceiptData,
    printReceipt,
    shareViaWhatsApp,
    shareViaWhatsAppWeb,
    copyReceiptToClipboard,
    generateReceiptWhatsApp,
} from '@/lib/receipt';
import { formatCurrency, PAYMENT_METHODS } from '@/lib/pdv';
import { useToast } from '@/hooks/use-toast';
import {
    CheckCircle,
    Printer,
    MessageCircle,
    Copy,
    X,
    Phone,
    Share2,
} from 'lucide-react';

interface SaleSuccessModalProps {
    open: boolean;
    onClose: () => void;
    receiptData: ReceiptData | null;
}

export function SaleSuccessModal({ open, onClose, receiptData }: SaleSuccessModalProps) {
    const [showWhatsAppInput, setShowWhatsAppInput] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const { toast } = useToast();

    if (!receiptData) return null;

    const handlePrint = () => {
        printReceipt(receiptData);
        toast({ title: 'Abrindo impressão...' });
    };

    const handleWhatsApp = () => {
        if (phoneNumber) {
            shareViaWhatsApp(receiptData, phoneNumber);
        } else {
            shareViaWhatsAppWeb(receiptData);
        }
        setShowWhatsAppInput(false);
        setPhoneNumber('');
    };

    const handleCopy = async () => {
        const success = await copyReceiptToClipboard(receiptData);
        if (success) {
            toast({ title: 'Cupom copiado para a área de transferência!' });
        } else {
            toast({ title: 'Erro ao copiar', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-6 w-6" />
                        Venda Finalizada!
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {/* Sale Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Venda #</span>
                            <span className="font-medium">{receiptData.saleId}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Itens</span>
                            <span className="font-medium">{receiptData.items.length}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between">
                            <span className="font-medium">Total</span>
                            <span className="font-bold text-lg text-primary">
                                {formatCurrency(receiptData.total)}
                            </span>
                        </div>
                        {receiptData.payments.map((p, i) => (
                            <div key={i} className="flex justify-between text-sm text-gray-600">
                                <span>{PAYMENT_METHODS[p.method as keyof typeof PAYMENT_METHODS]?.icon} {p.method}</span>
                                <span>{formatCurrency(p.amount)}</span>
                            </div>
                        ))}
                        {receiptData.payments.some(p => p.change && p.change > 0) && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Troco</span>
                                <span>{formatCurrency(receiptData.payments.find(p => p.change)?.change || 0)}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 space-y-2">
                        <Button onClick={handlePrint} variant="outline" className="w-full">
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimir Cupom
                        </Button>

                        {!showWhatsAppInput ? (
                            <Button
                                onClick={() => setShowWhatsAppInput(true)}
                                variant="outline"
                                className="w-full text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Enviar via WhatsApp
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="(99) 99999-9999 ou deixe vazio"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="flex-1"
                                />
                                <Button onClick={handleWhatsApp} className="bg-green-600 hover:bg-green-700">
                                    <Share2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" onClick={() => setShowWhatsAppInput(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        <Button onClick={handleCopy} variant="ghost" className="w-full">
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar Cupom
                        </Button>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={onClose} className="w-full">
                        Nova Venda
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
