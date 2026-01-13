import { useNavigate } from "react-router-dom";
import { Plus, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useOccurrenceStats } from "@/hooks/useOccurrences";
import { Button } from "@/components/ui/button";

export default function Index() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useOccurrenceStats();

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Painel de Ação
          </h1>
          <p className="mt-2 text-muted-foreground">
            Registre e acompanhe ocorrências para garantir a qualidade e
            segurança dos processos da clínica.
          </p>
        </div>

        {/* Botão de Nova Ocorrência */}
        <section className="mb-10">
          <Button
            onClick={() => navigate("/ocorrencias/nova")}
            size="lg"
            className="w-full h-16 text-lg gap-3"
          >
            <Plus className="h-6 w-6" />
            Registrar Nova Ocorrência
          </Button>
        </section>

        {/* Quick Stats */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Resumo Rápido
          </h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-foreground">{stats?.pendentes || 0}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-foreground">{stats?.emAnalise || 0}</p>
                <p className="text-xs text-muted-foreground">Em análise</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-foreground">{stats?.esteMes || 0}</p>
                <p className="text-xs text-muted-foreground">Este mês</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-foreground">
                  {stats?.total ? Math.round((stats.concluidas / stats.total) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Resolvidas</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
