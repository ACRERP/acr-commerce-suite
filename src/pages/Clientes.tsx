import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarIcon, Loader2 } from "lucide-react";
import { CreateClientDialog } from "@/components/clients/CreateClientDialog";
import { useState } from "react";
import { useClients } from "@/hooks/useClients";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Download, Plus, Users, UserPlus, Star, TrendingUp, Search, Filter, Mail, Phone, Clock, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getSegmentBadge = (segment: string) => {
  switch (segment) {
    case 'VIP': return { label: 'VIP', className: 'bg-purple-100 text-purple-700 hover:bg-purple-200' };
    case 'Needs Attention': return { label: 'Atenção', className: 'bg-amber-100 text-amber-700 hover:bg-amber-200' };
    case 'Risk': return { label: 'Risco', className: 'bg-red-100 text-red-700 hover:bg-red-200' };
    case 'Opportunity': return { label: 'Oportunidade', className: 'bg-green-100 text-green-700 hover:bg-green-200' };
    default: return { label: segment || 'Padrão', className: 'bg-gray-100 text-gray-700 hover:bg-gray-200' };
  }
};

const Clientes = () => {
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);

  // Using hooks but keeping mock display if needed for layout stability during verification
  const { data: clientsData, isLoading } = useClients();

  return (
    <MainLayout>
      <div className="container-premium py-8 space-y-8 animate-fade-in-up">

        {/* Header Section Premium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
              Gestão de Clientes
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Base de clientes, segmentação e histórico
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="btn-secondary gap-2 hover-lift">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <Button
              onClick={() => setIsNewClientOpen(true)}
              className="btn-primary hover-lift gap-2 shadow-lg shadow-primary-500/20"
            >
              <Plus className="w-4 h-4" />
              Novo Cliente
            </Button>
          </div>
        </div>

        <CreateClientDialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen} />

        {/* Stats Grid Premium */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Base Total</p>
                <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">1.248</h3>
              </div>
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 dark:bg-green-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Novos (Mês)</p>
                <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">45</h3>
              </div>
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 group-hover:scale-110 transition-transform duration-300">
                <UserPlus className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 dark:bg-purple-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Clientes VIP</p>
                <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">89</h3>
              </div>
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 group-hover:scale-110 transition-transform duration-300">
                <Star className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 dark:bg-orange-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">LTV Médio</p>
                <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">R$ 259</h3>
              </div>
              <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters Premium */}
        <div className="card-premium p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
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

        {/* Clients Table Premium */}
        <div className="card-premium p-0 overflow-hidden">

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                  <th className="text-left py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Cliente</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Contato</th>
                  <th className="text-center py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Compras</th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">LTV</th>
                  <th className="text-center py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Última Compra</th>
                  <th className="text-center py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Segmento</th>
                  <th className="w-10 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Carregando clientes...
                      </div>
                    </td>
                  </tr>
                ) : clientsData?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : (
                  clientsData?.map((client) => {
                    const segmentBadge = getSegmentBadge('Needs Attention'); // Default for now as segmentation is complex
                    return (
                      <tr
                        key={client.id}
                        className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-premium-800/50 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm group-hover:scale-110 transition-transform duration-300 shadow-sm border border-primary-200 dark:border-premium-700">
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">{client.name}</span>
                              <span className="text-xs text-neutral-500 font-mono">ID: {client.id.toString().padStart(4, '0')}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            {client.email && (
                              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                <Mail className="w-3 h-3" />
                                {client.email}
                              </div>
                            )}
                            {(client.phone || client.whatsapp) && (
                              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                <Phone className="w-3 h-3" />
                                {client.phone || client.whatsapp}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <Badge variant="secondary" className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200">
                            {client.total_purchases || 0}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-neutral-900 dark:text-neutral-100">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(client.total_spent || 0)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 py-1 px-2 rounded-lg inline-block w-auto">
                            <Clock className="w-3 h-3" />
                            {client.last_purchase_date
                              ? new Date(client.last_purchase_date).toLocaleDateString('pt-BR')
                              : '-'}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <Badge className={`font-medium shadow-none ${segmentBadge.className}`}>
                            {segmentBadge.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                              <DropdownMenuItem>Editar cliente</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">Desativar cliente</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
            <span className="text-sm text-neutral-500">Mostrando 8 de 1248 clientes</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled className="h-8">Anterior</Button>
              <Button variant="outline" size="sm" className="h-8">Próximo</Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Clientes;
