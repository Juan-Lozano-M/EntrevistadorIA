import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight, ClipboardList, MessageSquare, Plus } from "lucide-react";
import { useHistory } from "@/features/interview/queries";
import { scoreBand } from "@/lib/dimensions";
import { levelLabel, typeLabel } from "@/lib/labels";
import { type SessionSummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const bandPill: Record<string, string> = {
  low: "bg-destructive/10 text-destructive",
  mid: "bg-gold/15 text-gold",
  high: "bg-green-500/15 text-green-600 dark:text-green-400",
};

const PAGE_SIZE = 8;

export function InterviewsPage() {
  const { data: sessions, isLoading } = useHistory();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil((sessions?.length ?? 0) / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = (sessions ?? []).slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Entrevistas</h1>
          <p className="mt-1 text-muted-foreground">Tu historial de simulaciones.</p>
        </div>
        <Button asChild><Link to="/new"><Plus className="h-4 w-4" /> Nueva entrevista</Link></Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
      )}

      {!isLoading && sessions && sessions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <Plus className="h-6 w-6" />
            </span>
            <p className="text-muted-foreground">Aún no tienes entrevistas. ¡Empieza la primera!</p>
            <Button asChild><Link to="/new">Nueva entrevista</Link></Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && sessions && sessions.length > 0 && (
        <div className="space-y-3">
          {totalPages > 1 && (
            <p className="text-right text-xs text-muted-foreground">Página {currentPage} de {totalPages}</p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {pageItems.map((s) => <SessionCard key={s.id} session={s} />)}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-3">
              <Button variant="outline" size="icon" className="h-9 w-9"
                onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} aria-label="Página anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="hidden items-center gap-1.5 sm:flex">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button key={p} variant={p === currentPage ? "default" : "outline"} size="icon"
                    className="h-9 w-9 font-mono tabular" onClick={() => setPage(p)}>{p}</Button>
                ))}
              </div>
              <span className="px-1 font-mono text-sm tabular text-muted-foreground sm:hidden">{currentPage} / {totalPages}</span>
              <Button variant="outline" size="icon" className="h-9 w-9"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} aria-label="Página siguiente">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session: s }: { session: SessionSummary }) {
  const finished = s.overallScore != null;
  const isChat = s.modality === "CHAT";
  const to = finished ? `/results/${s.id}` : isChat ? `/chat/${s.id}` : `/interview/${s.id}`;
  const ModalityIcon = isChat ? MessageSquare : ClipboardList;
  return (
    <Link to={to} className="group">
      <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
        <CardContent className="flex h-full items-center gap-3 py-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
            <ModalityIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-semibold">{s.roleTitle}</p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {levelLabel(s.level)} · {typeLabel(s.type)}{isChat ? " · Chat IA" : ""}
            </p>
          </div>
          {finished ? (
            <span className={cn("shrink-0 rounded-full px-3 py-1 font-mono text-lg font-semibold tabular", bandPill[scoreBand(s.overallScore!)])}>
              {s.overallScore}
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
              En progreso <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
