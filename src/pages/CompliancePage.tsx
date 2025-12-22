import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Target,
    ShieldCheck,
    AlertTriangle,
    FileCheck,
    History,
    Search,
    Download,
    Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function CompliancePage() {
    return (
        <MainLayout>
            <div className="w-full max-w-[95%] mx-auto px-4 py-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 tracking-tight mb-2">
                            Compliance & Regulação
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-teal-500" />
                            Controle de normas, validade de lotes e auditoria regulatória
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />
                            Relatórios ANVISA
                        </Button>
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-lg shadow-teal-500/20">
                            <Target className="w-4 h-4" />
                            Nova Inspeção
                        </Button>
                    </div>
                </div>

                {/* Risk Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="p-6 border-l-4 border-l-green-500 bg-green-50/30">
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-green-700 uppercase">Status Geral</p>
                            <h3 className="text-2xl font-bold text-green-800">100% Regular</h3>
                            <p className="text-xs text-green-600">Última verificação: Hoje, 09:21</p>
                        </div>
                    </Card>
                    <Card className="p-6 border-l-4 border-l-amber-500 bg-amber-50/30">
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-amber-700 uppercase">Lotes a Vencer</p>
                            <h3 className="text-2xl font-bold text-amber-800">12 Itens</h3>
                            <p className="text-xs text-amber-600">Próximos 30 dias</p>
                        </div>
                    </Card>
                    <Card className="p-6 border-l-4 border-l-red-500 bg-red-50/30">
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-red-700 uppercase">Não Conformidades</p>
                            <h3 className="text-2xl font-bold text-red-800">0 Resolvidas</h3>
                            <p className="text-xs text-red-600">Nenhum alerta crítico</p>
                        </div>
                    </Card>
                    <Card className="p-6 border-l-4 border-l-teal-500 bg-teal-50/30">
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-teal-700 uppercase">Documentos</p>
                            <h3 className="text-2xl font-bold text-teal-800">04 Pendentes</h3>
                            <p className="text-xs text-teal-600">Renovação de licenças</p>
                        </div>
                    </Card>
                </div>

                {/* Activity and Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <FileCheck className="w-5 h-5 text-teal-500" />
                                Monitoramento de Lotes Controlados (SNGPC)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { medicament: 'Amoxicilina 500mg', batch: '2023X45', expiry: '12/2024', stock: 45, status: 'ok' },
                                    { medicament: 'Clonazepam 2mg', batch: 'Z988Y12', expiry: '06/2024', stock: 12, status: 'warning' },
                                    { medicament: 'Ibuprofeno 600mg', batch: 'H771A02', expiry: '02/2025', stock: 110, status: 'ok' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors">
                                        <div className="flex-1">
                                            <p className="font-bold text-neutral-900">{item.medicament}</p>
                                            <div className="flex gap-4 mt-1">
                                                <span className="text-[10px] text-neutral-400">LOTE: <strong>{item.batch}</strong></span>
                                                <span className="text-[10px] text-neutral-400">VAL: <strong>{item.expiry}</strong></span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-sm font-bold">{item.stock} un</p>
                                                <p className="text-[10px] text-neutral-400">Em estoque</p>
                                            </div>
                                            <Badge className={item.status === 'ok' ? 'bg-green-100 text-green-700 border-none' : 'bg-red-100 text-red-700 border-none'}>
                                                {item.status === 'ok' ? 'Conforme' : 'Auditoria'}
                                            </Badge>
                                            <Button variant="ghost" size="icon">
                                                <Eye className="w-4 h-4 text-neutral-400" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <History className="w-5 h-5 text-teal-500" />
                                Histórico de Auditoria
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {[
                                { date: '20/12', user: 'Alisson C.', action: 'Conferência de Estoque Controlado', type: 'SNGPC' },
                                { date: '18/12', user: 'Sist.', action: 'Geração automática de boletim trimestral', type: 'Rep.' },
                                { date: '15/12', user: 'Mariana K.', action: 'Inserção de novo lote de Psicotrópicos', type: 'Lote' },
                            ].map((log, i) => (
                                <div key={i} className="relative pl-6 pb-6 border-l border-neutral-100 last:border-0 last:pb-0">
                                    <div className="absolute left-[-5px] top-0 w-[9px] h-[9px] rounded-full bg-teal-500 ring-4 ring-teal-50"></div>
                                    <p className="text-[10px] font-bold text-teal-600 mb-1">{log.date} - {log.type}</p>
                                    <p className="text-sm font-bold text-neutral-900 leading-tight">{log.action}</p>
                                    <p className="text-xs text-neutral-500 mt-1">Por: {log.user}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
