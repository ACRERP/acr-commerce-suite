import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <h1 className="text-6xl font-bold text-foreground">404</h1>
      <p className="text-xl text-muted-foreground mt-4">Página não encontrada</p>
      <Button asChild className="mt-6">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}
