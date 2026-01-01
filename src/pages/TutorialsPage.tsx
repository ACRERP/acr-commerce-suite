import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Play } from 'lucide-react';

interface Tutorial {
    id: string;
    title: string;
    description: string;
    category: string;
    thumbnail: string;
    duration: string;
    videoUrl: string;
}

const tutorials: Tutorial[] = [
    {
        id: '1',
        title: 'Primeiros Passos no ACR ERP',
        description: 'Aprenda a navegar pelo sistema e configurar sua empresa',
        category: 'Primeiros Passos',
        thumbnail: 'https://via.placeholder.com/320x180?text=Primeiros+Passos',
        duration: '5:30',
        videoUrl: '#', // Placeholder - substituir por YouTube
    },
    {
        id: '2',
        title: 'Como cadastrar produtos',
        description: 'Tutorial completo sobre cadastro de produtos e categorias',
        category: 'Produtos',
        thumbnail: 'https://via.placeholder.com/320x180?text=Cadastro+Produtos',
        duration: '8:15',
        videoUrl: '#',
    },
    {
        id: '3',
        title: 'Usando o PDV',
        description: 'Aprenda a fazer vendas rápidas no ponto de venda',
        category: 'PDV',
        thumbnail: 'https://via.placeholder.com/320x180?text=PDV',
        duration: '6:45',
        videoUrl: '#',
    },
    {
        id: '4',
        title: 'Gestão Financeira',
        description: 'Controle seu fluxo de caixa e contas a pagar/receber',
        category: 'Financeiro',
        thumbnail: 'https://via.placeholder.com/320x180?text=Financeiro',
        duration: '10:20',
        videoUrl: '#',
    },
];

const categories = ['Todos', 'Primeiros Passos', 'Produtos', 'PDV', 'Financeiro'];

export default function TutorialsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');

    const filteredTutorials = tutorials.filter(tutorial => {
        const matchesSearch = tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'Todos' || tutorial.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="container mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">🎥 Tutoriais em Vídeo</h1>
                <p className="text-gray-600">
                    Aprenda a usar o ACR ERP com nossos tutoriais em vídeo
                </p>
            </div>

            {/* Busca */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Buscar tutoriais..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Categorias */}
            <div className="mb-6 flex flex-wrap gap-2">
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-lg transition-colors ${selectedCategory === category
                            ? 'bg-[#A4FF00] text-[#1A5F1F] font-bold'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Grid de Tutoriais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTutorials.map((tutorial) => (
                    <Card key={tutorial.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="relative group">
                            <img
                                src={tutorial.thumbnail}
                                alt={tutorial.title}
                                className="w-full h-48 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="w-16 h-16 text-white" />
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                                {tutorial.duration}
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="text-xs text-[#A4FF00] font-bold mb-1">
                                {tutorial.category}
                            </div>
                            <h3 className="font-bold text-lg mb-2">{tutorial.title}</h3>
                            <p className="text-sm text-gray-600">{tutorial.description}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredTutorials.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <p>Nenhum tutorial encontrado</p>
                    <p className="text-sm mt-2">Tente buscar por outros termos ou selecione outra categoria</p>
                </div>
            )}

            {/* Footer */}
            <Card className="mt-8 p-6 bg-gradient-to-r from-[#A4FF00]/10 to-[#1A5F1F]/10 border-[#A4FF00]/20">
                <div className="text-center">
                    <p className="font-bold mb-2">Quer um tutorial específico?</p>
                    <p className="text-sm text-gray-600 mb-4">
                        Envie sua sugestão para nosso suporte
                    </p>
                    <div className="flex justify-center gap-4 text-sm">
                        <a
                            href="https://wa.me/5511988425669"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#25D366] hover:underline"
                        >
                            📞 WhatsApp: (11) 98842-5669
                        </a>
                        <a
                            href="mailto:acrerptech@gmail.com"
                            className="text-blue-600 hover:underline"
                        >
                            📧 acrerptech@gmail.com
                        </a>
                    </div>
                </div>
            </Card>
        </div>
    );
}

