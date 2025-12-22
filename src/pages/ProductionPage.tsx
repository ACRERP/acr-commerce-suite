import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ChefHat,
    Flame,
    PackageCheck,
    Clock,
    Scale,
    Plus,
    ChevronRight,
    Search,
    TrendingUp
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ProductionPage() {
    return (
        <MainLayout>
            <div className="w-full max-w-[95%] mx-auto px-4 py-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 tracking-tight mb-2">
                            Centro de Produção
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                            <ChefHat className="w-5 h-5 text-orange-500" />
                            Controle de fornadas, receitas e estoque de matérias-primas
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2 shadow-lg shadow-orange-500/20">
                            <Flame className="w-4 h-4" />
                            Nova Fornada
                        </Button>
                    </div>
                </div>

                {/* Production Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Produzido Hoje', value: '420 kg', icon: Scale, color: 'text-orange-600', bg: 'bg-orange-100' },
                        { label: 'Fornadas Ativas', value: '03', icon: Flame, color: 'text-red-600', bg: 'bg-red-100' },
                        { label: 'Matéria-Prima', value: '88%', icon: PackageCheck, color: 'text-green-600', bg: 'bg-green-100' },
                        { label: 'Custo Médio', value: 'R$ 12.40', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
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

                {/* Production Queue */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 border-none shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-500" />
                                Fila de Produção
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { item: 'Pão Francês Tradicional', qty: '200 un', progress: 80, time: '15 min restante', type: 'Assando' },
                                    { item: 'Bolo de Milho Cremoso', qty: '12 un', progress: 30, time: '45 min restante', type: 'Preparando' },
                                    { item: 'Pão de Queijo Mineiro', qty: '500 un', progress: 0, time: 'Aguardando', type: 'Fila' },
                                ].map((step, i) => (
                                    <div key={i} className="p-4 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-neutral-900">{step.item}</h4>
                                                <p className="text-xs text-neutral-500">Lote #{1024 + i} • Meta: {step.qty}</p>
                                            </div>
                                            <Badge variant={step.type === 'Assando' ? 'secondary' : 'outline'}>
                                                {step.type}
                                            </Badge>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-bold uppercase text-neutral-400">
                                                <span>Progresso</span>
                                                <span>{step.progress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-orange-500 transition-all duration-1000"
                                                    style={{ width: `${step.progress}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-right text-[10px] text-neutral-500">{step.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-neutral-900">
                                <Scale className="w-5 h-5 text-orange-500" />
                                Matérias-Primas Críticas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { item: 'Farinha de Trigo Especial', stock: '120 kg', min: '200 kg', level: 40 },
                                { item: 'Manteiga com Sal', stock: '15 kg', min: '50 kg', level: 25 },
                                { item: 'Fermento Biológico', stock: '2 kg', min: '10 kg', level: 15 },
                            ].map((ingredient, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span>{ingredient.item}</span>
                                        <span className="text-red-600">{ingredient.stock}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-500"
                                            style={{ width: `${ingredient.level}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" className="w-full mt-4 border-red-200 text-red-600 hover:bg-red-50 gap-2">
                                <Plus className="w-4 h-4" />
                                Comprar Ingredientes
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
