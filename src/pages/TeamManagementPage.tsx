import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    UserCheck,
    DollarSign,
    Calendar,
    Star,
    Plus,
    MessageSquare,
    ChevronRight,
    Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function TeamManagementPage() {
    return (
        <MainLayout>
            <div className="w-full max-w-[95%] mx-auto px-4 py-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 tracking-tight mb-2">
                            Minha Equipe
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                            <Users className="w-5 h-5 text-pink-500" />
                            Gestão de profissionais, comissões e horários de atendimento
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button className="bg-pink-600 hover:bg-pink-700 text-white gap-2 shadow-lg shadow-pink-500/20">
                            <Plus className="w-4 h-4" />
                            Novo Profissional
                        </Button>
                    </div>
                </div>

                {/* Team Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Membros', value: '08', icon: Users, color: 'text-pink-600', bg: 'bg-pink-100' },
                        { label: 'Ativos Hoje', value: '06', icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100' },
                        { label: 'Comissão Mês', value: 'R$ 4.2k', icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-100' },
                        { label: 'Avaliação Média', value: '4.9', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100' },
                    ].map((stat, i) => (
                        <Card key={i} className="border-none shadow-xl">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
                                        <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                                    </div>
                                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Professionals List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {[
                        { name: 'Ricardo Oliveira', role: 'Barbeiro Master', commission: '40%', status: 'active', rating: 5.0, image: 'RO' },
                        { name: 'Letícia Lima', role: 'Manicure & Pedicure', commission: '50%', status: 'active', rating: 4.8, image: 'LL' },
                        { name: 'Bruno Souza', role: 'Cabeleireiro Especialista', commission: '45%', status: 'offline', rating: 4.9, image: 'BS' },
                        { name: 'Carla Dias', role: 'Esteticista', commission: '35%', status: 'active', rating: 5.0, image: 'CD' },
                    ].map((member, i) => (
                        <Card key={i} className="border-none shadow-xl overflow-hidden group">
                            <CardContent className="p-0 flex">
                                <div className="w-32 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-4xl font-black text-neutral-300 dark:text-neutral-700">
                                    {member.image}
                                </div>
                                <div className="flex-1 p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold text-neutral-900 group-hover:text-pink-600 transition-colors">{member.name}</h3>
                                            <p className="text-sm text-neutral-500">{member.role}</p>
                                        </div>
                                        <Badge variant={member.status === 'active' ? 'secondary' : 'outline'} className="capitalize">
                                            {member.status}
                                        </Badge>
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">Comissão</p>
                                            <p className="text-sm font-bold text-neutral-700">{member.commission}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">Avaliação</p>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                <span className="text-sm font-bold text-neutral-700">{member.rating}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Button size="sm" variant="outline" className="flex-1 gap-2">
                                            <Calendar className="w-3 h-3 text-neutral-400" />
                                            Agenda
                                        </Button>
                                        <Button size="sm" variant="outline" className="flex-1 gap-2">
                                            <MessageSquare className="w-3 h-3 text-neutral-400" />
                                            Chat
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
}
