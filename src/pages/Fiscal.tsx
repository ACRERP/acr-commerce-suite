import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Receipt, Calculator, FileCheck, AlertTriangle } from "lucide-react";

const recentNotes = [
  { id: "NF-001234", client: "Tech Corp Ltda", value: 15680, status: "autorizada", date: "15/01/2024" },
  { id: "NF-001233", client: "João Silva MEI", value: 890, status: "autorizada", date: "15/01/2024" },
  { id: "NF-001232", client: "Comercial ABC", value: 32450, status: "cancelada", date: "14/01/2024" },
  { id: "NF-001231", client: "Maria Santos", value: 1250, status: "autorizada", date: "14/01/2024" },
];

const statusConfig = {
  autorizada: { label: "Autorizada", color: "success" },
  cancelada: { label: "Cancelada", color: "destructive" },
  pendente: { label: "Pendente", color: "warning" },
};

const Fiscal = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Fiscal</h1>
            <p className="text-muted-foreground mt-1">
              Gestão fiscal e tributária
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Emitir NF-e
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "NF-e Emitidas", desc: "Este mês", value: "248", icon: FileText, color: "primary" },
            { title: "NFC-e Emitidas", desc: "Este mês", value: "1.892", icon: Receipt, color: "accent" },
            { title: "Impostos a Pagar", desc: "Vencendo", value: "R$ 12.450", icon: Calculator, color: "warning" },
            { title: "SPED", desc: "Pendente", value: "2", icon: FileCheck, color: "destructive" },
          ].map((item, index) => (
            <div
              key={item.title}
              className="stat-card animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                  <p className="metric-value mt-2">{item.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-${item.color}/10 flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 text-${item.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 stat-card">
            <h3 className="section-title mb-4">Notas Fiscais Recentes</h3>
            <div className="space-y-3">
              {recentNotes.map((note, index) => {
                const status = statusConfig[note.status as keyof typeof statusConfig];
                return (
                  <div
                    key={note.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{note.id}</p>
                        <p className="text-sm text-muted-foreground">{note.client}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(note.value)}
                        </p>
                        <p className="text-xs text-muted-foreground">{note.date}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full bg-${status.color}/10 text-${status.color} text-xs font-medium`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="stat-card">
            <h3 className="section-title mb-4">Obrigações Acessórias</h3>
            <div className="space-y-3">
              {[
                { name: "SPED Fiscal", due: "20/01/2024", status: "pendente" },
                { name: "SPED Contábil", due: "31/01/2024", status: "ok" },
                { name: "EFD Contribuições", due: "15/02/2024", status: "ok" },
                { name: "DCTF", due: "15/02/2024", status: "ok" },
              ].map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between py-2 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Vence: {item.due}</p>
                  </div>
                  {item.status === "pendente" ? (
                    <span className="flex items-center gap-1 text-warning text-xs font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      Pendente
                    </span>
                  ) : (
                    <span className="text-success text-xs font-medium">OK</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Fiscal;
