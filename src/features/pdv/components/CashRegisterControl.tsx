import { useState } from 'react';
import { useOpenCash } from '@/hooks/usePDV';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DollarSign, Loader2, Lock } from 'lucide-react';
import { formatCurrency } from '@/lib/pdv';
import { useAuth } from '@/contexts/AuthContext';

export function CashRegisterControl() {
    const [openingBalance, setOpeningBalance] = useState('');
    const openCashMutation = useOpenCash();
    const { user, loading: authLoading } = useAuth();

    const handleOpenCash = () => {
        if (!user) return;

        const balance = parseFloat(openingBalance.replace(',', '.'));
        if (isNaN(balance)) return;

        openCashMutation.mutate({ openingBalance: balance }, {
            onSuccess: () => {
                setOpeningBalance('');
            }
        });
    };

    if (authLoading) {
        return (
            <div className="fixed inset-0 bg-gray-100/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-2xl border-2 border-primary/20 p-8 flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Verificando permissões...</p>
                </Card>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="fixed inset-0 bg-gray-100/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-2xl border-2 border-destructive/20">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <Lock className="w-8 h-8 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl">Acesso Negado</CardTitle>
                        <CardDescription>
                            Você precisa estar autenticado para abrir o caixa.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 flex justify-center">
                        <Button variant="outline" onClick={() => window.location.href = '/login'}>
                            Ir para Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-100/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl border-2 border-primary/20">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <DollarSign className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Abertura de Caixa</CardTitle>
                    <CardDescription>
                        O caixa está fechado. Informe o suprimento inicial para começar a vender.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="opening-balance">Suprimento Inicial (Troco)</Label>
                        <Input
                            id="opening-balance"
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            className="text-lg font-bold text-center h-12"
                            value={openingBalance}
                            onChange={(e) => setOpeningBalance(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleOpenCash()}
                            autoFocus
                        />
                    </div>

                    <Button
                        className="w-full h-12 text-lg"
                        onClick={handleOpenCash}
                        disabled={!openingBalance || openCashMutation.isPending}
                    >
                        {openCashMutation.isPending ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            'Abrir Caixa'
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
