import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Briefcase,
    Calendar,
    CheckCircle2,
    Clock,
    BarChart3,
    Plus,
    Search,
    MoreHorizontal,
    Layout
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ProjectsPage() {
    return (
        <MainLayout>
            <div className="w-full max-w-[95%] mx-auto px-4 py-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 tracking-tight mb-2">
                            Gestão de Projetos
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-emerald-500" />
                            Acompanhamento de obras, propostas e cronogramas corporativos
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-500/20">
                            <Plus className="w-4 h-4" />
                            Novo Projeto
                        </Button>
                    </div>
                </div>

                {/* Project Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Em Andamento', value: '14', icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                        { label: 'Finalizados', value: '56', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-100' },
                        { label: 'Atrasados', value: '02', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
                        { label: 'Produtividade', value: '94%', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-100' },
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

                {/* Kanban Board Shell */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto pb-4">
                    {[
                        {
                            title: 'Planejamento', tasks: [
                                { name: 'Projeto Residencial Jd. América', client: 'Alice Souza', priority: 'Média' },
                                { name: 'Reforma Escritório Central', client: 'Tech Solutions', priority: 'Alta' }
                            ], color: 'border-t-blue-500'
                        },
                        {
                            title: 'Execução', tasks: [
                                { name: 'Condomínio Solar das Palmeiras', client: 'Gafisa Corp', priority: 'Alta' }
                            ], color: 'border-t-amber-500'
                        },
                        {
                            title: 'Entrega', tasks: [
                                { name: 'Pintura Fachada Ed. Real', client: 'Condomínio Real', priority: 'Baixa' }
                            ], color: 'border-t-emerald-500'
                        },
                    ].map((column, i) => (
                        <div key={i} className={`flex-1 min-w-[300px] space-y-4`}>
                            <div className={`flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl border-t-4 ${column.color}`}>
                                <h3 className="font-bold text-sm uppercase tracking-widest text-neutral-500">{column.title}</h3>
                                <Badge variant="outline">{column.tasks.length}</Badge>
                            </div>
                            <div className="space-y-4">
                                {column.tasks.map((task, j) => (
                                    <div key={j} className="p-4 bg-white dark:bg-neutral-900 rounded-xl shadow-md border border-neutral-100 dark:border-neutral-800 hover:border-emerald-500/50 transition-all cursor-move group">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge className={task.priority === 'Alta' ? 'bg-red-50 text-red-600' : 'bg-neutral-50 text-neutral-600'}>
                                                {task.priority}
                                            </Badge>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <h4 className="font-bold text-neutral-900 dark:text-neutral-100 leading-tight mb-1">{task.name}</h4>
                                        <p className="text-xs text-neutral-500 flex items-center gap-1 mb-4">
                                            <Users className="w-3 h-3" /> {task.client}
                                        </p>
                                        <div className="flex justify-between items-center pt-3 border-t border-neutral-50 dark:border-neutral-800">
                                            <div className="flex -space-x-2">
                                                <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white dark:border-neutral-900"></div>
                                                <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white dark:border-neutral-900"></div>
                                            </div>
                                            <span className="text-[10px] text-neutral-400 font-bold uppercase">4 Atividades</span>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="ghost" className="w-full border-dashed border-2 text-neutral-400 hover:text-emerald-600 hover:border-emerald-500 h-10">
                                    <Plus className="w-4 h-4 mr-2" /> Novo Item
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
}

// Missing icon used
const AlertCircle = (props) => <Layout {...props} />;
const Users = (props) => <Calendar {...props} />;
