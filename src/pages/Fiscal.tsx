import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import { getFiscalSummary, getFiscalNotes } from '@/services/dashboard-service';
import {
  FileText,
  Receipt,
  Calculator,
  FileCheck,
  AlertTriangle,
  Settings,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Landmark
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmitirNotaDialog } from "@/components/fiscal/EmitirNotaDialog";
import { useState } from "react";

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  autorizada: { label: "Autorizada", className: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
  cancelada: { label: "Cancelada", className: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  pendente: { label: "Pendente", className: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
};

const Fiscal = () => {
  const navigate = useNavigate();
  const [emitirNotaOpen, setEmitirNotaOpen] = useState(false);

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['fiscal-summary'],
    queryFn: getFiscalSummary
  });

  const { data: notes, isLoading: loadingNotes } = useQuery({
    queryKey: ['fiscal-notes'],
    queryFn: getFiscalNotes
  });

  return (
    <MainLayout>
      <div className="container-premium py-8 space-y-8 animate-fade-in-up">
        {/* Header Premium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
              Fiscal & Tributário
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <Landmark className="w-5 h-5" />
              Gestão inteligente de notas fiscais e obrigações
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="btn-secondary gap-2 hover-lift" onClick={() => navigate('/fiscal/configuracoes')}>
              <Settings className="w-4 h-4" />
              Configurações
            </Button>
            <Button
              className="btn-primary hover-lift gap-2 shadow-lg shadow-primary-500/20"
              onClick={() => setEmitirNotaOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Emitir NF-e
            </Button>
          </div>
        </div>

        <EmitirNotaDialog
          open={emitirNotaOpen}
          onOpenChange={setEmitirNotaOpen}
        />

        {/* Stats Grid Premium */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* NF-e Emitidas */}
          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Notas Emitidas</p>
                {loadingSummary ? (
                  <Skeleton className="h-9 w-24" />
                ) : (
                  <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">{summary?.issued_invoices || 0}</h3>
                )}
                <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 font-medium">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>Este mês</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 transition-transform duration-300 group-hover:scale-110">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* NFC-e Emitidas (Mantido estático pois RPC agrupa tudo por enquanto, ou usar 0) */}
          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 dark:bg-purple-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">NFC-e (Consumidor)</p>
                <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">-</h3>
                <div className="flex items-center gap-1 mt-2 text-xs text-purple-600 font-medium">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>Em breve</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 transition-transform duration-300 group-hover:scale-110">
                <Receipt className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Impostos Estimados */}
          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 dark:bg-orange-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Impostos (Est.)</p>
                {loadingSummary ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400 tracking-tight">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary?.estimated_taxes || 0)}
                  </h3>
                )}
                <div className="w-full bg-orange-200/50 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: '65%' }}></div>
                </div>
                <p className="text-[10px] text-orange-600/80 mt-1 font-medium text-right">Simples Nacional (6%)</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 transition-transform duration-300 group-hover:scale-110">
                <Calculator className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* SPED / Obrigações */}
          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 dark:bg-red-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Obrigações</p>
                <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">2</h3>
                <div className="flex items-center gap-1 mt-2 text-xs text-red-600 font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Pendentes de envio</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 transition-transform duration-300 group-hover:scale-110">
                <FileCheck className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Section Premium */}
        <div className="card-premium p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Buscar nota fiscal por número ou valor..."
                className="pl-10 h-10 bg-neutral-50 border-neutral-200 focus:bg-white transition-all"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" className="flex-1 md:flex-none hover:bg-neutral-50">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Notas Inteligente */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-premium overflow-hidden">
              <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-500" />
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white">Movimentação Fiscal Real</h3>
                </div>
              </div>

              <div className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-50/50 dark:bg-neutral-900/20 hover:bg-neutral-50/50">
                      <TableHead className="font-semibold">Nota Fiscal</TableHead>
                      <TableHead className="font-semibold">Série</TableHead>
                      <TableHead className="font-semibold text-center">Tipo</TableHead>
                      <TableHead className="font-semibold text-center">Status</TableHead>
                      <TableHead className="font-semibold text-right">Valor</TableHead>
                      <TableHead className="font-semibold text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingNotes ? (
                      [1, 2, 3].map(i => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8 mx-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      notes?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-neutral-500">
                            Nenhuma nota fiscal encontrada no período.
                          </TableCell>
                        </TableRow>
                      ) : (
                        notes?.map((note: any) => {
                          const status = statusConfig[note.status] || statusConfig['pendente'];
                          const StatusIcon = status.icon;
                          return (
                            <TableRow key={note.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                              <TableCell className="font-medium text-primary-600">
                                Nº {note.numero}
                                <span className="block text-xs font-normal text-neutral-500">
                                  {new Date(note.data_emissao).toLocaleDateString()}
                                </span>
                              </TableCell>
                              <TableCell className="font-medium text-neutral-900 dark:text-white">{note.serie}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="font-mono bg-neutral-100 text-neutral-600 border-0">{note.tipo}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={`${status.className} border-0 px-2 py-0.5 inline-flex items-center gap-1`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-bold text-neutral-900 dark:text-white">
                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(note.valor_total)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0">
                                  <Download className="w-4 h-4 text-neutral-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Calendário Fiscal & Tributos */}
          <div className="space-y-6">
            <div className="card-premium overflow-hidden">
              <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-500" />
                  Agenda Tributária
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {[
                  { name: "DAS - Simples Nacional", due: "20/01", value: "R$ 4.250,00", days: 5, status: "pending" },
                  { name: "SPED Fiscal (ICMS/IPI)", due: "25/01", value: "-", days: 10, status: "pending" },
                  { name: "FGTS Mensal", due: "07/02", value: "R$ 890,00", days: 23, status: "ok" },
                  { name: "DCTFWeb", due: "15/02", value: "-", days: 31, status: "ok" },
                ].map((item, index) => (
                  <div key={index} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${item.status === 'pending' ? 'bg-white border-orange-100 hover:border-orange-200 hover:shadow-md' : 'bg-neutral-50 border-neutral-100 opacity-70'}`}>
                    <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border ${item.status === 'pending' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-neutral-200 text-neutral-400'}`}>
                      <span className="text-[10px] font-bold uppercase">{item.due.split('/')[1] === '01' ? 'JAN' : 'FEV'}</span>
                      <span className="text-lg font-bold">{item.due.split('/')[0]}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-1">{item.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs font-mono text-neutral-500">{item.value}</p>
                        {item.status === 'pending' ? (
                          <Badge variant="outline" className="text-[10px] h-5 bg-orange-100 text-orange-700 border-0 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Em {item.days} dias
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] h-5 bg-neutral-100 text-neutral-500 border-0">
                            No prazo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-premium bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0">
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">Simulador de Impostos</h3>
                <p className="text-primary-100 text-sm mb-4">Calcule a previsão de impostos para o próximo fechamento baseado no faturamento atual.</p>
                <Button variant="secondary" className="w-full bg-white text-primary-600 hover:bg-primary-50 hover:text-primary-700 border-0 shadow-lg">
                  <Calculator className="w-4 h-4 mr-2" />
                  Simular Agora
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout >
  );
};

export default Fiscal;
