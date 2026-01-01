import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search } from 'lucide-react';
import { knowledgeBase } from '@/data/knowledge-base-data';
import ReactMarkdown from 'react-markdown';

export default function KnowledgeBasePage() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredKnowledgeBase = knowledgeBase.map(category => ({
        ...category,
        articles: category.articles.filter(article =>
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
    })).filter(category => category.articles.length > 0);

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">📖 Base de Conhecimento</h1>
                <p className="text-gray-600">
                    Encontre respostas para as perguntas mais frequentes
                </p>
            </div>

            {/* Busca */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Buscar artigos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Categorias e Artigos */}
            <div className="space-y-6">
                {filteredKnowledgeBase.map((category) => (
                    <Card key={category.category} className="p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span>{category.icon}</span>
                            {category.category}
                        </h2>

                        <Accordion type="single" collapsible className="w-full">
                            {category.articles.map((article) => (
                                <AccordionItem key={article.id} value={article.id}>
                                    <AccordionTrigger className="text-left">
                                        {article.title}
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="prose prose-sm max-w-none">
                                            <ReactMarkdown>{article.content}</ReactMarkdown>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {article.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </Card>
                ))}

                {filteredKnowledgeBase.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p>Nenhum artigo encontrado para "{searchQuery}"</p>
                        <p className="text-sm mt-2">Tente buscar por outros termos</p>
                    </div>
                )}
            </div>

            {/* Footer de Ajuda */}
            <Card className="mt-8 p-6 bg-gradient-to-r from-[#A4FF00]/10 to-[#1A5F1F]/10 border-[#A4FF00]/20">
                <div className="text-center">
                    <p className="font-bold mb-2">Não encontrou o que procurava?</p>
                    <p className="text-sm text-gray-600 mb-4">
                        Entre em contato com nosso suporte
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
