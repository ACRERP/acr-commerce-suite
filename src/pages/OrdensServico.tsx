import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, Wrench, Clock, CheckCircle, AlertCircle, Save, Loader2, Search, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Mock mutation since hook doesn't exist yet
const useCreateOS = () => {
  const [isPending, setIsPending] = useState(false);
  return {
    mutate: (data: any, options: any) => {
      setIsPending(true);
      setTimeout(() => {
        setIsPending(false);
        options.onSuccess();
      }, 1000);
    },
    isPending
  };
};

const CreateOSDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const [clientName, setClientName] = useState("");
  const [device, setDevice] = useState("");
  const [description, setDescription] = useState("");
  const createOSMutation = useCreateOS();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOSMutation.mutate({ clientName, device, description }, {
      onSuccess: () => {
        toast({ title: "Ordem de Serviço criada!" });
        onOpenChange(false);
        setClientName("");
        setDevice("");
        setDescription("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Serviço</DialogTitle>
          <DialogDescription>
            Registre a entrada de um novo aparelho para manutenção.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Input
              id="client"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Nome do cliente"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="device">Dispositivo / Modelo</Label>
            <Input
              id="device"
              value={device}
              onChange={e => setDevice(e.target.value)}
              placeholder="Ex: iPhone 13 Pro"
              required
              className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 focus:ring-primary-500 hover:border-primary-400 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição do Problema</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva o defeito relatado..."
              className="h-24"
            />
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createOSMutation.isPending}>
              {createOSMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Abrir OS
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ... existing code ...

// Mock Data & Config
const statusConfig = {
  aberta: { label: 'Aberta', color: 'blue' },
  em_andamento: { label: 'Em Andamento', color: 'amber' },
  aguardando_peca: { label: 'Aguardando Peça', color: 'orange' },
  concluida: { label: 'Concluída', color: 'green' },
  entregue: { label: 'Entregue', color: 'purple' },
  cancelada: { label: 'Cancelada', color: 'red' }
};

const statusTextColorClasses: Record<string, string> = {
  blue: 'text-blue-600 border-blue-200 bg-blue-50',
  amber: 'text-amber-600 border-amber-200 bg-amber-50',
  orange: 'text-orange-600 border-orange-200 bg-orange-50',
  green: 'text-green-600 border-green-200 bg-green-50',
  purple: 'text-purple-600 border-purple-200 bg-purple-50',
  red: 'text-red-600 border-red-200 bg-red-50'
};

const mockOrders = [
  { id: 1, client: 'João Silva', device: 'iPhone 13', status: 'em_andamento' },
  { id: 2, client: 'Maria Souza', device: 'Samsung S21', status: 'aguardando_peca' },
  { id: 3, client: 'Pedro Santos', device: 'Dell XPS', status: 'concluida' }
];

const OrdensServico = () => {
  const [isNewOSOpen, setIsNewOSOpen] = useState(false);

  return (
    <MainLayout>
      <div className="container-premium py-8 space-y-8 animate-fade-in-up">
        {/* Header Premium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
              Ordens de Serviço
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Gerencie manutenções e reparos técnicos
            </p>
          </div>
          <Button
            onClick={() => setIsNewOSOpen(true)}
            className="btn-primary hover-lift gap-2 shadow-lg shadow-primary-500/20"
          >
            <Plus className="w-4 h-4" />
            Nova OS
          </Button>
        </div>

        <CreateOSDialog open={isNewOSOpen} onOpenChange={setIsNewOSOpen} />

        {/* Stats Grid Premium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Em Andamento", value: 8, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30", icon: Clock },
            { label: "Aguardando", value: 5, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", icon: AlertCircle },
            { label: "Concluídas Hoje", value: 12, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30", icon: CheckCircle },
          ].map((stat, index) => (
            <div key={stat.label} className="card-premium hover-lift group relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110`} />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search Section Premium */}
        <div className="card-premium p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Buscar ordem de serviço..."
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

        {/* Ordens Recentes Premium */}
        <div className="card-premium overflow-hidden">
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
            <h3 className="font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-neutral-500" />
              Ordens Recentes
            </h3>
          </div>
          <div className="space-y-0 divide-y divide-neutral-100 dark:divide-neutral-800">
            {mockOrders.map((order, index) => {
              const status = statusConfig[order.status as keyof typeof statusConfig];
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{order.client}</p>
                      <p className="text-sm text-neutral-500">{order.device}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full border ${statusTextColorClasses[status.color]}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
            })}
          </div>
        </div>
      </div>
    </MainLayout >
  );
};

export default OrdensServico;
