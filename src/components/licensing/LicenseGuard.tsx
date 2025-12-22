import { useEffect, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LicenseService } from '@/lib/licensing/license-service';
import { Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface LicenseGuardProps {
    children: ReactNode;
}

export function LicenseGuard({ children }: LicenseGuardProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [checking, setChecking] = useState(true);
    const [valid, setValid] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkLicense();

        // Revalidar a cada 1 hora
        const interval = setInterval(checkLicense, 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const checkLicense = async () => {
        try {
            const isValid = await LicenseService.checkLocalLicense();
            setValid(isValid);
            setChecking(false);

            if (!isValid) {
                // Salvar rota atual para redirecionar depois da ativação
                navigate('/activate', {
                    state: { from: location.pathname },
                    replace: true
                });
            }
        } catch (err) {
            setError('Erro ao verificar licença. Verifique sua conexão.');
            setChecking(false);
        }
    };

    if (checking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Verificando licença...</p>
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
                >
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro de Licença</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </motion.div>
            </div>
        );
    }

    return valid ? <>{children}</> : null;
}
