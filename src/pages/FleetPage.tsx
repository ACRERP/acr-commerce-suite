import { motion } from 'framer-motion';
import { Truck, Car, History, Settings, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { useQuery } from '@tanstack/react-query';
import { fleetService } from '@/lib/modules/fleet-service';
import { Skeleton } from '@/components/ui/skeleton';

export default function FleetPage() {
    const { data: vehicles, isLoading } = useQuery({
        queryKey: ['fleet-vehicles'],
        queryFn: fleetService.getVehicles
    });

    const { data: stats } = useQuery({
        queryKey: ['fleet-stats'],
        queryFn: fleetService.getStats
    });

    return (
        <MainLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
                            Frota / Veículos
                        </h1>
                        <p className="text-neutral-600 dark:text-neutral-400 mt-2 font-medium">
                            Gestão de logística, manutenção e rastreio de frota.
                        </p>
                    </div>
                    <Button className="h-12 px-6 rounded-2xl font-bold flex gap-2 shadow-lg hover:scale-105 transition-transform">
                        <Plus className="w-5 h-5" />
                        Novo Veículo
                    </Button>
                </div>

                {/* Analytics Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Veículos', value: stats?.total || 0, icon: Car, color: 'blue' },
                        { label: 'Em Trânsito', value: stats?.inTransit || 0, icon: Truck, color: 'green' },
                        { label: 'Manutenção', value: stats?.maintenance || 0, icon: Settings, color: 'amber' },
                        { label: 'Histórico Mensal', value: '-', icon: History, color: 'purple' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm"
                        >
                            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 flex items-center justify-center mb-4`}>
                                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                            </div>
                            <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">{stat.label}</p>
                            <p className="text-3xl font-black mt-1">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Filter & List */}
                <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                            <Input placeholder="Buscar por placa ou modelo..." className="pl-10 h-10 rounded-xl" />
                        </div>
                        <Button variant="outline" className="rounded-xl flex gap-2">
                            <Filter className="w-4 h-4" />
                            Filtros Avançados
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-neutral-50 dark:bg-black/20 text-left">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-neutral-400">Placa / Modelo</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-neutral-400">Tipo</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-neutral-400">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-neutral-400">Motorista Atual</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-neutral-400 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4"><Skeleton className="h-10 w-32" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                                            <td className="px-6 py-4 ml-auto"><Skeleton className="h-8 w-8 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : vehicles?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                                            Nenhum veículo cadastrado na frota.
                                        </td>
                                    </tr>
                                ) : (
                                    vehicles?.map((v) => (
                                        <tr key={v.id} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-neutral-900 dark:text-neutral-50">{v.plate}</span>
                                                    <span className="text-sm text-neutral-500">{v.model}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium">{v.type}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={cn("rounded-full",
                                                    v.status === 'available' ? "bg-green-500 hover:bg-green-600 text-white border-transparent" :
                                                        v.status === 'in_transit' ? "bg-blue-500 hover:bg-blue-600 text-white border-transparent" :
                                                            "bg-red-500 hover:bg-red-600 text-white border-transparent"
                                                )}>
                                                    {v.status === 'available' ? 'Disponível' : v.status === 'in_transit' ? 'Em Entrega' : 'Manutenção'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium">{v.driver?.name || '-'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" className="rounded-lg">Ver Detalhes</Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
