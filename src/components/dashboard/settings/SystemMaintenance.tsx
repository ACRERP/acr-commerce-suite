import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { settingsService } from '@/lib/settings/settings-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SystemMaintenance() {
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isBackingUp, setIsBackingUp] = useState(false);

    const handleBackup = async () => {
        setIsBackingUp(true);
        try {
            await import('@/lib/settings/backup-service').then(m => m.backupService.exportSystemData());
            toast.success('Backup gerado com sucesso! Guarde este arquivo em segurança.');
        } catch (error) {
            toast.error('Erro ao gerar backup.');
        } finally {
            setIsBackingUp(false);
        }
    };

    const resetMutation = useMutation({
        mutationFn: settingsService.resetSystemData,
        onSuccess: () => {
            toast.success('Sistema limpo com sucesso! Reiniciando...');
            setShowConfirm(false);
            setTimeout(() => window.location.reload(), 2000);
        },
        onError: (error) => {
            toast.error('Erro ao limpar sistema: ' + (error as Error).message);
        }
    });

    return (
        <div className="space-y-6">
            {/* Backup Section */}
            <Card className="border-blue-100 dark:border-blue-900/50 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                        <RefreshCw className="w-5 h-5" />
                        Backup de Segurança
                    </CardTitle>
                    <CardDescription>
                        Antes de realizar qualquer limpeza, é altamente recomendado fazer um backup dos dados.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            O backup gera um arquivo JSON contendo todos os clientes, produtos, OSs e financeiro.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleBackup}
                        disabled={isBackingUp}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                        {isBackingUp ? 'Gerando...' : 'Fazer Download do Backup'}
                    </Button>
                </CardContent>
            </Card>

            {/* Reset Section */}
            <Card className="border-red-100 dark:border-red-900/50 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        Zona de Perigo
                    </CardTitle>
                    <CardDescription>
                        Ações irreversíveis que afetam todo o sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 gap-4">
                        <div>
                            <h4 className="font-bold text-red-900 dark:text-red-200">Limpar Dados do Sistema (Factory Reset)</h4>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1 max-w-xl">
                                Utilize esta opção para remover <strong>todas as informações</strong> de operação.
                                <br />
                                <span className="font-bold block mt-1">Recomendamos fazer o backup acima primeiro.</span>
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={() => setShowConfirm(true)}
                            className="bg-red-600 hover:bg-red-700 w-full md:w-auto hover-lift"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Resetar Sistema
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                            <p>Esta ação é <strong>irreversível</strong>. Todos os dados serão apagados permanentemente.</p>

                            <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-yellow-800 text-xs">
                                ⚠️ Você já fez o backup dos dados? Se não, cancele e faça o backup primeiro.
                            </div>

                            <div>
                                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-2">
                                    Para confirmar, digite <span className="font-mono font-bold select-all">CONFIRMAR RESET</span> abaixo:
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md uppercase"
                                    placeholder="CONFIRMAR RESET"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                />
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={resetMutation.isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                resetMutation.mutate();
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
                            disabled={resetMutation.isPending || confirmText !== 'CONFIRMAR RESET'}
                        >
                            {resetMutation.isPending ? 'Limpando...' : 'Apagar Tudo'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
