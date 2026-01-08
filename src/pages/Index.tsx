import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">ACR Store</h1>
        <p className="text-lg text-muted-foreground">
          Sistema ERP completo para gestão empresarial
        </p>
        <Button asChild>
          <Link to="/login">Entrar</Link>
        </Button>
      </div>
    </div>
  );
}
