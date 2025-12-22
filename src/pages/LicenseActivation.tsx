import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LicenseService } from '@/lib/licensing/license-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, Loader2, CheckCircle, XCircle, Shield, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LicenseActivation() {
    const navigate = useNavigate();
    const [licenseKey, setLicenseKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // Verificar se já tem licença válida
        checkExistingLicense();
    }, []);

    const checkExistingLicense = async () => {
        const hasLicense = await LicenseService.checkLocalLicense();
        if (hasLicense) {
            navigate('/dashboard');
        } else {
            setChecking(false);
        }
    };

    const handleActivate = async () => {
        const formatted = LicenseService.formatLicenseKey(licenseKey);

        if (formatted.length !== 19) { // XXXX-XXXX-XXXX-XXXX = 19 caracteres
            setResult({
                success: false,
                message: 'Chave de licença inválida. Formato esperado: XXXX-XXXX-XXXX-XXXX'
            });
            return;
        }

        setLoading(true);
        setResult(null);

        const validation = await LicenseService.validateLicense(formatted);

        setLoading(false);
        setResult({
            success: validation.valid,
            message: validation.message,
        });

        if (validation.valid) {
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            handleActivate();
        }
    };

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
            {/* Background decorativo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative max-w-md w-full"
            >
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                            className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                        >
                            <Key className="w-10 h-10 text-white" />
                        </motion.div>

                        <h1 className="text-3xl font-black text-gray-900 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Ativar ACR ERP
                        </h1>
                        <p className="text-gray-600">
                            Digite sua chave de licença para começar
                        </p>
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Chave de Licença
                            </label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                    value={licenseKey}
                                    onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                                    onKeyPress={handleKeyPress}
                                    className="text-center text-lg font-mono tracking-wider h-14 border-2 focus:border-indigo-500 transition-all"
                                    disabled={loading}
                                    maxLength={19}
                                />
                                <Shield className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Formato: XXXX-XXXX-XXXX-XXXX
                            </p>
                        </div>

                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <Alert
                                        variant={result.success ? 'default' : 'destructive'}
                                        className={result.success ? 'border-green-500 bg-green-50' : ''}
                                    >
                                        <div className="flex items-center gap-2">
                                            {result.success ? (
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <XCircle className="w-5 h-5" />
                                            )}
                                            <AlertDescription className={result.success ? 'text-green-800' : ''}>
                                                {result.message}
                                            </AlertDescription>
                                        </div>
                                    </Alert>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Button
                            onClick={handleActivate}
                            disabled={loading || !licenseKey}
                            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Validando...
                                </>
                            ) : result?.success ? (
                                <>
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Ativado! Redirecionando...
                                </>
                            ) : (
                                <>
                                    <Key className="w-5 h-5 mr-2" />
                                    Ativar Licença
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-3">
                            <Sparkles className="w-4 h-4" />
                            <span>Sistema protegido por licenciamento</span>
                        </div>

                        <p className="text-xs text-center text-gray-500">
                            Comprou no <strong>Mercado Livre</strong> ou <strong>Shopee</strong>?<br />
                            Verifique seu e-mail para a chave de licença.
                        </p>

                        <p className="text-xs text-center text-gray-400 mt-3">
                            Problemas? Entre em contato: <strong>suporte@acrerp.com</strong>
                        </p>
                    </div>
                </div>

                {/* Informações adicionais */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        © 2025 ACR Software. Todos os direitos reservados.
                    </p>
                </div>
            </motion.div>

            <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
        </div>
    );
}
