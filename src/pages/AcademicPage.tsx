import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    GraduationCap,
    Users,
    BookOpen,
    Calendar,
    FileText,
    TrendingUp,
    Plus,
    Search,
    MoreVertical
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { academicService } from "@/lib/modules/academic-service";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AcademicPage() {
    const { data: students, isLoading } = useQuery({
        queryKey: ['academic-students'],
        queryFn: academicService.getRecentStudents
    });

    const { data: stats } = useQuery({
        queryKey: ['academic-stats'],
        queryFn: academicService.getStats
    });

    return (
        <MainLayout>
            <div className="w-full max-w-[95%] mx-auto px-4 py-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 tracking-tight mb-2">
                            Gestão Acadêmica
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-indigo-500" />
                            Controle de matrículas, turmas e desempenho escolar
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-500/20">
                            <Plus className="w-4 h-4" />
                            Nova Matrícula
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Alunos Ativos', value: stats?.activeStudents || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
                        { label: 'Turmas', value: stats?.totalClasses || 0, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-100' },
                        { label: 'Aulas Hoje', value: '-', icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-100' },
                        { label: 'Inadimplência', value: '-', icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-100' },
                    ].map((stat, i) => (
                        <Card key={i} className="border-none shadow-xl hover:-translate-y-1 transition-all">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
                                        <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
                                    </div>
                                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Alunos Recentes */}
                    <Card className="lg:col-span-2 border-none shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-xl font-bold">Matrículas Recentes</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <Input placeholder="Buscar aluno..." className="pl-10 h-9" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-neutral-100">
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="w-10 h-10 rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-20" />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : students?.length === 0 ? (
                                    <div className="py-8 text-center text-neutral-500">
                                        Nenhum aluno matriculado recentemente.
                                    </div>
                                ) : (
                                    students?.map((student, i) => (
                                        <div key={student.id} className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                                    {student.name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-neutral-900">{student.name}</p>
                                                    <p className="text-xs text-neutral-500">{student.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge variant={student.status === 'active' ? 'secondary' : 'outline'}>
                                                    {student.status === 'active' ? 'Ativo' : 'Inativo'}
                                                </Badge>
                                                <span className="text-xs text-neutral-400">
                                                    {format(new Date(student.created_at), 'dd/MM', { locale: ptBR })}
                                                </span>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )))}
                            </div>
                            <Button variant="ghost" className="w-full mt-4 text-indigo-600">Ver todos os alunos</Button>
                        </CardContent>
                    </Card>

                    {/* Próximas Aulas / Eventos */}
                    <Card className="border-none shadow-xl bg-indigo-600 text-white">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-200" />
                                Próximas Aulas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { time: '14:00', title: 'Física I', room: 'Sala 04' },
                                { time: '15:30', title: 'Literatura', room: 'Laboratório A' },
                                { time: '17:00', title: 'História Geral', room: 'Auditório' },
                            ].map((lesson, i) => (
                                <div key={i} className="p-3 rounded-xl bg-white/10 border border-white/20">
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-bold text-indigo-200">{lesson.time}</span>
                                        <Badge className="bg-white/20 text-[10px] uppercase border-none">{lesson.room}</Badge>
                                    </div>
                                    <h4 className="font-bold mt-1 text-base">{lesson.title}</h4>
                                </div>
                            ))}
                            <div className="pt-4 border-t border-white/10 mt-4">
                                <p className="text-xs text-indigo-200 mb-2">Lembrete de Hoje:</p>
                                <div className="flex gap-2 p-2 rounded-lg bg-yellow-400 text-yellow-900 font-bold text-xs items-center">
                                    <FileText className="w-4 h-4" />
                                    Consolidar notas do 3º Bimestre
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
