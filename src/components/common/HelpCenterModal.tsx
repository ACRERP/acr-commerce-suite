import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, Mail, BookOpen, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HelpCenterModalProps {
    open: boolean;
    onClose: () => void;
}

export function HelpCenterModal({ open, onClose }: HelpCenterModalProps) {
    const navigate = useNavigate();

    const openWhatsApp = () => {
        window.open('https://wa.me/5511988425669?text=Olá! Preciso de suporte no ACR ERP', '_blank');
    };

    const openEmail = () => {
        window.location.href = 'mailto:acrerptech@gmail.com?subject=Suporte ACR ERP';
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">
                        🛠️ Central de Ajuda ACR
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Frase Inspiradora */}
                    <div className="text-center py-4 px-6 bg-gradient-to-r from-[#A4FF00]/10 to-[#1A5F1F]/10 rounded-lg border border-[#A4FF00]/20">
                        <p className="text-sm italic text-gray-700">
                            "Fazer a diferença e reconhecer a essência do próximo"
                        </p>
                    </div>

                    {/* Fale com a gente */}
                    <div>
                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                            💬 Fale com a gente
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                onClick={openWhatsApp}
                                className="bg-[#25D366] hover:bg-[#20BA5A] text-white"
                            >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                WhatsApp
                            </Button>
                            <Button
                                onClick={openEmail}
                                variant="outline"
                            >
                                <Mail className="w-4 h-4 mr-2" />
                                Email
                            </Button>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 text-center">
                            📞 (11) 98842-5669 • 📧 acrerptech@gmail.com
                        </div>
                    </div>

                    {/* Recursos de Ajuda */}
                    <div>
                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                            📚 Recursos de Ajuda
                        </h3>
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => {
                                    navigate('/tutorials');
                                    onClose();
                                }}
                            >
                                <Video className="w-4 h-4 mr-2" />
                                🎥 Tutoriais em Vídeo
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => {
                                    navigate('/knowledge-base');
                                    onClose();
                                }}
                            >
                                <BookOpen className="w-4 h-4 mr-2" />
                                📖 Base de Conhecimento
                            </Button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-500 pt-4 border-t">
                        © 2026 ACR Software • Versão 1.0.0
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
