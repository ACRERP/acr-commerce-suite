import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

export default function PDV() {
  return (
    <div className="h-screen flex gap-6 p-6">
      <div className="flex-1 space-y-4">
        <h1 className="text-3xl font-bold">PDV</h1>
        <Card className="h-[calc(100%-60px)]">
          <CardContent className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Selecione produtos para adicionar ao carrinho</p>
          </CardContent>
        </Card>
      </div>
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />Carrinho
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center py-8">Carrinho vazio</p>
          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span><span>R$ 0,00</span>
            </div>
          </div>
          <Button className="w-full" size="lg" disabled>Finalizar Venda</Button>
        </CardContent>
      </Card>
    </div>
  );
}
