import { motion } from 'framer-motion';
import { Sparkles, Megaphone, Target, BarChart, Send, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';

const campaigns = [
    { id: '1', name: 'Promoção Verão 2024', type: 'E-mail Marketing', status: 'Ativa', reaches: '1.2k', conversion: '4.5%' },
    { id: '2', name: 'Cupom Primeira Compra', type: 'WhatsApp Business', status: 'Pausada', reaches: '850', conversion: '12.2%' },
    { id: '3', name: 'Aniversário da Loja', type: 'SMS', status: 'Agendada', reaches: '3.0k', conversion: '0%' },
];

export default function MarketingPage() {
    return (
        <MainLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-3">
                            Marketing Hub
                            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                        </h1>
                        <p className="text-neutral-600 dark:text-neutral-400 mt-2 font-medium">
                            Engaje seus clientes com campanhas inteligentes e automação.
                        </p>
                    </div>
                    <Button className="h-12 px-6 rounded-2xl font-bold flex gap-2 shadow-lg hover:scale-105 transition-transform bg-primary text-white">
                        <Plus className="w-5 h-5" />
                        Nova Campanha
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Campanhas Ativas', value: '05', icon: Megaphone, color: 'blue' },
                        { label: 'Clientes Alcançados', value: '15.4k', icon: Send, color: 'green' },
                        { label: 'Conversão Média', value: '8.2%', icon: Target, color: 'pink' },
                        { label: 'Custo por Lead', value: 'R$ 2,45', icon: BarChart, color: 'amber' },
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

                {/* Campaigns List */}
                <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                            <Input placeholder="Buscar campanhas..." className="pl-10 h-10 rounded-xl" />
                        </div>
                        <Button variant="outline" className="rounded-xl flex gap-2">
                            <Filter className="w-4 h-4" />
                            Filtrar por Canal
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-neutral-50 dark:bg-black/20 text-left">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-neutral-400">Nome da Campanha</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-neutral-400">Canal</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-neutral-400">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-neutral-400">Alcance</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-neutral-400">Conversão</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-neutral-400 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {campaigns.map((c) => (
                                    <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-neutral-900 dark:text-neutral-50">{c.name}</span>
                                        </td>
                                        <td className="px-6 py-4 lowercase text-sm font-medium">{c.type}</td>
                                        <td className="px-6 py-4">
                                            <Badge className={cn("rounded-full", c.status === 'Ativa' ? "bg-green-500 hover:bg-green-600 text-white border-transparent" : c.status === 'Agendada' ? "bg-blue-500 hover:bg-blue-600 text-white border-transparent" : "bg-neutral-500 hover:bg-neutral-600 text-white border-transparent")}>
                                                {c.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold">{c.reaches}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-green-600">{c.conversion}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm" className="rounded-lg">Analytics</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
