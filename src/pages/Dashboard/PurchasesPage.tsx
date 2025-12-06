import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PurchasesPage() {
    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Compras</h2>
                        <p className="text-muted-foreground">Gerencie suas compras e fornecedores</p>
                    </div>
                    <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" /> Nova Compra
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Histórico de Compras</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                            Nenhuma compra registrada.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
