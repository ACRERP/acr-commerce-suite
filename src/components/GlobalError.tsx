import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalError extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950">
                    <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-900/30">
                            <span className="text-4xl font-bold text-red-600">!</span>
                        </div>
                        <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-50 mb-4 tracking-tight">Oops! Detectamos algo irregular.</h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
                            Ocorreu um erro inesperado na interface. Nossa equipe foi notificada automaticamente para o polimento final.
                        </p>

                        {this.state.error && (
                            <div className="mb-8 text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Detalhes de Diagnóstico</p>
                                <pre className="bg-neutral-50 dark:bg-black/40 p-5 rounded-2xl text-[11px] font-mono text-neutral-500 dark:text-neutral-400 overflow-auto border border-neutral-200 dark:border-neutral-800 max-h-40">
                                    {this.state.error.stack || this.state.error.message}
                                </pre>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full h-14 text-lg font-bold rounded-xl shadow-lg bg-neutral-900 dark:bg-white dark:text-neutral-900 hover:scale-[1.02] transition-transform"
                            >
                                Restaurar Experiência
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => window.location.href = '/'}
                                className="w-full text-neutral-500 font-bold"
                            >
                                Voltar ao Início
                            </Button>
                        </div>
                    </div>
                    <p className="absolute bottom-10 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">ACR Commerce Suite • Error Layer</p>
                </div>
            );
        }

        return this.props.children;
    }
}
