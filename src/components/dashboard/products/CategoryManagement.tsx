import { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, Category } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function CategoryManagement() {
    const { data: categories, isLoading } = useCategories();
    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();
    const deleteMutation = useDeleteCategory();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    const [formData, setFormData] = useState<Partial<Category>>({
        name: '',
        description: '',
        color: 'blue'
    });

    const handleOpenDialog = (category?: Category) => {
        if (category) {
            setSelectedCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                color: category.color || 'blue'
            });
        } else {
            setSelectedCategory(null);
            setFormData({ name: '', description: '', color: 'blue' });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        try {
            if (selectedCategory) {
                await updateMutation.mutateAsync({
                    ...selectedCategory,
                    name: formData.name,
                    description: formData.description,
                    color: formData.color
                } as Category);
            } else {
                await createMutation.mutateAsync({
                    name: formData.name!,
                    description: formData.description,
                    color: formData.color
                } as Category);
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteClick = (category: Category) => {
        setSelectedCategory(category);
        setIsAlertOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (selectedCategory) {
            await deleteMutation.mutateAsync(selectedCategory.id);
            setIsAlertOpen(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Categorias</h3>
                    <p className="text-sm text-muted-foreground">Gerencie as categorias dos seus produtos.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Categoria
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Cor</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    Nenhuma categoria encontrada.
                                </TableCell>
                            </TableRow>
                        )}
                        {categories?.map((category) => (
                            <TableRow key={category.id}>
                                <TableCell className="font-medium">{category.name}</TableCell>
                                <TableCell>{category.description || '-'}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color || 'gray' }}></div>
                                        <span className="text-xs text-muted-foreground">{category.color}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(category)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteClick(category)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="color">Cor (Hex ou Nome)</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    className="w-12 p-1 h-10"
                                    value={formData.color === 'blue' ? '#0000ff' : formData.color} // Fallback simple value mapping if needed, or just let user pick
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                />
                                <Input
                                    id="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    placeholder="ex: blue, #ff0000"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Categoria?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir esta categoria? Produtos associados podem ficar sem categoria.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
