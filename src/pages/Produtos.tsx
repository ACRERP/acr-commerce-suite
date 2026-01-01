import React, { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Box,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Package,
  TrendingUp,
  AlertTriangle,
  Download,
  Upload,
  Tag,
  Loader2,
  Trash2,
  Wand2,
  Layers,
  Hash,
  Check,
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/ProductService";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
// import { FeatureGuard } from "@/components/auth/FeatureGuard"; // Commented out - component doesn't exist
import { QuickActionPopover } from "@/components/products/QuickActionPopover";
import { ImportProductsDialog } from "@/components/products/ImportProductsDialog";

interface ProductVariation {
  color: string;
  size: string;
}

interface BatchInfo {
  number: string;
  expiry: string;
  quantity: string;
}

const Produtos = () => {
  const queryClient = useQueryClient();
  const { products, isLoading } = useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",
    cost: "",
    stock: "",
    description: "",
    min_stock: "5",
    // ACR Paridade Advanced Fields
    wholesale_price: "",
    term_price: "",
    markup: "",
    margin: "",
    warranty: "",
    reference: "",
    commission_percentage: "",
    location: "",
    brand: ""
  });

  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [newVariation, setNewVariation] = useState<ProductVariation>({ color: "", size: "" });
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [newBatch, setNewBatch] = useState<BatchInfo>({ number: "", expiry: "", quantity: "" });
  const [generatedCode, setGeneratedCode] = useState("");

  const createProductMutation = useMutation({
    mutationFn: (data: any) => productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto cadastrado com sucesso!");
      setIsModalOpen(false);
      setFormData({
        name: "", sku: "", price: "", cost: "", stock: "", description: "", min_stock: "5",
        wholesale_price: "", term_price: "", markup: "", margin: "", warranty: "", reference: "",
        commission_percentage: "", location: "", brand: ""
      });
      setVariations([]);
      setBatches([]);
      setGeneratedCode("");
    },
    onError: () => {
      toast.error("Erro ao cadastrar produto.");
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto excluído com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir produto.");
    },
  });

  const handleGenerateCode = () => {
    const code = `PROD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setGeneratedCode(code);
    setFormData(prev => ({ ...prev, sku: code }));
    toast.info("Código SKU gerado automaticamente.");
  };

  const handleExport = () => {
    const dataToExport = products.map(p => ({
      Nome: p.name,
      SKU: p.sku || p.code,
      Preço: p.sale_price,
      Custo: p.cost_price,
      Estoque: p.stock_quantity,
      Categoria: p.category || 'Geral'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");
    XLSX.writeFile(wb, "produtos_export.xlsx");
    toast.success("Catálogo exportado com sucesso!");
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error("O nome do produto é obrigatório.");
      return;
    }

    const payload = {
      name: formData.name,
      code: formData.sku || generatedCode || `SKU-${Date.now()}`,
      sku: formData.sku,
      description: formData.description,
      unit: 'UN',
      stock_quantity: Number(formData.stock) || 0,
      minimum_stock_level: Number(formData.min_stock) || 5,
      sale_price: Number(formData.price) || 0,
      cost_price: Number(formData.cost) || 0,
      // Advanced Fields (ACR Paridade)
      wholesale_price: Number(formData.wholesale_price) || 0,
      term_price: Number(formData.term_price) || 0,
      markup: Number(formData.markup) || 0,
      margin: Number(formData.margin) || 0,
      warranty: formData.warranty,
      reference: formData.reference,
      commission_percentage: Number(formData.commission_percentage) || 0,
      location: formData.location,
      brand: formData.brand,
      variations: variations.map(v => ({
        name: `${formData.name} - ${v.color} ${v.size}`.trim(),
        sku: `${formData.sku || 'SKU'}-${v.color}-${v.size}`,
        stock_quantity: 0,
        attributes: { color: v.color, size: v.size }
      }))
    };

    createProductMutation.mutate(payload);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      deleteProductMutation.mutate(id);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      name: "", sku: "", price: "", cost: "", stock: "", description: "", min_stock: "5",
      wholesale_price: "", term_price: "", markup: "", margin: "", warranty: "", reference: "",
      commission_percentage: "", location: "", brand: ""
    });
    setVariations([]);
    setBatches([]);
    setIsModalOpen(true);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (product.code?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (product.category?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <MainLayout>
      <div className="w-full max-w-[95%] mx-auto px-4 py-8 space-y-8">

        <ImportProductsDialog
          open={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
        />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
              Catálogo de Produtos
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Gestão de inventário, preços e organização
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="btn-secondary gap-2 hover-lift" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="w-4 h-4" />
              Importar
            </Button>
            <Button variant="outline" className="btn-secondary gap-2 hover-lift" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <Button
              className="btn-primary hover-lift gap-2 shadow-lg shadow-primary-500/20"
              onClick={handleOpenModal}
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Total de SKUs</p>
                <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  {isLoading ? <Loader2 className="animate-spin" /> : products.length}
                </h3>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                <Box className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 dark:bg-orange-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Estoque Baixo</p>
                <h3 className="text-3xl font-bold text-orange-600">
                  {isLoading ? "..." : products.filter(p => p.stock_quantity <= (p.minimum_stock_level || 5)).length}
                </h3>
                <p className="text-xs text-orange-600/80 mt-1 font-medium">Requer reposição</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-xl group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 dark:bg-green-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Valor do Estoque</p>
                <h3 className="text-3xl font-bold text-green-600">
                  {isLoading ? "..." : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(products.reduce((acc, p) => acc + ((p.sale_price || 0) * (p.stock_quantity || 0)), 0))}
                </h3>
                <p className="text-xs text-green-600/80 mt-1 font-medium">Preço de Venda</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card-premium p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-[600px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Buscar por nome, SKU, categoria..."
                className="pl-10 h-10 bg-neutral-50 border-neutral-200 focus:bg-white transition-all hover:bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" className="flex-1 md:flex-none hover:bg-neutral-50">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Pagination Info */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-neutral-500 px-2 my-2">
          <div className="flex items-center gap-4">
            <span className="ml-2">Total: <strong className="text-neutral-900 dark:text-white">{filteredProducts.length}</strong> produtos</span>
            <div className="flex items-center gap-2 border-l border-neutral-200 dark:border-neutral-700 pl-4">
              <span>Exibir</span>
              <select
                className="h-8 w-16 rounded-md border border-neutral-200 bg-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mr-2">
            <span>Página {currentPage} de {totalPages || 1}</span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= totalPages}
                className="h-8"
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>

        {/* Products Table Card */}
        <div className="card-premium p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                  <th className="text-left py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Produto</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">SKU</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Categoria</th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Estoque</th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Preço Venda</th>
                  <th className="text-center py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Ações Rápidas</th>
                  <th className="text-center py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="w-10 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-neutral-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      Carregando produtos...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-neutral-500">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition-colors duration-300">
                            {product.category === 'Celulares' || product.category === 'Tablets' ? <Package className="w-6 h-6" /> : <Box className="w-6 h-6" />}
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">{product.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-neutral-500 font-mono tracking-wide">{product.sku || product.code}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-neutral-400" />
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">{product.category || 'Geral'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`font-bold inline-flex items-center px-2 py-0.5 rounded text-sm ${product.stock_quantity === 0 ? 'bg-red-50 text-red-600' :
                          product.stock_quantity < (product.minimum_stock_level || 5) ? 'bg-orange-50 text-orange-600' :
                            'text-neutral-700'
                          }`}>
                          {product.stock_quantity} un
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-neutral-900 dark:text-neutral-100 text-base">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(product.sale_price || 0)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <QuickActionPopover product={product} />
                      </td>
                      <td className="py-4 px-6 text-center">
                        {product.stock_quantity === 0 ? (
                          <Badge variant="destructive" className="shadow-none">Esgotado</Badge>
                        ) : product.stock_quantity < (product.minimum_stock_level || 5) ? (
                          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0 shadow-none">Baixo</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0 shadow-none">Ativo</Badge>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => navigator.clipboard.writeText(product.sku || product.code)}
                            >
                              Copiar SKU
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Editar Produto</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(product.id)}
                            >
                              Excluir Produto
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* New Product Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2rem] border-0 shadow-2xl glass-window glass-window-compact !p-0">
            <DialogHeader className="p-5 bg-gradient-to-r from-neutral-800/80 to-neutral-900/80 text-white backdrop-blur-md border-b border-white/10">
              <DialogTitle className="flex items-center gap-2 text-lg font-black">
                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Box className="w-4 h-4 text-white" />
                </div>
                Novo Produto
              </DialogTitle>
              <p className="text-white/50 text-[10px] font-black uppercase tracking-[2px] mt-0.5">Cadastre itens para o catálogo oficial</p>
            </DialogHeader>

            <div className="max-h-[75vh] overflow-y-auto bg-white/5 backdrop-blur-sm">
              <Tabs defaultValue="geral" className="w-full">
                <TabsList className="w-full justify-start rounded-none bg-black/20 border-b border-white/5 h-12 px-6">
                  <TabsTrigger value="geral" className="data-[state=active]:bg-white/10 text-[10px] font-black uppercase tracking-widest">Geral</TabsTrigger>
                  <TabsTrigger value="precos" className="data-[state=active]:bg-white/10 text-[10px] font-black uppercase tracking-widest">Preços & Margens</TabsTrigger>
                  <TabsTrigger value="detalhes" className="data-[state=active]:bg-white/10 text-[10px] font-black uppercase tracking-widest">Detalhes Técnicos</TabsTrigger>
                  <TabsTrigger value="variantes" className="data-[state=active]:bg-white/10 text-[10px] font-black uppercase tracking-widest">Grade & Lotes</TabsTrigger>
                </TabsList>

                <div className="p-6 space-y-6">
                  <TabsContent value="geral" className="mt-0 space-y-6">
                    <div className="grid grid-cols-12 gap-6">
                      {/* Image Placeholder */}
                      <div className="col-span-12 md:col-span-3">
                        <div className="border-2 border-dashed border-white/10 rounded-2xl aspect-square flex flex-col items-center justify-center bg-black/20 hover:bg-black/30 transition-all cursor-pointer group backdrop-blur-md overflow-hidden relative">
                          <div className="p-3 rounded-full bg-white/5 shadow-sm mb-2 group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5 text-white/40" />
                          </div>
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Imagem</p>
                          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                        </div>
                      </div>

                      {/* Main Details */}
                      <div className="col-span-12 md:col-span-9 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 space-y-1">
                            <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Nome do Produto</Label>
                            <Input
                              placeholder="Ex: Smartphone Samsung Galaxy..."
                              className="h-10 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:bg-black/40 transition-all input-compact font-bold"
                              value={formData.name}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                          </div>
                          <div className="col-span-1 space-y-1">
                            <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">SKU/EAN</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Gerar..."
                                className="h-10 bg-black/20 border-white/10 text-white placeholder:text-white/20 font-mono text-[11px] input-compact"
                                value={formData.sku}
                                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-10 w-10 shrink-0 bg-white/5 border-white/10 hover:bg-white/10 text-white"
                                onClick={handleGenerateCode}
                              >
                                <Wand2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="col-span-1 space-y-1">
                            <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Estoque Inicial</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              className="h-10 bg-black/20 border-white/10 text-white placeholder:text-white/20 input-compact font-bold"
                              value={formData.stock}
                              onChange={e => setFormData({ ...formData, stock: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Descrição Breve</Label>
                      <Textarea
                        placeholder="..."
                        className="min-h-[80px] bg-black/20 border-white/10 text-white placeholder:text-white/20 text-xs rounded-xl focus:bg-black/40 transition-all font-medium"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="precos" className="mt-0 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Preço de Venda (Principal)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[10px] font-black">R$</span>
                          <Input
                            type="number"
                            className="h-11 pl-8 bg-black/20 border-white/10 text-white font-bold text-lg"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Preço de Custo</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[10px] font-black">R$</span>
                          <Input
                            type="number"
                            className="h-11 pl-8 bg-black/20 border-white/10 text-white font-bold"
                            value={formData.cost}
                            onChange={e => setFormData({ ...formData, cost: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Preço Atacado</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[10px] font-black">R$</span>
                          <Input
                            type="number"
                            className="h-10 pl-8 bg-black/20 border-white/10 text-white"
                            value={formData.wholesale_price}
                            onChange={e => setFormData({ ...formData, wholesale_price: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Preço a Prazo</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[10px] font-black">R$</span>
                          <Input
                            type="number"
                            className="h-10 pl-8 bg-black/20 border-white/10 text-white"
                            value={formData.term_price}
                            onChange={e => setFormData({ ...formData, term_price: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Markup (%)</Label>
                        <Input
                          type="number"
                          className="h-10 bg-black/20 border-white/10 text-white"
                          value={formData.markup}
                          onChange={e => setFormData({ ...formData, markup: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Margem Real (%)</Label>
                        <Input
                          type="number"
                          className="h-10 bg-black/20 border-white/10 text-white"
                          value={formData.margin}
                          onChange={e => setFormData({ ...formData, margin: e.target.value })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="detalhes" className="mt-0 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Marca / Fabricante</Label>
                        <Input
                          className="h-10 bg-black/20 border-white/10 text-white"
                          value={formData.brand}
                          onChange={e => setFormData({ ...formData, brand: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Referência</Label>
                        <Input
                          className="h-10 bg-black/20 border-white/10 text-white"
                          value={formData.reference}
                          onChange={e => setFormData({ ...formData, reference: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Garantia (Ex: 12 meses)</Label>
                        <Input
                          className="h-10 bg-black/20 border-white/10 text-white"
                          value={formData.warranty}
                          onChange={e => setFormData({ ...formData, warranty: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Localização no Estoque</Label>
                        <Input
                          placeholder="Ex: Corredor A, Prateleira 2"
                          className="h-10 bg-black/20 border-white/10 text-white"
                          value={formData.location}
                          onChange={e => setFormData({ ...formData, location: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Comissão (%)</Label>
                        <Input
                          type="number"
                          className="h-10 bg-black/20 border-white/10 text-white"
                          value={formData.commission_percentage}
                          onChange={e => setFormData({ ...formData, commission_percentage: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Estoque Mínimo</Label>
                        <Input
                          type="number"
                          className="h-10 bg-black/20 border-white/10 text-white"
                          value={formData.min_stock}
                          onChange={e => setFormData({ ...formData, min_stock: e.target.value })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="variantes" className="mt-0 space-y-6">
                    {/* <FeatureGuard feature={['variants_grid', 'color_variation']}> */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-white/60">
                        <Layers className="w-4 h-4" />
                        <h4 className="font-black uppercase text-[10px] tracking-widest">Grade de Variantes</h4>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            placeholder="Cor"
                            className="h-9 bg-black/20 border-white/10 text-white text-xs"
                            value={newVariation.color}
                            onChange={e => setNewVariation({ ...newVariation, color: e.target.value })}
                          />
                          <Input
                            placeholder="Tam"
                            className="h-9 bg-black/20 border-white/10 text-white text-xs"
                            value={newVariation.size}
                            onChange={e => setNewVariation({ ...newVariation, size: e.target.value })}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 bg-white/10 border-white/10 text-white hover:bg-white/20"
                            onClick={() => {
                              if (newVariation.color || newVariation.size) {
                                setVariations([...variations, newVariation]);
                                setNewVariation({ color: "", size: "" });
                              }
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        {variations.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {variations.map((v, i) => (
                              <Badge key={i} variant="secondary" className="flex gap-1 items-center px-2 py-1 bg-white/10 text-white border-white/5">
                                {v.color} {v.size}
                                <Trash2
                                  className="w-3 h-3 cursor-pointer hover:text-red-400"
                                  onClick={() => setVariations(variations.filter((_, idx) => idx !== i))}
                                />
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* </FeatureGuard> */}

                    {/* <FeatureGuard feature="batch_control"> */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2 text-white/60">
                        <Hash className="w-4 h-4" />
                        <h4 className="font-black uppercase text-[10px] tracking-widest">Controle de Lotes</h4>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-white/30 uppercase">Nº do Lote</Label>
                            <Input
                              placeholder="LOTE123X"
                              className="bg-black/20 h-9 border-white/10 text-white text-xs"
                              value={newBatch.number}
                              onChange={e => setNewBatch({ ...newBatch, number: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-white/30 uppercase">Validade</Label>
                            <Input
                              type="date"
                              className="bg-black/20 h-9 border-white/10 text-white text-xs"
                              value={newBatch.expiry}
                              onChange={e => setNewBatch({ ...newBatch, expiry: e.target.value })}
                            />
                          </div>
                          <div className="col-span-2 flex gap-2">
                            <Input
                              placeholder="Qtd"
                              type="number"
                              className="bg-black/20 h-9 w-20 border-white/10 text-white text-xs"
                              value={newBatch.quantity}
                              onChange={e => setNewBatch({ ...newBatch, quantity: e.target.value })}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 flex-1 bg-white/10 border-white/10 text-white hover:bg-white/20"
                              onClick={() => {
                                if (newBatch.number && newBatch.expiry) {
                                  setBatches([...batches, newBatch]);
                                  setNewBatch({ number: "", expiry: "", quantity: "" });
                                }
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Registrar Lote
                            </Button>
                          </div>
                        </div>
                        {batches.length > 0 && (
                          <div className="space-y-2 mt-2">
                            {batches.map((b, i) => (
                              <div key={i} className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5 text-[10px] text-white/70">
                                <span>Lote: <strong>{b.number}</strong> (Val: {b.expiry})</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px] border-white/10">{b.quantity} un</Badge>
                                  <Trash2
                                    className="w-3 h-3 cursor-pointer hover:text-red-400"
                                    onClick={() => setBatches(batches.filter((_, idx) => idx !== i))}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* </FeatureGuard> */}
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            <DialogFooter className="p-6 bg-neutral-900 border-t border-white/10 flex items-center justify-between">
              <div className="hidden md:flex flex-col">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Pronto para salvar?</p>
                <p className="text-white/20 text-[9px]">Verifique os dados nas abas.</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="text-white/40 hover:text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest px-6"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-white text-black hover:bg-neutral-200 text-[10px] font-black uppercase tracking-[2px] px-8 h-11 shadow-2xl shadow-white/10"
                  onClick={handleSave}
                  disabled={createProductMutation.isPending}
                >
                  {createProductMutation.isPending ? "Salvando..." : "Confirmar & Salvar"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog >
      </div >
    </MainLayout >
  );
};

export default Produtos;
