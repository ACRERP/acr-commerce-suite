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
                <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
                    <h1 className="text-4xl font-bold mb-4">Oops!</h1>
                    <p className="text-xl text-muted-foreground mb-8">
                        Algo deu errado. Por favor, recarregue a página.
                    </p>
                    {this.state.error && (
                        <pre className="bg-muted p-4 rounded text-xs mb-8 max-w-lg overflow-auto text-left">
                            {this.state.error.message}
                        </pre>
                    )}
                    <Button onClick={() => window.location.reload()}>
                        Recarregar Página
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
